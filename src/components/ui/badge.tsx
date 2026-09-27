import { cn } from '@/lib/utils';

const CERTAINTY_CLASS: Record<string, string> = {
  CONFIRMADO: 'badge-confirmado',
  PROBABLE: 'badge-probable',
  NO_DETERMINADO: 'badge-nodeterminado',
  INFERIDO: 'badge-inferido',
  CONTRADICTORIO: 'badge-contradictorio',
};

const RISK_CLASS: Record<string, string> = {
  bajo: 'badge-riesgo-bajo',
  medio: 'badge-riesgo-medio',
  alto: 'badge-riesgo-alto',
  critico: 'badge-riesgo-critico',
};

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', className)}>
      {children}
    </span>
  );
}

export function CertaintyBadge({ certainty }: { certainty: string }) {
  return <Badge className={CERTAINTY_CLASS[certainty] ?? 'badge-nodeterminado'}>{certainty.replace('_', ' ')}</Badge>;
}

export function RiskBadge({ risk }: { risk?: string | null }) {
  if (!risk) return <Badge className="border-gray-200 bg-gray-50 text-gray-500">sin evaluar</Badge>;
  return <Badge className={RISK_CLASS[risk] ?? 'border-gray-200 bg-gray-50 text-gray-500'}>Riesgo {risk}</Badge>;
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge className="border-brand-100 bg-brand-50 text-brand-700">{status.replaceAll('_', ' ')}</Badge>;
}
