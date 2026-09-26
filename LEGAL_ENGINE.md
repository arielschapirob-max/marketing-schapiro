# Motor jurídico

## Limitación de verificación (léase primero)

Este motor se construyó en un entorno de ejecución cuyo proxy de red **bloquea el acceso
a `bcn.cl` (Ley Chile), `diariooficial.interior.gob.cl` y el resto de las fuentes
oficiales listadas en el encargo**. Se intentó acceder directamente (`WebFetch`) y se
confirmó el bloqueo (`EGRESS_BLOCKED`). Como alternativa se usó búsqueda web general para
contrastar **hechos de alto nivel y ampliamente coincidentes entre múltiples fuentes
secundarias** (existencia de cada ley, número, fecha de publicación, vigencia general de
la Ley 21.719, creación de la Agencia de Protección de Datos Personales). Ningún artículo,
inciso o numeral específico fue verificado contra el texto oficial.

**Consecuencia de diseño:** todas las reglas jurídicas del sistema están marcadas
`validationStatus: 'REQUIERE_VALIDACION_JURIDICA'`, ninguna cita un número de artículo
concreto salvo que se indique explícitamente lo contrario, y el motor de revisión
(`CHECK20`) lo recuerda en cada ejecución. **Antes de usar este sistema con un cliente
real, un abogado debe contrastar cada regla contra el texto vigente en bcn.cl** y
actualizarla desde la pantalla de administración de fuentes y reglas (o directamente en
`src/modules/legal-engine/rules/*.ts` + `npm run db:seed`).

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

## Reglas incluidas (todas REQUIERE VALIDACIÓN JURÍDICA)

- **Ley N.º 19.628** (`L19628-001`…`005`): ámbito de aplicación, datos sensibles,
  derechos ARCO, comunicación a terceros, transferencias internacionales.
- **Ley N.º 21.719** (`L21719-001`…`008`): nueva autoridad (Agencia de Protección de
  Datos Personales), bases de licitud, derechos ampliados, evaluaciones de impacto,
  delegado de protección de datos, transferencias internacionales, régimen sancionatorio,
  notificación de brechas.
- **Normativa sectorial**: Ley N.º 20.584 (ficha clínica, sector salud), Ley N.º 21.663
  (marco de ciberseguridad), Ley N.º 21.459 (delitos informáticos), y una referencia
  general a la Constitución Política.

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
