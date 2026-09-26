import { db } from '@/lib/db';
import { Card } from '@/components/ui/primitives';
import { Badge } from '@/components/ui/badge';

export default async function UsersAdminPage() {
  const users = await db.user.findMany({
    orderBy: { createdAt: 'asc' },
    include: { memberships: { include: { organization: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-brand-900">Usuarios</h1>
      <Card>
        <ul className="divide-y divide-gray-100 text-sm">
          {users.map((u) => (
            <li key={u.id} className="py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">{u.name}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </div>
                <div className="flex gap-1">
                  {u.isSuperAdmin && <Badge className="border-gold-400/40 bg-gold-100 text-gold-600">Super admin</Badge>}
                  {!u.active && <Badge className="border-risk-alto/30 bg-risk-alto/5 text-risk-alto">Inactivo</Badge>}
                </div>
              </div>
              {u.memberships.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {u.memberships.map((m) => (
                    <li key={m.id} className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs text-brand-700">
                      {m.organization.legalName} · {m.role}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
