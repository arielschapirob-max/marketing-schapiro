import { describe, it, expect } from 'vitest';
import { detectFromHtml, extractSameOriginLinks } from '@/modules/web-analysis/detectors';

const SAMPLE_HTML = `
<html>
<head>
  <script src="https://www.googletagmanager.com/gtag/js?id=G-XXXX"></script>
  <script>fbq('init', '12345');</script>
</head>
<body>
  <a href="/politica-de-privacidad">Política de Privacidad</a>
  <a href="/terminos-y-condiciones">Términos y condiciones</a>
  <a href="https://otrodominio.com/x">Externo</a>
  <div id="webpay-button">Pagar con Webpay</div>
  <script>document.cookie = "session=abc";</script>
</body>
</html>
`;

describe('detectores de análisis web', () => {
  it('detecta Google Analytics, Meta Pixel y herramienta de pago', () => {
    const detections = detectFromHtml(SAMPLE_HTML, 'https://ejemplo.cl');
    const types = detections.map((d) => d.type);
    expect(types).toContain('analytics');
    expect(types).toContain('publicidad');
    expect(types).toContain('pagos');
  });

  it('detecta la referencia a política de privacidad y términos', () => {
    const detections = detectFromHtml(SAMPLE_HTML, 'https://ejemplo.cl');
    const types = detections.map((d) => d.type);
    expect(types).toContain('politica_privacidad');
    expect(types).toContain('terminos');
  });

  it('nunca marca un hallazgo web como CONFIRMADO salvo excepción explícita', () => {
    const detections = detectFromHtml(SAMPLE_HTML, 'https://ejemplo.cl');
    expect(detections.every((d) => d.certainty !== 'CONFIRMADO')).toBe(true);
  });

  it('extractSameOriginLinks solo conserva enlaces del mismo dominio', () => {
    const links = extractSameOriginLinks(SAMPLE_HTML, 'https://ejemplo.cl');
    expect(links.some((l) => l.includes('politica-de-privacidad'))).toBe(true);
    expect(links.some((l) => l.includes('otrodominio.com'))).toBe(false);
  });
});
