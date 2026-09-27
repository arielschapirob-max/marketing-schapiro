'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createDiagnosisAction } from '@/server/actions/diagnoses';
import type { ActionState } from '@/server/actions/auth';
import { Button, Field, Input, Select, Alert } from '@/components/ui/primitives';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Creando…' : 'Crear diagnóstico'}
    </Button>
  );
}

export function NewDiagnosisForm({ organizationId }: { organizationId: string }) {
  const [state, formAction] = useFormState<ActionState, FormData>(createDiagnosisAction, {});

  return (
    <form action={formAction} className="space-y-4">
      {state.error && <Alert variant="error">{state.error}</Alert>}
      <input type="hidden" name="organizationId" value={organizationId} />
      <Field label="Título del diagnóstico *">
        <Input name="title" required placeholder="Ej: Diagnóstico anual 2026" />
      </Field>
      <Field label="Régimen normativo a evaluar" hint="El motor jurídico nunca mezcla vigente y futuro salvo que elija 'Transición'.">
        <Select name="regimeMode" defaultValue="VIGENTE">
          <option value="VIGENTE">Vigente (Ley 19.628)</option>
          <option value="FUTURO">Futuro (Ley 21.719)</option>
          <option value="TRANSICION">Transición (ambos regímenes)</option>
        </Select>
      </Field>
      <SubmitButton />
    </form>
  );
}
