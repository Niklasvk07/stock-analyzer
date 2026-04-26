'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FeaturedCard, StockCard } from '@/components/StockCard';
import { DetailDrawer } from '@/components/DetailDrawer';
import {
  Search, RefreshCw, TrendingUp, Zap, Star,
  BarChart2, Scan, Bookmark, Activity, SlidersHorizontal, X,
} from 'lucide-react';
import type { ScreenerResult, ScreenedStock } from '@/lib/types';

// ── Watchlist ──────────────────────────────────────────────────────────────
function useWatchlist() {
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  useEffect(() => {
    try { const s = localStorage.getItem('watchlist'); if (s) setWatchlist(new Set(JSON.parse(s))); } catch { /**/ }
  }, []);
  const toggle = useCallback((t: string) => {
    setWatchlist((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t); else next.add(t);
      try { localStorage.setItem('watchlist', JSON.stringify([...next])); } catch { /**/ }
      return next;
    });
  }, []);
  return { watchlist, toggle };
}

// ── API Usage (sidebar + mobile panel) ────────────────────────────────────
function ApiUsagePanel() {
  function Bar({ used, limit, color }: { used: number; limit: number; color: string }) {
    const pct = Math.min(100, (used / limit) * 100);
    return (
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct > 80 ? '#f59e0b' : color }} />
      </div>
    );
  }

  const rows = [
    { label: 'Groq Analysen', used: 0, limit: 1000, color: '#4ade80', sub: 'Llama 3.3 70B · 1.000/Tag' },
    { label: 'Groq Kurzfassung', used: 0, limit: 14400, color: '#38bdf8', sub: 'Llama 3.1 8B · 14.400/Tag' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[9px] uppercase tracking-[0.08em] mb-2 font-medium" style={{ color: 'var(--text-dimmer)' }}>Groq (KI-Analyse)</p>
        {rows.map((r) => (
          <div key={r.label} className="mb-2.5">
            <div className="flex justify-between text-[10px] mb-1">
              <span style={{ color: 'var(--text-dim)' }}>{r.label}</span>
              <span className="font-mono" style={{ color: r.color }}>{r.used}/{r.limit.toLocaleString('de-DE')}</span>
            </div>
            <Bar used={r.used} limit={r.limit} color={r.color} />
            <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-dimmer)' }}>{r.sub}</p>
          </div>
        ))}
      </div>
      <div>
        <p className="text-[9px] uppercase tracking-[0.08em] mb-2 font-medium" style={{ color: 'var(--text-dimmer)' }}>Datenquellen</p>
        {[
          { name: 'Yahoo Finance', desc: 'Kurse, Screener · Kein offizielles Limit', color: '#4ade80' },
          { name: 'Finnhub', desc: 'News, Analystenbewertungen · 60 Req/Min', color: '#4ade80' },
        ].map((api) => (
          <div key={api.name} className="flex items-start justify-between mb-2">
            <div>
              <p className="text-[10px] font-medium" style={{ color: 'var(--text-dim)' }}>{api.name}</p>
              <p className="text-[9px]" style={{ color: 'var(--text-dimmer)' }}>{api.desc}</p>
            </div>
            <span className="text-[9px] font-bold mt-0.5" style={{ color: api.color }}>Aktiv</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const ALL_SECTORS = 'Alle';
const SIGNALS = ['Alle', 'STRONG_BUY', 'BUY', 'WATCH'] as const;
const SIGNAL_DOT: Record<string, string> = { Alle: 'rgba(255,255,255,0.30)', STRONG_BUY: '#f59e0b', BUY: '#38bdf8', WATCH: 'rgba(255,255,255,0.30)' };
const SIGNAL_LABEL: Record<string, string> = { Alle: 'Alle Signale', STRONG_BUY: 'Strong Buy', BUY: 'Buy', WATCH: 'Watch' };

export default function Dashboard() {
  const router = useRouter();
  const { watchlist, toggle: toggleWatch } = useWatchlist();

  const [result, setResult] = useState<ScreenerResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [signal, setSignal] = useState<string>('Alle');
  const [sector, setSector] = useState(ALL_SECTORS);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'screener' | 'watchlist'>('screener');
  const [moreOpen, setMoreOpen] = useState(false);  // mobile panel
  const [selected, setSelected] = useState<ScreenedStock | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/screen');
      setResult(await res.json());
    } catch { /**/ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function goSearch() {
    const t = search.trim().toUpperCase();
    if (t) router.push(`/stock/${t}`);
  }

  const stocks = result?.stocks ?? [];
  const sectors = [ALL_SECTORS, ...Array.from(new Set(stocks.map((s) => s.sector))).filter(Boolean).sort()];
  const sectorCounts: Record<string, number> = { [ALL_SECTORS]: stocks.length };
  for (const s of stocks) sectorCounts[s.sector] = (sectorCounts[s.sector] ?? 0) + 1;

  const baseStocks = tab === 'watchlist' ? stocks.filter((s) => watchlist.has(s.ticker)) : stocks;
  const filtered = baseStocks.filter((s) => {
    if (signal !== 'Alle' && s.signal !== signal) return false;
    if (sector !== ALL_SECTORS && s.sector !== sector) return false;
    return true;
  });

  const strongBuys = filtered.filter((s) => s.signal === 'STRONG_BUY');
  const others = filtered.filter((s) => s.signal !== 'STRONG_BUY');

  // ── Sidebar ──────────────────────────────────────────────────────────────
  const sidebar = (
    <aside className="hidden md:flex flex-col gap-0 px-4 py-5 shrink-0 overflow-y-auto"
      style={{ width: 220, position: 'sticky', top: 56, height: 'calc(100vh - 56px)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

      <div className="mb-5">
        <p className="text-[9px] uppercase tracking-[0.08em] mb-2" style={{ color: 'var(--text-dimmer)' }}>Signal</p>
        <div className="space-y-0.5">
          {SIGNALS.map((s) => (
            <button key={s} onClick={() => setSignal(s)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors"
              style={{ background: signal === s ? 'rgba(255,255,255,0.06)' : 'transparent', color: signal === s ? '#fff' : 'var(--text-dim)' }}>
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: SIGNAL_DOT[s] }} />
              {SIGNAL_LABEL[s]}
              <span className="ml-auto font-mono text-[10px]" style={{ color: 'var(--text-dimmer)' }}>
                {s === 'Alle' ? stocks.length : stocks.filter((x) => x.signal === s).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <p className="text-[9px] uppercase tracking-[0.08em] mb-2" style={{ color: 'var(--text-dimmer)' }}>Sektor</p>
        <div className="space-y-0.5">
          {sectors.map((s) => (
            <button key={s} onClick={() => setSector(s)}
              className="w-full flex items-center px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors truncate"
              style={{ background: sector === s ? 'rgba(255,255,255,0.06)' : 'transparent', color: sector === s ? '#fff' : 'var(--text-dim)' }}>
              <span className="truncate">{s === ALL_SECTORS ? 'Alle Sektoren' : s}</span>
              <span className="ml-auto font-mono text-[10px] pl-1 shrink-0" style={{ color: 'var(--text-dimmer)' }}>{sectorCounts[s] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      {/* API Usage */}
      <div className="mt-auto pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-[9px] uppercase tracking-[0.08em] mb-3 flex items-center gap-1.5" style={{ color: 'var(--text-dimmer)' }}>
          <Activity className="w-3 h-3" /> API-Nutzung
        </p>
        <ApiUsagePanel />
      </div>
    </aside>
  );

  // ── Navbar ────────────────────────────────────────────────────────────────
  const navbar = (
    <header className="sticky top-0 z-30 flex items-center justify-between px-5"
      style={{ height: 56, background: 'rgba(9,11,22,0.90)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="flex items-center gap-2.5">
        <div className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)', boxShadow: '0 0 16px rgba(245,158,11,0.30)' }}>
          <TrendingUp className="w-4 h-4 text-black" />
        </div>
        <div>
          <div className="font-space font-bold text-[15px] leading-none">TopMover</div>
          <div className="text-[9px] leading-none mt-0.5" style={{ color: 'var(--text-dimmer)' }}>LS Exchange · 1–14 Tage</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Search className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-dim)' }} />
          <input placeholder="Ticker suchen…" value={search}
            onChange={(e) => setSearch(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && goSearch()}
            className="bg-transparent outline-none w-36 text-sm placeholder:text-white/20" />
        </div>
        <button onClick={goSearch}
          className="px-3.5 py-1.5 rounded-[9px] text-sm font-semibold text-black transition-all"
          style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)', boxShadow: '0 4px 16px rgba(245,158,11,0.25)' }}>
          Analysieren
        </button>
      </div>
    </header>
  );

  // ── Section divider ───────────────────────────────────────────────────────
  function SectionDivider({ isStrong, count }: { isStrong: boolean; count: number }) {
    return (
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[9px] font-bold uppercase tracking-[0.10em] shrink-0"
          style={{ color: isStrong ? '#fbbf24' : '#7dd3fc' }}>
          {isStrong ? '✦ STRONG BUY' : '● BUY / WATCH'}
        </span>
        <div className="flex-1 h-px" style={{ background: isStrong ? 'rgba(245,158,11,0.15)' : 'rgba(56,189,248,0.10)' }} />
        <span className="text-[10px] font-mono shrink-0" style={{ color: 'var(--text-dimmer)' }}>{count}</span>
      </div>
    );
  }

  return (
    <>
      {navbar}

      <div className="flex" style={{ minHeight: 'calc(100vh - 56px)' }}>
        {sidebar}

        {/* MAIN — centered within its flex area */}
        <main className="flex-1 min-w-0 py-6">
          <div className="max-w-5xl mx-auto px-5">

            {/* Title row */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="font-space font-bold text-xl tracking-tight flex items-center gap-2">
                  Top Mover
                  <span className="inline-flex items-center gap-1 text-[10px] font-sans font-medium px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(74,222,128,0.10)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.20)' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" /> Live
                  </span>
                </h1>
                <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
                  {result?.updatedAt
                    ? `Zuletzt: ${new Date(result.updatedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr`
                    : 'Lädt…'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Mobile search */}
                <div className="flex sm:hidden items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <Search className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-dim)' }} />
                  <input placeholder="Ticker…" value={search}
                    onChange={(e) => setSearch(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && goSearch()}
                    className="bg-transparent outline-none w-20 text-sm placeholder:text-white/20" />
                </div>
                <button onClick={load} disabled={loading}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'var(--text-dim)' }}>
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>

            {/* Mobile signal filter chips */}
            <div className="flex md:hidden gap-2 overflow-x-auto pb-1 mb-4 scrollbar-hide">
              {SIGNALS.map((s) => (
                <button key={s} onClick={() => setSignal(s)}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                  style={{
                    background: signal === s ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${signal === s ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)'}`,
                    color: signal === s ? '#fff' : 'var(--text-dim)',
                  }}>
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: SIGNAL_DOT[s] }} />
                  {SIGNAL_LABEL[s]}
                  <span className="font-mono text-[10px]" style={{ color: 'var(--text-dimmer)' }}>
                    {s === 'Alle' ? stocks.length : stocks.filter((x) => x.signal === s).length}
                  </span>
                </button>
              ))}
            </div>

            {/* Stats row */}
            {result && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'Kandidaten', value: stocks.length, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.18)', icon: <BarChart2 className="w-4 h-4" /> },
                  { label: 'Strong Buy', value: stocks.filter((s) => s.signal === 'STRONG_BUY').length, color: '#fbbf24', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.12)', icon: <TrendingUp className="w-4 h-4" /> },
                  { label: 'Buy', value: stocks.filter((s) => s.signal === 'BUY').length, color: '#38bdf8', bg: 'rgba(56,189,248,0.06)', border: 'rgba(56,189,248,0.12)', icon: <Zap className="w-4 h-4" /> },
                  { label: 'Watchlist', value: watchlist.size, color: 'rgba(255,255,255,0.50)', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.07)', icon: <Star className="w-4 h-4" /> },
                ].map(({ label, value, color, bg, border, icon }) => (
                  <div key={label} className="rounded-xl px-3.5 py-3" style={{ background: bg, border: `1px solid ${border}` }}>
                    <div className="flex items-center gap-1.5 mb-1" style={{ color }}>{icon}
                      <span className="text-[10px] uppercase tracking-wider">{label}</span>
                    </div>
                    <div className="font-space font-bold text-2xl" style={{ color }}>{value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-[14px] h-52 animate-pulse" style={{ background: 'var(--surface)' }} />
                ))}
              </div>
            )}

            {/* Watchlist empty */}
            {!loading && tab === 'watchlist' && watchlist.size === 0 && (
              <div className="flex flex-col items-center py-20 gap-3" style={{ color: 'var(--text-dim)' }}>
                <Star className="w-12 h-12 opacity-20" />
                <p className="font-medium text-white/60">Watchlist ist leer</p>
                <p className="text-sm">★ auf einer Aktie klicken zum Merken</p>
                <button onClick={() => setTab('screener')} className="text-sm" style={{ color: '#38bdf8' }}>Zum Screener</button>
              </div>
            )}

            {/* Strong Buy */}
            {!loading && strongBuys.length > 0 && (
              <div className="mb-7">
                <SectionDivider isStrong count={strongBuys.length} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {strongBuys.map((s, i) => (
                    <FeaturedCard key={s.ticker} stock={s} rank={i + 1}
                      isWatched={watchlist.has(s.ticker)} onToggleWatch={toggleWatch} onSelect={setSelected} />
                  ))}
                </div>
              </div>
            )}

            {/* Buy / Watch */}
            {!loading && others.length > 0 && (
              <div>
                <SectionDivider isStrong={false} count={others.length} />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {others.map((s, i) => (
                    <StockCard key={s.ticker} stock={s} rank={strongBuys.length + i + 1}
                      isWatched={watchlist.has(s.ticker)} onToggleWatch={toggleWatch} onSelect={setSelected} />
                  ))}
                </div>
              </div>
            )}

            {!loading && filtered.length === 0 && (tab === 'screener' ? stocks.length > 0 : watchlist.size > 0) && (
              <div className="flex flex-col items-center py-16 gap-2" style={{ color: 'var(--text-dim)' }}>
                <p>Keine Aktien für diesen Filter</p>
                <button onClick={() => { setSignal('Alle'); setSector(ALL_SECTORS); }}
                  className="text-sm" style={{ color: '#38bdf8' }}>Filter zurücksetzen</button>
              </div>
            )}

            <p className="text-[10px] text-center mt-8 pb-24 md:pb-6" style={{ color: 'var(--text-dimmer)' }}>
              Keine Anlageberatung · Yahoo Finance · Finnhub · Groq/Llama
            </p>
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex md:hidden"
        style={{ background: 'rgba(9,11,22,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.06)', height: 56 }}>
        {[
          { id: 'screener', label: 'Scanner', icon: <Scan className="w-5 h-5" /> },
          { id: 'watchlist', label: `Watchlist${watchlist.size ? ` (${watchlist.size})` : ''}`, icon: <Bookmark className="w-5 h-5" /> },
          { id: 'mehr', label: 'Filter & API', icon: <SlidersHorizontal className="w-5 h-5" /> },
        ].map(({ id, label, icon }) => (
          <button key={id}
            onClick={() => {
              if (id === 'mehr') { setMoreOpen(true); }
              else { setTab(id as 'screener' | 'watchlist'); }
            }}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors"
            style={{ color: (tab === id || (id === 'mehr' && moreOpen)) ? '#f59e0b' : 'var(--text-dim)' }}>
            {icon}{label}
          </button>
        ))}
      </nav>

      {/* Mobile "Mehr" panel */}
      {moreOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60" style={{ backdropFilter: 'blur(4px)' }} onClick={() => setMoreOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl overflow-y-auto"
            style={{ background: '#111422', border: '1px solid rgba(255,255,255,0.08)', maxHeight: '80vh' }}>
            <div className="flex items-center justify-between px-5 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="font-space font-bold text-base">Filter & API-Nutzung</span>
              <button onClick={() => setMoreOpen(false)} className="p-2 rounded-lg hover:bg-white/5">
                <X className="w-4 h-4" style={{ color: 'var(--text-dim)' }} />
              </button>
            </div>
            <div className="p-5 space-y-5 pb-8">
              {/* Sektor filter */}
              <div>
                <p className="text-[9px] uppercase tracking-[0.08em] mb-2 font-medium" style={{ color: 'var(--text-dimmer)' }}>Sektor</p>
                <div className="flex flex-wrap gap-2">
                  {sectors.map((s) => (
                    <button key={s} onClick={() => { setSector(s); setMoreOpen(false); }}
                      className="text-xs px-3 py-1.5 rounded-full transition-colors"
                      style={{
                        background: sector === s ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${sector === s ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)'}`,
                        color: sector === s ? '#fff' : 'var(--text-dim)',
                      }}>
                      {s === ALL_SECTORS ? 'Alle Sektoren' : s}
                      <span className="ml-1.5 font-mono text-[9px]" style={{ color: 'var(--text-dimmer)' }}>({sectorCounts[s] ?? 0})</span>
                    </button>
                  ))}
                </div>
              </div>
              {/* API usage */}
              <div>
                <p className="text-[9px] uppercase tracking-[0.08em] mb-3 flex items-center gap-1.5 font-medium" style={{ color: 'var(--text-dimmer)' }}>
                  <Activity className="w-3 h-3" /> API-Nutzung
                </p>
                <ApiUsagePanel />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Detail drawer */}
      <DetailDrawer stock={selected} onClose={() => setSelected(null)} />
    </>
  );
}
