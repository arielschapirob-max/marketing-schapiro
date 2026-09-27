import Link from 'next/link';
import { cn } from '@/lib/utils';

const TABS = [
  { key: 'carga', label: 'Carga y análisis', path: 'carga' },
  { key: 'mapa', label: 'Mapa jurídico', path: 'mapa' },
  { key: 'cuestionario', label: 'Cuestionario', path: 'cuestionario' },
  { key: 'editor-cuestionario', label: 'Editor', path: 'editor-cuestionario' },
  { key: 'revision', label: 'Revisión', path: 'revision' },
  { key: 'aprobacion', label: 'Aprobación', path: 'aprobacion' },
  { key: 'exportacion', label: 'Exportación', path: 'exportacion' },
];

export function DiagnosisTabs({ diagnosisId, active }: { diagnosisId: string; active: string; status?: string }) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-gray-200">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={`/diagnosticos/${diagnosisId}/${tab.path}`}
          className={cn(
            'rounded-t-lg px-4 py-2 text-sm font-medium',
            active === tab.key ? 'border-b-2 border-brand-700 text-brand-900' : 'text-gray-500 hover:text-brand-700',
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
