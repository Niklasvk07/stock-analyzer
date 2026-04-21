import { NextResponse } from 'next/server';
import { singleQuote, getHistory, getQuoteSummary } from '@/lib/yahoo';
import { getCompanyNews, getAnalystRating } from '@/lib/finnhub';
import type { StockDetail } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { ticker: string } }) {
  const { ticker } = params;

  const [quote, history, summary, news, analystRating] = await Promise.all([
    singleQuote(ticker),
    getHistory(ticker, 60),
    getQuoteSummary(ticker),
    getCompanyNews(ticker),
    getAnalystRating(ticker),
  ]);

  if (!quote || !quote.regularMarketPrice) {
    return NextResponse.json({ error: 'Aktie nicht gefunden' }, { status: 404 });
  }

  const price = quote.regularMarketPrice;
  const vol = quote.regularMarketVolume ?? 0;
  const avgVol = quote.averageDailyVolume3Month ?? quote.averageDailyVolume10Day ?? vol;

  const latest = history[history.length - 1]?.close ?? price;
  const d5 = history[Math.max(0, history.length - 6)]?.close ?? latest;
  const d20 = history[0]?.close ?? latest;

  const profile = summary?.summaryProfile;

  const detail: StockDetail = {
    ticker,
    name: quote.longName ?? quote.shortName ?? ticker,
    price,
    change1d: quote.regularMarketChangePercent ?? 0,
    change5d: d5 > 0 ? ((latest - d5) / d5) * 100 : 0,
    change20d: d20 > 0 ? ((latest - d20) / d20) * 100 : 0,
    volume: vol,
    avgVolume: avgVol,
    volumeRatio: avgVol > 0 ? vol / avgVol : 1,
    marketCap: quote.marketCap ?? 0,
    sector: quote.sector ?? profile?.sector ?? 'Unknown',
    industry: quote.industry ?? profile?.industry ?? 'Unknown',
    pe: quote.trailingPE,
    weekHigh52: quote.fiftyTwoWeekHigh,
    weekLow52: quote.fiftyTwoWeekLow,
    score: { momentum: 0, volume: 0, sector: 0, fundamental: 0, news: 0, total: 0 },
    signal: 'NEUTRAL',
    catalystType: 'Manuelle Suche',
    history,
    news,
    description: profile?.longBusinessSummary,
    employees: profile?.fullTimeEmployees,
    country: profile?.country,
    website: profile?.website,
    analystRating,
  };

  return NextResponse.json(detail);
}
