import 'server-only';
import { db } from '@/lib/db';
import { getEnv, isMockAI } from '@/lib/env';
import { mockAIProvider } from './providers/mock';
import type { AIProvider, MeetingAnalysisRequest } from './types';
import { validateNoHallucination, type MeetingAnalysisOutput } from './schemas';

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
