import { PdfBuilder } from './pdf-builder';
import type { ReportData } from './build-report-data';

const TYPE_LABELS: Record<string, string> = {
  PROCESSING_ACTIVITY: 'Tratamientos de datos',
  DATA_SUBJECT_CATEGORY: 'Categorías de titulares',
  DATA_CATEGORY: 'Categorías de datos',
  SENSITIVE_DATA: 'Datos sensibles',
  TECHNOLOGY: 'Tecnologías',
  PROVIDER: 'Proveedores',
  THIRD_PARTY: 'Terceros',
  INTERNATIONAL_TRANSFER: 'Transferencias internacionales',
  INCIDENT: 'Incidentes',
  SECURITY_MEASURE: 'Medidas de seguridad',
  RETENTION_PRACTICE: 'Prácticas de conservación',
  EXISTING_DOCUMENT: 'Documentos existentes',
};

export async function buildDiagnosisPdf(data: ReportData): Promise<Buffer> {
  const builder = await PdfBuilder.create(`Diagnóstico PymeLegal — ${data.organization.legalName}`, data.generatedAt);

  builder.addCoverPage({
    organizationName: data.organization.legalName,
    diagnosisTitle: data.diagnosis.title,
    version: data.questionnaire?.version ?? 0,
    regime: data.diagnosis.regimeMode,
  });

  builder.addHeading('1. Resumen ejecutivo');
  builder.addParagraph(
    `Este diagnóstico preliminar identificó ${data.diagnosis.findings.length} hallazgo(s) sobre la organización "${data.organization.legalName}", ` +
      `distribuidos en ${data.findingsByType.size} categoría(s). Se detectaron ${data.diagnosis.diagnosisSectors.length} sector(es) regulatorio(s) potencialmente aplicable(s). ` +
      `El cuestionario generado contiene ${data.questionnaire?.questions.length ?? 0} pregunta(s). ` +
      `Existen ${data.openValidationTasks.length} tarea(s) de validación pendiente(s).`,
  );
  builder.addParagraph(
    'ADVERTENCIA PROFESIONAL: este informe no constituye asesoría jurídica definitiva. Los hallazgos e hipótesis deben ser validados por un abogado antes de adoptar decisiones o comunicarlos a terceros.',
    { color: undefined },
  );

  builder.addHeading('2. Organización');
  builder.addKeyValue('Nombre legal', data.organization.legalName);
  builder.addKeyValue('Nombre comercial', data.organization.commercialName ?? 'No informado');
  builder.addKeyValue('Identificador (RUT)', data.organization.identifier ?? 'No informado');
  builder.addKeyValue('Sitio web', data.organization.website ?? 'No informado');
  builder.addKeyValue('Actividad económica', data.organization.economicActivity.join(', ') || 'No informada');
  builder.addKeyValue(
    'Sectores detectados',
    data.diagnosis.diagnosisSectors.map((s) => `${s.sector.name} (${s.certainty})`).join(', ') || 'Ninguno',
  );

  builder.addHeading('3. Mapa de hallazgos por categoría');
  for (const [type, findings] of data.findingsByType) {
    builder.addHeading(TYPE_LABELS[type] ?? type, 2);
    for (const f of findings) {
      builder.addBullet(`[${f.certainty}] ${f.description}${f.relatedNorm ? ` — norma: ${f.relatedNorm}` : ''}`);
    }
  }
  if (data.findingsByType.size === 0) {
    builder.addParagraph('No se registraron hallazgos estructurados para este diagnóstico.');
  }

  builder.addHeading('4. Normativa potencialmente aplicable');
  for (const ev of data.diagnosis.legalEvaluations) {
    builder.addBullet(
      `${ev.rule.code} — ${ev.rule.name} (${ev.rule.norm}). Aplicabilidad: ${ev.applicability}. Régimen: ${ev.regime}. ` +
        `Estado de validación: ${ev.rule.validationStatus}. ${ev.reasoning}`,
    );
  }
  if (data.diagnosis.legalEvaluations.length === 0) {
    builder.addParagraph('El motor jurídico aún no ha sido ejecutado para este diagnóstico.');
  }

  builder.addHeading('5. Riesgos y vacíos de información');
  const riskFindings = data.diagnosis.legalEvaluations.filter((e) => e.rule.severity && e.applicability !== 'NO_IDENTIFICADA');
  for (const ev of riskFindings) {
    builder.addBullet(`[Riesgo ${ev.rule.severity ?? 'no evaluado'}] ${ev.rule.risk ?? ev.rule.name}`);
  }
  builder.addHeading('Tareas de validación pendientes', 2);
  for (const task of data.openValidationTasks) {
    builder.addBullet(`(${task.type}${task.blocking ? ' — BLOQUEANTE' : ''}) ${task.description}`);
  }
  if (data.openValidationTasks.length === 0) {
    builder.addParagraph('No hay tareas de validación pendientes al momento de exportar.');
  }

  builder.addHeading('6. Cuestionario');
  if (data.questionnaire) {
    for (const qq of data.questionnaire.questions) {
      const answer = qq.answers[0];
      builder.addBullet(
        `[${qq.question.category}] ${qq.question.text}` +
          (answer ? ` — Respuesta: ${JSON.stringify(answer.value ?? (answer.dontKnow ? 'No sabe' : answer.notApplicable ? 'No aplica' : ''))}` : ' — Sin responder'),
      );
    }
  } else {
    builder.addParagraph('Aún no se ha generado un cuestionario para este diagnóstico.');
  }

  builder.addHeading('7. Fuentes y trazabilidad');
  const uniqueSources = new Map<string, { name: string; url: string }>();
  for (const ev of data.diagnosis.legalEvaluations) {
    if (ev.rule.source) uniqueSources.set(ev.rule.source.id, { name: ev.rule.source.name, url: ev.rule.source.url });
  }
  for (const [, source] of uniqueSources) {
    builder.addBullet(`${source.name} — ${source.url}`);
  }
  builder.addParagraph(`Evidencias registradas: ${data.diagnosis.evidence.length}. Cada hallazgo estructurado conserva su excerpto de origen y ubicación en el sistema (no reproducidos íntegramente en este PDF por extensión).`);

  builder.addHeading('8. Revisión y aprobación');
  if (data.review) {
    builder.addKeyValue('Última revisión', data.review.runAt.toLocaleString('es-CL'));
    builder.addKeyValue('Resultado', data.review.passed ? 'Aprobable (sin bloqueos)' : 'Con bloqueos pendientes');
    for (const f of data.review.findings.filter((f) => !f.passed)) {
      builder.addBullet(`[${f.severity.toUpperCase()}] ${f.checkCode}: ${f.description}`);
    }
  } else {
    builder.addParagraph('No se ha ejecutado la revisión automática para este diagnóstico.');
  }
  if (data.approval) {
    builder.addKeyValue('Aprobado por', data.approval.approvedBy.name);
    builder.addKeyValue('Fecha de aprobación', data.approval.approvedAt.toLocaleString('es-CL'));
  } else {
    builder.addParagraph('Este diagnóstico aún no ha sido aprobado formalmente por un abogado.');
  }

  return builder.toBuffer();
}
