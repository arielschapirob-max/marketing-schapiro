import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { Card, LinkButton } from '@/components/ui/primitives';
import { StatusBadge } from '@/components/ui/badge';
import { TranscriptForm, WebUrlForm, FileUploadForm, RunAnalysisButton } from '@/components/diagnoses/upload-forms';
import { DiagnosisTabs } from '@/components/diagnoses/diagnosis-tabs';

export default async function DiagnosisUploadPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const diagnosis = await db.diagnosis.findUnique({
    where: { id: params.id },
    include: {
      organization: true,
      files: { orderBy: { createdAt: 'desc' } },
      transcripts: { orderBy: { createdAt: 'desc' } },
      webAnalyses: { orderBy: { startedAt: 'desc' } },
    },
  });
  if (!diagnosis) notFound();
  const membership = await db.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: diagnosis.organizationId, userId: user!.id } },
  });
  if (!membership && !user?.isSuperAdmin) notFound();

  const hasInput = diagnosis.transcripts.length > 0 || diagnosis.files.length > 0 || diagnosis.webAnalyses.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-900">{diagnosis.title}</h1>
        <p className="text-sm text-gray-500">{diagnosis.organization.legalName} — <StatusBadge status={diagnosis.status} /></p>
      </div>

      <DiagnosisTabs diagnosisId={diagnosis.id} active="carga" status={diagnosis.status} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-base font-semibold text-brand-900">Transcripción de reunión</h2>
          <TranscriptForm diagnosisId={diagnosis.id} />
          {diagnosis.transcripts.length > 0 && (
            <p className="mt-3 text-xs text-gray-500">{diagnosis.transcripts.length} transcripción(es) cargada(s).</p>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-base font-semibold text-brand-900">Documentos adicionales</h2>
          <FileUploadForm diagnosisId={diagnosis.id} />
          {diagnosis.files.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs text-gray-600">
              {diagnosis.files.map((f) => (
                <li key={f.id} className="flex items-center justify-between">
                  <span>{f.originalName}</span>
                  <span className="text-gray-400">{f.status}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-base font-semibold text-brand-900">Sitio web de la organización</h2>
          <WebUrlForm diagnosisId={diagnosis.id} />
          {diagnosis.webAnalyses.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs text-gray-600">
              {diagnosis.webAnalyses.map((w) => (
                <li key={w.id} className="flex items-center justify-between">
                  <span>{w.url}</span>
                  <span className="text-gray-400">{w.status}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-base font-semibold text-brand-900">Análisis</h2>
          <p className="mb-3 text-sm text-gray-500">
            Ejecuta el motor de análisis (reunión + documentos + sitio web) y el motor jurídico. Requiere al menos una fuente de información cargada.
          </p>
          <RunAnalysisButton diagnosisId={diagnosis.id} disabled={!hasInput} />
          {diagnosis.status === 'ANALYSIS_COMPLETED' || diagnosis.status === 'QUESTIONNAIRE_GENERATED' || diagnosis.status === 'IN_REVIEW' || diagnosis.status === 'APPROVED' || diagnosis.status === 'EXPORTED' ? (
            <div className="mt-3">
              <LinkButton href={`/diagnosticos/${diagnosis.id}/mapa`} variant="secondary" className="w-full">
                Ver mapa jurídico →
              </LinkButton>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
