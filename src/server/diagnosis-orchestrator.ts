import 'server-only';
import { db } from '@/lib/db';
import { analyzeMeetingTranscript } from '@/modules/meeting-analysis/pipeline';
import { analyzeWebsite } from '@/modules/web-analysis/pipeline';
import { evaluateLegalRulesForDiagnosis } from '@/modules/legal-engine/engine';
import { logAuditEvent } from '@/modules/audit';

/**
 * Orquesta el análisis completo de un diagnóstico: procesa todas las
 * transcripciones y análisis web pendientes, y luego ejecuta el motor
 * jurídico sobre el conjunto de hallazgos resultante. Este es el único
 * punto de entrada que debe usarse antes de generar el cuestionario — nunca
 * se genera un cuestionario genérico sin haber corrido este análisis.
 */
export async function runFullAnalysis(diagnosisId: string, userId?: string) {
  const diagnosis = await db.diagnosis.findUniqueOrThrow({
    where: { id: diagnosisId },
    include: { transcripts: true, webAnalyses: true },
  });

  await db.diagnosis.update({ where: { id: diagnosisId }, data: { status: 'ANALYSIS_RUNNING' } });

  for (const transcript of diagnosis.transcripts.filter((t) => t.status === 'pending')) {
    await analyzeMeetingTranscript(transcript.id, userId);
  }

  for (const webAnalysis of diagnosis.webAnalyses.filter((w) => w.status === 'PENDING')) {
    await analyzeWebsite(webAnalysis.id, userId);
  }

  await evaluateLegalRulesForDiagnosis(diagnosisId, userId);

  await db.diagnosis.update({ where: { id: diagnosisId }, data: { status: 'ANALYSIS_COMPLETED' } });

  await logAuditEvent({
    userId: userId ?? null,
    diagnosisId,
    organizationId: diagnosis.organizationId,
    action: 'FULL_ANALYSIS_COMPLETED',
    entityType: 'Diagnosis',
    entityId: diagnosisId,
  });
}
