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

// ─── Floating Bubbles Background ────────────────────────────────────────

function BubblesBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Floating circle blobs */}
      <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-900/20 blur-3xl" />
      <div className="absolute top-1/3 -right-32 h-80 w-80 rounded-full bg-blue-900/15 blur-3xl" />
      <div className="absolute -bottom-20 left-1/4 h-72 w-72 rounded-full bg-violet-900/15 blur-3xl" />
      <div className="absolute top-1/4 left-1/2 h-64 w-64 rounded-full bg-amber-900/10 blur-3xl" />

      {/* Grid lines overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />
    </div>
  );
}

// ─── About Modal ────────────────────────────────────────────────────────

function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative mx-4 max-w-lg rounded-lg border border-gray-800 bg-gray-900 p-8 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 transition-colors hover:text-gray-300"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="mb-4 text-2xl font-bold text-gray-100">About</h2>

        <div className="space-y-4 text-sm leading-relaxed text-gray-400">
          <p>
            <span className="font-semibold text-gray-200">Here Comes Another Bubble</span> is a
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
          <div className="border-t border-gray-800 pt-4 text-xs text-gray-500">
            Built with React, TypeScript, Zustand, and questionable business judgment.
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-200 transition-colors hover:bg-gray-700"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-xl rounded-lg border border-gray-800 bg-gray-900 p-8 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 transition-colors hover:text-gray-300"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="mb-6 text-2xl font-bold text-gray-100">Load Game</h2>

        {slots.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mb-3 text-4xl text-gray-600">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25-2.25M12 13.875V7.5m0 0l-2.25 2.25M12 7.5l2.25 2.25" />
              </svg>
            </div>
            <p className="text-gray-500">No saved games found.</p>
            <p className="mt-1 text-xs text-gray-600">Start a new game and save your progress.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {slots.map((slot) => (
              <div
                key={slot.slot}
                className="group flex items-center justify-between rounded-lg border border-gray-800 bg-gray-800/50 p-4 transition-colors hover:border-gray-700 hover:bg-gray-800"
              >
                <button
                  onClick={() => handleLoad(slot.slot)}
                  className="flex-1 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-900/40 text-sm font-bold text-blue-400">
                      {slot.slot + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-100">{slot.companyName}</div>
                      <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
                        <span>Week {slot.week}</span>
                        <span className="text-gray-700">&bull;</span>
                        <span className="text-emerald-500">{formatValuation(slot.valuation)}</span>
                        <span className="text-gray-700">&bull;</span>
                        <span>{formatDate(slot.savedAt)}</span>
                      </div>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => handleDelete(slot.slot)}
                  className="ml-4 rounded px-2 py-1 text-xs text-gray-600 transition-colors hover:bg-red-900/30 hover:text-red-400"
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
          className="mt-6 w-full rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-200 transition-colors hover:bg-gray-700"
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
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4">
      <BubblesBackground />

      {/* Content */}
      <div className="relative z-10 flex w-full max-w-lg flex-col items-center">
        {/* Logo / Title area */}
        <div className="mb-12 text-center">
          {/* Decorative accent line */}
          <div className="mx-auto mb-6 h-px w-24 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />

          <h1 className="mb-3 text-5xl leading-tight font-extrabold tracking-tight text-gray-100 sm:text-6xl">
            Here Comes
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
              Another Bubble
            </span>
          </h1>

          <p className="mt-4 text-lg text-gray-500">
            Build your AI startup. Try not to crash.
          </p>

          {/* Decorative accent line */}
          <div className="mx-auto mt-6 h-px w-24 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
        </div>

        {/* Menu buttons */}
        <div className="flex w-full max-w-xs flex-col gap-3">
          {/* New Game - primary action */}
          <button
            onClick={() => setScreen('newgame')}
            className="group relative overflow-hidden rounded-lg bg-emerald-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-900/30 transition-all hover:bg-emerald-500 hover:shadow-emerald-900/50 active:scale-[0.98]"
          >
            <span className="relative z-10">New Game</span>
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
          </button>

          {/* Load Game */}
          <button
            onClick={() => setShowLoad(true)}
            className="rounded-lg border border-gray-800 bg-gray-900 px-6 py-4 text-base font-medium text-gray-300 transition-all hover:border-gray-700 hover:bg-gray-800 hover:text-gray-100 active:scale-[0.98]"
          >
            Load Game
          </button>

          {/* Leaderboard */}
          <button
            onClick={() => setScreen('leaderboard')}
            className="rounded-lg border border-gray-800 bg-gray-900 px-6 py-4 text-base font-medium text-gray-300 transition-all hover:border-gray-700 hover:bg-gray-800 hover:text-gray-100 active:scale-[0.98]"
          >
            Leaderboard
          </button>

          {/* About */}
          <button
            onClick={() => setShowAbout(true)}
            className="rounded-lg px-6 py-3 text-sm font-medium text-gray-500 transition-colors hover:text-gray-300"
          >
            About
          </button>
        </div>

        {/* Version tag */}
        <p className="mt-12 text-xs text-gray-700">v0.1.0</p>
      </div>

      {/* Modals */}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
      {showLoad && <LoadGameModal onClose={() => setShowLoad(false)} />}
    </div>
  );
}
