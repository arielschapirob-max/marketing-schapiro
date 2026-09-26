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
