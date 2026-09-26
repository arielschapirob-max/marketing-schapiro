import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatorio'),
  AUTH_SECRET: z.string().min(16, 'AUTH_SECRET debe tener al menos 16 caracteres'),
  APP_URL: z.string().url().default('http://localhost:3000'),

  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  STORAGE_ENDPOINT: z.string().optional().default(''),
  STORAGE_REGION: z.string().optional().default('us-east-1'),
  STORAGE_BUCKET: z.string().optional().default('pymelegal-documents'),
  STORAGE_ACCESS_KEY: z.string().optional().default(''),
  STORAGE_SECRET_KEY: z.string().optional().default(''),

  AI_PROVIDER: z.enum(['mock', 'anthropic', 'openai']).default('mock'),
  AI_API_KEY: z.string().optional().default(''),
  AI_MODEL: z.string().optional().default('claude-sonnet-5'),
  AI_TIMEOUT_MS: z.coerce.number().default(30000),
  AI_MAX_RETRIES: z.coerce.number().default(2),

  OCR_PROVIDER: z.enum(['mock', 'tesseract', 'external']).default('mock'),
  OCR_API_KEY: z.string().optional().default(''),

  REDIS_URL: z.string().optional().default(''),
  ANTIVIRUS_ENDPOINT: z.string().optional().default(''),

  EMAIL_PROVIDER: z.enum(['mock', 'smtp', 'external']).default('mock'),
  EMAIL_API_KEY: z.string().optional().default(''),

  SENTRY_DSN: z.string().optional().default(''),

  WEB_ANALYSIS_MAX_PAGES: z.coerce.number().default(5),
  WEB_ANALYSIS_TIMEOUT_MS: z.coerce.number().default(8000),
  WEB_ANALYSIS_MAX_BYTES: z.coerce.number().default(2_000_000),

  LEY_21719_FECHA_PUBLICACION: z.string().default('2024-12-13'),
  LEY_21719_VIGENCIA_GENERAL: z.string().default('2026-12-01'),
});

export type AppEnv = z.infer<typeof envSchema>;

let cached: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `- ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(
      `Variables de entorno inválidas o faltantes:\n${issues}\n\nRevisa .env.example para la lista completa.`,
    );
  }
  cached = parsed.data;
  return cached;
}

export function isMockAI(): boolean {
  return getEnv().AI_PROVIDER === 'mock' || !getEnv().AI_API_KEY;
}

export function isMockOCR(): boolean {
  return getEnv().OCR_PROVIDER === 'mock' || !getEnv().OCR_API_KEY;
}

export function isMockStorage(): boolean {
  return getEnv().STORAGE_DRIVER === 'local' || !getEnv().STORAGE_ENDPOINT;
}

export function isMockAntivirus(): boolean {
  return !getEnv().ANTIVIRUS_ENDPOINT;
}
