'use client';

import { Star, TrendingUp, TrendingDown } from 'lucide-react';
import type { ScreenedStock } from '@/lib/types';
import { ScoreArc } from './ScoreArc';

function Bar({ label, val, max, color }: { label: string; val: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] w-20 shrink-0" style={{ color: 'var(--text-dimmer)' }}>{label}</span>
      <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, (val / max) * 100)}%`, background: color }} />
      </div>
      <span className="text-[10px] w-5 text-right font-mono shrink-0" style={{ color }}>{val}</span>
    </div>
  );
}

function Pill({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
  return (
    <span className="text-[10px] font-medium px-2 py-0.5 rounded-[6px]" style={{ color, background: bg }}>
      {children}
    </span>
  );
}

// ── Featured Card (Strong Buy) ─────────────────────────────────────────────
export function FeaturedCard({ stock, rank, isWatched, onToggleWatch, onSelect }: {
  stock: ScreenedStock; rank: number;
  isWatched?: boolean; onToggleWatch?: (t: string) => void;
  onSelect: (s: ScreenedStock) => void;
}) {
  const isPos = stock.change1d >= 0;

  return (
    <div
      className="relative rounded-[18px] p-5 cursor-pointer transition-all duration-200 overflow-hidden animate-fade-up"
      style={{
        background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(239,68,68,0.05), rgba(9,11,22,0.95))',
        border: '1px solid rgba(245,158,11,0.30)',
      }}
      onClick={() => onSelect(stock)}
    >
      {/* Glow blob */}
      <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full pointer-events-none"
        style={{ background: 'rgba(245,158,11,0.12)', filter: 'blur(40px)' }} />

      {/* Badge + rank */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
          style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.20),rgba(239,68,68,0.15))', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.30)' }}>
          ✦ STRONG BUY
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono" style={{ color: 'var(--text-dimmer)' }}>#{rank}</span>
          {onToggleWatch && (
            <button onClick={(e) => { e.stopPropagation(); onToggleWatch(stock.ticker); }}
              className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
              <Star className="w-3.5 h-3.5"
                style={{ fill: isWatched ? '#f59e0b' : 'transparent', color: isWatched ? '#f59e0b' : 'rgba(255,255,255,0.25)' }} />
            </button>
          )}
        </div>
      </div>

      {/* Ticker + price + arc */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="font-space font-bold text-[28px] tracking-tight leading-none">{stock.ticker}</div>
          <div className="text-xs mt-1 max-w-[180px] line-clamp-1" style={{ color: 'var(--text-dim)' }}>{stock.name}</div>
          <div className="flex items-center gap-2 mt-2">
            <span className="font-space font-bold text-xl">${stock.price.toFixed(2)}</span>
            <span className={`flex items-center gap-1 text-sm font-semibold ${isPos ? 'text-gain' : 'text-loss'}`}>
              {isPos ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {isPos ? '+' : ''}{stock.change1d.toFixed(2)}%
            </span>
          </div>
        </div>
        <ScoreArc score={stock.score.total} size={52} isStrong />
      </div>

      {/* Score bars – full labels */}
      <div className="space-y-1.5 mb-4">
        <Bar label="Momentum" val={stock.score.momentum} max={30} color="#4ade80" />
        <Bar label="Volumen" val={stock.score.volume} max={25} color="#fbbf24" />
        <Bar label="Sektor" val={stock.score.sector} max={20} color="#ef4444" />
        <Bar label="Prognose" val={stock.score.probability} max={20} color="#f59e0b" />
      </div>

      {/* Pills */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <Pill color="#fbbf24" bg="rgba(251,191,36,0.10)">{stock.volumeRatio.toFixed(1)}x Volumen</Pill>
        <Pill color="rgba(255,255,255,0.40)" bg="rgba(255,255,255,0.05)">{stock.sector}</Pill>
        <Pill color="rgba(255,255,255,0.40)" bg="rgba(255,255,255,0.05)">
          {stock.change5d >= 0 ? '+' : ''}{stock.change5d.toFixed(1)}% (5T)
        </Pill>
      </div>

      {stock.briefSummary && (
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>{stock.briefSummary}</p>
      )}
    </div>
  );
}

// ── Regular Card (Buy / Watch) ─────────────────────────────────────────────
export function StockCard({ stock, rank, isWatched, onToggleWatch, onSelect }: {
  stock: ScreenedStock; rank: number;
  isWatched?: boolean; onToggleWatch?: (t: string) => void;
  onSelect: (s: ScreenedStock) => void;
}) {
  const isPos = stock.change1d >= 0;
  const isBuy = stock.signal === 'BUY';

  return (
    <div
      className="relative rounded-[14px] p-4 cursor-pointer transition-all duration-[180ms] overflow-hidden animate-fade-up"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      onMouseEnter={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.background = 'var(--surface-hover)'; el.style.borderColor = 'var(--border-hover)'; }}
      onMouseLeave={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.background = 'var(--surface)'; el.style.borderColor = 'var(--border)'; }}
      onClick={() => onSelect(stock)}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1 pr-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
              style={{
                background: isBuy ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.05)',
                color: isBuy ? '#7dd3fc' : 'rgba(255,255,255,0.35)',
                border: isBuy ? '1px solid rgba(56,189,248,0.22)' : '1px solid rgba(255,255,255,0.08)',
              }}>
              {stock.signal.replace('_', ' ')}
            </span>
            <span className="text-[10px] font-mono" style={{ color: 'var(--text-dimmer)' }}>#{rank}</span>
          </div>
          <div className="font-space font-bold text-[15px] tracking-tight leading-none">{stock.ticker}</div>
          <div className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--text-dimmer)' }}>{stock.name}</div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {onToggleWatch && (
            <button onClick={(e) => { e.stopPropagation(); onToggleWatch(stock.ticker); }}
              className="p-1 rounded-lg hover:bg-white/5 transition-colors">
              <Star className="w-3 h-3"
                style={{ fill: isWatched ? '#f59e0b' : 'transparent', color: isWatched ? '#f59e0b' : 'rgba(255,255,255,0.20)' }} />
            </button>
          )}
          <ScoreArc score={stock.score.total} size={38} isStrong={false} />
        </div>
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className="font-space font-bold text-lg">${stock.price.toFixed(2)}</span>
        <span className={`flex items-center gap-0.5 text-xs font-semibold ${isPos ? 'text-gain' : 'text-loss'}`}>
          {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isPos ? '+' : ''}{stock.change1d.toFixed(2)}%
        </span>
      </div>

      {/* Score bars – full labels */}
      <div className="space-y-1.5 mb-3">
        <Bar label="Momentum" val={stock.score.momentum} max={30} color="#4ade80" />
        <Bar label="Volumen" val={stock.score.volume} max={25} color="#fbbf24" />
        <Bar label="Sektor" val={stock.score.sector} max={20} color={isBuy ? '#38bdf8' : 'rgba(255,255,255,0.30)'} />
        <Bar label="Prognose" val={stock.score.probability} max={20} color={isBuy ? '#7dd3fc' : 'rgba(255,255,255,0.25)'} />
      </div>

      {/* Pills */}
      <div className="flex flex-wrap gap-1">
        <Pill color="#fbbf24" bg="rgba(251,191,36,0.08)">{stock.volumeRatio.toFixed(1)}x Vol.</Pill>
        <Pill color="rgba(255,255,255,0.30)" bg="rgba(255,255,255,0.04)">{stock.change5d >= 0 ? '+' : ''}{stock.change5d.toFixed(1)}% 5T</Pill>
        <Pill color="rgba(255,255,255,0.30)" bg="rgba(255,255,255,0.04)">{stock.sector}</Pill>
      </div>

      {stock.briefSummary && (
        <p className="mt-2 text-[10px] leading-relaxed line-clamp-2" style={{ color: 'var(--text-dimmer)' }}>
          {stock.briefSummary}
        </p>
      )}
    </div>
  );
}
