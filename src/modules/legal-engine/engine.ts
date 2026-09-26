import 'server-only';
import { db } from '@/lib/db';
import type { CertaintyLevel, RuleApplicability } from '@prisma/client';
import { evaluateCondition } from './condition-evaluator';
import { regimesForTargetDate } from './vigencia';
import type { Condition, FactBase } from './types';
import { logAuditEvent } from '@/modules/audit';

// Prisma no soporta agrupar por tipo directamente en un solo query tipado sin
// generar código adicional; se construye la base de hechos con una consulta
// simple y agrupación en memoria (volumen esperado: cientos de hallazgos por
// diagnóstico, no miles).
async function buildFactBaseFromFindings(
  diagnosisId: string,
  organization: { id: string; sectorKeys: string[]; country: string; employeeCount: number | null; estimatedDataSubjects: number | null },
): Promise<FactBase> {
  const [findings, diagnosisSectors] = await Promise.all([
    db.finding.findMany({ where: { diagnosisId } }),
    db.diagnosisSector.findMany({ where: { diagnosisId }, include: { sector: true } }),
  ]);

  const byType = (type: string) =>
    findings.filter((f) => f.type === type).map((f) => descriptionOf(f.value, f.description));

  return {
    organization: {
      id: organization.id,
      sectorKeys: organization.sectorKeys,
      country: organization.country,
      employeeCount: organization.employeeCount,
      estimatedDataSubjects: organization.estimatedDataSubjects,
    },
    sectorKeys: diagnosisSectors.map((s) => s.sector.key),
    dataCategories: byType('DATA_CATEGORY'),
    sensitiveData: byType('SENSITIVE_DATA'),
    dataSubjects: byType('DATA_SUBJECT_CATEGORY'),
    processingActivities: byType('PROCESSING_ACTIVITY'),
    technologies: byType('TECHNOLOGY'),
    providers: byType('PROVIDER'),
    thirdParties: byType('THIRD_PARTY'),
    internationalTransfers: byType('INTERNATIONAL_TRANSFER'),
    incidents: byType('INCIDENT'),
    securityMeasures: byType('SECURITY_MEASURE'),
    retentionPractices: byType('RETENTION_PRACTICE'),
    existingDocuments: byType('EXISTING_DOCUMENT'),
  };
}

function descriptionOf(value: unknown, fallback: string): string {
  if (value && typeof value === 'object' && 'label' in (value as Record<string, unknown>)) {
    return String((value as Record<string, unknown>).label);
  }
  return fallback;
}

function certaintyFromMatches(paths: string[], fact: FactBase): CertaintyLevel {
  // Certeza simple y trazable: si no hay evidencia (regla "always"), se marca
  // NO_DETERMINADO en cuanto a hechos (aplica igual, pero sin evidencia
  // específica que mostrar). Si hay coincidencias, se hereda PROBABLE por
  // defecto ya que las reglas se activan sobre hallazgos que pueden a su vez
  // ser CONFIRMADO/PROBABLE/INFERIDO — el detalle fino vive en cada Finding.
  void fact;
  return paths.length === 0 ? 'NO_DETERMINADO' : 'PROBABLE';
}

/**
 * Evalúa todas las reglas jurídicas vigentes/futuras (según el modo de
 * régimen del diagnóstico) contra su base de hechos, y persiste el
 * resultado en `LegalEvaluation`. No mezcla automáticamente vigente y
 * futuro salvo que el diagnóstico esté explícitamente en modo TRANSICION.
 */
export async function evaluateLegalRulesForDiagnosis(diagnosisId: string, userId?: string): Promise<void> {
  const diagnosis = await db.diagnosis.findUniqueOrThrow({
    where: { id: diagnosisId },
    include: { organization: true },
  });

  const fact = await buildFactBaseFromFindings(diagnosisId, diagnosis.organization);
  const regimes = regimesForTargetDate(diagnosis.targetDate, diagnosis.regimeMode);

  const rules = await db.legalRule.findMany({
    where: { regime: { in: regimes } },
  });

  await db.legalEvaluation.deleteMany({ where: { diagnosisId, regime: { in: regimes } } });

  for (const rule of rules) {
    const condition = rule.activationConditions as unknown as Condition;
    const { matched, paths } = evaluateCondition(condition, fact);

    const applicability: RuleApplicability = !matched
      ? 'NO_IDENTIFICADA'
      : rule.validationStatus === 'REQUIERE_VALIDACION_JURIDICA'
        ? 'REQUIERE_VALIDACION_JURIDICA'
        : 'POTENCIALMENTE_APLICABLE';

    const certainty = certaintyFromMatches(paths, fact);

    const reasoning = matched
      ? `Se activó por evidencia en: ${paths.join(', ') || 'condición general'}. ${rule.result && typeof rule.result === 'object' && 'obligationSummary' in (rule.result as Record<string, unknown>) ? (rule.result as Record<string, unknown>).obligationSummary : ''}`
      : 'No se encontró evidencia suficiente en el diagnóstico para activar esta regla.';

    await db.legalEvaluation.create({
      data: {
        diagnosisId,
        ruleId: rule.id,
        regime: rule.regime,
        applicability,
        reasoning,
        evidenceRefs: { matchedPaths: paths },
        certainty,
      },
    });
  }

  await logAuditEvent({
    userId: userId ?? null,
    diagnosisId,
    organizationId: diagnosis.organizationId,
    action: 'LEGAL_ENGINE_EVALUATED',
    entityType: 'Diagnosis',
    entityId: diagnosisId,
    metadata: { regimes, rulesEvaluated: rules.length },
  });
}

export { buildFactBaseFromFindings };
