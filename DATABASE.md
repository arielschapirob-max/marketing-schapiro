# Base de datos

PostgreSQL + Prisma. Esquema completo en `prisma/schema.prisma`; migraciones en
`prisma/migrations/` (reproducibles, generadas con `prisma migrate dev`).

## Decisión de diseño: `Finding` genérico en vez de 11 tablas

El encargo original lista `ProcessingActivity`, `DataSubjectCategory`, `DataCategory`,
`SensitiveDataCategory`, `Technology`, `Provider`, `ThirdParty`,
`InternationalTransfer`, `Incident`, `SecurityMeasure`, `RetentionPractice` como
entidades separadas. Se modelaron como una única tabla `Finding` con un campo
discriminador `type` (enum `FindingType`), porque:

- Las 11 comparten exactamente el mismo contrato de trazabilidad exigido por la sección 6
  del encargo (certeza, fuente, evidencia, norma relacionada, requiere validación,
  requiere confirmación del cliente).
- Evita mantener 11 migraciones y 11 puntos de código casi idénticos cada vez que se
  agrega un campo de trazabilidad nuevo.
- Es extensible sin migración: un nuevo tipo de hallazgo es un nuevo valor de enum, no una
  tabla nueva.

El costo de esta decisión es que las consultas específicas de un tipo requieren filtrar
por `type` en vez de tener su propia tabla — aceptable dado el volumen esperado (cientos
de hallazgos por diagnóstico, no millones).

`Evidence` es una tabla aparte (no un campo de `Finding`) porque un mismo hallazgo puede
tener más de una evidencia (p. ej. mencionado en la transcripción y confirmado en un
documento adjunto).

## Entidades principales

Ver `prisma/schema.prisma` para el detalle completo. Grupos:

- **Usuarios y sesiones**: `User`, `Session`, `VerificationToken`, `AuditEvent`, `Notification`.
- **Organizaciones**: `Organization`, `OrganizationMember` (rol por organización, no un
  rol global único — el mismo usuario puede ser `ADMIN` en una organización y `READER` en
  otra).
- **Diagnóstico**: `Diagnosis` (con `regimeMode` y `targetDate` para el control de
  vigencia), `File`, `ExtractedDocument`, `MeetingTranscript`, `WebAnalysis`,
  `WebFinding`, `OrganizationProfile` (snapshot JSON del esquema de la sección 6/10 del
  encargo, usado para exportación), `Finding`, `Evidence`.
- **Motor jurídico**: `LegalSource`, `LegalRule`, `LegalRuleVersion`, `LegalEvaluation`,
  `Sector`, `SectorLegalRule`, `DiagnosisSector`.
- **Cuestionario**: `Question`, `QuestionSector`, `QuestionVersion`, `Questionnaire`,
  `QuestionnaireQuestion`, `QuestionnaireAnswer`.
- **Revisión y cierre**: `Review`, `ReviewFinding`, `Approval`, `Export`.
- **Gobernanza**: `AIExecution`, `ValidationTask`.

## Por qué no hay una tabla `Role` separada

El encargo menciona una entidad `Role`. Se modeló como el enum `OrgRole` en
`OrganizationMember` en vez de una tabla independiente, porque los 4 roles
(`ADMIN | LAWYER | REVIEWER | READER`) son fijos y jerárquicos (ver `ROLE_RANK` en
`src/lib/auth.ts`) — no se necesita crear roles nuevos dinámicamente en este alcance. Si
en el futuro se requieren roles personalizados por organización, migrar de enum a tabla es
sencillo porque todo el control de acceso pasa por `requireOrgRole()`.

## Migraciones

```bash
npx prisma migrate dev --name <descripcion>   # desarrollo: crea y aplica una migración
npm run db:deploy                              # producción: aplica migraciones pendientes sin generar nuevas
npm run db:studio                              # explorador visual
```

`SHADOW_DATABASE_URL` es requerida por Prisma para calcular diffs de migración en
desarrollo (una base de datos vacía que Prisma usa internamente, no para datos reales).

## Carga de datos iniciales

`npm run db:seed` (ver `prisma/seed.ts`) siembra, de forma idempotente (`upsert` por
clave natural): fuentes jurídicas, reglas jurídicas, catálogo de sectores, banco de
preguntas y usuarios de desarrollo. Es seguro ejecutarlo repetidamente tras editar
`src/modules/legal-engine/*` o `src/modules/question-engine/bank/*`.

## Soft delete y auditoría

- `File.deletedAt` implementa soft delete para documentos (el binario sí se borra del
  almacenamiento; el registro permanece para trazabilidad).
- `Organization.status` (`ACTIVE | ARCHIVED`) en vez de borrado físico.
- Toda mutación relevante genera un `AuditEvent` (ver `SECURITY.md`).

## Índices

Se agregaron índices en las columnas usadas para filtrar por organización/diagnóstico en
consultas frecuentes (`Finding.diagnosisId+type`, `AuditEvent.organizationId`,
`LegalRule.regime+status`, etc.) — ver `@@index` en `schema.prisma`.
