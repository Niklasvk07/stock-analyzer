import type { NewsItem } from './types';

const BASE = 'https://finnhub.io/api/v1';
const KEY = process.env.FINNHUB_API_KEY ?? '';

async function fetchFinnhub(path: string): Promise<unknown> {
  if (!KEY) return null;
  const url = `${BASE}${path}&token=${KEY}`;
  const res = await fetch(url, { next: { revalidate: 1800 } });
  if (!res.ok) return null;
  return res.json();
}

export async function getCompanyNews(ticker: string, days = 14): Promise<NewsItem[]> {
  const to = new Date().toISOString().split('T')[0];
  const from = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
  const data = (await fetchFinnhub(`/company-news?symbol=${ticker}&from=${from}&to=${to}`)) as Array<{
    headline?: string;
    summary?: string;
    source?: string;
    url?: string;
    datetime?: number;
  }> | null;

  if (!Array.isArray(data)) return [];

  return data
    .slice(0, 10)
    .map((item) => ({
      headline: item.headline ?? '',
      summary: item.summary ?? '',
      source: item.source ?? '',
      url: item.url ?? '#',
      datetime: item.datetime ?? 0,
      sentiment: guessSentiment(item.headline ?? ''),
    }));
}

export async function getAnalystRating(ticker: string) {
  const data = (await fetchFinnhub(`/stock/recommendation?symbol=${ticker}`)) as Array<{
    buy?: number;
    hold?: number;
    sell?: number;
    strongBuy?: number;
    strongSell?: number;
  }> | null;

  if (!Array.isArray(data) || data.length === 0) return undefined;
  const latest = data[0];
  return {
    buy: (latest.buy ?? 0) + (latest.strongBuy ?? 0),
    hold: latest.hold ?? 0,
    sell: (latest.sell ?? 0) + (latest.strongSell ?? 0),
  };
}

export async function getBasicFinancials(ticker: string) {
  const data = (await fetchFinnhub(`/stock/metric?symbol=${ticker}&metric=all`)) as {
    metric?: {
      revenueGrowthTTMYoy?: number;
      grossMarginTTM?: number;
      peNormalizedAnnual?: number;
      '52WeekHigh'?: number;
      '52WeekLow'?: number;
    };
  } | null;
  return data?.metric ?? null;
}

function guessSentiment(headline: string): 'positive' | 'negative' | 'neutral' {
  const h = headline.toLowerCase();
  const positive = ['beat', 'surge', 'jump', 'record', 'win', 'contract', 'award', 'partnership', 'growth', 'raise', 'upgrade', 'buy', 'strong', 'rally', 'rises'];
  const negative = ['miss', 'drop', 'fall', 'loss', 'cut', 'downgrade', 'sell', 'weak', 'concern', 'risk', 'decline', 'crash', 'warn'];
  if (positive.some((w) => h.includes(w))) return 'positive';
  if (negative.some((w) => h.includes(w))) return 'negative';
  return 'neutral';
}
