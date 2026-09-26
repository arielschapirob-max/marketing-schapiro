import { Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType } from 'docx';
import type { PersonalizedQuestionnaireOutput } from '@/modules/ai-engine/schemas';

export interface PersonalizedQuestionnaireDocxData {
  organizationLegalName: string;
  organizationCommercialName: string | null;
  organizationTagline: string | null;
  organizationWebsite: string | null;
  output: PersonalizedQuestionnaireOutput;
}

/**
 * Genera el .docx del cuestionario personalizado, listo para que el abogado
 * lo revise y lo envíe directamente al cliente. El contenido narrativo viene
 * del proveedor de IA configurado (real o MODO MOCK, ver providers/mock.ts);
 * este módulo solo se ocupa del formato visual.
 */
export async function buildPersonalizedQuestionnaireDocx(data: PersonalizedQuestionnaireDocxData): Promise<Buffer> {
  const { output } = data;
  const totalModules = output.modules.length;

  const children: Paragraph[] = [
    new Paragraph({ text: 'CUESTIONARIO DE DIAGNÓSTICO', heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'LEY N.º 21.719 DE PROTECCIÓN DE DATOS PERSONALES', bold: true })],
    }),
    new Paragraph({ text: '' }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: data.organizationCommercialName ?? data.organizationLegalName, bold: true, size: 32 })],
    }),
  ];

  if (data.organizationTagline) {
    children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.organizationTagline, italics: true })] }));
  }
  if (data.organizationWebsite) {
    children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.organizationWebsite, italics: true })] }));
  }
  children.push(
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'PymeLegal · Cumplimiento Ley N.º 21.719', size: 18 })] }),
    new Paragraph({ text: '' }),
  );

  children.push(new Paragraph({ text: 'Antes de empezar', heading: HeadingLevel.HEADING_1 }));
  children.push(new Paragraph({ text: output.greeting }));
  children.push(new Paragraph({ text: output.confidentialityNote }));

  children.push(new Paragraph({ text: 'Contenido de este cuestionario', heading: HeadingLevel.HEADING_1 }));
  output.modules.forEach((mod, i) => {
    children.push(new Paragraph({ text: `Módulo ${i + 1}. ${mod.title}` }));
  });

  output.modules.forEach((mod, i) => {
    children.push(new Paragraph({ text: '' }));
    children.push(new Paragraph({ text: `MÓDULO ${i + 1} DE ${totalModules}: ${mod.title.toUpperCase()}`, heading: HeadingLevel.HEADING_1 }));
    children.push(new Paragraph({ children: [new TextRun({ text: mod.intro, italics: true })] }));
    mod.questions.forEach((question, j) => {
      children.push(new Paragraph({ text: '' }));
      children.push(new Paragraph({ text: `${i + 1}.${j + 1}. ${question}` }));
      children.push(new Paragraph({ text: '' }));
      children.push(new Paragraph({ text: '' }));
    });
  });

  children.push(new Paragraph({ text: '' }));
  children.push(new Paragraph({ text: 'Al terminar', heading: HeadingLevel.HEADING_1 }));
  children.push(new Paragraph({ text: output.closingNote }));

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}
