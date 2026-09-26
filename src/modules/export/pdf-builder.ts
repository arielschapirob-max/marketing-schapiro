import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';

const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89;
const MARGIN = 56;
const BRAND_COLOR = rgb(0.06, 0.15, 0.26); // brand-900
const GOLD_COLOR = rgb(0.66, 0.5, 0.18);
const MUTED_COLOR = rgb(0.4, 0.44, 0.5);

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export class PdfBuilder {
  private doc!: PDFDocument;
  private font!: PDFFont;
  private boldFont!: PDFFont;
  private page!: PDFPage;
  private y = 0;
  private pageNumber = 0;
  private readonly title: string;
  private readonly generatedAt: Date;

  constructor(title: string, generatedAt: Date) {
    this.title = title;
    this.generatedAt = generatedAt;
  }

  static async create(title: string, generatedAt: Date): Promise<PdfBuilder> {
    const builder = new PdfBuilder(title, generatedAt);
    builder.doc = await PDFDocument.create();
    builder.font = await builder.doc.embedFont(StandardFonts.Helvetica);
    builder.boldFont = await builder.doc.embedFont(StandardFonts.HelveticaBold);
    builder.doc.setTitle(title);
    builder.doc.setProducer('PymeLegal');
    builder.doc.setCreator('PymeLegal — Generador Inteligente de Diagnósticos de Protección de Datos');
    return builder;
  }

  private addPage() {
    this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.pageNumber++;
    this.y = PAGE_HEIGHT - MARGIN;
    if (this.pageNumber > 1) {
      this.page.drawText(this.title, {
        x: MARGIN,
        y: PAGE_HEIGHT - 30,
        size: 8,
        font: this.font,
        color: MUTED_COLOR,
      });
      this.y = PAGE_HEIGHT - MARGIN - 10;
    }
  }

  private ensureSpace(height: number) {
    if (!this.page || this.y - height < MARGIN + 30) {
      this.finishFooter();
      this.addPage();
    }
  }

  private finishFooter() {
    if (!this.page) return;
    this.page.drawText(`PymeLegal — Diagnóstico preliminar — ${this.generatedAt.toLocaleDateString('es-CL')}`, {
      x: MARGIN,
      y: 24,
      size: 7,
      font: this.font,
      color: MUTED_COLOR,
    });
    this.page.drawText(`Página ${this.pageNumber}`, {
      x: PAGE_WIDTH - MARGIN - 50,
      y: 24,
      size: 7,
      font: this.font,
      color: MUTED_COLOR,
    });
  }

  addCoverPage(opts: { organizationName: string; diagnosisTitle: string; version: number; regime: string }) {
    this.addPage();
    this.page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 220, width: PAGE_WIDTH, height: 220, color: BRAND_COLOR });
    this.page.drawText('PymeLegal', {
      x: MARGIN,
      y: PAGE_HEIGHT - 90,
      size: 30,
      font: this.boldFont,
      color: rgb(1, 1, 1),
    });
    this.page.drawText('[LOGO PENDIENTE — ver docs/README.md, activo de marca oficial no provisto]', {
      x: MARGIN,
      y: PAGE_HEIGHT - 112,
      size: 8,
      font: this.font,
      color: rgb(0.85, 0.85, 0.85),
    });
    this.page.drawText('Generador Inteligente de Diagnósticos de Protección de Datos', {
      x: MARGIN,
      y: PAGE_HEIGHT - 135,
      size: 12,
      font: this.font,
      color: rgb(0.9, 0.9, 0.92),
    });

    this.y = PAGE_HEIGHT - 260;
    this.addHeading('Diagnóstico preliminar de protección de datos personales');
    this.addKeyValue('Organización', opts.organizationName);
    this.addKeyValue('Diagnóstico', opts.diagnosisTitle);
    this.addKeyValue('Versión del cuestionario', String(opts.version));
    this.addKeyValue('Régimen normativo evaluado', opts.regime);
    this.addKeyValue('Fecha de generación', this.generatedAt.toLocaleString('es-CL'));

    this.y -= 20;
    this.addParagraph(
      'Este documento constituye un DIAGNÓSTICO PRELIMINAR generado con apoyo de herramientas de análisis automatizado y no sustituye la revisión ni el consejo de un abogado. Los hallazgos se presentan con su nivel de certeza (confirmado, probable, no determinado, inferido o contradictorio) y las materias marcadas como "REQUIERE VALIDACIÓN JURÍDICA" deben ser confirmadas por un profesional antes de adoptar decisiones.',
      { color: MUTED_COLOR, size: 9 },
    );
  }

  addHeading(text: string, level: 1 | 2 = 1) {
    const size = level === 1 ? 16 : 12;
    this.ensureSpace(size + 16);
    this.page.drawText(text, { x: MARGIN, y: this.y, size, font: this.boldFont, color: level === 1 ? BRAND_COLOR : rgb(0.1, 0.1, 0.1) });
    this.y -= size + 10;
    if (level === 1) {
      this.page.drawLine({
        start: { x: MARGIN, y: this.y + 4 },
        end: { x: PAGE_WIDTH - MARGIN, y: this.y + 4 },
        thickness: 1,
        color: GOLD_COLOR,
      });
      this.y -= 8;
    }
  }

  addParagraph(text: string, opts?: { size?: number; color?: ReturnType<typeof rgb> }) {
    const size = opts?.size ?? 10;
    const lines = wrapText(text, this.font, size, PAGE_WIDTH - MARGIN * 2);
    for (const line of lines) {
      this.ensureSpace(size + 4);
      this.page.drawText(line, { x: MARGIN, y: this.y, size, font: this.font, color: opts?.color ?? rgb(0.15, 0.15, 0.15) });
      this.y -= size + 4;
    }
    this.y -= 4;
  }

  addKeyValue(key: string, value: string) {
    this.ensureSpace(14);
    this.page.drawText(`${key}:`, { x: MARGIN, y: this.y, size: 10, font: this.boldFont, color: rgb(0.15, 0.15, 0.15) });
    this.page.drawText(value, { x: MARGIN + 160, y: this.y, size: 10, font: this.font, color: rgb(0.15, 0.15, 0.15) });
    this.y -= 16;
  }

  addBullet(text: string, opts?: { size?: number }) {
    const size = opts?.size ?? 9.5;
    const lines = wrapText(text, this.font, size, PAGE_WIDTH - MARGIN * 2 - 14);
    lines.forEach((line, idx) => {
      this.ensureSpace(size + 3);
      if (idx === 0) {
        this.page.drawText('•', { x: MARGIN, y: this.y, size, font: this.boldFont, color: GOLD_COLOR });
      }
      this.page.drawText(line, { x: MARGIN + 14, y: this.y, size, font: this.font, color: rgb(0.15, 0.15, 0.15) });
      this.y -= size + 3;
    });
    this.y -= 2;
  }

  addSpacer(height = 10) {
    this.y -= height;
  }

  async toBuffer(): Promise<Buffer> {
    this.finishFooter();
    const bytes = await this.doc.save();
    return Buffer.from(bytes);
  }
}
