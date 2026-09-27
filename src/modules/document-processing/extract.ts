import 'server-only';
import mammoth from 'mammoth';
import { isMockOCR } from '@/lib/env';

export interface ExtractionResult {
  text: string;
  usedOcr: boolean;
  ocrProvider?: string;
  confidence?: number;
  pageCount?: number;
  pages?: Array<{ page: number; text: string }>;
}

export async function extractText(buffer: Buffer, extension: string): Promise<ExtractionResult> {
  switch (extension) {
    case '.txt':
    case '.csv':
      return { text: buffer.toString('utf-8'), usedOcr: false };

    case '.pdf': {
      // Import perezoso: pdf-parse ejecuta código de auto-test al cargarse
      // que espera un archivo de muestra; cargarlo solo cuando se necesita
      // evita fallos en entornos donde no existe ese archivo de ejemplo.
      const pdfParse = (await import('pdf-parse')).default;
      const result = await pdfParse(buffer);
      return {
        text: result.text,
        usedOcr: false,
        pageCount: result.numpages,
      };
    }

    case '.docx': {
      const result = await mammoth.extractRawText({ buffer });
      return { text: result.value, usedOcr: false };
    }

    case '.xlsx':
      // PENDIENTE DE IMPLEMENTACIÓN: extracción estructurada de hojas de
      // cálculo (se requiere una librería adicional tipo `xlsx`/`exceljs`).
      // Por ahora se informa el vacío de forma explícita en vez de fallar.
      return { text: '[PENDIENTE DE IMPLEMENTACIÓN: extracción de contenido XLSX]', usedOcr: false };

    case '.png':
    case '.jpg':
    case '.jpeg':
      return runMockOcr();

    default:
      throw new Error(`Extracción de texto no soportada para la extensión ${extension}.`);
  }
}

function runMockOcr(): ExtractionResult {
  if (!isMockOCR()) {
    throw new Error('Proveedor de OCR externo no implementado en este proyecto — PENDIENTE DE IMPLEMENTACIÓN.');
  }
  return {
    text: '[MODO MOCK] No se ejecutó OCR real sobre la imagen. Configure OCR_PROVIDER y OCR_API_KEY para habilitar extracción real de texto desde imágenes.',
    usedOcr: true,
    ocrProvider: 'mock',
    confidence: 0,
  };
}

const DOC_TYPE_KEYWORDS: Array<{ type: string; patterns: RegExp[] }> = [
  { type: 'contrato', patterns: [/contrato/i, /entre don|entre la empresa/i] },
  { type: 'politica', patterns: [/pol[ií]tica de privacidad/i, /pol[ií]tica de datos/i] },
  { type: 'anexo', patterns: [/anexo\s+[0-9ivx]+/i] },
  { type: 'formulario', patterns: [/formulario/i, /consentimiento informado/i] },
];

export function classifyDocument(text: string) {
  const lower = text.toLowerCase();
  const docType = DOC_TYPE_KEYWORDS.find((k) => k.patterns.some((p) => p.test(lower)))?.type ?? 'otro';

  return {
    docType,
    signals: {
      mentionsDataProtectionClause: /(protecci[oó]n de datos|datos personales)/i.test(text),
      mentionsDataProcessor: /(encargado de tratamiento|encargado del tratamiento|processor)/i.test(text),
      mentionsInternationalTransfer: /(transferencia internacional|fuera de chile|en el extranjero)/i.test(text),
      mentionsRetention: /(plazo de conservaci[oó]n|conservaci[oó]n de los datos)/i.test(text),
      mentionsSecurity: /(medidas de seguridad|seguridad de la informaci[oó]n)/i.test(text),
      mentionsRights: /(derechos arco|acceso, rectificaci[oó]n)/i.test(text),
      mentionsIncident: /(incidente de seguridad|brecha de seguridad)/i.test(text),
    },
  };
}
