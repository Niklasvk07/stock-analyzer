'use client';

import { TrendingUp, RefreshCw, Info } from 'lucide-react';

interface HeaderProps {
  updatedAt?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function Header({ updatedAt, onRefresh, isLoading }: HeaderProps) {
  const timeStr = updatedAt
    ? new Date(updatedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <header className="border-b border-[#30363d] bg-[#161b22]/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-green/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-[#3fb950]" />
            </div>
            <div>
              <h1 className="font-bold text-[#e6edf3] leading-none">TopMover</h1>
              <p className="text-[10px] text-[#7d8590] mt-0.5">Aktien-Scanner & KI-Analyse</p>
            </div>
          </div>
          <span className="hidden sm:block ml-3 text-xs text-[#7d8590] border border-[#30363d] rounded px-2 py-0.5 bg-[#0d1117]">
            Kurzfrist-Fokus: 1–14 Tage
          </span>
        </div>

        <div className="flex items-center gap-3">
          {timeStr && (
            <span className="text-xs text-[#7d8590]">
              Aktualisiert: <span className="text-[#e6edf3]">{timeStr}</span>
            </span>
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-[#30363d] hover:border-[#3fb950]/50 hover:text-[#3fb950] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          )}
          <div className="group relative">
            <Info className="w-4 h-4 text-[#7d8590] cursor-help" />
            <div className="absolute right-0 top-6 w-64 bg-[#161b22] border border-[#30363d] rounded-lg p-3 text-xs text-[#7d8590] hidden group-hover:block z-50 shadow-xl">
              Scores basieren auf Momentum, Volumen-Surge, Sektor-Stärke und News-Katalysatoren. Keine Anlageberatung.
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
