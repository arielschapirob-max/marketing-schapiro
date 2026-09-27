'use client';

import { useTransition } from 'react';
import { generateExportAction } from '@/server/actions/diagnoses';
import { Button } from '@/components/ui/primitives';
import type { ExportFormat } from '@prisma/client';

export function GenerateExportButtons({ diagnosisId }: { diagnosisId: string }) {
  const [pending, startTransition] = useTransition();
  const formats: ExportFormat[] = ['PDF', 'DOCX', 'JSON', 'CSV'];

  return (
    <div className="flex flex-wrap gap-3">
      {formats.map((format) => (
        <Button
          key={format}
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() => startTransition(() => generateExportAction(diagnosisId, format))}
        >
          Generar {format}
        </Button>
      ))}
    </div>
  );
}
