'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireUser, requireOrgRole } from '@/lib/auth';
import { logAuditEvent } from '@/modules/audit';
import { runFullAnalysis } from '@/server/diagnosis-orchestrator';
import { generateQuestionnaire } from '@/modules/question-engine/engine';
import { runReview } from '@/modules/review-engine/engine';
import { generateExport } from '@/modules/export';
import { uploadAndProcessFile, FileValidationError } from '@/modules/document-processing/pipeline';
import type { ActionState } from './auth';
import type { ExportFormat, RuleRegime } from '@prisma/client';

const diagnosisSchema = z.object({
  organizationId: z.string().min(1),
  title: z.string().min(2, 'Ingrese un título para el diagnóstico'),
  regimeMode: z.enum(['VIGENTE', 'FUTURO', 'TRANSICION']),
});

export async function createDiagnosisAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = diagnosisSchema.safeParse({
    organizationId: formData.get('organizationId'),
    title: formData.get('title'),
    regimeMode: formData.get('regimeMode') ?? 'VIGENTE',
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  await requireOrgRole(user.id, parsed.data.organizationId, 'LAWYER');

  const diagnosis = await db.diagnosis.create({
    data: {
      organizationId: parsed.data.organizationId,
      title: parsed.data.title,
      regimeMode: parsed.data.regimeMode as RuleRegime,
      createdById: user.id,
    },
  });

  await logAuditEvent({ userId: user.id, organizationId: parsed.data.organizationId, diagnosisId: diagnosis.id, action: 'DIAGNOSIS_CREATED', entityType: 'Diagnosis', entityId: diagnosis.id });
  revalidatePath(`/organizaciones/${parsed.data.organizationId}`);
  redirect(`/diagnosticos/${diagnosis.id}/carga`);
}

export async function submitTranscriptAction(diagnosisId: string, text: string): Promise<void> {
  const user = await requireUser();
  const diagnosis = await db.diagnosis.findUniqueOrThrow({ where: { id: diagnosisId } });
  await requireOrgRole(user.id, diagnosis.organizationId, 'LAWYER');

  if (!text.trim()) throw new Error('La transcripción no puede estar vacía.');

  await db.meetingTranscript.create({ data: { diagnosisId, rawText: text } });
  await db.diagnosis.update({ where: { id: diagnosisId }, data: { status: 'FILES_UPLOADED' } });
  await logAuditEvent({ userId: user.id, diagnosisId, organizationId: diagnosis.organizationId, action: 'TRANSCRIPT_SUBMITTED', entityType: 'MeetingTranscript' });
  revalidatePath(`/diagnosticos/${diagnosisId}/carga`);
}

export async function createWebAnalysisAction(diagnosisId: string, url: string): Promise<{ error?: string }> {
  const user = await requireUser();
  const diagnosis = await db.diagnosis.findUniqueOrThrow({ where: { id: diagnosisId } });
  await requireOrgRole(user.id, diagnosis.organizationId, 'LAWYER');

  try {
    new URL(url);
  } catch {
    return { error: 'URL inválida.' };
  }

  await db.webAnalysis.create({ data: { diagnosisId, url } });
  await logAuditEvent({ userId: user.id, diagnosisId, organizationId: diagnosis.organizationId, action: 'WEB_ANALYSIS_QUEUED', entityType: 'WebAnalysis', metadata: { url } });
  revalidatePath(`/diagnosticos/${diagnosisId}/carga`);
  return {};
}

export async function uploadDiagnosisFileAction(diagnosisId: string, formData: FormData): Promise<{ error?: string }> {
  const user = await requireUser();
  const diagnosis = await db.diagnosis.findUniqueOrThrow({ where: { id: diagnosisId } });
  await requireOrgRole(user.id, diagnosis.organizationId, 'LAWYER');

  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) return { error: 'Seleccione un archivo.' };

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    await uploadAndProcessFile({
      diagnosisId,
      uploadedById: user.id,
      originalName: file.name,
      mimeType: file.type || 'application/octet-stream',
      buffer,
    });
  } catch (err) {
    if (err instanceof FileValidationError) return { error: err.errors.join(' ') };
    return { error: err instanceof Error ? err.message : 'Error al procesar el archivo.' };
  }

  await db.diagnosis.update({ where: { id: diagnosisId }, data: { status: 'FILES_UPLOADED' } });
  revalidatePath(`/diagnosticos/${diagnosisId}/carga`);
  return {};
}

export async function runAnalysisAction(diagnosisId: string): Promise<void> {
  const user = await requireUser();
  const diagnosis = await db.diagnosis.findUniqueOrThrow({ where: { id: diagnosisId } });
  await requireOrgRole(user.id, diagnosis.organizationId, 'LAWYER');

  await runFullAnalysis(diagnosisId, user.id);
  revalidatePath(`/diagnosticos/${diagnosisId}`);
  redirect(`/diagnosticos/${diagnosisId}/mapa`);
}

export async function generateQuestionnaireAction(diagnosisId: string): Promise<void> {
  const user = await requireUser();
  const diagnosis = await db.diagnosis.findUniqueOrThrow({ where: { id: diagnosisId } });
  await requireOrgRole(user.id, diagnosis.organizationId, 'LAWYER');

  await generateQuestionnaire(diagnosisId, user.id);
  revalidatePath(`/diagnosticos/${diagnosisId}/cuestionario`);
  redirect(`/diagnosticos/${diagnosisId}/cuestionario`);
}

export async function runReviewAction(diagnosisId: string, questionnaireId: string): Promise<void> {
  const user = await requireUser();
  const diagnosis = await db.diagnosis.findUniqueOrThrow({ where: { id: diagnosisId } });
  await requireOrgRole(user.id, diagnosis.organizationId, 'REVIEWER');

  await runReview(diagnosisId, questionnaireId, user.id);
  revalidatePath(`/diagnosticos/${diagnosisId}/revision`);
  redirect(`/diagnosticos/${diagnosisId}/revision`);
}

export async function approveQuestionnaireAction(diagnosisId: string, questionnaireId: string, notes?: string): Promise<{ error?: string }> {
  const user = await requireUser();
  const diagnosis = await db.diagnosis.findUniqueOrThrow({ where: { id: diagnosisId } });
  await requireOrgRole(user.id, diagnosis.organizationId, 'LAWYER');

  const latestReview = await db.review.findFirst({ where: { diagnosisId, questionnaireId }, orderBy: { runAt: 'desc' } });
  if (!latestReview || !latestReview.passed) {
    return { error: 'No es posible aprobar: existen bloqueos pendientes en la revisión automática. Ejecute la revisión y resuelva los bloqueos primero.' };
  }

  const { createHash } = await import('crypto');
  const signatureHash = createHash('sha256').update(`${diagnosisId}:${questionnaireId}:${user.id}:${Date.now()}`).digest('hex');

  await db.approval.create({
    data: { diagnosisId, questionnaireId, approvedById: user.id, notes, signatureHash },
  });
  await db.questionnaire.update({ where: { id: questionnaireId }, data: { status: 'APPROVED', approvedAt: new Date() } });
  await db.diagnosis.update({ where: { id: diagnosisId }, data: { status: 'APPROVED' } });

  await logAuditEvent({ userId: user.id, diagnosisId, organizationId: diagnosis.organizationId, action: 'QUESTIONNAIRE_APPROVED', entityType: 'Approval' });
  revalidatePath(`/diagnosticos/${diagnosisId}/aprobacion`);
  return {};
}

export async function generateExportAction(diagnosisId: string, format: ExportFormat): Promise<void> {
  const user = await requireUser();
  const diagnosis = await db.diagnosis.findUniqueOrThrow({ where: { id: diagnosisId } });
  await requireOrgRole(user.id, diagnosis.organizationId, 'READER');

  await generateExport(diagnosisId, format, user.id);
  revalidatePath(`/diagnosticos/${diagnosisId}/exportacion`);
}
