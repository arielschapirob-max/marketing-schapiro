# Motor jurídico

## Estado de verificación (léase primero)

**Las 21 reglas jurídicas del sistema están `validationStatus: 'VALIDADA'`**, contrastadas
artículo por artículo contra el **texto oficial de la Biblioteca del Congreso Nacional**:
las 6 de la Ley 19.628 y las 11 de la Ley 21.719 contra el PDF oficial aportado
directamente por el usuario (dueño del proyecto, abogado) cuando el acceso de red a
bcn.cl resultó bloqueado en este entorno; y las 4 restantes (`L20584-001`, `L21663-001`,
`L21459-001`, `CPR-001`) contra el texto XML oficial obtenido en vivo desde `bcn.cl` una
vez que el usuario habilitó ese dominio en el entorno (ver historial abajo, "Cuarta
pasada"). Cada regla cita el número de artículo exacto y un extracto textual verbatim de
la fuente oficial, en los campos `article` y `excerpt` de
`src/modules/legal-engine/rules/*.ts`.

**Antes de usar este sistema con un cliente real**, un abogado debe reconfirmar que el
texto de origen de cada regla corresponde a la versión vigente al momento de uso (una ley
puede modificarse después de la fecha de esta revisión — ver, por ejemplo, la alerta de
seguimiento sobre el boletín 18.623-07 en `vigencia.ts`). Cualquier actualización se hace
en `src/modules/legal-engine/rules/*.ts` + `npm run db:seed`, o desde la pantalla de
administración de fuentes y reglas.

## Historial de verificación

### Primera pasada — bloqueo de red confirmado

Este motor se construyó en un entorno de ejecución cuyo proxy de red **bloquea el acceso
a `bcn.cl` (Ley Chile), `leychile.cl`, `diariooficial.interior.gob.cl`, `camara.cl` y
`senado.cl`**. Se intentó acceder directamente (`WebFetch`) por varias rutas (con y sin
`www.`, subdominios alternativos como `c.bcn.cl`) y se confirmó el bloqueo
(`EGRESS_BLOCKED`) en todos los casos — incluso después de que el usuario agregó `bcn.cl`
a la lista de dominios permitidos del entorno, porque ese cambio solo se aplica a
**sesiones nuevas**, no a una ya iniciada. Como alternativa inicial se usó búsqueda web
general para contrastar **hechos de alto nivel y ampliamente coincidentes entre múltiples
fuentes secundarias** (existencia de cada ley, número, fecha de publicación, vigencia
general de la Ley 21.719, creación de la Agencia de Protección de Datos Personales).
Ningún artículo específico fue verificado contra el texto oficial en esta etapa, y todas
las reglas quedaron `REQUIERE_VALIDACION_JURIDICA`.

### Segunda pasada de revisión (misma limitación de red, más fuentes secundarias cruzadas)

Se hizo una segunda pasada de revisión de las 17 reglas usando búsqueda web general
(no acceso directo a bcn.cl, que se confirmó nuevamente bloqueado) para contrastar cada
regla contra **varias fuentes secundarias independientes a la vez** en vez de una sola, y
corregir lo que no coincidiera. Cambios concretos que salieron de esa revisión:

- **`L21719-003`** (derechos ampliados): la primera versión especulaba un derecho a "no
  ser objeto de decisiones automatizadas sin intervención humana", que ninguna fuente
  consultada menciona para esta ley. Se corrigió a los dos derechos que sí aparecen
  repetidos en múltiples fuentes especializadas — **portabilidad** y **bloqueo temporal**
  — bajo el acrónimo "ARCOP", con un plazo de respuesta descrito de 30 días corridos
  prorrogables por 30 más (plazo también pendiente de confirmación oficial).
- **`L21719-005`** (Delegado de Protección de Datos): las fuentes consultadas se
  **contradicen entre sí** — unas dicen que el DPO es obligatorio para organismos
  públicos y tratamiento de datos sensibles a gran escala, otras dicen que el artículo 50
  lo dejaría como una facultad ("podrá designar"), no una obligación. La regla ahora dice
  esto explícitamente en vez de asumir cualquiera de las dos versiones.
- **`L21663-001`** (ciberseguridad): se agregó que la ley crea la **Agencia Nacional de
  Ciberseguridad (ANCI)** y el concepto de **Operador de Importancia Vital (OIV)**
  (artículo 5°), y que los artículos 5, 8, 9 y el Título VII entraron en vigor el 1 de
  marzo de 2025. La condición de activación se acotó de "cualquier tecnología detectada"
  (demasiado amplia — casi cualquier organización usa alguna tecnología) a los sectores
  que las fuentes asocian con "servicios esenciales"/OIV (salud, telecomunicaciones,
  servicios públicos, financiero, transporte), más incidentes de seguridad como gatillo
  adicional.
- **`L21459-001`** (delitos informáticos): se agregó la numeración de artículos por tipo
  penal (ataque a la integridad de un sistema: art. 1; acceso ilícito: art. 2;
  interceptación ilícita: art. 3; ataque a la integridad de datos: art. 4; receptación
  informática: art. 6; fraude informático: art. 7; abuso de dispositivos: art. 8),
  corroborada por varias fuentes jurídicas independientes entre sí (incluyendo un
  artículo académico revisado por pares), aunque sigue sin confirmarse contra el texto
  oficial.
- **`L20584-001`** (ficha clínica): se agregaron tres puntos descritos consistentemente
  por fuentes especializadas de salud — confidencialidad frente a terceros no
  autorizados (incluidos familiares sin consentimiento), un plazo de entrega de copia al
  paciente descrito en 48 horas hábiles, y una conservación mínima descrita en 15 años.
- **`L19628-001`**: se agregó la fecha de publicación (28 de agosto de 1999), coincidente
  entre BCN y otras fuentes oficiales/institucionales (Gobierno Digital).
- **Vigencia de la Ley 21.719**: se detectó un proyecto de ley en trámite (**boletín
  18.623-07**) que propondría postergar la vigencia general del 1 de diciembre de 2026 al
  1 de diciembre de 2027. La fecha configurada por defecto sigue siendo 2026 (la vigente
  según el texto de la propia Ley 21.719), pero esto debe monitorearse — ver el
  comentario correspondiente en `vigencia.ts`.

Ninguno de estos cambios sube el `validationStatus` de una regla a `'VALIDADA'`: seguir
corroborado por fuentes secundarias, aunque sean varias e independientes entre sí, no
equivale a confirmarlo contra el texto oficial. Sirve para que la revisión de un abogado
parta de un texto más preciso y con las contradicciones ya señaladas, no para saltarse esa
revisión.

### Tercera pasada — verificación real contra los PDF oficiales de BCN

Ante el bloqueo de red persistente, el usuario resolvió el problema de la forma más
directa posible: descargó él mismo los PDF oficiales de la Ley N.º 19.628 y la Ley N.º
21.719 desde bcn.cl (con la firma digital y el encabezado propios de la Biblioteca del
Congreso Nacional) y los adjuntó a la conversación. Ambos se leyeron **íntegramente**
(13 páginas la Ley 19.628; 56 páginas la Ley 21.719, extraídas con `pypdf` ante una
limitación local de renderizado de páginas) y se contrastaron artículo por artículo contra
las reglas del sistema. Resultado: **las 6 reglas de la Ley 19.628 y las 11 de la Ley
21.719 pasaron a `validationStatus: 'VALIDADA'`**, cada una con su artículo exacto y un
extracto textual verbatim (campos `article`/`excerpt` en el código).

Hallazgos relevantes de esta pasada (algunos corrigen la pasada anterior, basada solo en
fuentes secundarias):

- **Los seis derechos del titular bajo la Ley 21.719 son, exactamente**: acceso (art. 5),
  rectificación (art. 6), supresión (art. 7), oposición (art. 8) —incluyendo el derecho
  especial a oponerse a **decisiones automatizadas y elaboración de perfiles** del
  **artículo 8 bis**—, portabilidad (art. 9) y bloqueo temporal (art. 8 ter). El derecho a
  no ser objeto de decisiones automatizadas que la segunda pasada había **eliminado** por
  no encontrarlo en fuentes secundarias **sí existe**, en el artículo 8 bis — la segunda
  pasada se equivocó al quitarlo; esta pasada lo repuso con la cita correcta.
- **El plazo de respuesta (30 días corridos, prorrogables por 30 más) queda confirmado**
  con texto literal del artículo 11, igual que la gratuidad de los derechos y el plazo de
  2 días hábiles para resolver una solicitud de bloqueo temporal formulada junto con una
  rectificación/supresión/oposición.
- **El Delegado de Protección de Datos es, sin ambigüedad, voluntario.** El artículo 50
  dice literalmente "el responsable de datos **podrá** designar un delegado de protección
  de datos personales", dentro de un "modelo de prevención de infracciones" (arts. 48-53)
  igualmente voluntario, que opera como atenuante de responsabilidad. La contradicción
  entre fuentes secundarias detectada en la segunda pasada queda resuelta a favor de
  "voluntario".
- **Las transferencias internacionales (arts. 27-29) tienen un régimen mucho más
  específico** de lo que las fuentes secundarias describían: tres mecanismos generales
  (país adecuado según la Agencia, cláusulas contractuales/normas corporativas
  vinculantes, o modelo de certificación) y, en su ausencia, ocho supuestos tasados de
  transferencia específica no habitual (consentimiento expreso, transferencias
  bancarias/financieras específicas, tratados internacionales, cooperación de organismos
  públicos, autorización legal, colaboración judicial, ejecución de contrato, urgencia
  médica).
- **Las sanciones quedan confirmadas con exactitud**: 5.000 UTM (leves), 10.000 UTM
  (graves) y 20.000 UTM (gravísimas) (art. 35), con posibilidad de triplicarse por
  reincidencia y de alcanzar 2%/4% de los ingresos anuales para empresas de mayor tamaño
  reincidentes.
- **La vigencia general de la Ley 21.719 al 1 de diciembre de 2026 queda confirmada por
  partida doble**: la disposición transitoria "Artículo primero" de la propia ley ("el día
  primero del mes vigésimo cuarto posterior a la publicación", 13-dic-2024 + 24 meses =
  1-dic-2026) y los metadatos oficiales del PDF de BCN generado el 20-mar-2026 ("Versión:
  Con Vigencia Diferida por Fecha De: 01-DIC-2026"), que además coinciden exactamente con
  el "Fin Vigencia: 30-NOV-2026" que BCN declara para la versión vigente de la Ley 19.628.
  El proyecto de postergación a 2027 detectado en la segunda pasada (boletín 18.623-07) no
  se reflejaba en el documento oficial más reciente disponible (marzo de 2026) — debe
  reconfirmarse si este análisis se usa bastante después de esa fecha.
- Se agregaron **3 reglas nuevas** con base directa en el texto oficial: `L21719-009`
  (los 8 principios del artículo 3º), `L21719-010` (régimen detallado de encargo de
  tratamiento del artículo 15 bis, más exigente que el simple "mandato" de la Ley 19.628),
  `L21719-011` (régimen especial de datos de niños, niñas y adolescentes del artículo 16
  quáter) y `L19628-006` (prohibición del artículo 9º de evaluaciones de riesgo comercial
  no basadas en información objetiva, verificado como fuente directa de la pregunta
  `Q-FIN-001` sobre scoring crediticio).
- Se confirmó también que el "bloqueo" de datos **no es una figura nueva** de la Ley
  21.719: ya existía, de forma más acotada, en el artículo 12 (inciso 4º) de la Ley
  19.628, ligada a datos proporcionados voluntariamente o usados para fines comerciales.

Las normas sectoriales (Ley 20.584, Ley 21.663, Ley 21.459, Constitución) **no** fueron
verificadas en esta tercera pasada porque el usuario no aportó esos PDF — siguen en el
estado descrito en la sección de la segunda pasada, `REQUIERE_VALIDACION_JURIDICA`.

### Cuarta pasada — acceso directo a bcn.cl y verificación de las 4 reglas sectoriales

El usuario habilitó `bcn.cl`/`www.bcn.cl` en la configuración de red del entorno. La
interfaz pública de `www.bcn.cl/leychile` es una aplicación Angular que no puede
renderizarse con las herramientas de fetch de este entorno (devuelve solo el cascarón
HTML con el mensaje "Este proceso demora demasiado..."), y su API de datos vive en el
subdominio `servicios-leychile.bcn.cl`, que seguía bloqueado por el proxy. Se resolvió
localizando, dentro del propio dominio ya autorizado `www.bcn.cl`, el endpoint que esa
misma aplicación usa para obtener el **texto oficial completo en XML**:
`https://www.bcn.cl/leychile/consulta/obtxml?opt=7&idNorma=<id>` (accedido con `curl` con
un User-Agent de navegador; sin ese encabezado el servidor devuelve 401). Con este
endpoint se descargó y leyó íntegramente el texto vigente de:

- Ley N.º 20.584 (`idNorma=1039348`, ficha clínica)
- Ley N.º 21.663 (`idNorma=1202434`, marco de ciberseguridad)
- Ley N.º 21.459 (`idNorma=1177743`, delitos informáticos)
- Ley N.º 21.096 (`idNorma=1119730`, reforma constitucional de 2018)
- Constitución Política de la República, texto refundido (`idNorma=242302`, Decreto 100
  de 2005)

y, como control cruzado adicional, también la Ley 19.628 (`idNorma=141599`) y la Ley
21.719 (`idNorma=1209272`) ya validadas en la tercera pasada — ambas coincidieron
exactamente con lo verificado contra los PDF, sin discrepancias.

Resultado: **las 4 reglas de `sectoriales.ts` pasaron a `validationStatus: 'VALIDADA'`**,
dejando las 21 reglas del sistema validadas contra fuente oficial. Hallazgos relevantes:

- **`L20584-001`**: se confirma literalmente la conservación de la ficha clínica por "al
  menos quince años" (art. 13) y la lista taxativa de ocho excepciones de acceso de
  terceros (art. 13, letras a) a h)). **Corrección respecto de la segunda pasada**: el
  plazo de "48 horas hábiles" para entregar copia al paciente, tomado entonces de fuentes
  secundarias de salud, **no existe en el texto de la ley** — el artículo 13 dice
  únicamente "entrega gratuita y sin dilaciones indebidas". Si ese plazo en horas existe,
  estaría en el Reglamento de Fichas Clínicas (Decreto N.º 41), que no fue verificado en
  este entorno; la regla ya no lo afirma como si fuera de rango legal.
- **`L21663-001`**: se transcriben literalmente el ámbito de aplicación (servicios
  esenciales y Operadores de Importancia Vital, art. 4º), los requisitos de calificación
  como OIV (art. 5º), los deberes específicos de los OIV (art. 8º) y, con el mayor detalle
  logrado hasta ahora, el esquema exacto de plazos del deber de reportar al CSIRT Nacional
  (art. 9º): alerta temprana a las 3 horas, actualización a las 72 horas (24 horas si el
  afectado es un OIV con su servicio esencial interrumpido), informe final a los 15 días
  corridos. **Corrección respecto de la segunda pasada**: la afirmación de que "los
  artículos 5, 8, 9 y el Título VII entraron en vigor el 1 de marzo de 2025" no se
  encuentra en el texto de la ley — la disposición transitoria "Artículo primero" delega
  en un DFL presidencial (a dictarse dentro de un año desde la publicación, 08-abr-2024)
  la fijación del calendario detallado, con un mínimo de 6 meses desde su publicación. Esa
  fecha específica de marzo de 2025, de ser correcta, proviene de ese DFL de
  implementación, no de la ley misma, y no se afirma en la regla sin haber verificado ese
  DFL directamente.
- **`L21459-001`**: se confirma la numeración exacta de siete de los ocho tipos penales que
  ya tenía la regla (arts. 1, 2, 3, 4, 6, 7 y 8) y **se agrega el artículo 5º
  (falsificación informática)**, que la segunda pasada había omitido por completo de la
  enumeración pese a existir en el texto oficial.
- **`CPR-001`**: se transcribe el texto vigente completo del artículo 19 N.º 4 de la
  Constitución ("el respeto y protección a la vida privada y a la honra de la persona y su
  familia, y asimismo, la protección de sus datos personales...") y se identifica con
  precisión que esa frase fue incorporada por la **Ley N.º 21.096** (2018), cuyo artículo
  único se transcribió también en forma literal — antes la regla solo decía, en términos
  genéricos, que la Constitución "reconoce" el derecho, sin citar norma ni texto.
- **Vigencia de la Ley 21.719 — reconfirmación con fecha 26-sep-2026**: el boletín
  18.623-07 (que propone postergar la vigencia general al 1-dic-2027) seguía en primer
  trámite constitucional en el Senado a esa fecha, sin ser ley ni estar publicado; la
  fecha vigente sigue siendo el 1-dic-2026. Ver el comentario actualizado en
  `vigencia.ts`.

## Modelo de datos

- `LegalSource`: fuente oficial (nombre, autoridad, URL). Ver `sources.ts`.
- `LegalRule`: una regla versionada. Campos clave: `code`, `regime` (`VIGENTE | FUTURO |
  TRANSICION`), `status`, `validationStatus`, `activationConditions` (JSON, ver DSL abajo),
  `result` (resumen de la obligación + referencias), `severity`, `relatedQuestionCodes`.
- `LegalRuleVersion`: historial de cambios de una regla (no usado activamente aún —
  **PENDIENTE DE IMPLEMENTACIÓN** la UI para diffs de versiones; el modelo ya existe).
- `LegalEvaluation`: resultado de evaluar una regla contra un diagnóstico concreto
  (`applicability`, `reasoning`, `certainty`, `evidenceRefs`).
- `Sector`: catálogo de 22 sectores (`src/modules/legal-engine/sectors.ts`).
- `DiagnosisSector`: sectores detectados para un diagnóstico concreto, con certeza.

## DSL de condiciones de activación

Cada regla tiene `activationConditions: Condition`, evaluado contra una `FactBase`
construida a partir de los `Finding` de un diagnóstico (`src/modules/legal-engine/engine.ts`):

```ts
type Condition =
  | { op: 'always' }
  | { op: 'nonEmpty'; path: string }
  | { op: 'empty'; path: string }
  | { op: 'includes'; path: string; value: string }
  | { op: 'includesAny'; path: string; values: string[] }
  | { op: 'gte' | 'lte'; path: string; value: number }
  | { op: 'equals'; path: string; value: string | number | boolean }
  | { all: Condition[] } | { any: Condition[] } | { not: Condition };
```

`path` navega la `FactBase`: `sensitiveData`, `internationalTransfers`, `sectorKeys`
(sectores **detectados** para el diagnóstico — distinto de `organization.sectorKeys`, que
es la declaración manual/estática de la organización), `organization.estimatedDataSubjects`,
etc. La lógica vive en `condition-evaluator.ts` y está cubierta por pruebas unitarias
(`tests/legal-engine/condition-evaluator.test.ts`).

## Control de vigencia (Ley 19.628 vs. Ley 21.719)

`src/modules/legal-engine/vigencia.ts`:

- **VIGENTE** (por defecto): evalúa solo reglas de la Ley 19.628 y normativa sectorial
  vigente hoy.
- **FUTURO**: evalúa solo reglas de la Ley 21.719, para modelar el escenario posterior a
  su vigencia general.
- **TRANSICION**: evalúa ambos regímenes en paralelo, explícitamente elegido por el
  abogado — el sistema **nunca** los mezcla automáticamente.

La fecha de vigencia general de la Ley 21.719 (por defecto **1 de diciembre de 2026**,
según la publicación del 13 de diciembre de 2024) es configurable vía
`LEY_21719_VIGENCIA_GENERAL` / `LEY_21719_FECHA_PUBLICACION` en `.env`, para poder
actualizarla si una fuente oficial confirma un cambio sin tocar código.

## Reglas incluidas (21 en total)

- **Ley N.º 19.628** (`L19628-001`…`006`, **VALIDADA**): ámbito de aplicación (art. 1),
  datos sensibles (arts. 2g y 10), derechos del titular (arts. 12, 13, 16), tratamiento
  por mandato (arts. 5 y 8), transferencias internacionales — vacío regulatorio (art. 5),
  prohibición de evaluaciones de riesgo comercial no objetivas (art. 9).
- **Ley N.º 21.719** (`L21719-001`…`011`, **VALIDADA**): Agencia de Protección de Datos
  Personales (arts. 30-30bis), bases de licitud (arts. 12-13), los seis derechos del
  titular incluida la oposición a decisiones automatizadas (arts. 4-11), evaluación de
  impacto (art. 15 ter), Delegado de Protección de Datos voluntario (arts. 48-51),
  transferencias internacionales (arts. 27-29), régimen sancionatorio (arts. 34bis-38),
  notificación de brechas (art. 14 sexies), principios generales (art. 3), encargo de
  tratamiento a terceros (art. 15 bis), datos de niños/niñas/adolescentes (art. 16 quáter).
- **Normativa sectorial** (`L20584-001`, `L21663-001`, `L21459-001`, `CPR-001`,
  **VALIDADA**): Ley N.º 20.584 (ficha clínica, arts. 12-13), Ley N.º 21.663 (marco de
  ciberseguridad, arts. 4, 5, 8 y 9), Ley N.º 21.459 (delitos informáticos, arts. 1-8), y
  el artículo 19 N.º 4 de la Constitución Política (incorporado por la Ley N.º 21.096).

Ninguna regla afirma aplicación automática: el resultado siempre es `APLICABLE |
POTENCIALMENTE_APLICABLE | NO_DETERMINADA | NO_IDENTIFICADA | REQUIERE_VALIDACION_JURIDICA`.

## Catálogo de sectores

22 sectores en `sectors.ts` (salud, educación, laboral, financiero, seguros, comercio,
inmobiliario, condominios, marketing, tecnología, SaaS, ONG, profesionales
independientes, transporte, turismo, hotelería, telecomunicaciones, medios, servicios
públicos, asociaciones, comercio electrónico), cada uno con indicadores de activación,
tratamientos/titulares/datos/proveedores/riesgos frecuentes y enlaces oficiales. Ampliable
sin tocar el resto de la aplicación: basta agregar una entrada y correr `npm run db:seed`.

## Cómo actualizar una regla o agregar una nueva

1. Edite `src/modules/legal-engine/rules/*.ts` (o cree un archivo nuevo y regístrelo en
   `rules/index.ts`).
2. Verifique el texto oficial antes de cambiar `validationStatus` a `'VALIDADA'`.
3. Corra `npm run db:seed` (usa `upsert` por `code`, es seguro repetir).
4. Si la regla cita una pregunta relacionada, agréguela primero en
   `question-engine/bank/*.ts` — el motor de revisión (`CHECK1`) fallará si
   `relatedQuestionCodes` apunta a un código inexistente o inactivo.
