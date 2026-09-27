# Testing

## Resumen de lo que existe hoy

| Capa | Herramienta | Ubicación | Requiere BD real |
|---|---|---|---|
| Unitarias | Vitest | `tests/legal-engine/`, `tests/review-engine/`, `tests/ai-engine/`, `tests/web-analysis/`, `tests/document-processing/` | No |
| Integración | Vitest + PostgreSQL real | `tests/integration/full-pipeline.test.ts` | Sí |
| Prueba final del encargo (sección 24) | Vitest + PostgreSQL real | `tests/demo/seed-demo-organizations.test.ts` | Sí |
| End-to-end (navegador) | Playwright + Chromium | `e2e/login.spec.ts`, `e2e/golden-path.spec.ts` | Sí (+ build de producción) |

Todas verdes al momento de entregar este proyecto (41 pruebas Vitest + 6 pruebas
Playwright).

## Cómo ejecutarlas

```bash
# Requiere PostgreSQL corriendo y DATABASE_URL/SHADOW_DATABASE_URL en .env,
# y la base sembrada (npm run db:seed) antes de correr las de integración.

npm run typecheck
npm run lint
npm test                 # unitarias + integración (Vitest)

npm run build
npm run test:e2e         # Playwright — levanta `next start` sobre el build de producción
```

`vitest.config.ts` alía el paquete `server-only` a un stub neutro
(`tests/stubs/server-only-stub.ts`) porque ese paquete solo resuelve a un módulo vacío
bajo la condición de exports `react-server`, que únicamente aplica dentro de la
compilación de Next.js — sin ese alias, cualquier módulo de `src/modules`/`src/server`
lanzaría una excepción al importarse desde Vitest (Node puro). Esto permite probar la
lógica de negoocio real (no una copia reescrita para ser "testeable") directamente.

## Qué cubre cada tipo de prueba

**Unitarias**: evaluador de condiciones del motor jurídico, control de vigencia de la Ley
21.719, los 20 controles del motor de revisión (con foco en los que tienen lógica no
trivial: CHECK1, CHECK14, CHECK19, CHECK20), protección SSRF (esquemas prohibidos,
localhost, rangos privados, IP de metadatos de nube), validación de archivos (extensión,
MIME, firma binaria, tamaño, archivo disfrazado), detectores de análisis web, y el
proveedor mock de IA (detecta datos sensibles/tecnologías/incidentes, nunca marca
`CONFIRMADO`, detecta negaciones como `CONTRADICTORIO`, produce hallazgos distintos para
transcripciones de sectores distintos).

**Integración** (`full-pipeline.test.ts`): para 4 organizaciones desechables (una por
sector: salud, educación, comercio electrónico, SaaS), ejercita el flujo completo contra
PostgreSQL real — creación de organización y diagnóstico, carga de transcripción,
`runFullAnalysis` (análisis + motor jurídico en ambos regímenes vía `TRANSICION`),
generación de cuestionario, revisión automática (20 checks), exportación a JSON — y
verifica al final que los 4 cuestionarios generados son distintos entre sí (comparación
por diferencia simétrica de códigos de pregunta). Limpia sus propios datos al terminar.

**Prueba final del encargo** (`seed-demo-organizations.test.ts`, sección 24 original):
crea las organizaciones ficticias nombradas explícitamente en el encargo — Centro Médico
Ejemplo, Colegio Ejemplo, Tienda Ejemplo E-commerce SpA, Ejemplo SaaS Cloud SpA — con
datos simulados, y convierte cada punto del checklist de la sección 24 en una aserción
automatizada (identifica pacientes/trabajadores/proveedores, datos de salud, otros
sensibles, tratamientos, ficha clínica, tecnologías, normativa sectorial activada,
preguntas generadas y condicionales, vacíos de información detectados, revisión de
cobertura ejecutada, edición funcional, aprobación condicionada al resultado de la
revisión, exportación a PDF/DOCX/JSON, trazabilidad vía `Evidence`). **A diferencia de la
prueba de integración, esta no limpia sus datos al terminar**: las organizaciones quedan
en la base de datos para poder inspeccionarse desde la interfaz.

**End-to-end**: `login.spec.ts` cubre login válido, login inválido y redirección de ruta
protegida sin sesión. `golden-path.spec.ts` recorre la interfaz real (no llamadas
directas a Server Actions): crear organización → crear diagnóstico → cargar transcripción
→ ejecutar análisis → generar cuestionario → ejecutar revisión → generar y descargar una
exportación JSON.

## Bugs reales encontrados y corregidos gracias a estas pruebas

Documentado también en `INFORME_FINAL.md`, pero vale la pena dejarlo aquí como ejemplo de
por qué vale la pena escribir estas pruebas en vez de darlas por buenas:

1. **Cookie de sesión `secure` basada en `NODE_ENV`** rompía el login al correr
   `next start` sobre HTTP plano (como en e2e) — corregido para basarse en si `APP_URL`
   declara `https://`.
2. **Páginas protegidas sin guard propio** confiaban únicamente en el layout padre;
   Next.js puede empezar a ejecutar una página hija en paralelo con el layout antes de que
   la redirección de este último se resuelva, lo que producía una excepción no capturada
   (`Cannot read properties of null`) al visitar una ruta protegida sin sesión. Se agregó
   un guard local en las 12 páginas afectadas.
3. **Etiquetas de formulario sin asociación accesible** (`<label>` sin `for`/`id`
   correspondiente): además de ser un defecto de accesibilidad real, hacía inutilizables
   los selectores `getByLabel` de Playwright. Se corrigió en el componente `Field`
   compartido (genera y enlaza un `id` automáticamente).
4. **Regla jurídica L20584-001 nunca se activaba**: su condición miraba
   `organization.sectorKeys` (campo estático de la organización) en vez del sector
   *detectado* dinámicamente para el diagnóstico. Se agregó `sectorKeys` a la base de
   hechos del motor jurídico.
5. **Pregunta `Q-CIBER-001` referenciada por una regla pero inexistente en el banco**,
   lo que hacía fallar `CHECK1` (cobertura de materias legales) para cualquier diagnóstico
   que activara la regla de ciberseguridad. Se agregó la pregunta faltante.
6. Indicadores de activación del sector SaaS demasiado estrechos (no reconocían frases
   naturales como "usuarios finales" o "clientes empresariales"); se ampliaron.

## Qué no se pudo probar en este entorno

- El proveedor de IA real (Anthropic/OpenAI) — sin credenciales ni acceso de red.
- El análisis web contra un sitio real — el proxy de egreso de este entorno bloquea
  dominios arbitrarios (ver `WEB_ANALYSIS.md`).
- Carga de archivos `.xlsx`/OCR real de imágenes — adaptadores mock, ver `DOCUMENT_PROCESSING.md`.

## Pendiente de implementación

- Cobertura de pruebas para los flujos de edición de cuestionario más finos (reordenar,
  editar texto de una pregunta del banco).
- Pruebas de carga/concurrencia.
- Pipeline de CI (GitHub Actions) que ejecute `typecheck`, `lint`, `test`, `build` y
  `test:e2e` en cada PR — hoy estos comandos se documentan pero se ejecutan manualmente.
