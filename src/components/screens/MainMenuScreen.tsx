import { useState } from 'react';
import { useGameStore } from '../../store/index.ts';
import type { SaveSlot } from '../../store/index.ts';

// ─── Helpers ────────────────────────────────────────────────────────────

function formatValuation(amount: number): string {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

// ─── Floating Bubbles Background (Web 2.0 pastel style) ────────────────

function BubblesBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Pastel gradient circles - Web 2.0 style */}
      <div
        className="absolute -top-24 -left-24 h-96 w-96 rounded-full opacity-30"
        style={{ background: 'radial-gradient(circle, #d8e6f3 0%, transparent 70%)' }}
      />
      <div
        className="absolute top-1/3 -right-32 h-80 w-80 rounded-full opacity-25"
        style={{ background: 'radial-gradient(circle, #d8f0d8 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-20 left-1/4 h-72 w-72 rounded-full opacity-25"
        style={{ background: 'radial-gradient(circle, #e8d8f0 0%, transparent 70%)' }}
      />
      <div
        className="absolute top-1/4 left-1/2 h-64 w-64 rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, #fff0e0 0%, transparent 70%)' }}
      />

      {/* Subtle pinstripe overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, #999999 0px, #999999 1px, transparent 1px, transparent 4px)',
        }}
      />
    </div>
  );
}

// ─── About Modal ────────────────────────────────────────────────────────

function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="retro-modal-overlay">
      <div className="retro-modal relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-retro-text-light transition-colors hover:text-retro-text"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="retro-section-heading mb-4 text-xl">About</h2>

        <div className="space-y-4 text-sm leading-relaxed text-retro-text-muted">
          <p>
            <span className="font-semibold text-retro-text">Here Comes Another Bubble</span> is a
            satirical startup simulation game set in the AI gold rush of 2025.
          </p>
          <p>
            Found a company, hire engineers (or replace them with AI agents), chase funding rounds,
            ship features, navigate absurd events, and try to IPO before the bubble pops.
          </p>
          <p>
            Inspired by the real chaos of Silicon Valley &mdash; pitch decks, burn rates, pivot fever,
            and the eternal question: "But does it scale?"
          </p>
          <hr className="retro-hr" />
          <div className="text-xs text-retro-text-light">
            Built with React, TypeScript, Zustand, and questionable business judgment.
          </div>
        </div>

        <button
          onClick={onClose}
          className="btn-glossy btn-silver mt-6 w-full"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ─── Load Game Modal ────────────────────────────────────────────────────

function LoadGameModal({ onClose }: { onClose: () => void }) {
  const getSaveSlots = useGameStore((s) => s.getSaveSlots);
  const loadGame = useGameStore((s) => s.loadGame);
  const deleteSave = useGameStore((s) => s.deleteSave);

  const [slots, setSlots] = useState<SaveSlot[]>(() => getSaveSlots());
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  function handleLoad(slot: number) {
    loadGame(slot);
    onClose();
  }

  function handleDelete(slot: number) {
    if (confirmDelete === slot) {
      deleteSave(slot);
      setSlots(getSaveSlots());
      setConfirmDelete(null);
    } else {
      setConfirmDelete(slot);
    }
  }

  return (
    <div className="retro-modal-overlay">
      <div className="retro-modal relative max-w-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-retro-text-light transition-colors hover:text-retro-text"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="retro-section-heading mb-6 text-xl">Load Game</h2>

        {slots.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mb-3 text-retro-text-light">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25-2.25M12 13.875V7.5m0 0l-2.25 2.25M12 7.5l2.25 2.25" />
              </svg>
            </div>
            <p className="text-retro-text-muted">No saved games found.</p>
            <p className="mt-1 text-xs text-retro-text-light">Start a new game and save your progress.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {slots.map((slot) => (
              <div
                key={slot.slot}
                className="retro-card group flex items-center justify-between transition-shadow hover:shadow-md"
              >
                <button
                  onClick={() => handleLoad(slot.slot)}
                  className="flex-1 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold text-white"
                      style={{ background: 'linear-gradient(to bottom, #5588bb, #336699)' }}
                    >
                      {slot.slot + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-retro-text">{slot.companyName}</div>
                      <div className="mt-0.5 flex items-center gap-3 text-xs text-retro-text-muted">
                        <span>Week {slot.week}</span>
                        <span className="text-retro-border">&bull;</span>
                        <span className="font-semibold text-retro-green">{formatValuation(slot.cash)}</span>
                        <span className="text-retro-border">&bull;</span>
                        <span>Val: {formatValuation(slot.valuation)}</span>
                        <span className="text-retro-border">&bull;</span>
                        <span>{formatDate(slot.savedAt)}</span>
                      </div>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => handleDelete(slot.slot)}
                  className="btn-glossy btn-red ml-4 px-2 py-1 text-xs"
                  title={confirmDelete === slot.slot ? 'Click again to confirm' : 'Delete save'}
                >
                  {confirmDelete === slot.slot ? 'Confirm?' : 'Delete'}
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="btn-glossy btn-silver mt-6 w-full"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Main Menu Screen ───────────────────────────────────────────────────

export function MainMenuScreen() {
  const setScreen = useGameStore((s) => s.setScreen);

  const [showAbout, setShowAbout] = useState(false);
  const [showLoad, setShowLoad] = useState(false);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-retro-bg px-4">
      <BubblesBackground />

      {/* Content */}
      <div className="relative z-10 flex w-full max-w-lg flex-col items-center">
        {/* Logo / Title area */}
        <div className="mb-12 text-center">
          {/* Decorative accent line */}
          <hr className="retro-hr mx-auto mb-6 w-32" />

          <h1 className="mb-3 font-[--font-retro-heading] text-5xl leading-tight font-extrabold tracking-tight text-retro-blue-dark sm:text-6xl">
            Here Comes
            <br />
            <span className="text-retro-orange">
              Another Bubble
            </span>
          </h1>

          <p className="mt-4 font-[--font-retro] text-lg text-retro-text-muted">
            Build your AI startup. Try not to die.
          </p>

          {/* Decorative accent line */}
          <hr className="retro-hr mx-auto mt-6 w-32" />
        </div>

        {/* Menu buttons */}
        <div className="flex w-full max-w-xs flex-col gap-3">
          {/* New Game - primary action */}
          <button
            onClick={() => setScreen('newgame')}
            className="btn-glossy btn-glossy-lg btn-green w-full"
          >
            New Game
          </button>

          {/* Load Game */}
          <button
            onClick={() => setShowLoad(true)}
            className="btn-glossy btn-glossy-lg btn-primary w-full"
          >
            Load Game
          </button>

          {/* Leaderboard */}
          <button
            onClick={() => setScreen('leaderboard')}
            className="btn-glossy btn-glossy-lg btn-silver w-full"
          >
            Leaderboard
          </button>

          {/* About */}
          <button
            onClick={() => setShowAbout(true)}
            className="mt-1 px-6 py-3 text-sm font-medium text-retro-text-light underline decoration-retro-border transition-colors hover:text-retro-blue"
          >
            About
          </button>
        </div>

        {/* Version tag */}
        <p className="mt-12 font-[--font-retro-mono] text-xs text-retro-text-light">v0.1.0</p>
      </div>

      {/* Modals */}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
      {showLoad && <LoadGameModal onClose={() => setShowLoad(false)} />}
    </div>
  );
}
