import type { AIProvider, MeetingAnalysisRequest } from '../types';
import type { ExtractedFinding, MeetingAnalysisOutput } from '../schemas';
import { SECTORS } from '@/modules/legal-engine/sectors';

/**
 * Proveedor MOCK del motor de IA.
 *
 * No llama a ningún servicio externo: aplica un motor de heurísticas
 * léxicas en español sobre la transcripción, con ventanas de contexto como
 * evidencia y niveles de certeza conservadores (nunca CONFIRMADO salvo que
 * la frase clave aparezca de forma explícita y sin negación cercana).
 *
 * Este es el proveedor activo por defecto (AI_PROVIDER=mock) y el que se
 * usa en todas las pruebas de este proyecto. Cuando se configure
 * AI_PROVIDER=anthropic|openai con una API key real, el proveedor
 * equivalente en providers/live.ts reemplaza este análisis por una llamada
 * real al modelo, validada contra el mismo esquema Zod.
 */

interface LexiconEntry {
  type: ExtractedFinding['type'];
  pattern: RegExp;
  describe: (match: string) => string;
  norm?: ExtractedFinding['norm'];
  requiresLegalValidation?: boolean;
}

const NEGATION_WINDOW = 25;

function hasNearbyNegation(text: string, index: number): boolean {
  const start = Math.max(0, index - NEGATION_WINDOW);
  const windowText = text.slice(start, index).toLowerCase();
  return /\b(no|nunca|jamás|tampoco)\b/.test(windowText);
}

function excerpt(text: string, index: number, matchLength: number): string {
  const start = Math.max(0, index - 60);
  const end = Math.min(text.length, index + matchLength + 60);
  return `…${text.slice(start, end).trim()}…`;
}

const LEXICON: LexiconEntry[] = [
  // Actividades de tratamiento
  { type: 'PROCESSING_ACTIVITY', pattern: /atenci[oó]n (?:de|a) pacientes|atendemos pacientes/gi, describe: () => 'Atención de pacientes' },
  { type: 'PROCESSING_ACTIVITY', pattern: /matr[ií]cula/gi, describe: () => 'Proceso de matrícula de estudiantes' },
  { type: 'PROCESSING_ACTIVITY', pattern: /reclutamiento|proceso de selecci[oó]n/gi, describe: () => 'Reclutamiento y selección de personal' },
  { type: 'PROCESSING_ACTIVITY', pattern: /n[oó]mina|liquidaci[oó]n de sueldo/gi, describe: () => 'Gestión de nómina y remuneraciones' },
  { type: 'PROCESSING_ACTIVITY', pattern: /campa[nñ]a(?:s)? de marketing|email marketing/gi, describe: () => 'Campañas de marketing directo' },
  { type: 'PROCESSING_ACTIVITY', pattern: /evaluaci[oó]n (?:de )?crediticia|scoring/gi, describe: () => 'Evaluación de riesgo crediticio' },
  { type: 'PROCESSING_ACTIVITY', pattern: /checkout|carro de compra|pasarela de pago/gi, describe: () => 'Proceso de pago en línea (checkout)' },
  { type: 'PROCESSING_ACTIVITY', pattern: /agendamiento de horas|reserva de hora/gi, describe: () => 'Agendamiento de horas / reservas' },
  { type: 'PROCESSING_ACTIVITY', pattern: /videovigilancia|c[aá]maras de seguridad/gi, describe: () => 'Videovigilancia' },

  // Titulares
  { type: 'DATA_SUBJECT_CATEGORY', pattern: /pacientes?/gi, describe: () => 'Pacientes' },
  { type: 'DATA_SUBJECT_CATEGORY', pattern: /clientes?/gi, describe: () => 'Clientes' },
  { type: 'DATA_SUBJECT_CATEGORY', pattern: /trabajadores?|empleados?/gi, describe: () => 'Trabajadores' },
  { type: 'DATA_SUBJECT_CATEGORY', pattern: /alumnos?|estudiantes?/gi, describe: () => 'Alumnos / estudiantes' },
  { type: 'DATA_SUBJECT_CATEGORY', pattern: /apoderados?/gi, describe: () => 'Apoderados' },
  { type: 'DATA_SUBJECT_CATEGORY', pattern: /postulantes?/gi, describe: () => 'Postulantes a empleo' },
  { type: 'DATA_SUBJECT_CATEGORY', pattern: /usuarios? (?:de la plataforma|final(?:es)?)/gi, describe: () => 'Usuarios finales de la plataforma' },

  // Categorías de datos
  { type: 'DATA_CATEGORY', pattern: /rut/gi, describe: () => 'RUT / identificación' },
  { type: 'DATA_CATEGORY', pattern: /correo electr[oó]nico|email/gi, describe: () => 'Correo electrónico' },
  { type: 'DATA_CATEGORY', pattern: /direcci[oó]n (?:particular|de despacho|domicilio)/gi, describe: () => 'Dirección' },
  { type: 'DATA_CATEGORY', pattern: /tarjeta de cr[eé]dito|n[uú]mero de tarjeta/gi, describe: () => 'Datos de tarjeta de pago' },
  { type: 'DATA_CATEGORY', pattern: /cuenta bancaria/gi, describe: () => 'Datos bancarios' },
  { type: 'DATA_CATEGORY', pattern: /geolocalizaci[oó]n|ubicaci[oó]n (?:gps|en tiempo real)/gi, describe: () => 'Geolocalización' },
  { type: 'DATA_CATEGORY', pattern: /notas|calificaciones|rendimiento acad[eé]mico/gi, describe: () => 'Rendimiento académico' },

  // Datos sensibles
  { type: 'SENSITIVE_DATA', pattern: /ficha cl[ií]nica/gi, describe: () => 'Ficha clínica', norm: 'Ley N.º 20.584' },
  { type: 'SENSITIVE_DATA', pattern: /datos? de salud|diagn[oó]stico m[eé]dico|historial m[eé]dico/gi, describe: () => 'Datos de salud' },
  { type: 'SENSITIVE_DATA', pattern: /licencia m[eé]dica/gi, describe: () => 'Licencias médicas' },
  { type: 'SENSITIVE_DATA', pattern: /afiliaci[oó]n sindical|afiliaci[oó]n gremial/gi, describe: () => 'Afiliación sindical o gremial' },
  { type: 'SENSITIVE_DATA', pattern: /origen [eé]tnico|orientaci[oó]n sexual|creencias? religiosas?/gi, describe: (m) => `Dato sensible: ${m}` },
  { type: 'SENSITIVE_DATA', pattern: /biom[eé]trico|huella dactilar|reconocimiento facial/gi, describe: () => 'Datos biométricos' },
  { type: 'SENSITIVE_DATA', pattern: /situaci[oó]n socioecon[oó]mica vulnerable/gi, describe: () => 'Situación socioeconómica vulnerable' },

  // Tecnologías
  { type: 'TECHNOLOGY', pattern: /\b(crm|erp)\b/gi, describe: (m) => `Sistema ${m.toUpperCase()}` },
  { type: 'TECHNOLOGY', pattern: /planilla excel|hoja de c[aá]lculo/gi, describe: () => 'Planillas Excel / hojas de cálculo' },
  { type: 'TECHNOLOGY', pattern: /google drive|google workspace/gi, describe: (m) => m },
  { type: 'TECHNOLOGY', pattern: /\baws\b|amazon web services/gi, describe: () => 'Amazon Web Services (AWS)' },
  { type: 'TECHNOLOGY', pattern: /azure|microsoft cloud/gi, describe: () => 'Microsoft Azure' },
  { type: 'TECHNOLOGY', pattern: /whatsapp/gi, describe: () => 'WhatsApp (canal de atención)' },
  { type: 'TECHNOLOGY', pattern: /inteligencia artificial|chatbot/gi, describe: (m) => m },
  { type: 'TECHNOLOGY', pattern: /ficha cl[ií]nica electr[oó]nica/gi, describe: () => 'Sistema de ficha clínica electrónica' },

  // Proveedores conocidos
  { type: 'PROVIDER', pattern: /mailchimp|salesforce|hubspot|softland|defontana|transbank|webpay|flow\.cl|mercado ?pago/gi, describe: (m) => m },
  { type: 'PROVIDER', pattern: /fonasa|isapre/gi, describe: (m) => m },

  // Terceros
  { type: 'THIRD_PARTY', pattern: /laboratorio externo/gi, describe: () => 'Laboratorio clínico externo' },
  { type: 'THIRD_PARTY', pattern: /aseguradora|reaseguradora/gi, describe: (m) => m },
  { type: 'THIRD_PARTY', pattern: /call center externo|outsourcing/gi, describe: (m) => m },

  // Transferencias internacionales
  { type: 'INTERNATIONAL_TRANSFER', pattern: /servidores? (?:en el extranjero|fuera de chile)/gi, describe: () => 'Servidores fuera de Chile' },
  { type: 'INTERNATIONAL_TRANSFER', pattern: /estados unidos|brasil|espa[nñ]a|irlanda|alemania/gi, describe: (m) => `Posible transferencia internacional hacia: ${m}` },

  // Incidentes
  { type: 'INCIDENT', pattern: /incidente de seguridad|filtraci[oó]n de datos|hackeo|brecha de seguridad|acceso no autorizado|ransomware/gi, describe: (m) => m },

  // Medidas de seguridad
  { type: 'SECURITY_MEASURE', pattern: /cifrado|encriptaci[oó]n/gi, describe: () => 'Cifrado de información' },
  { type: 'SECURITY_MEASURE', pattern: /respaldo|backup/gi, describe: () => 'Respaldo (backup) de información' },
  { type: 'SECURITY_MEASURE', pattern: /control de acceso/gi, describe: () => 'Control de acceso' },
  { type: 'SECURITY_MEASURE', pattern: /capacitaci[oó]n en seguridad|capacitaci[oó]n al personal/gi, describe: () => 'Capacitación del personal' },

  // Conservación
  { type: 'RETENTION_PRACTICE', pattern: /conservamos (?:la informaci[oó]n |los datos )?(?:por|durante) [^.,;]+/gi, describe: (m) => m },
  { type: 'RETENTION_PRACTICE', pattern: /guardamos (?:todo )?(?:de forma )?indefinida(?:mente)?/gi, describe: () => 'Conservación indefinida de datos (sin política de eliminación)' },

  // Documentos existentes
  { type: 'EXISTING_DOCUMENT', pattern: /pol[ií]tica de privacidad/gi, describe: () => 'Política de privacidad' },
  { type: 'EXISTING_DOCUMENT', pattern: /t[eé]rminos y condiciones/gi, describe: () => 'Términos y condiciones' },
  { type: 'EXISTING_DOCUMENT', pattern: /contrato de confidencialidad|acuerdo de confidencialidad/gi, describe: () => 'Acuerdo de confidencialidad' },
];

function extractSectorSignals(text: string): ExtractedFinding[] {
  const findings: ExtractedFinding[] = [];
  const lower = text.toLowerCase();
  for (const sector of SECTORS) {
    for (const indicator of sector.activationIndicators) {
      const idx = lower.indexOf(indicator.toLowerCase());
      if (idx >= 0) {
        findings.push({
          type: 'BUSINESS_ACTIVITY',
          description: `Actividad compatible con el sector "${sector.name}" (indicador: "${indicator}")`,
          certainty: 'INFERIDO',
          evidenceExcerpt: excerpt(text, idx, indicator.length),
          requiresLegalValidation: true,
          requiresClientConfirmation: true,
        });
        break;
      }
    }
  }
  return findings;
}

function runLexicon(text: string): ExtractedFinding[] {
  const findings: ExtractedFinding[] = [];
  const seen = new Set<string>();

  for (const entry of LEXICON) {
    const regex = new RegExp(entry.pattern);
    let match: RegExpExecArray | null;
    // eslint-disable-next-line no-cond-assign
    while ((match = regex.exec(text)) !== null) {
      const description = entry.describe(match[0]);
      const key = `${entry.type}:${description.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const negated = hasNearbyNegation(text, match.index);
      findings.push({
        type: entry.type,
        description,
        certainty: negated ? 'CONTRADICTORIO' : 'PROBABLE',
        evidenceExcerpt: excerpt(text, match.index, match[0].length),
        norm: entry.norm ?? null,
        requiresLegalValidation: entry.requiresLegalValidation ?? true,
        requiresClientConfirmation: negated,
      });

      if (regex.lastIndex === match.index) regex.lastIndex++;
    }
  }
  return findings;
}

function detectUnknowns(text: string): string[] {
  const unknowns: string[] = [];
  const patterns: Array<[RegExp, string]> = [
    [/no (?:s[eé]|estoy seguro|tenemos claro)[^.,;]*/gi, 'Información declarada como no conocida por el entrevistado'],
    [/hay que revisar(?:lo)?[^.,;]*/gi, 'Punto identificado como pendiente de revisión por la propia organización'],
  ];
  for (const [pattern, label] of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const m of matches.slice(0, 5)) {
        unknowns.push(`${label}: "${m.trim()}"`);
      }
    }
  }
  return unknowns;
}

export const mockAIProvider: AIProvider = {
  provider: 'mock',
  model: 'heuristic-lexicon-es-v1',
  async analyzeMeetingTranscript(req: MeetingAnalysisRequest): Promise<MeetingAnalysisOutput> {
    const text = req.transcriptText;
    const findings = [...runLexicon(text), ...extractSectorSignals(text)];
    const unknowns = detectUnknowns(text);

    return {
      findings,
      contradictions: findings
        .filter((f) => f.certainty === 'CONTRADICTORIO')
        .map((f) => ({
          description: `Posible contradicción respecto de: ${f.description}`,
          relatedFindingDescriptions: [f.description],
        })),
      unknowns,
    };
  },
};
