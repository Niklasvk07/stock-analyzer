'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown, Zap, BarChart2 } from 'lucide-react';
import type { ScreenedStock } from '@/lib/types';
import { clsx } from 'clsx';

const SIGNAL_STYLES = {
  STRONG_BUY: 'bg-[#3fb950]/20 text-[#3fb950] border-[#3fb950]/40',
  BUY: 'bg-[#58a6ff]/20 text-[#58a6ff] border-[#58a6ff]/40',
  WATCH: 'bg-[#d29922]/20 text-[#d29922] border-[#d29922]/40',
  NEUTRAL: 'bg-[#7d8590]/20 text-[#7d8590] border-[#7d8590]/40',
};

const SIGNAL_LABELS = {
  STRONG_BUY: 'STRONG BUY',
  BUY: 'BUY',
  WATCH: 'WATCH',
  NEUTRAL: 'NEUTRAL',
};

function ScoreBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="h-1 bg-[#30363d] rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${(value / max) * 100}%` }}
      />
    </div>
  );
}

function formatMarketCap(cap: number): string {
  if (cap >= 1e12) return `$${(cap / 1e12).toFixed(1)}T`;
  if (cap >= 1e9) return `$${(cap / 1e9).toFixed(1)}B`;
  if (cap >= 1e6) return `$${(cap / 1e6).toFixed(0)}M`;
  return `$${cap.toLocaleString()}`;
}

export function StockCard({ stock, rank }: { stock: ScreenedStock; rank: number }) {
  const isPositive1d = stock.change1d >= 0;

  return (
    <Link href={`/stock/${stock.ticker}`}>
      <div className="group relative bg-[#161b22] border border-[#30363d] rounded-xl p-4 hover:border-[#58a6ff]/50 hover:bg-[#1c2128] transition-all duration-200 cursor-pointer animate-fade-in">
        {/* Rank badge */}
        <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-[#0d1117] border border-[#30363d] flex items-center justify-center text-[10px] font-bold text-[#7d8590]">
          {rank}
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-[#e6edf3]">{stock.ticker}</span>
              <span className={clsx('text-[10px] font-semibold px-1.5 py-0.5 rounded border', SIGNAL_STYLES[stock.signal])}>
                {SIGNAL_LABELS[stock.signal]}
              </span>
            </div>
            <p className="text-xs text-[#7d8590] mt-0.5 line-clamp-1">{stock.name}</p>
          </div>
          <div className="text-right">
            <div className="font-bold text-[#e6edf3]">${stock.price.toFixed(2)}</div>
            <div className={clsx('text-sm font-semibold flex items-center gap-1 justify-end', isPositive1d ? 'text-[#3fb950]' : 'text-[#f85149]')}>
              {isPositive1d ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {isPositive1d ? '+' : ''}{stock.change1d.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
          <div className="bg-[#0d1117] rounded-lg p-2 text-center">
            <div className={clsx('font-semibold', stock.change5d >= 0 ? 'text-[#3fb950]' : 'text-[#f85149]')}>
              {stock.change5d >= 0 ? '+' : ''}{stock.change5d.toFixed(1)}%
            </div>
            <div className="text-[#7d8590] mt-0.5">5 Tage</div>
          </div>
          <div className="bg-[#0d1117] rounded-lg p-2 text-center">
            <div className="font-semibold text-[#58a6ff]">
              {stock.volumeRatio.toFixed(1)}x
            </div>
            <div className="text-[#7d8590] mt-0.5">Volumen</div>
          </div>
          <div className="bg-[#0d1117] rounded-lg p-2 text-center">
            <div className="font-semibold text-[#e6edf3]">{stock.score.total}</div>
            <div className="text-[#7d8590] mt-0.5">Score</div>
          </div>
        </div>

        {/* Score breakdown */}
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-2 text-[10px] text-[#7d8590]">
            <span className="w-14 shrink-0">Momentum</span>
            <div className="flex-1">
              <ScoreBar value={stock.score.momentum} max={30} color="bg-[#3fb950]" />
            </div>
            <span className="w-6 text-right">{stock.score.momentum}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-[#7d8590]">
            <span className="w-14 shrink-0">Volumen</span>
            <div className="flex-1">
              <ScoreBar value={stock.score.volume} max={25} color="bg-[#58a6ff]" />
            </div>
            <span className="w-6 text-right">{stock.score.volume}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-[#7d8590]">
            <span className="w-14 shrink-0">Sektor</span>
            <div className="flex-1">
              <ScoreBar value={stock.score.sector} max={20} color="bg-[#bc8cff]" />
            </div>
            <span className="w-6 text-right">{stock.score.sector}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-[#d29922]" />
            <span className="text-[10px] text-[#7d8590]">{stock.catalystType}</span>
          </div>
          <span className="text-[10px] text-[#7d8590]">{formatMarketCap(stock.marketCap)}</span>
        </div>

        {/* AI Summary */}
        {stock.briefSummary && (
          <div className="mt-3 pt-3 border-t border-[#30363d]">
            <div className="flex items-start gap-1.5">
              <BarChart2 className="w-3 h-3 text-[#58a6ff] mt-0.5 shrink-0" />
              <p className="text-[11px] text-[#7d8590] leading-relaxed line-clamp-3">{stock.briefSummary}</p>
            </div>
          </div>
        )}

        {/* Sector tag */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] bg-[#0d1117] border border-[#30363d] rounded px-1.5 py-0.5 text-[#7d8590]">
            {stock.sector}
          </span>
        </div>
      </div>
    </Link>
  );
}
