import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { LEGAL_SOURCES } from '../src/modules/legal-engine/sources';
import { ALL_LEGAL_RULES } from '../src/modules/legal-engine/rules';
import { SECTORS } from '../src/modules/legal-engine/sectors';
import { ALL_QUESTIONS } from '../src/modules/question-engine/bank';

const db = new PrismaClient();

async function seedSources() {
  const map = new Map<string, string>();
  for (const source of LEGAL_SOURCES) {
    const row = await db.legalSource.upsert({
      where: { id: source.code },
      update: { name: source.name, authority: source.authority, url: source.url, officialRef: source.officialRef, notes: source.notes },
      create: { id: source.code, name: source.name, authority: source.authority, url: source.url, officialRef: source.officialRef, notes: source.notes },
    });
    map.set(source.code, row.id);
  }
  return map;
}

async function seedSectors() {
  const map = new Map<string, string>();
  for (const sector of SECTORS) {
    const row = await db.sector.upsert({
      where: { key: sector.key },
      update: {
        name: sector.name,
        description: sector.description,
        activationIndicators: sector.activationIndicators,
        commonProcessing: sector.commonProcessing,
        commonSubjects: sector.commonSubjects,
        dataCategories: sector.dataCategories,
        sensitiveData: sector.sensitiveData,
        commonProviders: sector.commonProviders,
        commonRisks: sector.commonRisks,
        officialLinks: sector.officialLinks,
      },
      create: {
        key: sector.key,
        name: sector.name,
        description: sector.description,
        activationIndicators: sector.activationIndicators,
        commonProcessing: sector.commonProcessing,
        commonSubjects: sector.commonSubjects,
        dataCategories: sector.dataCategories,
        sensitiveData: sector.sensitiveData,
        commonProviders: sector.commonProviders,
        commonRisks: sector.commonRisks,
        officialLinks: sector.officialLinks,
      },
    });
    map.set(sector.key, row.id);
  }
  return map;
}

async function seedRules(sourceMap: Map<string, string>, sectorMap: Map<string, string>) {
  for (const rule of ALL_LEGAL_RULES) {
    const sourceId = sourceMap.get(rule.sourceCode);
    const row = await db.legalRule.upsert({
      where: { code: rule.code },
      update: {
        name: rule.name,
        description: rule.description,
        jurisdiction: rule.jurisdiction,
        subject: rule.subject,
        norm: rule.norm,
        article: rule.article,
        clause: rule.clause,
        status: rule.status,
        regime: rule.regime,
        startDate: rule.startDate ? new Date(rule.startDate) : undefined,
        endDate: rule.endDate ? new Date(rule.endDate) : undefined,
        sourceId,
        officialUrl: rule.officialUrl,
        excerpt: rule.excerpt,
        scope: rule.scope,
        activationConditions: rule.activationConditions as object,
        result: rule.result as object,
        risk: rule.risk,
        severity: rule.severity,
        relatedQuestionCodes: rule.relatedQuestionCodes ?? [],
        requiredEvidence: rule.requiredEvidence ?? [],
        validationStatus: rule.validationStatus,
      },
      create: {
        code: rule.code,
        name: rule.name,
        description: rule.description,
        jurisdiction: rule.jurisdiction,
        subject: rule.subject,
        norm: rule.norm,
        article: rule.article,
        clause: rule.clause,
        status: rule.status,
        regime: rule.regime,
        startDate: rule.startDate ? new Date(rule.startDate) : undefined,
        endDate: rule.endDate ? new Date(rule.endDate) : undefined,
        sourceId,
        officialUrl: rule.officialUrl,
        excerpt: rule.excerpt,
        scope: rule.scope,
        activationConditions: rule.activationConditions as object,
        result: rule.result as object,
        risk: rule.risk,
        severity: rule.severity,
        relatedQuestionCodes: rule.relatedQuestionCodes ?? [],
        requiredEvidence: rule.requiredEvidence ?? [],
        validationStatus: rule.validationStatus,
      },
    });

    for (const sectorKey of rule.sectorKeys ?? []) {
      const sectorId = sectorMap.get(sectorKey);
      if (!sectorId) continue;
      await db.sectorLegalRule.upsert({
        where: { sectorId_ruleId: { sectorId, ruleId: row.id } },
        update: {},
        create: { sectorId, ruleId: row.id },
      });
    }
  }
}

async function seedQuestions(sectorMap: Map<string, string>) {
  for (const q of ALL_QUESTIONS) {
    const row = await db.question.upsert({
      where: { code: q.code },
      update: {
        category: q.category,
        subcategory: q.subcategory,
        text: q.text,
        answerType: q.answerType,
        required: q.required,
        processingTag: q.processingTag,
        order: q.order,
        help: q.help,
        lawyerExplanation: q.lawyerExplanation,
        clientExplanation: q.clientExplanation,
        options: q.options,
        norm: q.norm,
        article: q.article,
        source: q.source,
        requiredEvidence: q.requiredEvidence ?? [],
        justification: q.justification,
        legalMatter: q.legalMatter,
        riskLevel: q.riskLevel,
        requiresDocument: q.requiresDocument ?? false,
        allowsDontKnow: q.allowsDontKnow ?? true,
        allowsNotApplicable: q.allowsNotApplicable ?? true,
        visibilityCondition: q.visibilityCondition as object,
        status: 'ACTIVE',
      },
      create: {
        code: q.code,
        category: q.category,
        subcategory: q.subcategory,
        text: q.text,
        answerType: q.answerType,
        required: q.required,
        processingTag: q.processingTag,
        order: q.order,
        help: q.help,
        lawyerExplanation: q.lawyerExplanation,
        clientExplanation: q.clientExplanation,
        options: q.options,
        norm: q.norm,
        article: q.article,
        source: q.source,
        requiredEvidence: q.requiredEvidence ?? [],
        justification: q.justification,
        legalMatter: q.legalMatter,
        riskLevel: q.riskLevel,
        requiresDocument: q.requiresDocument ?? false,
        allowsDontKnow: q.allowsDontKnow ?? true,
        allowsNotApplicable: q.allowsNotApplicable ?? true,
        visibilityCondition: q.visibilityCondition as object,
        status: 'ACTIVE',
      },
    });

    for (const sectorKey of q.sectorKeys ?? []) {
      const sectorId = sectorMap.get(sectorKey);
      if (!sectorId) continue;
      await db.questionSector.upsert({
        where: { questionId_sectorId: { questionId: row.id, sectorId } },
        update: {},
        create: { questionId: row.id, sectorId },
      });
    }
  }
}

async function seedUsers() {
  const devPassword = process.env.SEED_DEV_PASSWORD ?? 'PymeLegal#2026';
  const passwordHash = await bcrypt.hash(devPassword, 12);

  const admin = await db.user.upsert({
    where: { email: 'admin@pymelegal.cl' },
    update: {},
    create: { email: 'admin@pymelegal.cl', passwordHash, name: 'Administrador PymeLegal', isSuperAdmin: true },
  });

  const abogado = await db.user.upsert({
    where: { email: 'ariel@pymelegal.cl' },
    update: {},
    create: { email: 'ariel@pymelegal.cl', passwordHash, name: 'Ariel Schapiro Bortnik' },
  });

  const revisor = await db.user.upsert({
    where: { email: 'revisor@pymelegal.cl' },
    update: {},
    create: { email: 'revisor@pymelegal.cl', passwordHash, name: 'Revisor de Cuentas' },
  });

  const lector = await db.user.upsert({
    where: { email: 'lector@pymelegal.cl' },
    update: {},
    create: { email: 'lector@pymelegal.cl', passwordHash, name: 'Usuario de Solo Lectura' },
  });

  // eslint-disable-next-line no-console
  console.log(`\nUsuarios de desarrollo creados con contraseña: ${devPassword}`);
  return { admin, abogado, revisor, lector };
}

async function main() {
  // eslint-disable-next-line no-console
  console.log('Sembrando fuentes jurídicas...');
  const sourceMap = await seedSources();

  // eslint-disable-next-line no-console
  console.log('Sembrando catálogo de sectores...');
  const sectorMap = await seedSectors();

  // eslint-disable-next-line no-console
  console.log('Sembrando reglas jurídicas...');
  await seedRules(sourceMap, sectorMap);

  // eslint-disable-next-line no-console
  console.log('Sembrando banco de preguntas...');
  await seedQuestions(sectorMap);

  // eslint-disable-next-line no-console
  console.log('Sembrando usuarios de desarrollo...');
  await seedUsers();

  // eslint-disable-next-line no-console
  console.log('\nSeed completado.');
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
