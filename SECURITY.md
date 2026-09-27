# Seguridad

## Autenticación

Implementación propia en `src/lib/auth.ts` en vez de Auth.js/NextAuth:

- Contraseñas con **bcrypt** (costo 12).
- Sesión: JWT firmado con **HS256** (`jose`), con el hash del token también persistido en
  la tabla `Session` — esto permite **revocar sesiones activas** (control de sesiones
  exigido por el encargo), algo que un JWT autocontenido puro no permite sin una lista de
  revocación. `destroySession()` marca la sesión como revocada en BD además de borrar la
  cookie.
- Cookie de sesión: `httpOnly`, `sameSite: lax`, y `secure` **según si `APP_URL` declara
  `https://`** (no según `NODE_ENV`). Esto es deliberado: en un despliegue real, HTTPS casi
  siempre se termina en un proxy/balanceador delante de Next.js, por lo que basar `secure`
  en `NODE_ENV==='production'` rompería el login apenas se sirviera sobre HTTP puro hacia
  el proceso de Next (como ocurre, por ejemplo, corriendo `next start` directamente o en
  las pruebas e2e locales). Se descubrió este problema durante las pruebas de Playwright
  de este mismo proyecto y se corrigió antes de considerar el trabajo terminado.
- `AUTH_SECRET` obligatorio y validado al iniciar (`src/lib/env.ts`).

## Autorización

- Roles por organización (`OrganizationMember.role`: `ADMIN | LAWYER | REVIEWER |
  READER`), verificados con `requireOrgRole()` en cada Server Action que muta datos.
- Un usuario sin membresía en la organización recibe `ForbiddenError` (403), salvo
  `User.isSuperAdmin` (uso administrativo interno de la plataforma).
- Cada página autenticada verifica la sesión **dos veces**: en el layout compartido
  (`src/app/(app)/layout.tsx`) y de nuevo dentro de la propia página antes de usar
  `user.id`. Esto no es redundancia superficial: en el App Router de Next.js los
  Server Components anidados pueden empezar a ejecutar sus propias promesas de datos en
  paralelo con el layout padre, así que un layout que redirige no garantiza por sí solo
  que la página hija nunca llegue a ejecutarse con `user === null`. Se detectó este caso
  real durante las pruebas e2e (una excepción no capturada en el log del servidor al
  visitar una ruta protegida sin sesión) y se corrigió agregando el guard local en las 12
  páginas afectadas.

## OWASP Top 10 (cómo se cubre cada punto relevante)

| Riesgo | Mitigación |
|---|---|
| Inyección SQL | Prisma con consultas parametrizadas; sin SQL crudo salvo `SELECT 1` de healthcheck |
| XSS | React escapa por defecto; sin uso de `dangerouslySetInnerHTML` en el código propio |
| CSRF | Las Server Actions de Next.js incluyen su propia protección de origen; cookies `sameSite: lax` |
| Control de acceso roto | `requireOrgRole` + verificación de organización en cada acción y página (ver arriba) |
| SSRF | `src/modules/web-analysis/ssrf-guard.ts` — ver `WEB_ANALYSIS.md` |
| Subida de archivos maliciosa | Validación de extensión + MIME + firma binaria + antivirus (mock) + almacenamiento privado, ver `DOCUMENT_PROCESSING.md` |
| Exposición de datos sensibles | Documentos y exportaciones nunca tienen URL pública; auditoría redacta claves sensibles (`password`, `token`, `secret`, `apiKey`) antes de persistir metadata |
| Registro y monitoreo insuficiente | `AuditEvent` en cada mutación relevante; `AIExecution` para cada llamada de IA |
| Componentes con vulnerabilidades conocidas | `npm audit` recomendado en CI (**PENDIENTE DE IMPLEMENTACIÓN** como paso automatizado) |

## Rate limiting

**PENDIENTE DE IMPLEMENTACIÓN.** No hay limitación de tasa en las Server Actions ni en las
rutas de descarga. Para producción se recomienda un middleware de rate limiting (p. ej.
`@upstash/ratelimit` si se adopta Redis, o un límite a nivel de proxy/CDN) antes de
exponer el sistema a Internet.

## Gestión de secretos

- Ninguna clave real en el repositorio. `.env` está en `.gitignore`; `.env.example`
  documenta cada variable sin valores reales.
- `src/lib/env.ts` valida el entorno con Zod al arrancar y falla rápido con un mensaje
  claro si falta algo obligatorio (`DATABASE_URL`, `AUTH_SECRET`).
- Sin credenciales de IA/OCR/almacenamiento/antivirus configuradas, el sistema usa
  adaptadores mock explícitos (nunca finge silenciosamente que una integración real está
  activa) — ver el panel `/configuracion` dentro de la aplicación.

## Cifrado de campos sensibles

**PENDIENTE DE IMPLEMENTACIÓN.** El esquema actual no cifra campos específicos a nivel de
aplicación (más allá del hash de contraseñas). Para datos particularmente sensibles en un
despliegue real (p. ej. contenido de `ExtractedDocument.text` cuando incluye datos de
salud), se recomienda evaluar cifrado en reposo a nivel de columna o de disco de la base
de datos, según el volumen y la clasificación de riesgo de cada despliegue.

## Backups y migraciones

**PENDIENTE DE DOCUMENTAR EN DESPLIEGUE REAL** (depende del proveedor de PostgreSQL
elegido). Las migraciones de Prisma (`prisma/migrations/`) son reproducibles y versionadas
en el repositorio; en producción deben aplicarse con `npm run db:deploy`
(`prisma migrate deploy`), nunca con `migrate dev`.

## Respuesta a incidentes (lineamiento mínimo)

1. Revocar sesiones afectadas (`Session.revokedAt`) y forzar cambio de contraseña.
2. Revisar `AuditEvent` filtrando por el usuario/organización involucrados.
3. Si el incidente involucra datos personales de clientes de PymeLegal (no solo del
   propio sistema), evaluar las obligaciones de notificación aplicables — remitirse al
   propio motor jurídico de este sistema, sección `Ley N.º 21.719 — notificación de
   brechas` (`L21719-008`, marcada REQUIERE VALIDACIÓN JURÍDICA).
