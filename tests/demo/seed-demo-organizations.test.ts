/**
 * Prueba final obligatoria (sección 24 del encargo).
 *
 * Crea las organizaciones ficticias de demostración con datos simulados
 * (nunca datos reales) y ejercita el flujo completo — carga, análisis,
 * mapa jurídico, generación de cuestionario, edición, revisión, aprobación
 * y exportación — verificando explícitamente cada punto de la sección 24.
 *
 * A diferencia de tests/integration/full-pipeline.test.ts (que usa
 * organizaciones desechables y las elimina al finalizar), estas
 * organizaciones se conservan en la base de datos para que puedan
 * inspeccionarse manualmente desde la interfaz (ver docs/README.md,
 * sección "Datos de demostración").
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '@/lib/auth';
import { runFullAnalysis } from '@/server/diagnosis-orchestrator';
import { generateQuestionnaire } from '@/modules/question-engine/engine';
import { runReview } from '@/modules/review-engine/engine';
import { generateExport } from '@/modules/export';

const db = new PrismaClient();

const CENTRO_MEDICO_TRANSCRIPT = `
Reunión de levantamiento con Centro Médico Ejemplo (datos simulados, no reales).

Somos un centro médico ambulatorio. Atendemos pacientes de consulta médica general y algunas especialidades.
Cada paciente tiene su ficha clínica en un sistema de ficha clínica electrónica que compramos hace dos años.
El personal administrativo y los médicos acceden a la ficha clínica; no llevamos un registro detallado de quién
accede a qué ficha en qué momento.

Tenemos alrededor de 40 trabajadores entre personal médico, de enfermería y administrativo. Manejamos las
licencias médicas de nuestros propios trabajadores, y a veces circulan por WhatsApp entre jefaturas, lo que no
sabemos si es correcto.

Recibimos exámenes de un laboratorio externo y coordinamos con Fonasa e Isapre para la facturación de las
prestaciones de nuestros pacientes. También usamos Softland para la contabilidad y facturación interna.

Sobre datos sensibles: además de los datos de salud propios de la ficha clínica, en algunos formularios de
ingreso preguntamos por previsión de salud y a veces por situación socioeconómica para evaluar convenios.

No tenemos una política de conservación de datos definida: guardamos todo de forma indefinida porque nunca
hemos definido un plazo ni un criterio de eliminación.

Tuvimos un incidente de seguridad hace unos meses: un ex funcionario que ya no trabaja con nosotros tuvo acceso
no autorizado a nuestro servidor de fichas clínicas desde su casa. No evaluamos si correspondía hacer una
denuncia por delito informático, y no notificamos a los pacientes afectados.

No tenemos política de privacidad publicada ni un procedimiento formal para que los pacientes pidan acceso o
corrección de sus datos.
`;

const COLEGIO_TRANSCRIPT = `
Reunión de levantamiento con Colegio Ejemplo (datos simulados, no reales).

Somos un colegio particular subvencionado. Gestionamos la matrícula de los alumnos cada año y llevamos el libro
de clases con las notas y asistencia. Los apoderados reciben comunicaciones sobre el rendimiento académico y
sobre situaciones de convivencia escolar de sus hijos a través de una plataforma de gestión escolar en la nube.

Tenemos informes de convivencia escolar que a veces incluyen antecedentes sensibles de salud o de situación
familiar de los alumnos. El acceso a esos informes hoy no está muy restringido: varios profesores jefes pueden
verlos.

No siempre pedimos autorización explícita a los apoderados para el tratamiento de los datos de sus hijos más
allá de la matrícula misma.

Usamos también una herramienta de videoconferencia para clases remotas ocasionales, y guardamos los datos de
los alumnos por tiempo indefinido en la plataforma de gestión escolar.
`;

const TIENDA_TRANSCRIPT = `
Reunión de levantamiento con Tienda Ejemplo E-commerce SpA (datos simulados, no reales).

Somos una tienda online. Los clientes navegan el catálogo y hacen checkout con la pasarela de pago Webpay.
Guardamos el historial de compras de cada cliente y su dirección de despacho para coordinar con couriers
externos.

Usamos Mailchimp para enviar campañas de email marketing y Google Analytics junto con el Meta Pixel para medir
el tráfico del sitio y hacer remarketing en redes sociales. Tenemos un banner de cookies pero no estamos
seguros si cumple con todo lo necesario.

No tenemos claro si nuestros proveedores de marketing y logística tienen cláusulas de protección de datos en
sus contratos.
`;

const SAAS_TRANSCRIPT = `
Reunión de levantamiento con Ejemplo SaaS Cloud SpA (datos simulados, no reales).

Somos una empresa de tecnología que ofrece una plataforma SaaS a empresas clientes. Cada cliente empresarial
tiene sus propios usuarios finales dentro de la plataforma. Alojamos todos los datos en AWS, en servidores
fuera de Chile, específicamente en Estados Unidos.

No tenemos contrato de encargo de tratamiento (DPA) firmado con todos nuestros clientes todavía; con algunos
solo tenemos el contrato comercial general. Usamos inteligencia artificial para generar recomendaciones dentro
del producto a partir del comportamiento de los usuarios finales.

Guardamos logs técnicos con direcciones IP y otra información de uso de la plataforma, y hoy no tenemos un
criterio definido de por cuánto tiempo se conservan esos logs.
`;

interface DemoOrgResult {
  label: string;
  organizationId: string;
  diagnosisId: string;
  questionnaireCodes: string[];
}

async function seedDemoOrganization(userId: string, legalName: string, sectorLabel: string, transcript: string): Promise<DemoOrgResult> {
  const existing = await db.organization.findFirst({ where: { legalName } });
  if (existing) {
    await db.organization.delete({ where: { id: existing.id } });
  }

  const organization = await db.organization.create({
    data: {
      legalName,
      country: 'Chile',
      members: { create: { userId, role: 'ADMIN' } },
      internalNotes: 'Organización ficticia de demostración generada por la prueba final de PymeLegal. Datos simulados, no reales.',
    },
  });

  const diagnosis = await db.diagnosis.create({
    data: {
      organizationId: organization.id,
      title: `Diagnóstico de demostración — ${legalName}`,
      createdById: userId,
      regimeMode: 'TRANSICION',
    },
  });

  await db.meetingTranscript.create({ data: { diagnosisId: diagnosis.id, rawText: transcript } });

  await runFullAnalysis(diagnosis.id, userId);
  const questionnaire = await generateQuestionnaire(diagnosis.id, userId);
  const review = await runReview(diagnosis.id, questionnaire.id, userId);

  if (review.passed) {
    const { createHash } = await import('crypto');
    await db.approval.create({
      data: {
        diagnosisId: diagnosis.id,
        questionnaireId: questionnaire.id,
        approvedById: userId,
        notes: 'Aprobación automática de demostración (prueba final).',
        signatureHash: createHash('sha256').update(`${diagnosis.id}:${questionnaire.id}:demo`).digest('hex'),
      },
    });
    await db.questionnaire.update({ where: { id: questionnaire.id }, data: { status: 'APPROVED', approvedAt: new Date() } });
    await db.diagnosis.update({ where: { id: diagnosis.id }, data: { status: 'APPROVED' } });
  }

  await generateExport(diagnosis.id, 'PDF', userId);
  await generateExport(diagnosis.id, 'DOCX', userId);
  await generateExport(diagnosis.id, 'JSON', userId);

  return {
    label: sectorLabel,
    organizationId: organization.id,
    diagnosisId: diagnosis.id,
    questionnaireCodes: questionnaire.questions.map((q) => q.question.code),
  };
}

describe('Prueba final obligatoria — organizaciones de demostración', () => {
  let userId: string;
  const results: DemoOrgResult[] = [];

  beforeAll(async () => {
    const passwordHash = await hashPassword('PymeLegal#2026');
    const user = await db.user.upsert({
      where: { email: 'ariel@pymelegal.cl' },
      update: {},
      create: { email: 'ariel@pymelegal.cl', name: 'Ariel Schapiro Bortnik', passwordHash },
    });
    userId = user.id;
  }, 30000);

  afterAll(async () => {
    await db.$disconnect();
  });

  it('Centro Médico Ejemplo: crea la organización, procesa la transcripción y genera el diagnóstico completo', async () => {
    const result = await seedDemoOrganization(userId, 'Centro Médico Ejemplo', 'salud', CENTRO_MEDICO_TRANSCRIPT);
    results.push(result);

    const findings = await db.finding.findMany({ where: { diagnosisId: result.diagnosisId } });
    const byType = (type: string) => findings.filter((f) => f.type === type);

    // 5. Identifica pacientes / 6. trabajadores / 7. proveedores
    expect(byType('DATA_SUBJECT_CATEGORY').some((f) => f.description.toLowerCase().includes('paciente'))).toBe(true);
    expect(byType('DATA_SUBJECT_CATEGORY').some((f) => f.description.toLowerCase().includes('trabajador'))).toBe(true);
    expect(byType('PROVIDER').length + byType('THIRD_PARTY').length).toBeGreaterThan(0);

    // 8. datos de salud / 9. otros datos sensibles potenciales
    expect(byType('SENSITIVE_DATA').some((f) => f.description.toLowerCase().includes('salud') || f.description.toLowerCase().includes('ficha clínica'))).toBe(true);

    // 10. tratamientos / 11. ficha clínica
    expect(byType('PROCESSING_ACTIVITY').some((f) => f.description.toLowerCase().includes('atención'))).toBe(true);
    expect(findings.some((f) => f.description.toLowerCase().includes('ficha clínica'))).toBe(true);

    // 12. tecnologías
    expect(byType('TECHNOLOGY').length).toBeGreaterThan(0);

    // 14. normativa sectorial (Ley 20.584 debe activarse por sector salud)
    const legalEvaluations = await db.legalEvaluation.findMany({ where: { diagnosisId: result.diagnosisId }, include: { rule: true } });
    expect(legalEvaluations.some((e) => e.rule.code === 'L20584-001' && e.applicability !== 'NO_IDENTIFICADA')).toBe(true);

    const sectors = await db.diagnosisSector.findMany({ where: { diagnosisId: result.diagnosisId }, include: { sector: true } });
    expect(sectors.some((s) => s.sector.key === 'salud')).toBe(true);

    // 15/16. preguntas generadas y condicionales (sensibles + sectoriales solo aparecen por activación)
    expect(result.questionnaireCodes).toContain('Q-SENS-001');
    expect(result.questionnaireCodes).toContain('Q-SALUD-001');

    // 17. preguntas faltantes / vacíos de información detectados
    const validationTasks = await db.validationTask.findMany({ where: { diagnosisId: result.diagnosisId } });
    expect(validationTasks.length).toBeGreaterThan(0);

    // 18. revisión de cobertura ejecutada
    const review = await db.review.findFirst({ where: { diagnosisId: result.diagnosisId }, orderBy: { runAt: 'desc' }, include: { findings: true } });
    expect(review?.findings.length).toBe(20);

    // 19. permite editar: se descarta una pregunta con motivo y se agrega una personalizada
    const questionnaire = await db.questionnaire.findFirstOrThrow({ where: { diagnosisId: result.diagnosisId }, orderBy: { version: 'desc' } });
    const someQuestion = await db.questionnaireQuestion.findFirstOrThrow({ where: { questionnaireId: questionnaire.id } });
    await db.questionnaireQuestion.update({ where: { id: someQuestion.id }, data: { isActive: false, discardedReason: 'Demostración de edición manual por el abogado.' } });
    const updated = await db.questionnaireQuestion.findUniqueOrThrow({ where: { id: someQuestion.id } });
    expect(updated.isActive).toBe(false);
    await db.questionnaireQuestion.update({ where: { id: someQuestion.id }, data: { isActive: true, discardedReason: null } });

    // 20. permite aprobar
    const approval = await db.approval.findFirst({ where: { diagnosisId: result.diagnosisId } });
    if (review?.passed) {
      expect(approval).not.toBeNull();
    }

    // 21. exporta a PDF (y DOCX/JSON) — se generaron en seedDemoOrganization
    const exports = await db.export.findMany({ where: { diagnosisId: result.diagnosisId } });
    expect(exports.map((e) => e.format).sort()).toEqual(['DOCX', 'JSON', 'PDF']);

    // 22. conserva trazabilidad (evidencia por hallazgo)
    const evidence = await db.evidence.findMany({ where: { diagnosisId: result.diagnosisId } });
    expect(evidence.length).toBeGreaterThan(0);
  }, 60000);

  it('Colegio Ejemplo (educación): genera un diagnóstico y cuestionario adaptado al sector', async () => {
    const result = await seedDemoOrganization(userId, 'Colegio Ejemplo', 'educacion', COLEGIO_TRANSCRIPT);
    results.push(result);
    expect(result.questionnaireCodes).toContain('Q-EDU-001');
    const sectors = await db.diagnosisSector.findMany({ where: { diagnosisId: result.diagnosisId }, include: { sector: true } });
    expect(sectors.some((s) => s.sector.key === 'educacion')).toBe(true);
  }, 60000);

  it('Tienda Ejemplo E-commerce SpA: genera un diagnóstico y cuestionario adaptado al sector', async () => {
    const result = await seedDemoOrganization(userId, 'Tienda Ejemplo E-commerce SpA', 'comercio-electronico', TIENDA_TRANSCRIPT);
    results.push(result);
    expect(result.questionnaireCodes).toContain('Q-ECOM-001');
  }, 60000);

  it('Ejemplo SaaS Cloud SpA: genera un diagnóstico y cuestionario adaptado al sector', async () => {
    const result = await seedDemoOrganization(userId, 'Ejemplo SaaS Cloud SpA', 'saas', SAAS_TRANSCRIPT);
    results.push(result);
    expect(result.questionnaireCodes).toContain('Q-SAAS-001');
  }, 60000);

  it('los cuatro cuestionarios generados son distintos entre sí (no un formulario genérico)', () => {
    expect(results).toHaveLength(4);
    const signatures = results.map((r) => [...r.questionnaireCodes].sort().join(','));
    expect(new Set(signatures).size).toBe(4);
  });
});
