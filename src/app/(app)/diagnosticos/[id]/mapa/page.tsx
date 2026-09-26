import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { Card, LinkButton, EmptyState } from '@/components/ui/primitives';
import { CertaintyBadge, RiskBadge, Badge } from '@/components/ui/badge';
import { DiagnosisTabs } from '@/components/diagnoses/diagnosis-tabs';

const TYPE_LABELS: Record<string, string> = {
  BUSINESS_ACTIVITY: 'Actividad de negocio',
  PROCESSING_ACTIVITY: 'Tratamientos de datos',
  DATA_SUBJECT_CATEGORY: 'Categorías de titulares',
  DATA_CATEGORY: 'Categorías de datos',
  SENSITIVE_DATA: 'Datos sensibles',
  TECHNOLOGY: 'Tecnologías',
  PROVIDER: 'Proveedores',
  THIRD_PARTY: 'Terceros',
  INTERNATIONAL_TRANSFER: 'Transferencias internacionales',
  INCIDENT: 'Incidentes',
  SECURITY_MEASURE: 'Medidas de seguridad',
  RETENTION_PRACTICE: 'Prácticas de conservación',
  EXISTING_DOCUMENT: 'Documentos existentes',
};

/**
 * Consolida las 14 vistas de mapas jurídicos del encargo (organización,
 * actividades, tratamientos, titulares, categorías de datos, datos
 * sensibles, tecnologías, proveedores, terceros, transferencias, riesgos,
 * normativa, evidencias y vacíos) en una sola pantalla con secciones
 * ancladas, en vez de 14 páginas casi idénticas — ver docs/ARCHITECTURE.md.
 */
export default async function DiagnosisMapPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const diagnosis = await db.diagnosis.findUnique({
    where: { id: params.id },
    include: {
      organization: true,
      findings: true,
      diagnosisSectors: { include: { sector: true } },
      legalEvaluations: { include: { rule: { include: { source: true } } } },
      validationTasks: { where: { status: 'OPEN' } },
      webAnalyses: { include: { findings: true } },
    },
  });
  if (!diagnosis) notFound();
  const membership = await db.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: diagnosis.organizationId, userId: user!.id } },
  });
  if (!membership && !user?.isSuperAdmin) notFound();

  const findingsByType = new Map<string, typeof diagnosis.findings>();
  for (const f of diagnosis.findings) {
    const list = findingsByType.get(f.type) ?? [];
    list.push(f);
    findingsByType.set(f.type, list);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-900">{diagnosis.title}</h1>
        <p className="text-sm text-gray-500">{diagnosis.organization.legalName}</p>
      </div>
      <DiagnosisTabs diagnosisId={diagnosis.id} active="mapa" />

      {diagnosis.findings.length === 0 ? (
        <EmptyState
          title="Aún no hay hallazgos"
          description="Ejecute el análisis en la pestaña 'Carga y análisis' para generar el mapa jurídico."
          action={<LinkButton href={`/diagnosticos/${diagnosis.id}/carga`}>Ir a carga y análisis</LinkButton>}
        />
      ) : (
        <>
          <Card>
            <h2 className="mb-3 text-base font-semibold text-brand-900">Sectores regulatorios detectados</h2>
            <div className="flex flex-wrap gap-2">
              {diagnosis.diagnosisSectors.length === 0 && <p className="text-sm text-gray-500">No se detectaron sectores específicos.</p>}
              {diagnosis.diagnosisSectors.map((s) => (
                <Badge key={s.id} className="border-brand-100 bg-brand-50 text-brand-800">
                  {s.sector.name} <CertaintyBadge certainty={s.certainty} />
                </Badge>
              ))}
            </div>
          </Card>

          {[...findingsByType.entries()].map(([type, findings]) => (
            <Card key={type}>
              <h2 className="mb-3 text-base font-semibold text-brand-900">{TYPE_LABELS[type] ?? type}</h2>
              <ul className="space-y-2">
                {findings.map((f) => (
                  <li key={f.id} className="flex flex-wrap items-center gap-2 border-b border-gray-50 pb-2 text-sm">
                    <CertaintyBadge certainty={f.certainty} />
                    <span className="text-gray-800">{f.description}</span>
                    {f.relatedNorm && <span className="text-xs text-gray-400">({f.relatedNorm})</span>}
                    {f.requiresLegalValidation && <span className="text-xs font-medium text-gold-600">REQUIERE VALIDACIÓN JURÍDICA</span>}
                  </li>
                ))}
              </ul>
            </Card>
          ))}

          <Card>
            <h2 className="mb-3 text-base font-semibold text-brand-900">Normativa potencialmente aplicable</h2>
            {diagnosis.legalEvaluations.length === 0 ? (
              <p className="text-sm text-gray-500">Aún no se ha ejecutado el motor jurídico.</p>
            ) : (
              <ul className="space-y-3">
                {diagnosis.legalEvaluations.map((ev) => (
                  <li key={ev.id} className="rounded-lg border border-gray-100 p-3 text-sm">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="font-medium text-brand-900">{ev.rule.code} — {ev.rule.name}</span>
                      <RiskBadge risk={ev.rule.severity} />
                      <Badge className="border-gray-200 bg-gray-50 text-gray-600">{ev.applicability.replaceAll('_', ' ')}</Badge>
                      <Badge className="border-gray-200 bg-gray-50 text-gray-600">Régimen {ev.regime}</Badge>
                    </div>
                    <p className="text-gray-600">{ev.reasoning}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      Norma: {ev.rule.norm} · Fuente: {ev.rule.source?.name ?? 'no registrada'} · Estado: {ev.rule.validationStatus}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h2 className="mb-3 text-base font-semibold text-brand-900">Hallazgos del análisis web</h2>
            {diagnosis.webAnalyses.flatMap((w) => w.findings).length === 0 ? (
              <p className="text-sm text-gray-500">Sin hallazgos de análisis web.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {diagnosis.webAnalyses.flatMap((w) => w.findings).map((f) => (
                  <li key={f.id} className="flex flex-wrap items-center gap-2 border-b border-gray-50 pb-2">
                    <CertaintyBadge certainty={f.certainty} />
                    <span className="text-gray-800">{f.description}</span>
                    <span className="text-xs text-gray-400">{f.url}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h2 className="mb-3 text-base font-semibold text-brand-900">Vacíos de información pendientes</h2>
            {diagnosis.validationTasks.length === 0 ? (
              <p className="text-sm text-gray-500">No hay tareas de validación abiertas.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {diagnosis.validationTasks.map((t) => (
                  <li key={t.id} className="flex items-center gap-2">
                    <Badge className={t.blocking ? 'border-risk-alto/30 bg-risk-alto/5 text-risk-alto' : 'border-gray-200 bg-gray-50 text-gray-600'}>
                      {t.type}{t.blocking ? ' · bloqueante' : ''}
                    </Badge>
                    <span className="text-gray-700">{t.description}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <div className="flex justify-end">
            <LinkButton href={`/diagnosticos/${diagnosis.id}/cuestionario`}>Ir al cuestionario →</LinkButton>
          </div>
        </>
      )}
    </div>
  );
}
