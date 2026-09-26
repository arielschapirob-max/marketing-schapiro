# Motor de preguntas

## Principio

El cuestionario nunca se genera antes del análisis. `generateQuestionnaire()`
(`src/modules/question-engine/engine.ts`) solo debe invocarse después de
`runFullAnalysis()`, y selecciona preguntas del banco cuya condición de visibilidad se
cumple contra los hallazgos reales del diagnóstico — nunca se muestra un formulario
genérico que luego se "adapta".

## Modelo de una pregunta (`Question`)

Campos principales: `code`, `category`, `answerType` (13 tipos: texto corto/largo,
número, fecha, selección única/múltiple, sí/no, sí/no/no sé, tabla, archivo, matriz,
dirección, persona/proveedor, respuesta jurídica estructurada), `required`,
`visibilityCondition` (mismo DSL que el motor jurídico, ver `LEGAL_ENGINE.md`), `norm` +
`source` (código de la `LegalRule` que la justifica), `justification`, `legalMatter`,
`riskLevel`, `requiresDocument`, `allowsDontKnow`, `allowsNotApplicable`, `status`.

`QuestionVersion` guarda el historial de cambios de una pregunta (modelo listo;
**PENDIENTE DE IMPLEMENTACIÓN** la UI de comparación de versiones).

## Activación condicional

Una pregunta se incluye en un cuestionario si:

1. Su `visibilityCondition` se cumple contra la `FactBase` del diagnóstico (o no tiene
   condición, en cuyo caso siempre se incluye).
2. No es una pregunta del régimen futuro (`norm === 'Ley N.º 21.719'`) a menos que el
   diagnóstico esté en modo `FUTURO` o `TRANSICION`.
3. Si está etiquetada a uno o más sectores (`QuestionSector`), al menos uno de esos
   sectores debe haber sido detectado para el diagnóstico (`DiagnosisSector`).

Esto es lo que hace que **el cuestionario de un centro médico sea distinto al de una
tienda online o una SaaS** — verificado explícitamente en
`tests/integration/full-pipeline.test.ts` y `tests/demo/seed-demo-organizations.test.ts`
(los cuatro cuestionarios de la prueba final tienen firmas de preguntas distintas).

## Banco de preguntas incluido

- **Generales** (`bank/general.ts`): organización, tratamientos, titulares, derechos
  ARCO, categorías de datos, datos sensibles, proveedores/terceros, transferencias
  internacionales, tecnologías, seguridad, conservación, incidentes, ciberseguridad.
- **Régimen futuro** (`bank/futuro.ts`): preguntas específicas de la Ley 21.719 (base de
  licitud, portabilidad, evaluación de impacto, delegado de protección de datos,
  transferencias bajo el nuevo régimen).
- **Sectoriales** (`bank/sectoriales.ts`): salud, educación, comercio electrónico,
  SaaS/tecnología, laboral, financiero.

Ampliar el banco: agregar una entrada en el archivo correspondiente (o uno nuevo,
registrado en `bank/index.ts`) y correr `npm run db:seed`.

## Control sobre preguntas generadas por IA

El encargo exige que la IA no cree preguntas libremente. En este proyecto, el
**proveedor de IA no genera preguntas directamente**: solo extrae hallazgos
estructurados (`ai-engine`), y es el motor de preguntas (determinista, basado en el banco
versionado) el que decide qué preguntas mostrar según esos hallazgos. Si en el futuro se
habilita generación de preguntas candidatas por IA (ver `AI_ENGINE.md` y `ROADMAP.md`),
deben cumplir el mismo contrato: vinculación a una regla, una fuente, evidencia requerida,
y quedar en `status: 'AI_PROPOSED'` hasta aprobación humana explícita — el esquema de
`Question` ya contempla ese estado.

## Edición por el abogado

Desde `/diagnosticos/[id]/editor-cuestionario`:

- Descartar una pregunta con motivo (`QuestionnaireQuestion.discardedReason`).
- Reactivarla.
- Agregar una pregunta personalizada (`addCustomQuestionAction`), que exige texto y
  justificación y queda marcada `addedByLawyer: true`.

**PENDIENTE DE IMPLEMENTACIÓN** desde la UI (el modelo ya lo soporta): reordenar preguntas
por arrastrar-y-soltar, editar el texto de una pregunta del banco sin duplicarla, y
comparar versiones de un cuestionario.
