import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { Card } from '@/components/ui/primitives';
import { formatDateTimeCL } from '@/lib/utils';

export default async function ActivityLogPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const orgIds = (await db.organizationMember.findMany({ where: { userId: user!.id }, select: { organizationId: true } })).map((m) => m.organizationId);

  const events = await db.auditEvent.findMany({
    where: user?.isSuperAdmin ? {} : { organizationId: { in: orgIds } },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { user: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-brand-900">Registro de actividad</h1>
      <Card>
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-gray-400">
            <tr>
              <th className="pb-2">Fecha</th>
              <th className="pb-2">Usuario</th>
              <th className="pb-2">Acción</th>
              <th className="pb-2">Entidad</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-t border-gray-100">
                <td className="py-2 text-gray-500">{formatDateTimeCL(e.createdAt)}</td>
                <td className="py-2 text-gray-700">{e.user?.name ?? '—'}</td>
                <td className="py-2 font-medium text-brand-800">{e.action}</td>
                <td className="py-2 text-gray-500">{e.entityType}{e.entityId ? ` #${e.entityId.slice(0, 8)}` : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {events.length === 0 && <p className="py-4 text-sm text-gray-500">Sin actividad registrada.</p>}
      </Card>
    </div>
  );
}
