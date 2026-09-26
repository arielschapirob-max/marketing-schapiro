import 'server-only';
import { createHash } from 'crypto';
import { db } from '@/lib/db';
import { saveFile } from '@/modules/document-processing/storage';
import { buildReportData } from './build-report-data';
import { buildDiagnosisPdf } from './pdf';
import { buildDiagnosisDocx } from './docx';
import { buildDiagnosisJson } from './json';
import { logAuditEvent } from '@/modules/audit';
import type { ExportFormat } from '@prisma/client';

const EXTENSION_BY_FORMAT: Record<ExportFormat, string> = {
  PDF: '.pdf',
  DOCX: '.docx',
  JSON: '.json',
  CSV: '.csv',
};

export async function generateExport(diagnosisId: string, format: ExportFormat, generatedById: string) {
  const data = await buildReportData(diagnosisId);

  let buffer: Buffer;
  switch (format) {
    case 'PDF':
      buffer = await buildDiagnosisPdf(data);
      break;
    case 'DOCX':
      buffer = await buildDiagnosisDocx(data);
      break;
    case 'JSON':
      buffer = buildDiagnosisJson(data);
      break;
    case 'CSV':
      buffer = buildFindingsCsv(data);
      break;
    default:
      throw new Error(`Formato de exportación no soportado: ${format}`);
  }

  const stored = await saveFile(buffer, EXTENSION_BY_FORMAT[format]);
  const checksumSha256 = createHash('sha256').update(buffer).digest('hex');

  const exportRecord = await db.export.create({
    data: {
      diagnosisId,
      questionnaireId: data.questionnaire?.id,
      format,
      generatedById,
      storageKey: stored.storageKey,
      checksumSha256,
    },
  });

  await db.diagnosis.update({ where: { id: diagnosisId }, data: { status: 'EXPORTED' } });

  await logAuditEvent({
    userId: generatedById,
    diagnosisId,
    organizationId: data.organization.id,
    action: 'EXPORT_GENERATED',
    entityType: 'Export',
    entityId: exportRecord.id,
    metadata: { format },
  });

  return exportRecord;
}

function buildFindingsCsv(data: Awaited<ReturnType<typeof buildReportData>>): Buffer {
  const header = ['tipo', 'descripcion', 'certeza', 'norma', 'requiere_validacion_juridica'];
  const rows = data.diagnosis.findings.map((f) => [f.type, csvEscape(f.description), f.certainty, f.relatedNorm ?? '', String(f.requiresLegalValidation)]);
  const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
  return Buffer.from(csv, 'utf-8');
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
