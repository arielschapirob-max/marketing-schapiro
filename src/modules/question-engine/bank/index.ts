import { GENERAL_QUESTIONS } from './general';
import { FUTURO_QUESTIONS } from './futuro';
import { SECTORIAL_QUESTIONS } from './sectoriales';
import type { QuestionSeed } from '../types';

export const ALL_QUESTIONS: QuestionSeed[] = [...GENERAL_QUESTIONS, ...FUTURO_QUESTIONS, ...SECTORIAL_QUESTIONS];

export { GENERAL_QUESTIONS, FUTURO_QUESTIONS, SECTORIAL_QUESTIONS };
