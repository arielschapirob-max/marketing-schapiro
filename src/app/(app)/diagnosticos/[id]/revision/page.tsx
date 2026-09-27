import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { Card, EmptyState, Alert, LinkButton } from '@/components/ui/primitives';
import { Badge } from '@/components/ui/badge';
import { DiagnosisTabs } from '@/components/diagnoses/diagnosis-tabs';
import { RunReviewButton } from '@/components/diagnoses/run-review-button';

export default async function ReviewPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const diagnosis = await db.diagnosis.findUnique({ where: { id: params.id }, include: { organization: true } });
  if (!diagnosis) notFound();
  await db.organizationMember.findUnique({ where: { organizationId_userId: { organizationId: diagnosis.organizationId, userId: user!.id } } });

  const questionnaire = await db.questionnaire.findFirst({ where: { diagnosisId: diagnosis.id }, orderBy: { version: 'desc' } });
  const review = questionnaire
    ? await db.review.findFirst({ where: { diagnosisId: diagnosis.id, questionnaireId: questionnaire.id }, orderBy: { runAt: 'desc' }, include: { findings: true } })
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-900">{diagnosis.title}</h1>
        <p className="text-sm text-gray-500">{diagnosis.organization.legalName} — Revisión automática</p>
      </div>
      <DiagnosisTabs diagnosisId={diagnosis.id} active="revision" />

      {!questionnaire ? (
        <EmptyState title="Sin cuestionario" description="Genere el cuestionario antes de ejecutar la revisión." />
      ) : (
        <>
          <Card>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {review ? `Última revisión: ${review.runAt.toLocaleString('es-CL')}` : 'Aún no se ha ejecutado la revisión automática.'}
              </p>
              <RunReviewButton diagnosisId={diagnosis.id} questionnaireId={questionnaire.id} />
            </div>
          </Card>

          {review && (
            <>
              <Alert variant={review.passed ? 'success' : 'error'}>
                {review.passed
                  ? 'Sin bloqueos críticos: el cuestionario puede aprobarse.'
                  : 'Existen bloqueos críticos pendientes. No es posible aprobar hasta resolverlos.'}
              </Alert>

              <Card>
                <h2 className="mb-4 text-base font-semibold text-brand-900">Controles de revisión (CHECK 1–20)</h2>
                <ul className="space-y-2">
                  {review.findings.map((f) => (
                    <li key={f.id} className="flex items-start gap-3 rounded-lg border border-gray-100 p-3 text-sm">
                      <Badge
                        className={
                          f.passed
                            ? 'border-risk-bajo/30 bg-risk-bajo/5 text-risk-bajo'
                            : f.severity === 'blocking'
                              ? 'border-risk-alto/30 bg-risk-alto/5 text-risk-alto'
                              : 'border-risk-medio/30 bg-risk-medio/5 text-risk-medio'
                        }
                      >
                        {f.passed ? 'OK' : f.severity === 'blocking' ? 'BLOQUEANTE' : 'ADVERTENCIA'}
                      </Badge>
                      <div>
                        <p className="font-medium text-gray-800">
                          {f.checkCode}: {f.checkName}
                        </p>
                        <p className="text-gray-600">{f.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>

              <div className="flex justify-end">
                <LinkButton href={`/diagnosticos/${diagnosis.id}/aprobacion`}>Ir a aprobación →</LinkButton>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
