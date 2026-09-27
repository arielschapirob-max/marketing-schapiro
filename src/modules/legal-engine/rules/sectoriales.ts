import type { LegalRuleSeed } from '../types';

// Normativa sectorial adicional mencionada explícitamente en el encargo.
//
// VERIFICACIÓN (cuarta pasada): el usuario habilitó el acceso a `bcn.cl` en el entorno y,
// aunque la interfaz Angular de `www.bcn.cl/leychile` no es renderizable por las
// herramientas de este entorno (requiere ejecutar JavaScript), se ubicó el endpoint del
// propio dominio `bcn.cl` que la aplicación usa internamente para obtener el texto oficial
// en XML (`https://www.bcn.cl/leychile/consulta/obtxml?opt=7&idNorma=<id>`), sin necesidad
// de ningún dominio adicional a los ya autorizados. Con eso se descargó y leyó íntegramente
// el texto vigente de la Ley N.º 20.584, la Ley N.º 21.663, la Ley N.º 21.459, la Ley N.º
// 21.096 y la Constitución Política de la República, y se contrastó artículo por artículo
// contra estas reglas. Las cuatro reglas de este archivo pasaron a
// `validationStatus: 'VALIDADA'`. Ver LEGAL_ENGINE.md, sección "Cuarta pasada", para el
// detalle completo, incluidas dos correcciones relevantes: (a) el plazo de "48 horas
// hábiles" para entregar copia de la ficha clínica que la segunda pasada había tomado de
// fuentes secundarias **no está en la Ley 20.584** (el texto legal dice "sin dilaciones
// indebidas"; ese plazo, si existe, estaría en el Reglamento/Decreto N.º 41, no verificado
// aquí); y (b) faltaba el artículo 5º de la Ley 21.459 (falsificación informática) en la
// enumeración de tipos penales.
export const SECTORIAL_RULES: LegalRuleSeed[] = [
  {
    code: 'L20584-001',
    name: 'Ficha clínica y datos de salud (Ley 20.584)',
    description:
      'La Ley N.º 20.584, sobre derechos y deberes de las personas en su atención de salud, regula la ficha clínica en su Párrafo 6º (arts. 12 y 13). La ficha clínica es el "instrumento obligatorio" que registra los antecedentes de salud de la persona (art. 12), y toda la información que de ella surja "será considerada como dato sensible, de conformidad con lo dispuesto en la letra g) del artículo 2º de la ley N° 19.628" (art. 12, inciso 3º) — es decir, la propia ley remite expresamente al régimen de datos sensibles de la Ley 19.628. Los prestadores deben conservarla "por un período de al menos quince años" (art. 13, confirmado con el texto literal). Los terceros no vinculados a la atención de salud de la persona no tienen acceso a ella, salvo una lista taxativa de excepciones (art. 13): el titular, su representante legal o herederos; un tercero autorizado por poder; tribunales de justicia (causas que estén conociendo); fiscales/abogados con autorización judicial; Instituto de Salud Pública y Ministerio de Salud; Superintendencia de Salud (fiscalización); el propio prestador y los profesionales que atienden al paciente; y la Superintendencia de Seguridad Social/COMPIN, para licencias médicas. El titular (o su representante/heredero autorizado) puede requerir "la entrega gratuita y sin dilaciones indebidas de una copia íntegra de la información" en formato portable (art. 13) — la ley **no fija un plazo en horas** para esa entrega; el plazo de "48 horas hábiles" que circula en fuentes secundarias de salud no aparece en el texto legal y, de existir, correspondería al reglamento de fichas clínicas (Decreto N.º 41), no verificado en este entorno.',
    jurisdiction: 'Chile',
    subject: 'Salud — ficha clínica',
    norm: 'Ley N.º 20.584',
    article: 'Artículos 12 y 13',
    excerpt:
      '"La ficha clínica es el instrumento obligatorio en el que se registra el conjunto de antecedentes relativos a las diferentes áreas relacionadas con la salud de las personas (...). Toda la información que surja (...) será considerada como dato sensible, de conformidad con lo dispuesto en la letra g) del artículo 2º de la ley N° 19.628" (art. 12). "Los prestadores deberán conservar la ficha clínica por un período de al menos quince años (...). Los terceros que no estén directamente relacionados con la atención de salud de la persona no tendrán acceso a la información contenida en la respectiva ficha clínica (...). Las personas individualizadas en las letras a) y b) precedentes podrán requerir (...) la entrega gratuita y sin dilaciones indebidas de una copia íntegra de la información contenida en la ficha clínica, en un formato estructurado, de uso común y lectura legible" (art. 13).',
    officialUrl: 'https://www.bcn.cl/leychile/navegar?idNorma=1039348',
    status: 'VALIDADA',
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
        'Restringir el acceso a la ficha clínica a las personas/organismos taxativamente habilitados por el artículo 13, conservarla por al menos 15 años, y entregar copia al titular (o representante/heredero) de forma gratuita y sin dilaciones indebidas — sin asumir un plazo fijo en horas que no está en la ley, salvo que se confirme contra el Reglamento (Decreto N.º 41).',
      references: ['Ley N.º 20.584, artículos 12 y 13'],
    },
    risk: 'Acceso de terceros no habilitados a la ficha clínica, o demora indebida en la entrega de copia al paciente',
    severity: 'alto',
    relatedQuestionCodes: ['Q-SALUD-001'],
    requiredEvidence: ['Política de manejo de ficha clínica', 'Procedimiento de entrega de copias a pacientes'],
    validationStatus: 'VALIDADA',
    sectorKeys: ['salud'],
  },
  {
    code: 'L21663-001',
    name: 'Marco de ciberseguridad (Ley 21.663)',
    description:
      'La Ley N.º 21.663 (Ley Marco de Ciberseguridad, publicada el 08-abr-2024) se aplica a las instituciones que presten "servicios esenciales" y a quienes sean calificados "operadores de importancia vital" (OIV) (art. 4º). Son servicios esenciales, entre otros, los prestados por organismos del Estado y los de generación/transmisión/distribución eléctrica, agua potable, telecomunicaciones, infraestructura digital, transporte, banca y servicios financieros, medios de pago, seguridad social, servicios postales, y la prestación institucional de salud (hospitales, clínicas, consultorios) (art. 4º, inciso 2º). La Agencia Nacional de Ciberseguridad (ANCI) califica como OIV a quienes, dentro de esos servicios esenciales (o excepcionalmente fuera de ellos), dependan de sistemas informáticos y cuya afectación tenga un impacto significativo (art. 5º). Los OIV deben, entre otros deberes específicos (art. 8º): implementar un sistema de gestión de seguridad de la información continuo, elaborar planes de continuidad operacional certificados, y "informar a los potenciales afectados (...) sobre la ocurrencia de incidentes o ciberataques que pudieran comprometer gravemente su información (...) especialmente cuando involucren datos personales" (art. 8º, letra g). Todas las instituciones del artículo 4º (no solo los OIV) deben reportar al CSIRT Nacional los incidentes con efectos significativos: alerta temprana dentro de 3 horas, actualización dentro de 72 horas (24 horas si el afectado es un OIV cuyo servicio esencial se vio interrumpido), e informe final dentro de 15 días corridos (art. 9º). La disposición transitoria "Artículo primero" faculta al Presidente de la República para fijar, mediante uno o más DFL dictados dentro del año siguiente a la publicación, el calendario detallado de entrada en operaciones de la Agencia y "un período para la vigencia de las normas (...) que no podrá ser inferior a seis meses desde su publicación" — es decir, el calendario preciso de exigibilidad por tipo de obligación depende de ese DFL, un instrumento distinto de la ley y no verificado en este entorno; no se afirma aquí una fecha específica de entrada en vigencia de artículos individuales sin haber contrastado ese DFL.',
    jurisdiction: 'Chile',
    subject: 'Ciberseguridad',
    norm: 'Ley N.º 21.663',
    article: 'Artículos 4º, 5º, 8º y 9º',
    excerpt:
      '"La presente ley se aplicará a las instituciones que presten servicios calificados como esenciales (...) y a aquellas que sean calificadas como operadores de importancia vital" (art. 4º). "Todos los operadores de importancia vital deberán (...) g) Informar a los potenciales afectados (...) sobre la ocurrencia de incidentes o ciberataques que pudieran comprometer gravemente su información o redes y sistemas informáticos, especialmente cuando involucren datos personales" (art. 8º). "Todas las instituciones públicas y privadas señaladas en el artículo 4° tendrán la obligación de reportar al CSIRT Nacional los ciberataques e incidentes de ciberseguridad que puedan tener efectos significativos (...): a) Dentro del plazo máximo de tres horas (...) una alerta temprana (...) b) Dentro del plazo máximo de setenta y dos horas, una actualización (...) c) Dentro del plazo máximo de quince días corridos (...) un informe final" (art. 9º).',
    officialUrl: 'https://www.bcn.cl/leychile/navegar?idNorma=1202434',
    status: 'VALIDADA',
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
        'Evaluar si la organización presta un servicio esencial del artículo 4º o podría calificar como Operador de Importancia Vital, y si un incidente detectado activó (o debió activar) el deber de reportarlo al CSIRT Nacional dentro de los plazos del artículo 9º (3/72/24 horas según el caso, informe final a los 15 días). El calendario exacto de exigibilidad por tipo de obligación debe confirmarse contra el DFL de implementación (disposición transitoria primera), no verificado en este entorno.',
      references: ['Ley N.º 21.663, artículos 4º, 5º, 8º y 9º'],
    },
    risk: 'Ausencia de medidas mínimas de ciberseguridad o de reporte oportuno de incidentes frente a un marco regulatorio con plazos horarios estrictos',
    severity: 'medio',
    relatedQuestionCodes: ['Q-CIBER-001'],
    requiredEvidence: ['Descripción de la infraestructura tecnológica de la organización', 'Confirmación de si la organización fue calificada como OIV o presta un servicio esencial', 'Registro de reportes al CSIRT Nacional, si corresponde'],
    validationStatus: 'VALIDADA',
    sectorKeys: ['salud', 'telecomunicaciones', 'servicios-publicos', 'financiero', 'transporte'],
  },
  {
    code: 'L21459-001',
    name: 'Delitos informáticos (Ley 21.459)',
    description:
      'La Ley N.º 21.459 (promulgada el 09-jun-2022, publicada el 20-jun-2022, deroga la antigua Ley N.º 19.223) tipifica ocho delitos informáticos para adecuar la legislación chilena al Convenio de Budapest: ataque a la integridad de un sistema informático (art. 1º), acceso ilícito (art. 2º), interceptación ilícita (art. 3º), ataque a la integridad de los datos informáticos (art. 4º), falsificación informática (art. 5º), receptación de datos informáticos (art. 6º), fraude informático (art. 7º) y abuso de los dispositivos (art. 8º, referido a quien facilite la comisión de los delitos de los artículos 1º a 4º o del art. 7º de la Ley 20.009). Es relevante como marco de referencia frente a incidentes de seguridad que involucren accesos no autorizados, alteración o exfiltración de datos personales, a efectos de evaluar una eventual denuncia.',
    jurisdiction: 'Chile',
    subject: 'Delitos informáticos',
    norm: 'Ley N.º 21.459',
    article: 'Artículos 1º a 8º',
    excerpt:
      '"Artículo 1°.- Ataque a la integridad de un sistema informático. El que obstaculice o impida el normal funcionamiento, total o parcial, de un sistema informático (...)". "Artículo 2°.- Acceso ilícito. El que, sin autorización o excediendo la autorización que posea (...) acceda a un sistema informático (...)". "Artículo 4°.- Ataque a la integridad de los datos informáticos. El que indebidamente altere, dañe o suprima datos informáticos (...) siempre que con ello se cause un daño grave al titular de estos mismos". "Artículo 5°.- Falsificación informática. El que indebidamente introduzca, altere, dañe o suprima datos informáticos con la intención de que sean tomados como auténticos (...)". "Artículo 6°.- Receptación de datos informáticos. El que conociendo su origen (...) comercialice, transfiera o almacene (...) datos informáticos, provenientes de la realización de las conductas descritas [en los artículos anteriores] (...)".',
    officialUrl: 'https://www.bcn.cl/leychile/navegar?idNorma=1177743',
    status: 'VALIDADA',
    regime: 'VIGENTE',
    sourceCode: 'BCN_LEYCHILE',
    activationConditions: { op: 'nonEmpty', path: 'incidents' },
    result: {
      obligationSummary:
        'Evaluar si un incidente de seguridad identificado podría configurar alguno de los ocho tipos penales de los artículos 1º a 8º (en especial acceso ilícito, ataque a la integridad de datos, o fraude informático), a efectos de una eventual denuncia.',
      references: ['Ley N.º 21.459, artículos 1º a 8º'],
    },
    risk: 'Incidente de seguridad no evaluado desde la perspectiva penal, pese a configurar potencialmente un delito informático',
    severity: 'alto',
    relatedQuestionCodes: ['Q-INC-002'],
    requiredEvidence: ['Registro técnico del incidente'],
    validationStatus: 'VALIDADA',
  },
  {
    code: 'CPR-001',
    name: 'Protección constitucional de datos personales',
    description:
      'El artículo 19, numeral 4º, de la Constitución Política de la República asegura a todas las personas "el respeto y protección a la vida privada y a la honra de la persona y su familia, y asimismo, la protección de sus datos personales. El tratamiento y protección de estos datos se efectuará en la forma y condiciones que determine la ley". La frase relativa a datos personales fue incorporada por la **Ley N.º 21.096** (2018), cuyo artículo único dispone literalmente: "Agrégase, en el numeral 4° del artículo 19 de la Constitución Política de la República, a continuación de la expresión \'y su familia\', lo siguiente: \', y asimismo, la protección de sus datos personales. El tratamiento y protección de estos datos se efectuará en la forma y condiciones que determine la ley\'.". Esta norma es el fundamento constitucional habilitante tanto de la Ley N.º 19.628 (régimen vigente) como de la Ley N.º 21.719 (régimen futuro), que son precisamente "la ley" a la que la Constitución remite para fijar la forma y condiciones del tratamiento. Sirve como marco interpretativo general y como respaldo, frente a un cliente, de que la protección de datos personales no es una mera política interna sino un derecho fundamental autónomo.',
    jurisdiction: 'Chile',
    subject: 'Marco constitucional',
    norm: 'Constitución Política de la República',
    article: 'Artículo 19, numeral 4º',
    excerpt:
      '"4º.- El respeto y protección a la vida privada y a la honra de la persona y su familia, y asimismo, la protección de sus datos personales. El tratamiento y protección de estos datos se efectuará en la forma y condiciones que determine la ley;" (texto consolidado vigente del artículo 19 N.º 4, incorporado por la Ley N.º 21.096 de 2018).',
    officialUrl: 'https://www.bcn.cl/leychile/navegar?idNorma=242302',
    status: 'VALIDADA',
    regime: 'VIGENTE',
    sourceCode: 'BCN_LEYCHILE',
    activationConditions: { op: 'always' },
    result: {
      obligationSummary:
        'Considerar el estándar constitucional de protección de datos personales (art. 19 N.º 4 CPR) como marco interpretativo de toda obligación legal específica derivada de la Ley 19.628 o la Ley 21.719.',
      references: ['Constitución Política de la República, artículo 19, numeral 4º', 'Ley N.º 21.096'],
    },
    risk: 'Falta de referencia al fundamento constitucional del derecho a la protección de datos personales en el análisis jurídico del diagnóstico',
    severity: 'bajo',
    relatedQuestionCodes: [],
    requiredEvidence: [],
    validationStatus: 'VALIDADA',
  },
];
