const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': '*/*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Origin': 'https://finance.yahoo.com',
  'Referer': 'https://finance.yahoo.com/',
};

export interface YFQuote {
  symbol: string;
  longName?: string;
  shortName?: string;
  regularMarketPrice?: number;
  regularMarketChangePercent?: number;
  regularMarketVolume?: number;
  averageDailyVolume3Month?: number;
  averageDailyVolume10Day?: number;
  marketCap?: number;
  trailingPE?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  sector?: string;
  industry?: string;
}

export interface HistoryBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const FIELDS = 'symbol,longName,shortName,regularMarketPrice,regularMarketChangePercent,regularMarketVolume,averageDailyVolume3Month,averageDailyVolume10Day,marketCap,trailingPE,fiftyTwoWeekHigh,fiftyTwoWeekLow,sector,industry';

export async function batchQuote(symbols: string[]): Promise<YFQuote[]> {
  const results: YFQuote[] = [];
  // Process in chunks of 50
  for (let i = 0; i < symbols.length; i += 50) {
    const chunk = symbols.slice(i, i + 50);
    try {
      const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${chunk.join(',')}&fields=${FIELDS}&formatted=false`;
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) continue;
      const data = await res.json();
      const quotes: YFQuote[] = data?.quoteResponse?.result ?? [];
      results.push(...quotes);
    } catch { /* skip */ }

    // Try query2 as backup
    if (results.length === 0) {
      try {
        const url = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${chunk.join(',')}&fields=${FIELDS}&formatted=false`;
        const res = await fetch(url, { headers: HEADERS });
        if (!res.ok) continue;
        const data = await res.json();
        results.push(...(data?.quoteResponse?.result ?? []));
      } catch { /* skip */ }
    }
  }
  return results;
}

export async function singleQuote(symbol: string): Promise<YFQuote | null> {
  // Try Yahoo Finance first
  const quotes = await batchQuote([symbol]);
  if (quotes.length > 0 && quotes[0].regularMarketPrice) return quotes[0];

  // Fallback: Finnhub quote
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return null;
  try {
    const [q, p] = await Promise.all([
      fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${key}`).then(r => r.json()),
      fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${key}`).then(r => r.json()),
    ]);
    if (!q?.c) return null;
    return {
      symbol,
      longName: p?.name ?? symbol,
      shortName: p?.name ?? symbol,
      regularMarketPrice: q.c,
      regularMarketChangePercent: q.pc > 0 ? ((q.c - q.pc) / q.pc) * 100 : 0,
      regularMarketVolume: 0,
      marketCap: p?.marketCapitalization ? p.marketCapitalization * 1e6 : 0,
      sector: p?.finnhubIndustry ?? 'Unknown',
      industry: p?.finnhubIndustry ?? 'Unknown',
    };
  } catch { return null; }
}

export async function getHistory(symbol: string, days = 60): Promise<HistoryBar[]> {
  const range = days <= 5 ? '5d' : days <= 30 ? '1mo' : '3mo';

  // Try Yahoo Finance
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=${range}`;
    const res = await fetch(url, { headers: HEADERS });
    if (res.ok) {
      const data = await res.json();
      const chart = data?.chart?.result?.[0];
      if (chart?.timestamp) {
        const ohlcv = chart.indicators?.quote?.[0];
        return chart.timestamp.map((ts: number, i: number) => ({
          date: new Date(ts * 1000).toISOString().split('T')[0],
          open: ohlcv?.open?.[i] ?? 0,
          high: ohlcv?.high?.[i] ?? 0,
          low: ohlcv?.low?.[i] ?? 0,
          close: ohlcv?.close?.[i] ?? 0,
          volume: ohlcv?.volume?.[i] ?? 0,
        })).filter((b: HistoryBar) => b.close > 0);
      }
    }
  } catch { /* try fallback */ }

  // Fallback: Finnhub candles
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return [];
  try {
    const to = Math.floor(Date.now() / 1000);
    const from = to - days * 86400;
    const res = await fetch(`https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${to}&token=${key}`);
    const data = await res.json();
    if (data?.s !== 'ok' || !data.t) return [];
    return data.t.map((ts: number, i: number) => ({
      date: new Date(ts * 1000).toISOString().split('T')[0],
      open: data.o[i], high: data.h[i], low: data.l[i],
      close: data.c[i], volume: data.v[i],
    }));
  } catch { return []; }
}

export async function getScreenerQuotes(scrId: string, count = 40): Promise<YFQuote[]> {
  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=false&scrIds=${scrId}&count=${count}&fields=${FIELDS}`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.finance?.result?.[0]?.quotes ?? [];
  } catch { return []; }
}

export async function getQuoteSummary(symbol: string) {
  try {
    const url = `https://query1.finance.yahoo.com/v11/finance/quoteSummary/${symbol}?modules=summaryProfile,price`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.quoteSummary?.result?.[0] ?? null;
  } catch { return null; }
}
