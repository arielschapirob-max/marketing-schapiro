import 'server-only';
import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';

export interface AuditEventInput {
  userId?: string | null;
  organizationId?: string | null;
  diagnosisId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
  userAgent?: string | null;
}

const SENSITIVE_KEYS = new Set(['password', 'passwordHash', 'token', 'secret', 'apiKey']);

function sanitize(metadata: Record<string, unknown> | null | undefined) {
  if (!metadata) return undefined;
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    clean[key] = SENSITIVE_KEYS.has(key) ? '[REDACTADO]' : value;
  }
  return clean;
}

/** Registra un evento de auditoría. Nunca debe lanzar: un fallo de auditoría no puede tumbar la operación de negocio. */
export async function logAuditEvent(input: AuditEventInput): Promise<void> {
  try {
    await db.auditEvent.create({
      data: {
        userId: input.userId ?? null,
        organizationId: input.organizationId ?? null,
        diagnosisId: input.diagnosisId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        metadata: sanitize(input.metadata) as Prisma.InputJsonValue | undefined,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[audit] no se pudo registrar el evento', err);
  }
}
