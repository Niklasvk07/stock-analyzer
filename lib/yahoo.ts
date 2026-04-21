const BASE = 'https://query1.finance.yahoo.com';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
};

const FIELDS = [
  'symbol','longName','shortName','regularMarketPrice','regularMarketChangePercent',
  'regularMarketVolume','averageDailyVolume3Month','averageDailyVolume10Day',
  'marketCap','trailingPE','fiftyTwoWeekHigh','fiftyTwoWeekLow','sector','industry',
].join(',');

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

export async function batchQuote(symbols: string[]): Promise<YFQuote[]> {
  // Yahoo allows max ~100 symbols per request
  const chunks: string[][] = [];
  for (let i = 0; i < symbols.length; i += 80) {
    chunks.push(symbols.slice(i, i + 80));
  }

  const results: YFQuote[] = [];
  for (const chunk of chunks) {
    try {
      const url = `${BASE}/v7/finance/quote?symbols=${chunk.join(',')}&fields=${FIELDS}`;
      const res = await fetch(url, { headers: HEADERS, next: { revalidate: 300 } });
      const data = await res.json();
      const quotes: YFQuote[] = data?.quoteResponse?.result ?? [];
      results.push(...quotes);
    } catch { /* skip chunk */ }
  }
  return results;
}

export async function singleQuote(symbol: string): Promise<YFQuote | null> {
  const quotes = await batchQuote([symbol]);
  return quotes[0] ?? null;
}

export interface HistoryBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function getHistory(symbol: string, days = 60): Promise<HistoryBar[]> {
  try {
    const range = days <= 5 ? '5d' : days <= 30 ? '1mo' : days <= 60 ? '3mo' : '6mo';
    const url = `${BASE}/v8/finance/chart/${symbol}?interval=1d&range=${range}`;
    const res = await fetch(url, { headers: HEADERS, next: { revalidate: 600 } });
    const data = await res.json();

    const chart = data?.chart?.result?.[0];
    if (!chart) return [];

    const timestamps: number[] = chart.timestamp ?? [];
    const ohlcv = chart.indicators?.quote?.[0];
    if (!ohlcv) return [];

    return timestamps.map((ts, i) => ({
      date: new Date(ts * 1000).toISOString().split('T')[0],
      open: ohlcv.open?.[i] ?? 0,
      high: ohlcv.high?.[i] ?? 0,
      low: ohlcv.low?.[i] ?? 0,
      close: ohlcv.close?.[i] ?? 0,
      volume: ohlcv.volume?.[i] ?? 0,
    })).filter((b) => b.close > 0);
  } catch {
    return [];
  }
}

export async function getScreenerQuotes(scrId: string, count = 40): Promise<YFQuote[]> {
  try {
    const url = `${BASE}/v1/finance/screener/predefined/saved?formatted=false&scrIds=${scrId}&count=${count}&fields=${FIELDS}`;
    const res = await fetch(url, { headers: HEADERS, next: { revalidate: 300 } });
    const data = await res.json();
    return data?.finance?.result?.[0]?.quotes ?? [];
  } catch {
    return [];
  }
}

export async function getQuoteSummary(symbol: string) {
  try {
    const url = `${BASE}/v11/finance/quoteSummary/${symbol}?modules=summaryProfile,price,defaultKeyStatistics`;
    const res = await fetch(url, { headers: HEADERS, next: { revalidate: 3600 } });
    const data = await res.json();
    return data?.quoteSummary?.result?.[0] ?? null;
  } catch {
    return null;
  }
}
