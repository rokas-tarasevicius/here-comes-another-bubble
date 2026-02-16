interface TechDebtMeterProps {
  value: number; // 0-100
}

function getDebtColor(value: number): string {
  if (value <= 30) return 'text-emerald-400';
  if (value <= 60) return 'text-amber-400';
  return 'text-red-400';
}

function getDebtBarColor(value: number): string {
  if (value <= 30) return 'bg-emerald-500';
  if (value <= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

function getDebtLabel(value: number): string {
  if (value <= 15) return 'Minimal';
  if (value <= 30) return 'Low';
  if (value <= 45) return 'Moderate';
  if (value <= 60) return 'Concerning';
  if (value <= 80) return 'High';
  return 'Critical';
}

function getDebtGlowColor(value: number): string {
  if (value <= 30) return 'shadow-emerald-500/20';
  if (value <= 60) return 'shadow-amber-500/20';
  return 'shadow-red-500/20';
}

export function TechDebtMeter({ value }: TechDebtMeterProps) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const barColor = getDebtBarColor(clampedValue);
  const textColor = getDebtColor(clampedValue);
  const label = getDebtLabel(clampedValue);
  const glowColor = getDebtGlowColor(clampedValue);

  // SVG semicircle gauge
  const radius = 70;
  const strokeWidth = 12;
  const cx = 80;
  const cy = 80;
  // Semicircle from 180 to 0 degrees (bottom half arc)
  const circumference = Math.PI * radius;
  const fillLength = (clampedValue / 100) * circumference;
  const dashOffset = circumference - fillLength;

  // Color for the arc stroke
  const arcStroke = clampedValue <= 30 ? '#10b981' : clampedValue <= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className={`rounded-lg border border-gray-800 bg-gray-900 p-4 shadow-md ${glowColor}`}>
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-300">Tech Debt</h4>
        <div className="group relative">
          <span className="cursor-help text-xs text-gray-600">[?]</span>
          <div className="pointer-events-none absolute right-0 top-6 z-10 w-56 rounded-lg border border-gray-700 bg-gray-800 p-2 text-xs text-gray-300 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
            High tech debt slows development and increases bugs
          </div>
        </div>
      </div>

      {/* Semicircle gauge */}
      <div className="flex flex-col items-center">
        <svg width="160" height="90" viewBox="0 0 160 90">
          {/* Background arc */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="#374151"
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
          <text x="6" y="88" className="fill-emerald-600 text-[8px]">0</text>
          <text x="147" y="88" className="fill-red-600 text-[8px]">100</text>
        </svg>

        {/* Center value */}
        <div className="-mt-10 text-center">
          <span className={`text-2xl font-bold font-mono ${textColor}`}>
            {clampedValue}
          </span>
          <p className={`text-xs font-medium ${textColor}`}>{label}</p>
        </div>
      </div>

      {/* Linear bar fallback */}
      <div className="mt-3">
        <div className="flex items-center gap-1">
          <div className="h-2 flex-1 rounded-full bg-gray-700 overflow-hidden">
            {/* Zone backgrounds */}
            <div className="relative h-full w-full">
              <div className="absolute inset-y-0 left-0 w-[30%] bg-emerald-900/30" />
              <div className="absolute inset-y-0 left-[30%] w-[30%] bg-amber-900/30" />
              <div className="absolute inset-y-0 left-[60%] w-[40%] bg-red-900/30" />
              {/* Actual fill */}
              <div
                className={`absolute inset-y-0 left-0 rounded-full ${barColor} transition-all duration-500`}
                style={{ width: `${clampedValue}%` }}
              />
            </div>
          </div>
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-gray-600">
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
        </div>
      </div>
    </div>
  );
}
