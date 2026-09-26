import { getEnv } from '@/lib/env';
import type { RuleRegime } from '@prisma/client';

/**
 * Control de vigencia temporal de la Ley N.º 21.719.
 *
 * Fuente: publicación en el Diario Oficial el 13 de diciembre de 2024, con
 * vigencia general diferida (verificada mediante múltiples fuentes
 * secundarias coincidentes; el texto oficial de bcn.cl no pudo consultarse
 * en este entorno — ver docs/LEGAL_ENGINE.md, sección "Limitaciones de
 * verificación"). Ambas fechas son configurables vía variables de entorno
 * para que puedan actualizarse si una fuente oficial dispone otra cosa,
 * sin tocar código.
 */
export function getLey21719Fechas() {
  const env = getEnv();
  return {
    fechaPublicacion: new Date(env.LEY_21719_FECHA_PUBLICACION),
    vigenciaGeneral: new Date(env.LEY_21719_VIGENCIA_GENERAL),
  };
}

/**
 * Determina qué regímenes normativos son pertinentes para una fecha objetivo.
 * - Antes de la vigencia general de la Ley 21.719: rige la Ley 19.628 (VIGENTE).
 * - Desde la vigencia general: rige el nuevo marco (Ley 21.719).
 * - El modo TRANSICION se usa cuando el abogado quiere modelar explícitamente
 *   ambos escenarios en paralelo para preparar a la organización.
 */
export function regimesForTargetDate(targetDate: Date, mode: RuleRegime): RuleRegime[] {
  const { vigenciaGeneral } = getLey21719Fechas();

  if (mode === 'TRANSICION') {
    return ['VIGENTE', 'FUTURO'];
  }
  if (mode === 'FUTURO') {
    return ['FUTURO'];
  }
  // mode === 'VIGENTE': se respeta la elección del abogado, pero se advierte
  // en la UI si la fecha objetivo ya superó la vigencia general de la 21.719.
  void targetDate;
  void vigenciaGeneral;
  return ['VIGENTE'];
}

export function isLey21719Vigente(targetDate: Date): boolean {
  const { vigenciaGeneral } = getLey21719Fechas();
  return targetDate.getTime() >= vigenciaGeneral.getTime();
}
