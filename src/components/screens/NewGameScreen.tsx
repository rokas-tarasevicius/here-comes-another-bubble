import { useState } from 'react';
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
    color: 'emerald',
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
    color: 'amber',
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

// ─── Stat Bar ───────────────────────────────────────────────────────────

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    emerald: 'bg-emerald-500',
    violet: 'bg-violet-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  };

  return (
    <div className="flex items-center gap-2">
      <span className="w-20 text-xs text-gray-500 shrink-0">{label}</span>
      <div className="h-1.5 flex-1 rounded-full bg-gray-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClasses[color] ?? 'bg-blue-500'}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <span className="w-7 text-right text-xs font-mono text-gray-500">{value}</span>
    </div>
  );
}

// ─── Market Stat Indicator ──────────────────────────────────────────────

function MarketStat({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  const colorClasses: Record<string, string> = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-xs font-mono text-gray-400">
          {typeof value === 'number' && value <= 1 ? `${(value * 100).toFixed(0)}%` : value}
        </span>
      </div>
      <div className="h-1 rounded-full bg-gray-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClasses[color] ?? 'bg-blue-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Step Indicator ─────────────────────────────────────────────────────

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
                className={`h-px w-6 transition-colors sm:w-10 ${
                  isCompleted ? 'bg-emerald-600' : 'bg-gray-800'
                }`}
              />
            )}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                    : isCompleted
                      ? 'bg-emerald-900/60 text-emerald-400'
                      : 'bg-gray-800 text-gray-600'
                }`}
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
                className={`hidden text-[10px] sm:block ${
                  isActive ? 'text-gray-300' : 'text-gray-600'
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
      <div className="mb-2 text-4xl">
        <svg className="mx-auto h-12 w-12 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
        </svg>
      </div>
      <h2 className="mb-2 text-2xl font-bold text-gray-100">Name Your Startup</h2>
      <p className="mb-8 text-sm text-gray-500">
        Choose wisely. This name will appear on pitch decks, Hacker News roasts, and your Series A term sheet.
      </p>

      <div className="w-full max-w-sm">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter your startup name..."
          maxLength={40}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-center text-lg font-medium text-gray-100 placeholder-gray-600 outline-none transition-colors focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
          autoFocus
        />
        <p className="mt-2 text-center text-xs text-gray-600">
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
        <h2 className="mb-2 text-2xl font-bold text-gray-100">Choose Your Founder</h2>
        <p className="text-sm text-gray-500">
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
              className={`group cursor-pointer rounded-lg border p-4 text-left transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-950/30 shadow-lg shadow-blue-900/20'
                  : 'border-gray-800 bg-gray-900 hover:border-gray-700 hover:bg-gray-800/80'
              }`}
            >
              {/* Header */}
              <div className="mb-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-100">{founder.displayName}</h3>
                  {isSelected && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500">
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium text-blue-400">{founder.tagline}</span>
              </div>

              {/* Description */}
              <p className="mb-4 text-xs leading-relaxed text-gray-500">
                {founder.description}
              </p>

              {/* Stats */}
              <div className="mb-3 space-y-1.5">
                <StatBar label="Tech" value={founder.stats.techSkill} color="blue" />
                <StatBar label="Business" value={founder.stats.bizSkill} color="emerald" />
                <StatBar label="Network" value={founder.stats.network} color="violet" />
                <StatBar label="Reputation" value={founder.stats.reputation} color="amber" />
                <StatBar label="Learning" value={founder.stats.learning} color="red" />
              </div>

              {/* Footer info */}
              <div className="border-t border-gray-800 pt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Starting Cash</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {formatCash(founder.startingCash)}
                  </span>
                </div>
                <div className="mt-2 rounded bg-gray-800/60 px-2 py-1.5 text-[11px] leading-relaxed text-gray-400">
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
        <h2 className="mb-2 text-2xl font-bold text-gray-100">Choose Your Market</h2>
        <p className="text-sm text-gray-500">
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
                  ? 'border-blue-500 bg-blue-950/30 shadow-lg shadow-blue-900/20'
                  : 'border-gray-800 bg-gray-900 hover:border-gray-700 hover:bg-gray-800/80'
              }`}
            >
              {/* Header */}
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-bold text-gray-100">{seg.name}</h3>
                {isSelected && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500">
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Description */}
              <p className="mb-4 text-xs leading-relaxed text-gray-500">
                {seg.description}
              </p>

              {/* Stats */}
              <div className="space-y-2.5">
                <MarketStat
                  label="Market Size"
                  value={seg.size}
                  max={100_000}
                  color="emerald"
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
                  color="amber"
                />
                <MarketStat
                  label="Regulatory Risk"
                  value={seg.regulatoryRisk}
                  max={100}
                  color="red"
                />
              </div>

              {/* Market size callout */}
              <div className="mt-3 border-t border-gray-800 pt-3 text-center">
                <span className="text-[10px] uppercase tracking-wider text-gray-600">TAM</span>
                <div className="font-mono text-sm font-bold text-emerald-400">
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
  const difficultyBorderColors: Record<string, string> = {
    emerald: 'border-emerald-500 bg-emerald-950/30',
    blue: 'border-blue-500 bg-blue-950/30',
    amber: 'border-amber-500 bg-amber-950/30',
    red: 'border-red-500 bg-red-950/30',
  };

  const difficultyDotColors: Record<string, string> = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* Difficulty */}
      <div className="mb-8">
        <div className="mb-4 text-center">
          <h2 className="mb-2 text-2xl font-bold text-gray-100">Game Settings</h2>
          <p className="text-sm text-gray-500">
            How punishing should the market be, and how seriously should we take it?
          </p>
        </div>

        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
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
                    ? difficultyBorderColors[opt.color]
                    : 'border-gray-800 bg-gray-900 hover:border-gray-700 hover:bg-gray-800/80'
                }`}
              >
                <div className="mb-1 flex items-center gap-2">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${
                      isSelected ? difficultyDotColors[opt.color] : 'bg-gray-700'
                    }`}
                  />
                  <span className="font-bold text-gray-100">{opt.label}</span>
                </div>
                <p className="text-xs leading-relaxed text-gray-500">
                  {opt.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tone */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
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
                    ? 'border-violet-500 bg-violet-950/30'
                    : 'border-gray-800 bg-gray-900 hover:border-gray-700 hover:bg-gray-800/80'
                }`}
              >
                <div className="mb-1 flex items-center gap-2">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${
                      isSelected ? 'bg-violet-500' : 'bg-gray-700'
                    }`}
                  />
                  <span className="font-bold text-gray-100">{opt.label}</span>
                </div>
                <p className="text-xs leading-relaxed text-gray-500">
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

  const difficultyColors: Record<Difficulty, string> = {
    easy: 'text-emerald-400',
    normal: 'text-blue-400',
    hard: 'text-amber-400',
    nightmare: 'text-red-400',
  };

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-2xl font-bold text-gray-100">Ready to Launch</h2>
        <p className="text-sm text-gray-500">
          Review your choices. There is no going back after this. Well, there is, but it costs VC credibility.
        </p>
      </div>

      <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
        {/* Company Name */}
        <div className="mb-6 text-center">
          <span className="text-[10px] uppercase tracking-widest text-gray-600">Company</span>
          <h3 className="mt-1 text-3xl font-extrabold text-gray-100">{companyName}</h3>
        </div>

        <div className="space-y-4">
          {/* Founder */}
          <div className="flex items-start justify-between rounded-md bg-gray-800/50 p-3">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-gray-600">Founder</span>
              <div className="font-semibold text-gray-200">
                {founder?.displayName ?? archetype}
              </div>
              <div className="text-xs text-blue-400">{founder?.tagline}</div>
            </div>
            <span className="font-mono text-sm font-bold text-emerald-400">
              {founder ? formatCash(founder.startingCash) : ''}
            </span>
          </div>

          {/* Market */}
          <div className="rounded-md bg-gray-800/50 p-3">
            <span className="text-[10px] uppercase tracking-wider text-gray-600">Market Segment</span>
            <div className="font-semibold text-gray-200">{market.name}</div>
            <div className="mt-1 text-xs text-gray-500">
              TAM: {formatMarketSize(market.size)} &middot; Growth: {(market.growthRate * 100).toFixed(0)}%
            </div>
          </div>

          {/* Settings */}
          <div className="flex gap-3">
            <div className="flex-1 rounded-md bg-gray-800/50 p-3">
              <span className="text-[10px] uppercase tracking-wider text-gray-600">Difficulty</span>
              <div className={`font-semibold ${difficultyColors[difficulty]}`}>
                {difficultyLabels[difficulty]}
              </div>
            </div>
            <div className="flex-1 rounded-md bg-gray-800/50 p-3">
              <span className="text-[10px] uppercase tracking-wider text-gray-600">Tone</span>
              <div className="font-semibold text-violet-400">
                {toneLabels[tone]}
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
      className="flex min-h-screen flex-col bg-gray-950"
      onKeyDown={handleKeyDown}
    >
      {/* Top bar with step indicator */}
      <div className="border-b border-gray-800 bg-gray-950 px-6 py-4">
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
      <div className="border-t border-gray-800 bg-gray-950 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          {/* Back */}
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-900 hover:text-gray-200"
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
              className={`flex items-center gap-1.5 rounded-lg px-6 py-2.5 text-sm font-semibold transition-all ${
                canAdvance()
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30 hover:bg-emerald-500 active:scale-[0.98]'
                  : 'cursor-not-allowed bg-gray-800 text-gray-600'
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
              className="group relative overflow-hidden rounded-lg bg-emerald-600 px-8 py-3 text-base font-bold text-white shadow-lg shadow-emerald-900/40 transition-all hover:bg-emerald-500 hover:shadow-emerald-900/60 active:scale-[0.98]"
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.841m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                </svg>
                Launch Your Startup
              </span>
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
