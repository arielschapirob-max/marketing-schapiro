import { db } from '@/lib/db';
import { Card } from '@/components/ui/primitives';
import { Badge } from '@/components/ui/badge';

export default async function LegalSourcesAndRulesPage() {
  const [sources, rules] = await Promise.all([
    db.legalSource.findMany({ orderBy: { name: 'asc' } }),
    db.legalRule.findMany({ orderBy: { code: 'asc' }, include: { source: true } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-brand-900">Fuentes y reglas jurídicas</h1>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-brand-900">Fuentes oficiales registradas</h2>
        <ul className="space-y-2 text-sm">
          {sources.map((s) => (
            <li key={s.id} className="flex items-center justify-between border-b border-gray-50 pb-2">
              <div>
                <p className="font-medium text-gray-800">{s.name}</p>
                <p className="text-xs text-gray-500">{s.authority}</p>
              </div>
              <a href={s.url} target="_blank" rel="noreferrer" className="text-xs text-brand-700 hover:underline">
                {s.url}
              </a>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-brand-900">Reglas jurídicas ({rules.length})</h2>
        <ul className="space-y-3">
          {rules.map((r) => (
            <li key={r.id} className="rounded-lg border border-gray-100 p-3 text-sm">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="font-medium text-brand-900">{r.code}</span>
                <Badge className="border-gray-200 bg-gray-50 text-gray-600">{r.regime}</Badge>
                <Badge
                  className={
                    r.validationStatus === 'VALIDADA'
                      ? 'border-risk-bajo/30 bg-risk-bajo/5 text-risk-bajo'
                      : 'border-gold-400/40 bg-gold-100 text-gold-600'
                  }
                >
                  {r.validationStatus.replaceAll('_', ' ')}
                </Badge>
              </div>
              <p className="font-medium text-gray-800">{r.name}</p>
              <p className="text-gray-600">{r.description}</p>
              <p className="mt-1 text-xs text-gray-400">
                {r.norm} · Fuente: {r.source?.name ?? 'no registrada'} · Versión {r.version}
              </p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
