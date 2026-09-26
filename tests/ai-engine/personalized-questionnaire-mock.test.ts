import { describe, it, expect } from 'vitest';
import { mockAIProvider } from '@/modules/ai-engine/providers/mock';
import { validatePersonalizedQuestionnaire } from '@/modules/ai-engine/schemas';

describe('proveedor mock — cuestionario personalizado (fallback honesto, no redacción real)', () => {
  it('deja explícito en el saludo que no es una redacción real de IA', async () => {
    const output = await mockAIProvider.generatePersonalizedQuestionnaire({
      organizationContext: { legalName: 'Cocrea Digital', commercialName: null, website: 'cokreadigital.cl', contactName: 'Alejandrina' },
      transcriptExcerpts: ['Recibimos las fichas de brief por WhatsApp.'],
      webFindingSummaries: [],
      existingFindingSummaries: [],
      sectorNames: [],
    });
    expect(output.greeting).toContain('MODO MOCK');
    expect(output.greeting).toContain('Alejandrina');
  });

  it('agrupa el banco de preguntas por categoría en módulos con al menos una pregunta', async () => {
    const output = await mockAIProvider.generatePersonalizedQuestionnaire({
      organizationContext: { legalName: 'Cliente de prueba', commercialName: null, website: null, contactName: null },
      transcriptExcerpts: [],
      webFindingSummaries: [],
      existingFindingSummaries: [],
      sectorNames: ['salud'],
    });
    expect(output.modules.length).toBeGreaterThan(0);
    for (const mod of output.modules) {
      expect(mod.questions.length).toBeGreaterThan(0);
    }
  });

  it('todas las preguntas generadas tienen forma interrogativa (pasan la validación de forma)', async () => {
    const output = await mockAIProvider.generatePersonalizedQuestionnaire({
      organizationContext: { legalName: 'Cliente de prueba', commercialName: null, website: null, contactName: null },
      transcriptExcerpts: [],
      webFindingSummaries: [],
      existingFindingSummaries: [],
      sectorNames: [],
    });
    expect(validatePersonalizedQuestionnaire(output)).toEqual([]);
  });
});
