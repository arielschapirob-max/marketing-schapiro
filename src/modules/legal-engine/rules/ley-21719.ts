import type { LegalRuleSeed } from '../types';

// Ley N.º 21.719 — modifica sustancialmente la Ley N.º 19.628 y crea un nuevo
// marco de protección de datos personales en Chile. Publicada en el Diario
// Oficial el 13 de diciembre de 2024, con vigencia general diferida (fecha
// configurable en LEY_21719_VIGENCIA_GENERAL, por defecto 1 de diciembre de
// 2026 según fuentes secundarias coincidentes — ver docs/LEGAL_ENGINE.md).
//
// Régimen: FUTURO. El motor NUNCA mezcla automáticamente estas reglas con las
// de la Ley 19.628 (VIGENTE); el usuario elige explícitamente el régimen a
// evaluar (vigente / futuro / transición) en cada diagnóstico.
//
// IMPORTANTE: no se pudo verificar el texto oficial artículo por artículo
// (bcn.cl bloqueado en este entorno). Todas las reglas quedan marcadas
// REQUIERE_VALIDACION_JURIDICA y describen obligaciones a nivel general,
// sin inventar numeración de artículos.
export const LEY_21719_RULES: LegalRuleSeed[] = [
  {
    code: 'L21719-001',
    name: 'Nueva autoridad de control: Agencia de Protección de Datos Personales',
    description:
      'La Ley N.º 21.719 crea una nueva autoridad administrativa de protección de datos personales (Agencia de Protección de Datos Personales, APDP) con facultades de fiscalización y sanción. Aplica a toda organización una vez vigente el nuevo marco.',
    jurisdiction: 'Chile',
    subject: 'Institucionalidad y fiscalización',
    norm: 'Ley N.º 21.719',
    status: 'REQUIERE_VALIDACION_JURIDICA',
    regime: 'FUTURO',
    sourceCode: 'BCN_LEYCHILE',
    activationConditions: { op: 'always' },
    result: {
      obligationSummary:
        'Prepararse para la fiscalización de una nueva autoridad especializada (APDP), incluyendo eventuales registros y reportes que ésta determine.',
      references: ['Ley N.º 21.719'],
    },
    risk: 'Falta de preparación institucional ante nueva autoridad fiscalizadora',
    severity: 'medio',
    relatedQuestionCodes: ['Q-FUT-001'],
    requiredEvidence: [],
    validationStatus: 'REQUIERE_VALIDACION_JURIDICA',
  },
  {
    code: 'L21719-002',
    name: 'Bases de licitud del tratamiento',
    description:
      'El nuevo marco exige identificar una base de licitud específica (consentimiento u otra habilitación legal) para cada actividad de tratamiento de datos personales.',
    jurisdiction: 'Chile',
    subject: 'Licitud del tratamiento',
    norm: 'Ley N.º 21.719',
    status: 'REQUIERE_VALIDACION_JURIDICA',
    regime: 'FUTURO',
    sourceCode: 'BCN_LEYCHILE',
    activationConditions: { op: 'nonEmpty', path: 'processingActivities' },
    result: {
      obligationSummary:
        'Documentar, para cada tratamiento identificado, cuál sería su base de licitud bajo el nuevo régimen.',
      references: ['Ley N.º 21.719'],
    },
    risk: 'Tratamientos sin base de licitud identificada de cara al nuevo régimen',
    severity: 'alto',
    relatedQuestionCodes: ['Q-FUT-002'],
    requiredEvidence: ['Listado de actividades de tratamiento con su finalidad'],
    validationStatus: 'REQUIERE_VALIDACION_JURIDICA',
  },
  {
    code: 'L21719-003',
    name: 'Derechos de los titulares ampliados (ARCOP)',
    description:
      'El nuevo marco ampliaría los derechos de acceso, rectificación y cancelación/supresión reconocidos por la Ley 19.628 con dos derechos adicionales: portabilidad (obtener una copia de los datos en formato estructurado para transmitirlos a otro responsable) y bloqueo temporal (suspender el tratamiento mientras se resuelve una solicitud de rectificación, supresión u oposición) — conjunto conocido en fuentes secundarias como "ARCOP". Esas mismas fuentes describen un plazo de respuesta de 30 días corridos, prorrogable por 30 días adicionales en casos justificados; ninguno de estos plazos ni el detalle procedimental fue confirmado contra el texto oficial.',
    jurisdiction: 'Chile',
    subject: 'Derechos de los titulares',
    norm: 'Ley N.º 21.719',
    status: 'REQUIERE_VALIDACION_JURIDICA',
    regime: 'FUTURO',
    sourceCode: 'BCN_LEYCHILE',
    activationConditions: { op: 'nonEmpty', path: 'dataSubjects' },
    result: {
      obligationSummary:
        'Preparar procedimientos de atención de los seis derechos (acceso, rectificación, cancelación, oposición, portabilidad y bloqueo), incluyendo el plazo de respuesta, una vez confirmado el detalle exacto contra el texto oficial vigente a la fecha de entrada en vigor.',
      references: ['Ley N.º 21.719'],
    },
    risk: 'Procedimiento de derechos ARCO insuficiente para el estándar ampliado',
    severity: 'medio',
    relatedQuestionCodes: ['Q-FUT-003'],
    requiredEvidence: [],
    validationStatus: 'REQUIERE_VALIDACION_JURIDICA',
  },
  {
    code: 'L21719-004',
    name: 'Evaluación de impacto para tratamientos de alto riesgo',
    description:
      'El nuevo marco introduce (según fuentes secundarias coincidentes, pendiente de confirmación en el texto oficial) la exigencia de evaluaciones de impacto relativas a la protección de datos personales para tratamientos de alto riesgo, como el uso de datos sensibles a gran escala, elaboración de perfiles o nuevas tecnologías.',
    jurisdiction: 'Chile',
    subject: 'Tratamientos de alto riesgo',
    norm: 'Ley N.º 21.719',
    status: 'REQUIERE_VALIDACION_JURIDICA',
    regime: 'FUTURO',
    sourceCode: 'BCN_LEYCHILE',
    activationConditions: {
      any: [
        { op: 'nonEmpty', path: 'sensitiveData' },
        { op: 'includesAny', path: 'technologies', values: ['inteligencia artificial', 'perfilamiento', 'scoring', 'videovigilancia'] },
      ],
    },
    result: {
      obligationSummary:
        'Evaluar si el tratamiento identificado califica como de alto riesgo y si correspondería una evaluación de impacto bajo el nuevo régimen.',
      references: ['Ley N.º 21.719'],
    },
    risk: 'Tratamiento de alto riesgo sin evaluación de impacto',
    severity: 'alto',
    relatedQuestionCodes: ['Q-FUT-004'],
    requiredEvidence: ['Descripción técnica del tratamiento de alto riesgo'],
    validationStatus: 'REQUIERE_VALIDACION_JURIDICA',
  },
  {
    code: 'L21719-005',
    name: 'Delegado de Protección de Datos (DPO)',
    description:
      'Las fuentes secundarias consultadas se contradicen sobre este punto: unas describen la designación de un Delegado de Protección de Datos como obligatoria para organismos públicos y empresas cuya actividad principal implique tratamiento de datos sensibles a gran escala; otras señalan que el artículo 50 la dejaría como una facultad ("podrá designar"), no una obligación. Ante esta contradicción entre fuentes no oficiales, el sistema no asume ninguna de las dos y exige confirmación directa del texto vigente antes de afirmar que existe (o no) una obligación de designar DPO.',
    jurisdiction: 'Chile',
    subject: 'Gobernanza de datos',
    norm: 'Ley N.º 21.719',
    status: 'REQUIERE_VALIDACION_JURIDICA',
    regime: 'FUTURO',
    sourceCode: 'BCN_LEYCHILE',
    activationConditions: {
      any: [
        { op: 'gte', path: 'organization.estimatedDataSubjects', value: 10000 },
        { op: 'nonEmpty', path: 'sensitiveData' },
      ],
    },
    result: {
      obligationSummary:
        'Evaluar si, por volumen de titulares o tratamiento de datos sensibles, correspondería designar un Delegado de Protección de Datos bajo el nuevo régimen.',
      references: ['Ley N.º 21.719'],
    },
    risk: 'Ausencia de gobernanza formal de protección de datos ante un volumen relevante de titulares',
    severity: 'medio',
    relatedQuestionCodes: ['Q-FUT-005'],
    requiredEvidence: ['Estimación del número de titulares y tipos de datos tratados'],
    validationStatus: 'REQUIERE_VALIDACION_JURIDICA',
  },
  {
    code: 'L21719-006',
    name: 'Transferencias internacionales bajo el nuevo régimen',
    description:
      'El nuevo marco regularía con mayor especificidad las transferencias internacionales de datos personales (p. ej., mediante mecanismos de adecuación o garantías contractuales), a diferencia del vacío relativo del régimen vigente.',
    jurisdiction: 'Chile',
    subject: 'Transferencias internacionales',
    norm: 'Ley N.º 21.719',
    status: 'REQUIERE_VALIDACION_JURIDICA',
    regime: 'FUTURO',
    sourceCode: 'BCN_LEYCHILE',
    activationConditions: { op: 'nonEmpty', path: 'internationalTransfers' },
    result: {
      obligationSummary:
        'Revisar cada transferencia internacional identificada contra los mecanismos de adecuación o garantías que exija el nuevo régimen una vez vigente.',
      references: ['Ley N.º 21.719'],
    },
    risk: 'Transferencia internacional sin mecanismo de adecuación bajo el nuevo régimen',
    severity: 'alto',
    relatedQuestionCodes: ['Q-FUT-006'],
    requiredEvidence: ['Identificación del proveedor, país de destino y mecanismo de transferencia utilizado'],
    validationStatus: 'REQUIERE_VALIDACION_JURIDICA',
  },
  {
    code: 'L21719-007',
    name: 'Régimen sancionatorio agravado',
    description:
      'El nuevo marco establece un régimen sancionatorio con multas significativamente más altas que el régimen actual (según fuentes secundarias coincidentes, hasta 20.000 UTM en casos graves; cifra pendiente de confirmación en el texto oficial).',
    jurisdiction: 'Chile',
    subject: 'Régimen sancionatorio',
    norm: 'Ley N.º 21.719',
    status: 'REQUIERE_VALIDACION_JURIDICA',
    regime: 'FUTURO',
    sourceCode: 'BCN_LEYCHILE',
    activationConditions: { op: 'always' },
    result: {
      obligationSummary:
        'Dimensionar el riesgo reputacional y económico de incumplimientos considerando el nuevo régimen sancionatorio agravado.',
      references: ['Ley N.º 21.719'],
    },
    risk: 'Exposición a sanciones significativamente mayores por incumplimiento',
    severity: 'alto',
    relatedQuestionCodes: [],
    requiredEvidence: [],
    validationStatus: 'REQUIERE_VALIDACION_JURIDICA',
  },
  {
    code: 'L21719-008',
    name: 'Notificación de brechas de seguridad',
    description:
      'El nuevo marco exigiría, en línea con estándares comparados, notificar a la autoridad y/o a los titulares afectados ante incidentes de seguridad que comprometan datos personales, cuando exista riesgo para sus derechos.',
    jurisdiction: 'Chile',
    subject: 'Incidentes de seguridad',
    norm: 'Ley N.º 21.719',
    status: 'REQUIERE_VALIDACION_JURIDICA',
    regime: 'FUTURO',
    sourceCode: 'BCN_LEYCHILE',
    activationConditions: { op: 'nonEmpty', path: 'incidents' },
    result: {
      obligationSummary:
        'Evaluar si los incidentes identificados habrían requerido notificación a la autoridad y/o a los titulares bajo el nuevo régimen.',
      references: ['Ley N.º 21.719'],
    },
    risk: 'Incidente de seguridad sin protocolo de notificación',
    severity: 'critico',
    relatedQuestionCodes: ['Q-INC-001'],
    requiredEvidence: ['Registro del incidente: fecha, alcance, datos afectados, medidas adoptadas'],
    validationStatus: 'REQUIERE_VALIDACION_JURIDICA',
  },
];
