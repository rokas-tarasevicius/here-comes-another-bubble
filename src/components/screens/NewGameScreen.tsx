import { useState, useEffect } from 'react';
import { useGameStore } from '../../store/index.ts';
import { FOUNDER_DISPLAY } from '../../data/founders.ts';
import { MARKET_SEGMENTS } from '../../data/markets.ts';
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
  if (size >= 1_000_000_000) return `$${(size / 1_000_000_000).toFixed(0)}B`;
  if (size >= 1_000_000) return `$${(size / 1_000_000).toFixed(0)}M`;
  if (size >= 1_000) return `$${(size / 1_000).toFixed(0)}K`;
  return `$${size}`;
}

// ─── Stat Bar (retro glossy progress bar) ───────────────────────────────

function StatBar({ label, value, color, display }: { label: string; value: number; color: string; display?: string }) {
  const barClasses: Record<string, string> = {
    blue: 'retro-progress-bar',
    green: 'retro-progress-bar retro-progress-bar-green',
    purple: 'retro-progress-bar retro-progress-bar-purple',
    orange: 'retro-progress-bar retro-progress-bar-orange',
    red: 'retro-progress-bar retro-progress-bar-red',
  };

  return (
    <div className="flex items-center gap-2">
      <span className="w-20 shrink-0 text-xs text-retro-text-muted">{label}</span>
      <div className="retro-progress h-3 flex-1">
        <div
          className={barClasses[color] ?? 'retro-progress-bar'}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <span className="min-w-7 text-right font-retro-mono text-xs text-retro-text-muted">{display ?? value}</span>
    </div>
  );
}

// ─── Step Indicator (Web 2.0 numbered circles with connecting lines) ────

function StepIndicator({
  current,
  total,
  onStepClick,
  canGoToStep,
}: {
  current: number;
  total: number;
  onStepClick?: (step: number) => void;
  canGoToStep?: (step: number) => boolean;
}) {
  return (
    <div className="mx-auto flex w-full max-w-md items-start justify-center">
      {Array.from({ length: total }, (_, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === current;
        const isCompleted = stepNum < current;
        const clickable = !isActive && (canGoToStep?.(stepNum) ?? false);

        return (
          <div key={i} className="flex flex-1 flex-col items-center">
            {/* Circle row with connecting lines */}
            <div className="relative flex w-full items-center justify-center" style={{ height: 32 }}>
              {/* Full-width connector behind the circle */}
              {i < total - 1 && (
                <div
                  className="absolute h-0.5 rounded-full"
                  style={{
                    left: '50%',
                    right: '-50%',
                    background: '#d0ccc5',
                  }}
                >
                  <div
                    className="absolute inset-0 rounded-full motion-reduce:transition-none!"
                    style={{
                      background: 'linear-gradient(to right, #44aa44, #339933)',
                      transformOrigin: 'left',
                      transform: stepNum < current ? 'scaleX(1)' : 'scaleX(0)',
                      transition: 'transform 500ms cubic-bezier(0.165, 0.84, 0.44, 1)',
                    }}
                  />
                </div>
              )}

              {/* Circle */}
              <button
                type="button"
                onClick={clickable ? () => onStepClick?.(stepNum) : undefined}
                disabled={!clickable}
                className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  clickable ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'
                }`}
                style={{
                  background: isActive
                    ? 'linear-gradient(to bottom, #5588bb, #336699)'
                    : isCompleted
                      ? 'linear-gradient(to bottom, #55bb55, #339933)'
                      : 'linear-gradient(to bottom, #ffffff, #e6e2db)',
                  border: isActive
                    ? '2px solid #2a5580'
                    : isCompleted
                      ? '2px solid #2a802a'
                      : '1px solid #c4c0ba',
                  color: isActive || isCompleted ? '#ffffff' : '#9a9590',
                  boxShadow: isActive
                    ? '0 2px 6px rgba(51,102,153,0.4), inset 0 1px 0 rgba(255,255,255,0.3)'
                    : '0 1px 3px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.5)',
                  textShadow: isActive || isCompleted
                    ? '0 -1px 0 rgba(0,0,0,0.3)'
                    : 'none',
                  transition: 'background 400ms cubic-bezier(0.165, 0.84, 0.44, 1), border-color 400ms cubic-bezier(0.165, 0.84, 0.44, 1), color 300ms ease-out, box-shadow 400ms cubic-bezier(0.165, 0.84, 0.44, 1), transform 150ms ease',
                }}
              >
                {isCompleted ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  stepNum
                )}
              </button>
            </div>

            {/* Label below */}
            <span
              onClick={clickable ? () => onStepClick?.(stepNum) : undefined}
              className={`mt-1 hidden text-[10px] sm:block ${
                isActive ? 'font-bold text-retro-blue' : 'text-retro-text-light'
              } ${clickable ? 'cursor-pointer hover:text-retro-blue' : ''}`}
            >
              {STEP_LABELS[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Company Name ───────────────────────────────────────────────

const SUGGESTED_NAMES = [
  // Silicon Valley (the show)
  'Pied Piper',
  'Hooli',
  'Aviato',
  'Nucleus',
  'Bachmanity',
  'Raviga Capital',
  'EndFrame',
  'Not Hotdog',
  'Hooli XYZ',
  'PiperNet',
  'Dinesh Cloud',
  'Gavin Belson AI',
  'Erlich Ventures',
  // Parody / startup culture
  'Bro.app',
  'Disruptify',
  'Synerjy',
  'PivotPivot',
  'BlockchAIn',
  'TechBro Inc.',
  'Series Yolo',
  'VC Bait',
  'Vaporware.io',
  'Scalr',
  'Optimizelyyy',
  'Uber for Dogs',
  'AI Powered AI',
  'NothingBurger',
  'Decacorn Labs',
  'Brogrammer HQ',
  'YoloCorp',
  'Agile Synergy',
  'Ship It Later',
  'ThinkDifferenter',
  'Blaize.ai',
  'Pivot.ly',
  'Disrupt Labs',
  'MoveF4st',
  'SynergyOS',
  'DeepThink AI',
  'Burnr',
  'Fundme.io',
  'Stealth.ai',
  'pre$eed',
  'Cap Table Co.',
];

function pickSuggestions(count: number): string[] {
  const shuffled = [...SUGGESTED_NAMES];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

function StepCompanyName({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [suggestions] = useState(() => pickSuggestions(10));

  return (
    <div className="flex flex-col items-center">
      <div className="mb-2 text-retro-blue">
        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
        </svg>
      </div>
      <h2 className="mb-2 text-2xl font-bold text-retro-text">Name Your Startup</h2>
      <p className="mb-8 text-sm text-retro-text-muted">
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
        <p className="mt-2 text-center font-retro-mono text-xs text-retro-text-light">
          {value.length}/40 characters
        </p>
      </div>

      {/* Suggested names */}
      <div className="mt-6 flex w-full max-w-sm flex-col items-center">
        <div className="mb-4 flex items-center gap-3 w-full">
          <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.08))' }} />
          <span className="text-[10px] font-medium text-[--color-retro-text-light] tracking-wide">or pick one</span>
          <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, rgba(0,0,0,0.08))' }} />
        </div>
        <div
          className="retro-inset w-full rounded-xl px-4 py-3.5"
        >
          <div className="flex flex-wrap justify-center gap-1.5">
            {suggestions.map((name) => {
              const selected = value === name;
              return (
                <button
                  key={name}
                  onClick={() => onChange(name)}
                  className={`cursor-pointer rounded-full px-3 py-1 text-[11px] font-medium transition-all duration-150 ${
                    selected
                      ? ''
                      : 'hover:text-[--color-retro-text] hover:shadow-[0_2px_4px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.8)] hover:-translate-y-px active:translate-y-0 active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]'
                  }`}
                  style={selected ? {
                    background: 'linear-gradient(to bottom, #5e91c4, #3a6a9e)',
                    color: '#fff',
                    boxShadow: '0 1px 3px rgba(51,102,153,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    textShadow: '0 1px 1px rgba(0,0,0,0.15)',
                  } : {
                    background: 'linear-gradient(to bottom, #ffffff, #f5f3f0)',
                    color: 'var(--color-retro-text-muted)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
                    border: '1px solid rgba(0,0,0,0.06)',
                  }}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
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
      <div className="mb-4 text-center px-4 sm:px-8">
        <h2 className="mb-2 text-2xl font-bold text-retro-text">Choose Your Founder</h2>
        <p className="text-sm text-retro-text-muted">
          Each archetype plays differently. Pick the one that matches your strategy.
        </p>
      </div>

      <div data-card-grid className="mx-auto grid max-w-6xl gap-3 px-4 sm:px-8" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(272px, 1fr))' }}>
        {FOUNDER_DISPLAY.map((founder) => {
          const isSelected = selected === founder.archetype;

          return (
            <button
              key={founder.archetype}
              onClick={() => onSelect(founder.archetype)}
              className={`cursor-pointer rounded-lg border p-4 text-left flex flex-col ${
                isSelected
                  ? 'retro-card-raised border-retro-blue shadow-lg'
                  : 'retro-card'
              }`}
              style={isSelected ? {
                borderColor: '#336699',
                background: 'linear-gradient(to bottom, #ffffff, #eef4fb)',
              } : undefined}
            >
              {/* Header */}
              <div className="mb-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-retro-text">{founder.displayName}</h3>
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`}
                    style={{ background: 'linear-gradient(to bottom, #5588bb, #336699)' }}
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-medium text-retro-blue">{founder.tagline}</span>
                  <span className="text-retro-text-muted/40">|</span>
                  <span className="font-retro-mono font-semibold"><span className="text-retro-text-muted/60">Cash </span><span className="text-retro-green">{formatCash(founder.startingCash)}</span></span>
                </div>
              </div>

              {/* Description */}
              <p className="mb-4 flex-1 text-xs leading-relaxed text-retro-text-muted">
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

              {/* Footer perk */}
              <div className="border-t border-retro-border pt-3">
                <div className="retro-inset min-h-14 px-2 py-1.5 text-[11px] leading-relaxed text-retro-text-muted">
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
      <div className="mb-4 text-center px-4 sm:px-8">
        <h2 className="mb-2 text-2xl font-bold text-retro-text">Choose Your Market</h2>
        <p className="text-sm text-retro-text-muted">
          Where will you compete? Each segment has different risks and rewards.
        </p>
      </div>

      <div data-card-grid className="mx-auto grid max-w-6xl gap-3 px-4 sm:px-8" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(272px, 1fr))' }}>
        {SEGMENT_ORDER.map((segKey) => {
          const seg = MARKET_SEGMENTS[segKey];
          const isSelected = selected === segKey;

          return (
            <button
              key={segKey}
              onClick={() => onSelect(segKey)}
              className={`cursor-pointer rounded-lg border p-4 text-left flex flex-col ${
                isSelected
                  ? 'retro-card-raised border-retro-blue shadow-lg'
                  : 'retro-card'
              }`}
              style={isSelected ? {
                borderColor: '#336699',
                background: 'linear-gradient(to bottom, #ffffff, #eef4fb)',
              } : undefined}
            >
              {/* Header */}
              <div className="mb-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-retro-text">{seg.name}</h3>
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`}
                    style={{ background: 'linear-gradient(to bottom, #5588bb, #336699)' }}
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-retro-mono font-semibold"><span className="text-retro-text-muted/60">TAM </span><span className="text-retro-green">{formatMarketSize(seg.size)}</span></span>
                </div>
              </div>

              {/* Description */}
              <p className="mb-4 flex-1 text-xs leading-relaxed text-retro-text-muted">
                {seg.description}
              </p>

              {/* Stats */}
              <div className="space-y-1.5">
                <StatBar label="TAM" value={Math.round((seg.size / 12_000_000_000) * 100)} color="green" display={formatMarketSize(seg.size)} />
                <StatBar label="Growth" value={Math.round(seg.growthRate * 100)} color="blue" />
                <StatBar label="Competition" value={seg.competitionIntensity} color="orange" />
                <StatBar label="Regulation" value={seg.regulatoryRisk} color="red" />
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
          <h2 className="mb-2 text-2xl font-bold text-retro-text">Game Settings</h2>
          <p className="text-sm text-retro-text-muted">
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
                className={`cursor-pointer rounded-lg border p-4 text-left ${
                  isSelected
                    ? 'retro-card-raised shadow-md'
                    : 'retro-card'
                }`}
                style={isSelected ? difficultySelectedStyles[opt.color] : undefined}
              >
                <div className="mb-1 flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      background: isSelected
                        ? `radial-gradient(circle at 30% 30%, ${difficultyDotColors[opt.color]}88, ${difficultyDotColors[opt.color]})`
                        : '#d0ccc5',
                      boxShadow: isSelected ? '0 1px 2px rgba(0,0,0,0.2)' : 'none',
                    }}
                  />
                  <span className="font-bold text-retro-text">{opt.label}</span>
                </div>
                <p className="text-xs leading-relaxed text-retro-text-muted">
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
                className={`cursor-pointer rounded-lg border p-4 text-left ${
                  isSelected
                    ? 'retro-card-raised shadow-md'
                    : 'retro-card'
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
                        : '#d0ccc5',
                      boxShadow: isSelected ? '0 1px 2px rgba(0,0,0,0.2)' : 'none',
                    }}
                  />
                  <span className="font-bold text-retro-text">{opt.label}</span>
                </div>
                <p className="text-xs leading-relaxed text-retro-text-muted">
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
      <div className="mb-6 text-center">
        <h2 className="mb-2 text-2xl font-bold text-[--color-retro-text]" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.7)' }}>Ready to Launch</h2>
        <p className="text-sm text-[--color-retro-text-muted]">
          Review your choices. There is no going back after this. Well, there is, but it costs VC credibility.
        </p>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(to bottom, #f6f4f1, #edeae5)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
          border: '1px solid rgba(0,0,0,0.08)',
        }}
      >
        {/* Company name hero */}
        <div
          className="px-6 py-6 text-center"
          style={{
            background: 'linear-gradient(145deg, #d0daea 0%, #bccade 40%, #c5d3e6 100%)',
            boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.5), inset 0 -2px 6px rgba(0,0,0,0.08)',
            borderBottom: '1px solid rgba(0,0,0,0.08)',
          }}
        >
          <span className="text-[9px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'rgba(42,85,128,0.55)', textShadow: '0 1px 0 rgba(255,255,255,0.4)' }}>Company</span>
          <h3 className="mt-1.5 text-2xl font-extrabold tracking-tight" style={{ color: '#1e3a5c', textShadow: '0 1px 0 rgba(255,255,255,0.5), 0 -1px 0 rgba(0,0,0,0.05)' }}>{companyName}</h3>
        </div>

        <div className="p-5 space-y-3">
          {/* Founder */}
          <div
            className="rounded-xl px-4 py-3"
            style={{
              background: 'linear-gradient(to bottom, #ffffff, #f7f5f2)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,1), 0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.05)',
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-[--color-retro-text]">{founder?.displayName ?? archetype}</span>
                  <span className="text-xs font-medium text-[--color-retro-blue]">{founder?.tagline}</span>
                </div>
                {/* Mini stat bars */}
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                  {founder && [
                    { label: 'Tech', value: founder.stats.techSkill, color: '#4488cc' },
                    { label: 'Biz', value: founder.stats.bizSkill, color: '#44aa44' },
                    { label: 'Net', value: founder.stats.network, color: '#8855bb' },
                    { label: 'Rep', value: founder.stats.reputation, color: '#dd8833' },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-1.5">
                      <span className="text-[9px] font-semibold uppercase tracking-wide text-[--color-retro-text-muted] w-6">{s.label}</span>
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: '#e5e2dd' }}>
                        <div className="h-full rounded-full" style={{ width: `${s.value}%`, background: s.color, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.3)` }} />
                      </div>
                      <span className="font-retro-mono text-[9px] font-medium text-[--color-retro-text-muted] w-4 text-right">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="retro-label">Cash</span>
                <div className="font-retro-mono text-sm font-bold text-[--color-retro-green]" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.7)' }}>
                  {founder ? formatCash(founder.startingCash) : ''}
                </div>
              </div>
            </div>
          </div>

          {/* Market */}
          <div
            className="rounded-xl px-4 py-3"
            style={{
              background: 'linear-gradient(to bottom, #ffffff, #f7f5f2)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,1), 0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.05)',
            }}
          >
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-bold text-[--color-retro-text]">{market.name}</span>
              <span className="font-retro-mono text-xs font-semibold text-[--color-retro-green]">{formatMarketSize(market.size)}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="retro-stat-tag">
                <span className="retro-stat-tag-label">Growth</span>
                <span className="retro-stat-tag-value text-[--color-retro-blue]">{(market.growthRate * 100).toFixed(0)}%/yr</span>
              </span>
              <span className="retro-stat-tag">
                <span className="retro-stat-tag-label">Competition</span>
                <span className="retro-stat-tag-value">{market.competitionIntensity}</span>
              </span>
              <span className="retro-stat-tag">
                <span className="retro-stat-tag-label">Risk</span>
                <span className="retro-stat-tag-value">{market.regulatoryRisk}</span>
              </span>
            </div>
          </div>

          {/* Settings */}
          <div
            className="flex items-center gap-2 flex-wrap rounded-xl px-4 py-2.5"
            style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.02), rgba(0,0,0,0.04))',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.04), 0 1px 0 rgba(255,255,255,0.7)',
            }}
          >
            <span className={difficultyBadgeClass[difficulty]}>{difficultyLabels[difficulty]}</span>
            <span className="retro-badge retro-badge-purple">{toneLabels[tone]}</span>
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

  // Validation per step
  const isStepValid = (s: number): boolean => {
    switch (s) {
      case 1: return companyName.trim().length > 0;
      case 2: return archetype !== null;
      case 3: return segment !== null;
      case 4: return true;
      case 5: return true;
      default: return false;
    }
  };

  const canAdvance = (): boolean => isStepValid(step);

  // Can navigate to a step if all prior steps are valid
  const canGoToStep = (target: number): boolean => {
    if (target === step) return false;
    if (target < step) return true;
    for (let s = step; s < target; s++) {
      if (!isStepValid(s)) return false;
    }
    return true;
  };

  function handleStepClick(target: number) {
    if (canGoToStep(target)) setStep(target);
  }

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

  useEffect(() => {
    function getGridCols(): number {
      const grid = document.querySelector('[data-card-grid]');
      if (!grid) return 1;
      return getComputedStyle(grid).gridTemplateColumns.split(' ').length;
    }

    function wrapIndex(idx: number, offset: number, len: number): number {
      return ((idx + offset) % len + len) % len;
    }

    function moveOption(offset: number) {
      if (step === 2) {
        const items = FOUNDER_DISPLAY.map((f) => f.archetype);
        const idx = archetype ? items.indexOf(archetype) : -1;
        const next = idx === -1 ? 0 : wrapIndex(idx, offset, items.length);
        setArchetype(items[next]);
      } else if (step === 3) {
        const idx = segment ? SEGMENT_ORDER.indexOf(segment) : -1;
        const next = idx === -1 ? 0 : wrapIndex(idx, offset, SEGMENT_ORDER.length);
        setSegment(SEGMENT_ORDER[next]);
      } else if (step === 4) {
        const items = DIFFICULTY_OPTIONS.map((d) => d.value);
        const idx = items.indexOf(difficulty);
        setDifficulty(items[wrapIndex(idx, offset, items.length)]);
      }
    }

    function moveTone(offset: number) {
      const items = TONE_OPTIONS.map((t) => t.value);
      const idx = items.indexOf(tone);
      setTone(items[wrapIndex(idx, offset, items.length)]);
    }

    function blurActive() {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      if (e.key === 'ArrowLeft') {
        if (isInput) return;
        e.preventDefault();
        if (step === 4) { moveOption(-1); } else { moveOption(-1); }
        blurActive();
      } else if (e.key === 'ArrowRight') {
        if (isInput) return;
        e.preventDefault();
        if (step === 4) { moveOption(1); } else { moveOption(1); }
        blurActive();
      } else if (e.key === 'ArrowUp') {
        if (isInput) return;
        e.preventDefault();
        if (step === 4) { moveTone(-1); } else { moveOption(-getGridCols()); }
        blurActive();
      } else if (e.key === 'ArrowDown') {
        if (isInput) return;
        e.preventDefault();
        if (step === 4) { moveTone(1); } else { moveOption(getGridCols()); }
        blurActive();
      } else if (e.key === 'Enter') {
        if (isInput && step === 1) {
          e.preventDefault();
          if (isStepValid(step)) handleNext();
          return;
        }
        if (isInput) return;
        if (step === TOTAL_STEPS) {
          handleLaunch();
        } else if (isStepValid(step)) {
          handleNext();
        }
      } else if (e.key === 'Escape' || e.key === 'Backspace') {
        if (isInput) return;
        e.preventDefault();
        handleBack();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [step, archetype, segment, difficulty, tone, companyName]);

  return (
    <div className="min-h-screen bg-retro-bg">
      {/* Sticky top bar with step indicator + navigation */}
      <div className="retro-header sticky top-0 z-30 px-6 py-3">
        <div className="mx-auto grid max-w-4xl items-center gap-4" style={{ gridTemplateColumns: '1fr auto 1fr' }}>
          {/* Back */}
          <div className="flex justify-start">
            <button
              onClick={handleBack}
              className="btn-glossy btn-glossy-sm btn-silver flex items-center gap-1"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              {step === 1 ? 'Menu' : 'Back'}
            </button>
          </div>

          {/* Step indicator */}
          <div className="w-[420px] overflow-visible">
            <StepIndicator current={step} total={TOTAL_STEPS} onStepClick={handleStepClick} canGoToStep={canGoToStep} />
          </div>

          {/* Next / Launch */}
          <div className="flex justify-end">
            {step < TOTAL_STEPS ? (
              <button
                onClick={handleNext}
                disabled={!canAdvance()}
                className={`btn-glossy btn-glossy-sm flex items-center gap-1 ${
                  canAdvance()
                    ? 'btn-blue'
                    : 'btn-silver cursor-not-allowed opacity-40'
                }`}
              >
                Next
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleLaunch}
                className="btn-glossy btn-green flex items-center gap-2"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.841m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                </svg>
                Launch
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="py-6">
        {step === 1 && (
          <div className="mx-auto max-w-4xl px-4 sm:px-8">
            <StepCompanyName value={companyName} onChange={setCompanyName} />
          </div>
        )}
        {step === 2 && (
          <StepFounder selected={archetype} onSelect={setArchetype} />
        )}
        {step === 3 && (
          <StepMarket selected={segment} onSelect={setSegment} />
        )}
        {step === 4 && (
          <div className="mx-auto max-w-4xl px-4 sm:px-8">
            <StepSettings
              difficulty={difficulty}
              tone={tone}
              onDifficulty={setDifficulty}
              onTone={setTone}
            />
          </div>
        )}
        {step === 5 && archetype && segment && (
          <div className="mx-auto max-w-4xl px-4 sm:px-8">
            <StepSummary
              companyName={companyName.trim()}
              archetype={archetype}
              segment={segment}
              difficulty={difficulty}
              tone={tone}
            />
          </div>
        )}
      </div>

      {/* Keyboard hints */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 hidden sm:flex items-center gap-3 text-[11px] text-retro-text-muted/50 select-none">
        {step >= 2 && step <= 4 && (
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-retro-border/40 bg-retro-bg px-1.5 py-0.5 font-mono text-[10px] shadow-sm">←</kbd>
            <kbd className="rounded border border-retro-border/40 bg-retro-bg px-1.5 py-0.5 font-mono text-[10px] shadow-sm">→</kbd>
            <kbd className="rounded border border-retro-border/40 bg-retro-bg px-1.5 py-0.5 font-mono text-[10px] shadow-sm">↑</kbd>
            <kbd className="rounded border border-retro-border/40 bg-retro-bg px-1.5 py-0.5 font-mono text-[10px] shadow-sm">↓</kbd>
            {step === 4 ? 'difficulty · tone' : 'select'}
          </span>
        )}
        <span className="flex items-center gap-1">
          <kbd className="rounded border border-retro-border/40 bg-retro-bg px-1.5 py-0.5 font-mono text-[10px] shadow-sm">Enter</kbd>
          {step === TOTAL_STEPS ? 'launch' : 'next'}
        </span>
        <span className="flex items-center gap-1">
          <kbd className="rounded border border-retro-border/40 bg-retro-bg px-1.5 py-0.5 font-mono text-[10px] shadow-sm">Esc</kbd>
          back
        </span>
      </div>
    </div>
  );
}
