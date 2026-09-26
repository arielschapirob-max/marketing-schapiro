'use client';

import { useState, useTransition } from 'react';
import { addOrganizationMemberAction } from '@/server/actions/organizations';
import { Button, Field, Input, Select, Alert } from '@/components/ui/primitives';

export function AddMemberForm({ organizationId }: { organizationId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      action={(formData: FormData) => {
        setError(null);
        const email = String(formData.get('email') ?? '');
        const role = String(formData.get('role') ?? 'READER') as 'ADMIN' | 'LAWYER' | 'REVIEWER' | 'READER';
        startTransition(async () => {
          const result = await addOrganizationMemberAction(organizationId, email, role);
          if (result.error) setError(result.error);
        });
      }}
    >
      {error && <Alert variant="error">{error}</Alert>}
      <Field label="Correo del usuario">
        <Input name="email" type="email" required />
      </Field>
      <Field label="Rol">
        <Select name="role" defaultValue="READER">
          <option value="ADMIN">Administrador</option>
          <option value="LAWYER">Abogado</option>
          <option value="REVIEWER">Revisor</option>
          <option value="READER">Lector</option>
        </Select>
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? 'Agregando…' : 'Agregar miembro'}
      </Button>
    </form>
  );
}
