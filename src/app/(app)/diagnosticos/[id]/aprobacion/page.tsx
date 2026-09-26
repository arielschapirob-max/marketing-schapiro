import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { Card, EmptyState, Alert, LinkButton } from '@/components/ui/primitives';
import { DiagnosisTabs } from '@/components/diagnoses/diagnosis-tabs';
import { ApproveForm } from '@/components/diagnoses/approve-form';
import { formatDateTimeCL } from '@/lib/utils';

export default async function ApprovalPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const diagnosis = await db.diagnosis.findUnique({ where: { id: params.id }, include: { organization: true } });
  if (!diagnosis) notFound();
  await db.organizationMember.findUnique({ where: { organizationId_userId: { organizationId: diagnosis.organizationId, userId: user!.id } } });

  const questionnaire = await db.questionnaire.findFirst({ where: { diagnosisId: diagnosis.id }, orderBy: { version: 'desc' } });
  const approval = questionnaire ? await db.approval.findFirst({ where: { diagnosisId: diagnosis.id, questionnaireId: questionnaire.id }, include: { approvedBy: true } }) : null;
  const latestReview = questionnaire ? await db.review.findFirst({ where: { diagnosisId: diagnosis.id, questionnaireId: questionnaire.id }, orderBy: { runAt: 'desc' } }) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-900">{diagnosis.title}</h1>
        <p className="text-sm text-gray-500">{diagnosis.organization.legalName} — Aprobación</p>
      </div>
      <DiagnosisTabs diagnosisId={diagnosis.id} active="aprobacion" />

      {!questionnaire ? (
        <EmptyState title="Sin cuestionario" description="Genere y revise el cuestionario antes de aprobar." />
      ) : approval ? (
        <Alert variant="success">
          Aprobado por {approval.approvedBy.name} el {formatDateTimeCL(approval.approvedAt)}.
          {approval.notes && <p className="mt-1 text-xs">Notas: {approval.notes}</p>}
        </Alert>
      ) : (
        <Card>
          {!latestReview ? (
            <Alert variant="warning">Debe ejecutar la revisión automática antes de poder aprobar.</Alert>
          ) : !latestReview.passed ? (
            <Alert variant="error">La última revisión tiene bloqueos críticos pendientes. Resuélvalos y vuelva a ejecutar la revisión.</Alert>
          ) : (
            <ApproveForm diagnosisId={diagnosis.id} questionnaireId={questionnaire.id} />
          )}
        </Card>
      )}

      {approval && (
        <div className="flex justify-end">
          <LinkButton href={`/diagnosticos/${diagnosis.id}/exportacion`}>Ir a exportación →</LinkButton>
        </div>
      )}
    </div>
  );
}
