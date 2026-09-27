# PymeLegal — Generador Inteligente de Diagnósticos de Protección de Datos

PymeLegal es una aplicación web que ayuda a un abogado a levantar información de una
organización cliente (reunión comercial, documentos, sitio web), analizarla, construir
un mapa jurídico preliminar bajo la Ley N.º 19.628 (vigente) y la Ley N.º 21.719 (régimen
futuro), generar un cuestionario a medida, revisarlo automáticamente y exportar un
diagnóstico preliminar en PDF, DOCX, JSON o CSV.

**Este sistema no emite asesoría jurídica definitiva.** Todo resultado se presenta como
diagnóstico preliminar, hipótesis o hallazgo, con su nivel de certeza, y las materias no
verificables contra fuentes oficiales se marcan explícitamente como **REQUIERE VALIDACIÓN
JURÍDICA**. Ver `LEGAL_ENGINE.md` para el detalle y las limitaciones de verificación.

## Estado del proyecto

Ver `INFORME_FINAL.md` para el informe completo de qué se construyó, qué se probó y qué
queda pendiente. En resumen: el flujo completo (organización → carga → análisis → mapa
jurídico → cuestionario → edición → revisión → aprobación → exportación) está
implementado y probado de punta a punta con una base de datos PostgreSQL real, tanto por
pruebas automatizadas (`npm test`) como por pruebas end-to-end de navegador (`npm run
test:e2e`).

## Stack técnico

- **Next.js 14 (App Router) + TypeScript estricto + React 18**
- **Tailwind CSS** para la interfaz
- **PostgreSQL + Prisma ORM** para persistencia
- Autenticación propia con **bcrypt + JWT firmado (jose) + sesiones persistidas en BD**
  (ver `SECURITY.md` sobre por qué no se usó Auth.js/NextAuth directamente)
- **Zod** para validación de esquemas (formularios y salidas de IA)
- **Vitest** para pruebas unitarias/integración, **Playwright** para e2e
- Exportación con **pdf-lib** (PDF) y **docx** (Word)
- Extracción documental con **mammoth** (DOCX) y **pdf-parse** (PDF)
- Sin dependencia obligatoria de Redis/colas: los "trabajos largos" (análisis) corren en
  modo síncrono, documentado como decisión de arquitectura para el tamaño actual del
  proyecto (ver `ARCHITECTURE.md`)

## Uso local sin terminal (Windows, un solo usuario)

Si quieres correr PymeLegal en tu propio PC sin usar la línea de comandos, sigue
**[`INSTALAR_EN_TU_PC.md`](./INSTALAR_EN_TU_PC.md)**: instala Docker Desktop una vez y
luego usas `Iniciar PymeLegal.bat` / `Detener PymeLegal.bat` con doble clic. La sección
siguiente es para desarrollo con Node.js/PostgreSQL instalados directamente.

## Requisitos previos

- Node.js 20+ y npm
- PostgreSQL 14+ accesible (local o remoto)

## Instalación y ejecución en desarrollo

```bash
npm install
cp .env.example .env
# Edite .env: DATABASE_URL, SHADOW_DATABASE_URL y AUTH_SECRET como mínimo.
# Genere un AUTH_SECRET real con: openssl rand -base64 32

npx prisma migrate dev      # crea el esquema en su base de datos
npm run db:seed             # siembra fuentes jurídicas, reglas, sectores, preguntas y usuarios de desarrollo

npm run dev                 # http://localhost:3000
```

Si no configura `AI_API_KEY`, `OCR_API_KEY`, `STORAGE_ENDPOINT` ni `ANTIVIRUS_ENDPOINT`,
la aplicación arranca igual usando adaptadores **MODO MOCK** documentados en cada módulo
y visibles en `/configuracion` dentro de la aplicación.

### Usuarios de desarrollo (creados por el seed)

| Correo | Contraseña | Rol de plataforma |
|---|---|---|
| `admin@pymelegal.cl` | `PymeLegal#2026` (o `SEED_DEV_PASSWORD`) | Super administrador |
| `ariel@pymelegal.cl` | `PymeLegal#2026` | Usuario abogado estándar |
| `revisor@pymelegal.cl` | `PymeLegal#2026` | Usuario estándar |
| `lector@pymelegal.cl` | `PymeLegal#2026` | Usuario estándar |

Cambie `SEED_DEV_PASSWORD` antes de sembrar si va a exponer el entorno más allá de su
máquina. **Nunca use estas credenciales en producción.**

### Datos de demostración

La prueba final del encargo (sección 24) crea cuatro organizaciones ficticias con datos
simulados — **Centro Médico Ejemplo** (salud), **Colegio Ejemplo** (educación), **Tienda
Ejemplo E-commerce SpA** (comercio electrónico) y **Ejemplo SaaS Cloud SpA** (SaaS) — y
ejecuta el flujo completo sobre cada una. Para (re)generarlas en su base de datos local:

```bash
npx vitest run tests/demo/seed-demo-organizations.test.ts
```

Luego inicie sesión como `ariel@pymelegal.cl` y las verá en **Organizaciones**.

## Comandos principales

```bash
npm run dev            # servidor de desarrollo
npm run build          # build de producción
npm run start          # servidor de producción (requiere build previo)
npm run lint           # ESLint
npm run typecheck      # TypeScript --noEmit
npm test               # pruebas unitarias + integración (Vitest, requiere BD)
npm run test:e2e       # pruebas end-to-end (Playwright, requiere BD y build previo)
npm run db:migrate     # migraciones de Prisma (desarrollo)
npm run db:seed        # siembra fuentes/reglas/sectores/preguntas/usuarios
npm run db:studio      # explorador visual de la base de datos
npm run check-env      # valida variables de entorno y reporta qué está en MODO MOCK
```

## Documentación

| Archivo | Contenido |
|---|---|
| `INSTALAR_EN_TU_PC.md` | Instalación local sin terminal para un solo usuario (Windows + Docker) |
| `ARCHITECTURE.md` | Arquitectura general, módulos, decisiones de diseño |
| `LEGAL_ENGINE.md` | Motor jurídico, reglas, vigencia, fuentes, limitaciones de verificación |
| `QUESTION_ENGINE.md` | Motor de preguntas, condiciones, generación de cuestionario |
| `AI_ENGINE.md` | Capa de IA, proveedor mock, proveedor real, anti-alucinación |
| `WEB_ANALYSIS.md` | Análisis de sitios web, protección SSRF, límites |
| `DOCUMENT_PROCESSING.md` | Carga, validación, antivirus, extracción, OCR |
| `SECURITY.md` | Autenticación, autorización, protecciones OWASP, gestión de secretos |
| `DATABASE.md` | Esquema, decisiones de modelado, migraciones |
| `TESTING.md` | Estrategia de pruebas y cómo ejecutarlas |
| `ROADMAP.md` | Trabajo futuro y limitaciones conocidas |
| `INFORME_FINAL.md` | Informe final de ejecución (qué se construyó, qué se probó, pendientes) |
| `CLAUDE.md` | Guía para asistentes de IA que trabajen en este repositorio |

## Advertencia profesional

PymeLegal es una herramienta de apoyo. Todo hallazgo, cuestionario o exportación debe ser
revisado y validado por un abogado antes de ser usado como base de una decisión o de una
comunicación a un cliente o autoridad. Las materias marcadas **REQUIERE VALIDACIÓN
JURÍDICA** no han sido confirmadas contra el texto oficial vigente de cada norma en este
entorno de desarrollo (ver `LEGAL_ENGINE.md`).
