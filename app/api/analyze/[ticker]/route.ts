import { NextResponse } from 'next/server';
import { singleQuote } from '@/lib/yahoo';
import { getCompanyNews } from '@/lib/finnhub';
import { generateStockAnalysis } from '@/lib/ai';
import type { ScreenedStock } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { ticker: string } }) {
  const { ticker } = params;

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: 'GROQ_API_KEY nicht konfiguriert' }, { status: 503 });
  }

  const [quote, news] = await Promise.all([
    singleQuote(ticker),
    getCompanyNews(ticker, 14),
  ]);

  if (!quote) {
    return NextResponse.json({ error: 'Aktie nicht gefunden' }, { status: 404 });
  }

  const vol = quote.regularMarketVolume ?? 0;
  const avgVol = quote.averageDailyVolume3Month ?? vol;

  const stock: ScreenedStock = {
    ticker,
    name: quote.longName ?? ticker,
    price: quote.regularMarketPrice ?? 0,
    change1d: quote.regularMarketChangePercent ?? 0,
    change5d: 0,
    change20d: 0,
    volume: vol,
    avgVolume: avgVol,
    volumeRatio: avgVol > 0 ? vol / avgVol : 1,
    marketCap: quote.marketCap ?? 0,
    sector: quote.sector ?? 'Unknown',
    industry: quote.industry ?? 'Unknown',
    score: { momentum: 0, volume: 0, sector: 0, fundamental: 0, news: 0, total: 0 },
    signal: 'NEUTRAL',
    catalystType: 'Analyse angefragt',
  };

  const analysis = await generateStockAnalysis(stock, news);
  return NextResponse.json({ ticker, analysis, generatedAt: new Date().toISOString() });
}
