'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { hashPassword, verifyPassword, createSession, destroySession } from '@/lib/auth';
import { logAuditEvent } from '@/modules/audit';

const loginSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(1, 'Ingrese su contraseña'),
});

export interface ActionState {
  error?: string;
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user || !user.active) {
    await logAuditEvent({ action: 'LOGIN_FAILED', entityType: 'User', metadata: { email: parsed.data.email } });
    return { error: 'Credenciales inválidas.' };
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    await logAuditEvent({ userId: user.id, action: 'LOGIN_FAILED', entityType: 'User', entityId: user.id });
    return { error: 'Credenciales inválidas.' };
  }

  await createSession(user.id);
  await logAuditEvent({ userId: user.id, action: 'LOGIN_SUCCESS', entityType: 'User', entityId: user.id });
  redirect('/dashboard');
}

const registerSchema = z.object({
  name: z.string().min(2, 'Ingrese su nombre completo'),
  email: z.string().email('Correo inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const existing = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (existing) {
    return { error: 'Ya existe una cuenta con ese correo.' };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await db.user.create({
    data: { name: parsed.data.name, email: parsed.data.email.toLowerCase(), passwordHash },
  });

  await createSession(user.id);
  await logAuditEvent({ userId: user.id, action: 'USER_REGISTERED', entityType: 'User', entityId: user.id });
  redirect('/dashboard');
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect('/login');
}
