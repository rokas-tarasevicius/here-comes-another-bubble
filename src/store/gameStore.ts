import { create } from 'zustand';
import type {
  GameState,
  FounderArchetype,
  MarketSegment,
  Difficulty,
  Tone,
} from '../types/index.ts';
import type { PlayerDecision } from '../types/decisions.ts';
import { createInitialState, advanceWeek, applySeekFunding } from '../engine/index.ts';

// ─── Save slot metadata ──────────────────────────────────────────────

export interface SaveSlot {
  slot: number;
  companyName: string;
  week: number;
  valuation: number;
  savedAt: string;
}

interface SavePayload {
  gameState: GameState;
  savedAt: string;
}

const SAVE_KEY_PREFIX = 'hcab-save-';
const MAX_SLOTS = 5;

// ─── Store types ─────────────────────────────────────────────────────

interface GameStoreState {
  gameState: GameState | null;
  currentScreen: string;
  decisionsThisTurn: PlayerDecision[];
  isSimulating: boolean;
  showWeekRecap: boolean;
}

interface GameStoreActions {
  newGame: (
    companyName: string,
    archetype: FounderArchetype,
    segment: MarketSegment,
    difficulty: Difficulty,
    tone: Tone,
  ) => void;
  endWeek: () => void;
  addDecision: (decision: PlayerDecision) => void;
  removeDecision: (index: number) => void;
  clearDecisions: () => void;
  setScreen: (screen: string) => void;
  setGrowthStrategy: (strategy: string) => void;
  dismissWeekRecap: () => void;
  seekFunding: (targetStage: string) => void;
  saveGame: (slot?: number) => void;
  loadGame: (slot: number) => void;
  getSaveSlots: () => SaveSlot[];
  deleteSave: (slot: number) => void;
}

export type GameStore = GameStoreState & GameStoreActions;

// ─── Store implementation ────────────────────────────────────────────

export const useGameStore = create<GameStore>()((set, get) => ({
  // ── State ──────────────────────────────────────────────────────────
  gameState: null,
  currentScreen: 'title',
  decisionsThisTurn: [],
  isSimulating: false,
  showWeekRecap: false,

  // ── Actions ────────────────────────────────────────────────────────

  newGame(companyName, archetype, segment, difficulty, tone) {
    const gameState = createInitialState(
      companyName,
      archetype,
      segment,
      difficulty,
      tone,
    );
    set({
      gameState,
      currentScreen: 'overview',
      decisionsThisTurn: [],
      isSimulating: false,
    });
  },

  endWeek() {
    const { gameState, decisionsThisTurn } = get();
    if (!gameState) return;

    set({ isSimulating: true });

    const nextState = advanceWeek(gameState, decisionsThisTurn);

    set({
      gameState: nextState,
      decisionsThisTurn: [],
      isSimulating: false,
      showWeekRecap: true,
    });
  },

  addDecision(decision) {
    set((state) => ({
      decisionsThisTurn: [...state.decisionsThisTurn, decision],
    }));
  },

  removeDecision(index) {
    set((state) => ({
      decisionsThisTurn: state.decisionsThisTurn.filter((_, i) => i !== index),
    }));
  },

  clearDecisions() {
    set({ decisionsThisTurn: [] });
  },

  dismissWeekRecap() {
    set({ showWeekRecap: false, currentScreen: 'overview' });
  },

  setScreen(screen) {
    set({ currentScreen: screen });
  },

  setGrowthStrategy(strategy) {
    const { gameState } = get();
    if (!gameState) return;
    set({
      gameState: {
        ...gameState,
        meta: {
          ...gameState.meta,
          growthStrategy: strategy,
        },
      },
    });
  },

  seekFunding(targetStage) {
    const { gameState } = get();
    if (!gameState) return;
    const nextState = applySeekFunding(gameState, targetStage);
    set({ gameState: nextState });
  },

  saveGame(slot = 0) {
    if (slot < 0 || slot >= MAX_SLOTS) return;
    const { gameState } = get();
    if (!gameState) return;

    const payload: SavePayload = {
      gameState,
      savedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(
        `${SAVE_KEY_PREFIX}${slot}`,
        JSON.stringify(payload),
      );
    } catch {
      // Storage full or unavailable
    }
  },

  loadGame(slot) {
    if (slot < 0 || slot >= MAX_SLOTS) return;
    const raw = localStorage.getItem(`${SAVE_KEY_PREFIX}${slot}`);
    if (!raw) return;

    try {
      const payload: SavePayload = JSON.parse(raw);
      set({
        gameState: payload.gameState,
        currentScreen: 'overview',
        decisionsThisTurn: [],
        isSimulating: false,
      });
    } catch {
      // Corrupted save data
    }
  },

  getSaveSlots() {
    const slots: SaveSlot[] = [];

    for (let i = 0; i < MAX_SLOTS; i++) {
      const raw = localStorage.getItem(`${SAVE_KEY_PREFIX}${i}`);
      if (!raw) continue;

      try {
        const payload: SavePayload = JSON.parse(raw);
        slots.push({
          slot: i,
          companyName: payload.gameState.company.name,
          week: payload.gameState.meta.week,
          valuation: payload.gameState.company.valuation,
          savedAt: payload.savedAt,
        });
      } catch {
        // Corrupted save data — skip
      }
    }

    return slots;
  },

  deleteSave(slot) {
    if (slot < 0 || slot >= MAX_SLOTS) return;
    localStorage.removeItem(`${SAVE_KEY_PREFIX}${slot}`);
  },
}));
