import { useState, useMemo } from 'react';
import { useGameStore } from '../../store/index.ts';
import { formatCurrency } from '../../utils/format.ts';
import { ThemeToggle } from '../shared/ThemeToggle.tsx';

// ─── Floating Bubbles Background (Web 2.0 pastel style) ────────────────

function BubblesBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Pastel gradient circles - Web 2.0 style */}
      <div className="blob-blue absolute -top-24 -left-24 h-96 w-96 rounded-full opacity-30" />
      <div className="blob-green absolute top-1/3 -right-32 h-80 w-80 rounded-full opacity-25" />
      <div className="blob-purple absolute -bottom-20 left-1/4 h-72 w-72 rounded-full opacity-25" />
      <div className="blob-orange absolute top-1/4 left-1/2 h-64 w-64 rounded-full opacity-20" />

      {/* Subtle pinstripe overlay */}
      <div className="pinstripe-overlay absolute inset-0 opacity-[0.04]" />
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

// ─── Main Menu Screen ───────────────────────────────────────────────────

export function MainMenuScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const loadGame = useGameStore((s) => s.loadGame);
  const deleteSave = useGameStore((s) => s.deleteSave);
  const getSaveSlots = useGameStore((s) => s.getSaveSlots);

  const [showAbout, setShowAbout] = useState(false);
  const [showSaves, setShowSaves] = useState(false);
  const [saveVersion, setSaveVersion] = useState(0);

  const saves = useMemo(() => getSaveSlots(), [getSaveSlots, saveVersion]);
  const hasSaves = saves.length > 0;
  const latestSave = hasSaves ? saves.reduce((a, b) => new Date(a.savedAt) > new Date(b.savedAt) ? a : b) : null;

  function handleContinue() {
    if (latestSave) {
      loadGame(latestSave.slot);
    }
  }

  function handleLoadSlot(slot: number) {
    loadGame(slot);
    setShowSaves(false);
  }

  function handleDeleteSlot(slot: number) {
    deleteSave(slot);
    setSaveVersion(v => v + 1);
  }

  function formatSaveDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-retro-bg px-4">
      <BubblesBackground />

      {/* Theme toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Content */}
      <div className="relative z-10 flex w-full max-w-lg flex-col items-center">
        {/* Logo / Title area */}
        <div className="mb-12 text-center">
          <hr className="retro-hr mx-auto mb-6 w-32" />

          <h1 className="mb-3 text-5xl leading-tight font-extrabold tracking-tight text-retro-blue-dark sm:text-6xl">
            Here Comes
            <br />
            <span className="text-retro-orange">
              Another Bubble
            </span>
          </h1>

          <p className="mt-4 text-lg text-retro-text-muted">
            Build your AI startup. Try not to die.
          </p>

          <hr className="retro-hr mx-auto mt-6 w-32" />
        </div>

        {/* Menu buttons */}
        <div className="flex w-full max-w-sm flex-col gap-3">
          {/* Continue - only if saves exist */}
          {hasSaves && (
            <button
              onClick={handleContinue}
              className="btn-glossy btn-glossy-lg btn-primary w-full"
            >
              Continue
            </button>
          )}

          {/* New Game - always green */}
          <button
            onClick={() => setScreen('newgame')}
            className="btn-glossy btn-glossy-lg btn-green w-full"
          >
            New Game
          </button>

          {/* Load Game - only if saves exist */}
          {hasSaves && (
            <button
              onClick={() => setShowSaves(true)}
              className="btn-glossy btn-glossy-lg btn-silver w-full"
            >
              Load Game
            </button>
          )}

          {/* About */}
          <button
            onClick={() => setShowAbout(true)}
            className="btn-glossy btn-glossy-lg btn-silver w-full"
          >
            About
          </button>
        </div>

        {/* Version tag */}
        <p className="mt-12 font-retro-mono text-xs text-retro-text-light">v0.1.0</p>
      </div>

      {/* Modals */}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
      {showSaves && (
        <div className="retro-modal-overlay">
          <div className="retro-modal relative w-full max-w-md">
            <button
              onClick={() => setShowSaves(false)}
              className="absolute top-4 right-4 text-retro-text-light transition-colors hover:text-retro-text"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="retro-section-heading mb-4 text-xl">Load Game</h2>

            <div className="space-y-2">
              {saves.length === 0 ? (
                <p className="text-sm text-retro-text-muted py-4 text-center">No saved games found.</p>
              ) : (
                saves.map(save => (
                  <div
                    key={save.slot}
                    className="retro-candidate-card flex items-center justify-between gap-3"
                  >
                    <button
                      onClick={() => handleLoadSlot(save.slot)}
                      className="flex-1 text-left min-w-0"
                    >
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-bold text-[--color-retro-text] truncate">{save.companyName}</span>
                        <span className="retro-label shrink-0">Week {save.week}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="retro-stat-tag">
                          <span className="retro-stat-tag-label">Cash</span>
                          <span className="retro-stat-tag-value">{formatCurrency(save.cash)}</span>
                        </span>
                        <span className="retro-stat-tag">
                          <span className="retro-stat-tag-label">Val</span>
                          <span className="retro-stat-tag-value">{formatCurrency(save.valuation)}</span>
                        </span>
                        <span className="text-[10px] text-[--color-retro-text-muted] ml-auto shrink-0">
                          {formatSaveDate(save.savedAt)}
                        </span>
                      </div>
                    </button>
                    <button
                      onClick={() => handleDeleteSlot(save.slot)}
                      className="shrink-0 rounded-md p-1.5 text-[--color-retro-text-muted] hover:bg-[--color-retro-red]/10 hover:text-[--color-retro-red]"
                      title="Delete save"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setShowSaves(false)}
              className="btn-glossy btn-silver mt-4 w-full"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
