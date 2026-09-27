import type { LegalSourceSeed } from './types';

// Fuentes oficiales listadas en el encargo (sección 8). Se registran como
// catálogo, aunque en este entorno no fue posible verificar el contenido
// exacto de cada norma contra bcn.cl (dominio bloqueado por el proxy de
// egreso de red del contenedor). Ver docs/LEGAL_ENGINE.md.
export const LEGAL_SOURCES: LegalSourceSeed[] = [
  {
    code: 'BCN_LEYCHILE',
    name: 'Ley Chile — Biblioteca del Congreso Nacional',
    authority: 'Biblioteca del Congreso Nacional',
    url: 'https://www.bcn.cl/leychile/',
    notes: 'Repositorio oficial de normas chilenas. No se pudo acceder en este entorno (egress bloqueado); pendiente verificación directa.',
  },
  {
    code: 'DIARIO_OFICIAL',
    name: 'Diario Oficial de la República de Chile',
    authority: 'Ministerio Secretaría General de Gobierno',
    url: 'https://www.diariooficial.interior.gob.cl/',
  },
  {
    code: 'SUPERSALUD',
    name: 'Superintendencia de Salud',
    authority: 'Superintendencia de Salud',
    url: 'https://www.superdesalud.gob.cl/',
  },
  {
    code: 'MINSAL',
    name: 'Ministerio de Salud',
    authority: 'Ministerio de Salud',
    url: 'https://www.minsal.cl/',
  },
  {
    code: 'SUPEREDUC',
    name: 'Superintendencia de Educación',
    authority: 'Superintendencia de Educación',
    url: 'https://www.supereduc.cl/',
  },
  {
    code: 'CMF',
    name: 'Comisión para el Mercado Financiero',
    authority: 'CMF',
    url: 'https://www.cmfchile.cl/',
  },
  {
    code: 'DT',
    name: 'Dirección del Trabajo',
    authority: 'Dirección del Trabajo',
    url: 'https://www.dt.gob.cl/',
  },
  {
    code: 'SERNAC',
    name: 'Servicio Nacional del Consumidor',
    authority: 'SERNAC',
    url: 'https://www.sernac.cl/',
  },
  {
    code: 'TC',
    name: 'Tribunal Constitucional',
    authority: 'Tribunal Constitucional',
    url: 'https://www.tribunalconstitucional.cl/',
  },
  {
    code: 'PJUD',
    name: 'Poder Judicial',
    authority: 'Poder Judicial',
    url: 'https://www.pjud.cl/',
  },
  {
    code: 'CONTRALORIA',
    name: 'Contraloría General de la República',
    authority: 'Contraloría General de la República',
    url: 'https://www.contraloria.cl/',
  },
  {
    code: 'CPLT',
    name: 'Consejo para la Transparencia',
    authority: 'Consejo para la Transparencia',
    url: 'https://www.consejotransparencia.cl/',
  },
];
