import { useState } from 'react';
import { useGameStore } from '../../store/index.ts';
import { FOUNDER_DISPLAY } from '../../data/founders.ts';
import { MARKET_SEGMENTS } from '../../data/markets.ts';
import { formatCurrency } from '../../utils/format.ts';
import type { FounderArchetype, MarketSegment, Difficulty, Tone } from '../../types/index.ts';

// ─── Constants ──────────────────────────────────────────────────────────

const TOTAL_STEPS = 5;

const STEP_LABELS = [
  'Company Name',
  'Founder',
  'Market',
  'Settings',
  'Launch',
];

interface DifficultyOption {
  value: Difficulty;
  label: string;
  description: string;
  color: string;
}

const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  {
    value: 'easy',
    label: 'Easy',
    description: 'Forgiving economy, slower burn rate, kinder investors. Good for learning the ropes.',
    color: 'green',
  },
  {
    value: 'normal',
    label: 'Normal',
    description: 'The standard startup experience. Tight runways, competitive markets, real pressure.',
    color: 'blue',
  },
  {
    value: 'hard',
    label: 'Hard',
    description: 'Aggressive competition, fickle investors, and engineers who keep getting poached.',
    color: 'orange',
  },
  {
    value: 'nightmare',
    label: 'Nightmare',
    description: 'Everything goes wrong. Constant crises, brutal market conditions, zero margin for error.',
    color: 'red',
  },
];

interface ToneOption {
  value: Tone;
  label: string;
  description: string;
}

const TONE_OPTIONS: ToneOption[] = [
  {
    value: 'realistic',
    label: 'Realistic',
    description: 'Grounded scenarios based on real startup dynamics.',
  },
  {
    value: 'satirical',
    label: 'Satirical',
    description: 'Over-the-top Silicon Valley absurdity.',
  },
  {
    value: 'mixed',
    label: 'Mixed',
    description: 'Best of both worlds.',
  },
];

const SEGMENT_ORDER: MarketSegment[] = [
  'ai-devtools',
  'ai-healthcare',
  'ai-fintech',
  'ai-education',
  'ai-enterprise',
  'ai-consumer',
  'ai-creative',
];

// ─── Helpers ────────────────────────────────────────────────────────────

function formatCash(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
}

function formatMarketSize(size: number): string {
  if (size >= 1_000_000) return `$${(size / 1_000_000).toFixed(0)}B`;
  if (size >= 1_000) return `$${(size / 1_000).toFixed(0)}M`;
  return `$${size}K`;
}

// ─── Stat Bar (retro glossy progress bar) ───────────────────────────────

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  const barClasses: Record<string, string> = {
    blue: 'retro-progress-bar',
    green: 'retro-progress-bar retro-progress-bar-green',
    purple: 'retro-progress-bar retro-progress-bar-purple',
    orange: 'retro-progress-bar retro-progress-bar-orange',
    red: 'retro-progress-bar retro-progress-bar-red',
  };

  return (
    <div className="flex items-center gap-2">
      <span className="w-20 shrink-0 font-[--font-retro] text-xs text-retro-text-muted">{label}</span>
      <div className="retro-progress h-3 flex-1">
        <div
          className={barClasses[color] ?? 'retro-progress-bar'}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <span className="w-7 text-right font-[--font-retro-mono] text-xs text-retro-text-muted">{value}</span>
    </div>
  );
}

// ─── Market Stat Indicator ──────────────────────────────────────────────

function formatMarketStatValue(label: string, value: number): string {
  if (typeof value === 'number' && value <= 1) return `${(value * 100).toFixed(0)}%`;
  if (label === 'Market Size') return formatCurrency(value);
  return String(value);
}

function MarketStat({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  const barClasses: Record<string, string> = {
    green: 'retro-progress-bar retro-progress-bar-green',
    blue: 'retro-progress-bar',
    orange: 'retro-progress-bar retro-progress-bar-orange',
    red: 'retro-progress-bar retro-progress-bar-red',
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="font-[--font-retro] text-xs text-retro-text-muted">{label}</span>
        <span className="font-[--font-retro-mono] text-xs text-retro-text-light">
          {formatMarketStatValue(label, value)}
        </span>
      </div>
      <div className="retro-progress h-2">
        <div
          className={barClasses[color] ?? 'retro-progress-bar'}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Step Indicator (Web 2.0 numbered circles with connecting lines) ────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }, (_, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === current;
        const isCompleted = stepNum < current;

        return (
          <div key={i} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className="h-0.5 w-6 rounded sm:w-10"
                style={{
                  background: isCompleted
                    ? 'linear-gradient(to right, #339933, #55bb55)'
                    : '#cccccc',
                }}
              />
            )}
            <div className="flex flex-col items-center gap-1">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                style={{
                  background: isActive
                    ? 'linear-gradient(to bottom, #5588bb, #336699)'
                    : isCompleted
                      ? 'linear-gradient(to bottom, #55bb55, #339933)'
                      : 'linear-gradient(to bottom, #ffffff, #e0e0e0)',
                  border: isActive
                    ? '2px solid #2a5580'
                    : isCompleted
                      ? '2px solid #2a802a'
                      : '1px solid #b0b0b0',
                  color: isActive || isCompleted ? '#ffffff' : '#999999',
                  boxShadow: isActive
                    ? '0 2px 6px rgba(51,102,153,0.4), inset 0 1px 0 rgba(255,255,255,0.3)'
                    : '0 1px 3px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.5)',
                  textShadow: isActive || isCompleted
                    ? '0 -1px 0 rgba(0,0,0,0.3)'
                    : 'none',
                }}
              >
                {isCompleted ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  stepNum
                )}
              </div>
              <span
                className={`hidden font-[--font-retro] text-[10px] sm:block ${
                  isActive ? 'font-bold text-retro-blue' : 'text-retro-text-light'
                }`}
              >
                {STEP_LABELS[i]}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Company Name ───────────────────────────────────────────────

function StepCompanyName({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="mb-2 text-retro-blue">
        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
        </svg>
      </div>
      <h2 className="mb-2 font-[--font-retro-heading] text-2xl font-bold text-retro-text">Name Your Startup</h2>
      <p className="mb-8 font-[--font-retro] text-sm text-retro-text-muted">
        Choose wisely. This name will appear on pitch decks, Hacker News roasts, and your Series A term sheet.
      </p>

      <div className="w-full max-w-sm">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter your startup name..."
          maxLength={40}
          className="retro-input w-full px-4 py-3 text-center text-lg font-medium"
          autoFocus
        />
        <p className="mt-2 text-center font-[--font-retro-mono] text-xs text-retro-text-light">
          {value.length}/40 characters
        </p>
      </div>
    </div>
  );
}

// ─── Step 2: Choose Founder ─────────────────────────────────────────────

function StepFounder({
  selected,
  onSelect,
}: {
  selected: FounderArchetype | null;
  onSelect: (a: FounderArchetype) => void;
}) {
  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="mb-2 font-[--font-retro-heading] text-2xl font-bold text-retro-text">Choose Your Founder</h2>
        <p className="font-[--font-retro] text-sm text-retro-text-muted">
          Each archetype plays differently. Pick the one that matches your strategy.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FOUNDER_DISPLAY.map((founder) => {
          const isSelected = selected === founder.archetype;

          return (
            <button
              key={founder.archetype}
              onClick={() => onSelect(founder.archetype)}
              className={`cursor-pointer rounded-lg border p-4 text-left transition-all ${
                isSelected
                  ? 'retro-card-raised border-retro-blue shadow-lg'
                  : 'retro-card hover:shadow-md'
              }`}
              style={isSelected ? {
                borderColor: '#336699',
                background: 'linear-gradient(to bottom, #ffffff, #eef4fb)',
              } : undefined}
            >
              {/* Header */}
              <div className="mb-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-[--font-retro-heading] font-bold text-retro-text">{founder.displayName}</h3>
                  {isSelected && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full text-white"
                      style={{ background: 'linear-gradient(to bottom, #5588bb, #336699)' }}
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
                <span className="font-[--font-retro] text-xs font-medium text-retro-blue">{founder.tagline}</span>
              </div>

              {/* Description */}
              <p className="mb-4 font-[--font-retro] text-xs leading-relaxed text-retro-text-muted">
                {founder.description}
              </p>

              {/* Stats */}
              <div className="mb-3 space-y-1.5">
                <StatBar label="Tech" value={founder.stats.techSkill} color="blue" />
                <StatBar label="Business" value={founder.stats.bizSkill} color="green" />
                <StatBar label="Network" value={founder.stats.network} color="purple" />
                <StatBar label="Reputation" value={founder.stats.reputation} color="orange" />
                <StatBar label="Learning" value={founder.stats.learning} color="red" />
              </div>

              {/* Footer info */}
              <div className="border-t border-retro-border pt-3">
                <div className="flex items-center justify-between font-[--font-retro] text-xs">
                  <span className="text-retro-text-muted">Starting Cash</span>
                  <span className="font-[--font-retro-mono] font-bold text-retro-green">
                    {formatCash(founder.startingCash)}
                  </span>
                </div>
                <div className="retro-inset mt-2 px-2 py-1.5 font-[--font-retro] text-[11px] leading-relaxed text-retro-text-muted">
                  {founder.specialAbility}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 3: Choose Market ──────────────────────────────────────────────

function StepMarket({
  selected,
  onSelect,
}: {
  selected: MarketSegment | null;
  onSelect: (s: MarketSegment) => void;
}) {
  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="mb-2 font-[--font-retro-heading] text-2xl font-bold text-retro-text">Choose Your Market</h2>
        <p className="font-[--font-retro] text-sm text-retro-text-muted">
          Where will you compete? Each segment has different risks and rewards.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SEGMENT_ORDER.map((segKey) => {
          const seg = MARKET_SEGMENTS[segKey];
          const isSelected = selected === segKey;

          return (
            <button
              key={segKey}
              onClick={() => onSelect(segKey)}
              className={`cursor-pointer rounded-lg border p-4 text-left transition-all ${
                isSelected
                  ? 'retro-card-raised border-retro-blue shadow-lg'
                  : 'retro-card hover:shadow-md'
              }`}
              style={isSelected ? {
                borderColor: '#336699',
                background: 'linear-gradient(to bottom, #ffffff, #eef4fb)',
              } : undefined}
            >
              {/* Header */}
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-[--font-retro-heading] font-bold text-retro-text">{seg.name}</h3>
                {isSelected && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full text-white"
                    style={{ background: 'linear-gradient(to bottom, #5588bb, #336699)' }}
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Description */}
              <p className="mb-4 font-[--font-retro] text-xs leading-relaxed text-retro-text-muted">
                {seg.description}
              </p>

              {/* Stats */}
              <div className="space-y-2.5">
                <MarketStat
                  label="Market Size"
                  value={seg.size}
                  max={100_000}
                  color="green"
                />
                <MarketStat
                  label="Growth Rate"
                  value={seg.growthRate}
                  max={0.35}
                  color="blue"
                />
                <MarketStat
                  label="Competition"
                  value={seg.competitionIntensity}
                  max={100}
                  color="orange"
                />
                <MarketStat
                  label="Regulatory Risk"
                  value={seg.regulatoryRisk}
                  max={100}
                  color="red"
                />
              </div>

              {/* Market size callout */}
              <div className="mt-3 border-t border-retro-border pt-3 text-center">
                <span className="font-[--font-retro] text-[10px] uppercase tracking-wider text-retro-text-light">TAM</span>
                <div className="font-[--font-retro-mono] text-sm font-bold text-retro-green">
                  {formatMarketSize(seg.size)}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 4: Difficulty & Tone ──────────────────────────────────────────

function StepSettings({
  difficulty,
  tone,
  onDifficulty,
  onTone,
}: {
  difficulty: Difficulty;
  tone: Tone;
  onDifficulty: (d: Difficulty) => void;
  onTone: (t: Tone) => void;
}) {
  const difficultySelectedStyles: Record<string, { borderColor: string; background: string }> = {
    green: { borderColor: '#339933', background: 'linear-gradient(to bottom, #ffffff, #e8f5e8)' },
    blue: { borderColor: '#336699', background: 'linear-gradient(to bottom, #ffffff, #eef4fb)' },
    orange: { borderColor: '#ff6600', background: 'linear-gradient(to bottom, #ffffff, #fff5eb)' },
    red: { borderColor: '#cc3333', background: 'linear-gradient(to bottom, #ffffff, #fbeef0)' },
  };

  const difficultyDotColors: Record<string, string> = {
    green: '#339933',
    blue: '#336699',
    orange: '#ff6600',
    red: '#cc3333',
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* Difficulty */}
      <div className="mb-8">
        <div className="mb-4 text-center">
          <h2 className="mb-2 font-[--font-retro-heading] text-2xl font-bold text-retro-text">Game Settings</h2>
          <p className="font-[--font-retro] text-sm text-retro-text-muted">
            How punishing should the market be, and how seriously should we take it?
          </p>
        </div>

        <h3 className="retro-section-heading">
          Difficulty
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {DIFFICULTY_OPTIONS.map((opt) => {
            const isSelected = difficulty === opt.value;

            return (
              <button
                key={opt.value}
                onClick={() => onDifficulty(opt.value)}
                className={`cursor-pointer rounded-lg border p-4 text-left transition-all ${
                  isSelected
                    ? 'retro-card-raised shadow-md'
                    : 'retro-card hover:shadow-md'
                }`}
                style={isSelected ? difficultySelectedStyles[opt.color] : undefined}
              >
                <div className="mb-1 flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      background: isSelected
                        ? `radial-gradient(circle at 30% 30%, ${difficultyDotColors[opt.color]}88, ${difficultyDotColors[opt.color]})`
                        : '#cccccc',
                      boxShadow: isSelected ? '0 1px 2px rgba(0,0,0,0.2)' : 'none',
                    }}
                  />
                  <span className="font-[--font-retro-heading] font-bold text-retro-text">{opt.label}</span>
                </div>
                <p className="font-[--font-retro] text-xs leading-relaxed text-retro-text-muted">
                  {opt.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tone */}
      <div>
        <h3 className="retro-section-heading">
          Narrative Tone
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {TONE_OPTIONS.map((opt) => {
            const isSelected = tone === opt.value;

            return (
              <button
                key={opt.value}
                onClick={() => onTone(opt.value)}
                className={`cursor-pointer rounded-lg border p-4 text-left transition-all ${
                  isSelected
                    ? 'retro-card-raised shadow-md'
                    : 'retro-card hover:shadow-md'
                }`}
                style={isSelected ? {
                  borderColor: '#663399',
                  background: 'linear-gradient(to bottom, #ffffff, #f3eef8)',
                } : undefined}
              >
                <div className="mb-1 flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      background: isSelected
                        ? 'radial-gradient(circle at 30% 30%, #8855bb, #663399)'
                        : '#cccccc',
                      boxShadow: isSelected ? '0 1px 2px rgba(0,0,0,0.2)' : 'none',
                    }}
                  />
                  <span className="font-[--font-retro-heading] font-bold text-retro-text">{opt.label}</span>
                </div>
                <p className="font-[--font-retro] text-xs leading-relaxed text-retro-text-muted">
                  {opt.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Step 5: Summary ────────────────────────────────────────────────────

function StepSummary({
  companyName,
  archetype,
  segment,
  difficulty,
  tone,
}: {
  companyName: string;
  archetype: FounderArchetype;
  segment: MarketSegment;
  difficulty: Difficulty;
  tone: Tone;
}) {
  const founder = FOUNDER_DISPLAY.find((f) => f.archetype === archetype);
  const market = MARKET_SEGMENTS[segment];

  const difficultyLabels: Record<Difficulty, string> = {
    easy: 'Easy',
    normal: 'Normal',
    hard: 'Hard',
    nightmare: 'Nightmare',
  };

  const toneLabels: Record<Tone, string> = {
    realistic: 'Realistic',
    satirical: 'Satirical',
    mixed: 'Mixed',
  };

  const difficultyBadgeClass: Record<Difficulty, string> = {
    easy: 'retro-badge retro-badge-green',
    normal: 'retro-badge retro-badge-blue',
    hard: 'retro-badge retro-badge-orange',
    nightmare: 'retro-badge retro-badge-red',
  };

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-8 text-center">
        <h2 className="mb-2 font-[--font-retro-heading] text-2xl font-bold text-retro-text">Ready to Launch</h2>
        <p className="font-[--font-retro] text-sm text-retro-text-muted">
          Review your choices. There is no going back after this. Well, there is, but it costs VC credibility.
        </p>
      </div>

      <div className="retro-card-raised p-6">
        {/* Company Name */}
        <div className="mb-6 text-center">
          <span className="font-[--font-retro] text-[10px] uppercase tracking-widest text-retro-text-light">Company</span>
          <h3 className="mt-1 font-[--font-retro-heading] text-3xl font-extrabold text-retro-blue-dark">{companyName}</h3>
        </div>

        <div className="space-y-4">
          {/* Founder */}
          <div className="retro-inset flex items-start justify-between p-3">
            <div>
              <span className="font-[--font-retro] text-[10px] uppercase tracking-wider text-retro-text-light">Founder</span>
              <div className="font-[--font-retro-heading] font-semibold text-retro-text">
                {founder?.displayName ?? archetype}
              </div>
              <div className="font-[--font-retro] text-xs text-retro-blue">{founder?.tagline}</div>
            </div>
            <span className="font-[--font-retro-mono] text-sm font-bold text-retro-green">
              {founder ? formatCash(founder.startingCash) : ''}
            </span>
          </div>

          {/* Market */}
          <div className="retro-inset p-3">
            <span className="font-[--font-retro] text-[10px] uppercase tracking-wider text-retro-text-light">Market Segment</span>
            <div className="font-[--font-retro-heading] font-semibold text-retro-text">{market.name}</div>
            <div className="mt-1 font-[--font-retro] text-xs text-retro-text-muted">
              TAM: {formatMarketSize(market.size)} &middot; Growth: {(market.growthRate * 100).toFixed(0)}%
            </div>
          </div>

          {/* Settings */}
          <div className="flex gap-3">
            <div className="retro-inset flex-1 p-3">
              <span className="font-[--font-retro] text-[10px] uppercase tracking-wider text-retro-text-light">Difficulty</span>
              <div className="mt-1">
                <span className={difficultyBadgeClass[difficulty]}>
                  {difficultyLabels[difficulty]}
                </span>
              </div>
            </div>
            <div className="retro-inset flex-1 p-3">
              <span className="font-[--font-retro] text-[10px] uppercase tracking-wider text-retro-text-light">Tone</span>
              <div className="mt-1">
                <span className="retro-badge retro-badge-purple">
                  {toneLabels[tone]}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── New Game Screen ────────────────────────────────────────────────────

export function NewGameScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const newGame = useGameStore((s) => s.newGame);

  // Wizard state
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState('');
  const [archetype, setArchetype] = useState<FounderArchetype | null>(null);
  const [segment, setSegment] = useState<MarketSegment | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [tone, setTone] = useState<Tone>('mixed');

  // Validation
  const canAdvance = (): boolean => {
    switch (step) {
      case 1:
        return companyName.trim().length > 0;
      case 2:
        return archetype !== null;
      case 3:
        return segment !== null;
      case 4:
        return true;
      case 5:
        return true;
      default:
        return false;
    }
  };

  function handleBack() {
    if (step === 1) {
      setScreen('title');
    } else {
      setStep((s) => s - 1);
    }
  }

  function handleNext() {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
    }
  }

  function handleLaunch() {
    if (archetype && segment) {
      newGame(companyName.trim(), archetype, segment, difficulty, tone);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && canAdvance() && step < TOTAL_STEPS) {
      handleNext();
    }
  }

  return (
    <div
      className="flex min-h-screen flex-col bg-retro-bg"
      onKeyDown={handleKeyDown}
    >
      {/* Top bar with step indicator */}
      <div className="retro-header px-6 py-4">
        <StepIndicator current={step} total={TOTAL_STEPS} />
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-4xl">
          {step === 1 && (
            <StepCompanyName value={companyName} onChange={setCompanyName} />
          )}
          {step === 2 && (
            <StepFounder selected={archetype} onSelect={setArchetype} />
          )}
          {step === 3 && (
            <StepMarket selected={segment} onSelect={setSegment} />
          )}
          {step === 4 && (
            <StepSettings
              difficulty={difficulty}
              tone={tone}
              onDifficulty={setDifficulty}
              onTone={setTone}
            />
          )}
          {step === 5 && archetype && segment && (
            <StepSummary
              companyName={companyName.trim()}
              archetype={archetype}
              segment={segment}
              difficulty={difficulty}
              tone={tone}
            />
          )}
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="retro-header border-t border-retro-border px-6 py-4"
        style={{ borderBottom: 'none', borderTop: '1px solid #b0b0b0' }}
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          {/* Back */}
          <button
            onClick={handleBack}
            className="btn-glossy btn-silver flex items-center gap-1.5"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {step === 1 ? 'Main Menu' : 'Back'}
          </button>

          {/* Next / Launch */}
          {step < TOTAL_STEPS ? (
            <button
              onClick={handleNext}
              disabled={!canAdvance()}
              className={`btn-glossy flex items-center gap-1.5 ${
                canAdvance()
                  ? 'btn-primary'
                  : 'cursor-not-allowed opacity-50 btn-silver'
              }`}
            >
              Next
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleLaunch}
              className="btn-glossy btn-glossy-lg btn-green flex items-center gap-2"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.841m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              </svg>
              Launch Your Startup
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
