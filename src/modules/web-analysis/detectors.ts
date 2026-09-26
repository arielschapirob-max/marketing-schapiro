export interface WebDetection {
  type: string;
  description: string;
  technology?: string;
  evidence: string;
  certainty: 'CONFIRMADO' | 'PROBABLE' | 'NO_DETERMINADO';
  possibleProvider?: string;
  possibleProcessing?: string;
  possibleTransfer?: boolean;
  possibleRisk?: string;
}

interface DetectorRule {
  type: string;
  pattern: RegExp;
  describe: (match: string) => string;
  technology?: string;
  possibleProvider?: string;
  possibleProcessing?: string;
  possibleTransfer?: boolean;
  possibleRisk?: string;
  certainty?: WebDetection['certainty'];
}

const RULES: DetectorRule[] = [
  { type: 'analytics', pattern: /googletagmanager\.com|google-analytics\.com|gtag\(/gi, describe: () => 'Google Analytics / Google Tag Manager', technology: 'Google Analytics', possibleProvider: 'Google LLC', possibleProcessing: 'Analítica de audiencia', possibleTransfer: true, possibleRisk: 'Transferencia de datos de navegación a servidores fuera de Chile' },
  { type: 'publicidad', pattern: /connect\.facebook\.net|fbq\(/gi, describe: () => 'Meta Pixel (Facebook Ads)', technology: 'Meta Pixel', possibleProvider: 'Meta Platforms, Inc.', possibleProcessing: 'Publicidad dirigida / remarketing', possibleTransfer: true, possibleRisk: 'Perfilamiento publicitario sin consentimiento explícito' },
  { type: 'chat', pattern: /tawk\.to|intercom\.io|zendesk|crisp\.chat|tidio/gi, describe: (m) => `Herramienta de chat en línea (${m})`, technology: 'Chat en línea', possibleProcessing: 'Atención al cliente vía chat' },
  { type: 'videoconferencia', pattern: /zoom\.us|meet\.google\.com|teams\.microsoft\.com/gi, describe: (m) => `Herramienta de videoconferencia (${m})` },
  { type: 'crm', pattern: /hubspot|salesforce|pipedrive/gi, describe: (m) => `Posible CRM (${m})`, possibleProcessing: 'Gestión de clientes/prospectos' },
  { type: 'pagos', pattern: /webpay|transbank|mercadopago|flow\.cl|khipu/gi, describe: (m) => `Herramienta de pago (${m})`, possibleProcessing: 'Procesamiento de pagos en línea' },
  { type: 'newsletter', pattern: /mailchimp|sendinblue|klaviyo|constant contact/gi, describe: (m) => `Plataforma de email marketing (${m})`, possibleProcessing: 'Envío de comunicaciones/marketing', possibleTransfer: true },
  { type: 'cdn', pattern: /cloudflare|akamai|fastly/gi, describe: (m) => `CDN (${m})` },
  { type: 'reservas', pattern: /calendly|bookingbutton|reservo/gi, describe: (m) => `Herramienta de reservas/agendamiento (${m})` },
  { type: 'cookies_banner', pattern: /cookiebot|onetrust|cookie-consent|cookieconsent/gi, describe: () => 'Banner de gestión de consentimiento de cookies' },
];

export function detectFromHtml(html: string, pageUrl: string): WebDetection[] {
  const detections: WebDetection[] = [];
  const seen = new Set<string>();

  for (const rule of RULES) {
    const match = html.match(rule.pattern);
    if (match) {
      const description = rule.describe(match[0]);
      const key = `${rule.type}:${description}`;
      if (seen.has(key)) continue;
      seen.add(key);
      detections.push({
        type: rule.type,
        description,
        technology: rule.technology,
        evidence: `Coincidencia "${match[0]}" encontrada en ${pageUrl}`,
        certainty: rule.certainty ?? 'PROBABLE',
        possibleProvider: rule.possibleProvider,
        possibleProcessing: rule.possibleProcessing,
        possibleTransfer: rule.possibleTransfer,
        possibleRisk: rule.possibleRisk,
      });
    }
  }

  const pageChecks: Array<[RegExp, string, string]> = [
    [/pol[ií]tica de privacidad/i, 'politica_privacidad', 'Referencia a política de privacidad'],
    [/pol[ií]tica de cookies/i, 'politica_cookies', 'Referencia a política de cookies'],
    [/t[eé]rminos y condiciones/i, 'terminos', 'Referencia a términos y condiciones'],
    [/formulario de contacto|cont[aá]ctenos/i, 'contacto', 'Formulario o sección de contacto'],
    [/iniciar sesi[oó]n|login|mi cuenta/i, 'login', 'Área de inicio de sesión / cuenta de usuario'],
    [/carro de compra|agregar al carro|checkout/i, 'comercio_electronico', 'Funcionalidad de comercio electrónico'],
    [/suscr[ií]bete|newsletter/i, 'newsletter', 'Suscripción a newsletter'],
  ];
  for (const [pattern, type, description] of pageChecks) {
    if (pattern.test(html)) {
      detections.push({
        type,
        description,
        evidence: `Coincidencia de patrón "${pattern.source}" en ${pageUrl}`,
        certainty: 'PROBABLE',
      });
    }
  }

  const cookieSetCount = (html.match(/document\.cookie/gi) ?? []).length;
  if (cookieSetCount > 0) {
    detections.push({
      type: 'cookies',
      description: `Uso de cookies del lado del cliente detectado (${cookieSetCount} referencia(s) a document.cookie)`,
      evidence: `${cookieSetCount} ocurrencia(s) de "document.cookie" en el HTML de ${pageUrl}`,
      certainty: 'NO_DETERMINADO',
    });
  }

  return detections;
}

export function extractSameOriginLinks(html: string, baseUrl: string, maxLinks = 20): string[] {
  const links = new Set<string>();
  const regex = /<a[^>]+href=["']([^"'#]+)["']/gi;
  let match: RegExpExecArray | null;
  const base = new URL(baseUrl);

  // eslint-disable-next-line no-cond-assign
  while ((match = regex.exec(html)) !== null && links.size < maxLinks) {
    try {
      const resolved = new URL(match[1]!, base);
      if (resolved.hostname === base.hostname && resolved.protocol.startsWith('http')) {
        links.add(resolved.toString());
      }
    } catch {
      // enlace inválido, se ignora
    }
  }
  return [...links];
}

const INTERESTING_PATH_HINTS = ['privacidad', 'privacy', 'cookies', 'terminos', 'terms', 'contacto', 'contact'];

export function prioritizeLinks(links: string[]): string[] {
  return [...links].sort((a, b) => {
    const scoreOf = (u: string) => (INTERESTING_PATH_HINTS.some((h) => u.toLowerCase().includes(h)) ? 0 : 1);
    return scoreOf(a) - scoreOf(b);
  });
}
