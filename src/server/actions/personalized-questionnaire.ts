'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireUser, requireOrgRole } from '@/lib/auth';
import { generatePersonalizedQuestionnaireExport } from '@/modules/export/personalized-questionnaire';

export async function generatePersonalizedQuestionnaireAction(diagnosisId: string): Promise<{ error?: string; exportId?: string }> {
  const user = await requireUser();
  const diagnosis = await db.diagnosis.findUniqueOrThrow({ where: { id: diagnosisId } });
  await requireOrgRole(user.id, diagnosis.organizationId, 'LAWYER');

  try {
    const exportRecord = await generatePersonalizedQuestionnaireExport(diagnosisId, user.id);
    revalidatePath(`/diagnosticos/${diagnosisId}/cuestionario`);
    return { exportId: exportRecord.id };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}
