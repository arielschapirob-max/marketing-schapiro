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
      'La Ley N.º 20.584, sobre derechos y deberes de las personas en su atención de salud, regula la ficha clínica y el tratamiento de información de salud de los pacientes. Potencialmente aplicable a prestadores de salud (públicos, privados e individuales). Fuentes secundarias especializadas (no el texto oficial) describen, entre otros puntos: (a) el carácter confidencial de la ficha clínica, de forma que compartirla con terceros no autorizados —incluidos familiares sin consentimiento del paciente— constituiría una infracción; (b) un derecho del paciente a acceder a su propia ficha, con un plazo de entrega de una copia descrito en 48 horas hábiles; y (c) un deber de conservación de la ficha clínica por un plazo mínimo descrito en 15 años. Estos tres puntos deben confirmarse contra el texto oficial antes de comunicarlos a un cliente como obligación cierta.',
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
        'Revisar el cumplimiento de las reglas específicas de confidencialidad, acceso (incluyendo el plazo de entrega de copias al paciente) y conservación mínima de la ficha clínica, confirmando cada plazo contra el texto oficial vigente.',
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
      'La Ley N.º 21.663 (Ley Marco de Ciberseguridad) crea la Agencia Nacional de Ciberseguridad (ANCI) como fiscalizador y establece obligaciones de gobernanza, gestión de riesgos, controles técnicos y reporte de incidentes. Según fuentes secundarias, aplicaría a organismos del Estado y a proveedores de "servicios esenciales", además de a quienes sean calificados como "Operador de Importancia Vital" (OIV) conforme al artículo 5° de la ley — típicamente organizaciones de los sectores energía, agua, telecomunicaciones, salud, transporte y banca/financiero. Las mismas fuentes indican que los artículos 5, 8, 9 y el Título VII entraron en vigor el 1 de marzo de 2025, mientras que otras obligaciones tendrían plazos de implementación distintos, todo pendiente de confirmación en el texto oficial. No aplica automáticamente a cualquier organización que use tecnología: se activa aquí únicamente cuando se detecta un sector potencialmente comprendido, o un incidente de seguridad que amerite revisarlo igualmente.',
    jurisdiction: 'Chile',
    subject: 'Ciberseguridad',
    norm: 'Ley N.º 21.663',
    status: 'REQUIERE_VALIDACION_JURIDICA',
    regime: 'VIGENTE',
    sourceCode: 'BCN_LEYCHILE',
    activationConditions: {
      any: [
        { op: 'includesAny', path: 'sectorKeys', values: ['salud', 'telecomunicaciones', 'servicios-publicos', 'financiero', 'transporte'] },
        { op: 'nonEmpty', path: 'incidents' },
      ],
    },
    result: {
      obligationSummary:
        'Evaluar si la organización podría calificar como Operador de Importancia Vital o proveedor de un servicio esencial bajo el marco de ciberseguridad, y qué medidas mínimas correspondería adoptar y para cuándo.',
      references: ['Ley N.º 21.663'],
    },
    risk: 'Ausencia de medidas mínimas de ciberseguridad frente a un marco regulatorio en implementación',
    severity: 'medio',
    relatedQuestionCodes: ['Q-CIBER-001'],
    requiredEvidence: ['Descripción de la infraestructura tecnológica de la organización', 'Confirmación de si la organización fue calificada como OIV o presta un servicio esencial'],
    validationStatus: 'REQUIERE_VALIDACION_JURIDICA',
    sectorKeys: ['salud', 'telecomunicaciones', 'servicios-publicos', 'financiero', 'transporte'],
  },
  {
    code: 'L21459-001',
    name: 'Delitos informáticos (Ley 21.459)',
    description:
      'La Ley N.º 21.459 (promulgada el 20 de junio de 2022, deroga la antigua Ley N.º 19.223) tipifica delitos informáticos en Chile para adecuar la legislación al Convenio de Budapest. Fuentes secundarias jurídicas especializadas (incluyendo un artículo académico revisado por pares) describen, entre otros, los siguientes tipos: ataque a la integridad de un sistema informático (art. 1), acceso ilícito (art. 2), interceptación ilícita (art. 3), ataque a la integridad de datos informáticos (art. 4), receptación informática (art. 6), fraude informático (art. 7) y abuso de dispositivos (art. 8). Es relevante como marco de referencia frente a incidentes de seguridad que involucren accesos no autorizados o exfiltración de datos — la numeración de artículos, aunque corroborada por varias fuentes independientes, no fue verificada contra el texto oficial de bcn.cl en este entorno.',
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
