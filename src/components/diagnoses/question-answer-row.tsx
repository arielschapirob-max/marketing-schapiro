'use client';

import { useState, useTransition } from 'react';
import { answerQuestionAction } from '@/server/actions/questionnaire';
import { Button, Textarea, Input, Select } from '@/components/ui/primitives';
import { Badge } from '@/components/ui/badge';

interface Props {
  questionnaireQuestionId: string;
  code: string;
  category: string;
  text: string;
  answerType: string;
  options: string[] | null;
  requiresDocument: boolean;
  allowsDontKnow: boolean;
  allowsNotApplicable: boolean;
  norm?: string | null;
  justification?: string | null;
  initialValue?: unknown;
  initialDontKnow?: boolean;
  initialNotApplicable?: boolean;
}

export function QuestionAnswerRow(props: Props) {
  const [value, setValue] = useState<string>(typeof props.initialValue === 'string' ? props.initialValue : props.initialValue ? JSON.stringify(props.initialValue) : '');
  const [dontKnow, setDontKnow] = useState(props.initialDontKnow ?? false);
  const [notApplicable, setNotApplicable] = useState(props.initialNotApplicable ?? false);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const save = () => {
    startTransition(async () => {
      await answerQuestionAction(props.questionnaireQuestionId, dontKnow || notApplicable ? null : value, dontKnow, notApplicable);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  };

  return (
    <div className="rounded-lg border border-gray-100 p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Badge className="border-gray-200 bg-gray-50 text-gray-500">{props.category}</Badge>
        {props.norm && <Badge className="border-brand-100 bg-brand-50 text-brand-700">{props.norm}</Badge>}
        {props.requiresDocument && <Badge className="border-gold-400/40 bg-gold-100 text-gold-600">Requiere documento</Badge>}
      </div>
      <p className="mb-1 text-sm font-medium text-gray-900">{props.text}</p>
      {props.justification && <p className="mb-3 text-xs text-gray-500">{props.justification}</p>}

      {!dontKnow && !notApplicable && (
        <div className="mb-2">
          {props.answerType === 'SINGLE_CHOICE' || props.answerType === 'MULTIPLE_CHOICE' ? (
            <Select value={value} onChange={(e) => setValue(e.target.value)}>
              <option value="">Seleccione…</option>
              {(props.options ?? []).map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Select>
          ) : props.answerType === 'YES_NO' || props.answerType === 'YES_NO_UNKNOWN' ? (
            <Select value={value} onChange={(e) => setValue(e.target.value)}>
              <option value="">Seleccione…</option>
              <option value="Sí">Sí</option>
              <option value="No">No</option>
              {props.answerType === 'YES_NO_UNKNOWN' && <option value="No sabe">No sabe</option>}
            </Select>
          ) : props.answerType === 'NUMBER' ? (
            <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} />
          ) : props.answerType === 'DATE' ? (
            <Input type="date" value={value} onChange={(e) => setValue(e.target.value)} />
          ) : (
            <Textarea rows={3} value={value} onChange={(e) => setValue(e.target.value)} placeholder="Escriba la respuesta…" />
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
        {props.allowsDontKnow && (
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={dontKnow} onChange={(e) => setDontKnow(e.target.checked)} /> No sabe
          </label>
        )}
        {props.allowsNotApplicable && (
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={notApplicable} onChange={(e) => setNotApplicable(e.target.checked)} /> No aplica
          </label>
        )}
        <Button type="button" variant="secondary" onClick={save} disabled={pending} className="ml-auto px-3 py-1 text-xs">
          {pending ? 'Guardando…' : saved ? 'Guardado ✓' : 'Guardar respuesta'}
        </Button>
      </div>
    </div>
  );
}
