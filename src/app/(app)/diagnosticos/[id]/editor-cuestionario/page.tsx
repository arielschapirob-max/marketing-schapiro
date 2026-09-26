import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { Card, EmptyState } from '@/components/ui/primitives';
import { Badge } from '@/components/ui/badge';
import { DiagnosisTabs } from '@/components/diagnoses/diagnosis-tabs';
import { ToggleQuestionButton, AddCustomQuestionForm } from '@/components/diagnoses/editor-controls';

export default async function QuestionnaireEditorPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const diagnosis = await db.diagnosis.findUnique({ where: { id: params.id }, include: { organization: true } });
  if (!diagnosis) notFound();
  await db.organizationMember.findUnique({ where: { organizationId_userId: { organizationId: diagnosis.organizationId, userId: user!.id } } });

  const questionnaire = await db.questionnaire.findFirst({
    where: { diagnosisId: diagnosis.id },
    orderBy: { version: 'desc' },
    include: { questions: { orderBy: { order: 'asc' }, include: { question: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-900">{diagnosis.title}</h1>
        <p className="text-sm text-gray-500">{diagnosis.organization.legalName} — Editor de cuestionario</p>
      </div>
      <DiagnosisTabs diagnosisId={diagnosis.id} active="editor-cuestionario" />

      {!questionnaire ? (
        <EmptyState title="Sin cuestionario" description="Genere primero el cuestionario en la pestaña correspondiente." />
      ) : (
        <>
          <Card>
            <h2 className="mb-3 text-base font-semibold text-brand-900">Agregar pregunta personalizada</h2>
            <AddCustomQuestionForm questionnaireId={questionnaire.id} />
          </Card>

          <Card>
            <h2 className="mb-4 text-base font-semibold text-brand-900">Preguntas del cuestionario</h2>
            <ul className="divide-y divide-gray-100">
              {questionnaire.questions.map((qq) => (
                <li key={qq.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge className="border-gray-200 bg-gray-50 text-gray-500">{qq.question.category}</Badge>
                      {qq.addedByLawyer && <Badge className="border-gold-400/40 bg-gold-100 text-gold-600">Agregada por abogado</Badge>}
                      {!qq.isActive && <Badge className="border-risk-alto/30 bg-risk-alto/5 text-risk-alto">Descartada</Badge>}
                    </div>
                    <p className={qq.isActive ? 'text-sm text-gray-800' : 'text-sm text-gray-400 line-through'}>{qq.question.text}</p>
                    {qq.discardedReason && <p className="text-xs text-gray-400">Motivo: {qq.discardedReason}</p>}
                  </div>
                  <ToggleQuestionButton questionnaireQuestionId={qq.id} isActive={qq.isActive} />
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}
