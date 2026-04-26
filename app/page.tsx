'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { StockCard } from '@/components/StockCard';
import { StockTable } from '@/components/StockTable';
import {
  AlertCircle, BarChart2, Filter, Search,
  LayoutGrid, List, TrendingUp, Zap, RefreshCw, Star, Bookmark,
} from 'lucide-react';
import type { ScreenerResult, ScreenedStock } from '@/lib/types';
import { clsx } from 'clsx';
import { ApiUsage, trackUsage } from '@/components/ApiUsage';

const SIGNALS = ['Alle', 'STRONG_BUY', 'BUY', 'WATCH', 'NEUTRAL'] as const;
const SIGNAL_LABELS: Record<string, string> = {
  Alle: 'Alle', STRONG_BUY: 'Strong Buy', BUY: 'Buy', WATCH: 'Watch', NEUTRAL: 'Neutral',
};

function useWatchlist() {
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const saved = localStorage.getItem('watchlist');
      if (saved) setWatchlist(new Set(JSON.parse(saved)));
    } catch { /* ignore */ }
  }, []);

  const toggle = useCallback((ticker: string) => {
    setWatchlist((prev) => {
      const next = new Set(prev);
      if (next.has(ticker)) next.delete(ticker); else next.add(ticker);
      try { localStorage.setItem('watchlist', JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  }, []);

  return { watchlist, toggle };
}

function StatCard({ label, value, sub, color, icon }: {
  label: string; value: string | number; sub?: string; color: string; icon: React.ReactNode;
}) {
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 flex items-start gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <div className="text-xl font-bold text-[#e6edf3]">{value}</div>
        <div className="text-xs text-[#7d8590]">{label}</div>
        {sub && <div className="text-[10px] text-[#484f58] mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const { watchlist, toggle: toggleWatch } = useWatchlist();
  const [result, setResult] = useState<ScreenerResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signal, setSignal] = useState('Alle');
  const [sectorFilter, setSectorFilter] = useState('Alle');
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'screener' | 'watchlist'>('screener');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/screen');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResult(data);
      trackUsage('screenerLoads');
      if (data.stocks?.length) trackUsage('summaries', Math.min(8, data.stocks.length));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function goToSearch() {
    const t = search.trim().toUpperCase();
    if (t) router.push(`/stock/${t}`);
  }

  const stocks = result?.stocks ?? [];
  const sectors = ['Alle', ...Array.from(new Set(stocks.map((s) => s.sector))).filter(Boolean).sort()];
  const sectorCounts: Record<string, number> = { Alle: stocks.length };
  for (const s of stocks) sectorCounts[s.sector] = (sectorCounts[s.sector] ?? 0) + 1;

  const baseStocks = tab === 'watchlist' ? stocks.filter((s) => watchlist.has(s.ticker)) : stocks;

  const filtered: ScreenedStock[] = baseStocks.filter((s) => {
    if (signal !== 'Alle' && s.signal !== signal) return false;
    if (sectorFilter !== 'Alle' && s.sector !== sectorFilter) return false;
    if (search && !s.ticker.includes(search.toUpperCase()) && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const strongBuy = stocks.filter((s) => s.signal === 'STRONG_BUY').length;
  const buy = stocks.filter((s) => s.signal === 'BUY').length;
  const avgScore = stocks.length ? Math.round(stocks.reduce((a, b) => a + b.score.total, 0) / stocks.length) : 0;
  const topMover = stocks[0];

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <Header updatedAt={result?.updatedAt} onRefresh={load} isLoading={loading} />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-5">

        {/* Title + search */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-[#e6edf3]">Top Mover — Heute</h2>
            <p className="text-sm text-[#7d8590] mt-1 max-w-xl">
              KI-Screener für 1–14 Tage · Nur auf LS Exchange handelbare Aktien (Trade Republic)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 focus-within:border-[#58a6ff]/60 transition-colors">
              <Search className="w-4 h-4 text-[#7d8590] shrink-0" />
              <input
                type="text"
                placeholder="Ticker (z.B. ONSEMI)"
                value={search}
                onChange={(e) => setSearch(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && goToSearch()}
                className="bg-transparent text-sm text-[#e6edf3] placeholder-[#484f58] outline-none w-40"
              />
            </div>
            <button
              onClick={goToSearch}
              className="px-3 py-2 bg-[#238636] hover:bg-[#2ea043] text-white text-sm rounded-lg transition-colors font-medium"
            >
              Analysieren
            </button>
          </div>
        </div>

        {/* Stats */}
        {result && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Kandidaten" value={stocks.length} color="bg-[#bc8cff]/15"
              icon={<BarChart2 className="w-4 h-4 text-[#bc8cff]" />} />
            <StatCard label="Strong Buy" value={strongBuy} sub="Score ≥ 65" color="bg-[#3fb950]/15"
              icon={<TrendingUp className="w-4 h-4 text-[#3fb950]" />} />
            <StatCard label="Buy" value={buy} sub="Score 40–64" color="bg-[#58a6ff]/15"
              icon={<Zap className="w-4 h-4 text-[#58a6ff]" />} />
            <StatCard label="Watchlist" value={watchlist.size} sub="Gemerkte Aktien" color="bg-[#d29922]/15"
              icon={<Star className="w-4 h-4 text-[#d29922]" />} />
          </div>
        )}

        {/* Top pick */}
        {topMover && !loading && (
          <div className="bg-gradient-to-r from-[#3fb950]/8 to-transparent border border-[#3fb950]/25 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#3fb950]/15 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[#3fb950]" />
              </div>
              <div>
                <div className="text-[10px] text-[#3fb950] font-bold uppercase tracking-widest">Top Pick heute</div>
                <div className="font-bold text-[#e6edf3] text-sm">{topMover.ticker} — {topMover.name}</div>
                <div className="text-[11px] text-[#7d8590]">
                  Score {topMover.score.total}/100 ·{' '}
                  <span className="text-[#3fb950]">+{topMover.change1d.toFixed(1)}%</span> ·{' '}
                  {topMover.volumeRatio.toFixed(1)}x Volumen · {topMover.sector}
                </div>
              </div>
            </div>
            <a href={`/stock/${topMover.ticker}`} className="text-xs text-[#58a6ff] hover:underline">
              Vollständige Analyse →
            </a>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-[#161b22] border border-[#30363d] rounded-lg p-1 w-fit">
          <button onClick={() => setTab('screener')}
            className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors',
              tab === 'screener' ? 'bg-[#30363d] text-[#e6edf3]' : 'text-[#7d8590] hover:text-[#e6edf3]')}>
            <BarChart2 className="w-3.5 h-3.5" /> Screener
          </button>
          <button onClick={() => setTab('watchlist')}
            className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors',
              tab === 'watchlist' ? 'bg-[#30363d] text-[#e6edf3]' : 'text-[#7d8590] hover:text-[#e6edf3]')}>
            <Bookmark className="w-3.5 h-3.5" /> Watchlist
            {watchlist.size > 0 && <span className="bg-[#d29922]/20 text-[#d29922] text-[9px] px-1.5 py-0.5 rounded-full font-bold">{watchlist.size}</span>}
          </button>
        </div>

        {/* Filters */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-[#7d8590]">
              <Filter className="w-3.5 h-3.5" /> Signal:
            </div>
            {SIGNALS.map((s) => (
              <button key={s} onClick={() => setSignal(s)}
                className={clsx('text-xs px-2.5 py-1.5 rounded-md border transition-colors',
                  signal === s ? 'border-[#58a6ff]/60 bg-[#58a6ff]/15 text-[#58a6ff]'
                               : 'border-[#30363d] text-[#7d8590] hover:border-[#484f58] hover:text-[#e6edf3]'
                )}>
                {SIGNAL_LABELS[s]}
                {s !== 'Alle' && result && (
                  <span className="ml-1 opacity-50">({stocks.filter((x) => x.signal === s).length})</span>
                )}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-1 bg-[#161b22] border border-[#30363d] rounded-lg p-1">
              <button onClick={() => setView('grid')}
                className={clsx('p-1.5 rounded transition-colors', view === 'grid' ? 'bg-[#30363d] text-[#e6edf3]' : 'text-[#7d8590] hover:text-[#e6edf3]')}>
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setView('table')}
                className={clsx('p-1.5 rounded transition-colors', view === 'table' ? 'bg-[#30363d] text-[#e6edf3]' : 'text-[#7d8590] hover:text-[#e6edf3]')}>
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          {tab === 'screener' && stocks.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-[#7d8590]">Sektor:</span>
              {sectors.map((s) => (
                <button key={s} onClick={() => setSectorFilter(s)}
                  className={clsx('text-xs px-2.5 py-1 rounded-full border transition-all',
                    sectorFilter === s ? 'border-[#58a6ff]/60 bg-[#58a6ff]/15 text-[#58a6ff]'
                                       : 'border-[#30363d] text-[#7d8590] hover:border-[#484f58] hover:text-[#e6edf3]'
                  )}>
                  {s} <span className="opacity-50">({sectorCounts[s] ?? 0})</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-xl h-64 animate-pulse" />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 bg-[#f85149]/8 border border-[#f85149]/30 rounded-xl p-4 text-sm text-[#f85149]">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <strong>Fehler:</strong> {error}
              <button onClick={load} className="ml-3 underline">Nochmal</button>
            </div>
          </div>
        )}

        {/* Watchlist empty */}
        {!loading && tab === 'watchlist' && watchlist.size === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-[#7d8590]">
            <Star className="w-12 h-12 mb-3 opacity-20" />
            <p className="font-medium text-[#e6edf3]">Watchlist ist leer</p>
            <p className="text-sm mt-1">Klicke auf das ★-Symbol auf einer Aktie, um sie zu merken</p>
            <button onClick={() => setTab('screener')} className="mt-3 text-sm text-[#58a6ff] hover:underline">
              Zum Screener
            </button>
          </div>
        )}

        {/* Empty filter */}
        {!loading && !error && filtered.length === 0 && (tab === 'screener' ? stocks.length > 0 : watchlist.size > 0) && (
          <div className="flex flex-col items-center justify-center py-12 text-[#7d8590]">
            <Filter className="w-10 h-10 mb-3 opacity-30" />
            <p className="font-medium">Keine Aktien für diesen Filter</p>
            <button onClick={() => { setSignal('Alle'); setSectorFilter('Alle'); }}
              className="mt-2 text-sm text-[#58a6ff] hover:underline">Filter zurücksetzen</button>
          </div>
        )}

        {/* No results at all */}
        {!loading && !error && tab === 'screener' && stocks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-[#7d8590]">
            <RefreshCw className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-medium">Keine Ergebnisse — Markt lädt</p>
            <button onClick={load} className="mt-3 px-4 py-2 bg-[#238636] text-white text-sm rounded-lg hover:bg-[#2ea043]">
              Nochmal laden
            </button>
          </div>
        )}

        {/* Results */}
        {!loading && filtered.length > 0 && (
          <>
            <div className="text-xs text-[#7d8590]">
              {filtered.length} Aktie{filtered.length !== 1 ? 'n' : ''} {tab === 'watchlist' ? 'auf deiner Watchlist' : 'gefunden'}
            </div>
            {view === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((stock, i) => (
                  <StockCard
                    key={stock.ticker}
                    stock={stock}
                    rank={i + 1}
                    isWatched={watchlist.has(stock.ticker)}
                    onToggleWatch={toggleWatch}
                  />
                ))}
              </div>
            ) : (
              <StockTable stocks={filtered} watchlist={watchlist} onToggleWatch={toggleWatch} />
            )}
          </>
        )}

        <p className="text-[10px] text-[#484f58] text-center pb-4">
          Keine Anlageberatung. Kurse können verzögert sein. Daten: Yahoo Finance · KI: Groq/Llama
        </p>
      </main>
      <ApiUsage />
    </div>
  );
}
