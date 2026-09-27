import type { LegalRuleSeed } from '../types';

// Ley N.º 19.628 sobre Protección de la Vida Privada / Protección de Datos de
// Carácter Personal — régimen VIGENTE en Chile hasta el 1 de diciembre de
// 2026, fecha en la que entra en vigencia general la Ley N.º 21.719.
//
// VERIFICACIÓN: el usuario (abogado, dueño del proyecto) proporcionó el PDF
// oficial de la Biblioteca del Congreso Nacional (texto refundido a la fecha
// de generación 20-mar-2026, URL corta https://bcn.cl/3a0ih), que fue leído
// y contrastado artículo por artículo contra el contenido de este archivo.
// Las reglas cuyo texto fue verificado directamente contra ese PDF quedan
// marcadas `validationStatus: 'VALIDADA'`, citando el artículo exacto. bcn.cl
// no pudo consultarse en vivo desde este entorno (proxy de red bloqueado),
// pero el documento oficial aportado hace innecesaria esa consulta para las
// normas aquí cubiertas. Ver LEGAL_ENGINE.md.
export const LEY_19628_RULES: LegalRuleSeed[] = [
  {
    code: 'L19628-001',
    name: 'Ámbito general de aplicación de la Ley 19.628',
    description:
      'La Ley N.º 19.628 (promulgada el 18-ago-1999, publicada el 28-ago-1999) sujeta a sus disposiciones el tratamiento de datos de carácter personal en registros o bancos de datos por organismos públicos o por particulares. Toda persona puede tratar datos personales si lo hace de forma concordante con la ley y para fines permitidos por el ordenamiento jurídico, respetando los derechos fundamentales de los titulares. Se excluye el tratamiento efectuado en ejercicio de las libertades de opinión e información (art. 19 N.º 12 CPR), que se rige por su ley especial. Según los metadatos oficiales de BCN, esta versión de la ley tiene "Fin Vigencia: 30-NOV-2026" — es decir, deja de regir el día anterior a la entrada en vigencia general de la Ley N.º 21.719 (1-dic-2026), lo que confirma de forma independiente la fecha de transición configurada en este sistema.',
    jurisdiction: 'Chile',
    subject: 'Ámbito de aplicación general',
    norm: 'Ley N.º 19.628',
    article: 'Artículo 1º',
    excerpt:
      '"El tratamiento de los datos de carácter personal en registros o bancos de datos por organismos públicos o por particulares se sujetará a las disposiciones de esta ley (...). Toda persona puede efectuar el tratamiento de datos personales, siempre que lo haga de manera concordante con esta ley y para finalidades permitidas por el ordenamiento jurídico."',
    officialUrl: 'https://bcn.cl/3a0ih',
    status: 'VALIDADA',
    regime: 'VIGENTE',
    sourceCode: 'BCN_LEYCHILE',
    scope: 'Toda organización que trate datos personales en Chile, salvo el tratamiento periodístico/de opinión regulado por ley especial',
    activationConditions: { op: 'always' },
    result: {
      obligationSummary:
        'Cumplir los principios y obligaciones generales de tratamiento de datos personales vigentes (licitud, finalidad, calidad de los datos, seguridad) mientras la Ley 19.628 esté en vigor (hasta el 30 de noviembre de 2026).',
      references: ['Ley N.º 19.628, artículo 1º'],
    },
    risk: 'Tratamiento de datos personales sin marco de cumplimiento identificado',
    severity: 'medio',
    relatedQuestionCodes: ['Q-GEN-001'],
    requiredEvidence: ['Descripción de las actividades de tratamiento de la organización'],
    validationStatus: 'VALIDADA',
  },
  {
    code: 'L19628-002',
    name: 'Tratamiento de datos sensibles',
    description:
      'La ley define "datos sensibles" como aquellos datos personales referidos a las características físicas o morales de las personas o a hechos o circunstancias de su vida privada o intimidad, tales como los hábitos personales, el origen racial, las ideologías y opiniones políticas, las creencias o convicciones religiosas, los estados de salud físicos o psíquicos y la vida sexual (art. 2, letra g). El tratamiento de datos sensibles está prohibido salvo que la ley lo autorice, exista consentimiento del titular, o se trate de datos necesarios para la determinación u otorgamiento de beneficios de salud que correspondan a sus titulares (art. 10).',
    jurisdiction: 'Chile',
    subject: 'Datos sensibles',
    norm: 'Ley N.º 19.628',
    article: 'Artículos 2º letra g) y 10',
    excerpt:
      '"Datos sensibles, aquellos datos personales que se refieren a las características físicas o morales de las personas o a hechos o circunstancias de su vida privada o intimidad, tales como los hábitos personales, el origen racial, las ideologías y opiniones políticas, las creencias o convicciones religiosas, los estados de salud físicos o psíquicos y la vida sexual" (art. 2, g). "No pueden ser objeto de tratamiento los datos sensibles, salvo cuando la ley lo autorice, exista consentimiento del titular o sean datos necesarios para la determinación u otorgamiento de beneficios de salud que correspondan a sus titulares" (art. 10).',
    officialUrl: 'https://bcn.cl/3a0ih',
    status: 'VALIDADA',
    regime: 'VIGENTE',
    sourceCode: 'BCN_LEYCHILE',
    activationConditions: { op: 'nonEmpty', path: 'sensitiveData' },
    result: {
      obligationSummary:
        'Verificar, para cada dato sensible identificado, que exista una de las tres habilitaciones legales del artículo 10 (autorización legal, consentimiento del titular, o necesidad para beneficios de salud); en su ausencia, el tratamiento no sería lícito bajo el régimen vigente.',
      references: ['Ley N.º 19.628, artículos 2º letra g) y 10'],
    },
    risk: 'Tratamiento de datos sensibles sin ninguna de las tres habilitaciones legales del artículo 10',
    severity: 'alto',
    relatedQuestionCodes: ['Q-SENS-001', 'Q-SENS-002'],
    requiredEvidence: ['Identificación de la categoría de dato sensible y su origen', 'Base legal, consentimiento u otorgamiento de beneficio de salud que habilite el tratamiento'],
    validationStatus: 'VALIDADA',
  },
  {
    code: 'L19628-003',
    name: 'Derechos del titular (información, modificación, eliminación y bloqueo)',
    description:
      'El Título II de la ley reconoce al titular el derecho a exigir al responsable del banco de datos información sobre sus datos, su procedencia, destinatarios y el propósito del almacenamiento (art. 12); a que se modifiquen si son erróneos, inexactos, equívocos o incompletos; a que se eliminen si su almacenamiento carece de fundamento legal o han caducado; y a que se bloqueen o eliminen cuando el titular proporcionó voluntariamente sus datos o estos se usan para comunicaciones comerciales y no desea seguir figurando en el registro (art. 12 inciso 4.º — es decir, el "bloqueo" ya existe hoy, aunque acotado a estos casos, y no es una figura introducida recién por la Ley 21.719). Estos derechos son gratuitos y no pueden limitarse por acto o convención (art. 13). Si el responsable no responde en 2 días hábiles o deniega la solicitud por una causa distinta de la seguridad de la Nación, el titular puede recurrir ante el juez de letras en lo civil de su domicilio (art. 16), con multas de 1 a 10 UTM (o 2 a 50 UTM por incumplimiento del fallo).',
    jurisdiction: 'Chile',
    subject: 'Derechos de los titulares',
    norm: 'Ley N.º 19.628',
    article: 'Artículos 12, 13 y 16',
    excerpt:
      '"Toda persona tiene derecho a exigir a quien sea responsable de un banco (...) información sobre los datos relativos a su persona (...). En caso de que los datos personales sean erróneos, inexactos, equívocos o incompletos, y así se acredite, tendrá derecho a que se modifiquen (...). El derecho de las personas a la información, modificación, cancelación o bloqueo de sus datos personales no puede ser limitado por medio de ningún acto o convención" (arts. 12 y 13). "Si el responsable (...) no se pronunciare (...) dentro de dos días hábiles, o la denegare (...) el titular (...) tendrá derecho a recurrir al juez de letras en lo civil" (art. 16).',
    officialUrl: 'https://bcn.cl/3a0ih',
    status: 'VALIDADA',
    regime: 'VIGENTE',
    sourceCode: 'BCN_LEYCHILE',
    activationConditions: { op: 'nonEmpty', path: 'dataSubjects' },
    result: {
      obligationSummary:
        'Contar con un procedimiento para recibir y responder, dentro de 2 días hábiles, solicitudes de información, modificación, eliminación o bloqueo de datos, y saber que la vía de reclamo del titular ante la falta de respuesta es un juez civil (no una agencia administrativa, a diferencia del régimen futuro).',
      references: ['Ley N.º 19.628, artículos 12, 13 y 16'],
    },
    risk: 'Ausencia de canal o procedimiento para ejercicio de derechos dentro del plazo legal de 2 días hábiles',
    severity: 'medio',
    relatedQuestionCodes: ['Q-ARCO-001'],
    requiredEvidence: ['Existencia de canal de contacto o procedimiento documentado'],
    validationStatus: 'VALIDADA',
  },
  {
    code: 'L19628-004',
    name: 'Tratamiento de datos por mandato (encargo a terceros y proveedores)',
    description:
      'La ley vigente no contempla un régimen contractual detallado de "encargado de tratamiento" equivalente al de la Ley 21.719 o al RGPD; regula la figura de forma general bajo las "reglas generales" del mandato civil (art. 8): el mandato debe otorgarse por escrito dejando constancia de las condiciones de utilización de los datos, y el mandatario debe respetar esas estipulaciones. Separadamente, el artículo 5º regula el procedimiento de transmisión automatizada de datos entre organismos, exigiendo dejar constancia de la individualización del requirente, el motivo/propósito y el tipo de datos transmitidos; esta regla no aplica a datos accesibles al público en general ni a transmisiones a organizaciones internacionales en cumplimiento de tratados vigentes.',
    jurisdiction: 'Chile',
    subject: 'Comunicación de datos a terceros',
    norm: 'Ley N.º 19.628',
    article: 'Artículos 5º y 8º',
    excerpt:
      '"En el caso de que el tratamiento de datos personales se efectúe por mandato, se aplicarán las reglas generales. El mandato deberá ser otorgado por escrito, dejando especial constancia de las condiciones de la utilización de los datos. El mandatario deberá respetar esas estipulaciones en el cumplimiento de su encargo" (art. 8).',
    officialUrl: 'https://bcn.cl/3a0ih',
    status: 'VALIDADA',
    regime: 'VIGENTE',
    sourceCode: 'BCN_LEYCHILE',
    activationConditions: { any: [{ op: 'nonEmpty', path: 'providers' }, { op: 'nonEmpty', path: 'thirdParties' }] },
    result: {
      obligationSummary:
        'Verificar que exista un mandato por escrito con cada proveedor/tercero que trate datos por encargo, dejando constancia de las condiciones de utilización de los datos (art. 8) — un contrato de encargo de tratamiento al estilo de la Ley 21.719 excede lo mínimo exigido hoy, pero es una buena práctica preparatoria de cara al nuevo régimen.',
      references: ['Ley N.º 19.628, artículos 5º y 8º'],
    },
    risk: 'Encargo de tratamiento a un tercero sin mandato escrito que fije las condiciones de uso de los datos',
    severity: 'medio',
    relatedQuestionCodes: ['Q-PROV-001'],
    requiredEvidence: ['Listado de proveedores/terceros y contratos o mandatos vigentes'],
    validationStatus: 'VALIDADA',
  },
  {
    code: 'L19628-005',
    name: 'Transferencia internacional de datos bajo régimen vigente',
    description:
      'El régimen vigente no contiene un capítulo dedicado a transferencias internacionales de datos personales. La única referencia expresa es la excepción del artículo 5º, que exime del procedimiento de transmisión automatizada (individualización del requirente, motivo y tipo de datos) a las transmisiones de datos personales a organizaciones internacionales realizadas en cumplimiento de tratados y convenios vigentes — sin establecer, más allá de eso, un mecanismo de adecuación, cláusulas contractuales u otra garantía específica para transferencias internacionales en general. Esto confirma el vacío regulatorio señalado: cuando se detectan transferencias internacionales (p. ej. proveedores cloud fuera de Chile) fuera de ese supuesto acotado, no existe en la Ley 19.628 un estándar detallado que aplicarles, y la materia debe evaluarse conforme a los principios generales de la ley (licitud, finalidad, seguridad) y, de cara al futuro, prepararse para el régimen mucho más detallado de la Ley 21.719 (arts. 27-29).',
    jurisdiction: 'Chile',
    subject: 'Transferencias internacionales',
    norm: 'Ley N.º 19.628',
    article: 'Artículo 5º, inciso final',
    excerpt:
      '"Esta disposición tampoco es aplicable cuando se transmiten datos personales a organizaciones internacionales en cumplimiento de lo dispuesto en los tratados y convenios vigentes." (art. 5º, inciso final; a contrario sensu, no existe otra regla específica sobre transferencias internacionales en la ley vigente).',
    officialUrl: 'https://bcn.cl/3a0ih',
    status: 'VALIDADA',
    regime: 'VIGENTE',
    sourceCode: 'BCN_LEYCHILE',
    activationConditions: { op: 'nonEmpty', path: 'internationalTransfers' },
    result: {
      obligationSummary:
        'Documentar cada transferencia internacional detectada (destino, proveedor, finalidad); al no existir un mecanismo legal específico de adecuación bajo la Ley 19.628, aplicar los principios generales (licitud, finalidad, seguridad) y preparar la transferencia para cumplir el régimen más exigente de la Ley 21.719 una vez vigente.',
      references: ['Ley N.º 19.628, artículo 5º'],
    },
    risk: 'Transferencia internacional sin marco de cumplimiento evaluado',
    severity: 'alto',
    relatedQuestionCodes: ['Q-TRANSF-001'],
    requiredEvidence: ['Identificación del proveedor y país de destino de los datos'],
    validationStatus: 'VALIDADA',
  },
  {
    code: 'L19628-006',
    name: 'Prohibición de evaluaciones de riesgo comercial no objetivas',
    description:
      'El artículo 9º, inciso 3º, prohíbe realizar predicciones o evaluaciones de riesgo comercial que no estén basadas únicamente en información objetiva relativa a morosidades o protestos de la persona evaluada. La infracción obliga a la eliminación inmediata de la información por el responsable de la base de datos y da lugar a indemnización de perjuicios. Es relevante para cualquier organización que realice scoring, evaluación crediticia o perfiles de riesgo comercial de clientes o contrapartes (típicamente sector financiero, pero también comercio con venta a crédito).',
    jurisdiction: 'Chile',
    subject: 'Evaluación de riesgo comercial',
    norm: 'Ley N.º 19.628',
    article: 'Artículo 9º, inciso 3º',
    excerpt:
      '"Prohíbese la realización de todo tipo de predicciones o evaluaciones de riesgo comercial que no estén basadas únicamente en información objetiva relativa a las morosidades o protestos de las personas naturales o jurídicas de las cuales se informa. La infracción a esta prohibición obligará a la eliminación inmediata de dicha información por parte del responsable de la base de datos y dará lugar a la indemnización de perjuicios que corresponda." (art. 9º, inciso 3º, modificado por Ley 20.521).',
    officialUrl: 'https://bcn.cl/3a0ih',
    status: 'VALIDADA',
    regime: 'VIGENTE',
    sourceCode: 'BCN_LEYCHILE',
    activationConditions: { op: 'includes', path: 'sectorKeys', value: 'financiero' },
    result: {
      obligationSummary:
        'Verificar que toda evaluación de riesgo comercial o crediticio se base únicamente en información objetiva de morosidades/protestos, y no incorpore otros factores no objetivos ni automatizados sin control humano.',
      references: ['Ley N.º 19.628, artículo 9º'],
    },
    risk: 'Evaluación de riesgo comercial basada en factores no objetivos, con obligación de eliminación inmediata e indemnización de perjuicios',
    severity: 'alto',
    relatedQuestionCodes: ['Q-FIN-001'],
    requiredEvidence: ['Metodología de evaluación de riesgo comercial/crediticio utilizada'],
    validationStatus: 'VALIDADA',
    sectorKeys: ['financiero'],
  },
];
