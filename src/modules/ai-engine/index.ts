import 'server-only';
import { db } from '@/lib/db';
import { getEnv, isMockAI } from '@/lib/env';
import { mockAIProvider } from './providers/mock';
import type { AIProvider, MeetingAnalysisRequest, PersonalizedQuestionnaireRequest } from './types';
import { validateNoHallucination, validatePersonalizedQuestionnaire, type MeetingAnalysisOutput, type PersonalizedQuestionnaireOutput } from './schemas';

export async function getAIProvider(): Promise<AIProvider> {
  if (isMockAI()) return mockAIProvider;
  // import perezoso para no exigir configuración de red en modo mock
  const { createLiveAIProvider } = await import('./providers/live');
  return createLiveAIProvider();
}

export interface RunMeetingAnalysisOptions {
  diagnosisId: string;
  executedById?: string;
}

/**
 * Ejecuta el análisis de una transcripción a través del proveedor de IA
 * configurado, valida la salida contra el esquema y contra la regla
 * anti-alucinación, y deja constancia completa en `AIExecution` (proveedor,
 * modelo, entrada resumida, salida, validaciones, errores).
 */
export async function runMeetingAnalysis(
  req: MeetingAnalysisRequest,
  opts: RunMeetingAnalysisOptions,
): Promise<MeetingAnalysisOutput> {
  const provider = await getAIProvider();
  const env = getEnv();
  const startedAt = Date.now();

  let output: MeetingAnalysisOutput | null = null;
  let errors: string[] = [];

  try {
    output = await provider.analyzeMeetingTranscript(req);
    errors = validateNoHallucination(output);
  } catch (err) {
    errors = [err instanceof Error ? err.message : String(err)];
  }

  await db.aIExecution.create({
    data: {
      diagnosisId: opts.diagnosisId,
      kind: 'EXTRACTION',
      provider: provider.provider,
      model: provider.model,
      promptVersion: 'meeting-analysis-v1',
      inputSummary: req.transcriptText.slice(0, 500),
      output: output ?? {},
      validations: { hallucinationCheckErrors: errors },
      errors: errors.length > 0 ? errors : undefined,
      sourcesUsed: { organizationContext: req.organizationContext },
      executedById: opts.executedById ?? null,
      durationMs: Date.now() - startedAt,
    },
  });

  if (!output) {
    throw new Error(`Fallo en el análisis de IA: ${errors.join('; ')}`);
  }
  if (errors.length > 0) {
    // Se conservan solo los hallazgos que no violan la regla anti-alucinación.
    output = {
      ...output,
      findings: output.findings.filter((f) => !(f.certainty === 'CONFIRMADO' && f.evidenceExcerpt.trim().length < 5)),
    };
  }

  void env;
  return output;
}

export interface RunPersonalizedQuestionnaireOptions {
  diagnosisId: string;
  executedById?: string;
}

/**
 * Genera el cuestionario personalizado (redactado a medida, para envío
 * directo al cliente) a través del proveedor de IA configurado, deja
 * constancia completa en `AIExecution` (mismo contrato de trazabilidad que
 * `runMeetingAnalysis`), y nunca devuelve una salida que no haya validado
 * contra el esquema Zod y la regla de forma interrogativa.
 */
export async function runPersonalizedQuestionnaireGeneration(
  req: PersonalizedQuestionnaireRequest,
  opts: RunPersonalizedQuestionnaireOptions,
): Promise<PersonalizedQuestionnaireOutput> {
  const provider = await getAIProvider();
  const startedAt = Date.now();

  let output: PersonalizedQuestionnaireOutput | null = null;
  let errors: string[] = [];

  try {
    output = await provider.generatePersonalizedQuestionnaire(req);
    errors = validatePersonalizedQuestionnaire(output);
  } catch (err) {
    errors = [err instanceof Error ? err.message : String(err)];
  }

  await db.aIExecution.create({
    data: {
      diagnosisId: opts.diagnosisId,
      kind: 'QUESTION_GENERATION',
      provider: provider.provider,
      model: provider.model,
      promptVersion: 'personalized-questionnaire-v1',
      inputSummary: `${req.organizationContext.legalName} — ${req.transcriptExcerpts.length} extracto(s) de transcripción, ${req.webFindingSummaries.length} hallazgo(s) web`,
      output: output ?? {},
      validations: { formErrors: errors },
      errors: errors.length > 0 ? errors : undefined,
      sourcesUsed: { organizationContext: req.organizationContext, sectorNames: req.sectorNames },
      executedById: opts.executedById ?? null,
      durationMs: Date.now() - startedAt,
    },
  });

  if (!output || errors.length > 0) {
    throw new Error(`No se pudo generar el cuestionario personalizado: ${errors.join('; ') || 'la IA no devolvió resultado.'}`);
  }
  return output;
}
