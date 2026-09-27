# Guía para asistentes de IA que trabajen en este repositorio

Este archivo orienta a Claude (u otro asistente) sobre cómo trabajar en PymeLegal sin
romper sus invariantes de diseño, seguridad y honestidad jurídica.

## Qué es este proyecto

Next.js 14 (App Router) + TypeScript estricto + PostgreSQL/Prisma. Genera diagnósticos
**preliminares** de protección de datos personales para Chile. Nunca debe presentarse
como asesoría jurídica definitiva.

## Comandos que debes ejecutar tras cambios de código

```bash
npm run typecheck
npm run lint
npm test              # requiere PostgreSQL corriendo y DATABASE_URL válido
npm run build
```

Si tocas `prisma/schema.prisma`, corre `npx prisma migrate dev --name <descripcion>` y
luego `npm run db:seed` antes de correr las pruebas (varias pruebas dependen de las
reglas/preguntas sembradas).

## Invariantes que no debes romper

1. **Nunca conviertas una inferencia en un hecho confirmado.** El nivel de certeza
   (`CONFIRMADO | PROBABLE | NO_DETERMINADO | INFERIDO | CONTRADICTORIO`) es central en
   todo el sistema (`Finding`, `WebFinding`, salidas de IA). `CONFIRMADO` solo es válido
   si hay evidencia textual verificable — ver `ai-engine/schemas.ts:validateNoHallucination`
   y `review-engine/checks.ts:CHECK14`.
2. **No inventes normas, artículos ni fuentes.** El catálogo cerrado de normas está en
   `src/modules/ai-engine/schemas.ts` (`KNOWN_NORMS`). Cualquier regla jurídica nueva debe
   ir en `src/modules/legal-engine/rules/*.ts`, con `sourceCode` apuntando a una fuente en
   `sources.ts`, y `validationStatus: 'REQUIERE_VALIDACION_JURIDICA'` salvo que el equipo
   legal confirme el texto oficial vigente.
3. **Nunca mezcles régimen vigente (Ley 19.628) y futuro (Ley 21.719) automáticamente.**
   Eso lo controla `src/modules/legal-engine/vigencia.ts`. Solo el modo `TRANSICION`,
   elegido explícitamente por el usuario, evalúa ambos.
4. **No expongas documentos privados con URLs públicas.** Todo archivo se sirve a través
   de `src/app/api/files/[id]/route.ts` o `src/app/api/exports/[id]/route.ts`, que
   verifican sesión y pertenencia a la organización.
5. **El análisis web debe pasar por `assertSafeUrl`** (`src/modules/web-analysis/ssrf-guard.ts`)
   en cada salto de redirección. No añadas un fetch directo a una URL de usuario sin esa
   validación.
6. **No agregues una pregunta al banco sin `justification`, `legalMatter` y, si cita una
   norma, `source`** (código de una `LegalRule`). El motor de revisión (`CHECK12`,
   `CHECK13`) lo verifica automáticamente.
7. **Toda mutación de datos relevante debe registrar auditoría** vía
   `src/modules/audit/index.ts:logAuditEvent`.
8. **`import 'server-only'`** se usa a propósito en `src/modules/*` y `src/server/*` para
   impedir que ese código llegue al bundle de cliente. Si necesitas testear ese código con
   Vitest, ya está aliasado a un stub neutro en `vitest.config.ts` — no elimines el import
   real de los módulos de producción para "hacerlo testeable".

## Dónde está cada cosa

- `src/modules/legal-engine/` — reglas jurídicas, sectores, vigencia, evaluador de condiciones.
- `src/modules/question-engine/` — banco de preguntas y generación de cuestionario.
- `src/modules/ai-engine/` — abstracción de proveedor de IA (mock por defecto).
- `src/modules/document-processing/` — carga, validación, antivirus, extracción, OCR.
- `src/modules/meeting-analysis/` — pipeline de análisis de transcripciones.
- `src/modules/web-analysis/` — análisis de sitios web con protección SSRF.
- `src/modules/review-engine/` — los 20 controles de revisión automática (sección 16 del encargo original).
- `src/modules/export/` — generación de PDF/DOCX/JSON/CSV.
- `src/server/actions/` — Server Actions de Next.js que exponen los módulos a la UI, con
  control de acceso (`requireOrgRole`) y auditoría.
- `src/app/(app)/` — pantallas autenticadas.
- `prisma/seed.ts` — siembra fuentes/reglas/sectores/preguntas/usuarios de desarrollo.
- `tests/demo/seed-demo-organizations.test.ts` — la "prueba final obligatoria" (sección 24
  del encargo): crea Centro Médico Ejemplo y 3 organizaciones más, y verifica cada punto.

## Estilo de commits y PRs

Sin emojis salvo pedido explícito. Mensajes de commit en español, describiendo el motivo
del cambio, no solo el qué. No incluyas identificadores de modelo en commits/PRs.
