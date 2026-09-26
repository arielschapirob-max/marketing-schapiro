'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createOrganizationAction } from '@/server/actions/organizations';
import type { ActionState } from '@/server/actions/auth';
import { Button, Field, Input, Textarea, Select, Alert } from '@/components/ui/primitives';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Guardando…' : 'Crear organización'}
    </Button>
  );
}

export function OrganizationForm() {
  const [state, formAction] = useFormState<ActionState, FormData>(createOrganizationAction, {});

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      {state.error && (
        <div className="sm:col-span-2">
          <Alert variant="error">{state.error}</Alert>
        </div>
      )}
      <Field label="Razón social *">
        <Input name="legalName" required />
      </Field>
      <Field label="Nombre comercial">
        <Input name="commercialName" />
      </Field>
      <Field label="RUT / identificador">
        <Input name="identifier" placeholder="76.123.456-7" />
      </Field>
      <Field label="País">
        <Input name="country" defaultValue="Chile" />
      </Field>
      <Field label="Región">
        <Input name="region" />
      </Field>
      <Field label="Comuna">
        <Input name="comuna" />
      </Field>
      <Field label="Dirección">
        <Input name="address" />
      </Field>
      <Field label="Sitio web">
        <Input name="website" placeholder="https://" />
      </Field>
      <Field label="Correo de contacto">
        <Input name="email" type="email" />
      </Field>
      <Field label="Teléfono">
        <Input name="phone" />
      </Field>
      <Field label="Representante">
        <Input name="representative" />
      </Field>
      <Field label="Tamaño aproximado">
        <Select name="approximateSize" defaultValue="">
          <option value="">Seleccione…</option>
          <option value="micro">Microempresa</option>
          <option value="pequena">Pequeña empresa</option>
          <option value="mediana">Mediana empresa</option>
          <option value="grande">Gran empresa</option>
        </Select>
      </Field>
      <Field label="N.º de trabajadores">
        <Input name="employeeCount" type="number" min={0} />
      </Field>
      <Field label="Titulares estimados">
        <Input name="estimatedDataSubjects" type="number" min={0} />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Actividad económica" hint="Separe por comas si tiene varias líneas de negocio.">
          <Input name="economicActivity" placeholder="Ej: venta de productos médicos, telemedicina" />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="Notas internas">
          <Textarea name="internalNotes" rows={3} />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <SubmitButton />
      </div>
    </form>
  );
}
