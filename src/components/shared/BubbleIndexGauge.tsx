import { InfoTip } from './InfoTip.tsx';

export interface BubbleIndexGaugeProps {
  value: number;   // 0-100
  trend: number;   // positive = inflating, negative = deflating
}

function getZone(value: number): { label: string; colorClass: string; barClass: string } {
  if (value < 30) return { label: 'Cool', colorClass: 'retro-gauge-cool', barClass: 'retro-progress-bar retro-progress-bar-blue' };
  if (value < 60) return { label: 'Warm', colorClass: 'retro-gauge-warm', barClass: 'retro-progress-bar retro-progress-bar-orange' };
  if (value < 80) return { label: 'Hot', colorClass: 'retro-gauge-hot', barClass: 'retro-progress-bar retro-progress-bar-red' };
  return { label: 'BUBBLE!', colorClass: 'retro-gauge-bubble', barClass: 'retro-progress-bar retro-progress-bar-red' };
}

/**
 * Skeuomorphic gauge card showing the current bubble index (0-100).
 * Uses retro inset panels, glossy progress bar, and zone indicators.
 */
export function BubbleIndexGauge({ value, trend }: BubbleIndexGaugeProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const zone = getZone(clamped);

  const trendArrow = trend > 0 ? '\u25B2' : trend < 0 ? '\u25BC' : '\u25C6';
  const trendLabel = trend > 0 ? 'Inflating' : trend < 0 ? 'Deflating' : 'Stable';
  const trendClass = trend > 0 ? 'retro-gauge-trend-up' : trend < 0 ? 'retro-gauge-trend-down' : 'retro-gauge-trend-stable';

  return (
    <div className="retro-card">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="retro-section-heading" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
          Bubble Index<InfoTip text="Market hype meter (0–100). When it pops (reaches critical levels), valuations crash, funding dries up, and customers flee. High bubble inflates your valuation — but the crash is brutal. Survive it to win." />
        </h3>
        <span className={`retro-badge shrink-0 ${zone.colorClass === 'retro-gauge-cool' ? 'retro-badge-blue' : zone.colorClass === 'retro-gauge-warm' ? 'retro-badge-orange' : 'retro-badge-red'}`}>
          {zone.label}
        </span>
      </div>

      {/* Main value readout — inset panel */}
      <div className="retro-inset retro-gauge-readout mb-3">
        <div className={`retro-gauge-value ${zone.colorClass}`}>
          {Math.round(clamped)}
        </div>
        <div className="retro-gauge-sublabel">/100</div>
      </div>

      {/* Glossy progress bar */}
      <div className="mb-2">
        <div className="retro-progress" style={{ height: '14px' }}>
          <div
            className={zone.barClass}
            style={{ width: `${clamped}%`, transition: 'width 0.5s ease' }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-[--color-retro-text-light]">
          <span>Cool</span>
          <span>Warm</span>
          <span>Hot</span>
          <span>Bubble</span>
        </div>
      </div>

      {/* Zone markers — four segment dots */}
      <div className="retro-gauge-zones mb-3">
        <div className={`retro-gauge-zone-segment ${clamped < 30 ? 'retro-gauge-zone-active' : ''}`}>
          <span className="retro-gauge-zone-dot retro-gauge-zone-dot-blue" />
          <span className="retro-gauge-zone-range">0–29</span>
        </div>
        <div className={`retro-gauge-zone-segment ${clamped >= 30 && clamped < 60 ? 'retro-gauge-zone-active' : ''}`}>
          <span className="retro-gauge-zone-dot retro-gauge-zone-dot-orange" />
          <span className="retro-gauge-zone-range">30–59</span>
        </div>
        <div className={`retro-gauge-zone-segment ${clamped >= 60 && clamped < 80 ? 'retro-gauge-zone-active' : ''}`}>
          <span className="retro-gauge-zone-dot retro-gauge-zone-dot-red" />
          <span className="retro-gauge-zone-range">60–79</span>
        </div>
        <div className={`retro-gauge-zone-segment ${clamped >= 80 ? 'retro-gauge-zone-active' : ''}`}>
          <span className="retro-gauge-zone-dot retro-gauge-zone-dot-red" />
          <span className="retro-gauge-zone-range">80+</span>
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
