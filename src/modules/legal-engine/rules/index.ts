import { LEY_19628_RULES } from './ley-19628';
import { LEY_21719_RULES } from './ley-21719';
import { SECTORIAL_RULES } from './sectoriales';
import type { LegalRuleSeed } from '../types';

export const ALL_LEGAL_RULES: LegalRuleSeed[] = [
  ...LEY_19628_RULES,
  ...LEY_21719_RULES,
  ...SECTORIAL_RULES,
];

export { LEY_19628_RULES, LEY_21719_RULES, SECTORIAL_RULES };
