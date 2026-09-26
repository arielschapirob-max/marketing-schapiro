import { Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, ShadingType } from 'docx';
import type { PersonalizedQuestionnaireOutput } from '@/modules/ai-engine/schemas';

export interface PersonalizedQuestionnaireDocxData {
  organizationLegalName: string;
  organizationCommercialName: string | null;
  organizationTagline: string | null;
  organizationWebsite: string | null;
  preparedByName: string;
  output: PersonalizedQuestionnaireOutput;
}

const PHASE_LABELS: Record<string, string> = {
  FASE_1_ESENCIAL: 'Fase 1 (esencial)',
  FASE_2_AMPLIACION: 'Fase 2 (ampliación)',
};

const TABLE_WIDTH_DXA = 9000;

function glossaryTable(entries: PersonalizedQuestionnaireOutput['glossary']) {
  const headerRow = new TableRow({
    children: [
      new TableCell({ width: { size: 2500, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, fill: 'E5E7EB' }, children: [new Paragraph({ children: [new TextRun({ text: 'Término', bold: true })] })] }),
      new TableCell({ width: { size: 6500, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, fill: 'E5E7EB' }, children: [new Paragraph({ children: [new TextRun({ text: 'Significado', bold: true })] })] }),
    ],
  });
  const rows = entries.map(
    (e) =>
      new TableRow({
        children: [
          new TableCell({ width: { size: 2500, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: e.term, bold: true })] })] }),
          new TableCell({ width: { size: 6500, type: WidthType.DXA }, children: [new Paragraph({ text: e.definition })] }),
        ],
      }),
  );
  return new Table({ width: { size: TABLE_WIDTH_DXA, type: WidthType.DXA }, columnWidths: [2500, 6500], rows: [headerRow, ...rows] });
}

/**
 * Genera el .docx del cuestionario personalizado con el formato de un
 * diagnóstico profesional real (portada, presentación, glosario, módulos con
 * preguntas abiertas y cerradas, checklist de documentos) — el contenido
 * narrativo viene del proveedor de IA configurado (real o MODO MOCK, ver
 * providers/mock.ts); este módulo solo se ocupa del formato visual.
 */
export async function buildPersonalizedQuestionnaireDocx(data: PersonalizedQuestionnaireDocxData): Promise<Buffer> {
  const { output } = data;
  const totalModules = output.modules.length;
  const today = new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });

  const children: (Paragraph | Table)[] = [
    new Paragraph({ text: output.coverPage.title, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: output.coverPage.subtitle, bold: true })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: output.coverPage.lawReference, italics: true })] }),
    new Paragraph({ text: '' }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Preparado para', bold: true })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, text: output.coverPage.preparedFor }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Contactos', bold: true })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, text: output.coverPage.contacts }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Preparado por', bold: true })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, text: data.preparedByName }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Fecha de emisión', bold: true })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, text: today }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Carácter', bold: true })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Confidencial. Uso exclusivo del destinatario.', italics: true })] }),
  ];

  if (data.organizationWebsite) {
    children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.organizationWebsite, italics: true })] }));
  }
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'PymeLegal · Cumplimiento Ley N.º 21.719', size: 18 })] }), new Paragraph({ text: '' }));

  children.push(new Paragraph({ text: 'Presentación', heading: HeadingLevel.HEADING_1 }));
  for (const paragraph of output.presentation) {
    children.push(new Paragraph({ text: paragraph }));
  }

  children.push(new Paragraph({ text: 'Cómo responder', heading: HeadingLevel.HEADING_1 }));
  for (const instruction of output.howToRespond) {
    children.push(new Paragraph({ text: instruction, bullet: { level: 0 } }));
  }

  children.push(new Paragraph({ text: 'Confidencialidad', heading: HeadingLevel.HEADING_1 }));
  children.push(new Paragraph({ text: output.confidentialityNote }));

  if (output.glossary.length > 0) {
    children.push(new Paragraph({ text: 'Glosario', heading: HeadingLevel.HEADING_1 }));
    children.push(
      new Paragraph({ text: 'Estos términos aparecen a lo largo del cuestionario. Si alguno no te resulta claro, puedes responder con lo que sepas y marcar "No sé".' }),
    );
    children.push(glossaryTable(output.glossary));
    children.push(new Paragraph({ text: '' }));
  }

  children.push(new Paragraph({ text: 'Índice de módulos', heading: HeadingLevel.HEADING_1 }));
  output.modules.forEach((mod, i) => {
    children.push(new Paragraph({ text: `Módulo ${i + 1}. ${mod.title} — ${mod.areaResponsible} — ${PHASE_LABELS[mod.phase] ?? mod.phase}` }));
  });

  output.modules.forEach((mod, i) => {
    children.push(new Paragraph({ text: '' }));
    children.push(new Paragraph({ text: `MÓDULO ${i + 1} DE ${totalModules}: ${mod.title.toUpperCase()}`, heading: HeadingLevel.HEADING_1 }));
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `Área responsable sugerida: ${mod.areaResponsible}   |   ${PHASE_LABELS[mod.phase] ?? mod.phase}`, italics: true, size: 18 })],
      }),
    );
    children.push(new Paragraph({ children: [new TextRun({ text: mod.intro, italics: true })] }));

    mod.questions.forEach((q) => {
      children.push(new Paragraph({ text: '' }));
      children.push(new Paragraph({ children: [new TextRun({ text: `${q.number}. `, bold: true }), new TextRun({ text: q.text })] }));
      if (q.type === 'cerrada' && q.options) {
        for (const option of q.options) {
          children.push(new Paragraph({ text: `☐  ${option}`, indent: { left: 360 } }));
        }
        if (q.allowsDetail) {
          children.push(new Paragraph({ text: 'Detalle, si corresponde:' }));
          children.push(new Paragraph({ text: '' }));
        }
      } else {
        children.push(new Paragraph({ text: '' }));
        children.push(new Paragraph({ text: '' }));
      }
    });
  });

  if (output.documentChecklist.length > 0) {
    children.push(new Paragraph({ text: '' }));
    children.push(new Paragraph({ text: 'Lista de verificación de documentos', heading: HeadingLevel.HEADING_1 }));
    children.push(new Paragraph({ text: 'Adjunta, en la medida en que existan, los siguientes documentos. Su ausencia también es un dato para el diagnóstico.' }));
    for (const doc of output.documentChecklist) {
      children.push(new Paragraph({ text: `☐  ${doc}` }));
    }
  }

  children.push(new Paragraph({ text: '' }));
  children.push(new Paragraph({ text: 'Al terminar', heading: HeadingLevel.HEADING_1 }));
  children.push(new Paragraph({ text: output.closingNote }));

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}
