import { describe, it, expect } from 'vitest';
import { assertSafeUrl, SsrfBlockedError } from '@/modules/web-analysis/ssrf-guard';

describe('protección SSRF', () => {
  it('rechaza esquemas distintos de http/https', async () => {
    await expect(assertSafeUrl('file:///etc/passwd')).rejects.toBeInstanceOf(SsrfBlockedError);
    await expect(assertSafeUrl('ftp://example.com')).rejects.toBeInstanceOf(SsrfBlockedError);
  });

  it('rechaza localhost y loopback', async () => {
    await expect(assertSafeUrl('http://localhost:3000')).rejects.toBeInstanceOf(SsrfBlockedError);
    await expect(assertSafeUrl('http://127.0.0.1')).rejects.toBeInstanceOf(SsrfBlockedError);
  });

  it('rechaza rangos IP privados y de metadatos cloud', async () => {
    await expect(assertSafeUrl('http://10.0.0.5')).rejects.toBeInstanceOf(SsrfBlockedError);
    await expect(assertSafeUrl('http://192.168.1.10')).rejects.toBeInstanceOf(SsrfBlockedError);
    await expect(assertSafeUrl('http://169.254.169.254')).rejects.toBeInstanceOf(SsrfBlockedError);
  });

  it('rechaza URLs mal formadas', async () => {
    await expect(assertSafeUrl('no-es-una-url')).rejects.toBeInstanceOf(SsrfBlockedError);
  });
});
