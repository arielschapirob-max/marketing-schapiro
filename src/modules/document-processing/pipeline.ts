import 'server-only';
import { db } from '@/lib/db';
import { validateFile } from './validation';
import { scanFile } from './antivirus';
import { saveFile } from './storage';
import { extractText, classifyDocument } from './extract';
import { logAuditEvent } from '@/modules/audit';
import type { FileKind } from '@prisma/client';

export interface UploadFileInput {
  diagnosisId: string;
  uploadedById: string;
  originalName: string;
  mimeType: string;
  buffer: Buffer;
  kindHint?: FileKind;
}

export interface UploadFileResult {
  fileId: string;
  status: 'PROCESSED' | 'QUARANTINED' | 'ERROR';
  errors: string[];
  isDuplicate: boolean;
}

/**
 * Pipeline completo de carga de un documento:
 * validación de extensión/MIME/firma -> checksum -> detección de duplicados
 * -> antivirus -> almacenamiento privado -> extracción de texto -> OCR
 * (si corresponde) -> clasificación documental -> persistencia.
 */
export async function uploadAndProcessFile(input: UploadFileInput): Promise<UploadFileResult> {
  const validation = validateFile(input.originalName, input.mimeType, input.buffer.length, input.buffer);

  if (!validation.valid) {
    await logAuditEvent({
      userId: input.uploadedById,
      diagnosisId: input.diagnosisId,
      action: 'FILE_UPLOAD_REJECTED',
      entityType: 'File',
      metadata: { originalName: input.originalName, errors: validation.errors },
    });
    throw new FileValidationError(validation.errors);
  }

  const checksumSha256 = (await import('crypto')).createHash('sha256').update(input.buffer).digest('hex');
  const duplicate = await db.file.findFirst({
    where: { diagnosisId: input.diagnosisId, checksumSha256, deletedAt: null },
  });

  const scan = await scanFile(input.buffer);

  if (!scan.clean) {
    const file = await db.file.create({
      data: {
        diagnosisId: input.diagnosisId,
        kind: input.kindHint ?? validation.kind,
        originalName: input.originalName,
        mimeType: input.mimeType,
        extension: validation.extension,
        sizeBytes: input.buffer.length,
        checksumSha256,
        storageKey: 'quarantined',
        status: 'QUARANTINED',
        isDuplicate: Boolean(duplicate),
        duplicateOfId: duplicate?.id,
        uploadedById: input.uploadedById,
        errorMessage: scan.reason ?? 'Archivo en cuarentena por el antivirus.',
      },
    });
    await logAuditEvent({
      userId: input.uploadedById,
      diagnosisId: input.diagnosisId,
      action: 'FILE_QUARANTINED',
      entityType: 'File',
      entityId: file.id,
      metadata: { reason: scan.reason },
    });
    return { fileId: file.id, status: 'QUARANTINED', errors: [scan.reason ?? 'archivo en cuarentena'], isDuplicate: Boolean(duplicate) };
  }

  const stored = await saveFile(input.buffer, validation.extension);

  const file = await db.file.create({
    data: {
      diagnosisId: input.diagnosisId,
      kind: input.kindHint ?? validation.kind,
      originalName: input.originalName,
      mimeType: input.mimeType,
      extension: validation.extension,
      sizeBytes: stored.sizeBytes,
      checksumSha256: stored.checksumSha256,
      storageKey: stored.storageKey,
      status: 'UPLOADED',
      isDuplicate: Boolean(duplicate),
      duplicateOfId: duplicate?.id,
      uploadedById: input.uploadedById,
    },
  });

  try {
    const extraction = await extractText(input.buffer, validation.extension);
    const classification = classifyDocument(extraction.text);

    await db.extractedDocument.create({
      data: {
        fileId: file.id,
        text: extraction.text,
        usedOcr: extraction.usedOcr,
        ocrProvider: extraction.ocrProvider,
        confidence: extraction.confidence,
        pageCount: extraction.pageCount,
        pages: extraction.pages,
        docType: classification.docType,
        classification: classification.signals,
      },
    });

    await db.file.update({ where: { id: file.id }, data: { status: 'PROCESSED' } });

    await logAuditEvent({
      userId: input.uploadedById,
      diagnosisId: input.diagnosisId,
      action: 'FILE_PROCESSED',
      entityType: 'File',
      entityId: file.id,
      metadata: { docType: classification.docType, isDuplicate: Boolean(duplicate) },
    });

    return { fileId: file.id, status: 'PROCESSED', errors: [], isDuplicate: Boolean(duplicate) };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db.file.update({ where: { id: file.id }, data: { status: 'ERROR', errorMessage: message } });
    return { fileId: file.id, status: 'ERROR', errors: [message], isDuplicate: Boolean(duplicate) };
  }
}

export class FileValidationError extends Error {
  constructor(public errors: string[]) {
    super(errors.join(' | '));
  }
}

/** Eliminación segura: borra el contenido del almacenamiento y marca el registro. */
export async function deleteFileSecurely(fileId: string, userId: string): Promise<void> {
  const file = await db.file.findUniqueOrThrow({ where: { id: fileId } });
  const { deleteFile } = await import('./storage');
  await deleteFile(file.storageKey);
  await db.file.update({ where: { id: fileId }, data: { status: 'DELETED', deletedAt: new Date() } });
  await logAuditEvent({
    userId,
    diagnosisId: file.diagnosisId,
    action: 'FILE_DELETED',
    entityType: 'File',
    entityId: fileId,
  });
}
