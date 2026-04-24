'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown, Star, Zap } from 'lucide-react';
import type { ScreenedStock } from '@/lib/types';
import { clsx } from 'clsx';
import { GaugeMeter } from './GaugeMeter';

const SIGNAL_STYLES: Record<string, { badge: string; bar: string }> = {
  STRONG_BUY: { badge: 'bg-[#3fb950]/15 text-[#3fb950] border-[#3fb950]/40', bar: 'border-l-[#3fb950]' },
  BUY:        { badge: 'bg-[#58a6ff]/15 text-[#58a6ff] border-[#58a6ff]/40', bar: 'border-l-[#58a6ff]' },
  WATCH:      { badge: 'bg-[#d29922]/15 text-[#d29922] border-[#d29922]/40', bar: 'border-l-[#d29922]' },
  NEUTRAL:    { badge: 'bg-[#484f58]/15 text-[#7d8590] border-[#484f58]/40', bar: 'border-l-[#30363d]' },
};

const SIGNAL_LABELS: Record<string, string> = {
  STRONG_BUY: 'STRONG BUY', BUY: 'BUY', WATCH: 'WATCH', NEUTRAL: 'NEUTRAL',
};

function fmt(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

export function StockCard({ stock, rank, isWatched = false, onToggleWatch }: {
  stock: ScreenedStock;
  rank: number;
  isWatched?: boolean;
  onToggleWatch?: (ticker: string) => void;
}) {
  const isPos = stock.change1d >= 0;
  const styles = SIGNAL_STYLES[stock.signal];

  return (
    <div className={clsx(
      'group relative bg-[#161b22] border border-[#30363d] border-l-[3px] rounded-xl overflow-hidden',
      'hover:bg-[#1c2128] hover:shadow-lg hover:shadow-black/30 transition-all duration-200',
      styles.bar,
    )}>
      {/* Rank */}
      <div className="absolute top-3 left-4 text-[10px] font-bold text-[#484f58]">#{rank}</div>

      {/* Watchlist star */}
      {onToggleWatch && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleWatch(stock.ticker); }}
          className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-lg hover:bg-[#30363d] transition-colors"
        >
          <Star className={clsx('w-3.5 h-3.5 transition-colors', isWatched ? 'fill-[#d29922] text-[#d29922]' : 'text-[#484f58] group-hover:text-[#7d8590]')} />
        </button>
      )}

      <Link href={`/stock/${stock.ticker}`} className="block p-4">
        {/* Header */}
        <div className="flex items-start justify-between mt-3 mb-3">
          <div className="min-w-0 flex-1 pr-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-[17px] text-[#e6edf3] leading-none">{stock.ticker}</span>
              <span className={clsx('text-[9px] font-bold px-1.5 py-0.5 rounded border', styles.badge)}>
                {SIGNAL_LABELS[stock.signal]}
              </span>
            </div>
            <p className="text-[11px] text-[#7d8590] mt-1 truncate">{stock.name}</p>
          </div>
          <div className="text-right shrink-0">
            <div className="font-bold text-[#e6edf3] text-[15px]">${stock.price.toFixed(2)}</div>
            <div className={clsx('text-xs font-semibold flex items-center gap-0.5 justify-end mt-0.5', isPos ? 'text-[#3fb950]' : 'text-[#f85149]')}>
              {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isPos ? '+' : ''}{stock.change1d.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Gauge + Metrics */}
        <div className="flex items-center gap-4 py-2">
          <GaugeMeter score={stock.score.total} />
          <div className="flex-1 space-y-2.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-[#484f58]">5 Tage</span>
              <span className={clsx('font-medium', stock.change5d >= 0 ? 'text-[#3fb950]' : 'text-[#f85149]')}>
                {stock.change5d >= 0 ? '+' : ''}{stock.change5d.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-[#484f58]">Volumen</span>
              <span className="text-[#58a6ff] font-medium">{stock.volumeRatio.toFixed(1)}x Ø</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-[#484f58]">Marktk.</span>
              <span className="text-[#7d8590]">{fmt(stock.marketCap)}</span>
            </div>
          </div>
        </div>

        {/* Catalyst + Sektor */}
        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[#21262d]">
          <Zap className="w-3 h-3 text-[#d29922] shrink-0" />
          <span className="text-[10px] text-[#7d8590] truncate flex-1">{stock.catalystType}</span>
          <span className="text-[10px] text-[#484f58] shrink-0 ml-1">{stock.sector}</span>
        </div>

        {/* AI Summary */}
        {stock.briefSummary && (
          <p className="mt-2 text-[11px] text-[#8b949e] leading-relaxed line-clamp-2">{stock.briefSummary}</p>
        )}
      </Link>
    </div>
  );
}
