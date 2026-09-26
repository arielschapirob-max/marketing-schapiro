import { describe, it, expect } from 'vitest';
import { validateFile, MAX_FILE_SIZE_BYTES } from '@/modules/document-processing/validation';

const PDF_MAGIC = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);

describe('validación de archivos', () => {
  it('acepta un PDF con firma binaria correcta', () => {
    const result = validateFile('contrato.pdf', 'application/pdf', PDF_MAGIC.length, PDF_MAGIC);
    expect(result.valid).toBe(true);
    expect(result.kind).toBe('DOCUMENT');
  });

  it('rechaza una extensión no permitida', () => {
    const result = validateFile('script.exe', 'application/octet-stream', 10, Buffer.from('MZ........'));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Extensión'))).toBe(true);
  });

  it('rechaza un archivo disfrazado (extensión .pdf pero firma binaria distinta)', () => {
    const fakeBuffer = Buffer.from('esto no es un PDF real, es texto plano');
    const result = validateFile('falso.pdf', 'application/pdf', fakeBuffer.length, fakeBuffer);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('firma binaria'))).toBe(true);
  });

  it('rechaza archivos que superan el tamaño máximo', () => {
    const result = validateFile('grande.pdf', 'application/pdf', MAX_FILE_SIZE_BYTES + 1, PDF_MAGIC);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('tamaño máximo'))).toBe(true);
  });

  it('rechaza archivos vacíos', () => {
    const result = validateFile('vacio.txt', 'text/plain', 0, Buffer.alloc(0));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('vacío'))).toBe(true);
  });
});
