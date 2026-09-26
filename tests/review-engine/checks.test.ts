import { describe, it, expect } from 'vitest';
import { runAllChecks } from '@/modules/review-engine/checks';
import type { ReviewContext } from '@/modules/review-engine/types';

function buildContext(overrides: Partial<ReviewContext>): ReviewContext {
  return {
    diagnosisId: 'diag1',
    regime: 'VIGENTE',
    findings: [],
    legalEvaluations: [],
    questionnaireQuestions: [],
    validationTasks: [],
    webFindings: [],
    sectors: [],
    findingIdsWithEvidence: new Set(),
    ...overrides,
  } as ReviewContext;
}

describe('review engine — CHECK1 (cobertura de materias legales)', () => {
  it('falla si una regla activada no tiene pregunta asociada activa', () => {
    const ctx = buildContext({
      legalEvaluations: [
        {
          id: 'ev1',
          applicability: 'POTENCIALMENTE_APLICABLE',
          rule: { code: 'L19628-002', relatedQuestionCodes: ['Q-SENS-001'] },
        } as never,
      ],
      questionnaireQuestions: [],
    });
    const results = runAllChecks(ctx);
    const check1 = results.find((r) => r.checkCode === 'CHECK1')!;
    expect(check1.passed).toBe(false);
  });

  it('pasa si la pregunta asociada está activa', () => {
    const ctx = buildContext({
      legalEvaluations: [
        {
          id: 'ev1',
          applicability: 'POTENCIALMENTE_APLICABLE',
          rule: { code: 'L19628-002', relatedQuestionCodes: ['Q-SENS-001'] },
        } as never,
      ],
      questionnaireQuestions: [{ isActive: true, question: { code: 'Q-SENS-001', text: 'Pregunta de prueba' } } as never],
    });
    const results = runAllChecks(ctx);
    expect(results.find((r) => r.checkCode === 'CHECK1')!.passed).toBe(true);
  });
});

describe('review engine — CHECK14 (hechos inferidos como confirmados)', () => {
  it('falla si un hallazgo CONFIRMADO no tiene evidencia trazable', () => {
    const ctx = buildContext({
      findings: [{ id: 'f1', certainty: 'CONFIRMADO' } as never],
      findingIdsWithEvidence: new Set(),
    });
    expect(runAllChecks(ctx).find((r) => r.checkCode === 'CHECK14')!.passed).toBe(false);
  });

  it('pasa si el hallazgo CONFIRMADO tiene evidencia', () => {
    const ctx = buildContext({
      findings: [{ id: 'f1', certainty: 'CONFIRMADO' } as never],
      findingIdsWithEvidence: new Set(['f1']),
    });
    expect(runAllChecks(ctx).find((r) => r.checkCode === 'CHECK14')!.passed).toBe(true);
  });
});

describe('review engine — CHECK19 (transferencias detectadas por el análisis web sin hallazgo estructurado)', () => {
  it('detecta la brecha entre el análisis web y los hallazgos estructurados', () => {
    const ctx = buildContext({
      webFindings: [{ possibleTransfer: true } as never],
      findings: [],
    });
    expect(runAllChecks(ctx).find((r) => r.checkCode === 'CHECK19')!.passed).toBe(false);
  });

  it('pasa si ya existe un hallazgo estructurado de transferencia internacional', () => {
    const ctx = buildContext({
      webFindings: [{ possibleTransfer: true } as never],
      findings: [{ type: 'INTERNATIONAL_TRANSFER' } as never],
    });
    expect(runAllChecks(ctx).find((r) => r.checkCode === 'CHECK19')!.passed).toBe(true);
  });
});

describe('review engine — CHECK20 (vigencia no verificada)', () => {
  it('reporta como advertencia (no bloqueante) las reglas activadas REQUIERE_VALIDACION_JURIDICA', () => {
    const ctx = buildContext({
      legalEvaluations: [
        { id: 'ev1', applicability: 'REQUIERE_VALIDACION_JURIDICA', rule: { code: 'L21719-001', validationStatus: 'REQUIERE_VALIDACION_JURIDICA', relatedQuestionCodes: [] } } as never,
      ],
    });
    const check20 = runAllChecks(ctx).find((r) => r.checkCode === 'CHECK20')!;
    expect(check20.passed).toBe(false);
    expect(check20.severity).toBe('advisory');
  });
});
