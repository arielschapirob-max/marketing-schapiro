import Link from 'next/link';
import { logoutAction } from '@/server/actions/auth';
import type { SessionUser } from '@/lib/auth';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Panel' },
  { href: '/organizaciones', label: 'Organizaciones' },
  { href: '/admin/fuentes-reglas', label: 'Fuentes y reglas' },
  { href: '/admin/usuarios', label: 'Usuarios' },
  { href: '/actividad', label: 'Actividad' },
  { href: '/configuracion', label: 'Configuración' },
];

export function AppShell({ user, children, breadcrumbs }: { user: SessionUser; children: React.ReactNode; breadcrumbs?: Array<{ href?: string; label: string }> }) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 flex-col border-r border-gray-200 bg-brand-950 text-white md:flex">
        <div className="px-6 py-6 text-lg font-semibold">PymeLegal</div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="block rounded-lg px-3 py-2 text-sm text-brand-100 hover:bg-white/10">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 px-4 py-4 text-xs text-brand-100">
          <p className="font-medium text-white">{user.name}</p>
          <p className="truncate">{user.email}</p>
          <form action={logoutAction} className="mt-3">
            <button type="submit" className="text-xs font-medium text-gold-400 hover:underline">
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <nav aria-label="breadcrumb" className="text-sm text-gray-500">
            {breadcrumbs?.map((b, idx) => (
              <span key={idx}>
                {idx > 0 && <span className="mx-1">/</span>}
                {b.href ? (
                  <Link href={b.href} className="hover:text-brand-700 hover:underline">
                    {b.label}
                  </Link>
                ) : (
                  <span className="text-gray-900">{b.label}</span>
                )}
              </span>
            ))}
          </nav>
          <span className="text-xs text-gray-400 md:hidden">{user.name}</span>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
