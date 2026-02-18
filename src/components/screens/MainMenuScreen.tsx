import { useState } from 'react';
import { useGameStore } from '../../store/index.ts';

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

// ─── Main Menu Screen ───────────────────────────────────────────────────

export function MainMenuScreen() {
  const setScreen = useGameStore((s) => s.setScreen);

  const [showAbout, setShowAbout] = useState(false);


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
    </div>
  );
}
