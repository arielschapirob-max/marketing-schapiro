import 'server-only';
import { getEnv } from '@/lib/env';
import { meetingAnalysisOutputSchema, type MeetingAnalysisOutput } from '../schemas';
import type { AIProvider, MeetingAnalysisRequest } from '../types';

const SYSTEM_PROMPT = `Eres un asistente de extracción de información para un diagnóstico preliminar de
protección de datos personales en Chile. Debes devolver EXCLUSIVAMENTE un objeto JSON que cumpla
el esquema indicado. Reglas estrictas:
- NUNCA inventes normas, artículos o autoridades. Si citas una norma, usa únicamente uno de estos
  valores exactos: "Ley N.º 19.628", "Ley N.º 21.719", "Ley N.º 20.584", "Ley N.º 21.663",
  "Ley N.º 21.459", "Constitución Política de la República". Si no estás seguro, deja el campo
  "norm" en null.
- NUNCA marques un hallazgo como CONFIRMADO si no hay una cita textual literal que lo respalde en
  "evidenceExcerpt".
- No emitas conclusiones jurídicas definitivas: solo hallazgos descriptivos y su nivel de certeza.
- No agregues texto fuera del JSON.`;

/**
 * Proveedor "en vivo" para Anthropic/OpenAI. Requiere AI_API_KEY configurada.
 * Implementado como llamada HTTP directa (sin SDK) para minimizar
 * dependencias. Si la llamada falla o la salida no valida contra el esquema
 * Zod, se lanza un error explícito — nunca se degrada silenciosamente a
 * datos inventados.
 */
export function createLiveAIProvider(): AIProvider {
  const env = getEnv();

  async function callAnthropic(prompt: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.AI_TIMEOUT_MS);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': env.AI_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: env.AI_MODEL,
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(`Anthropic API respondió ${res.status}: ${await res.text()}`);
      }
      const data = (await res.json()) as { content: Array<{ type: string; text?: string }> };
      const text = data.content.find((c) => c.type === 'text')?.text;
      if (!text) throw new Error('Respuesta de Anthropic sin contenido de texto.');
      return text;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function callOpenAI(prompt: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.AI_TIMEOUT_MS);
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${env.AI_API_KEY}`,
        },
        body: JSON.stringify({
          model: env.AI_MODEL,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: prompt },
          ],
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(`OpenAI API respondió ${res.status}: ${await res.text()}`);
      }
      const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
      const text = data.choices[0]?.message.content;
      if (!text) throw new Error('Respuesta de OpenAI sin contenido.');
      return text;
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    provider: env.AI_PROVIDER,
    model: env.AI_MODEL,
    async analyzeMeetingTranscript(req: MeetingAnalysisRequest): Promise<MeetingAnalysisOutput> {
      const prompt = `Organización: ${req.organizationContext.legalName}\nSectores conocidos: ${req.organizationContext.knownSectors.join(', ') || 'ninguno aún'}\n\nTranscripción:\n"""\n${req.transcriptText}\n"""\n\nDevuelve el JSON con la forma: { "findings": [...], "contradictions": [...], "unknowns": [...] }.`;

      const raw = env.AI_PROVIDER === 'openai' ? await callOpenAI(prompt) : await callAnthropic(prompt);

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(raw);
      } catch {
        throw new Error('La IA no devolvió JSON válido. Salida rechazada (no se usan datos no estructurados).');
      }

      const parsed = meetingAnalysisOutputSchema.safeParse(parsedJson);
      if (!parsed.success) {
        throw new Error(`Salida de IA rechazada por no cumplir el esquema: ${parsed.error.message}`);
      }
      return parsed.data;
    },
  };
}
