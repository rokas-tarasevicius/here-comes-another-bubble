import { InfoTip } from './InfoTip.tsx';

export interface BubbleIndexGaugeProps {
  value: number;   // 0-100
  trend: number;   // positive = inflating, negative = deflating
}

function getZone(value: number): { label: string; colorClass: string; badgeClass: string } {
  if (value < 30) return { label: 'Cool', colorClass: 'retro-gauge-cool', badgeClass: 'retro-badge-blue' };
  if (value < 60) return { label: 'Warm', colorClass: 'retro-gauge-warm', badgeClass: 'retro-badge-orange' };
  if (value < 80) return { label: 'Hot', colorClass: 'retro-gauge-hot', badgeClass: 'retro-badge-red' };
  return { label: 'BUBBLE!', colorClass: 'retro-gauge-bubble', badgeClass: 'retro-badge-red' };
}

/**
 * Skeuomorphic semicircle gauge showing the current bubble index (0-100).
 * Needle gauge inside a retro-inset panel with glossy arc segments,
 * zone badge, and trend indicator.
 */
export function BubbleIndexGauge({ value, trend }: BubbleIndexGaugeProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const zone = getZone(clamped);

  // Needle rotation: -90° at 0, +90° at 100
  const needleRotation = -90 + (clamped / 100) * 180;

  const trendArrow = trend > 0 ? '\u25B2' : trend < 0 ? '\u25BC' : '\u25C6';
  const trendLabel = trend > 0 ? 'Inflating' : trend < 0 ? 'Deflating' : 'Stable';
  const trendClass = trend > 0 ? 'retro-gauge-trend-up' : trend < 0 ? 'retro-gauge-trend-down' : 'retro-gauge-trend-stable';

  return (
    <div className="retro-card">
      <h3 className="retro-section-heading">
        Bubble Index<InfoTip text="Market hype meter (0–100). When it pops (reaches critical levels), valuations crash, funding dries up, and customers flee. High bubble inflates your valuation — but the crash is brutal. Survive it to win." />
      </h3>

      {/* Gauge inside inset panel */}
      <div className="retro-inset retro-gauge-dial-panel mb-3">
        <svg viewBox="0 0 200 120" className="retro-gauge-svg">
          {/* Outer ring shadow (faux bezel) */}
          <circle cx="100" cy="100" r="88" fill="none" stroke="var(--theme-glass-border-subtle)" strokeWidth="1" opacity="0.5" />

          {/* Background arc — recessed track */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="var(--theme-inset-bg)"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* Inner shadow on track */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="rgba(0,0,0,0.12)"
            strokeWidth="16"
            strokeLinecap="round"
          />
          {/* Track surface */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="var(--theme-inset-bg)"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Zone arcs — glossy colored segments */}
          {/* Cool zone: 0–30 */}
          <path
            d="M 20 100 A 80 80 0 0 1 47.15 34.34"
            fill="none"
            stroke="var(--color-retro-blue)"
            strokeWidth="10"
            strokeLinecap="round"
            opacity="0.6"
            className="retro-gauge-arc"
          />
          {/* Warm zone: 30–60 */}
          <path
            d="M 51 31.5 A 80 80 0 0 1 100 20"
            fill="none"
            stroke="var(--color-retro-orange)"
            strokeWidth="10"
            strokeLinecap="round"
            opacity="0.6"
            className="retro-gauge-arc"
          />
          {/* Hot zone: 60–80 */}
          <path
            d="M 104 20 A 80 80 0 0 1 146.63 30.72"
            fill="none"
            stroke="var(--color-retro-orange-dark)"
            strokeWidth="10"
            strokeLinecap="round"
            opacity="0.6"
            className="retro-gauge-arc"
          />
          {/* Bubble zone: 80–100 */}
          <path
            d="M 150.5 33.5 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="var(--color-retro-red)"
            strokeWidth="10"
            strokeLinecap="round"
            opacity="0.7"
            className="retro-gauge-arc"
          />
          {/* Gloss highlight on arcs */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="url(#gaugeGloss)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="gaugeGloss" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="white" stopOpacity="0.25" />
              <stop offset="50%" stopColor="white" stopOpacity="0" />
              <stop offset="100%" stopColor="black" stopOpacity="0.08" />
            </linearGradient>
            <radialGradient id="needleHub" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="var(--theme-surface-from)" />
              <stop offset="100%" stopColor="var(--theme-inset-bg)" />
            </radialGradient>
          </defs>

          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const angle = (-90 + (tick / 100) * 180) * (Math.PI / 180);
            const innerR = 67;
            const outerR = 72;
            const x1 = 100 + innerR * Math.cos(angle);
            const y1 = 100 + innerR * Math.sin(angle);
            const x2 = 100 + outerR * Math.cos(angle);
            const y2 = 100 + outerR * Math.sin(angle);
            return (
              <line
                key={tick}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="var(--theme-chart-axis)"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.6"
              />
            );
          })}

          {/* Needle */}
          <g transform={`rotate(${needleRotation}, 100, 100)`} className="retro-gauge-needle">
            {/* Needle shadow */}
            <line x1="100" y1="100" x2="100" y2="32" stroke="rgba(0,0,0,0.2)" strokeWidth="4" strokeLinecap="round" />
            {/* Needle body */}
            <line x1="100" y1="100" x2="100" y2="34" stroke="var(--color-retro-text)" strokeWidth="2.5" strokeLinecap="round" />
            {/* Hub — glossy circle */}
            <circle cx="100" cy="100" r="7" fill="url(#needleHub)" stroke="var(--theme-glass-border)" strokeWidth="1" />
            <circle cx="100" cy="100" r="3" fill="var(--color-retro-text-muted)" />
          </g>

          {/* Min/Max labels */}
          <text x="15" y="115" fill="var(--theme-chart-axis)" fontSize="9" fontFamily="var(--font-retro-mono)">0</text>
          <text x="178" y="115" fill="var(--theme-chart-axis)" fontSize="9" fontFamily="var(--font-retro-mono)" textAnchor="end">100</text>
        </svg>

        {/* Value + zone label overlay */}
        <div className="retro-gauge-dial-readout">
          <span className={`retro-gauge-value ${zone.colorClass}`}>
            {Math.round(clamped)}
          </span>
          <span className={`retro-badge ${zone.badgeClass}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
            {zone.label}
          </span>
        </div>
      </div>

      {/* Trend indicator — inset strip */}
      <div className="retro-inset retro-gauge-trend-strip">
        <span className={`retro-gauge-trend-arrow ${trendClass}`}>{trendArrow}</span>
        <span className={`retro-gauge-trend-label ${trendClass}`}>{trendLabel}</span>
        {trend !== 0 && (
          <span className="retro-gauge-trend-delta">
            {trend > 0 ? '+' : ''}{trend.toFixed(1)}/wk
          </span>
        )}
      </div>
    </div>
  );
}
