import type { LegalRuleSeed } from '../types';

// Ley N.º 19.628 sobre Protección de la Vida Privada / Protección de Datos de
// Carácter Personal — régimen VIGENTE al día de hoy en Chile, hasta que entre
// en vigencia general la Ley N.º 21.719.
//
// IMPORTANTE — LIMITACIÓN DE VERIFICACIÓN: en este entorno de ejecución no fue
// posible acceder a bcn.cl (bloqueado por el proxy de egreso de red) para
// contrastar artículo por artículo el texto vigente y sus modificaciones.
// Por eso, salvo la existencia y materia general de la ley (hecho de
// conocimiento público y ampliamente verificable), cada regla se marca
// REQUIERE_VALIDACION_JURIDICA y no cita números de artículo específicos
// salvo que el equipo legal los confirme contra el texto oficial actualizado.
// Ver docs/LEGAL_ENGINE.md.
export const LEY_19628_RULES: LegalRuleSeed[] = [
  {
    code: 'L19628-001',
    name: 'Ámbito general de aplicación de la Ley 19.628',
    description:
      'La Ley N.º 19.628 regula el tratamiento de datos de carácter personal en registros o bancos de datos por organismos públicos y privados. Se identifica como potencialmente aplicable a toda organización que trate datos personales de titulares en Chile.',
    jurisdiction: 'Chile',
    subject: 'Ámbito de aplicación general',
    norm: 'Ley N.º 19.628',
    status: 'REQUIERE_VALIDACION_JURIDICA',
    regime: 'VIGENTE',
    sourceCode: 'BCN_LEYCHILE',
    scope: 'Toda organización que trate datos personales',
    activationConditions: { op: 'always' },
    result: {
      obligationSummary:
        'Cumplir los principios y obligaciones generales de tratamiento de datos personales vigentes (licitud, finalidad, calidad de los datos, seguridad) mientras la Ley 19.628 esté en vigor.',
      references: ['Ley N.º 19.628'],
    },
    risk: 'Tratamiento de datos personales sin marco de cumplimiento identificado',
    severity: 'medio',
    relatedQuestionCodes: ['Q-GEN-001'],
    requiredEvidence: ['Descripción de las actividades de tratamiento de la organización'],
    validationStatus: 'REQUIERE_VALIDACION_JURIDICA',
  },
  {
    code: 'L19628-002',
    name: 'Tratamiento de datos sensibles',
    description:
      'La normativa vigente exige un régimen reforzado para el tratamiento de datos sensibles (p. ej. datos de salud, origen étnico, afiliación sindical, entre otros). Se activa cuando el diagnóstico identifica datos sensibles en la organización.',
    jurisdiction: 'Chile',
    subject: 'Datos sensibles',
    norm: 'Ley N.º 19.628',
    status: 'REQUIERE_VALIDACION_JURIDICA',
    regime: 'VIGENTE',
    sourceCode: 'BCN_LEYCHILE',
    activationConditions: { op: 'nonEmpty', path: 'sensitiveData' },
    result: {
      obligationSummary:
        'Revisar la base de licitud para el tratamiento de cada categoría de dato sensible identificada y las medidas de seguridad aplicables.',
      references: ['Ley N.º 19.628'],
    },
    risk: 'Tratamiento de datos sensibles sin habilitación o resguardo suficiente',
    severity: 'alto',
    relatedQuestionCodes: ['Q-SENS-001', 'Q-SENS-002'],
    requiredEvidence: ['Identificación de la categoría de dato sensible y su origen'],
    validationStatus: 'REQUIERE_VALIDACION_JURIDICA',
  },
  {
    code: 'L19628-003',
    name: 'Derechos del titular (habeas data)',
    description:
      'El régimen vigente reconoce derechos del titular de datos personales sobre la información que le concierne (acceso, rectificación, cancelación/eliminación y oposición, conocidos como derechos ARCO). Aplica siempre que existan titulares identificados.',
    jurisdiction: 'Chile',
    subject: 'Derechos de los titulares',
    norm: 'Ley N.º 19.628',
    status: 'REQUIERE_VALIDACION_JURIDICA',
    regime: 'VIGENTE',
    sourceCode: 'BCN_LEYCHILE',
    activationConditions: { op: 'nonEmpty', path: 'dataSubjects' },
    result: {
      obligationSummary:
        'Contar con un procedimiento para recibir y responder solicitudes de acceso, rectificación, cancelación y oposición de los titulares.',
      references: ['Ley N.º 19.628'],
    },
    risk: 'Ausencia de canal o procedimiento para ejercicio de derechos',
    severity: 'medio',
    relatedQuestionCodes: ['Q-ARCO-001'],
    requiredEvidence: ['Existencia de canal de contacto o procedimiento documentado'],
    validationStatus: 'REQUIERE_VALIDACION_JURIDICA',
  },
  {
    code: 'L19628-004',
    name: 'Transferencia de datos a terceros y proveedores',
    description:
      'Cuando la organización comunica o encarga el tratamiento de datos personales a terceros (proveedores, encargados), corresponde revisar el marco contractual y las garantías aplicables bajo el régimen vigente.',
    jurisdiction: 'Chile',
    subject: 'Comunicación de datos a terceros',
    norm: 'Ley N.º 19.628',
    status: 'REQUIERE_VALIDACION_JURIDICA',
    regime: 'VIGENTE',
    sourceCode: 'BCN_LEYCHILE',
    activationConditions: { any: [{ op: 'nonEmpty', path: 'providers' }, { op: 'nonEmpty', path: 'thirdParties' }] },
    result: {
      obligationSummary:
        'Revisar la existencia de cláusulas contractuales de protección de datos con proveedores y terceros que traten datos por encargo.',
      references: ['Ley N.º 19.628'],
    },
    risk: 'Encargo de tratamiento sin marco contractual de protección de datos',
    severity: 'medio',
    relatedQuestionCodes: ['Q-PROV-001'],
    requiredEvidence: ['Listado de proveedores/terceros y contratos vigentes'],
    validationStatus: 'REQUIERE_VALIDACION_JURIDICA',
  },
  {
    code: 'L19628-005',
    name: 'Transferencia internacional de datos bajo régimen vigente',
    description:
      'El régimen vigente no cuenta con un capítulo específico y detallado sobre transferencias internacionales equivalente al de estándares como el RGPD. Cuando se detectan transferencias internacionales (p. ej. proveedores cloud fuera de Chile), la materia requiere validación jurídica específica caso a caso.',
    jurisdiction: 'Chile',
    subject: 'Transferencias internacionales',
    norm: 'Ley N.º 19.628',
    status: 'REQUIERE_VALIDACION_JURIDICA',
    regime: 'VIGENTE',
    sourceCode: 'BCN_LEYCHILE',
    activationConditions: { op: 'nonEmpty', path: 'internationalTransfers' },
    result: {
      obligationSummary:
        'Documentar cada transferencia internacional detectada (destino, proveedor, finalidad) para su revisión jurídica específica.',
      references: ['Ley N.º 19.628'],
    },
    risk: 'Transferencia internacional sin marco de cumplimiento evaluado',
    severity: 'alto',
    relatedQuestionCodes: ['Q-TRANSF-001'],
    requiredEvidence: ['Identificación del proveedor y país de destino de los datos'],
    validationStatus: 'REQUIERE_VALIDACION_JURIDICA',
  },
];
