import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { Card, LinkButton } from '@/components/ui/primitives';
import { StatusBadge } from '@/components/ui/badge';
import { formatDateTimeCL } from '@/lib/utils';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const memberships = await db.organizationMember.findMany({
    where: { userId: user!.id },
    include: { organization: true },
  });
  const orgIds = memberships.map((m) => m.organizationId);

  const recentDiagnoses = await db.diagnosis.findMany({
    where: { organizationId: { in: orgIds } },
    orderBy: { updatedAt: 'desc' },
    take: 8,
    include: { organization: true },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-brand-900">Panel de control</h1>
        <p className="text-sm text-gray-500">Bienvenido/a, {user?.name}.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs uppercase text-gray-400">Organizaciones</p>
          <p className="mt-1 text-3xl font-semibold text-brand-900">{memberships.length}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-gray-400">Diagnósticos recientes</p>
          <p className="mt-1 text-3xl font-semibold text-brand-900">{recentDiagnoses.length}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-gray-400">Acción rápida</p>
          <div className="mt-2">
            <LinkButton href="/organizaciones/nueva">+ Nueva organización</LinkButton>
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-brand-900">Diagnósticos recientes</h2>
        {recentDiagnoses.length === 0 ? (
          <p className="text-sm text-gray-500">Aún no hay diagnósticos. Cree una organización para comenzar.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-gray-400">
              <tr>
                <th className="pb-2">Diagnóstico</th>
                <th className="pb-2">Organización</th>
                <th className="pb-2">Estado</th>
                <th className="pb-2">Actualizado</th>
              </tr>
            </thead>
            <tbody>
              {recentDiagnoses.map((d) => (
                <tr key={d.id} className="border-t border-gray-100">
                  <td className="py-2">
                    <Link href={`/diagnosticos/${d.id}/carga`} className="font-medium text-brand-700 hover:underline">
                      {d.title}
                    </Link>
                  </td>
                  <td className="py-2 text-gray-600">{d.organization.legalName}</td>
                  <td className="py-2">
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="py-2 text-gray-500">{formatDateTimeCL(d.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
