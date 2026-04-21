'use client';

import { ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { NewsItem } from '@/lib/types';
import { clsx } from 'clsx';

function SentimentIcon({ s }: { s?: string }) {
  if (s === 'positive') return <TrendingUp className="w-3.5 h-3.5 text-[#3fb950]" />;
  if (s === 'negative') return <TrendingDown className="w-3.5 h-3.5 text-[#f85149]" />;
  return <Minus className="w-3.5 h-3.5 text-[#7d8590]" />;
}

export function NewsSection({ news }: { news: NewsItem[] }) {
  if (!news.length) return (
    <div className="text-sm text-[#7d8590] text-center py-8">
      Keine aktuellen News verfügbar (Finnhub API-Key konfigurieren)
    </div>
  );

  return (
    <div className="space-y-2">
      {news.map((item, i) => (
        <a
          key={i}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className={clsx(
            'flex items-start gap-3 p-3 rounded-lg border transition-colors group',
            'bg-[#0d1117] border-[#30363d] hover:border-[#58a6ff]/40 hover:bg-[#161b22]'
          )}
        >
          <div className="mt-0.5 shrink-0">
            <SentimentIcon s={item.sentiment} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#e6edf3] font-medium leading-snug line-clamp-2 group-hover:text-[#58a6ff] transition-colors">
              {item.headline}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] text-[#7d8590]">{item.source}</span>
              <span className="text-[#30363d]">·</span>
              <span className="text-[10px] text-[#7d8590]">
                {new Date(item.datetime * 1000).toLocaleDateString('de-DE')}
              </span>
            </div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-[#30363d] group-hover:text-[#58a6ff] shrink-0 mt-0.5 transition-colors" />
        </a>
      ))}
    </div>
  );
}
