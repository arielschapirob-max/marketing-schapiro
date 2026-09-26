'use client';

import { useState, useTransition } from 'react';
import { submitTranscriptAction, createWebAnalysisAction, uploadDiagnosisFileAction, runAnalysisAction } from '@/server/actions/diagnoses';
import { Button, Field, Input, Textarea, Alert } from '@/components/ui/primitives';

export function TranscriptForm({ diagnosisId }: { diagnosisId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="space-y-3"
      action={(formData: FormData) => {
        setError(null);
        const text = String(formData.get('text') ?? '');
        startTransition(async () => {
          try {
            await submitTranscriptAction(diagnosisId, text);
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Error al guardar la transcripción.');
          }
        });
      }}
    >
      {error && <Alert variant="error">{error}</Alert>}
      <Field label="Transcripción de la reunión">
        <Textarea name="text" rows={8} placeholder="Pegue aquí la transcripción de la reunión comercial o de levantamiento…" />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? 'Guardando…' : 'Guardar transcripción'}
      </Button>
    </form>
  );
}

export function WebUrlForm({ diagnosisId }: { diagnosisId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="flex items-end gap-3"
      action={(formData: FormData) => {
        setError(null);
        const url = String(formData.get('url') ?? '');
        startTransition(async () => {
          const result = await createWebAnalysisAction(diagnosisId, url);
          if (result.error) setError(result.error);
        });
      }}
    >
      <div className="flex-1">
        {error && <Alert variant="error">{error}</Alert>}
        <Field label="URL del sitio web de la organización">
          <Input name="url" type="url" placeholder="https://www.ejemplo.cl" required />
        </Field>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? 'Agregando…' : 'Agregar sitio'}
      </Button>
    </form>
  );
}

export function FileUploadForm({ diagnosisId }: { diagnosisId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="space-y-3"
      action={(formData: FormData) => {
        setError(null);
        startTransition(async () => {
          const result = await uploadDiagnosisFileAction(diagnosisId, formData);
          if (result.error) setError(result.error);
        });
      }}
    >
      {error && <Alert variant="error">{error}</Alert>}
      <Field label="Documento (PDF, DOCX, TXT, CSV, XLSX o imagen)">
        <input type="file" name="file" required className="block w-full text-sm text-gray-700" />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? 'Subiendo…' : 'Subir documento'}
      </Button>
    </form>
  );
}

export function RunAnalysisButton({ diagnosisId, disabled }: { diagnosisId: string; disabled?: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      disabled={disabled || pending}
      onClick={() => startTransition(() => runAnalysisAction(diagnosisId))}
      className="w-full"
    >
      {pending ? 'Analizando…' : 'Ejecutar análisis completo'}
    </Button>
  );
}
