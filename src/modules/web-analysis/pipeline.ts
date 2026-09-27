import 'server-only';
import { db } from '@/lib/db';
import { getEnv } from '@/lib/env';
import { safeFetchHtml } from './fetcher';
import { detectFromHtml, extractSameOriginLinks, prioritizeLinks } from './detectors';
import { assertSafeUrl, SsrfBlockedError } from './ssrf-guard';
import { logAuditEvent } from '@/modules/audit';
import type { Prisma } from '@prisma/client';

async function isDisallowedByRobots(baseUrl: string, path: string): Promise<boolean> {
  try {
    const robotsUrl = new URL('/robots.txt', baseUrl).toString();
    const res = await safeFetchHtml(robotsUrl);
    if (res.status !== 200) return false;
    const lines = res.html.split('\n').map((l) => l.trim());
    let applies = false;
    for (const line of lines) {
      if (/^user-agent:\s*\*/i.test(line)) applies = true;
      else if (/^user-agent:/i.test(line)) applies = false;
      else if (applies && /^disallow:/i.test(line)) {
        const rule = line.split(':').slice(1).join(':').trim();
        if (rule && path.startsWith(rule)) return true;
      }
    }
    return false;
  } catch {
    return false; // sin robots.txt accesible, se asume permitido
  }
}

/**
 * Análisis del sitio web de una organización: respeta robots.txt, límites de
 * tiempo/tamaño/páginas, protección SSRF, y nunca envía formularios ni se
 * autentica. Los hallazgos siempre se clasifican como CONFIRMADO / PROBABLE
 * / NO_DETERMINADO, nunca como conclusión jurídica.
 */
export async function analyzeWebsite(webAnalysisId: string, executedById?: string) {
  const env = getEnv();
  const webAnalysis = await db.webAnalysis.findUniqueOrThrow({
    where: { id: webAnalysisId },
    include: { diagnosis: true },
  });

  await db.webAnalysis.update({ where: { id: webAnalysisId }, data: { status: 'RUNNING' } });

  try {
    await assertSafeUrl(webAnalysis.url);

    const visited = new Set<string>();
    const queue = [webAnalysis.url];
    let pagesVisited = 0;
    const allFindings: Prisma.WebFindingCreateManyInput[] = [];

    while (queue.length > 0 && pagesVisited < env.WEB_ANALYSIS_MAX_PAGES) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const path = new URL(current).pathname;
      if (await isDisallowedByRobots(webAnalysis.url, path)) continue;

      const result = await safeFetchHtml(current);
      pagesVisited++;

      const detections = detectFromHtml(result.html, current);
      for (const d of detections) {
        allFindings.push({
          webAnalysisId,
          url: current,
          type: d.type,
          description: d.description,
          technology: d.technology,
          evidence: d.evidence,
          certainty: d.certainty,
          possibleProvider: d.possibleProvider,
          possibleProcessing: d.possibleProcessing,
          possibleTransfer: d.possibleTransfer ?? false,
          possibleRisk: d.possibleRisk,
          requiresValidation: true,
        });
      }

      if (pagesVisited === 1) {
        const links = prioritizeLinks(extractSameOriginLinks(result.html, current));
        for (const link of links) {
          if (!visited.has(link)) queue.push(link);
        }
      }

      // Server header -> pista de hosting/CDN
      const server = result.headers['server'];
      if (server) {
        allFindings.push({
          webAnalysisId,
          url: current,
          type: 'hosting',
          description: `Cabecera "Server" reportada: ${server}`,
          evidence: `HTTP header Server: ${server}`,
          certainty: 'NO_DETERMINADO',
          requiresValidation: true,
        });
      }
    }

    if (allFindings.length > 0) {
      await db.webFinding.createMany({ data: allFindings });
    }

    await db.webAnalysis.update({
      where: { id: webAnalysisId },
      data: {
        status: 'COMPLETED',
        finishedAt: new Date(),
        pagesVisited,
        resultSummary: { pagesVisited, findingsCount: allFindings.length },
      },
    });

    await logAuditEvent({
      userId: executedById ?? null,
      diagnosisId: webAnalysis.diagnosisId,
      action: 'WEB_ANALYSIS_COMPLETED',
      entityType: 'WebAnalysis',
      entityId: webAnalysisId,
      metadata: { pagesVisited, findingsCount: allFindings.length },
    });
  } catch (err) {
    const message = err instanceof SsrfBlockedError ? `Bloqueado por protección SSRF: ${err.message}` : err instanceof Error ? err.message : String(err);
    await db.webAnalysis.update({
      where: { id: webAnalysisId },
      data: { status: 'ERROR', finishedAt: new Date(), errorMessage: message },
    });
    await logAuditEvent({
      userId: executedById ?? null,
      diagnosisId: webAnalysis.diagnosisId,
      action: 'WEB_ANALYSIS_FAILED',
      entityType: 'WebAnalysis',
      entityId: webAnalysisId,
      metadata: { error: message },
    });
  }
}
