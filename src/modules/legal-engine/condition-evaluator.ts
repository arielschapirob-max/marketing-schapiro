import type { Condition, FactBase } from './types';

function getPath(fact: FactBase, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, fact);
}

function toArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null) return [];
  return [value];
}

/**
 * Evalúa una condición de activación contra la base de hechos de un
 * diagnóstico. Devuelve además las rutas (`paths`) que efectivamente
 * dispararon la condición, para trazabilidad ("evidencia que activó la regla").
 */
export function evaluateCondition(
  condition: Condition,
  fact: FactBase,
): { matched: boolean; paths: string[] } {
  if ('op' in condition) {
    switch (condition.op) {
      case 'always':
        return { matched: true, paths: [] };
      case 'nonEmpty': {
        const value = toArray(getPath(fact, condition.path));
        return { matched: value.length > 0, paths: value.length > 0 ? [condition.path] : [] };
      }
      case 'empty': {
        const value = toArray(getPath(fact, condition.path));
        return { matched: value.length === 0, paths: [] };
      }
      case 'includes': {
        const value = toArray(getPath(fact, condition.path)).map((v) => String(v).toLowerCase());
        const matched = value.includes(condition.value.toLowerCase());
        return { matched, paths: matched ? [condition.path] : [] };
      }
      case 'includesAny': {
        const value = toArray(getPath(fact, condition.path)).map((v) => String(v).toLowerCase());
        const wanted = condition.values.map((v) => v.toLowerCase());
        const matched = value.some((v) => wanted.includes(v));
        return { matched, paths: matched ? [condition.path] : [] };
      }
      case 'gte': {
        const raw = getPath(fact, condition.path);
        const value = typeof raw === 'number' ? raw : Number(raw ?? NaN);
        const matched = !Number.isNaN(value) && value >= condition.value;
        return { matched, paths: matched ? [condition.path] : [] };
      }
      case 'lte': {
        const raw = getPath(fact, condition.path);
        const value = typeof raw === 'number' ? raw : Number(raw ?? NaN);
        const matched = !Number.isNaN(value) && value <= condition.value;
        return { matched, paths: matched ? [condition.path] : [] };
      }
      case 'equals': {
        const raw = getPath(fact, condition.path);
        const matched = raw === condition.value;
        return { matched, paths: matched ? [condition.path] : [] };
      }
      default:
        return { matched: false, paths: [] };
    }
  }

  if ('all' in condition) {
    const results = condition.all.map((c) => evaluateCondition(c, fact));
    return {
      matched: results.every((r) => r.matched),
      paths: results.flatMap((r) => r.paths),
    };
  }

  if ('any' in condition) {
    const results = condition.any.map((c) => evaluateCondition(c, fact));
    return {
      matched: results.some((r) => r.matched),
      paths: results.filter((r) => r.matched).flatMap((r) => r.paths),
    };
  }

  if ('not' in condition) {
    const result = evaluateCondition(condition.not, fact);
    return { matched: !result.matched, paths: [] };
  }

  return { matched: false, paths: [] };
}
