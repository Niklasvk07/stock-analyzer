'use client';

export function ScoreArc({ score, size = 52, isStrong = false }: {
  score: number;
  size?: number;
  isStrong?: boolean;
}) {
  const strokeW = 3.5;
  const r = (size - strokeW * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(1, score / 100) * circ;
  const gradId = `arc-grad-${size}-${isStrong ? 's' : 'b'}`;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {isStrong && (
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
        )}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeW}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={isStrong ? `url(#${gradId})` : '#38bdf8'}
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center font-space font-bold"
        style={{
          fontSize: size * 0.28,
          color: isStrong ? '#f59e0b' : '#38bdf8',
        }}
      >
        {score}
      </div>
    </div>
  );
}
