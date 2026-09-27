import { describe, it, expect } from 'vitest';
import { regimesForTargetDate, isLey21719Vigente } from '@/modules/legal-engine/vigencia';

describe('vigencia de la Ley 21.719', () => {
  it('nunca mezcla vigente y futuro salvo modo TRANSICION', () => {
    expect(regimesForTargetDate(new Date('2026-01-01'), 'VIGENTE')).toEqual(['VIGENTE']);
    expect(regimesForTargetDate(new Date('2027-01-01'), 'FUTURO')).toEqual(['FUTURO']);
    expect(regimesForTargetDate(new Date('2026-06-01'), 'TRANSICION')).toEqual(['VIGENTE', 'FUTURO']);
  });

  it('calcula si la Ley 21.719 está vigente según la fecha de vigencia general configurada', () => {
    expect(isLey21719Vigente(new Date('2026-01-01'))).toBe(false);
    expect(isLey21719Vigente(new Date('2026-12-01'))).toBe(true);
    expect(isLey21719Vigente(new Date('2027-01-01'))).toBe(true);
  });
});
