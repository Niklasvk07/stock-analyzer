'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { HistoryPoint } from '@/lib/types';

interface Props {
  history: HistoryPoint[];
  ticker: string;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-xs shadow-xl">
      <div className="text-[#7d8590] mb-1">{label}</div>
      <div className="font-bold text-[#e6edf3]">${payload[0].value.toFixed(2)}</div>
    </div>
  );
}

export function PriceChart({ history, ticker }: Props) {
  if (!history.length) return (
    <div className="flex items-center justify-center h-48 text-[#7d8590] text-sm">
      Keine Kursdaten verfügbar
    </div>
  );

  const first = history[0].close;
  const last = history[history.length - 1].close;
  const isPositive = last >= first;
  const color = isPositive ? '#3fb950' : '#f85149';

  const data = history.map((h) => ({
    date: new Date(h.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
    close: h.close,
    volume: h.volume,
  }));

  const minClose = Math.min(...history.map((h) => h.close)) * 0.98;
  const maxClose = Math.max(...history.map((h) => h.close)) * 1.02;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-[#7d8590]">
        <span>60-Tage Kursverlauf — {ticker}</span>
        <span className={isPositive ? 'text-[#3fb950]' : 'text-[#f85149]'}>
          {isPositive ? '+' : ''}{(((last - first) / first) * 100).toFixed(1)}% (60T)
        </span>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${ticker}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fill: '#7d8590', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[minClose, maxClose]}
            tick={{ fill: '#7d8590', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `$${v.toFixed(0)}`}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="close"
            stroke={color}
            strokeWidth={2}
            fill={`url(#grad-${ticker})`}
            dot={false}
            activeDot={{ r: 4, fill: color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
