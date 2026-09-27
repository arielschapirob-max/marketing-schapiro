# Análisis de sitios web

## Limitación de verificación en este entorno

El pipeline (`src/modules/web-analysis/`) está completo e implementado de punta a punta,
pero **no pudo ejercitarse contra un sitio real en este entorno de desarrollo**: el proxy
de egreso de red del contenedor solo permite un conjunto acotado de dominios (registros de
paquetes, GitHub, etc.) y bloquea dominios arbitrarios de clientes. Se verificó mediante
pruebas unitarias contra HTML de muestra (`tests/web-analysis/detectors.test.ts`) y contra
la protección SSRF con URLs reales (`tests/web-analysis/ssrf-guard.test.ts`), pero **no**
se ejecutó una descarga HTTP real de un sitio público desde este entorno.
**PENDIENTE DE VALIDACIÓN EN VIVO** en un entorno con salida de red sin restringir.

## Protección SSRF (`ssrf-guard.ts`)

- Solo se permiten esquemas `http`/`https`.
- Se bloquean `localhost`, `127.0.0.1`, `::1` y cualquier hostname que resuelva (vía DNS)
  a un rango privado: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`,
  CGNAT (`100.64.0.0/10`) y el rango de metadatos de nube `169.254.0.0/16` (incluye
  `169.254.169.254`, usado por AWS/GCP/Azure para credenciales de instancia).
- La validación se repite en **cada salto de redirección** (`fetcher.ts`), con un máximo
  de 3 redirecciones.
- Nunca se sigue una redirección sin volver a resolver DNS y validar el destino.

## Límites de ejecución

Configurables vía `.env`: `WEB_ANALYSIS_MAX_PAGES` (por defecto 5), `WEB_ANALYSIS_TIMEOUT_MS`
(8000 ms por petición) y `WEB_ANALYSIS_MAX_BYTES` (2 MB por página, verificado tanto por
`Content-Length` como por conteo incremental de bytes recibidos, para no confiar
ciegamente en la cabecera).

## Qué hace y qué no hace

- Método `GET` únicamente. **Nunca** envía formularios, ni ejecuta JavaScript de la
  página, ni se autentica.
- Respeta `robots.txt` (implementación simplificada: reglas `Disallow` bajo
  `User-agent: *`).
- Prioriza rastrear enlaces internos con pistas de interés (`privacidad`, `cookies`,
  `terminos`, `contacto`) antes que enlaces genéricos.

## Detectores (`detectors.ts`)

Identifica, por coincidencia de patrones sobre el HTML crudo (sin un headless browser,
por eso no detecta contenido inyectado dinámicamente por JavaScript del lado del
cliente — **limitación conocida**, ver `ROADMAP.md`):

- Analítica (Google Analytics/Tag Manager), publicidad (Meta Pixel), chat en línea, CRM,
  pasarelas de pago, email marketing, CDN, herramientas de reserva, banners de cookies.
- Páginas de interés: política de privacidad, política de cookies, términos y
  condiciones, contacto, login, comercio electrónico, newsletter.
- Uso de `document.cookie` del lado del cliente (señal `NO_DETERMINADO`, nunca
  `CONFIRMADO`, porque un grep del HTML no equivale a inspeccionar las cookies reales
  que el navegador termina fijando).

Cada hallazgo (`WebFinding`) incluye: URL, tipo, descripción, tecnología, evidencia
(fragmento de coincidencia), certeza (`CONFIRMADO | PROBABLE | NO_DETERMINADO` — nunca se
usa `CONFIRMADO` para una inferencia técnica sobre proveedor/tratamiento/riesgo, que
siempre van marcados como posibles), y las banderas `possibleProvider`,
`possibleProcessing`, `possibleTransfer`, `possibleRisk`.

## Cruce con el resto del diagnóstico

El motor de revisión (`CHECK19`) compara los indicios de transferencia internacional
detectados en el análisis web (p. ej. Google Analytics, que envía datos a EE. UU.) contra
los hallazgos estructurados de transferencia internacional (`Finding` tipo
`INTERNATIONAL_TRANSFER`): si el análisis web encontró indicios que no están reflejados
como hallazgo estructurado, bloquea la aprobación hasta que se revise.
