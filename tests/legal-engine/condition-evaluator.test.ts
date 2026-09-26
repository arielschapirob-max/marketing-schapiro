import { describe, it, expect } from 'vitest';
import { evaluateCondition } from '@/modules/legal-engine/condition-evaluator';
import type { FactBase } from '@/modules/legal-engine/types';

function baseFact(overrides: Partial<FactBase> = {}): FactBase {
  return {
    organization: { id: 'org1', sectorKeys: [], country: 'Chile', employeeCount: null, estimatedDataSubjects: null },
    sectorKeys: [],
    dataCategories: [],
    sensitiveData: [],
    dataSubjects: [],
    processingActivities: [],
    technologies: [],
    providers: [],
    thirdParties: [],
    internationalTransfers: [],
    incidents: [],
    securityMeasures: [],
    retentionPractices: [],
    existingDocuments: [],
    ...overrides,
  };
}

describe('evaluateCondition', () => {
  it('always matches', () => {
    expect(evaluateCondition({ op: 'always' }, baseFact()).matched).toBe(true);
  });

  it('nonEmpty matches only when array has items and reports the path', () => {
    const fact = baseFact({ sensitiveData: ['Ficha clínica'] });
    const result = evaluateCondition({ op: 'nonEmpty', path: 'sensitiveData' }, fact);
    expect(result.matched).toBe(true);
    expect(result.paths).toEqual(['sensitiveData']);

    expect(evaluateCondition({ op: 'nonEmpty', path: 'sensitiveData' }, baseFact()).matched).toBe(false);
  });

  it('gte reads nested paths like organization.estimatedDataSubjects', () => {
    const fact = baseFact({ organization: { id: 'org1', sectorKeys: [], country: 'Chile', employeeCount: null, estimatedDataSubjects: 20000 } });
    expect(evaluateCondition({ op: 'gte', path: 'organization.estimatedDataSubjects', value: 10000 }, fact).matched).toBe(true);
    expect(evaluateCondition({ op: 'gte', path: 'organization.estimatedDataSubjects', value: 50000 }, fact).matched).toBe(false);
  });

  it('includesAny is case-insensitive', () => {
    const fact = baseFact({ technologies: ['Inteligencia Artificial'] });
    expect(evaluateCondition({ op: 'includesAny', path: 'technologies', values: ['inteligencia artificial', 'scoring'] }, fact).matched).toBe(true);
  });

  it('combines all/any/not correctly', () => {
    const fact = baseFact({ sensitiveData: ['Datos de salud'] });
    const condition = {
      all: [
        { op: 'nonEmpty' as const, path: 'sensitiveData' },
        { not: { op: 'nonEmpty' as const, path: 'internationalTransfers' } },
      ],
    };
    expect(evaluateCondition(condition, fact).matched).toBe(true);

    const fact2 = baseFact({ sensitiveData: ['Datos de salud'], internationalTransfers: ['AWS US'] });
    expect(evaluateCondition(condition, fact2).matched).toBe(false);
  });
});
