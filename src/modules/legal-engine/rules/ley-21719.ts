import type { LegalRuleSeed } from '../types';

// Ley N.º 21.719 — modifica sustancialmente la Ley N.º 19.628 y crea la
// Agencia de Protección de Datos Personales (APDP). Publicada en el Diario
// Oficial el 13 de diciembre de 2024 (promulgada el 25-nov-2024).
//
// VIGENCIA: la disposición transitoria "Artículo primero" de la propia ley
// dispone que las modificaciones "entrarán en vigencia el día primero del
// mes vigésimo cuarto posterior a la publicación de esta ley en el Diario
// Oficial" — es decir, el 1 de diciembre de 2026 (24 meses desde el
// 13-dic-2024). Los metadatos oficiales de BCN del PDF revisado (documento
// generado el 20-mar-2026, última modificación 05-feb-2026 por Ley 21.806)
// confirman "Versión: Con Vigencia Diferida por Fecha De: 01-DIC-2026" — es
// decir, a esa fecha de revisión la vigencia general seguía siendo la
// originalmente fijada, sin que la Ley 21.806 la haya modificado (esa ley
// solo ajustó detalles del procedimiento de nombramiento de los primeros
// consejeros de la Agencia). Dicho esto, existía a la fecha de este análisis
// un proyecto de ley en tramitación (boletín 18.623-07) que proponía
// postergarla a 2027; como el documento oficial es de marzo de 2026 y el
// presente análisis es posterior, se recomienda reconfirmar la fecha vigente
// contra bcn.cl antes de cada uso en producción — ver vigencia.ts.
//
// VERIFICACIÓN: el usuario proporcionó el PDF oficial de BCN (56 páginas,
// texto refundido, URL corta https://bcn.cl/gJo3hf), leído íntegramente y
// contrastado artículo por artículo contra estas reglas. Las reglas cuyo
// contenido fue verificado directamente contra ese PDF quedan marcadas
// `validationStatus: 'VALIDADA'`, citando el artículo exacto (numerado según
// las modificaciones que la Ley 21.719 introduce en la Ley 19.628: p. ej.
// "artículo 4º" ya se refiere al texto nuevo, no al de la 19.628 original).
export const LEY_21719_RULES: LegalRuleSeed[] = [
  {
    code: 'L21719-001',
    name: 'Nueva autoridad de control: Agencia de Protección de Datos Personales',
    description:
      'La Ley N.º 21.719 crea la Agencia de Protección de Datos Personales (APDP), corporación autónoma de derecho público, de carácter técnico y descentralizado, con personalidad jurídica y patrimonio propio, relacionada con el Presidente de la República a través del Ministerio de Economía, Fomento y Turismo (art. 30). Su objeto es velar por la efectiva protección de los derechos que garantizan la vida privada y los datos personales, y fiscalizar el cumplimiento de la ley. Entre sus funciones (art. 30 bis): dictar instrucciones y normas generales, interpretar administrativamente la ley, fiscalizar, determinar infracciones, ejercer la potestad sancionadora, resolver reclamos de titulares, y autorizar transferencias internacionales, entre otras. Se dirige por un Consejo Directivo de tres consejeros designados por el Presidente con acuerdo de dos tercios del Senado, que duran 6 años.',
    jurisdiction: 'Chile',
    subject: 'Institucionalidad y fiscalización',
    norm: 'Ley N.º 21.719',
    article: 'Artículos 30 y 30 bis',
    excerpt:
      '"Créase la Agencia de Protección de Datos Personales, corporación autónoma de derecho público, de carácter técnico, descentralizado, con personalidad jurídica y patrimonio propio (...). La Agencia tendrá por objeto velar por la efectiva protección de los derechos que garantizan la vida privada de las personas y sus datos personales (...) y fiscalizar el cumplimiento de sus disposiciones." (art. 30).',
    officialUrl: 'https://bcn.cl/gJo3hf',
    status: 'VALIDADA',
    regime: 'FUTURO',
    sourceCode: 'BCN_LEYCHILE',
    activationConditions: { op: 'always' },
    result: {
      obligationSummary:
        'Prepararse para la fiscalización de la Agencia de Protección de Datos Personales (APDP) una vez vigente el nuevo marco: registro de contacto operativo, atención de requerimientos de información, y eventual tramitación de reclamos de titulares y procedimientos sancionatorios ante ella.',
      references: ['Ley N.º 21.719, artículos 30 y 30 bis'],
    },
    risk: 'Falta de preparación institucional ante la nueva autoridad fiscalizadora',
    severity: 'medio',
    relatedQuestionCodes: ['Q-FUT-001'],
    requiredEvidence: [],
    validationStatus: 'VALIDADA',
  },
  {
    code: 'L21719-002',
    name: 'Bases de licitud del tratamiento',
    description:
      'La regla general (art. 12) es que el tratamiento de datos personales es lícito cuando el titular otorga su consentimiento (libre, informado, específico, previo e inequívoco, revocable sin efecto retroactivo). El artículo 13 habilita el tratamiento sin consentimiento en cinco casos: (a) datos de obligaciones económicas/financieras/bancarias/comerciales conforme al Título III; (b) cumplimiento de una obligación legal; (c) celebración o ejecución de un contrato con el titular (o medidas precontractuales a su solicitud); (d) satisfacción de intereses legítimos del responsable o de un tercero, sin afectar los derechos del titular (quien puede exigir ser informado de ese interés legítimo); (e) formulación, ejercicio o defensa de un derecho ante tribunales u órganos públicos. El responsable siempre debe poder acreditar la licitud del tratamiento.',
    jurisdiction: 'Chile',
    subject: 'Licitud del tratamiento',
    norm: 'Ley N.º 21.719',
    article: 'Artículos 12 y 13',
    excerpt:
      '"Es lícito el tratamiento de los datos personales que le conciernen al titular, cuando otorgue su consentimiento para ello" (art. 12). "Es lícito el tratamiento de datos personales, sin el consentimiento del titular, en los siguientes casos: a) (...) Título III (...); b) (...) obligación legal (...); c) (...) contrato (...); d) (...) intereses legítimos del responsable o de un tercero (...); e) (...) formulación, ejercicio o defensa de un derecho ante los tribunales de justicia u órganos públicos" (art. 13).',
    officialUrl: 'https://bcn.cl/gJo3hf',
    status: 'VALIDADA',
    regime: 'FUTURO',
    sourceCode: 'BCN_LEYCHILE',
    activationConditions: { op: 'nonEmpty', path: 'processingActivities' },
    result: {
      obligationSummary:
        'Documentar, para cada tratamiento identificado, cuál de las seis bases de licitud del nuevo régimen lo ampararía (consentimiento del art. 12, o alguna de las cinco causales sin consentimiento del art. 13), y conservar evidencia que lo acredite.',
      references: ['Ley N.º 21.719, artículos 12 y 13'],
    },
    risk: 'Tratamientos sin base de licitud identificable bajo ninguno de los supuestos de los artículos 12 o 13',
    severity: 'alto',
    relatedQuestionCodes: ['Q-FUT-002'],
    requiredEvidence: ['Listado de actividades de tratamiento con su finalidad'],
    validationStatus: 'VALIDADA',
  },
  {
    code: 'L21719-003',
    name: 'Derechos del titular: acceso, rectificación, supresión, oposición, portabilidad y bloqueo',
    description:
      'El nuevo Título I reconoce seis derechos, personales, intransferibles e irrenunciables (art. 4): acceso (art. 5 — conocer si sus datos se tratan, origen, finalidad, destinatarios, plazo de conservación, y la lógica de decisiones automatizadas si aplica), rectificación (art. 6), supresión (art. 7 — con causales tasadas y excepciones como libertad de informar, cumplimiento contractual/legal, interés público en salud, fines históricos/estadísticos/científicos, o defensa de reclamaciones), oposición (art. 8 — incluyendo el derecho especial a oponerse a decisiones individuales automatizadas y elaboración de perfiles del art. 8 bis, con derecho a intervención humana, explicación y revisión de la decisión), portabilidad (art. 9 — copia estructurada quando el tratamiento es automatizado y basado en consentimiento) y bloqueo temporal (art. 8 ter — suspensión mientras se resuelve una solicitud de rectificación/supresión/oposición). El procedimiento (arts. 10 y 11) exige que el responsable acuse recibo y resuelva dentro de 30 días corridos, prorrogables una vez por otros 30; el ejercicio de rectificación, supresión y oposición es siempre gratuito, y el de acceso y portabilidad gratuito al menos trimestralmente; el bloqueo temporal solicitado junto con una rectificación/supresión/oposición debe resolverse en 2 días hábiles. Ante denegación o silencio, el titular puede reclamar ante la Agencia (no ante un juez civil, a diferencia del régimen vigente).',
    jurisdiction: 'Chile',
    subject: 'Derechos de los titulares',
    norm: 'Ley N.º 21.719',
    article: 'Artículos 4º a 11',
    excerpt:
      '"Toda persona (...) tiene derecho de acceso, rectificación, supresión, oposición, portabilidad y bloqueo de sus datos personales (...). Tales derechos son personales, intransferibles e irrenunciables y no pueden limitarse por ningún acto o convención" (art. 4). "El titular de datos tiene derecho a oponerse y a no ser objeto de decisiones basadas en el tratamiento automatizado de sus datos personales, incluida la elaboración de perfiles, que produzca efectos jurídicos en él o le afecte significativamente" (art. 8 bis). "Recibida la solicitud el responsable deberá (...) pronunciarse a más tardar dentro de los treinta días corridos siguientes (...). Este plazo podrá ser prorrogado, por una sola vez, hasta por treinta días corridos" (art. 11).',
    officialUrl: 'https://bcn.cl/gJo3hf',
    status: 'VALIDADA',
    regime: 'FUTURO',
    sourceCode: 'BCN_LEYCHILE',
    activationConditions: { op: 'nonEmpty', path: 'dataSubjects' },
    result: {
      obligationSummary:
        'Implementar un procedimiento de atención de los seis derechos (acceso, rectificación, supresión, oposición —incluida la oposición a decisiones automatizadas del art. 8 bis—, portabilidad y bloqueo) con acuse de recibo, resolución en 30 días corridos (prorrogable por 30 más), gratuidad, y conocimiento de que el reclamo ante la falta de respuesta se presenta ante la Agencia, no ante un tribunal civil.',
      references: ['Ley N.º 21.719, artículos 4º a 11'],
    },
    risk: 'Procedimiento de derechos insuficiente para el estándar y los plazos del nuevo régimen',
    severity: 'medio',
    relatedQuestionCodes: ['Q-FUT-003'],
    requiredEvidence: [],
    validationStatus: 'VALIDADA',
  },
  {
    code: 'L21719-004',
    name: 'Evaluación de impacto en protección de datos personales (EIPD)',
    description:
      'El artículo 15 ter exige realizar, antes de iniciar el tratamiento, una evaluación de impacto cuando sea probable que un tipo de tratamiento —por su naturaleza, alcance, contexto, tecnología o fines— pueda producir un alto riesgo para los derechos de los titulares. Se exige siempre en cuatro casos: (a) evaluación sistemática y exhaustiva de aspectos personales basada en tratamiento o decisiones automatizadas (incluida elaboración de perfiles) con efectos jurídicos significativos; (b) tratamiento masivo o a gran escala; (c) observación o monitoreo sistemático de una zona de acceso público; (d) tratamiento de datos sensibles y especialmente protegidos en las hipótesis de excepción al consentimiento. La Agencia publicará una lista orientativa de tratamientos que requieren o no EIPD, y orientaciones mínimas para realizarla.',
    jurisdiction: 'Chile',
    subject: 'Tratamientos de alto riesgo',
    norm: 'Ley N.º 21.719',
    article: 'Artículo 15 ter',
    excerpt:
      '"Cuando sea probable que un tipo de tratamiento, por su naturaleza, alcance, contexto, tecnología utilizada o fines, pueda producir un alto riesgo para los derechos de las personas titulares de los datos personales, el responsable del tratamiento deberá realizar, previo al inicio de las operaciones del tratamiento, una evaluación del impacto en protección de datos personales" (art. 15 ter, inciso 1º).',
    officialUrl: 'https://bcn.cl/gJo3hf',
    status: 'VALIDADA',
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
        'Evaluar si el tratamiento identificado encuadra en alguno de los cuatro supuestos del artículo 15 ter (perfilamiento con efectos jurídicos significativos, tratamiento masivo/gran escala, monitoreo sistemático de zonas públicas, o datos sensibles sin consentimiento) y, de ser así, realizar la evaluación de impacto antes de iniciar o continuar el tratamiento.',
      references: ['Ley N.º 21.719, artículo 15 ter'],
    },
    risk: 'Tratamiento de alto riesgo sin evaluación de impacto previa',
    severity: 'alto',
    relatedQuestionCodes: ['Q-FUT-004'],
    requiredEvidence: ['Descripción técnica del tratamiento de alto riesgo'],
    validationStatus: 'VALIDADA',
  },
  {
    code: 'L21719-005',
    name: 'Delegado de Protección de Datos (DPO): designación voluntaria',
    description:
      'Confirmado contra el texto oficial: la designación de un Delegado de Protección de Datos es VOLUNTARIA, no obligatoria. El artículo 50 dispone expresamente que "el responsable de datos podrá designar un delegado de protección de datos personales". La figura se enmarca dentro del "modelo de prevención de infracciones" (arts. 48 a 53), un programa de cumplimiento que los responsables pueden adoptar voluntariamente (similar en lógica a los modelos de prevención de delitos de la Ley 20.393) para, entre otros beneficios, servir como circunstancia atenuante de responsabilidad (art. 36 N.º 5) y obtener una certificación de la Agencia inscrita en el Registro Nacional de Sanciones y Cumplimiento. En micro, pequeñas y medianas empresas, el propio dueño o su máxima autoridad puede asumir personalmente las funciones de delegado.',
    jurisdiction: 'Chile',
    subject: 'Gobernanza de datos',
    norm: 'Ley N.º 21.719',
    article: 'Artículos 48 a 51',
    excerpt:
      '"El responsable de datos podrá designar un delegado de protección de datos personales" (art. 50, inciso 1º). "Los responsables de datos podrán voluntariamente adoptar un modelo de prevención de infracciones consistente en un programa de cumplimiento" (art. 49, inciso 1º), que debe contener, entre otros elementos, "la designación de un delegado de protección de datos personales" (art. 49, letra a).',
    officialUrl: 'https://bcn.cl/gJo3hf',
    status: 'VALIDADA',
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
        'La designación de un Delegado de Protección de Datos no es obligatoria bajo la Ley 21.719. Dado el volumen de titulares o el tratamiento de datos sensibles identificado, evaluar como recomendación de buena práctica (no como obligación legal) adoptar voluntariamente el modelo de prevención de infracciones del artículo 49, que incluye esa designación y puede operar como atenuante de responsabilidad.',
      references: ['Ley N.º 21.719, artículos 48 a 51'],
    },
    risk: 'Ausencia de un modelo de prevención voluntario que habría atenuado la responsabilidad ante una eventual infracción',
    severity: 'bajo',
    relatedQuestionCodes: ['Q-FUT-005'],
    requiredEvidence: ['Estimación del número de titulares y tipos de datos tratados'],
    validationStatus: 'VALIDADA',
  },
  {
    code: 'L21719-006',
    name: 'Transferencias internacionales de datos personales',
    description:
      'El nuevo Título V (arts. 27-29) regula en detalle las transferencias internacionales, ausentes en el régimen vigente. Son lícitas cuando: (a) el destinatario está en un país con nivel adecuado de protección, determinado por la Agencia (art. 28); (b) existen cláusulas contractuales, normas corporativas vinculantes u otros instrumentos con garantías adecuadas; o (c) responsable y receptor adoptan un modelo de cumplimiento o certificación con garantías adecuadas. En ausencia de adecuación o garantías, procede igualmente una transferencia específica y no habitual en ocho supuestos tasados (art. 27, inciso 2º): consentimiento expreso del titular; transferencias bancarias/financieras/bursátiles conforme a sus leyes; cumplimiento de tratados internacionales ratificados y vigentes; convenios de cooperación de órganos públicos; autorización legal expresa; colaboración judicial internacional; ejecución de un contrato con el titular; o urgencia médica/sanitaria. La Agencia fiscaliza estas operaciones, publica un listado de países adecuados y modelos tipo de cláusulas, y puede suspender temporalmente transferencias en casos calificados (art. 29).',
    jurisdiction: 'Chile',
    subject: 'Transferencias internacionales',
    norm: 'Ley N.º 21.719',
    article: 'Artículos 27 a 29',
    excerpt:
      '"Cumpliéndose los requisitos que, de conformidad a esta ley, autorizan al tratamiento de datos, son lícitas las operaciones de transferencia internacional de datos" cuando el destino ofrece "niveles adecuados de protección" (art. 27, letra a), existen "cláusulas contractuales, normas corporativas vinculantes, u otros instrumentos jurídicos (...) con garantías adecuadas" (letra b), o se adopta "un modelo de cumplimiento o mecanismo de certificación" con garantías adecuadas (letra c).',
    officialUrl: 'https://bcn.cl/gJo3hf',
    status: 'VALIDADA',
    regime: 'FUTURO',
    sourceCode: 'BCN_LEYCHILE',
    activationConditions: { op: 'nonEmpty', path: 'internationalTransfers' },
    result: {
      obligationSummary:
        'Revisar cada transferencia internacional identificada contra los tres mecanismos generales del artículo 27 (país adecuado según la Agencia, cláusulas/BCR con garantías adecuadas, o modelo de certificación) o, en su defecto, contra los ocho supuestos tasados de transferencia específica y no habitual del mismo artículo.',
      references: ['Ley N.º 21.719, artículos 27 a 29'],
    },
    risk: 'Transferencia internacional sin mecanismo de adecuación ni garantías bajo el nuevo régimen',
    severity: 'alto',
    relatedQuestionCodes: ['Q-FUT-006'],
    requiredEvidence: ['Identificación del proveedor, país de destino y mecanismo de transferencia utilizado'],
    validationStatus: 'VALIDADA',
  },
  {
    code: 'L21719-007',
    name: 'Régimen sancionatorio',
    description:
      'Las infracciones se clasifican en leves, graves y gravísimas (arts. 34 bis, ter y quáter), con ejemplos tasados: leves incluyen incumplir el deber de información/transparencia u omitir/responder tarde una solicitud; graves incluyen tratar sin base de licitud, impedir el ejercicio de derechos, vulnerar el deber de seguridad o de secreto, o transferir internacionalmente en contravención a la ley; gravísimas incluyen tratamiento fraudulento, uso malicioso con finalidad distinta, vulnerar el secreto sobre datos sensibles o de niños, u omitir deliberadamente el reporte de una brecha de seguridad. Las sanciones (art. 35) son: hasta 5.000 UTM para leves, hasta 10.000 UTM para graves, y hasta 20.000 UTM para gravísimas, con posibilidad de triplicarse en caso de reincidencia, y de alcanzar el 2% (graves) o 4% (gravísimas) de los ingresos anuales por ventas y servicios del infractor, para empresas que no sean de menor tamaño, en caso de reincidencia. La Agencia debe considerar atenuantes (reparación, colaboración, autodenuncia, ausencia de sanciones previas, modelo de prevención certificado) y agravantes (reincidencia, infracción continuada, puesta en riesgo de derechos) al determinar el monto (arts. 36 y 37).',
    jurisdiction: 'Chile',
    subject: 'Régimen sancionatorio',
    norm: 'Ley N.º 21.719',
    article: 'Artículos 34 bis a 38',
    excerpt:
      '"Las infracciones leves serán sancionadas con amonestación escrita o multa de hasta 5.000 unidades tributarias mensuales (...) las infracciones graves (...) hasta 10.000 (...) las infracciones gravísimas (...) hasta 20.000 unidades tributarias mensuales" (art. 35).',
    officialUrl: 'https://bcn.cl/gJo3hf',
    status: 'VALIDADA',
    regime: 'FUTURO',
    sourceCode: 'BCN_LEYCHILE',
    activationConditions: { op: 'always' },
    result: {
      obligationSummary:
        'Dimensionar el riesgo económico de incumplimientos considerando el régimen sancionatorio (5.000/10.000/20.000 UTM según gravedad, con recargos por reincidencia que pueden llegar a un porcentaje de los ingresos anuales de la empresa) y las circunstancias atenuantes disponibles (en particular, contar con un modelo de prevención de infracciones certificado).',
      references: ['Ley N.º 21.719, artículos 34 bis a 38'],
    },
    risk: 'Exposición a sanciones de hasta 20.000 UTM (o un porcentaje de los ingresos anuales en caso de reincidencia de empresas de mayor tamaño) por infracciones gravísimas',
    severity: 'alto',
    relatedQuestionCodes: [],
    requiredEvidence: [],
    validationStatus: 'VALIDADA',
  },
  {
    code: 'L21719-008',
    name: 'Deber de reportar vulneraciones a las medidas de seguridad (brechas)',
    description:
      'El artículo 14 sexies exige reportar a la Agencia, por los medios más expeditos y sin dilaciones indebidas, las vulneraciones a las medidas de seguridad que ocasionen destrucción, filtración, pérdida o alteración accidental o ilícita de datos personales, o comunicación/acceso no autorizados, cuando exista un riesgo razonable para los derechos de los titulares. El responsable debe registrar cada comunicación (naturaleza de la vulneración, efectos, categorías de datos, número aproximado de titulares afectados, medidas adoptadas). Cuando la vulneración afecte datos sensibles, datos de niños menores de 14 años, o datos económicos/financieros/bancarios/comerciales, debe además notificarse directamente a cada titular afectado (o, si no es posible, mediante aviso en un medio de comunicación social masivo de alcance nacional), en lenguaje claro y sencillo, detallando los datos afectados, las consecuencias posibles y las medidas de solución adoptadas.',
    jurisdiction: 'Chile',
    subject: 'Incidentes de seguridad',
    norm: 'Ley N.º 21.719',
    article: 'Artículo 14 sexies',
    excerpt:
      '"El responsable deberá reportar a la Agencia, por los medios más expeditos posibles y sin dilaciones indebidas, las vulneraciones a las medidas de seguridad (...) cuando exista un riesgo razonable para los derechos y libertades de los titulares (...). Cuando dichas vulneraciones se refieran a datos personales sensibles, datos relativos a niños y niñas menores de catorce años o datos relativos a obligaciones de carácter económico, financiero, bancario o comercial, el responsable deberá también efectuar esta comunicación a los titulares de estos datos" (art. 14 sexies).',
    officialUrl: 'https://bcn.cl/gJo3hf',
    status: 'VALIDADA',
    regime: 'FUTURO',
    sourceCode: 'BCN_LEYCHILE',
    activationConditions: { op: 'nonEmpty', path: 'incidents' },
    result: {
      obligationSummary:
        'Evaluar si los incidentes identificados habrían requerido reportarse a la Agencia sin dilaciones indebidas y, si afectan datos sensibles, de niños menores de 14 años, o económicos/financieros, notificarse además directamente a cada titular afectado (o mediante aviso público si no es posible individualizarlos).',
      references: ['Ley N.º 21.719, artículo 14 sexies'],
    },
    risk: 'Incidente de seguridad sin protocolo de notificación a la Agencia ni a los titulares afectados',
    severity: 'critico',
    relatedQuestionCodes: ['Q-INC-001'],
    requiredEvidence: ['Registro del incidente: fecha, alcance, datos afectados, medidas adoptadas'],
    validationStatus: 'VALIDADA',
  },
  {
    code: 'L21719-009',
    name: 'Principios generales del tratamiento de datos',
    description:
      'El artículo 3º establece ocho principios que rigen todo tratamiento de datos personales bajo el nuevo régimen: licitud y lealtad; finalidad (recolección para fines específicos, explícitos y lícitos, sin reutilización incompatible); proporcionalidad (datos limitados a lo necesario, con conservación acotada al fin del tratamiento); calidad (exactitud, integridad, actualidad); responsabilidad (quien trata datos responde legalmente por el cumplimiento); seguridad (estándares adecuados contra tratamiento no autorizado, pérdida, filtración o destrucción); transparencia e información (poner a disposición del titular toda la información relevante, de forma clara, precisa y gratuita); y confidencialidad (deber de secreto de quienes tratan los datos, incluso después de terminada la relación con el titular). Estos principios son la base interpretativa de todas las demás obligaciones de la ley y también rigen, con matices, el tratamiento realizado por órganos públicos (art. 21).',
    jurisdiction: 'Chile',
    subject: 'Principios generales',
    norm: 'Ley N.º 21.719',
    article: 'Artículo 3º',
    excerpt:
      '"El tratamiento de los datos personales se rige por los siguientes principios: a) Principios de licitud y lealtad (...); b) Principio de finalidad (...); c) Principio de proporcionalidad (...); d) Principio de calidad (...); e) Principio de responsabilidad (...); f) Principio de seguridad (...); g) Principio de transparencia e información (...); h) Principio de confidencialidad." (art. 3º).',
    officialUrl: 'https://bcn.cl/gJo3hf',
    status: 'VALIDADA',
    regime: 'FUTURO',
    sourceCode: 'BCN_LEYCHILE',
    activationConditions: { op: 'always' },
    result: {
      obligationSummary:
        'Adoptar los ocho principios del artículo 3º (licitud/lealtad, finalidad, proporcionalidad, calidad, responsabilidad, seguridad, transparencia e información, confidencialidad) como marco general de cumplimiento, más allá de las obligaciones específicas de cada tratamiento.',
      references: ['Ley N.º 21.719, artículo 3º'],
    },
    risk: undefined,
    severity: 'bajo',
    relatedQuestionCodes: ['Q-GEN-001'],
    requiredEvidence: [],
    validationStatus: 'VALIDADA',
  },
  {
    code: 'L21719-010',
    name: 'Tratamiento a través de un tercero mandatario o encargado',
    description:
      'El artículo 15 bis regula en detalle el encargo de tratamiento a un tercero, ausente en el régimen vigente: el encargado solo puede tratar los datos conforme a las instrucciones del responsable, sin usarlos para un objeto distinto ni cederlos sin autorización expresa; si lo hace, pasa a ser considerado responsable de datos para todos los efectos, respondiendo personalmente y solidariamente con el responsable original por los daños. El tratamiento debe regirse por un contrato que establezca el objeto del encargo, su duración, la finalidad del tratamiento, el tipo de datos y categorías de titulares involucrados, y los derechos y obligaciones de las partes; la sub-delegación del encargo requiere autorización expresa y escrita, y el encargado que sub-delega sigue siendo solidariamente responsable. El encargado debe cumplir los deberes de confidencialidad (art. 14 bis) y de seguridad (art. 14 quinquies), y al terminar el servicio debe suprimir o devolver los datos al responsable. La Agencia pondrá a disposición modelos tipo de estos contratos.',
    jurisdiction: 'Chile',
    subject: 'Encargo de tratamiento a terceros',
    norm: 'Ley N.º 21.719',
    article: 'Artículo 15 bis',
    excerpt:
      '"El tratamiento de datos a través de un tercero mandatario o encargado se regirá por el contrato celebrado entre el responsable y el encargado (...). En el contrato se deberá establecer el objeto del encargo, la duración del mismo, la finalidad del tratamiento, el tipo de datos personales tratados, las categorías de titulares a quienes conciernen los datos, y los derechos y obligaciones de las partes" (art. 15 bis, inciso 3º).',
    officialUrl: 'https://bcn.cl/gJo3hf',
    status: 'VALIDADA',
    regime: 'FUTURO',
    sourceCode: 'BCN_LEYCHILE',
    activationConditions: { any: [{ op: 'nonEmpty', path: 'providers' }, { op: 'nonEmpty', path: 'thirdParties' }] },
    result: {
      obligationSummary:
        'Formalizar con cada proveedor/tercero que trate datos por encargo un contrato que cumpla el artículo 15 bis (objeto, duración, finalidad, tipo de datos, categorías de titulares, derechos y obligaciones de las partes, régimen de sub-delegación), en reemplazo del simple "mandato" que exige hoy la Ley 19.628.',
      references: ['Ley N.º 21.719, artículo 15 bis'],
    },
    risk: 'Encargo de tratamiento sin contrato que cumpla los requisitos mínimos del artículo 15 bis',
    severity: 'medio',
    relatedQuestionCodes: ['Q-PROV-002', 'Q-SAAS-001'],
    requiredEvidence: ['Contrato de encargo de tratamiento vigente con cada proveedor/tercero'],
    validationStatus: 'VALIDADA',
  },
  {
    code: 'L21719-011',
    name: 'Datos personales de niños, niñas y adolescentes',
    description:
      'El artículo 16 quáter fija un régimen especial: el tratamiento de datos de niños, niñas y adolescentes solo puede realizarse atendiendo a su interés superior y su autonomía progresiva. Para niños y niñas (menores de 14 años) se requiere el consentimiento de sus padres, representantes legales o de quien tenga su cuidado personal, salvo autorización o mandato legal expreso. Los adolescentes (14 a 18 años) se rigen por las normas generales de autorización de los adultos, salvo para sus datos personales sensibles, que solo pueden tratarse con el consentimiento de sus padres, representantes legales o quien tenga su cuidado personal si son menores de 16 años. Constituye una obligación especial de los establecimientos educacionales y de quienes traten o administren datos de niños, niñas y adolescentes velar por el uso lícito y la protección de esa información.',
    jurisdiction: 'Chile',
    subject: 'Datos de menores de edad',
    norm: 'Ley N.º 21.719',
    article: 'Artículo 16 quáter',
    excerpt:
      '"El tratamiento de los datos personales que conciernen a los niños, niñas y adolescentes, sólo puede realizarse atendiendo al interés superior de éstos y al respeto de su autonomía progresiva (...) para tratar los datos personales de los niños y niñas se requiere el consentimiento otorgado por sus padres o representantes legales o por quien tiene a su cargo el cuidado personal del niño o niña (...). Los datos personales sensibles de los adolescentes menores de dieciséis años sólo se podrán tratar con el consentimiento otorgado por sus padres o representantes legales" (art. 16 quáter).',
    officialUrl: 'https://bcn.cl/gJo3hf',
    status: 'VALIDADA',
    regime: 'FUTURO',
    sourceCode: 'BCN_LEYCHILE',
    activationConditions: { op: 'includes', path: 'sectorKeys', value: 'educacion' },
    result: {
      obligationSummary:
        'Verificar que el tratamiento de datos de niños (menores de 14 años) cuente con el consentimiento de sus padres/representantes/cuidadores, y que los datos sensibles de adolescentes menores de 16 años cuenten con ese mismo consentimiento, conforme al interés superior del menor.',
      references: ['Ley N.º 21.719, artículo 16 quáter'],
    },
    risk: 'Tratamiento de datos de niños, niñas o adolescentes sin el consentimiento parental exigido por la ley',
    severity: 'alto',
    relatedQuestionCodes: ['Q-EDU-002'],
    requiredEvidence: ['Procedimiento de recolección de consentimiento parental'],
    validationStatus: 'VALIDADA',
  },
];
