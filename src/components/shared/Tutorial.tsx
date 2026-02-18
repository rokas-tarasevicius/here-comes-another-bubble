import { useEffect } from 'react';
import { useGameStore } from '../../store/index.ts';

// ─── Tutorial steps ─────────────────────────────────────────────────────

interface TutorialStepDef {
  screen: string;
  title: string;
  message: string;
}

const STEPS: TutorialStepDef[] = [
  {
    screen: 'overview',
    title: 'Welcome to Your Startup',
    message:
      'This is your dashboard. Track cash, customers, valuation, and runway at a glance. Your goal: IPO before the bubble pops — or at least don\'t go bankrupt.',
  },
  {
    screen: 'overview',
    title: 'The Header',
    message:
      'The top bar shows your company, current week, and cash. Press "Next Week" to advance time — but you must resolve any pending decisions first.',
  },
  {
    screen: 'company',
    title: 'Your Company',
    message:
      'Manage your team here. Candidates will appear over time — hire wisely. Each team member has skills, salary, and morale.',
  },
  {
    screen: 'finance',
    title: 'Finances',
    message:
      'Monitor cash flow, revenue, burn rate, and runway. Change your pricing model and seek funding rounds from the fundraising panel.',
  },
  {
    screen: 'market',
    title: 'The Market',
    message:
      'Watch the AI Bubble Index — when it drops, valuations crash. Keep an eye on competitors and market conditions.',
  },
  {
    screen: 'decisions',
    title: 'Decisions',
    message:
      'Events and decisions appear each week. Respond before advancing — some are urgent! Your choices shape your startup\'s fate.',
  },
];

// ─── Component ──────────────────────────────────────────────────────────

export function Tutorial() {
  const tutorialStep = useGameStore((s) => s.tutorialStep);
  const nextTutorialStep = useGameStore((s) => s.nextTutorialStep);
  const skipTutorial = useGameStore((s) => s.skipTutorial);
  const setScreen = useGameStore((s) => s.setScreen);

  const step = tutorialStep !== null ? STEPS[tutorialStep] : null;

  // Navigate to the correct screen when step changes
  useEffect(() => {
    if (step) {
      setScreen(step.screen);
    }
  }, [step, setScreen]);

  if (tutorialStep === null || !step) return null;

  const isLast = tutorialStep === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div
        className="retro-card-raised w-full max-w-sm mx-4"
        style={{ padding: '24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-1.5 mb-3">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: 8,
                height: 8,
                background:
                  i === tutorialStep
                    ? 'var(--color-retro-blue)'
                    : i < tutorialStep
                      ? 'var(--color-retro-green)'
                      : 'var(--color-retro-border)',
              }}
            />
          ))}
        </div>

        {/* Title */}
        <h2 className="text-lg font-bold font-[--font-retro-heading] text-[--color-retro-text] mb-2 text-center">
          {step.title}
        </h2>

        {/* Message */}
        <p className="text-sm text-[--color-retro-text-muted] text-center mb-5 leading-relaxed">
          {step.message}
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={skipTutorial}
            className="btn-glossy btn-gray flex-1"
          >
            Skip Tutorial
          </button>
          <button
            onClick={nextTutorialStep}
            className="btn-glossy btn-green flex-1"
            autoFocus
          >
            {isLast ? 'Got It!' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
