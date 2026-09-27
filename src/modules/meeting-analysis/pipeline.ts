import 'server-only';
import { db } from '@/lib/db';
import { runMeetingAnalysis } from '@/modules/ai-engine';
import { SECTORS } from '@/modules/legal-engine/sectors';
import { logAuditEvent } from '@/modules/audit';
import type { ExtractedFinding } from '@/modules/ai-engine/schemas';

function detectSectors(text: string): Array<{ key: string; indicator: string }> {
  const lower = text.toLowerCase();
  const hits: Array<{ key: string; indicator: string }> = [];
  for (const sector of SECTORS) {
    const indicator = sector.activationIndicators.find((i) => lower.includes(i.toLowerCase()));
    if (indicator) hits.push({ key: sector.key, indicator });
  }
  return hits;
}

async function persistFinding(diagnosisId: string, transcriptId: string, finding: ExtractedFinding) {
  if (finding.type === 'BUSINESS_ACTIVITY') return; // se maneja aparte vía detectSectors -> DiagnosisSector

  const created = await db.finding.create({
    data: {
      diagnosisId,
      type: finding.type,
      description: finding.description,
      value: { label: finding.description },
      certainty: finding.certainty,
      sourceType: 'TRANSCRIPT',
      sourceDocumentId: transcriptId,
      relatedNorm: finding.norm ?? undefined,
      requiresLegalValidation: finding.requiresLegalValidation,
      requiresClientConfirmation: finding.requiresClientConfirmation,
    },
  });

  await db.evidence.create({
    data: {
      diagnosisId,
      findingId: created.id,
      sourceType: 'TRANSCRIPT',
      sourceId: transcriptId,
      excerpt: finding.evidenceExcerpt,
    },
  });

  return created;
}

/**
 * Ejecuta el pipeline de análisis de una transcripción de reunión:
 * extracción -> segmentación implícita por el motor de IA -> identificación
 * de entidades/tratamientos/titulares/datos/proveedores/tecnologías/
 * transferencias/incidentes -> distinción confirmado/inferido ->
 * contradicciones -> vacíos -> evidencia -> persistencia.
 */
export async function analyzeMeetingTranscript(transcriptId: string, executedById?: string) {
  const transcript = await db.meetingTranscript.findUniqueOrThrow({
    where: { id: transcriptId },
    include: { diagnosis: { include: { organization: true, diagnosisSectors: { include: { sector: true } } } } },
  });

  const diagnosis = transcript.diagnosis;

  await db.diagnosis.update({ where: { id: diagnosis.id }, data: { status: 'ANALYSIS_RUNNING' } });

  const output = await runMeetingAnalysis(
    {
      transcriptText: transcript.rawText,
      organizationContext: {
        legalName: diagnosis.organization.legalName,
        knownSectors: diagnosis.diagnosisSectors.map((s) => s.sector.key),
      },
    },
    { diagnosisId: diagnosis.id, executedById },
  );

  for (const finding of output.findings) {
    await persistFinding(diagnosis.id, transcriptId, finding);
  }

  const sectorHits = detectSectors(transcript.rawText);
  const sectorRows = await db.sector.findMany({ where: { key: { in: sectorHits.map((h) => h.key) } } });
  for (const hit of sectorHits) {
    const sector = sectorRows.find((s) => s.key === hit.key);
    if (!sector) continue;
    await db.diagnosisSector.upsert({
      where: { diagnosisId_sectorId: { diagnosisId: diagnosis.id, sectorId: sector.id } },
      update: {},
      create: {
        diagnosisId: diagnosis.id,
        sectorId: sector.id,
        certainty: 'INFERIDO',
        rationale: `Indicador textual detectado: "${hit.indicator}"`,
      },
    });
  }

  for (const unknown of output.unknowns) {
    await db.validationTask.create({
      data: {
        diagnosisId: diagnosis.id,
        type: 'CLIENT_CONFIRMATION',
        description: unknown,
        blocking: false,
      },
    });
  }

  for (const contradiction of output.contradictions) {
    await db.validationTask.create({
      data: {
        diagnosisId: diagnosis.id,
        type: 'LEGAL',
        description: `Contradicción detectada: ${contradiction.description}`,
        relatedEntity: { relatedFindingDescriptions: contradiction.relatedFindingDescriptions },
        blocking: true,
      },
    });
  }

  await db.meetingTranscript.update({
    where: { id: transcriptId },
    data: { status: 'processed', processedAt: new Date(), analysisResult: output as unknown as object },
  });

  await logAuditEvent({
    userId: executedById ?? null,
    diagnosisId: diagnosis.id,
    organizationId: diagnosis.organizationId,
    action: 'MEETING_TRANSCRIPT_ANALYZED',
    entityType: 'MeetingTranscript',
    entityId: transcriptId,
    metadata: { findings: output.findings.length, unknowns: output.unknowns.length, contradictions: output.contradictions.length },
  });

  return output;
}
