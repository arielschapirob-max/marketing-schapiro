import { assertSafeUrl } from './ssrf-guard';
import { getEnv } from '@/lib/env';

export interface SafeFetchResult {
  url: string;
  status: number;
  html: string;
  headers: Record<string, string>;
}

const MAX_REDIRECTS = 3;

/**
 * fetch protegido contra SSRF: valida la URL (y cada redirección) contra
 * ssrf-guard, respeta límites de tiempo y tamaño, y nunca sigue más de
 * MAX_REDIRECTS saltos. No ejecuta JavaScript, no envía formularios y no se
 * autentica: solo realiza una petición GET de solo lectura.
 */
export async function safeFetchHtml(rawUrl: string): Promise<SafeFetchResult> {
  const env = getEnv();
  let currentUrl = rawUrl;

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
    const validated = await assertSafeUrl(currentUrl);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.WEB_ANALYSIS_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(validated.toString(), {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'user-agent': 'PymeLegalBot/1.0 (+diagnostico de proteccion de datos; solo lectura)',
        },
      });
    } finally {
      clearTimeout(timeout);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) throw new Error('Redirección sin cabecera Location.');
      currentUrl = new URL(location, validated).toString();
      continue;
    }

    const contentLength = Number(response.headers.get('content-length') ?? '0');
    if (contentLength > env.WEB_ANALYSIS_MAX_BYTES) {
      throw new Error('La respuesta supera el límite de tamaño permitido para el análisis web.');
    }

    const reader = response.body?.getReader();
    let received = 0;
    const chunks: Uint8Array[] = [];
    if (reader) {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.byteLength;
        if (received > env.WEB_ANALYSIS_MAX_BYTES) {
          await reader.cancel();
          throw new Error('La respuesta superó el límite de tamaño permitido durante la descarga.');
        }
        chunks.push(value);
      }
    }
    const html = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString('utf-8');

    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return { url: validated.toString(), status: response.status, html, headers };
  }

  throw new Error('Demasiadas redirecciones al intentar acceder a la URL.');
}
