'use client';

import { useState, useTransition } from 'react';
import { approveQuestionnaireAction } from '@/server/actions/diagnoses';
import { Button, Textarea, Alert, Field } from '@/components/ui/primitives';

export function ApproveForm({ diagnosisId, questionnaireId }: { diagnosisId: string; questionnaireId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      action={(formData: FormData) => {
        setError(null);
        const notes = String(formData.get('notes') ?? '');
        startTransition(async () => {
          const result = await approveQuestionnaireAction(diagnosisId, questionnaireId, notes);
          if (result.error) setError(result.error);
        });
      }}
    >
      {error && <Alert variant="error">{error}</Alert>}
      <Field label="Notas de aprobación (opcional)">
        <Textarea name="notes" rows={3} />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? 'Aprobando…' : 'Aprobar diagnóstico y cuestionario'}
      </Button>
    </form>
  );
}
