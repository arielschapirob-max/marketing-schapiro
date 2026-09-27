import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { Card, LinkButton, EmptyState } from '@/components/ui/primitives';

export default async function OrganizationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const memberships = await db.organizationMember.findMany({
    where: { userId: user!.id },
    include: { organization: { include: { _count: { select: { diagnoses: true } } } } },
    orderBy: { organization: { createdAt: 'desc' } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-brand-900">Organizaciones</h1>
        <LinkButton href="/organizaciones/nueva">+ Nueva organización</LinkButton>
      </div>

      {memberships.length === 0 ? (
        <EmptyState
          title="Aún no hay organizaciones"
          description="Cree la primera organización cliente para comenzar un diagnóstico."
          action={<LinkButton href="/organizaciones/nueva">Crear organización</LinkButton>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {memberships.map(({ organization: org, role }) => (
            <Link key={org.id} href={`/organizaciones/${org.id}`}>
              <Card className="h-full transition hover:border-brand-600 hover:shadow-md">
                <p className="text-xs uppercase tracking-wide text-gray-400">{role}</p>
                <h3 className="mt-1 text-base font-semibold text-brand-900">{org.legalName}</h3>
                {org.commercialName && <p className="text-sm text-gray-500">{org.commercialName}</p>}
                <p className="mt-3 text-sm text-gray-600">{org._count.diagnoses} diagnóstico(s)</p>
                {org.status === 'ARCHIVED' && <p className="mt-1 text-xs text-risk-alto">Archivada</p>}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
