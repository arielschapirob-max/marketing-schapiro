import 'server-only';
import { db } from '@/lib/db';
import { evaluateCondition } from '@/modules/legal-engine/condition-evaluator';
import { buildFactBaseFromFindings } from '@/modules/legal-engine/engine';
import { logAuditEvent } from '@/modules/audit';

/**
 * Genera (o regenera) el cuestionario de un diagnóstico a partir de las
 * preguntas activas en el banco (`Question`, ya sembrado en BD) cuya
 * condición de visibilidad se cumple contra la base de hechos del
 * diagnóstico, filtrando además por sector detectado y por régimen
 * (vigente/futuro) del diagnóstico.
 *
 * Nunca se genera un formulario genérico previo: esta función solo debe
 * invocarse después de que el análisis (reunión + documentos + web) haya
 * completado y producido al menos un `Finding`.
 */
export async function generateQuestionnaire(diagnosisId: string, userId?: string) {
  const diagnosis = await db.diagnosis.findUniqueOrThrow({
    where: { id: diagnosisId },
    include: { organization: true, diagnosisSectors: { include: { sector: true } } },
  });

  const fact = await buildFactBaseFromFindings(diagnosisId, diagnosis.organization);
  const detectedSectorKeys = new Set(diagnosis.diagnosisSectors.map((s) => s.sector.key));
  const includeFuturo = diagnosis.regimeMode === 'FUTURO' || diagnosis.regimeMode === 'TRANSICION';

  const allQuestions = await db.question.findMany({ where: { status: 'ACTIVE' }, orderBy: { order: 'asc' } });

  const selected = allQuestions.filter((q) => {
    const isFuturo = q.norm === 'Ley N.º 21.719';
    if (isFuturo && !includeFuturo) return false;

    if (!q.visibilityCondition) return true;
    const { matched } = evaluateCondition(q.visibilityCondition as never, fact);
    return matched;
  });

  // Filtrado adicional por sector: se consulta la relación QuestionSector.
  const sectorLinks = await db.questionSector.findMany({ where: { questionId: { in: selected.map((q) => q.id) } } });
  const sectorByQuestion = new Map<string, string[]>();
  for (const link of sectorLinks) {
    const list = sectorByQuestion.get(link.questionId) ?? [];
    list.push(link.sectorId);
    sectorByQuestion.set(link.questionId, list);
  }
  const sectorIdToKey = new Map((await db.sector.findMany()).map((s) => [s.id, s.key]));

  const finalQuestions = selected.filter((q) => {
    const sectorIds = sectorByQuestion.get(q.id);
    if (!sectorIds || sectorIds.length === 0) return true; // pregunta general, sin restricción sectorial
    return sectorIds.some((id) => detectedSectorKeys.has(sectorIdToKey.get(id) ?? ''));
  });

  const existing = await db.questionnaire.findFirst({
    where: { diagnosisId },
    orderBy: { version: 'desc' },
  });
  const version = (existing?.version ?? 0) + 1;

  const questionnaire = await db.questionnaire.create({
    data: {
      diagnosisId,
      version,
      status: 'GENERATED',
      generatedAt: new Date(),
      questions: {
        create: finalQuestions.map((q, idx) => ({
          questionId: q.id,
          order: idx,
          isActive: true,
          sourceNote: q.justification ?? undefined,
        })),
      },
    },
    include: { questions: { include: { question: true } } },
  });

  await db.diagnosis.update({
    where: { id: diagnosisId },
    data: { status: 'QUESTIONNAIRE_GENERATED' },
  });

  await logAuditEvent({
    userId: userId ?? null,
    diagnosisId,
    organizationId: diagnosis.organizationId,
    action: 'QUESTIONNAIRE_GENERATED',
    entityType: 'Questionnaire',
    entityId: questionnaire.id,
    metadata: { version, questionCount: finalQuestions.length, sectors: [...detectedSectorKeys] },
  });

  return questionnaire;
}
