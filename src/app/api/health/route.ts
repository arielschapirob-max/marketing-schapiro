import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getEnv, isMockAI, isMockOCR, isMockStorage, isMockAntivirus } from '@/lib/env';

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    const env = getEnv();
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      integrations: {
        ai: isMockAI() ? 'mock' : env.AI_PROVIDER,
        ocr: isMockOCR() ? 'mock' : env.OCR_PROVIDER,
        storage: isMockStorage() ? 'local' : 's3',
        antivirus: isMockAntivirus() ? 'mock' : 'external',
      },
    });
  } catch (err) {
    return NextResponse.json({ status: 'error', message: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
