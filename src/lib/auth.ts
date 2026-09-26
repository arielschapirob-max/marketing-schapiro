import 'server-only';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies, headers } from 'next/headers';
import { randomBytes, createHash } from 'crypto';
import { db } from './db';
import { getEnv } from './env';
import type { OrgRole } from '@prisma/client';

// NOTA DE ARQUITECTURA (ver docs/SECURITY.md):
// En vez de Auth.js completo (cuya v5 para App Router estaba en beta al momento
// de construir este proyecto), se implementa una solución equivalente: sesiones
// firmadas con JWT (jose) + persistencia server-side en la tabla `Session` para
// poder revocar sesiones activas ("control de sesiones"), con contraseñas
// hasheadas mediante bcrypt. Esto cumple los mismos requisitos de seguridad.

const SESSION_COOKIE = 'pymelegal_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 horas

function getSecretKey() {
  return new TextEncoder().encode(getEnv().AUTH_SECRET);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  isSuperAdmin: boolean;
}

export async function createSession(userId: string): Promise<void> {
  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  const hdrs = headers();
  await db.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      ip: hdrs.get('x-forwarded-for') ?? undefined,
      userAgent: hdrs.get('user-agent') ?? undefined,
    },
  });

  const jwt = await new SignJWT({ sub: userId, tok: tokenHash })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(getSecretKey());

  cookies().set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    // La cookie de sesión se marca "secure" según si APP_URL declara https,
    // no según NODE_ENV: en despliegues reales HTTPS se termina casi siempre
    // en un proxy/balanceador delante de Next.js, por lo que basarse en
    // NODE_ENV==='production' rompería el login en ese escenario habitual
    // (y en `next start` local sobre HTTP, usado por las pruebas e2e).
    secure: getEnv().APP_URL.startsWith('https://'),
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = cookies();
  const jwt = cookieStore.get(SESSION_COOKIE)?.value;
  if (jwt) {
    try {
      const { payload } = await jwtVerify(jwt, getSecretKey());
      const tokenHash = payload.tok as string;
      await db.session.updateMany({
        where: { tokenHash },
        data: { revokedAt: new Date() },
      });
    } catch {
      // token inválido: no hay nada que revocar en BD, igual limpiamos la cookie
    }
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const jwt = cookies().get(SESSION_COOKIE)?.value;
  if (!jwt) return null;

  try {
    const { payload } = await jwtVerify(jwt, getSecretKey());
    const tokenHash = payload.tok as string;
    const userId = payload.sub as string;

    const session = await db.session.findUnique({ where: { tokenHash } });
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      return null;
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user || !user.active) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isSuperAdmin: user.isSuperAdmin,
    };
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError('No autenticado.');
  }
  return user;
}

export class AuthError extends Error {}
export class ForbiddenError extends Error {}

const ROLE_RANK: Record<OrgRole, number> = {
  READER: 1,
  REVIEWER: 2,
  LAWYER: 3,
  ADMIN: 4,
};

/**
 * Verifica que el usuario tenga al menos el rol indicado dentro de la
 * organización dada. Los super-admins de plataforma tienen acceso total
 * (uso administrativo interno, no de negocio).
 */
export async function requireOrgRole(
  userId: string,
  organizationId: string,
  minRole: OrgRole,
): Promise<OrgRole> {
  const membership = await db.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
  });

  if (!membership) {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (user?.isSuperAdmin) return 'ADMIN';
    throw new ForbiddenError('El usuario no pertenece a esta organización.');
  }

  if (ROLE_RANK[membership.role] < ROLE_RANK[minRole]) {
    throw new ForbiddenError(`Se requiere rol ${minRole} o superior.`);
  }

  return membership.role;
}

export async function getOrgRole(userId: string, organizationId: string): Promise<OrgRole | null> {
  const membership = await db.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
  });
  return membership?.role ?? null;
}
