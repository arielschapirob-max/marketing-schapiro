'use client';

import { useTransition } from 'react';
import { runReviewAction } from '@/server/actions/diagnoses';
import { Button } from '@/components/ui/primitives';

export function RunReviewButton({ diagnosisId, questionnaireId }: { diagnosisId: string; questionnaireId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button type="button" disabled={pending} onClick={() => startTransition(() => runReviewAction(diagnosisId, questionnaireId))}>
      {pending ? 'Ejecutando revisión…' : 'Ejecutar revisión automática'}
    </Button>
  );
}
