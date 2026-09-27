import dns from 'dns/promises';
import net from 'net';

export class SsrfBlockedError extends Error {}

const BLOCKED_HOSTNAMES = new Set(['localhost', '0.0.0.0', '::1']);

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return false;
  const [a, b] = parts as [number, number, number, number];
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true; // link-local / cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  return lower === '::1' || lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe80');
}

/**
 * Protección SSRF: valida esquema, bloquea hostnames obviamente locales, y
 * resuelve DNS para bloquear IPs privadas/loopback/link-local (incluyendo el
 * rango 169.254.169.254 usado por metadatos de proveedores cloud). Se debe
 * volver a invocar en cada salto de redirección.
 */
export async function assertSafeUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new SsrfBlockedError('URL inválida.');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new SsrfBlockedError('Solo se permiten URLs http/https.');
  }

  const hostname = url.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    throw new SsrfBlockedError('No se permite analizar hosts locales.');
  }

  if (net.isIP(hostname)) {
    if (net.isIP(hostname) === 4 && isPrivateIPv4(hostname)) {
      throw new SsrfBlockedError('No se permite analizar direcciones IP privadas.');
    }
    if (net.isIP(hostname) === 6 && isPrivateIPv6(hostname)) {
      throw new SsrfBlockedError('No se permite analizar direcciones IP privadas.');
    }
    return url;
  }

  const records = await dns.lookup(hostname, { all: true });
  for (const record of records) {
    if (record.family === 4 && isPrivateIPv4(record.address)) {
      throw new SsrfBlockedError(`El dominio resuelve a una dirección IP privada (${record.address}).`);
    }
    if (record.family === 6 && isPrivateIPv6(record.address)) {
      throw new SsrfBlockedError(`El dominio resuelve a una dirección IP privada (${record.address}).`);
    }
  }

  return url;
}
