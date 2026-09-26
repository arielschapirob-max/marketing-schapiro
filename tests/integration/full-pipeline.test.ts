import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '@/lib/auth';
import { runFullAnalysis } from '@/server/diagnosis-orchestrator';
import { generateQuestionnaire } from '@/modules/question-engine/engine';
import { runReview } from '@/modules/review-engine/engine';
import { generateExport } from '@/modules/export';

const db = new PrismaClient();

const SECTOR_FIXTURES = [
  {
    label: 'salud',
    legalName: 'Prueba Integración Salud SpA',
    transcript: `Somos un centro médico que atiende pacientes. Guardamos la ficha clínica en un sistema de ficha
clínica electrónica. También manejamos licencias médicas de los trabajadores. Compartimos datos con Fonasa
e Isapre para la facturación de prestaciones. No tenemos política de eliminación de datos definida.`,
  },
  {
    label: 'educacion',
    legalName: 'Prueba Integración Colegio SpA',
    transcript: `Somos un colegio. Gestionamos la matrícula de los alumnos y el libro de clases. Los apoderados
reciben comunicaciones sobre notas y convivencia escolar. Usamos una plataforma de gestión escolar en la nube
para guardar la información académica de los alumnos.`,
  },
  {
    label: 'comercio-electronico',
    legalName: 'Prueba Integración Tienda Online SpA',
    transcript: `Somos una tienda online. Los clientes hacen checkout con pasarela de pago Webpay. Usamos
Mailchimp para email marketing y Google Analytics para medir el tráfico del sitio. Guardamos el historial de
compras de los clientes.`,
  },
  {
    label: 'saas',
    legalName: 'Prueba Integración SaaS Cloud SpA',
    transcript: `Somos una empresa SaaS. Nuestros clientes empresariales usan nuestra plataforma con sus propios
usuarios finales. Alojamos los datos en AWS, en servidores fuera de Chile. No tenemos contrato de encargo de
tratamiento (DPA) firmado con todos los clientes todavía.`,
  },
];

describe('pipeline completo end-to-end (integración con PostgreSQL real)', () => {
  const createdOrgIds: string[] = [];
  let userId: string;
  const questionCodesBySector = new Map<string, Set<string>>();

  beforeAll(async () => {
    const passwordHash = await hashPassword('IntegrationTest#2026');
    const user = await db.user.upsert({
      where: { email: 'integration-tests@pymelegal.cl' },
      update: {},
      create: { email: 'integration-tests@pymelegal.cl', name: 'Integration Test Runner', passwordHash },
    });
    userId = user.id;
  }, 30000);

  afterAll(async () => {
    for (const orgId of createdOrgIds) {
      await db.organization.delete({ where: { id: orgId } }).catch(() => undefined);
    }
    await db.$disconnect();
  });

  it.each(SECTOR_FIXTURES)('ejecuta el flujo completo para el sector %s', async ({ label, legalName, transcript }) => {
    const organization = await db.organization.create({
      data: { legalName, members: { create: { userId, role: 'ADMIN' } } },
    });
    createdOrgIds.push(organization.id);

    const diagnosis = await db.diagnosis.create({
      data: { organizationId: organization.id, title: `Diagnóstico de prueba — ${label}`, createdById: userId, regimeMode: 'TRANSICION' },
    });

    await db.meetingTranscript.create({ data: { diagnosisId: diagnosis.id, rawText: transcript } });

    await runFullAnalysis(diagnosis.id, userId);

    const findings = await db.finding.findMany({ where: { diagnosisId: diagnosis.id } });
    expect(findings.length).toBeGreaterThan(0);

    const legalEvaluations = await db.legalEvaluation.findMany({ where: { diagnosisId: diagnosis.id } });
    expect(legalEvaluations.length).toBeGreaterThan(0);
    expect(legalEvaluations.some((e) => e.regime === 'VIGENTE')).toBe(true);
    expect(legalEvaluations.some((e) => e.regime === 'FUTURO')).toBe(true);

    const questionnaire = await generateQuestionnaire(diagnosis.id, userId);
    expect(questionnaire.questions.length).toBeGreaterThan(0);
    questionCodesBySector.set(label, new Set(questionnaire.questions.map((q) => q.question.code)));

    const review = await runReview(diagnosis.id, questionnaire.id, userId);
    expect(review.findings).toHaveLength(20);

    const exportRecord = await generateExport(diagnosis.id, 'JSON', userId);
    expect(exportRecord.id).toBeTruthy();

    const updatedDiagnosis = await db.diagnosis.findUniqueOrThrow({ where: { id: diagnosis.id } });
    expect(['IN_REVIEW', 'EXPORTED']).toContain(updatedDiagnosis.status);
  }, 60000);

  it('genera cuestionarios distintos para cada sector (no un formulario genérico idéntico)', () => {
    const labels = [...questionCodesBySector.keys()];
    for (let i = 0; i < labels.length; i++) {
      for (let j = i + 1; j < labels.length; j++) {
        const a = questionCodesBySector.get(labels[i]!)!;
        const b = questionCodesBySector.get(labels[j]!)!;
        const symmetricDifference = new Set([...a].filter((x) => !b.has(x)).concat([...b].filter((x) => !a.has(x))));
        expect(symmetricDifference.size, `${labels[i]} vs ${labels[j]} deberían diferir`).toBeGreaterThan(0);
      }
    }
  });
});
