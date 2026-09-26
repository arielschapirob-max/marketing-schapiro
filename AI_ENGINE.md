# Motor de IA

## Estado actual: MODO MOCK activo por defecto

`AI_PROVIDER=mock` (valor por defecto en `.env.example`) usa
`src/modules/ai-engine/providers/mock.ts`: un motor de **heurísticas léxicas en español**
sobre la transcripción, sin llamar a ningún servicio externo. Es el proveedor que se usa
en todas las pruebas de este proyecto (unitarias, integración, e2e y la prueba final de
la sección 24).

Este motor:

- Busca patrones (tratamientos, titulares, categorías de datos, datos sensibles,
  tecnologías, proveedores conocidos, terceros, transferencias internacionales,
  incidentes, medidas de seguridad, prácticas de conservación, documentos existentes) con
  ventanas de contexto como evidencia.
- Nunca marca un hallazgo como `CONFIRMADO` (siempre `PROBABLE`, `INFERIDO` o, si detecta
  una negación cercana al patrón — p. ej. "**no** tenemos política de privacidad" —,
  `CONTRADICTORIO`, para que quede sujeto a revisión humana en vez de darlo por sentado).
- Detecta señales de sector (`BUSINESS_ACTIVITY`) reutilizando el catálogo de
  `legal-engine/sectors.ts`.

## Proveedor real (Anthropic/OpenAI)

`src/modules/ai-engine/providers/live.ts` implementa una llamada HTTP directa (sin SDK)
a la API de Anthropic o de OpenAI, activada con `AI_PROVIDER=anthropic|openai` +
`AI_API_KEY`. **No fue posible probarlo en este entorno** (sin credenciales ni acceso
de red a esos dominios desde el contenedor de desarrollo) — queda como
**PENDIENTE DE VALIDACIÓN EN VIVO**, aunque el código, el esquema de validación y el
manejo de errores están completos y se ejercitan indirectamente por los mismos contratos
que usa el proveedor mock (misma interfaz `AIProvider`, mismo esquema Zod de salida).

El prompt del sistema (`SYSTEM_PROMPT` en `live.ts`) instruye explícitamente al modelo a:
no inventar normas fuera de una lista cerrada, no marcar `CONFIRMADO` sin cita textual, y
no emitir conclusiones jurídicas definitivas.

## Contrato común (`AIProvider`)

```ts
interface AIProvider {
  provider: string;
  model: string;
  analyzeMeetingTranscript(req: MeetingAnalysisRequest): Promise<MeetingAnalysisOutput>;
}
```

Cambiar de proveedor no requiere tocar `meeting-analysis` ni ningún otro módulo: solo la
variable de entorno `AI_PROVIDER`.

## Validación anti-alucinación

`src/modules/ai-engine/schemas.ts`:

- `KNOWN_NORMS`: lista cerrada de normas citables. Cualquier otra referencia es
  rechazada por el esquema Zod (`extractedFindingSchema`).
- `validateNoHallucination()`: rechaza cualquier hallazgo `CONFIRMADO` sin evidencia
  textual asociada de al menos 5 caracteres.
- Toda ejecución de IA (exitosa o fallida) se registra en `AIExecution`: proveedor,
  modelo, versión del prompt, entrada resumida, salida, validaciones, errores, fuentes
  usadas y usuario que la ejecutó — trazabilidad completa exigida por el encargo.

## Funciones de IA implementadas vs. pendientes

| Función pedida | Estado |
|---|---|
| Extracción estructurada | Implementada (mock + proveedor real) |
| Clasificación de certeza | Implementada |
| Detección de vacíos | Implementada (`unknowns` en la salida del análisis) |
| Detección de contradicciones | Implementada (negaciones léxicas cercanas) |
| Generación de preguntas candidatas | **PENDIENTE DE IMPLEMENTACIÓN** — el motor de preguntas actual es determinista (ver `QUESTION_ENGINE.md`); el modelo de datos (`status: 'AI_PROPOSED'`) ya está listo para esta extensión |
| Revisión de cobertura/redacción/fuentes | Implementada de forma determinista en `review-engine` (20 checks), no delegada a un LLM |
| Resumen ejecutivo / explicaciones no concluyentes | Implementado de forma determinista en el PDF/DOCX (sección "Resumen ejecutivo"); generación por IA del resumen es **PENDIENTE DE IMPLEMENTACIÓN** |

## Privacidad y envío a terceros

Con `AI_PROVIDER=mock` (por defecto), ningún dato de la organización sale del servidor.
Si se activa un proveedor real, se envía el texto de la transcripción tal cual al
proveedor configurado — **antes de activar esto en producción, agregue un aviso de
privacidad al cliente y confirme el marco contractual de tratamiento de datos con el
proveedor de IA elegido**, tal como exige la sección 15 del encargo original.
