'use client';

import { useEffect, useState } from 'react';
import { X, ExternalLink, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import type { StockDetail, ScreenedStock } from '@/lib/types';
import { PriceChart } from './PriceChart';
import { AIAnalysis } from './AIAnalysis';
import { ScoreArc } from './ScoreArc';

function fmt(n?: number) {
  if (!n) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  return `$${(n / 1e6).toFixed(0)}M`;
}

function MetricPill({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col gap-0.5 bg-white/[0.04] rounded-lg px-3 py-2">
      <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>{label}</span>
      <span className="text-sm font-mono font-semibold" style={{ color: color ?? '#fff' }}>{value}</span>
    </div>
  );
}

interface Props {
  stock: ScreenedStock | null;
  onClose: () => void;
}

export function DetailDrawer({ stock, onClose }: Props) {
  const [detail, setDetail] = useState<StockDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!stock) { setDetail(null); return; }
    setDetail(null);
    setLoading(true);
    fetch(`/api/stock/${stock.ticker}`)
      .then((r) => r.json())
      .then((d) => setDetail(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [stock?.ticker]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!stock) return null;

  const isStrong = stock.signal === 'STRONG_BUY';
  const isPos = stock.change1d >= 0;
  const accentColor = isStrong ? '#f59e0b' : '#38bdf8';
  const topBorderColor = isStrong ? '#f59e0b' : '#38bdf8';

  const displayDetail = detail ?? stock as unknown as StockDetail;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/65"
        style={{ backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 h-full z-50 overflow-y-auto animate-drawer-in"
        style={{
          width: 'min(440px, 100vw)',
          background: '#111422',
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          borderTop: `3px solid ${topBorderColor}`,
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-5 py-4"
          style={{ background: 'rgba(17,20,34,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div>
            <div className="font-space font-bold text-xl tracking-tight">{stock.ticker}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{stock.name}</div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`/stock/${stock.ticker}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              title="Vollständige Seite öffnen"
            >
              <ExternalLink className="w-4 h-4" style={{ color: 'var(--text-dim)' }} />
            </a>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
              <X className="w-4 h-4" style={{ color: 'var(--text-dim)' }} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Price hero */}
          <div className="flex items-start justify-between">
            <div>
              <div className="font-space font-bold text-4xl tracking-tight">${stock.price.toFixed(2)}</div>
              <div className={`flex items-center gap-1 mt-1 text-base font-semibold ${isPos ? 'text-gain' : 'text-loss'}`}>
                {isPos ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {isPos ? '+' : ''}{stock.change1d.toFixed(2)}% heute
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ScoreArc score={stock.score.total} size={56} isStrong={isStrong} />
            </div>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-3 gap-2">
            <MetricPill label="5 Tage" value={`${stock.change5d >= 0 ? '+' : ''}${stock.change5d.toFixed(1)}%`}
              color={stock.change5d >= 0 ? '#4ade80' : '#f87171'} />
            <MetricPill label="Volumen" value={`${stock.volumeRatio.toFixed(1)}x`} color="#fbbf24" />
            <MetricPill label="Marktk." value={fmt(stock.marketCap)} />
          </div>

          {/* Score bars */}
          <div className="space-y-2 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="text-[10px] uppercase tracking-widest mb-3" style={{ color: 'var(--text-dim)' }}>Score-Aufschlüsselung</div>
            {[
              { label: 'Momentum', val: stock.score.momentum, max: 30, color: '#4ade80' },
              { label: 'Volumen', val: stock.score.volume, max: 25, color: '#fbbf24' },
              { label: 'Sektor', val: stock.score.sector, max: 20, color: accentColor },
              { label: 'Prognose', val: stock.score.probability ?? 0, max: 20, color: isStrong ? '#f59e0b' : '#7dd3fc' },
            ].map(({ label, val, max, color }) => (
              <div key={label} className="flex items-center gap-3 text-xs">
                <span className="w-16 shrink-0" style={{ color: 'var(--text-dim)' }}>{label}</span>
                <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full" style={{ width: `${(val / max) * 100}%`, background: color }} />
                </div>
                <span className="w-6 text-right font-mono" style={{ color }}>{val}</span>
              </div>
            ))}
          </div>

          {/* Chart */}
          {loading ? (
            <div className="flex items-center justify-center h-48 gap-2" style={{ color: 'var(--text-dim)' }}>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Lade Kursdaten…</span>
            </div>
          ) : displayDetail.history?.length > 0 && (
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <PriceChart history={displayDetail.history} ticker={stock.ticker} />
            </div>
          )}

          {/* Analyst ratings */}
          {detail?.analystRating && (() => {
            const { buy = 0, hold = 0, sell = 0, targetPrice } = detail.analystRating!;
            const total = buy + hold + sell;
            if (!total) return null;
            return (
              <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>Analysten</div>
                <div className="flex rounded-full overflow-hidden h-2">
                  <div style={{ width: `${(buy / total) * 100}%`, background: '#4ade80' }} />
                  <div style={{ width: `${(hold / total) * 100}%`, background: '#fbbf24' }} />
                  <div style={{ width: `${(sell / total) * 100}%`, background: '#f87171' }} />
                </div>
                <div className="flex gap-4 text-xs font-mono">
                  <span style={{ color: '#4ade80' }}>{buy} Buy</span>
                  <span style={{ color: '#fbbf24' }}>{hold} Hold</span>
                  <span style={{ color: '#f87171' }}>{sell} Sell</span>
                  {targetPrice && <span className="ml-auto" style={{ color: 'var(--text-dim)' }}>Ziel: ${targetPrice.toFixed(2)}</span>}
                </div>
              </div>
            );
          })()}

          {/* AI Analysis */}
          <div>
            <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--text-dim)' }}>KI-Analyse</div>
            <AIAnalysis ticker={stock.ticker} />
          </div>

          {/* News */}
          {detail?.news && detail.news.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--text-dim)' }}>Aktuelle News</div>
              <div className="space-y-2">
                {detail.news.slice(0, 5).map((n, i) => (
                  <a key={i} href={n.url} target="_blank" rel="noopener noreferrer"
                    className="block p-3 rounded-xl hover:bg-white/5 transition-colors"
                    style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="text-xs font-medium leading-snug text-white/80">{n.headline}</div>
                    <div className="text-[10px] mt-1" style={{ color: 'var(--text-dimmer)' }}>
                      {n.source} · {new Date(n.datetime * 1000).toLocaleDateString('de-DE')}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <a
            href={`/stock/${stock.ticker}`}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all"
            style={{
              background: isStrong
                ? 'linear-gradient(135deg, #f59e0b, #ef4444)'
                : 'rgba(56,189,248,0.15)',
              color: isStrong ? '#000' : '#38bdf8',
              border: isStrong ? 'none' : '1px solid rgba(56,189,248,0.25)',
              boxShadow: isStrong ? '0 4px 16px rgba(245,158,11,0.25)' : 'none',
            }}
          >
            <ExternalLink className="w-4 h-4" />
            Vollständige Analyse öffnen
          </a>
        </div>
      </div>
    </>
  );
}
