'use client';

import { useState, useTransition } from 'react';
import { generatePersonalizedQuestionnaireAction } from '@/server/actions/personalized-questionnaire';
import { Button, Alert } from '@/components/ui/primitives';

export function GeneratePersonalizedQuestionnaireButton({ diagnosisId }: { diagnosisId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [exportId, setExportId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="secondary"
        disabled={pending}
        onClick={() => {
          setError(null);
          setExportId(null);
          startTransition(async () => {
            const result = await generatePersonalizedQuestionnaireAction(diagnosisId);
            if (result.error) setError(result.error);
            if (result.exportId) setExportId(result.exportId);
          });
        }}
      >
        {pending ? 'Redactando cuestionario…' : 'Generar cuestionario personalizado para el cliente (IA)'}
      </Button>
      {error && <Alert variant="error">{error}</Alert>}
      {exportId && (
        <Alert variant="success">
          Cuestionario generado.{' '}
          <a className="underline" href={`/api/exports/${exportId}`}>
            Descargar .docx
          </a>
          . Revíselo antes de enviarlo al cliente.
        </Alert>
      )}
    </div>
  );
}
