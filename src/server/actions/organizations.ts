'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireUser, requireOrgRole, AuthError } from '@/lib/auth';
import { logAuditEvent } from '@/modules/audit';
import type { ActionState } from './auth';

const orgSchema = z.object({
  legalName: z.string().min(2, 'Ingrese la razón social'),
  commercialName: z.string().optional(),
  identifier: z.string().optional(),
  country: z.string().default('Chile'),
  region: z.string().optional(),
  comuna: z.string().optional(),
  address: z.string().optional(),
  website: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  representative: z.string().optional(),
  economicActivity: z.string().optional(),
  approximateSize: z.string().optional(),
  employeeCount: z.coerce.number().int().nonnegative().optional(),
  estimatedDataSubjects: z.coerce.number().int().nonnegative().optional(),
  internalNotes: z.string().optional(),
});

function str(v: FormDataEntryValue | null): string | undefined {
  const s = (v as string | null)?.trim();
  return s ? s : undefined;
}

export async function createOrganizationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let user;
  try {
    user = await requireUser();
  } catch {
    redirect('/login');
  }

  const parsed = orgSchema.safeParse({
    legalName: formData.get('legalName'),
    commercialName: str(formData.get('commercialName')),
    identifier: str(formData.get('identifier')),
    country: str(formData.get('country')) ?? 'Chile',
    region: str(formData.get('region')),
    comuna: str(formData.get('comuna')),
    address: str(formData.get('address')),
    website: str(formData.get('website')),
    email: str(formData.get('email')),
    phone: str(formData.get('phone')),
    representative: str(formData.get('representative')),
    approximateSize: str(formData.get('approximateSize')),
    employeeCount: str(formData.get('employeeCount')),
    estimatedDataSubjects: str(formData.get('estimatedDataSubjects')),
    internalNotes: str(formData.get('internalNotes')),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const economicActivityRaw = str(formData.get('economicActivity'));
  const economicActivity = economicActivityRaw ? economicActivityRaw.split(',').map((s) => s.trim()).filter(Boolean) : [];

  const org = await db.organization.create({
    data: {
      ...parsed.data,
      economicActivity,
      members: { create: { userId: user!.id, role: 'ADMIN' } },
    },
  });

  await logAuditEvent({ userId: user!.id, organizationId: org.id, action: 'ORGANIZATION_CREATED', entityType: 'Organization', entityId: org.id });
  revalidatePath('/organizaciones');
  redirect(`/organizaciones/${org.id}`);
}

export async function archiveOrganizationAction(organizationId: string): Promise<void> {
  const user = await requireUser();
  await requireOrgRole(user.id, organizationId, 'ADMIN');

  await db.organization.update({ where: { id: organizationId }, data: { status: 'ARCHIVED' } });
  await logAuditEvent({ userId: user.id, organizationId, action: 'ORGANIZATION_ARCHIVED', entityType: 'Organization', entityId: organizationId });
  revalidatePath('/organizaciones');
}

export async function addOrganizationMemberAction(organizationId: string, email: string, role: 'ADMIN' | 'LAWYER' | 'REVIEWER' | 'READER'): Promise<{ error?: string }> {
  const user = await requireUser();
  await requireOrgRole(user.id, organizationId, 'ADMIN');

  const target = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!target) return { error: 'No existe un usuario registrado con ese correo.' };

  await db.organizationMember.upsert({
    where: { organizationId_userId: { organizationId, userId: target.id } },
    update: { role },
    create: { organizationId, userId: target.id, role },
  });

  await logAuditEvent({ userId: user.id, organizationId, action: 'MEMBER_ADDED', entityType: 'OrganizationMember', metadata: { targetUserId: target.id, role } });
  revalidatePath(`/organizaciones/${organizationId}/configuracion`);
  return {};
}

export { AuthError };
