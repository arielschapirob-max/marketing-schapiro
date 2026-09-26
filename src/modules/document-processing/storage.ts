import 'server-only';
import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID, createHash } from 'crypto';
import { isMockStorage, getEnv } from '@/lib/env';

const LOCAL_ROOT = path.join(process.cwd(), 'storage', 'uploads');

export interface StoredFile {
  storageKey: string;
  checksumSha256: string;
  sizeBytes: number;
}

/**
 * Adaptador de almacenamiento. En desarrollo (STORAGE_DRIVER=local o sin
 * STORAGE_ENDPOINT) los archivos se guardan bajo storage/uploads/, fuera del
 * árbol servido públicamente por Next.js — nunca se exponen mediante una URL
 * pública directa. El acceso se realiza siempre a través de una ruta de API
 * que verifica sesión, pertenencia a la organización y genera un enlace de
 * corta duración (ver src/app/api/files/[id]/route.ts).
 *
 * Si STORAGE_ENDPOINT está configurado, este módulo debería reemplazarse por
 * un cliente S3 real (p. ej. @aws-sdk/client-s3); la interfaz pública
 * (saveFile/readFile/deleteFile) se mantendría igual.
 */
export async function saveFile(buffer: Buffer, extension: string): Promise<StoredFile> {
  if (!isMockStorage()) {
    throw new Error(
      'STORAGE_DRIVER=s3 configurado pero el adaptador S3 real no está implementado en este proyecto (PENDIENTE DE IMPLEMENTACIÓN). Use STORAGE_DRIVER=local en desarrollo.',
    );
  }

  await fs.mkdir(LOCAL_ROOT, { recursive: true });
  const checksumSha256 = createHash('sha256').update(buffer).digest('hex');
  const storageKey = `${randomUUID()}${extension}`;
  await fs.writeFile(path.join(LOCAL_ROOT, storageKey), buffer);

  return { storageKey, checksumSha256, sizeBytes: buffer.length };
}

export async function readFile(storageKey: string): Promise<Buffer> {
  const safeKey = path.basename(storageKey); // evita path traversal
  return fs.readFile(path.join(LOCAL_ROOT, safeKey));
}

export async function deleteFile(storageKey: string): Promise<void> {
  const safeKey = path.basename(storageKey);
  await fs.rm(path.join(LOCAL_ROOT, safeKey), { force: true });
}

export function getStorageEnvSummary() {
  const env = getEnv();
  return { driver: env.STORAGE_DRIVER, mock: isMockStorage() };
}
