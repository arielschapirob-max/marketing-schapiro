import 'server-only';
import { createHash } from 'crypto';
import { db } from '@/lib/db';
import { saveFile } from '@/modules/document-processing/storage';
import { runPersonalizedQuestionnaireGeneration } from '@/modules/ai-engine';
import { buildPersonalizedQuestionnaireDocx } from './personalized-questionnaire-docx';
import { logAuditEvent } from '@/modules/audit';

const MAX_TRANSCRIPT_EXCERPT_CHARS = 6000;
const MAX_FINDING_SUMMARIES = 60;

/**
 * Genera el cuestionario personalizado de un diagnóstico (redactado a medida
 * para envío directo al cliente, ver ai-engine/providers), lo exporta a
 * .docx y deja registro en `Export` (kind: CUESTIONARIO_PERSONALIZADO) con
 * su propia auditoría, reutilizando la misma ruta segura de descarga que el
 * resto de las exportaciones (`/api/exports/[id]`).
 */
export async function generatePersonalizedQuestionnaireExport(diagnosisId: string, generatedById: string) {
  const diagnosis = await db.diagnosis.findUniqueOrThrow({
    where: { id: diagnosisId },
    include: {
      organization: true,
      transcripts: true,
      webAnalyses: { include: { findings: true } },
      findings: true,
      diagnosisSectors: { include: { sector: true } },
    },
  });

  const transcriptExcerpts = diagnosis.transcripts.map((t) => t.rawText.slice(0, MAX_TRANSCRIPT_EXCERPT_CHARS));

  const webFindingSummaries = diagnosis.webAnalyses
    .flatMap((wa) => wa.findings)
    .slice(0, MAX_FINDING_SUMMARIES)
    .map((f) => `[${f.type}] ${f.description} (evidencia: ${f.evidence})`);

  const existingFindingSummaries = diagnosis.findings.slice(0, MAX_FINDING_SUMMARIES).map((f) => `[${f.type}] ${f.description}`);

  const sectorNames = diagnosis.diagnosisSectors.map((ds) => ds.sector.key);

  const output = await runPersonalizedQuestionnaireGeneration(
    {
      organizationContext: {
        legalName: diagnosis.organization.legalName,
        commercialName: diagnosis.organization.commercialName,
        website: diagnosis.organization.website,
        contactName: diagnosis.organization.representative,
      },
      transcriptExcerpts,
      webFindingSummaries,
      existingFindingSummaries,
      sectorNames,
    },
    { diagnosisId, executedById: generatedById },
  );

  const buffer = await buildPersonalizedQuestionnaireDocx({
    organizationLegalName: diagnosis.organization.legalName,
    organizationCommercialName: diagnosis.organization.commercialName,
    organizationTagline: diagnosis.organization.economicActivity[0] ?? null,
    organizationWebsite: diagnosis.organization.website,
    output,
  });

  const stored = await saveFile(buffer, '.docx');
  const checksumSha256 = createHash('sha256').update(buffer).digest('hex');

  const exportRecord = await db.export.create({
    data: {
      diagnosisId,
      format: 'DOCX',
      kind: 'CUESTIONARIO_PERSONALIZADO',
      generatedById,
      storageKey: stored.storageKey,
      checksumSha256,
    },
  });

  await logAuditEvent({
    userId: generatedById,
    diagnosisId,
    organizationId: diagnosis.organizationId,
    action: 'EXPORT_GENERATED',
    entityType: 'Export',
    entityId: exportRecord.id,
    metadata: { format: 'DOCX', kind: 'CUESTIONARIO_PERSONALIZADO' },
  });

  return exportRecord;
}
