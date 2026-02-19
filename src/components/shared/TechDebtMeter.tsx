interface TechDebtMeterProps {
  value: number; // 0-100
}

function getDebtColor(value: number): string {
  if (value <= 30) return 'text-[--color-retro-green]';
  if (value <= 60) return 'text-[--color-retro-orange]';
  return 'text-[--color-retro-red]';
}

function getDebtProgressBar(value: number): string {
  if (value <= 30) return 'retro-progress-bar retro-progress-bar-green';
  if (value <= 60) return 'retro-progress-bar retro-progress-bar-orange';
  return 'retro-progress-bar retro-progress-bar-red';
}

function getDebtLabel(value: number): string {
  if (value <= 15) return 'Minimal';
  if (value <= 30) return 'Low';
  if (value <= 45) return 'Moderate';
  if (value <= 60) return 'Concerning';
  if (value <= 80) return 'High';
  return 'Critical';
}

export function TechDebtMeter({ value }: TechDebtMeterProps) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const barClass = getDebtProgressBar(clampedValue);
  const textColor = getDebtColor(clampedValue);
  const label = getDebtLabel(clampedValue);

  // SVG semicircle gauge
  const radius = 70;
  const strokeWidth = 12;
  const cx = 80;
  const cy = 80;
  // Semicircle from 180 to 0 degrees (bottom half arc)
  const circumference = Math.PI * radius;
  const fillLength = (clampedValue / 100) * circumference;
  const dashOffset = circumference - fillLength;

  // Color for the arc stroke - retro palette
  const arcStroke = clampedValue <= 30 ? 'var(--color-retro-green)' : clampedValue <= 60 ? 'var(--color-retro-orange)' : 'var(--color-retro-red)';

  return (
    <div className="retro-inset">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="retro-section-heading" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>Tech Debt</h4>
        <div className="group relative">
          <span className="cursor-help text-xs text-[--color-retro-text-light]">[?]</span>
          <div className="pointer-events-none absolute right-0 top-6 z-10 w-56 retro-card text-xs text-[--color-retro-text] opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
            style={{ padding: '8px' }}>
            High tech debt slows development and increases bugs
          </div>
        </div>
      </div>

      {/* Semicircle gauge */}
      <div className="flex flex-col items-center">
        <svg width="160" height="95" viewBox="0 0 160 95">
          {/* Background arc */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="var(--theme-chart-grid)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Filled arc */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke={arcStroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={dashOffset}
            className="transition-all duration-500"
          />
          {/* Zone markers */}
          <text x="6" y="88" fill="var(--color-retro-green)" fontSize="8">0</text>
          <text x="147" y="88" fill="var(--color-retro-red)" fontSize="8">100</text>
        </svg>

        {/* Center value */}
        <div className="-mt-10 text-center">
          <span className={`text-2xl font-bold font-retro-mono ${textColor}`}>
            {clampedValue}
          </span>
          <p className={`text-xs font-bold ${textColor}`}>{label}</p>
        </div>
      </div>

      {/* Linear bar fallback */}
      <div className="mt-3">
        <div className="retro-progress">
          {/* Actual fill */}
          <div
            className={barClass}
            style={{ width: `${clampedValue}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-[--color-retro-text-light]">
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
        </div>
      </div>
    </div>
  );
}
