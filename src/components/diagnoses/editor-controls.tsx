'use client';

import { useState, useTransition } from 'react';
import { toggleQuestionActiveAction, addCustomQuestionAction } from '@/server/actions/questionnaire';
import { Button, Field, Input, Textarea } from '@/components/ui/primitives';

export function ToggleQuestionButton({ questionnaireQuestionId, isActive }: { questionnaireQuestionId: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition();
  const [reason, setReason] = useState('');
  const [showReason, setShowReason] = useState(false);

  if (isActive && !showReason) {
    return (
      <Button type="button" variant="danger" className="px-3 py-1 text-xs" onClick={() => setShowReason(true)}>
        Descartar
      </Button>
    );
  }

  if (isActive && showReason) {
    return (
      <div className="flex items-center gap-2">
        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo del descarte" className="w-48 text-xs" />
        <Button
          type="button"
          variant="danger"
          className="px-3 py-1 text-xs"
          disabled={pending}
          onClick={() => startTransition(() => toggleQuestionActiveAction(questionnaireQuestionId, false, reason || 'Sin motivo especificado'))}
        >
          Confirmar
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="secondary"
      className="px-3 py-1 text-xs"
      disabled={pending}
      onClick={() => startTransition(() => toggleQuestionActiveAction(questionnaireQuestionId, true))}
    >
      Reactivar
    </Button>
  );
}

export function AddCustomQuestionForm({ questionnaireId }: { questionnaireId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      action={(formData: FormData) => {
        const category = String(formData.get('category') ?? 'Otro');
        const text = String(formData.get('text') ?? '');
        const justification = String(formData.get('justification') ?? '');
        const legalMatter = String(formData.get('legalMatter') ?? category);
        if (!text || !justification) return;
        startTransition(() => addCustomQuestionAction(questionnaireId, { category, text, justification, legalMatter }));
      }}
    >
      <Field label="Categoría">
        <Input name="category" defaultValue="Personalizada" required />
      </Field>
      <Field label="Materia jurídica">
        <Input name="legalMatter" placeholder="Ej: Encargo de tratamiento" />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Texto de la pregunta *">
          <Textarea name="text" rows={2} required />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="Justificación * (por qué se incluye esta pregunta)">
          <Textarea name="justification" rows={2} required />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Agregando…' : 'Agregar pregunta'}
        </Button>
      </div>
    </form>
  );
}
