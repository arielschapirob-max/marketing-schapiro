import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { Card, LinkButton } from '@/components/ui/primitives';
import { StatusBadge } from '@/components/ui/badge';
import { formatDateTimeCL } from '@/lib/utils';
import { NewDiagnosisForm } from '@/components/diagnoses/new-diagnosis-form';

export default async function OrganizationDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const membership = await db.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: params.id, userId: user!.id } },
  });
  if (!membership && !user?.isSuperAdmin) notFound();

  const organization = await db.organization.findUnique({
    where: { id: params.id },
    include: { diagnoses: { orderBy: { updatedAt: 'desc' } } },
  });
  if (!organization) notFound();

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand-900">{organization.legalName}</h1>
          <p className="text-sm text-gray-500">{organization.commercialName ?? organization.identifier ?? ''}</p>
        </div>
        <LinkButton href={`/organizaciones/${organization.id}/configuracion`} variant="secondary">
          Configuración
        </LinkButton>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-4 text-base font-semibold text-brand-900">Diagnósticos</h2>
          {organization.diagnoses.length === 0 ? (
            <p className="text-sm text-gray-500">Aún no hay diagnósticos para esta organización.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {organization.diagnoses.map((d) => (
                <li key={d.id} className="flex items-center justify-between py-3">
                  <div>
                    <Link href={`/diagnosticos/${d.id}/carga`} className="font-medium text-brand-700 hover:underline">
                      {d.title}
                    </Link>
                    <p className="text-xs text-gray-500">Actualizado {formatDateTimeCL(d.updatedAt)} — régimen {d.regimeMode}</p>
                  </div>
                  <StatusBadge status={d.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-base font-semibold text-brand-900">Nuevo diagnóstico</h2>
          <NewDiagnosisForm organizationId={organization.id} />
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-brand-900">Datos de la organización</h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-gray-400">RUT</dt><dd className="text-gray-800">{organization.identifier ?? '—'}</dd></div>
          <div><dt className="text-gray-400">Sitio web</dt><dd className="text-gray-800">{organization.website ?? '—'}</dd></div>
          <div><dt className="text-gray-400">Región / comuna</dt><dd className="text-gray-800">{[organization.region, organization.comuna].filter(Boolean).join(' / ') || '—'}</dd></div>
          <div><dt className="text-gray-400">Tamaño</dt><dd className="text-gray-800">{organization.approximateSize ?? '—'}</dd></div>
          <div><dt className="text-gray-400">Trabajadores</dt><dd className="text-gray-800">{organization.employeeCount ?? '—'}</dd></div>
          <div><dt className="text-gray-400">Titulares estimados</dt><dd className="text-gray-800">{organization.estimatedDataSubjects ?? '—'}</dd></div>
          <div className="sm:col-span-2"><dt className="text-gray-400">Actividad económica</dt><dd className="text-gray-800">{organization.economicActivity.join(', ') || '—'}</dd></div>
        </dl>
      </Card>
    </div>
  );
}
