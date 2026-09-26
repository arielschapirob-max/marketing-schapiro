'use client';

import { useTransition } from 'react';
import { generateQuestionnaireAction } from '@/server/actions/diagnoses';
import { Button } from '@/components/ui/primitives';

export function GenerateQuestionnaireButton({ diagnosisId }: { diagnosisId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button type="button" disabled={pending} onClick={() => startTransition(() => generateQuestionnaireAction(diagnosisId))}>
      {pending ? 'Generando…' : 'Generar cuestionario'}
    </Button>
  );
}
