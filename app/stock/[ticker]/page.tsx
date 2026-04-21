'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Globe, Users, TrendingUp, TrendingDown, ExternalLink, Zap, AlertCircle } from 'lucide-react';
import { PriceChart } from '@/components/PriceChart';
import { NewsSection } from '@/components/NewsSection';
import { AIAnalysis } from '@/components/AIAnalysis';
import { Header } from '@/components/Header';
import { buildWhyText } from '@/lib/screener-client';
import type { StockDetail } from '@/lib/types';
import { clsx } from 'clsx';

function MetricCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-[#0d1117] rounded-lg p-3">
      <div className="text-xs text-[#7d8590] mb-1">{label}</div>
      <div className={clsx('font-semibold text-sm', highlight ? 'text-[#3fb950]' : 'text-[#e6edf3]')}>{value}</div>
    </div>
  );
}

function fmt(n?: number) {
  if (!n) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  return `$${(n / 1e6).toFixed(0)}M`;
}

export default function StockPage() {
  const params = useParams();
  const ticker = (params.ticker as string).toUpperCase();
  const [stock, setStock] = useState<StockDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    fetch(`/api/stock/${ticker}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.error || !d?.price) { setNotFound(true); return; }
        setStock(d);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [ticker]);

  const price = stock?.price ?? 0;
  const change1d = stock?.change1d ?? 0;
  const isPos = change1d >= 0;
  const whyText = stock ? buildWhyText(stock) : '';

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-5">

        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#7d8590] hover:text-[#e6edf3] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Zurück zum Screener
        </Link>

        {loading && (
          <div className="space-y-4">
            {[220, 100, 380].map((h, i) => (
              <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-xl animate-pulse" style={{ height: h }} />
            ))}
          </div>
        )}

        {notFound && (
          <div className="flex flex-col items-center gap-3 py-20 text-[#7d8590]">
            <AlertCircle className="w-12 h-12 opacity-40" />
            <p className="font-medium text-[#e6edf3]">Aktie „{ticker}" nicht gefunden</p>
            <p className="text-sm">Ticker prüfen oder zurück zum Screener</p>
            <Link href="/" className="mt-2 px-4 py-2 bg-[#238636] text-white text-sm rounded-lg hover:bg-[#2ea043]">
              Zurück
            </Link>
          </div>
        )}

        {!loading && stock && (
          <>
            {/* Header Card */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-[#e6edf3]">{ticker}</h1>
                    {stock.website && (
                      <a href={stock.website} target="_blank" rel="noopener noreferrer"
                        className="text-[#7d8590] hover:text-[#58a6ff] transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                  <p className="text-[#7d8590] text-sm mt-0.5">{stock.name}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[stock.sector, stock.industry, stock.country].filter(Boolean).map((tag) => (
                      <span key={tag} className="text-[10px] border border-[#30363d] bg-[#0d1117] px-2 py-0.5 rounded text-[#7d8590]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-[#e6edf3]">${price.toFixed(2)}</div>
                  <div className={clsx('flex items-center gap-1.5 justify-end mt-1 text-lg font-semibold', isPos ? 'text-[#3fb950]' : 'text-[#f85149]')}>
                    {isPos ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    {isPos ? '+' : ''}{change1d.toFixed(2)}% heute
                  </div>
                </div>
              </div>

              {/* Why this stock */}
              {whyText && (
                <div className="mt-4 flex items-start gap-2 bg-[#3fb950]/8 border border-[#3fb950]/20 rounded-lg px-3 py-2.5">
                  <Zap className="w-4 h-4 text-[#3fb950] shrink-0 mt-0.5" />
                  <p className="text-sm text-[#8b949e]">
                    <span className="text-[#3fb950] font-medium">Warum interessant: </span>
                    {whyText}
                  </p>
                </div>
              )}

              {/* Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <MetricCard label="5 Tage" value={`${(stock.change5d ?? 0) >= 0 ? '+' : ''}${(stock.change5d ?? 0).toFixed(2)}%`}
                  highlight={(stock.change5d ?? 0) > 0} />
                <MetricCard label="20 Tage" value={`${(stock.change20d ?? 0) >= 0 ? '+' : ''}${(stock.change20d ?? 0).toFixed(2)}%`}
                  highlight={(stock.change20d ?? 0) > 0} />
                <MetricCard label="Volumen-Ratio" value={`${(stock.volumeRatio ?? 1).toFixed(1)}x`} />
                <MetricCard label="Marktkapitalisierung" value={fmt(stock.marketCap)} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                <MetricCard label="52W Hoch" value={stock.weekHigh52 ? `$${stock.weekHigh52.toFixed(2)}` : '—'} />
                <MetricCard label="52W Tief" value={stock.weekLow52 ? `$${stock.weekLow52.toFixed(2)}` : '—'} />
                <MetricCard label="KGV (Trailing)" value={stock.pe ? stock.pe.toFixed(1) : '—'} />
                {stock.employees ? (
                  <div className="bg-[#0d1117] rounded-lg p-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#7d8590]" />
                    <div>
                      <div className="text-xs text-[#7d8590]">Mitarbeiter</div>
                      <div className="font-semibold text-[#e6edf3] text-sm">{stock.employees.toLocaleString('de-DE')}</div>
                    </div>
                  </div>
                ) : (
                  <MetricCard label="Sektor" value={stock.sector ?? '—'} />
                )}
              </div>

              {/* Analyst bar */}
              {stock.analystRating && (
                <div className="mt-4 pt-4 border-t border-[#30363d]">
                  <p className="text-xs text-[#7d8590] mb-2">Analysten-Konsens</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 flex rounded overflow-hidden h-2">
                      {(() => {
                        const total = (stock.analystRating.buy ?? 0) + (stock.analystRating.hold ?? 0) + (stock.analystRating.sell ?? 0);
                        if (!total) return null;
                        return <>
                          <div style={{ width: `${(stock.analystRating.buy / total) * 100}%` }} className="bg-[#3fb950]" />
                          <div style={{ width: `${(stock.analystRating.hold / total) * 100}%` }} className="bg-[#d29922]" />
                          <div style={{ width: `${(stock.analystRating.sell / total) * 100}%` }} className="bg-[#f85149]" />
                        </>;
                      })()}
                    </div>
                    <span className="text-xs text-[#3fb950]">{stock.analystRating.buy} Buy</span>
                    <span className="text-xs text-[#d29922]">{stock.analystRating.hold} Hold</span>
                    <span className="text-xs text-[#f85149]">{stock.analystRating.sell} Sell</span>
                  </div>
                </div>
              )}
            </div>

            {/* Chart */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
              <PriceChart history={stock.history ?? []} ticker={ticker} />
            </div>

            {/* AI Analysis */}
            <div>
              <h3 className="text-sm font-semibold text-[#e6edf3] mb-2">KI-Analyse (kostenlos via Groq)</h3>
              <AIAnalysis ticker={ticker} />
            </div>

            {/* Description */}
            {stock.description && (
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
                <h3 className="text-sm font-semibold text-[#e6edf3] mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#7d8590]" /> Über das Unternehmen
                </h3>
                <p className="text-sm text-[#8b949e] leading-relaxed line-clamp-5">{stock.description}</p>
              </div>
            )}

            {/* News */}
            <div>
              <h3 className="text-sm font-semibold text-[#e6edf3] mb-2">Aktuelle News (14 Tage)</h3>
              <NewsSection news={stock.news ?? []} />
            </div>
          </>
        )}

        <p className="text-[10px] text-[#484f58] text-center pb-4">
          Keine Anlageberatung. Kurse können verzögert sein.
        </p>
      </main>
    </div>
  );
}
