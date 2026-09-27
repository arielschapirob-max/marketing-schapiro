import type { CertaintyLevel, RuleApplicability, RuleRegime, RuleStatus } from '@prisma/client';

/**
 * DSL mínimo para condiciones de activación de reglas jurídicas.
 * Se evalúa contra un `FactBase` construido a partir de los hallazgos
 * (Finding), el perfil organizacional y los datos de la Organization.
 */
export type Condition =
  | { op: 'always' }
  | { op: 'nonEmpty'; path: string }
  | { op: 'empty'; path: string }
  | { op: 'includes'; path: string; value: string }
  | { op: 'includesAny'; path: string; values: string[] }
  | { op: 'gte'; path: string; value: number }
  | { op: 'lte'; path: string; value: number }
  | { op: 'equals'; path: string; value: string | number | boolean }
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition };

export interface FactBase {
  organization: {
    id: string;
    sectorKeys: string[];
    country: string;
    employeeCount: number | null;
    estimatedDataSubjects: number | null;
  };
  /** Sectores detectados dinámicamente para este diagnóstico (DiagnosisSector), a diferencia de organization.sectorKeys (declaración manual/estática de la organización). */
  sectorKeys: string[];
  dataCategories: string[];
  sensitiveData: string[];
  dataSubjects: string[];
  processingActivities: string[];
  technologies: string[];
  providers: string[];
  thirdParties: string[];
  internationalTransfers: string[];
  incidents: string[];
  securityMeasures: string[];
  retentionPractices: string[];
  existingDocuments: string[];
}

export interface LegalRuleSeed {
  code: string;
  name: string;
  description: string;
  jurisdiction: string;
  subject: string;
  norm: string;
  article?: string;
  clause?: string;
  status: RuleStatus;
  regime: RuleRegime;
  startDate?: string;
  endDate?: string;
  sourceCode: string;
  officialUrl?: string;
  excerpt?: string;
  scope?: string;
  activationConditions: Condition;
  result: {
    obligationSummary: string;
    references: string[];
  };
  risk?: string;
  severity?: 'bajo' | 'medio' | 'alto' | 'critico';
  relatedQuestionCodes?: string[];
  requiredEvidence?: string[];
  validationStatus: 'VALIDADA' | 'REQUIERE_VALIDACION_JURIDICA';
  sectorKeys?: string[];
}

export interface LegalSourceSeed {
  code: string;
  name: string;
  authority: string;
  url: string;
  officialRef?: string;
  notes?: string;
}

export interface RuleEvaluationOutcome {
  ruleCode: string;
  regime: RuleRegime;
  applicability: RuleApplicability;
  reasoning: string;
  certainty: CertaintyLevel;
  matchedPaths: string[];
}
