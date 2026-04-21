import { NextResponse } from 'next/server';
import { runScreener } from '@/lib/screener';
import { generateBriefSummary } from '@/lib/ai';
import type { ScreenerResult } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stocks = await runScreener();

    // AI summaries nur wenn Groq Key gesetzt — sonst nutzen wir buildWhyText aus screener
    if (process.env.GROQ_API_KEY && stocks.length > 0) {
      await Promise.allSettled(
        stocks.slice(0, 8).map(async (stock, i) => {
          const summary = await generateBriefSummary(stock);
          stocks[i].briefSummary = summary;
        })
      );
    }

    const result: ScreenerResult = {
      stocks,
      updatedAt: new Date().toISOString(),
      source: 'Yahoo Finance',
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error('Screener error:', err);
    return NextResponse.json(
      { error: 'Screener failed', stocks: [], updatedAt: new Date().toISOString() },
      { status: 500 }
    );
  }
}
