'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { loginAction, type ActionState } from '@/server/actions/auth';
import { Button, Field, Input, Alert } from '@/components/ui/primitives';

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Ingresando…' : label}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useFormState<ActionState, FormData>(loginAction, {});

  return (
    <form action={formAction} className="space-y-4">
      {state.error && <Alert variant="error">{state.error}</Alert>}
      <Field label="Correo electrónico">
        <Input type="email" name="email" required autoComplete="email" placeholder="usted@empresa.cl" />
      </Field>
      <Field label="Contraseña">
        <Input type="password" name="password" required autoComplete="current-password" />
      </Field>
      <SubmitButton label="Iniciar sesión" />
    </form>
  );
}
