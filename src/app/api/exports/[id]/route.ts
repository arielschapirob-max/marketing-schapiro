import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { readFile } from '@/modules/document-processing/storage';

const CONTENT_TYPES: Record<string, string> = {
  PDF: 'application/pdf',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  JSON: 'application/json',
  CSV: 'text/csv',
};

/**
 * Descarga de un archivo de exportación. Nunca se sirve mediante una URL
 * pública estática: esta ruta exige sesión activa y verifica que el usuario
 * pertenezca a la organización dueña del diagnóstico antes de leer el
 * archivo desde el almacenamiento privado.
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const exportRecord = await db.export.findUnique({ where: { id: params.id }, include: { diagnosis: true } });
  if (!exportRecord) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  if (!user.isSuperAdmin) {
    const membership = await db.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: exportRecord.diagnosis.organizationId, userId: user.id } },
    });
    if (!membership) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const buffer = await readFile(exportRecord.storageKey);
  const extension = exportRecord.format.toLowerCase();

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'content-type': CONTENT_TYPES[exportRecord.format] ?? 'application/octet-stream',
      'content-disposition': `attachment; filename="pymelegal-diagnostico-${exportRecord.diagnosisId}.${extension}"`,
      'cache-control': 'private, no-store',
    },
  });
}
