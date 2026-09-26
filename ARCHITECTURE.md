# Arquitectura

## Visión general

```
UI (App Router)  ──►  Server Actions (src/server/actions)  ──►  Módulos de dominio (src/modules)  ──►  Prisma  ──►  PostgreSQL
                                                                        │
                                                                        └─► Almacenamiento local/S3 (documentos, exportaciones)
```

La interfaz nunca contiene lógica jurídica, de IA, de documentos ni de revisión: solo
llama a Server Actions, que a su vez llaman a funciones de `src/modules/*` y
`src/server/*`. Esto cumple la sección 4 del encargo ("no coloques la lógica jurídica
directamente dentro de componentes frontend") sin necesidad de un backend HTTP separado.

## Por qué Server Actions y no una API REST/OpenAPI separada

El encargo pide "API y servicios de aplicación" como capa separada de la UI. Next.js App
Router permite lograr esa separación real (módulos de servidor, nunca enviados al
navegador, con sus propias validaciones y control de acceso) usando Server Actions en vez
de duplicar cada operación como una ruta HTTP + un cliente fetch. Se optó por esto porque:

- Reduce drásticamente el código repetido (menos superficie de bugs) sin sacrificar la
  separación de capas.
- TypeScript de extremo a extremo sin generar un contrato OpenAPI aparte.
- Next.js ya reduce estas acciones a llamadas POST internas — el navegador nunca ve el
  código de `src/modules` ni `src/server` (protegido además por `import 'server-only'`).

Sí se exponen dos rutas HTTP reales donde tiene sentido:

- `src/app/api/files/[id]/route.ts` y `src/app/api/exports/[id]/route.ts`: descarga de
  binarios privados con verificación de sesión y pertenencia a la organización.
- `src/app/api/health/route.ts`: healthcheck para despliegue/monitoreo.

**PENDIENTE DE IMPLEMENTACIÓN:** un contrato OpenAPI formal para integraciones externas
(hoy no existe ningún consumidor externo de esta API; si se necesita, se recomienda
extraer las Server Actions a Route Handlers documentados con `zod-to-openapi`).

## Módulos de dominio (`src/modules`)

| Módulo | Responsabilidad |
|---|---|
| `legal-engine` | Reglas jurídicas versionadas, catálogo de sectores, evaluador de condiciones, control de vigencia Ley 19.628 / Ley 21.719 |
| `question-engine` | Banco de preguntas y generación de cuestionario a partir del perfil |
| `ai-engine` | Abstracción de proveedor de IA (mock por defecto, Anthropic/OpenAI reales detrás de la misma interfaz), validación anti-alucinación |
| `document-processing` | Validación de archivos, antivirus, almacenamiento, extracción de texto, OCR, clasificación documental |
| `meeting-analysis` | Pipeline de análisis de transcripciones: llama a `ai-engine`, persiste hallazgos y evidencia, detecta sectores |
| `web-analysis` | Protección SSRF, fetch seguro, detectores de tecnologías/trackers/páginas |
| `review-engine` | Los 20 controles de revisión automática (sección 16 del encargo) |
| `export` | Generación de PDF (pdf-lib), DOCX (docx), JSON y CSV |
| `audit` | Registro de auditoría (nunca lanza excepciones que interrumpan la operación de negocio) |

`src/server/diagnosis-orchestrator.ts` coordina `meeting-analysis` + `web-analysis` +
`legal-engine` en un único punto de entrada (`runFullAnalysis`), que es el único lugar
desde el que se debe ejecutar el análisis completo de un diagnóstico.

## Decisiones de consolidación de modelo/UI (documentadas explícitamente)

1. **Un modelo `Finding` genérico** en vez de once tablas casi idénticas
   (`ProcessingActivity`, `DataSubjectCategory`, `DataCategory`, `SensitiveDataCategory`,
   `Technology`, `Provider`, `ThirdParty`, `InternationalTransfer`, `Incident`,
   `SecurityMeasure`, `RetentionPractice`). Cada hallazgo conserva el mismo contrato de
   trazabilidad (certeza, evidencia, norma relacionada, requiere validación) sin duplicar
   el esquema once veces. Ver `DATABASE.md`.
2. **Las 14 "vistas de mapas" de la sección 17** se implementan como secciones ancladas
   dentro de una sola pantalla (`/diagnosticos/[id]/mapa`) en vez de 14 páginas casi
   idénticas que solo filtran por tipo de hallazgo. Cada sección es equivalente a la vista
   pedida (organización, tratamientos, titulares, categorías de datos, datos sensibles,
   tecnologías, proveedores, terceros, transferencias, riesgos, normativa, evidencias,
   vacíos).
3. **Autenticación propia** (bcrypt + JWT firmado con `jose` + tabla `Session`) en vez de
   Auth.js/NextAuth. Ver `SECURITY.md` para la justificación.
4. **Sin Redis obligatorio**: el análisis corre en modo síncrono porque, con el volumen de
   trabajo actual (heurística léxica local, no llamadas a un LLM lento), una cola no
   aporta valor y sí complejidad operativa. La interfaz de `ai-engine` ya está separada de
   la implementación, por lo que introducir una cola (BullMQ/Redis) más adelante no
   requiere tocar la lógica de negocio — ver `ROADMAP.md`.

## Estructura de carpetas

```
prisma/                  esquema, migraciones, seed
src/
  app/                   rutas de Next.js (App Router)
    (app)/               pantallas autenticadas (requieren sesión)
    api/                 rutas HTTP reales (descargas, healthcheck)
  components/            componentes de UI (server y client components)
  lib/                   auth, db, env, utilidades
  modules/               lógica de dominio (ver tabla arriba)
  server/                orquestación y Server Actions
tests/                   pruebas unitarias e integración (Vitest)
e2e/                     pruebas end-to-end (Playwright)
scripts/                 utilidades de línea de comandos (reservado)
storage/uploads/         almacenamiento local de desarrollo (nunca servido públicamente)
```
