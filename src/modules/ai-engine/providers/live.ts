import 'server-only';
import { getEnv } from '@/lib/env';
import {
  meetingAnalysisOutputSchema,
  type MeetingAnalysisOutput,
  personalizedQuestionnaireOutputSchema,
  validatePersonalizedQuestionnaire,
  type PersonalizedQuestionnaireOutput,
} from '../schemas';
import type { AIProvider, MeetingAnalysisRequest, PersonalizedQuestionnaireRequest } from '../types';

const MEETING_ANALYSIS_SYSTEM_PROMPT = `Eres un asistente de extracción de información para un diagnóstico preliminar de
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

const PERSONALIZED_QUESTIONNAIRE_SYSTEM_PROMPT = `Eres un asistente de un abogado chileno especializado en protección de
datos personales (Ley N.º 19.628 y Ley N.º 21.719). Tu tarea es redactar un cuestionario de diagnóstico
personalizado, en español de Chile, que el abogado enviará DIRECTAMENTE al cliente para que lo responda.
Debes devolver EXCLUSIVAMENTE un objeto JSON que cumpla el esquema indicado. Reglas estrictas:
- Usa un tono cercano, profesional y en segunda persona (tutea al cliente), como si el abogado le
  escribiera directamente. Si se entrega un nombre de contacto, salúdalo por su nombre.
- CADA pregunta debe referirse a un hecho, herramienta, cifra, nombre o práctica que APAREZCA
  LITERALMENTE en la transcripción o en los hallazgos del sitio web entregados como evidencia. Nunca
  inventes un proveedor, monto, plataforma o dato que no esté en esa evidencia. Si quieres preguntar
  por algo que no está confirmado en la evidencia pero es razonable sospechar (p. ej., "¿usan algún
  sistema para guardar las respuestas del formulario?"), formúlalo igualmente como pregunta abierta,
  nunca como una afirmación de hecho.
- Todas las preguntas deben tener forma interrogativa (terminar en "?"), nunca ser una afirmación.
  El cuestionario pregunta, no concluye — no emitas conclusiones jurídicas ni afirmes que algo
  "infringe" o "cumple" una norma.
- No cites artículos de ley ni asesores jurídicos: este documento solo recopila información del
  negocio del cliente, no contiene análisis legal.
- Organiza el contenido en módulos temáticos (mínimo 6, máximo 20 según la riqueza de la evidencia
  disponible), cada uno con un título corto, una frase de introducción, y una lista de preguntas
  numeradas dentro de ese módulo. No incluyas el número de módulo en el título (el sistema lo agrega
  automáticamente); usa solo el nombre del tema (ej. "Canal WhatsApp y mensajería").
- El campo "greeting" es el saludo inicial y la explicación de para qué sirve el cuestionario. El
  campo "confidentialityNote" es una frase breve sobre confidencialidad. El campo "closingNote" pide
  devolver el cuestionario respondido.
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

  async function callAnthropic(systemPrompt: string, prompt: string): Promise<string> {
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
          system: systemPrompt,
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

  async function callOpenAI(systemPrompt: string, prompt: string): Promise<string> {
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
            { role: 'system', content: systemPrompt },
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

  async function callModel(systemPrompt: string, prompt: string): Promise<string> {
    return env.AI_PROVIDER === 'openai' ? callOpenAI(systemPrompt, prompt) : callAnthropic(systemPrompt, prompt);
  }

  function parseJsonOrThrow(raw: string): unknown {
    try {
      return JSON.parse(raw);
    } catch {
      throw new Error('La IA no devolvió JSON válido. Salida rechazada (no se usan datos no estructurados).');
    }
  }

  return {
    provider: env.AI_PROVIDER,
    model: env.AI_MODEL,
    async analyzeMeetingTranscript(req: MeetingAnalysisRequest): Promise<MeetingAnalysisOutput> {
      const prompt = `Organización: ${req.organizationContext.legalName}\nSectores conocidos: ${req.organizationContext.knownSectors.join(', ') || 'ninguno aún'}\n\nTranscripción:\n"""\n${req.transcriptText}\n"""\n\nDevuelve el JSON con la forma: { "findings": [...], "contradictions": [...], "unknowns": [...] }.`;

      const raw = await callModel(MEETING_ANALYSIS_SYSTEM_PROMPT, prompt);
      const parsedJson = parseJsonOrThrow(raw);

      const parsed = meetingAnalysisOutputSchema.safeParse(parsedJson);
      if (!parsed.success) {
        throw new Error(`Salida de IA rechazada por no cumplir el esquema: ${parsed.error.message}`);
      }
      return parsed.data;
    },
    async generatePersonalizedQuestionnaire(req: PersonalizedQuestionnaireRequest): Promise<PersonalizedQuestionnaireOutput> {
      const prompt = `Cliente: ${req.organizationContext.legalName}${req.organizationContext.commercialName ? ` (nombre comercial: ${req.organizationContext.commercialName})` : ''}
Sitio web: ${req.organizationContext.website ?? 'no informado'}
Persona de contacto: ${req.organizationContext.contactName ?? 'no informada'}
Sectores detectados: ${req.sectorNames.join(', ') || 'ninguno aún'}

Extractos relevantes de la transcripción de la reunión:
"""
${req.transcriptExcerpts.join('\n---\n') || '(sin transcripción disponible)'}
"""

Hallazgos del análisis del sitio web:
"""
${req.webFindingSummaries.join('\n') || '(sin análisis web disponible)'}
"""

Otros hallazgos ya extraídos del diagnóstico:
"""
${req.existingFindingSummaries.join('\n') || '(ninguno)'}
"""

Devuelve el JSON con la forma: { "greeting": "...", "confidentialityNote": "...", "modules": [{ "title": "...", "intro": "...", "questions": ["...", "..."] }], "closingNote": "..." }.`;

      const raw = await callModel(PERSONALIZED_QUESTIONNAIRE_SYSTEM_PROMPT, prompt);
      const parsedJson = parseJsonOrThrow(raw);

      const parsed = personalizedQuestionnaireOutputSchema.safeParse(parsedJson);
      if (!parsed.success) {
        throw new Error(`Salida de IA rechazada por no cumplir el esquema: ${parsed.error.message}`);
      }
      const formErrors = validatePersonalizedQuestionnaire(parsed.data);
      if (formErrors.length > 0) {
        throw new Error(`Salida de IA rechazada: ${formErrors.join('; ')}`);
      }
      return parsed.data;
    },
  };
}
