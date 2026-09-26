import { getEnv } from '@/lib/env';
import type { RuleRegime } from '@prisma/client';

/**
 * Control de vigencia temporal de la Ley N.º 21.719.
 *
 * Fuente: VERIFICADO contra el texto oficial de BCN (PDF de la Ley N.º
 * 21.719 aportado por el usuario, 56 páginas, generado el 20-mar-2026,
 * última modificación 05-feb-2026 por Ley 21.806). La disposición
 * transitoria "Artículo primero" de la propia ley dispone: "Las
 * modificaciones a las leyes N° 19.628 (...) entrarán en vigencia el día
 * primero del mes vigésimo cuarto posterior a la publicación de esta ley en
 * el Diario Oficial" — publicada el 13-dic-2024, 24 meses después cae el
 * 1-dic-2026. Los propios metadatos del documento de BCN confirman
 * "Versión: Con Vigencia Diferida por Fecha De: 01-DIC-2026", y la versión
 * vigente de la Ley 19.628 revisada en paralelo declara "Fin Vigencia:
 * 30-NOV-2026" — ambas fuentes oficiales coinciden exactamente. La Ley
 * 21.806 (05-feb-2026) solo modificó el procedimiento transitorio de
 * nombramiento de los primeros consejeros de la Agencia, no esta fecha.
 *
 * ALERTA DE SEGUIMIENTO: al buscar fuentes secundarias (antes de tener el
 * PDF oficial) se detectó un proyecto de ley en trámite (boletín 18.623-07)
 * que propondría postergar la vigencia general a 2027. El documento oficial
 * más reciente disponible (20-mar-2026) no refleja ese cambio, pero como
 * este análisis puede ejecutarse en una fecha posterior, se recomienda
 * reconfirmar contra bcn.cl antes de cada uso en producción. Si la fecha
 * cambiara, basta con actualizar LEY_21719_VIGENCIA_GENERAL en el entorno —
 * no requiere cambios de código.
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
