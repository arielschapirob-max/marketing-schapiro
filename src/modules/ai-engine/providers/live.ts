import 'server-only';
import { getEnv } from '@/lib/env';
import {
  meetingAnalysisOutputSchema,
  type MeetingAnalysisOutput,
  personalizedQuestionnaireOutputSchema,
  personalizedQuestionnairePlanSchema,
  personalizedQuestionnaireModuleContentSchema,
  validatePersonalizedQuestionnaire,
  type PersonalizedQuestionnaireOutput,
  type PersonalizedQuestionnaireModulePlan,
  type PersonalizedQuestionnaireModule,
} from '../schemas';
import type { AIProvider, MeetingAnalysisRequest, PersonalizedQuestionnaireRequest } from '../types';

// Máximo puramente técnico (protección de costo/tiempo), nunca un objetivo:
// ver la regla central en QUESTIONNAIRE_PLANNING_SYSTEM_PROMPT.
const MAX_MODULES_SAFETY_CAP = 25;

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

// FASE 1: planificación de la estructura (portada, textos, y la lista de
// módulos que hacen falta). No decide todavía el contenido detallado de cada
// módulo — eso se redacta después, módulo por módulo, en QUESTIONNAIRE_MODULE_SYSTEM_PROMPT.
const QUESTIONNAIRE_PLANNING_SYSTEM_PROMPT = `Eres un abogado chileno especializado en protección de datos
personales (Ley N.º 19.628 y Ley N.º 21.719), planificando la ESTRUCTURA de un cuestionario de diagnóstico de
nivel profesional que se enviará DIRECTAMENTE al cliente. Debes devolver EXCLUSIVAMENTE un objeto JSON que
cumpla el esquema indicado — nada de texto fuera del JSON.

TU ÚNICA TAREA aquí es decidir la portada, los textos introductorios y la LISTA DE MÓDULOS que hacen falta. El
contenido detallado (las preguntas) de cada módulo se redactará después, en una llamada separada por módulo.

REGLA CENTRAL — nada de números fijos: el número de módulos NO está fijado de antemano ni existe un rango
"correcto". Dos clientes distintos pueden necesitar 4 módulos o 20 según lo que la reunión y el sitio web
realmente muestren sobre ESA organización específica — una organización no es un formulario estándar.
Guíate por esto:
- Cada módulo debe corresponder a un tema o proceso claramente distinto y respaldado por evidencia real (una
  herramienta, un flujo de trabajo, un tipo de dato, un área del negocio) mencionado en la transcripción o en
  el sitio web.
- No dividas artificialmente un mismo tema en varios módulos para inflar el número, ni fusiones temas
  distintos en uno solo para acortar la lista.
- Si la evidencia es escasa (reunión breve, sitio web genérico), un cuestionario corto y honesto es preferible
  a inventar módulos sin sustento — puedes incluir módulos de preguntas exploratorias genuinas para llenar
  esos vacíos, pero siempre como pregunta, nunca como hecho asumido.
- Única guía de sanidad técnica (no un objetivo a alcanzar): no generes más de ${MAX_MODULES_SAFETY_CAP}
  módulos.

REGLA ANTI-ALUCINACIÓN (no negociable): cada hecho, herramienta, cifra o nombre propio que menciones en la
portada o en la presentación debe aparecer LITERALMENTE en la evidencia entregada. Nunca inventes un
proveedor, monto, plataforma o dato que no esté en esa evidencia.

Para cada elemento de "modulePlans" entrega: "title" (corto, específico del negocio real — preferible algo
como "La ficha de brief (formulario de ingreso)" que un genérico "Organización" — sin numeración, el sistema
la agrega), "areaResponsible" (área del cliente que debería responder, p. ej. "Gerencia", "Tecnología",
"Administración" — infiere según el contenido), "phase" ("FASE_1_ESENCIAL" para lo indispensable en un
diagnóstico preliminar, "FASE_2_AMPLIACION" para lo complementario), y "focus": 1-2 frases indicando qué debe
cubrir ese módulo y qué evidencia concreta lo motiva — este campo es solo una guía interna para la siguiente
etapa, no aparece en el documento final.

Además entrega:
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
- "glossary": términos técnicos o del rubro del cliente que aparecerán en las preguntas de los módulos y que
  un no especialista podría no conocer (p. ej. si el rubro es salud: "ficha clínica"; si es tecnológico:
  "encargado del tratamiento", "cifrado"), con definiciones de una sola frase. Vacío si no aplica ninguno.
- "documentChecklist": documentos concretos que convendría pedir que el cliente adjunte (contratos, políticas,
  capturas de pantalla) dados los hallazgos — vacío si no hay ninguno claro.
- "closingNote": una frase breve pidiendo devolver el cuestionario respondido.`;

// FASE 2: contenido detallado de UN módulo (llamada independiente por módulo,
// con su propio presupuesto de tokens, para que la profundidad de un módulo
// con mucha evidencia no consuma el espacio de los demás ni quede cortada).
const QUESTIONNAIRE_MODULE_SYSTEM_PROMPT = `Eres un abogado chileno especializado en protección de datos
personales, redactando el contenido de UN módulo de un cuestionario de diagnóstico que se enviará
DIRECTAMENTE al cliente para que lo responda y lo devuelva. Debes devolver EXCLUSIVAMENTE un objeto JSON que
cumpla el esquema indicado — nada de texto fuera del JSON.

ESTÁNDAR DE CALIDAD (no un formulario genérico): este módulo debe leerse como si un abogado que estudió a
fondo la reunión y el sitio web de ESTE cliente específico lo hubiera escrito a mano para él, sobre el tema
puntual de este módulo. Usa el nombre real del negocio, las herramientas/plataformas/proveedores mencionados
por su nombre propio, las cifras concretas mencionadas y los ejemplos reales de su operación — siempre que
aparezcan literalmente en la evidencia entregada. Una pregunta que podría enviarse sin cambios a cualquier
empresa del mismo rubro está mal hecha.

REGLA ANTI-ALUCINACIÓN (no negociable): cada mención de un hecho, herramienta, cifra, nombre propio o práctica
debe aparecer LITERALMENTE en la transcripción, en los hallazgos del sitio web, o en los hallazgos ya
extraídos que se entregan como evidencia. Nunca inventes un proveedor, monto, plataforma o dato que no esté en
esa evidencia. Si quieres indagar algo que no está confirmado pero es razonable sospechar dado el giro del
negocio, formúlalo igual como pregunta abierta genuina (nunca como una afirmación de hecho, y nunca fingiendo
que ya sabes la respuesta).

FORMA:
- Cada pregunta "abierta" debe tener forma interrogativa real (terminar en "?"), nunca ser una afirmación. El
  cuestionario pregunta, no concluye — no emitas conclusiones jurídicas ni afirmes que algo "infringe" o
  "cumple" una norma. No cites artículos de ley: este documento solo recopila información del negocio.
- Usa también preguntas "cerradas" quirúrgicamente elegidas (con 2 a 4 opciones tipo checkbox, más "No sé"
  cuando aplique) para los puntos donde una respuesta acotada basta. Marca "allowsDetail: true" solo cuando
  de verdad conviene dejar espacio para explicar la opción elegida.
- Profundidad sin número fijo: tantas preguntas como el tema de ESTE módulo amerite según la evidencia real
  disponible para él — un módulo con mucha evidencia concreta puede tener 6 u 8 preguntas; uno más acotado,
  2 o 3. No rellenes con preguntas genéricas solo para alcanzar un número.
- No incluyas numeración en el texto de las preguntas (el sistema la agrega automáticamente).
- "intro": una frase breve introduciendo el módulo al lector, coherente con su enfoque.`;

function buildEvidenceBlock(req: PersonalizedQuestionnaireRequest): string {
  return `Preparado por: ${req.preparedByName}
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
"""`;
}

/**
 * Proveedor "en vivo" para Anthropic/OpenAI. Requiere AI_API_KEY configurada.
 * Implementado como llamada HTTP directa (sin SDK) para minimizar
 * dependencias. Si la llamada falla o la salida no valida contra el esquema
 * Zod, se lanza un error explícito — nunca se degrada silenciosamente a
 * datos inventados.
 */
export function createLiveAIProvider(): AIProvider {
  const env = getEnv();

  async function callAnthropic(systemPrompt: string, prompt: string, maxTokens = 8192): Promise<string> {
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
          max_tokens: maxTokens,
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

  async function callOpenAI(systemPrompt: string, prompt: string, maxTokens = 8192): Promise<string> {
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
          max_tokens: maxTokens,
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

  async function callModel(systemPrompt: string, prompt: string, maxTokens?: number): Promise<string> {
    return env.AI_PROVIDER === 'openai'
      ? callOpenAI(systemPrompt, prompt, maxTokens)
      : callAnthropic(systemPrompt, prompt, maxTokens);
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
      const evidenceBlock = buildEvidenceBlock(req);

      // FASE 1: planificar portada, textos y la lista de módulos (sin número fijo).
      const planPrompt = `${evidenceBlock}

Devuelve el JSON con esta forma exacta (los "..." son ejemplos de contenido, no literal; incluye tantos
elementos en "modulePlans" como la evidencia realmente amerite):
{
  "coverPage": { "title": "CUESTIONARIO DE DIAGNÓSTICO", "subtitle": "...", "lawReference": "Ley N.º 21.719 sobre protección de datos personales", "preparedFor": "...", "contacts": "..." },
  "presentation": ["párrafo 1", "párrafo 2"],
  "howToRespond": ["instrucción 1", "instrucción 2"],
  "confidentialityNote": "...",
  "glossary": [{ "term": "...", "definition": "..." }],
  "documentChecklist": ["documento 1"],
  "closingNote": "...",
  "modulePlans": [{ "title": "...", "areaResponsible": "...", "phase": "FASE_1_ESENCIAL", "focus": "..." }]
}`;

      const planRaw = await callModel(QUESTIONNAIRE_PLANNING_SYSTEM_PROMPT, planPrompt, 4096);
      const planParsed = personalizedQuestionnairePlanSchema.safeParse(parseJsonOrThrow(planRaw));
      if (!planParsed.success) {
        throw new Error(`Planificación del cuestionario rechazada por no cumplir el esquema: ${planParsed.error.message}`);
      }
      const plan = planParsed.data;
      const modulePlans: PersonalizedQuestionnaireModulePlan[] = plan.modulePlans.slice(0, MAX_MODULES_SAFETY_CAP);

      // FASE 2: redactar el contenido de cada módulo por separado, con su
      // propio presupuesto de tokens (secuencial, para no exceder los límites
      // de tasa del proveedor).
      const modules: PersonalizedQuestionnaireModule[] = [];
      for (const [i, modulePlan] of modulePlans.entries()) {
        const modulePrompt = `${evidenceBlock}

Módulo a redactar (${i + 1} de ${modulePlans.length}): "${modulePlan.title}"
Área responsable sugerida: ${modulePlan.areaResponsible}
Fase: ${modulePlan.phase}
Enfoque de este módulo (guía interna, no citar textualmente): ${modulePlan.focus}

Devuelve el JSON con esta forma exacta (los "..." son ejemplos de contenido, no literal):
{
  "intro": "...",
  "questions": [{ "text": "...?", "type": "abierta" }, { "text": "...?", "type": "cerrada", "options": ["Sí", "No", "No sé"], "allowsDetail": true }]
}`;

        const moduleRaw = await callModel(QUESTIONNAIRE_MODULE_SYSTEM_PROMPT, modulePrompt, 3072);
        const moduleParsed = personalizedQuestionnaireModuleContentSchema.safeParse(parseJsonOrThrow(moduleRaw));
        if (!moduleParsed.success) {
          throw new Error(`Contenido del módulo "${modulePlan.title}" rechazado por no cumplir el esquema: ${moduleParsed.error.message}`);
        }
        modules.push({
          title: modulePlan.title,
          areaResponsible: modulePlan.areaResponsible,
          phase: modulePlan.phase,
          intro: moduleParsed.data.intro,
          questions: moduleParsed.data.questions.map((q, qi) => ({ ...q, number: `${i + 1}.${qi + 1}` })),
        });
      }

      const output: PersonalizedQuestionnaireOutput = {
        coverPage: plan.coverPage,
        presentation: plan.presentation,
        howToRespond: plan.howToRespond,
        confidentialityNote: plan.confidentialityNote,
        glossary: plan.glossary,
        modules,
        documentChecklist: plan.documentChecklist,
        closingNote: plan.closingNote,
      };

      const parsed = personalizedQuestionnaireOutputSchema.safeParse(output);
      if (!parsed.success) {
        throw new Error(`Cuestionario ensamblado rechazado por no cumplir el esquema: ${parsed.error.message}`);
      }
      const formErrors = validatePersonalizedQuestionnaire(parsed.data);
      if (formErrors.length > 0) {
        throw new Error(`Cuestionario ensamblado rechazado: ${formErrors.join('; ')}`);
      }
      return parsed.data;
    },
  };
}
