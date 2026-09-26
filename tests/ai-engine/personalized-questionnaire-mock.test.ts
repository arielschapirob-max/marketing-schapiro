import { describe, it, expect } from 'vitest';
import { mockAIProvider } from '@/modules/ai-engine/providers/mock';
import { validatePersonalizedQuestionnaire } from '@/modules/ai-engine/schemas';

const BASE_CONTEXT = { commercialName: null, website: 'cokreadigital.cl', contactName: 'Alejandrina', economicActivity: [] };

describe('proveedor mock — cuestionario personalizado (fallback honesto, no redacción real)', () => {
  it('deja explícito en la presentación que no es una redacción real de IA', async () => {
    const output = await mockAIProvider.generatePersonalizedQuestionnaire({
      organizationContext: { legalName: 'Cocrea Digital', ...BASE_CONTEXT },
      preparedByName: 'Ariel Schapiro Bortnik',
      transcriptExcerpts: ['Recibimos las fichas de brief por WhatsApp.'],
      webFindingSummaries: [],
      existingFindingSummaries: [],
      sectorNames: [],
    });
    expect(output.presentation.join(' ')).toContain('MODO MOCK');
    expect(output.coverPage.contacts).toBe('Alejandrina');
  });

  it('agrupa el banco de preguntas por categoría en módulos con al menos una pregunta', async () => {
    const output = await mockAIProvider.generatePersonalizedQuestionnaire({
      organizationContext: { legalName: 'Cliente de prueba', ...BASE_CONTEXT, contactName: null },
      preparedByName: 'Ariel Schapiro Bortnik',
      transcriptExcerpts: [],
      webFindingSummaries: [],
      existingFindingSummaries: [],
      sectorNames: ['salud'],
    });
    expect(output.modules.length).toBeGreaterThan(0);
    for (const mod of output.modules) {
      expect(mod.questions.length).toBeGreaterThan(0);
      expect(mod.areaResponsible).toBeTruthy();
      expect(['FASE_1_ESENCIAL', 'FASE_2_AMPLIACION']).toContain(mod.phase);
    }
  });

  it('todas las preguntas generadas pasan la validación de forma (abiertas interrogativas, cerradas con opciones)', async () => {
    const output = await mockAIProvider.generatePersonalizedQuestionnaire({
      organizationContext: { legalName: 'Cliente de prueba', ...BASE_CONTEXT, contactName: null },
      preparedByName: 'Ariel Schapiro Bortnik',
      transcriptExcerpts: [],
      webFindingSummaries: [],
      existingFindingSummaries: [],
      sectorNames: [],
    });
    expect(validatePersonalizedQuestionnaire(output)).toEqual([]);
  });
});
