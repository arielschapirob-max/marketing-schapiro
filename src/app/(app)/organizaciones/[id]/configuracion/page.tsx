import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { Card } from '@/components/ui/primitives';
import { AddMemberForm } from '@/components/organizations/add-member-form';

export default async function OrganizationSettingsPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const membership = await db.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: params.id, userId: user!.id } },
  });
  if ((!membership || membership.role !== 'ADMIN') && !user?.isSuperAdmin) notFound();

  const organization = await db.organization.findUnique({
    where: { id: params.id },
    include: { members: { include: { user: true } } },
  });
  if (!organization) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold text-brand-900">Configuración — {organization.legalName}</h1>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-brand-900">Miembros del equipo</h2>
        <ul className="mb-6 divide-y divide-gray-100 text-sm">
          {organization.members.map((m) => (
            <li key={m.id} className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-gray-800">{m.user.name}</p>
                <p className="text-xs text-gray-500">{m.user.email}</p>
              </div>
              <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">{m.role}</span>
            </li>
          ))}
        </ul>
        <AddMemberForm organizationId={organization.id} />
      </Card>
    </div>
  );
}
