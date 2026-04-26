'use client';

import { TrendingUp, TrendingDown, Star } from 'lucide-react';
import type { ScreenedStock } from '@/lib/types';
import { clsx } from 'clsx';

const SIGNAL_STYLES: Record<string, string> = {
  STRONG_BUY: 'text-[#3fb950] bg-[#3fb950]/10 border-[#3fb950]/30',
  BUY: 'text-[#58a6ff] bg-[#58a6ff]/10 border-[#58a6ff]/30',
  WATCH: 'text-[#d29922] bg-[#d29922]/10 border-[#d29922]/30',
  NEUTRAL: 'text-[#7d8590] bg-transparent border-[#30363d]',
};

function Chg({ v }: { v: number }) {
  const pos = v >= 0;
  return (
    <span className={clsx('flex items-center gap-0.5 font-medium tabular-nums', pos ? 'text-[#3fb950]' : 'text-[#f85149]')}>
      {pos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {pos ? '+' : ''}{v.toFixed(2)}%
    </span>
  );
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="h-1 w-14 bg-[#21262d] rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
    </div>
  );
}

function fmt(n: number) {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

export function StockTable({ stocks, watchlist, onToggleWatch }: {
  stocks: ScreenedStock[];
  watchlist?: Set<string>;
  onToggleWatch?: (ticker: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#30363d]">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#161b22] border-b border-[#30363d] text-xs text-[#7d8590]">
            <th className="px-4 py-3 text-left w-8">#</th>
            <th className="px-4 py-3 text-left">Ticker</th>
            <th className="px-4 py-3 text-right">Kurs</th>
            <th className="px-4 py-3 text-right">1T</th>
            <th className="px-4 py-3 text-right">5T</th>
            <th className="px-4 py-3 text-right">Volumen</th>
            <th className="px-4 py-3 text-right">MarktKap</th>
            <th className="px-4 py-3 text-center">Score</th>
            <th className="px-4 py-3 text-left">Momentum / Vol / Sektor</th>
            <th className="px-4 py-3 text-center">Signal</th>
            <th className="px-4 py-3 text-left">Katalysator</th>
            {onToggleWatch && <th className="px-3 py-3 text-center">★</th>}
          </tr>
        </thead>
        <tbody>
          {stocks.map((s, i) => (
            <tr key={s.ticker}
              onClick={() => window.location.href = `/stock/${s.ticker}`}
              className="border-b border-[#30363d] hover:bg-[#1c2128] cursor-pointer transition-colors">
              <td className="px-4 py-3 text-[#484f58] text-xs">{i + 1}</td>
              <td className="px-4 py-3">
                <div className="font-bold text-[#e6edf3]">{s.ticker}</div>
                <div className="text-[10px] text-[#7d8590] truncate max-w-[140px]">{s.name}</div>
              </td>
              <td className="px-4 py-3 text-right font-mono text-[#e6edf3]">${s.price.toFixed(2)}</td>
              <td className="px-4 py-3 text-right"><Chg v={s.change1d} /></td>
              <td className="px-4 py-3 text-right"><Chg v={s.change5d} /></td>
              <td className="px-4 py-3 text-right text-[#58a6ff]">{s.volumeRatio.toFixed(1)}x</td>
              <td className="px-4 py-3 text-right text-[#7d8590]">{fmt(s.marketCap)}</td>
              <td className="px-4 py-3 text-center">
                <span className="inline-flex items-center justify-center w-10 h-6 rounded bg-[#0d1117] border border-[#30363d] text-xs font-bold text-[#e6edf3]">
                  {s.score.total}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="space-y-1">
                  <MiniBar value={s.score.momentum} max={30} color="bg-[#3fb950]" />
                  <MiniBar value={s.score.volume} max={25} color="bg-[#58a6ff]" />
                  <MiniBar value={s.score.sector} max={20} color="bg-[#bc8cff]" />
                </div>
              </td>
              <td className="px-4 py-3 text-center">
                <span className={clsx('text-[10px] font-semibold px-2 py-0.5 rounded border', SIGNAL_STYLES[s.signal])}>
                  {s.signal.replace('_', ' ')}
                </span>
              </td>
              <td className="px-4 py-3 text-[#7d8590] text-xs max-w-[140px] truncate">{s.catalystType}</td>
              {onToggleWatch && (
                <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => onToggleWatch(s.ticker)} className="p-1 rounded hover:bg-[#30363d] transition-colors">
                    <Star className={clsx('w-3.5 h-3.5', watchlist?.has(s.ticker) ? 'fill-[#d29922] text-[#d29922]' : 'text-[#484f58] hover:text-[#7d8590]')} />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
