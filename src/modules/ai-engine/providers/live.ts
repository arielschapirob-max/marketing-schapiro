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

const PERSONALIZED_QUESTIONNAIRE_SYSTEM_PROMPT = `Eres un abogado chileno especializado en protección de datos
personales (Ley N.º 19.628 y Ley N.º 21.719), redactando un cuestionario de diagnóstico de nivel profesional
que se enviará DIRECTAMENTE al cliente para que lo responda y lo devuelva. Debes devolver EXCLUSIVAMENTE un
objeto JSON que cumpla el esquema indicado — nada de texto fuera del JSON.

ESTÁNDAR DE CALIDAD (no un formulario genérico): el documento debe leerse como si un abogado que estudió a
fondo la reunión y el sitio web de ESTE cliente específico lo hubiera escrito a mano para él. Usa el nombre
real del negocio, su giro real, las herramientas/plataformas/proveedores mencionados por su nombre propio, las
cifras concretas mencionadas (montos, cantidades, plazos), y los ejemplos reales de su operación (nombres de
productos, de clientes de portafolio, de sistemas internos) — siempre que aparezcan literalmente en la
evidencia entregada. Un cuestionario que podría enviarse sin cambios a cualquier empresa del mismo rubro está
mal hecho.

REGLA ANTI-ALUCINACIÓN (no negociable): cada mención de un hecho, herramienta, cifra, nombre propio o práctica
debe aparecer LITERALMENTE en la transcripción, en los hallazgos del sitio web, o en los hallazgos ya
extraídos que se entregan como evidencia. Nunca inventes un proveedor, monto, plataforma o dato que no esté en
esa evidencia. Si quieres indagar algo que no está confirmado pero es razonable sospechar dado el giro del
negocio, formúlalo igual como pregunta abierta genuina (nunca como una afirmación de hecho, y nunca fingiendo
que ya sabes la respuesta).

FORMA:
- Cada pregunta "abierta" debe tener forma interrogativa real (terminar en "?"), nunca ser una afirmación.
  El cuestionario pregunta, no concluye — no emitas conclusiones jurídicas ni afirmes que algo "infringe" o
  "cumple" una norma. No cites artículos de ley: este documento solo recopila información del negocio.
- Usa también preguntas "cerradas" quirúrgicamente elegidas (con 2 a 4 opciones tipo checkbox, más "No sé"
  cuando aplique) para los puntos donde una respuesta acotada basta — igual que alternarías entre pregunta
  abierta y de alternativas al conversar con el cliente. Marca "allowsDetail: true" solo cuando de verdad
  conviene dejar espacio para explicar la opción elegida.
- Organiza el contenido en 6 a 9 módulos temáticos específicos del negocio real (no genéricos como
  "Organización" a secas: preferible algo como "La ficha de brief (formulario de ingreso)" o "Plataforma de
  órdenes digitales de derivadores" cuando la evidencia lo permite), con 2 a 4 preguntas por módulo. Cada
  módulo lleva: título corto (sin numeración, el sistema la agrega), "areaResponsible" (a qué área del
  cliente le correspondería responder, p. ej. "Gerencia", "Tecnología", "Administración" — infiere según el
  contenido), "phase" ("FASE_1_ESENCIAL" para lo indispensable para un diagnóstico preliminar,
  "FASE_2_AMPLIACION" para lo complementario), una frase de introducción breve, y preguntas numeradas "N.M".
- LÍMITE DE ESPACIO (crítico): tu respuesta tiene un límite de tokens. Es preferible un JSON más corto pero
  COMPLETO y bien cerrado, con menos módulos o preguntas de las permitidas, a uno más largo que quede
  cortado a la mitad y sea inválido. Si notas que te estás quedando sin espacio, prioriza cerrar
  correctamente el JSON (menos módulos, glosario más breve) antes que agotar el máximo permitido. Nunca
  dejes una respuesta a medio terminar.
- "coverPage": title ("CUESTIONARIO DE DIAGNÓSTICO"), subtitle (una frase describiendo el propósito),
  lawReference ("Ley N.º 21.719 sobre protección de datos personales"), preparedFor (nombre del cliente, con
  una frase breve entre paréntesis describiendo su giro si se conoce), contacts (nombre(s) de contacto si se
  conocen, si no "No informado").
- "presentation": 2 a 3 párrafos breves como los de una carta de presentación real: qué es este cuestionario,
  por qué se diseñó específicamente para la operación real de este cliente (menciona 2-3 detalles concretos
  de su negocio aquí), y qué se hará con las respuestas.
- "howToRespond": 2 a 4 instrucciones breves sobre cómo completar el documento (que "No sé" es una respuesta
  válida, que se puede adjuntar documentos, etc.).
- "confidentialityNote": una frase sobre confidencialidad de la información entregada.
- "glossary": máximo 6 términos técnicos o del rubro del cliente que aparezcan en las preguntas y que un no
  especialista podría no conocer (p. ej. si el rubro es salud: "ficha clínica"; si es tecnológico: términos
  como "encargado del tratamiento", "cifrado"), con definiciones de una sola frase. Vacío si no aplica ningún
  término especializado.
- "documentChecklist": máximo 5 documentos concretos que convendría pedir que el cliente adjunte (contratos,
  políticas, capturas de pantalla) dados los hallazgos — vacío si no hay ninguno claro.
- "closingNote": una frase breve pidiendo devolver el cuestionario respondido.`;

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
          max_tokens: 8192,
          system: systemPrompt,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(`Anthropic API respondió ${res.status}: ${await res.text()}`);
      }
      const data = (await res.json()) as { content: Array<{ type: string; text?: string }>; stop_reason?: string };
      const text = data.content.find((c) => c.type === 'text')?.text;
      if (!text) throw new Error('Respuesta de Anthropic sin contenido de texto.');
      if (data.stop_reason === 'max_tokens') {
        throw new Error('La respuesta de la IA se cortó por alcanzar el límite de tokens antes de terminar. Intente de nuevo (el sistema ya pide un contenido más acotado para evitar esto).');
      }
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
          max_tokens: 8192,
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
    // Algunos modelos envuelven el JSON en un bloque de código markdown pese a
    // la instrucción de no hacerlo; se despoja ese envoltorio antes de
    // rechazar la salida como no estructurada.
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/, '')
      .trim();
    try {
      return JSON.parse(cleaned);
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
      const prompt = `Preparado por: ${req.preparedByName}
Cliente: ${req.organizationContext.legalName}${req.organizationContext.commercialName ? ` (nombre comercial: ${req.organizationContext.commercialName})` : ''}
Giro / actividad económica declarada: ${req.organizationContext.economicActivity.join(', ') || 'no informado'}
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

Devuelve el JSON con esta forma exacta (los "..." son ejemplos de contenido, no literal):
{
  "coverPage": { "title": "CUESTIONARIO DE DIAGNÓSTICO", "subtitle": "...", "lawReference": "Ley N.º 21.719 sobre protección de datos personales", "preparedFor": "...", "contacts": "..." },
  "presentation": ["párrafo 1", "párrafo 2"],
  "howToRespond": ["instrucción 1", "instrucción 2"],
  "confidentialityNote": "...",
  "glossary": [{ "term": "...", "definition": "..." }],
  "modules": [{ "title": "...", "areaResponsible": "...", "phase": "FASE_1_ESENCIAL", "intro": "...", "questions": [{ "number": "1.1", "text": "...?", "type": "abierta" }, { "number": "1.2", "text": "...?", "type": "cerrada", "options": ["Sí", "No", "No sé"], "allowsDetail": true }] }],
  "documentChecklist": ["documento 1"],
  "closingNote": "..."
}`;

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
