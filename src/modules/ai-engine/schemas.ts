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
//
// El formato sigue el estándar real usado en la práctica (ver LEGAL_ENGINE.md /
// AI_ENGINE.md): portada, presentación adaptada al giro real del cliente,
// instrucciones de cómo responder, glosario de términos del rubro, módulos
// con preguntas abiertas y cerradas (con opciones tipo checkbox), y una lista
// de verificación de documentos a adjuntar al final.

export const personalizedQuestionEntrySchema = z.object({
  number: z.string().min(1),
  text: z.string().min(1),
  type: z.enum(['abierta', 'cerrada']),
  options: z.array(z.string().min(1)).optional(),
  allowsDetail: z.boolean().optional(),
});

export const personalizedQuestionnaireModuleSchema = z.object({
  title: z.string().min(1),
  areaResponsible: z.string().min(1),
  phase: z.enum(['FASE_1_ESENCIAL', 'FASE_2_AMPLIACION']),
  intro: z.string().min(1),
  questions: z.array(personalizedQuestionEntrySchema).min(1),
});

export const personalizedQuestionnaireOutputSchema = z.object({
  coverPage: z.object({
    title: z.string().min(1),
    subtitle: z.string().min(1),
    lawReference: z.string().min(1),
    preparedFor: z.string().min(1),
    contacts: z.string().min(1),
  }),
  presentation: z.array(z.string().min(1)).min(1),
  howToRespond: z.array(z.string().min(1)).min(1),
  confidentialityNote: z.string().min(1),
  glossary: z.array(z.object({ term: z.string().min(1), definition: z.string().min(1) })),
  modules: z.array(personalizedQuestionnaireModuleSchema).min(1),
  documentChecklist: z.array(z.string().min(1)),
  closingNote: z.string().min(1),
});

export type PersonalizedQuestionEntry = z.infer<typeof personalizedQuestionEntrySchema>;
export type PersonalizedQuestionnaireModule = z.infer<typeof personalizedQuestionnaireModuleSchema>;
export type PersonalizedQuestionnaireOutput = z.infer<typeof personalizedQuestionnaireOutputSchema>;

/**
 * Chequeo mínimo de forma: cada pregunta abierta debe tener forma
 * interrogativa (nunca una afirmación de hecho no confirmado), y cada
 * pregunta cerrada debe traer al menos dos opciones para marcar. No se puede
 * verificar semánticamente que la IA no "inventó" un detalle citado en una
 * pregunta — eso queda para la revisión humana antes de enviar el documento.
 */
export function validatePersonalizedQuestionnaire(output: PersonalizedQuestionnaireOutput): string[] {
  const errors: string[] = [];
  for (const mod of output.modules) {
    for (const q of mod.questions) {
      if (q.type === 'abierta' && !/[?¿]/.test(q.text)) {
        errors.push(`Pregunta abierta sin forma interrogativa en el módulo "${mod.title}": "${q.text.slice(0, 80)}"`);
      }
      if (q.type === 'cerrada' && (!q.options || q.options.length < 2)) {
        errors.push(`Pregunta cerrada sin opciones suficientes en el módulo "${mod.title}": "${q.text.slice(0, 80)}"`);
      }
    }
  }
  return errors;
}
