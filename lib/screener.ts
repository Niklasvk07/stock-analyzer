import { batchQuote, getHistory, getScreenerQuotes } from './yahoo';
import { buildWhyText } from './screener-client';
import type { ScreenedStock, StockScore } from './types';

const UNIVERSE = [
  'NVDA','AMD','ONSEMI','AEHR','SMCI','MRVL','AVGO','MU','QCOM','WOLF',
  'ARM','LRCX','KLAC','AMAT','TER','ONTO','ACLS','COHR','FORM',
  'PLTR','AI','BBAI','SOUN','MSFT','GOOGL','META','NET','SNOW','DDOG',
  'IONQ','RGTI','QUBT','QBTS','ARQQ',
  'TSLA','RIVN','NIO','ENPH','FSLR','PLUG','RUN','CHPT','BLNK',
  'MRNA','BNTX','RXRX','BEAM','CRSP','EDIT','NTLA','VERV',
  'RKLB','ASTS','LMT','RTX','NOC','KTOS','RCAT',
  'COIN','HOOD','SOFI','UPST','AFRM','MSTR','APLD','CORZ','CLSK',
  'GE','HON','CAT','URI','PWR',
  'CAVA','APP','CELH','ELF','DUOL','UBER','LYFT',
  'AAPL','AMZN','TSMC','INTC','TXN',
];

const SECTOR_SCORES: Record<string, number> = {
  'Technology': 19, 'Semiconductors': 20, 'Healthcare': 16,
  'Biotechnology': 18, 'Energy': 15, 'Industrials': 14,
  'Financial Services': 13, 'Consumer Cyclical': 13,
  'Communication Services': 14, 'Basic Materials': 11,
};

function score(s: {
  change1d: number; change5d: number; change20d: number;
  volumeRatio: number; sector: string; marketCap: number;
  pe?: number; weekHigh52?: number; price?: number;
}): StockScore {
  let momentum = 0;
  momentum += Math.min(13, Math.max(0, s.change1d * 0.9));
  momentum += Math.min(13, Math.max(0, s.change5d * 0.45));
  momentum += s.change20d > 0 ? Math.min(4, s.change20d * 0.1) : 0;
  momentum = Math.min(30, Math.round(momentum));

  let volume = 0;
  if (s.volumeRatio >= 5) volume = 25;
  else if (s.volumeRatio >= 3) volume = 20;
  else if (s.volumeRatio >= 2) volume = 14;
  else if (s.volumeRatio >= 1.5) volume = 9;
  else if (s.volumeRatio >= 1.2) volume = 5;
  else volume = 2;

  const sector = Math.min(20, SECTOR_SCORES[s.sector] ?? 10);

  let fundamental = 5;
  if (s.marketCap > 0) {
    if (s.marketCap < 500e6) fundamental += 7;
    else if (s.marketCap < 2e9) fundamental += 5;
    else if (s.marketCap < 15e9) fundamental += 3;
    else fundamental += 1;
  }
  if (s.pe && s.pe > 0 && s.pe < 50) fundamental += 3;
  if (s.weekHigh52 && s.price && s.price >= s.weekHigh52 * 0.92) fundamental += 2;
  fundamental = Math.min(15, fundamental);

  const total = Math.min(100, Math.round(momentum + volume + sector + fundamental + 5));
  return { momentum, volume, sector, fundamental, news: 5, total };
}

function signal(total: number): ScreenedStock['signal'] {
  if (total >= 68) return 'STRONG_BUY';
  if (total >= 52) return 'BUY';
  if (total >= 35) return 'WATCH';
  return 'NEUTRAL';
}

function catalyst(c1d: number, c5d: number, vol: number, sector: string): string {
  if (vol > 5 && c1d > 15) return 'Earnings / Major News';
  if (vol > 3 && c5d > 20) return 'Momentum Breakout';
  if (vol > 2 && c1d > 5) return 'Volumen-Katalysator';
  if (c5d > 15) return 'Wochenlanger Aufwärtstrend';
  if (sector === 'Biotechnology') return 'Biotech-Katalysator';
  if (c1d > 3) return 'Tages-Momentum';
  if (vol > 1.8) return 'Ungewöhnliches Volumen';
  return 'Technisches Setup';
}

export async function runScreener(): Promise<ScreenedStock[]> {
  // Fetch universe + screener in parallel
  const [universeQuotes, screenerQuotes] = await Promise.all([
    batchQuote(UNIVERSE),
    getScreenerQuotes('day_gainers', 30),
  ]);

  // Deduplicate
  const seen = new Set<string>();
  const allQuotes = [...universeQuotes, ...screenerQuotes].filter((q) => {
    if (!q.symbol || seen.has(q.symbol)) return false;
    seen.add(q.symbol);
    return true;
  });

  // Build initial stock list — only LS Exchange compatible (marketCap > 50M, price > $1)
  const stocks: ScreenedStock[] = allQuotes
    .filter((q) => (q.regularMarketPrice ?? 0) > 1 && (q.marketCap ?? 0) > 50e6)
    .map((q) => {
      const vol = q.regularMarketVolume ?? 0;
      const avgVol = q.averageDailyVolume3Month ?? q.averageDailyVolume10Day ?? vol;
      return {
        ticker: q.symbol,
        name: q.longName ?? q.shortName ?? q.symbol,
        price: q.regularMarketPrice ?? 0,
        change1d: q.regularMarketChangePercent ?? 0,
        change5d: 0,
        change20d: 0,
        volume: vol,
        avgVolume: avgVol,
        volumeRatio: avgVol > 0 ? vol / avgVol : 1,
        marketCap: q.marketCap ?? 0,
        sector: q.sector ?? 'Unknown',
        industry: q.industry ?? 'Unknown',
        pe: q.trailingPE,
        weekHigh52: q.fiftyTwoWeekHigh,
        weekLow52: q.fiftyTwoWeekLow,
        score: { momentum: 0, volume: 0, sector: 0, fundamental: 0, news: 0, total: 0 },
        signal: 'NEUTRAL' as const,
        catalystType: '',
      };
    });

  // Enrich top candidates with history (limit to save time)
  const sorted = stocks.sort((a, b) => Math.abs(b.change1d) - Math.abs(a.change1d));
  const toEnrich = sorted.slice(0, 40);

  await Promise.allSettled(
    toEnrich.map(async (s) => {
      const hist = await getHistory(s.ticker, 25);
      if (hist.length >= 5) {
        const latest = hist[hist.length - 1].close;
        const d5 = hist[Math.max(0, hist.length - 6)].close;
        const d20 = hist[0].close;
        s.change5d = d5 > 0 ? ((latest - d5) / d5) * 100 : 0;
        s.change20d = d20 > 0 ? ((latest - d20) / d20) * 100 : 0;
      }
    })
  );

  // Score all stocks
  for (const s of stocks) {
    s.score = score({
      change1d: s.change1d, change5d: s.change5d, change20d: s.change20d,
      volumeRatio: s.volumeRatio, sector: s.sector, marketCap: s.marketCap,
      pe: s.pe, weekHigh52: s.weekHigh52, price: s.price,
    });
    s.signal = signal(s.score.total);
    s.catalystType = catalyst(s.change1d, s.change5d, s.volumeRatio, s.sector);
    s.briefSummary = buildWhyText(s);
  }

  return stocks
    .filter((s) => s.score.total >= 18)
    .sort((a, b) => b.score.total - a.score.total)
    .slice(0, 24);
}
