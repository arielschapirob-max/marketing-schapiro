import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { readFile } from '@/modules/document-processing/storage';
import { logAuditEvent } from '@/modules/audit';

/**
 * Acceso a un documento cargado por el cliente. Requiere sesión activa y
 * pertenencia a la organización dueña del diagnóstico. No existen URLs
 * públicas para archivos privados: todo acceso pasa por esta ruta y queda
 * registrado en auditoría.
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const file = await db.file.findUnique({ where: { id: params.id }, include: { diagnosis: true } });
  if (!file || file.status === 'DELETED') return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  if (!user.isSuperAdmin) {
    const membership = await db.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: file.diagnosis.organizationId, userId: user.id } },
    });
    if (!membership) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const buffer = await readFile(file.storageKey);

  await logAuditEvent({
    userId: user.id,
    diagnosisId: file.diagnosisId,
    organizationId: file.diagnosis.organizationId,
    action: 'FILE_DOWNLOADED',
    entityType: 'File',
    entityId: file.id,
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'content-type': file.mimeType,
      'content-disposition': `attachment; filename="${encodeURIComponent(file.originalName)}"`,
      'cache-control': 'private, no-store',
    },
  });
}
