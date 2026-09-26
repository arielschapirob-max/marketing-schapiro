import type { LegalRuleSeed } from '../types';

// Normativa sectorial adicional mencionada explícitamente en el encargo.
// Todas las reglas se marcan REQUIERE_VALIDACION_JURIDICA: se reconoce la
// existencia y materia general de cada ley (hecho de conocimiento público),
// pero el detalle articulado no pudo contrastarse contra bcn.cl en este
// entorno. Nunca se afirma aplicación automática; siempre "potencialmente
// aplicable" sujeto a revisión del abogado.
export const SECTORIAL_RULES: LegalRuleSeed[] = [
  {
    code: 'L20584-001',
    name: 'Ficha clínica y datos de salud (Ley 20.584)',
    description:
      'La Ley N.º 20.584, sobre derechos y deberes de las personas en su atención de salud, regula la ficha clínica y el tratamiento de información de salud de los pacientes. Potencialmente aplicable a prestadores de salud.',
    jurisdiction: 'Chile',
    subject: 'Salud — ficha clínica',
    norm: 'Ley N.º 20.584',
    status: 'REQUIERE_VALIDACION_JURIDICA',
    regime: 'VIGENTE',
    sourceCode: 'BCN_LEYCHILE',
    activationConditions: {
      any: [
        { op: 'includes', path: 'sectorKeys', value: 'salud' },
        { op: 'includes', path: 'sensitiveData', value: 'Ficha clínica' },
      ],
    },
    result: {
      obligationSummary:
        'Revisar el cumplimiento de las reglas específicas de confidencialidad, acceso y conservación de la ficha clínica.',
      references: ['Ley N.º 20.584'],
    },
    risk: 'Manejo de ficha clínica sin resguardos sectoriales específicos',
    severity: 'alto',
    relatedQuestionCodes: ['Q-SALUD-001'],
    requiredEvidence: ['Política de manejo de ficha clínica'],
    validationStatus: 'REQUIERE_VALIDACION_JURIDICA',
    sectorKeys: ['salud'],
  },
  {
    code: 'L21663-001',
    name: 'Marco de ciberseguridad (Ley 21.663)',
    description:
      'La Ley N.º 21.663 establece un marco general de ciberseguridad para Chile, incluyendo obligaciones diferenciadas según el tipo de organización (p. ej., operadores de importancia vital). Su eventual aplicación a una organización concreta requiere análisis específico.',
    jurisdiction: 'Chile',
    subject: 'Ciberseguridad',
    norm: 'Ley N.º 21.663',
    status: 'REQUIERE_VALIDACION_JURIDICA',
    regime: 'VIGENTE',
    sourceCode: 'BCN_LEYCHILE',
    activationConditions: {
      any: [
        { op: 'nonEmpty', path: 'technologies' },
        { op: 'nonEmpty', path: 'incidents' },
      ],
    },
    result: {
      obligationSummary:
        'Evaluar si la organización podría calificar como sujeto obligado bajo el marco de ciberseguridad y qué medidas mínimas de seguridad correspondería adoptar.',
      references: ['Ley N.º 21.663'],
    },
    risk: 'Ausencia de medidas mínimas de ciberseguridad frente a un marco regulatorio en implementación',
    severity: 'medio',
    relatedQuestionCodes: ['Q-CIBER-001'],
    requiredEvidence: ['Descripción de la infraestructura tecnológica de la organización'],
    validationStatus: 'REQUIERE_VALIDACION_JURIDICA',
  },
  {
    code: 'L21459-001',
    name: 'Delitos informáticos (Ley 21.459)',
    description:
      'La Ley N.º 21.459 tipifica delitos informáticos en Chile (p. ej., acceso ilícito, ataques a la integridad de datos y sistemas). Es relevante como marco de referencia frente a incidentes de seguridad que involucren accesos no autorizados o exfiltración de datos.',
    jurisdiction: 'Chile',
    subject: 'Delitos informáticos',
    norm: 'Ley N.º 21.459',
    status: 'REQUIERE_VALIDACION_JURIDICA',
    regime: 'VIGENTE',
    sourceCode: 'BCN_LEYCHILE',
    activationConditions: { op: 'nonEmpty', path: 'incidents' },
    result: {
      obligationSummary:
        'Evaluar si un incidente de seguridad identificado podría configurar una conducta tipificada como delito informático, a efectos de una eventual denuncia.',
      references: ['Ley N.º 21.459'],
    },
    risk: 'Incidente de seguridad no evaluado desde la perspectiva penal',
    severity: 'alto',
    relatedQuestionCodes: ['Q-INC-002'],
    requiredEvidence: ['Registro técnico del incidente'],
    validationStatus: 'REQUIERE_VALIDACION_JURIDICA',
  },
  {
    code: 'CPR-001',
    name: 'Protección constitucional de datos personales',
    description:
      'La Constitución Política de la República reconoce la protección de los datos personales entre las garantías fundamentales. Sirve como marco interpretativo general para toda la normativa de protección de datos.',
    jurisdiction: 'Chile',
    subject: 'Marco constitucional',
    norm: 'Constitución Política de la República',
    status: 'REQUIERE_VALIDACION_JURIDICA',
    regime: 'VIGENTE',
    sourceCode: 'BCN_LEYCHILE',
    activationConditions: { op: 'always' },
    result: {
      obligationSummary:
        'Considerar el estándar constitucional de protección de datos personales como marco interpretativo de toda obligación legal específica.',
      references: ['Constitución Política de la República'],
    },
    risk: undefined,
    severity: 'bajo',
    relatedQuestionCodes: [],
    requiredEvidence: [],
    validationStatus: 'REQUIERE_VALIDACION_JURIDICA',
  },
];
