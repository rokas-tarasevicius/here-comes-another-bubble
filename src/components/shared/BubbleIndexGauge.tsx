import { InfoTip } from './InfoTip.tsx';

export interface BubbleIndexGaugeProps {
  value: number;   // 0-100
  trend: number;   // positive = inflating, negative = deflating
}

function getZone(value: number): { label: string; color: string; arcColor: string } {
  if (value < 30) return { label: 'Cool', color: 'text-[--color-retro-blue]', arcColor: '#336699' };
  if (value < 60) return { label: 'Warm', color: 'text-[--color-retro-orange]', arcColor: '#ff6600' };
  if (value < 80) return { label: 'Hot', color: 'text-[--color-retro-orange-dark]', arcColor: '#cc5500' };
  return { label: 'BUBBLE!', color: 'text-[--color-retro-red]', arcColor: '#cc3333' };
}

/**
 * Semi-circular gauge showing the current bubble index (0-100).
 * Color zones indicate market temperature from Cool to BUBBLE!
 * Includes a trend arrow showing market direction.
 */
export function BubbleIndexGauge({ value, trend }: BubbleIndexGaugeProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const zone = getZone(clamped);

  // Semicircle gauge: rotation from -90deg (0) to +90deg (100)
  const needleRotation = -90 + (clamped / 100) * 180;

  const trendArrow = trend > 0 ? '\u2191' : trend < 0 ? '\u2193' : '\u2192';
  const trendColor = trend > 0 ? 'text-[--color-retro-red]' : trend < 0 ? 'text-[--color-retro-blue]' : 'text-[--color-retro-text-muted]';
  const trendLabel = trend > 0 ? 'Inflating' : trend < 0 ? 'Deflating' : 'Stable';

  return (
    <div className="retro-card">
      <h3 className="retro-section-heading">
        Bubble Index<InfoTip text="Market hype meter (0–100). When it pops (reaches critical levels), valuations crash, funding dries up, and customers flee. High bubble inflates your valuation — but the crash is brutal. Survive it to win." />
      </h3>

      {/* Gauge */}
      <div className="relative mx-auto flex flex-col items-center">
        <svg viewBox="0 0 200 120" className="w-48 h-28">
          {/* Background arc segments */}
          {/* Cool zone: 0-30 (blue) */}
          <path
            d="M 20 100 A 80 80 0 0 1 47.15 34.34"
            fill="none"
            stroke="#336699"
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.4"
          />
          {/* Warm zone: 30-60 (orange) */}
          <path
            d="M 47.15 34.34 A 80 80 0 0 1 100 20"
            fill="none"
            stroke="#ff6600"
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.4"
          />
          {/* Hot zone: 60-80 (dark orange) */}
          <path
            d="M 100 20 A 80 80 0 0 1 146.63 30.72"
            fill="none"
            stroke="#cc5500"
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.4"
          />
          {/* Bubble zone: 80-100 (red) */}
          <path
            d="M 146.63 30.72 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#cc3333"
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.4"
          />

          {/* Needle */}
          <g transform={`rotate(${needleRotation}, 100, 100)`}>
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="30"
              stroke={zone.arcColor}
              strokeWidth="2.5"
            />
            <circle cx="100" cy="100" r="5" fill={zone.arcColor} />
          </g>

          {/* Min/Max labels */}
          <text x="15" y="115" fill="#999999" fontSize="10">0</text>
          <text x="175" y="115" fill="#999999" fontSize="10">100</text>
        </svg>

        {/* Value display */}
        <div className="mt-1 text-center">
          <span className={`text-2xl font-bold font-retro-mono ${zone.color}`}>
            {Math.round(clamped)}
          </span>
          <span className="text-sm text-[--color-retro-text-light]">/100</span>
        </div>

        {/* Zone label */}
        <span className={`mt-1 text-sm font-bold ${zone.color}`}>
          {zone.label}
        </span>

        {/* Trend */}
        <div className="mt-2 flex items-center gap-1">
          <span className={`text-lg font-bold ${trendColor}`}>{trendArrow}</span>
          <span className={`text-xs ${trendColor}`}>{trendLabel}</span>
        </div>
      </div>
    </div>
  );
}
