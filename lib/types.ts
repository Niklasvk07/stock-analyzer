export interface StockScore {
  momentum: number;    // 0-30
  volume: number;      // 0-25
  sector: number;      // 0-20
  fundamental: number; // 0-15
  probability: number; // 0-20 (Steigewahrscheinlichkeit)
  total: number;       // 0-100
}

export interface ScreenedStock {
  ticker: string;
  name: string;
  price: number;
  change1d: number;
  change5d: number;
  change20d: number;
  volume: number;
  avgVolume: number;
  volumeRatio: number;
  marketCap: number;
  sector: string;
  industry: string;
  score: StockScore;
  signal: 'STRONG_BUY' | 'BUY' | 'WATCH' | 'NEUTRAL';
  catalystType: string;
  briefSummary?: string;
  pe?: number;
  weekHigh52?: number;
  weekLow52?: number;
}

export interface NewsItem {
  headline: string;
  summary: string;
  source: string;
  url: string;
  datetime: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

export interface StockDetail extends ScreenedStock {
  history: HistoryPoint[];
  news: NewsItem[];
  aiAnalysis?: string;
  description?: string;
  employees?: number;
  country?: string;
  website?: string;
  analystRating?: {
    buy: number;
    hold: number;
    sell: number;
    targetPrice?: number;
  };
}

export interface HistoryPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ScreenerResult {
  stocks: ScreenedStock[];
  updatedAt: string;
  source: string;
}
