import { Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType } from 'docx';
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

export async function buildDiagnosisDocx(data: ReportData): Promise<Buffer> {
  const children: Paragraph[] = [
    new Paragraph({ text: 'PymeLegal', heading: HeadingLevel.TITLE }),
    new Paragraph({
      children: [new TextRun({ text: '[LOGO PENDIENTE — activo de marca oficial no provisto, ver README.md]', italics: true })],
    }),
    new Paragraph({ text: 'Generador Inteligente de Diagnósticos de Protección de Datos', heading: HeadingLevel.HEADING_2 }),
    new Paragraph({ text: `Organización: ${data.organization.legalName}` }),
    new Paragraph({ text: `Diagnóstico: ${data.diagnosis.title}` }),
    new Paragraph({ text: `Régimen evaluado: ${data.diagnosis.regimeMode}` }),
    new Paragraph({ text: `Fecha de generación: ${data.generatedAt.toLocaleString('es-CL')}` }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'DIAGNÓSTICO PRELIMINAR — no constituye asesoría jurídica definitiva. Requiere revisión y validación por un abogado.',
          italics: true,
        }),
      ],
      alignment: AlignmentType.LEFT,
    }),

    new Paragraph({ text: '1. Resumen ejecutivo', heading: HeadingLevel.HEADING_1 }),
    new Paragraph({
      text: `Se identificaron ${data.diagnosis.findings.length} hallazgo(s) en ${data.findingsByType.size} categoría(s). Sectores detectados: ${
        data.diagnosis.diagnosisSectors.map((s) => s.sector.name).join(', ') || 'ninguno'
      }.`,
    }),

    new Paragraph({ text: '2. Mapa de hallazgos', heading: HeadingLevel.HEADING_1 }),
  ];

  for (const [type, findings] of data.findingsByType) {
    children.push(new Paragraph({ text: TYPE_LABELS[type] ?? type, heading: HeadingLevel.HEADING_2 }));
    for (const f of findings) {
      children.push(new Paragraph({ text: `[${f.certainty}] ${f.description}`, bullet: { level: 0 } }));
    }
  }

  children.push(new Paragraph({ text: '3. Normativa potencialmente aplicable', heading: HeadingLevel.HEADING_1 }));
  for (const ev of data.diagnosis.legalEvaluations) {
    children.push(
      new Paragraph({
        text: `${ev.rule.code} — ${ev.rule.name} (${ev.rule.norm}). Aplicabilidad: ${ev.applicability}. Estado: ${ev.rule.validationStatus}.`,
        bullet: { level: 0 },
      }),
    );
  }

  children.push(new Paragraph({ text: '4. Cuestionario', heading: HeadingLevel.HEADING_1 }));
  if (data.questionnaire) {
    for (const qq of data.questionnaire.questions) {
      children.push(new Paragraph({ text: `[${qq.question.category}] ${qq.question.text}`, bullet: { level: 0 } }));
    }
  }

  children.push(new Paragraph({ text: '5. Revisión y aprobación', heading: HeadingLevel.HEADING_1 }));
  if (data.review) {
    children.push(new Paragraph({ text: `Resultado de la revisión: ${data.review.passed ? 'Aprobable' : 'Con bloqueos pendientes'}` }));
  }
  if (data.approval) {
    children.push(new Paragraph({ text: `Aprobado por ${data.approval.approvedBy.name} el ${data.approval.approvedAt.toLocaleString('es-CL')}` }));
  } else {
    children.push(new Paragraph({ text: 'Sin aprobación registrada.' }));
  }

  const doc = new Document({
    sections: [{ children }],
  });

  return Packer.toBuffer(doc);
}
