import type { CheckFn, CheckResultDraft, ReviewContext } from './types';

function activeQuestionCodes(ctx: ReviewContext): Set<string> {
  return new Set(ctx.questionnaireQuestions.filter((q) => q.isActive).map((q) => q.question.code));
}

function findingsOfType(ctx: ReviewContext, type: string) {
  return ctx.findings.filter((f) => f.type === type);
}

const check1: CheckFn = (ctx) => {
  const active = activeQuestionCodes(ctx);
  const uncovered = ctx.legalEvaluations.filter(
    (ev) =>
      ev.applicability !== 'NO_IDENTIFICADA' &&
      ev.rule.relatedQuestionCodes.length > 0 &&
      !ev.rule.relatedQuestionCodes.some((c) => active.has(c)),
  );
  return [
    {
      checkCode: 'CHECK1',
      checkName: '¿Se cubrieron todas las materias legales aplicables o potencialmente aplicables?',
      passed: uncovered.length === 0,
      severity: 'blocking',
      description:
        uncovered.length === 0
          ? 'Todas las materias jurídicas activadas cuentan con al menos una pregunta asociada en el cuestionario.'
          : `${uncovered.length} regla(s) jurídica(s) activada(s) no tienen ninguna pregunta asociada activa: ${uncovered.map((u) => u.rule.code).join(', ')}.`,
      relatedEntity: { ruleCodes: uncovered.map((u) => u.rule.code) },
    },
  ];
};

const check2: CheckFn = (ctx) => {
  const processing = findingsOfType(ctx, 'PROCESSING_ACTIVITY');
  const active = activeQuestionCodes(ctx);
  const passed = processing.length === 0 || active.has('Q-TRAT-001');
  return [
    {
      checkCode: 'CHECK2',
      checkName: '¿Se cubrieron todos los tratamientos identificados?',
      passed,
      severity: 'blocking',
      description: passed
        ? 'Los tratamientos identificados están cubiertos por el cuestionario.'
        : `Se identificaron ${processing.length} tratamiento(s) pero la pregunta base de tratamientos (Q-TRAT-001) no está activa.`,
    },
  ];
};

const check3: CheckFn = (ctx) => {
  const sensitive = findingsOfType(ctx, 'SENSITIVE_DATA');
  const active = activeQuestionCodes(ctx);
  const passed = sensitive.length === 0 || (active.has('Q-SENS-001') && active.has('Q-SENS-002'));
  return [
    {
      checkCode: 'CHECK3',
      checkName: '¿Se cubrieron todos los datos sensibles identificados?',
      passed,
      severity: 'blocking',
      description: passed
        ? 'Los datos sensibles identificados están cubiertos por preguntas específicas.'
        : `Se identificaron ${sensitive.length} dato(s) sensible(s) sin cobertura completa (Q-SENS-001/Q-SENS-002).`,
    },
  ];
};

const check4: CheckFn = (ctx) => {
  const providers = [...findingsOfType(ctx, 'PROVIDER'), ...findingsOfType(ctx, 'THIRD_PARTY')];
  const active = activeQuestionCodes(ctx);
  const passed = providers.length === 0 || active.has('Q-PROV-001');
  return [
    {
      checkCode: 'CHECK4',
      checkName: '¿Se revisaron proveedores?',
      passed,
      severity: 'blocking',
      description: passed ? 'Los proveedores/terceros identificados están cubiertos.' : `Se identificaron ${providers.length} proveedor(es)/tercero(s) sin pregunta de revisión activa.`,
    },
  ];
};

const check5: CheckFn = (ctx) => {
  const transfers = findingsOfType(ctx, 'INTERNATIONAL_TRANSFER');
  const active = activeQuestionCodes(ctx);
  const passed = transfers.length === 0 || active.has('Q-TRANSF-001');
  return [
    {
      checkCode: 'CHECK5',
      checkName: '¿Se revisaron transferencias internacionales?',
      passed,
      severity: 'blocking',
      description: passed ? 'Las transferencias internacionales identificadas están cubiertas.' : `Se identificaron ${transfers.length} transferencia(s) internacional(es) sin pregunta de revisión activa.`,
    },
  ];
};

const check6: CheckFn = (ctx) => {
  const tech = findingsOfType(ctx, 'TECHNOLOGY');
  const active = activeQuestionCodes(ctx);
  const passed = tech.length === 0 || active.has('Q-TEC-001');
  return [
    {
      checkCode: 'CHECK6',
      checkName: '¿Se revisaron tecnologías?',
      passed,
      severity: 'blocking',
      description: passed ? 'Las tecnologías identificadas están cubiertas.' : `Se identificaron ${tech.length} tecnología(s) sin pregunta de revisión activa.`,
    },
  ];
};

const check7: CheckFn = (ctx) => {
  const active = activeQuestionCodes(ctx);
  const passed = active.has('Q-SEG-001');
  return [
    {
      checkCode: 'CHECK7',
      checkName: '¿Se revisaron medidas de seguridad?',
      passed,
      severity: 'blocking',
      description: passed ? 'La pregunta base de medidas de seguridad está activa.' : 'Falta la pregunta base de medidas de seguridad (Q-SEG-001) en el cuestionario.',
    },
  ];
};

const check8: CheckFn = (ctx) => {
  const subjects = findingsOfType(ctx, 'DATA_SUBJECT_CATEGORY');
  const active = activeQuestionCodes(ctx);
  const passed = subjects.length === 0 || active.has('Q-ARCO-001');
  return [
    {
      checkCode: 'CHECK8',
      checkName: '¿Se revisaron derechos de los titulares?',
      passed,
      severity: 'blocking',
      description: passed ? 'Los derechos de los titulares están cubiertos.' : 'Existen titulares identificados sin pregunta activa sobre derechos ARCO (Q-ARCO-001).',
    },
  ];
};

const check9: CheckFn = (ctx) => {
  const active = activeQuestionCodes(ctx);
  const passed = active.has('Q-CONS-001');
  return [
    {
      checkCode: 'CHECK9',
      checkName: '¿Se revisó conservación y eliminación?',
      passed,
      severity: 'blocking',
      description: passed ? 'La pregunta base de conservación y eliminación está activa.' : 'Falta la pregunta base de conservación y eliminación (Q-CONS-001).',
    },
  ];
};

const check10: CheckFn = (ctx) => {
  if (ctx.sectors.length === 0) {
    return [
      {
        checkCode: 'CHECK10',
        checkName: '¿Se revisó normativa sectorial?',
        passed: true,
        severity: 'blocking',
        description: 'No se detectaron sectores regulatorios específicos para este diagnóstico.',
      },
    ];
  }
  const active = activeQuestionCodes(ctx);
  const sectorialActive = [...active].some((c) => /^Q-(SALUD|EDU|ECOM|SAAS|LAB|FIN)-/.test(c));
  return [
    {
      checkCode: 'CHECK10',
      checkName: '¿Se revisó normativa sectorial?',
      passed: sectorialActive,
      severity: 'blocking',
      description: sectorialActive
        ? `Se incluyeron preguntas específicas para el/los sector(es): ${ctx.sectors.map((s) => s.sector.name).join(', ')}.`
        : `Se detectaron sectores (${ctx.sectors.map((s) => s.sector.name).join(', ')}) sin preguntas sectoriales activas.`,
    },
  ];
};

const check11: CheckFn = (ctx) => {
  const texts = new Map<string, number>();
  for (const qq of ctx.questionnaireQuestions.filter((q) => q.isActive)) {
    const key = qq.question.text.trim().toLowerCase();
    texts.set(key, (texts.get(key) ?? 0) + 1);
  }
  const duplicates = [...texts.entries()].filter(([, count]) => count > 1);
  return [
    {
      checkCode: 'CHECK11',
      checkName: '¿Existen preguntas redundantes?',
      passed: duplicates.length === 0,
      severity: 'advisory',
      description: duplicates.length === 0 ? 'No se detectaron preguntas con texto duplicado.' : `Se detectaron ${duplicates.length} texto(s) de pregunta duplicados.`,
    },
  ];
};

const check12: CheckFn = (ctx) => {
  const unsourced = ctx.questionnaireQuestions.filter((q) => q.isActive && q.question.norm && !q.question.source);
  return [
    {
      checkCode: 'CHECK12',
      checkName: '¿Existe alguna afirmación jurídica sin fuente?',
      passed: unsourced.length === 0,
      severity: 'blocking',
      description: unsourced.length === 0 ? 'Toda referencia normativa en el cuestionario tiene una fuente/regla asociada.' : `${unsourced.length} pregunta(s) citan una norma sin regla jurídica de origen asociada: ${unsourced.map((u) => u.question.code).join(', ')}.`,
    },
  ];
};

const check13: CheckFn = (ctx) => {
  const missingJustification = ctx.questionnaireQuestions.filter((q) => q.isActive && q.addedByLawyer && !q.question.justification && !q.sourceNote);
  return [
    {
      checkCode: 'CHECK13',
      checkName: '¿Existe alguna pregunta que no tenga justificación?',
      passed: missingJustification.length === 0,
      severity: 'blocking',
      description: missingJustification.length === 0 ? 'Todas las preguntas cuentan con justificación.' : `${missingJustification.length} pregunta(s) agregada(s) por el abogado no tienen justificación registrada.`,
    },
  ];
};

const check14: CheckFn = (ctx) => {
  // La validez de "CONFIRMADO" ya se filtra en origen (ai-engine/schemas.ts
  // rechaza CONFIRMADO sin evidencia). Este check verifica, además, que todo
  // hallazgo CONFIRMADO tenga al menos un registro de Evidence trazable.
  const badConfirmed = ctx.findings.filter((f) => f.certainty === 'CONFIRMADO' && !ctx.findingIdsWithEvidence.has(f.id));
  return [
    {
      checkCode: 'CHECK14',
      checkName: '¿Existen hechos inferidos presentados como confirmados?',
      passed: badConfirmed.length === 0,
      severity: 'blocking',
      description: badConfirmed.length === 0 ? 'No se detectaron hallazgos CONFIRMADO sin evidencia trazable.' : `${badConfirmed.length} hallazgo(s) marcados CONFIRMADO sin evidencia trazable.`,
    },
  ];
};

const check15: CheckFn = (ctx) => {
  const openContradictions = ctx.validationTasks.filter((t) => t.status === 'OPEN' && t.description.startsWith('Contradicción'));
  return [
    {
      checkCode: 'CHECK15',
      checkName: '¿Existen contradicciones no resueltas?',
      passed: openContradictions.length === 0,
      severity: 'blocking',
      description: openContradictions.length === 0 ? 'No hay contradicciones abiertas.' : `${openContradictions.length} contradicción(es) detectada(s) sin resolver.`,
      relatedEntity: { taskIds: openContradictions.map((t) => t.id) },
    },
  ];
};

const check16: CheckFn = (ctx) => {
  const unresolved = findingsOfType(ctx, 'PROCESSING_ACTIVITY').filter((f) => f.certainty === 'CONTRADICTORIO');
  return [
    {
      checkCode: 'CHECK16',
      checkName: '¿Existen tratamientos identificados sin pregunta o explicación?',
      passed: unresolved.length === 0,
      severity: 'advisory',
      description: unresolved.length === 0 ? 'Todos los tratamientos identificados están en estado consistente.' : `${unresolved.length} tratamiento(s) quedaron en estado contradictorio sin explicación.`,
    },
  ];
};

const check17: CheckFn = (ctx) => {
  const sensitive = findingsOfType(ctx, 'SENSITIVE_DATA');
  const withoutEvidence = sensitive.filter((f) => !ctx.findingIdsWithEvidence.has(f.id));
  return [
    {
      checkCode: 'CHECK17',
      checkName: '¿Existen datos sensibles identificados sin revisión específica?',
      passed: withoutEvidence.length === 0,
      severity: 'advisory',
      description:
        sensitive.length === 0
          ? 'No se identificaron datos sensibles.'
          : withoutEvidence.length === 0
            ? `${sensitive.length} dato(s) sensible(s) identificado(s), todos con evidencia trazada de origen.`
            : `${withoutEvidence.length} de ${sensitive.length} dato(s) sensible(s) no tienen evidencia trazable asociada.`,
    },
  ];
};

const check18: CheckFn = (ctx) => {
  const providers = [...findingsOfType(ctx, 'PROVIDER'), ...findingsOfType(ctx, 'THIRD_PARTY')];
  const active = activeQuestionCodes(ctx);
  const passed = providers.length === 0 || active.has('Q-PROV-002');
  return [
    {
      checkCode: 'CHECK18',
      checkName: '¿Existen proveedores o terceros sin análisis de rol?',
      passed,
      severity: 'advisory',
      description: passed ? 'El análisis de rol contractual de proveedores/terceros está incluido.' : `${providers.length} proveedor(es)/tercero(s) sin pregunta específica de análisis de rol contractual (Q-PROV-002).`,
    },
  ];
};

const check19: CheckFn = (ctx) => {
  const transferHints = ctx.webFindings.filter((w) => w.possibleTransfer);
  const hasStructuredTransfer = findingsOfType(ctx, 'INTERNATIONAL_TRANSFER').length > 0;
  const gap = transferHints.length > 0 && !hasStructuredTransfer;
  return [
    {
      checkCode: 'CHECK19',
      checkName: '¿Existen transferencias potenciales sin pregunta?',
      passed: !gap,
      severity: 'blocking',
      description: gap
        ? `El análisis web detectó ${transferHints.length} indicio(s) de transferencia internacional (p. ej. Google Analytics/Meta Pixel) que no están reflejados como hallazgo estructurado de transferencia internacional.`
        : 'No hay brechas entre los indicios de transferencia del análisis web y los hallazgos estructurados.',
    },
  ];
};

const check20: CheckFn = (ctx) => {
  const unverified = ctx.legalEvaluations.filter((ev) => ev.applicability !== 'NO_IDENTIFICADA' && ev.rule.validationStatus === 'REQUIERE_VALIDACION_JURIDICA');
  return [
    {
      checkCode: 'CHECK20',
      checkName: '¿Existen reglas con vigencia no verificada?',
      passed: unverified.length === 0,
      severity: 'advisory',
      description:
        unverified.length === 0
          ? 'Todas las reglas activadas están validadas.'
          : `${unverified.length} regla(s) activada(s) están marcadas REQUIERE VALIDACIÓN JURÍDICA: ${unverified.map((u) => u.rule.code).join(', ')}. Esto es esperado en este sistema (ver docs/LEGAL_ENGINE.md) y requiere confirmación del abogado antes de la aprobación final.`,
      relatedEntity: { ruleCodes: unverified.map((u) => u.rule.code) },
    },
  ];
};

export const ALL_CHECKS: CheckFn[] = [
  check1, check2, check3, check4, check5, check6, check7, check8, check9, check10,
  check11, check12, check13, check14, check15, check16, check17, check18, check19, check20,
];

export function runAllChecks(ctx: ReviewContext): CheckResultDraft[] {
  return ALL_CHECKS.flatMap((check) => check(ctx));
}
