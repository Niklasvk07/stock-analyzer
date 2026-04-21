'use client';

import { useState } from 'react';
import { Sparkles, Loader2, ChevronDown } from 'lucide-react';

interface Props {
  ticker: string;
  preloaded?: string;
}

export function AIAnalysis({ ticker, preloaded }: Props) {
  const [analysis, setAnalysis] = useState<string | null>(preloaded ?? null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function load() {
    if (analysis) { setExpanded(!expanded); return; }
    setLoading(true);
    setExpanded(true);
    try {
      const res = await fetch(`/api/analyze/${ticker}`);
      const data = await res.json();
      setAnalysis(data.analysis ?? data.error ?? 'Analyse nicht verfügbar.');
    } catch {
      setAnalysis('Fehler beim Laden der Analyse.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#0d1117] border border-[#30363d] rounded-xl overflow-hidden">
      <button
        onClick={load}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#161b22] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#bc8cff]" />
          <span className="font-semibold text-sm text-[#e6edf3]">KI-Analyse (Claude)</span>
          {!analysis && !loading && (
            <span className="text-[10px] bg-[#bc8cff]/20 text-[#bc8cff] border border-[#bc8cff]/30 rounded px-1.5 py-0.5">
              Klicken zum Laden
            </span>
          )}
        </div>
        {loading ? (
          <Loader2 className="w-4 h-4 text-[#bc8cff] animate-spin" />
        ) : (
          <ChevronDown className={`w-4 h-4 text-[#7d8590] transition-transform ${expanded ? 'rotate-180' : ''}`} />
        )}
      </button>

      {expanded && (
        <div className="border-t border-[#30363d] px-4 py-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-[#7d8590]">
              <Loader2 className="w-4 h-4 animate-spin" />
              Claude analysiert …
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              {analysis?.split('\n').filter(Boolean).map((para, i) => {
                const isBold = para.startsWith('**') || para.startsWith('#');
                return (
                  <p
                    key={i}
                    className={`text-sm leading-relaxed mb-3 last:mb-0 ${
                      isBold ? 'font-semibold text-[#e6edf3]' : 'text-[#8b949e]'
                    }`}
                  >
                    {para.replace(/\*\*/g, '')}
                  </p>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
