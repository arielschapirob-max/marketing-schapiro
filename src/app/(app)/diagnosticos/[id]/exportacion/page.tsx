import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { Card, EmptyState } from '@/components/ui/primitives';
import { DiagnosisTabs } from '@/components/diagnoses/diagnosis-tabs';
import { GenerateExportButtons } from '@/components/diagnoses/export-buttons';
import { formatDateTimeCL } from '@/lib/utils';

export default async function ExportPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const diagnosis = await db.diagnosis.findUnique({ where: { id: params.id }, include: { organization: true } });
  if (!diagnosis) notFound();
  await db.organizationMember.findUnique({ where: { organizationId_userId: { organizationId: diagnosis.organizationId, userId: user!.id } } });

  const exports = await db.export.findMany({ where: { diagnosisId: diagnosis.id }, orderBy: { generatedAt: 'desc' }, include: { generatedBy: true } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-900">{diagnosis.title}</h1>
        <p className="text-sm text-gray-500">{diagnosis.organization.legalName} — Exportación</p>
      </div>
      <DiagnosisTabs diagnosisId={diagnosis.id} active="exportacion" />

      <Card>
        <h2 className="mb-3 text-base font-semibold text-brand-900">Generar exportación</h2>
        <p className="mb-3 text-sm text-gray-500">
          El PDF y DOCX incluyen portada, resumen ejecutivo, mapa de tratamientos, normativa, cuestionario, fuentes y trazabilidad. El
          logotipo oficial de PymeLegal está pendiente de carga (ver README.md); se muestra un marcador técnico en su lugar.
        </p>
        <GenerateExportButtons diagnosisId={diagnosis.id} />
      </Card>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-brand-900">Exportaciones generadas</h2>
        {exports.length === 0 ? (
          <EmptyState title="Sin exportaciones" description="Aún no se ha generado ninguna exportación para este diagnóstico." />
        ) : (
          <ul className="divide-y divide-gray-100">
            {exports.map((exp) => (
              <li key={exp.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-gray-800">{exp.format}</p>
                  <p className="text-xs text-gray-500">
                    Generado por {exp.generatedBy.name} el {formatDateTimeCL(exp.generatedAt)}
                  </p>
                </div>
                <a href={`/api/exports/${exp.id}`} className="font-medium text-brand-700 hover:underline">
                  Descargar
                </a>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
