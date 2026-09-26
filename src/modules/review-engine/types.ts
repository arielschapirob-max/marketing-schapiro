import type { Finding, LegalEvaluation, LegalRule, Question, QuestionnaireQuestion, ValidationTask, WebFinding, DiagnosisSector, Sector } from '@prisma/client';

export interface ReviewContext {
  diagnosisId: string;
  regime: 'VIGENTE' | 'FUTURO' | 'TRANSICION';
  findings: Finding[];
  legalEvaluations: Array<LegalEvaluation & { rule: LegalRule }>;
  questionnaireQuestions: Array<QuestionnaireQuestion & { question: Question }>;
  validationTasks: ValidationTask[];
  webFindings: WebFinding[];
  sectors: Array<DiagnosisSector & { sector: Sector }>;
  findingIdsWithEvidence: Set<string>;
}

export interface CheckResultDraft {
  checkCode: string;
  checkName: string;
  passed: boolean;
  severity: 'blocking' | 'advisory';
  description: string;
  relatedEntity?: unknown;
}

export type CheckFn = (ctx: ReviewContext) => CheckResultDraft[];
