import { NextResponse } from 'next/server';
import { batchQuote, getHistory, getScreenerQuotes } from '@/lib/yahoo';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: Record<string, unknown> = {};

  try {
    const q = await batchQuote(['AAPL', 'NVDA', 'ONSEMI']);
    results.quotes = { ok: true, count: q.length, sample: q.map((x) => ({ ticker: x.symbol, price: x.regularMarketPrice, change: x.regularMarketChangePercent })) };
  } catch (e) {
    results.quotes = { ok: false, error: String(e) };
  }

  try {
    const h = await getHistory('AAPL', 10);
    results.history = { ok: true, bars: h.length, last: h[h.length - 1] };
  } catch (e) {
    results.history = { ok: false, error: String(e) };
  }

  try {
    const s = await getScreenerQuotes('day_gainers', 5);
    results.screener = { ok: true, count: s.length, sample: s.slice(0, 3).map((x) => ({ ticker: x.symbol, change: x.regularMarketChangePercent })) };
  } catch (e) {
    results.screener = { ok: false, error: String(e) };
  }

  return NextResponse.json(results, { headers: { 'Content-Type': 'application/json' } });
}
