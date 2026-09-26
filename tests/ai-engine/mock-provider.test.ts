import { describe, it, expect } from 'vitest';
import { mockAIProvider } from '@/modules/ai-engine/providers/mock';
import { validateNoHallucination, extractedFindingSchema } from '@/modules/ai-engine/schemas';

const TRANSCRIPT_SALUD = `
Somos un centro médico. Atendemos pacientes y guardamos su ficha clínica en un sistema de ficha clínica electrónica.
También manejamos licencias médicas de nuestros trabajadores. No compartimos la ficha clínica con nadie fuera del
centro. Usamos Softland para la facturación y guardamos los datos indefinidamente porque no tenemos política de
eliminación definida. Tuvimos un incidente de seguridad el año pasado: un ex funcionario tuvo acceso no autorizado
a un servidor.
`;

describe('proveedor mock de IA (heurística léxica)', () => {
  it('detecta datos sensibles, tecnologías, incidentes y actividad de negocio', async () => {
    const output = await mockAIProvider.analyzeMeetingTranscript({
      transcriptText: TRANSCRIPT_SALUD,
      organizationContext: { legalName: 'Centro Médico Ejemplo', knownSectors: [] },
    });

    const types = output.findings.map((f) => f.type);
    expect(types).toContain('SENSITIVE_DATA');
    expect(types).toContain('TECHNOLOGY');
    expect(types).toContain('INCIDENT');
    expect(types).toContain('BUSINESS_ACTIVITY');
    expect(output.findings.every((f) => extractedFindingSchema.safeParse(f).success)).toBe(true);
  });

  it('nunca marca CONFIRMADO por defecto (heurística siempre conservadora)', async () => {
    const output = await mockAIProvider.analyzeMeetingTranscript({
      transcriptText: TRANSCRIPT_SALUD,
      organizationContext: { legalName: 'Centro Médico Ejemplo', knownSectors: [] },
    });
    expect(output.findings.some((f) => f.certainty === 'CONFIRMADO')).toBe(false);
    expect(validateNoHallucination(output)).toEqual([]);
  });

  it('marca como CONTRADICTORIO una afirmación negada cercanamente ("no compartimos la ficha clínica")', async () => {
    const output = await mockAIProvider.analyzeMeetingTranscript({
      transcriptText: 'No compartimos la ficha clínica con terceros.',
      organizationContext: { legalName: 'Test', knownSectors: [] },
    });
    const ficha = output.findings.find((f) => f.description === 'Ficha clínica');
    expect(ficha?.certainty).toBe('CONTRADICTORIO');
  });

  it('produce cuestionarios diferenciados: un texto de e-commerce no dispara señales de salud', async () => {
    const ecommerce = await mockAIProvider.analyzeMeetingTranscript({
      transcriptText: 'Vendemos productos por nuestra tienda online, con checkout y pasarela de pago Webpay. Usamos Mailchimp para marketing.',
      organizationContext: { legalName: 'Tienda Online SpA', knownSectors: [] },
    });
    expect(ecommerce.findings.some((f) => f.description === 'Ficha clínica')).toBe(false);
    expect(ecommerce.findings.some((f) => f.type === 'PROCESSING_ACTIVITY' && f.description.includes('checkout'))).toBe(true);
  });
});
