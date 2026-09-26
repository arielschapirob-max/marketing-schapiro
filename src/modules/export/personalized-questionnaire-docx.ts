import { promises as fs } from 'fs';
import path from 'path';
import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  ImageRun,
  BorderStyle,
  VerticalAlign,
} from 'docx';
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

// Colores extraídos del logo oficial de PymeLegal (public/brand/pymelegal-logo.jpg).
const NAVY = '0E2841';
const ORANGE = 'E97132';
const LIGHT_GRAY = 'F2F2F2';
const BODY_FONT = 'Aptos';

const TABLE_WIDTH_DXA = 9000;
const LOGO_PATH = path.join(process.cwd(), 'public', 'brand', 'pymelegal-logo.jpg');
// Dimensiones reales del archivo (224x84 px) escaladas a un tamaño discreto para el encabezado.
const LOGO_WIDTH = 130;
const LOGO_HEIGHT = 49;

function coverLabelValue(label: string, value: string): Paragraph[] {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 20 },
      children: [new TextRun({ text: label.toUpperCase(), bold: true, color: ORANGE, size: 16, font: BODY_FONT })],
    }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: value, size: 22, font: BODY_FONT })] }),
  ];
}

function glossaryTable(entries: PersonalizedQuestionnaireOutput['glossary']) {
  const headerRow = new TableRow({
    children: [
      new TableCell({
        width: { size: 2500, type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, fill: NAVY },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ children: [new TextRun({ text: 'Término', bold: true, color: 'FFFFFF', font: BODY_FONT })] })],
      }),
      new TableCell({
        width: { size: 6500, type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, fill: NAVY },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ children: [new TextRun({ text: 'Significado', bold: true, color: 'FFFFFF', font: BODY_FONT })] })],
      }),
    ],
  });
  const rows = entries.map(
    (e, i) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2500, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: i % 2 === 0 ? 'FFFFFF' : LIGHT_GRAY },
            children: [new Paragraph({ children: [new TextRun({ text: e.term, bold: true, color: NAVY, font: BODY_FONT })] })],
          }),
          new TableCell({
            width: { size: 6500, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: i % 2 === 0 ? 'FFFFFF' : LIGHT_GRAY },
            children: [new Paragraph({ children: [new TextRun({ text: e.definition, font: BODY_FONT })] })],
          }),
        ],
      }),
  );
  return new Table({ width: { size: TABLE_WIDTH_DXA, type: WidthType.DXA }, columnWidths: [2500, 6500], rows: [headerRow, ...rows] });
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ORANGE, space: 4 } },
    children: [new TextRun({ text, bold: true, color: NAVY, font: BODY_FONT, size: 26 })],
  });
}

/**
 * Genera el .docx del cuestionario personalizado con la identidad visual real
 * de PymeLegal (logo, azul marino #0E2841 y naranjo #E97132 extraídos del
 * logo oficial, tipografía Aptos) y el formato de un diagnóstico profesional
 * real (portada, presentación, glosario, módulos con preguntas abiertas y
 * cerradas, checklist de documentos). El contenido narrativo viene del
 * proveedor de IA configurado (real o MODO MOCK, ver providers/mock.ts); este
 * módulo solo se ocupa del formato visual.
 */
export async function buildPersonalizedQuestionnaireDocx(data: PersonalizedQuestionnaireDocxData): Promise<Buffer> {
  const { output } = data;
  const totalModules = output.modules.length;
  const today = new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });

  let logoImage: Buffer | null = null;
  try {
    logoImage = await fs.readFile(LOGO_PATH);
  } catch {
    logoImage = null;
  }

  const children: (Paragraph | Table)[] = [];

  if (logoImage) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new ImageRun({ data: logoImage, type: 'jpg', transformation: { width: LOGO_WIDTH, height: LOGO_HEIGHT } })],
      }),
    );
  }

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: output.coverPage.title, bold: true, color: NAVY, font: BODY_FONT, size: 44 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [new TextRun({ text: output.coverPage.subtitle, color: NAVY, font: BODY_FONT, size: 24 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: ORANGE, space: 8 } },
      children: [new TextRun({ text: output.coverPage.lawReference, italics: true, color: ORANGE, font: BODY_FONT, size: 20 })],
    }),
  );

  children.push(...coverLabelValue('Preparado para', output.coverPage.preparedFor));
  children.push(...coverLabelValue('Contactos', output.coverPage.contacts));
  children.push(...coverLabelValue('Preparado por', data.preparedByName));
  children.push(...coverLabelValue('Fecha de emisión', today));
  if (data.organizationWebsite) {
    children.push(...coverLabelValue('Sitio web', data.organizationWebsite));
  }
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 40 },
      children: [new TextRun({ text: 'CONFIDENCIAL — USO EXCLUSIVO DEL DESTINATARIO', bold: true, color: NAVY, font: BODY_FONT, size: 16 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 0 },
      children: [new TextRun({ text: 'PymeLegal · Cumplimiento Ley N.º 21.719', color: NAVY, font: BODY_FONT, size: 16, italics: true })],
    }),
  );

  children.push(sectionHeading('Presentación'));
  for (const paragraph of output.presentation) {
    children.push(new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: paragraph, font: BODY_FONT })] }));
  }

  children.push(sectionHeading('Cómo responder'));
  for (const instruction of output.howToRespond) {
    children.push(new Paragraph({ text: instruction, bullet: { level: 0 }, spacing: { after: 80 } }));
  }

  children.push(sectionHeading('Confidencialidad'));
  children.push(new Paragraph({ children: [new TextRun({ text: output.confidentialityNote, font: BODY_FONT })] }));

  if (output.glossary.length > 0) {
    children.push(sectionHeading('Glosario'));
    children.push(
      new Paragraph({
        spacing: { after: 160 },
        children: [
          new TextRun({ text: 'Estos términos aparecen a lo largo del cuestionario. Si alguno no te resulta claro, puedes responder con lo que sepas y marcar "No sé".', font: BODY_FONT }),
        ],
      }),
    );
    children.push(glossaryTable(output.glossary));
  }

  children.push(sectionHeading('Índice de módulos'));
  output.modules.forEach((mod, i) => {
    children.push(
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: `Módulo ${i + 1}. `, bold: true, color: ORANGE, font: BODY_FONT }),
          new TextRun({ text: `${mod.title} — ${mod.areaResponsible} — ${PHASE_LABELS[mod.phase] ?? mod.phase}`, font: BODY_FONT }),
        ],
      }),
    );
  });

  output.modules.forEach((mod, i) => {
    children.push(
      new Paragraph({
        pageBreakBefore: i > 0,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 100 },
        shading: { type: ShadingType.CLEAR, fill: NAVY },
        children: [new TextRun({ text: `  MÓDULO ${i + 1} DE ${totalModules}: ${mod.title.toUpperCase()}`, bold: true, color: 'FFFFFF', font: BODY_FONT, size: 24 })],
      }),
    );
    children.push(
      new Paragraph({
        spacing: { after: 160 },
        children: [new TextRun({ text: `Área responsable sugerida: ${mod.areaResponsible}   |   ${PHASE_LABELS[mod.phase] ?? mod.phase}`, italics: true, color: ORANGE, font: BODY_FONT, size: 18 })],
      }),
    );
    children.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: mod.intro, italics: true, font: BODY_FONT })] }));

    mod.questions.forEach((q) => {
      children.push(
        new Paragraph({
          spacing: { before: 160, after: 80 },
          children: [new TextRun({ text: `${q.number}  `, bold: true, color: NAVY, font: BODY_FONT }), new TextRun({ text: q.text, font: BODY_FONT })],
        }),
      );
      if (q.type === 'cerrada' && q.options) {
        for (const option of q.options) {
          children.push(new Paragraph({ text: `☐  ${option}`, indent: { left: 400 }, spacing: { after: 40 } }));
        }
        if (q.allowsDetail) {
          children.push(new Paragraph({ spacing: { before: 80, after: 120 }, children: [new TextRun({ text: 'Detalle, si corresponde:', italics: true, font: BODY_FONT })] }));
          children.push(new Paragraph({ text: '', spacing: { after: 200 } }));
        }
      } else {
        children.push(new Paragraph({ text: '', spacing: { after: 40 }, border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: 'CCCCCC' } } }));
        children.push(new Paragraph({ text: '', spacing: { after: 200 } }));
      }
    });
  });

  if (output.documentChecklist.length > 0) {
    children.push(sectionHeading('Lista de verificación de documentos'));
    children.push(
      new Paragraph({
        spacing: { after: 160 },
        children: [new TextRun({ text: 'Adjunta, en la medida en que existan, los siguientes documentos. Su ausencia también es un dato para el diagnóstico.', font: BODY_FONT })],
      }),
    );
    for (const doc of output.documentChecklist) {
      children.push(new Paragraph({ text: `☐  ${doc}`, spacing: { after: 60 } }));
    }
  }

  children.push(sectionHeading('Al terminar'));
  children.push(new Paragraph({ children: [new TextRun({ text: output.closingNote, font: BODY_FONT })] }));

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: BODY_FONT, size: 22 } },
        heading1: { run: { font: BODY_FONT, bold: true, color: NAVY, size: 26 } },
      },
    },
    sections: [{ children }],
  });

  return Packer.toBuffer(doc);
}
