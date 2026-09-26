import type { FileKind } from '@prisma/client';

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export const ALLOWED_EXTENSIONS: Record<string, { mime: string[]; kind: FileKind }> = {
  '.pdf': { mime: ['application/pdf'], kind: 'DOCUMENT' },
  '.docx': { mime: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'], kind: 'DOCUMENT' },
  '.txt': { mime: ['text/plain'], kind: 'DOCUMENT' },
  '.csv': { mime: ['text/csv', 'application/vnd.ms-excel'], kind: 'DOCUMENT' },
  '.xlsx': { mime: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'], kind: 'DOCUMENT' },
  '.png': { mime: ['image/png'], kind: 'IMAGE' },
  '.jpg': { mime: ['image/jpeg'], kind: 'IMAGE' },
  '.jpeg': { mime: ['image/jpeg'], kind: 'IMAGE' },
};

export interface FileValidationResult {
  valid: boolean;
  errors: string[];
  extension: string;
  kind: FileKind;
}

const MAGIC_BYTES: Array<{ ext: string; bytes: number[] }> = [
  { ext: '.pdf', bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { ext: '.png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { ext: '.jpg', bytes: [0xff, 0xd8, 0xff] },
  { ext: '.jpeg', bytes: [0xff, 0xd8, 0xff] },
  // .docx/.xlsx son ZIP: firma PK
  { ext: '.docx', bytes: [0x50, 0x4b, 0x03, 0x04] },
  { ext: '.xlsx', bytes: [0x50, 0x4b, 0x03, 0x04] },
];

function matchesMagicBytes(buffer: Buffer, extension: string): boolean {
  const entry = MAGIC_BYTES.find((m) => m.ext === extension);
  if (!entry) return true; // .txt/.csv no tienen firma binaria fija
  if (buffer.length < entry.bytes.length) return false;
  return entry.bytes.every((b, i) => buffer[i] === b);
}

export function validateFile(originalName: string, mimeType: string, sizeBytes: number, buffer: Buffer): FileValidationResult {
  const errors: string[] = [];
  const extension = ('.' + (originalName.split('.').pop() ?? '')).toLowerCase();
  const rule = ALLOWED_EXTENSIONS[extension];

  if (!rule) {
    errors.push(`Extensión no permitida: ${extension || '(sin extensión)'}`);
  } else {
    if (!rule.mime.includes(mimeType)) {
      errors.push(`El tipo MIME declarado (${mimeType}) no corresponde a la extensión ${extension}.`);
    }
    if (!matchesMagicBytes(buffer, extension)) {
      errors.push('La firma binaria del archivo no corresponde al tipo declarado (posible archivo corrupto o disfrazado).');
    }
  }

  if (sizeBytes > MAX_FILE_SIZE_BYTES) {
    errors.push(`El archivo supera el tamaño máximo permitido (${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB).`);
  }
  if (sizeBytes === 0) {
    errors.push('El archivo está vacío.');
  }

  return {
    valid: errors.length === 0,
    errors,
    extension,
    kind: rule?.kind ?? 'OTHER',
  };
}
