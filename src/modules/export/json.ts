import type { ReportData } from './build-report-data';

export function buildDiagnosisJson(data: ReportData): Buffer {
  const payload = {
    disclaimer:
      'Diagnóstico preliminar generado por PymeLegal. No constituye asesoría jurídica definitiva. Requiere revisión y validación de un abogado. Los hallazgos incluyen niveles de certeza (CONFIRMADO/PROBABLE/NO_DETERMINADO/INFERIDO/CONTRADICTORIO).',
    generatedAt: data.generatedAt.toISOString(),
    organization: data.organization,
    diagnosis: {
      id: data.diagnosis.id,
      title: data.diagnosis.title,
      status: data.diagnosis.status,
      regimeMode: data.diagnosis.regimeMode,
      targetDate: data.diagnosis.targetDate,
    },
    sectors: data.diagnosis.diagnosisSectors.map((s) => ({ key: s.sector.key, name: s.sector.name, certainty: s.certainty, rationale: s.rationale })),
    findings: data.diagnosis.findings,
    legalEvaluations: data.diagnosis.legalEvaluations.map((ev) => ({
      ruleCode: ev.rule.code,
      ruleName: ev.rule.name,
      norm: ev.rule.norm,
      regime: ev.regime,
      applicability: ev.applicability,
      validationStatus: ev.rule.validationStatus,
      reasoning: ev.reasoning,
      certainty: ev.certainty,
    })),
    questionnaire: data.questionnaire
      ? {
          version: data.questionnaire.version,
          status: data.questionnaire.status,
          questions: data.questionnaire.questions.map((qq) => ({
            code: qq.question.code,
            category: qq.question.category,
            text: qq.question.text,
            answer: qq.answers[0]?.value ?? null,
            dontKnow: qq.answers[0]?.dontKnow ?? false,
            notApplicable: qq.answers[0]?.notApplicable ?? false,
          })),
        }
      : null,
    review: data.review
      ? {
          runAt: data.review.runAt,
          passed: data.review.passed,
          findings: data.review.findings,
        }
      : null,
    approval: data.approval
      ? {
          approvedAt: data.approval.approvedAt,
          approvedBy: data.approval.approvedBy.name,
          notes: data.approval.notes,
        }
      : null,
    openValidationTasks: data.openValidationTasks,
    evidenceCount: data.diagnosis.evidence.length,
  };

  return Buffer.from(JSON.stringify(payload, null, 2), 'utf-8');
}
