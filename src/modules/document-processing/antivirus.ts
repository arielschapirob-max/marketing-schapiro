import { isMockAntivirus, getEnv } from '@/lib/env';

export interface ScanResult {
  clean: boolean;
  engine: string;
  reason?: string;
}

const EICAR_SIGNATURE = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';

/**
 * Adaptador de antivirus. En modo mock (por defecto, sin ANTIVIRUS_ENDPOINT
 * configurado) se limita a: (a) reconocer el archivo de prueba estándar
 * EICAR, y (b) confiar en la validación de extensión/MIME/firma binaria ya
 * realizada en validation.ts. No reemplaza un antivirus real en producción.
 */
export async function scanFile(buffer: Buffer): Promise<ScanResult> {
  if (!isMockAntivirus()) {
    const env = getEnv();
    // PENDIENTE DE IMPLEMENTACIÓN: integración real con el endpoint de
    // antivirus configurado. Se deja la interfaz lista para conectar un
    // servicio real (p. ej. ClamAV vía HTTP) sin cambiar el resto del
    // pipeline documental.
    throw new Error(`Integración de antivirus externo (${env.ANTIVIRUS_ENDPOINT}) no implementada — PENDIENTE DE IMPLEMENTACIÓN.`);
  }

  const asText = buffer.toString('utf-8', 0, Math.min(buffer.length, 4096));
  if (asText.includes(EICAR_SIGNATURE)) {
    return { clean: false, engine: 'mock-antivirus', reason: 'Firma de prueba EICAR detectada.' };
  }
  return { clean: true, engine: 'mock-antivirus' };
}
