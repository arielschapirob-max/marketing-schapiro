'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireUser, requireOrgRole } from '@/lib/auth';
import { logAuditEvent } from '@/modules/audit';

async function getDiagnosisForQuestionnaireQuestion(questionnaireQuestionId: string) {
  const qq = await db.questionnaireQuestion.findUniqueOrThrow({
    where: { id: questionnaireQuestionId },
    include: { questionnaire: { include: { diagnosis: true } } },
  });
  return qq;
}

export async function answerQuestionAction(questionnaireQuestionId: string, value: unknown, dontKnow: boolean, notApplicable: boolean): Promise<void> {
  const user = await requireUser();
  const qq = await getDiagnosisForQuestionnaireQuestion(questionnaireQuestionId);
  const diagnosis = qq.questionnaire.diagnosis;
  await requireOrgRole(user.id, diagnosis.organizationId, 'REVIEWER');

  await db.questionnaireAnswer.create({
    data: {
      questionnaireQuestionId,
      value: value as object,
      dontKnow,
      notApplicable,
      answeredById: user.id,
    },
  });

  revalidatePath(`/diagnosticos/${diagnosis.id}/cuestionario`);
}

export async function toggleQuestionActiveAction(questionnaireQuestionId: string, isActive: boolean, discardedReason?: string): Promise<void> {
  const user = await requireUser();
  const qq = await getDiagnosisForQuestionnaireQuestion(questionnaireQuestionId);
  const diagnosis = qq.questionnaire.diagnosis;
  await requireOrgRole(user.id, diagnosis.organizationId, 'LAWYER');

  await db.questionnaireQuestion.update({
    where: { id: questionnaireQuestionId },
    data: { isActive, discardedReason: isActive ? null : discardedReason },
  });

  await logAuditEvent({
    userId: user.id,
    diagnosisId: diagnosis.id,
    organizationId: diagnosis.organizationId,
    action: isActive ? 'QUESTION_REACTIVATED' : 'QUESTION_DISCARDED',
    entityType: 'QuestionnaireQuestion',
    entityId: questionnaireQuestionId,
    metadata: { discardedReason },
  });
  revalidatePath(`/diagnosticos/${diagnosis.id}/editor-cuestionario`);
}

export async function addCustomQuestionAction(
  questionnaireId: string,
  input: { category: string; text: string; justification: string; legalMatter: string },
): Promise<void> {
  const user = await requireUser();
  const questionnaire = await db.questionnaire.findUniqueOrThrow({ where: { id: questionnaireId }, include: { diagnosis: true } });
  await requireOrgRole(user.id, questionnaire.diagnosis.organizationId, 'LAWYER');

  const code = `Q-CUSTOM-${Date.now()}`;
  const question = await db.question.create({
    data: {
      code,
      category: input.category,
      text: input.text,
      answerType: 'LONG_TEXT',
      required: false,
      justification: input.justification,
      legalMatter: input.legalMatter,
      status: 'ACTIVE',
      author: user.name,
    },
  });

  const maxOrder = await db.questionnaireQuestion.aggregate({ where: { questionnaireId }, _max: { order: true } });

  await db.questionnaireQuestion.create({
    data: {
      questionnaireId,
      questionId: question.id,
      order: (maxOrder._max.order ?? 0) + 1,
      addedByLawyer: true,
      sourceNote: input.justification,
    },
  });

  await logAuditEvent({
    userId: user.id,
    diagnosisId: questionnaire.diagnosisId,
    organizationId: questionnaire.diagnosis.organizationId,
    action: 'CUSTOM_QUESTION_ADDED',
    entityType: 'Question',
    entityId: question.id,
  });
  revalidatePath(`/diagnosticos/${questionnaire.diagnosisId}/editor-cuestionario`);
}
