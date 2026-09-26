import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { Card, EmptyState, LinkButton } from '@/components/ui/primitives';
import { DiagnosisTabs } from '@/components/diagnoses/diagnosis-tabs';
import { GenerateQuestionnaireButton } from '@/components/diagnoses/questionnaire-generate-button';
import { QuestionAnswerRow } from '@/components/diagnoses/question-answer-row';

export default async function QuestionnairePage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const diagnosis = await db.diagnosis.findUnique({ where: { id: params.id }, include: { organization: true } });
  if (!diagnosis) notFound();
  const membership = await db.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: diagnosis.organizationId, userId: user!.id } },
  });
  if (!membership && !user?.isSuperAdmin) notFound();

  const questionnaire = await db.questionnaire.findFirst({
    where: { diagnosisId: diagnosis.id },
    orderBy: { version: 'desc' },
    include: {
      questions: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
        include: { question: true, answers: { orderBy: { answeredAt: 'desc' }, take: 1 } },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-900">{diagnosis.title}</h1>
        <p className="text-sm text-gray-500">{diagnosis.organization.legalName}</p>
      </div>
      <DiagnosisTabs diagnosisId={diagnosis.id} active="cuestionario" />

      {!questionnaire ? (
        <EmptyState
          title="Aún no se ha generado el cuestionario"
          description="El cuestionario se genera automáticamente a partir del análisis del diagnóstico (reunión, documentos y sitio web)."
          action={<GenerateQuestionnaireButton diagnosisId={diagnosis.id} />}
        />
      ) : (
        <>
          <Card>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Versión {questionnaire.version} — {questionnaire.questions.length} pregunta(s) activa(s) — estado: {questionnaire.status}
              </p>
              <GenerateQuestionnaireButton diagnosisId={diagnosis.id} />
            </div>
          </Card>

          <div className="space-y-4">
            {questionnaire.questions.map((qq) => (
              <QuestionAnswerRow
                key={qq.id}
                questionnaireQuestionId={qq.id}
                code={qq.question.code}
                category={qq.question.category}
                text={qq.question.text}
                answerType={qq.question.answerType}
                options={(qq.question.options as string[] | null) ?? null}
                requiresDocument={qq.question.requiresDocument}
                allowsDontKnow={qq.question.allowsDontKnow}
                allowsNotApplicable={qq.question.allowsNotApplicable}
                norm={qq.question.norm}
                justification={qq.question.justification}
                initialValue={qq.answers[0]?.value}
                initialDontKnow={qq.answers[0]?.dontKnow}
                initialNotApplicable={qq.answers[0]?.notApplicable}
              />
            ))}
          </div>

          <div className="flex justify-end gap-3">
            <LinkButton href={`/diagnosticos/${diagnosis.id}/editor-cuestionario`} variant="secondary">
              Editar cuestionario
            </LinkButton>
            <LinkButton href={`/diagnosticos/${diagnosis.id}/revision`}>Ir a revisión →</LinkButton>
          </div>
        </>
      )}
    </div>
  );
}
