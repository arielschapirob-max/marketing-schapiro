import 'server-only';
import { db } from '@/lib/db';

export async function buildReportData(diagnosisId: string) {
  const diagnosis = await db.diagnosis.findUniqueOrThrow({
    where: { id: diagnosisId },
    include: {
      organization: true,
      createdBy: true,
      findings: { orderBy: { type: 'asc' } },
      diagnosisSectors: { include: { sector: true } },
      legalEvaluations: { include: { rule: { include: { source: true } } } },
      questionnaires: {
        orderBy: { version: 'desc' },
        take: 1,
        include: {
          questions: {
            orderBy: { order: 'asc' },
            include: { question: true, answers: { orderBy: { answeredAt: 'desc' }, take: 1 } },
          },
        },
      },
      reviews: { orderBy: { runAt: 'desc' }, take: 1, include: { findings: true } },
      approvals: { orderBy: { approvedAt: 'desc' }, take: 1, include: { approvedBy: true } },
      validationTasks: true,
      webAnalyses: { include: { findings: true } },
      evidence: true,
    },
  });

  const findingsByType = new Map<string, typeof diagnosis.findings>();
  for (const finding of diagnosis.findings) {
    const list = findingsByType.get(finding.type) ?? [];
    list.push(finding);
    findingsByType.set(finding.type, list);
  }

  const openValidationTasks = diagnosis.validationTasks.filter((t) => t.status === 'OPEN');
  const questionnaire = diagnosis.questionnaires[0];
  const review = diagnosis.reviews[0];
  const approval = diagnosis.approvals[0];

  return {
    diagnosis,
    organization: diagnosis.organization,
    findingsByType,
    openValidationTasks,
    questionnaire,
    review,
    approval,
    generatedAt: new Date(),
  };
}

export type ReportData = Awaited<ReturnType<typeof buildReportData>>;
