import type { Condition } from '@/modules/legal-engine/types';
import type { AnswerType } from '@prisma/client';

export interface QuestionSeed {
  code: string;
  category: string;
  subcategory?: string;
  text: string;
  answerType: AnswerType;
  required: boolean;
  processingTag?: string;
  order: number;
  help?: string;
  lawyerExplanation?: string;
  clientExplanation?: string;
  options?: string[];
  norm?: string;
  article?: string;
  source?: string;
  requiredEvidence?: string[];
  justification: string;
  legalMatter: string;
  riskLevel?: 'bajo' | 'medio' | 'alto' | 'critico';
  requiresDocument?: boolean;
  allowsDontKnow?: boolean;
  allowsNotApplicable?: boolean;
  sectorKeys?: string[];
  visibilityCondition?: Condition;
}
