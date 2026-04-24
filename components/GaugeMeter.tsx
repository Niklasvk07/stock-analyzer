'use client';

function arc(cx: number, cy: number, r: number, from: number, to: number) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const x1 = cx + r * Math.cos(rad(from));
  const y1 = cy - r * Math.sin(rad(from));
  const x2 = cx + r * Math.cos(rad(to));
  const y2 = cy - r * Math.sin(rad(to));
  const sweep = from - to > 180 ? 1 : 0;
  return `M${x1.toFixed(2)} ${y1.toFixed(2)} A${r} ${r} 0 ${sweep} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

export function GaugeMeter({ score }: { score: number }) {
  const cx = 50, cy = 48, r = 34, nLen = 25;
  const rad = (d: number) => (d * Math.PI) / 180;
  const angle = 180 - (score / 100) * 180;
  const nx = cx + nLen * Math.cos(rad(angle));
  const ny = cy - nLen * Math.sin(rad(angle));

  const label = score >= 65 ? 'KAUFEN' : score >= 40 ? 'HALTEN' : 'VERKAUFEN';
  const color = score >= 65 ? '#3fb950' : score >= 40 ? '#d29922' : '#f85149';

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 100 56" className="w-[90px]">
        {/* Track */}
        <path d={arc(cx, cy, r, 180, 0)} fill="none" stroke="#21262d" strokeWidth="9" />
        {/* Red zone */}
        <path d={arc(cx, cy, r, 180, 120)} fill="none" stroke="#f85149" strokeWidth="9" opacity="0.85" />
        {/* Yellow zone */}
        <path d={arc(cx, cy, r, 120, 60)} fill="none" stroke="#d29922" strokeWidth="9" opacity="0.85" />
        {/* Green zone */}
        <path d={arc(cx, cy, r, 60, 0)} fill="none" stroke="#3fb950" strokeWidth="9" opacity="0.85" />
        {/* Needle */}
        <line
          x1={cx} y1={cy}
          x2={nx.toFixed(2)} y2={ny.toFixed(2)}
          stroke={color} strokeWidth="2.5" strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="3.5" fill="#161b22" stroke={color} strokeWidth="2" />
      </svg>
      <span className="text-[10px] font-bold tracking-wider -mt-1" style={{ color }}>{label}</span>
    </div>
  );
}
