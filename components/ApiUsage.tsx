'use client';

import { useState, useEffect } from 'react';
import { Activity, ChevronDown, ChevronUp } from 'lucide-react';

interface Usage {
  date: string;
  analyses: number;    // full AI analysis (llama-3.3-70b, limit ~1000/day)
  summaries: number;   // brief summaries (llama-3.1-8b, limit ~14400/day)
  screenerLoads: number;
}

const today = () => new Date().toISOString().split('T')[0];

export function getUsage(): Usage {
  if (typeof window === 'undefined') return { date: today(), analyses: 0, summaries: 0, screenerLoads: 0 };
  try {
    const raw = localStorage.getItem('api_usage');
    const stored: Usage = raw ? JSON.parse(raw) : {};
    if (stored.date !== today()) return { date: today(), analyses: 0, summaries: 0, screenerLoads: 0 };
    return stored;
  } catch { return { date: today(), analyses: 0, summaries: 0, screenerLoads: 0 }; }
}

export function trackUsage(type: keyof Omit<Usage, 'date'>, delta = 1) {
  if (typeof window === 'undefined') return;
  try {
    const usage = getUsage();
    usage[type] = (usage[type] ?? 0) + delta;
    localStorage.setItem('api_usage', JSON.stringify(usage));
  } catch { /* ignore */ }
}

function UsageBar({ used, limit, color }: { used: number; limit: number; color: string }) {
  const pct = Math.min(100, (used / limit) * 100);
  const warn = pct > 70;
  return (
    <div className="h-1 bg-[#21262d] rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${warn ? 'bg-[#d29922]' : color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function ApiUsage() {
  const [usage, setUsage] = useState<Usage>({ date: today(), analyses: 0, summaries: 0, screenerLoads: 0 });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setUsage(getUsage());
    const interval = setInterval(() => setUsage(getUsage()), 10000);
    return () => clearInterval(interval);
  }, []);

  const analysesLeft = Math.max(0, 1000 - usage.analyses);
  const summariesLeft = Math.max(0, 14400 - usage.summaries);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#7d8590] hover:border-[#484f58] hover:text-[#e6edf3] transition-colors shadow-lg"
      >
        <Activity className="w-3.5 h-3.5 text-[#3fb950]" />
        API
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
      </button>

      {open && (
        <div className="absolute bottom-10 right-0 w-64 bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-xl space-y-4">
          <div className="text-xs font-semibold text-[#e6edf3] flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-[#3fb950]" />
            API-Nutzung heute
          </div>

          {/* Groq llama-3.3-70b */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px]">
              <span className="text-[#7d8590]">Groq — KI-Analysen</span>
              <span className={usage.analyses > 800 ? 'text-[#d29922]' : 'text-[#e6edf3]'}>
                {usage.analyses} / 1 000
              </span>
            </div>
            <UsageBar used={usage.analyses} limit={1000} color="bg-[#3fb950]" />
            <div className="text-[9px] text-[#484f58]">{analysesLeft} Analysen übrig (llama-3.3-70b)</div>
          </div>

          {/* Groq llama-3.1-8b */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px]">
              <span className="text-[#7d8590]">Groq — Kurz-Zusammenfassung</span>
              <span className={usage.summaries > 12000 ? 'text-[#d29922]' : 'text-[#e6edf3]'}>
                {usage.summaries} / 14 400
              </span>
            </div>
            <UsageBar used={usage.summaries} limit={14400} color="bg-[#58a6ff]" />
            <div className="text-[9px] text-[#484f58]">{summariesLeft} übrig (llama-3.1-8b)</div>
          </div>

          {/* Yahoo Finance */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px]">
              <span className="text-[#7d8590]">Yahoo Finance</span>
              <span className="text-[#3fb950]">Aktiv</span>
            </div>
            <div className="text-[9px] text-[#484f58]">
              {usage.screenerLoads} Screener-Ladevorgänge · Kein offizielles Limit
            </div>
          </div>

          {/* Finnhub */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px]">
              <span className="text-[#7d8590]">Finnhub (Fallback)</span>
              <span className="text-[#3fb950]">Aktiv</span>
            </div>
            <div className="text-[9px] text-[#484f58]">
              Fallback für Kurse &amp; News · Free Tier: 60 Anfragen/min
            </div>
          </div>

          <div className="pt-1 border-t border-[#30363d] text-[9px] text-[#484f58]">
            Zähler wird täglich um Mitternacht zurückgesetzt
          </div>
        </div>
      )}
    </div>
  );
}
