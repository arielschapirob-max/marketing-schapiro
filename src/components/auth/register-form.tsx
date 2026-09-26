'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { registerAction, type ActionState } from '@/server/actions/auth';
import { Button, Field, Input, Alert } from '@/components/ui/primitives';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Creando cuenta…' : 'Crear cuenta'}
    </Button>
  );
}

export function RegisterForm() {
  const [state, formAction] = useFormState<ActionState, FormData>(registerAction, {});

  return (
    <form action={formAction} className="space-y-4">
      {state.error && <Alert variant="error">{state.error}</Alert>}
      <Field label="Nombre completo">
        <Input type="text" name="name" required autoComplete="name" />
      </Field>
      <Field label="Correo electrónico">
        <Input type="email" name="email" required autoComplete="email" />
      </Field>
      <Field label="Contraseña" hint="Mínimo 8 caracteres.">
        <Input type="password" name="password" required minLength={8} autoComplete="new-password" />
      </Field>
      <SubmitButton />
    </form>
  );
}
