import { LinkButton } from '@/components/ui/primitives';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect('/dashboard');

  return (
    <main className="flex min-h-screen flex-col">
      <header className="border-b border-brand-900/10 bg-brand-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <span className="text-xl font-semibold tracking-tight text-white">PymeLegal</span>
          <nav className="flex gap-3">
            <LinkButton href="/login" variant="ghost" className="text-white hover:bg-white/10">
              Iniciar sesión
            </LinkButton>
            <LinkButton href="/register" variant="secondary" className="border-white text-white hover:bg-white/10">
              Crear cuenta
            </LinkButton>
          </nav>
        </div>
      </header>

      <section className="bg-brand-950 pb-24 pt-16 text-white">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-gold-400">
            [Logotipo oficial pendiente de carga — ver docs/README.md]
          </p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            Generador Inteligente de Diagnósticos de Protección de Datos
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-brand-100">
            Levante la información de una organización, analice reuniones, documentos y su sitio web, y obtenga un
            mapa jurídico preliminar y un cuestionario a medida — bajo la Ley N.º 19.628 vigente y la Ley N.º 21.719
            en su régimen futuro.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <LinkButton href="/register" className="bg-gold-500 text-brand-950 hover:bg-gold-400">
              Comenzar diagnóstico
            </LinkButton>
            <LinkButton href="/login" variant="secondary" className="border-white text-white hover:bg-white/10">
              Ya tengo una cuenta
            </LinkButton>
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-12 grid max-w-5xl gap-6 px-6 pb-24 sm:grid-cols-3">
        {[
          { title: 'Análisis multi-fuente', desc: 'Reuniones, documentos y sitio web se analizan con trazabilidad completa de evidencia.' },
          { title: 'Motor jurídico versionado', desc: 'Distingue el régimen vigente (Ley 19.628) del régimen futuro (Ley 21.719) sin mezclarlos.' },
          { title: 'Revisión antes de aprobar', desc: '20 controles automáticos de cobertura, fuentes y consistencia antes de exportar.' },
        ].map((item) => (
          <div key={item.title} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-2 text-base font-semibold text-brand-900">{item.title}</h3>
            <p className="text-sm text-gray-600">{item.desc}</p>
          </div>
        ))}
      </section>

      <footer className="mt-auto border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-500">
        PymeLegal no constituye asesoría jurídica definitiva. Todo diagnóstico debe ser validado por un abogado.
      </footer>
    </main>
  );
}
