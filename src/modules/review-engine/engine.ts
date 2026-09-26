import 'server-only';
import { db } from '@/lib/db';
import { runAllChecks } from './checks';
import type { ReviewContext } from './types';
import { logAuditEvent } from '@/modules/audit';

/**
 * Ejecuta los 20 controles de revisión automática (sección 16 del encargo)
 * sobre el estado actual del diagnóstico y su cuestionario, persiste el
 * resultado en `Review`/`ReviewFinding`, y crea `ValidationTask` bloqueantes
 * para los controles críticos que fallen. Si hay al menos un control
 * bloqueante fallido, el cuestionario NO puede aprobarse (ver
 * modules/export y la ruta de aprobación).
 */
export async function runReview(diagnosisId: string, questionnaireId: string, runById?: string) {
  const [diagnosis, findings, legalEvaluations, questionnaireQuestions, validationTasks, webFindings, sectors, evidenceRows] = await Promise.all([
    db.diagnosis.findUniqueOrThrow({ where: { id: diagnosisId } }),
    db.finding.findMany({ where: { diagnosisId } }),
    db.legalEvaluation.findMany({ where: { diagnosisId }, include: { rule: true } }),
    db.questionnaireQuestion.findMany({ where: { questionnaireId }, include: { question: true } }),
    db.validationTask.findMany({ where: { diagnosisId } }),
    db.webFinding.findMany({ where: { webAnalysis: { diagnosisId } } }),
    db.diagnosisSector.findMany({ where: { diagnosisId }, include: { sector: true } }),
    db.evidence.findMany({ where: { diagnosisId }, select: { findingId: true } }),
  ]);

  const ctx: ReviewContext = {
    diagnosisId,
    regime: diagnosis.regimeMode,
    findings,
    legalEvaluations,
    questionnaireQuestions,
    validationTasks,
    webFindings,
    sectors,
    findingIdsWithEvidence: new Set(evidenceRows.map((e) => e.findingId).filter((id): id is string => Boolean(id))),
  };

  const results = runAllChecks(ctx);
  const blockingFailures = results.filter((r) => !r.passed && r.severity === 'blocking');
  const passed = blockingFailures.length === 0;

  const review = await db.review.create({
    data: {
      diagnosisId,
      questionnaireId,
      passed,
      summary: {
        totalChecks: results.length,
        passedChecks: results.filter((r) => r.passed).length,
        blockingFailures: blockingFailures.length,
        advisoryFailures: results.filter((r) => !r.passed && r.severity === 'advisory').length,
      },
      findings: {
        create: results.map((r) => ({
          checkCode: r.checkCode,
          checkName: r.checkName,
          passed: r.passed,
          severity: r.severity,
          description: r.description,
          relatedEntity: r.relatedEntity as object | undefined,
        })),
      },
    },
    include: { findings: true },
  });

  for (const failure of blockingFailures) {
    await db.validationTask.create({
      data: {
        diagnosisId,
        type: 'LEGAL',
        description: `[${failure.checkCode}] ${failure.checkName} — ${failure.description}`,
        blocking: true,
        relatedEntity: failure.relatedEntity as object | undefined,
      },
    });
  }

  await db.diagnosis.update({
    where: { id: diagnosisId },
    data: { status: 'IN_REVIEW' },
  });

  await logAuditEvent({
    userId: runById ?? null,
    diagnosisId,
    organizationId: diagnosis.organizationId,
    action: 'REVIEW_EXECUTED',
    entityType: 'Review',
    entityId: review.id,
    metadata: { passed, blockingFailures: blockingFailures.length },
  });

  return review;
}
