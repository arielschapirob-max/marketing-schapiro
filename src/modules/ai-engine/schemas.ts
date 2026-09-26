import { z } from 'zod';

// Normas reconocidas por el sistema. La IA nunca puede citar una norma fuera
// de esta lista cerrada — cualquier otra referencia es rechazada por el
// validador (ver validateAIOutput en index.ts), evitando alucinación de
// legislación inexistente.
export const KNOWN_NORMS = [
  'Ley N.º 19.628',
  'Ley N.º 21.719',
  'Ley N.º 20.584',
  'Ley N.º 21.663',
  'Ley N.º 21.459',
  'Constitución Política de la República',
] as const;

export const certaintySchema = z.enum(['CONFIRMADO', 'PROBABLE', 'NO_DETERMINADO', 'INFERIDO', 'CONTRADICTORIO']);

export const extractedFindingSchema = z.object({
  type: z.enum([
    'PROCESSING_ACTIVITY',
    'DATA_SUBJECT_CATEGORY',
    'DATA_CATEGORY',
    'SENSITIVE_DATA',
    'TECHNOLOGY',
    'PROVIDER',
    'THIRD_PARTY',
    'INTERNATIONAL_TRANSFER',
    'INCIDENT',
    'SECURITY_MEASURE',
    'RETENTION_PRACTICE',
    'EXISTING_DOCUMENT',
    'BUSINESS_ACTIVITY',
  ]),
  description: z.string().min(1),
  certainty: certaintySchema,
  evidenceExcerpt: z.string().min(1),
  norm: z.enum(KNOWN_NORMS).nullable().optional(),
  requiresLegalValidation: z.boolean().default(true),
  requiresClientConfirmation: z.boolean().default(false),
});

export const meetingAnalysisOutputSchema = z.object({
  findings: z.array(extractedFindingSchema),
  contradictions: z.array(
    z.object({
      description: z.string(),
      relatedFindingDescriptions: z.array(z.string()),
    }),
  ),
  unknowns: z.array(z.string()),
});

export type ExtractedFinding = z.infer<typeof extractedFindingSchema>;
export type MeetingAnalysisOutput = z.infer<typeof meetingAnalysisOutputSchema>;

/**
 * Verifica que ninguna afirmación jurídica generada por IA cite una norma
 * fuera del catálogo cerrado, y que ninguna conclusión se presente con
 * certeza CONFIRMADO si no viene acompañada de evidencia textual.
 */
export function validateNoHallucination(output: MeetingAnalysisOutput): string[] {
  const errors: string[] = [];
  for (const finding of output.findings) {
    if (finding.certainty === 'CONFIRMADO' && finding.evidenceExcerpt.trim().length < 5) {
      errors.push(`Hallazgo "${finding.description}" marcado CONFIRMADO sin evidencia textual suficiente.`);
    }
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Cuestionario personalizado (redactado a medida del cliente, para envío directo)
// ---------------------------------------------------------------------------

export const personalizedQuestionnaireModuleSchema = z.object({
  title: z.string().min(1),
  intro: z.string().min(1),
  questions: z.array(z.string().min(1)).min(1),
});

export const personalizedQuestionnaireOutputSchema = z.object({
  greeting: z.string().min(1),
  confidentialityNote: z.string().min(1),
  modules: z.array(personalizedQuestionnaireModuleSchema).min(1),
  closingNote: z.string().min(1),
});

export type PersonalizedQuestionnaireModule = z.infer<typeof personalizedQuestionnaireModuleSchema>;
export type PersonalizedQuestionnaireOutput = z.infer<typeof personalizedQuestionnaireOutputSchema>;

/**
 * Chequeo mínimo de trazabilidad: cada pregunta debe poder referirse a texto
 * disponible en la evidencia entregada (transcripción + hallazgos web) — no
 * se puede verificar semánticamente que la IA no "inventó" un detalle, pero
 * sí se rechaza una salida que mencione un norma fuera del catálogo cerrado
 * o que se salga de la forma de pregunta (una afirmación categórica en vez
 * de una pregunta es una señal de que la IA está concluyendo, no preguntando).
 */
export function validatePersonalizedQuestionnaire(output: PersonalizedQuestionnaireOutput): string[] {
  const errors: string[] = [];
  for (const mod of output.modules) {
    for (const q of mod.questions) {
      if (!/[?¿]/.test(q)) {
        errors.push(`Pregunta sin forma interrogativa en el módulo "${mod.title}": "${q.slice(0, 80)}"`);
      }
    }
  }
  return errors;
}
