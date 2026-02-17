import { create } from 'zustand';
import type {
  GameState,
  FounderArchetype,
  MarketSegment,
  Difficulty,
  Tone,
  ProductFocus,
  AcquisitionChannel,
} from '../types/index.ts';
import type { PlayerDecision } from '../types/decisions.ts';
import type { Feature } from '../types/index.ts';
import { createInitialState, advanceWeek, applySeekFunding } from '../engine/index.ts';
import { generateId } from '../utils/id.ts';

// ─── Save slot metadata ──────────────────────────────────────────────

export interface SaveSlot {
  slot: number;
  companyName: string;
  week: number;
  valuation: number;
  cash: number;
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
  lastSaveTime: number | null;
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
  setProductFocus: (focus: ProductFocus) => void;
  setAcquisitionChannel: (channel: AcquisitionChannel) => void;
  startFeature: (name: string, description: string, marketRelevance: number) => void;
  setMarketingBudget: (amount: number) => void;
  hireTeam: (count: number, salary: number) => void;
  fireTeam: (count: number) => void;
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
  lastSaveTime: null,

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

  setProductFocus(focus) {
    const { gameState } = get();
    if (!gameState) return;
    set({
      gameState: {
        ...gameState,
        meta: {
          ...gameState.meta,
          productFocus: focus,
        },
      },
    });
  },

  setAcquisitionChannel(channel) {
    const { gameState } = get();
    if (!gameState) return;
    set({
      gameState: {
        ...gameState,
        meta: {
          ...gameState.meta,
          acquisitionChannel: channel,
          // Reset SEO weeks if switching away from content-seo
          contentSeoWeeks: channel === 'content-seo' ? gameState.meta.contentSeoWeeks : 0,
        },
      },
    });
  },

  startFeature(name, description, marketRelevance) {
    const { gameState } = get();
    if (!gameState) return;
    const newFeature: Feature = {
      id: generateId(),
      name,
      description,
      status: 'in-progress',
      progress: 0,
      quality: 0,
      marketRelevance,
    };
    set({
      gameState: {
        ...gameState,
        product: {
          ...gameState.product,
          features: [...gameState.product.features, newFeature],
        },
      },
    });
  },

  setMarketingBudget(amount) {
    const { gameState } = get();
    if (!gameState) return;
    set({
      gameState: {
        ...gameState,
        finances: {
          ...gameState.finances,
          marketingSpend: Math.max(0, Math.round(amount)),
        },
      },
    });
  },

  hireTeam(count, salary) {
    const { gameState } = get();
    if (!gameState) return;
    const hiringCost = count * salary * 2;
    if (gameState.finances.cash < hiringCost) return;
    const oldTotal = gameState.team.teamSize * gameState.team.avgSalary;
    const newTotal = oldTotal + count * salary;
    const newSize = gameState.team.teamSize + count;
    const culturePenalty = count >= 3 ? -5 : count >= 2 ? -3 : 0;
    set({
      gameState: {
        ...gameState,
        team: {
          ...gameState.team,
          teamSize: newSize,
          avgSalary: newSize > 0 ? Math.round(newTotal / newSize) : salary,
        },
        company: {
          ...gameState.company,
          culture: Math.max(0, gameState.company.culture + culturePenalty),
        },
        finances: {
          ...gameState.finances,
          cash: gameState.finances.cash - hiringCost,
        },
      },
    });
  },

  fireTeam(count) {
    const { gameState } = get();
    if (!gameState || gameState.team.teamSize === 0) return;
    const actual = Math.min(count, gameState.team.teamSize);
    const moralePenalty = actual >= 3 ? -12 : actual >= 2 ? -8 : -4;
    set({
      gameState: {
        ...gameState,
        team: {
          ...gameState.team,
          teamSize: gameState.team.teamSize - actual,
          morale: Math.max(0, gameState.team.morale + moralePenalty),
        },
        company: {
          ...gameState.company,
          culture: Math.max(0, gameState.company.culture - actual * 3),
          reputation: Math.max(0, gameState.company.reputation - actual),
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
      set({ lastSaveTime: Date.now() });
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
          cash: payload.gameState.finances.cash,
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
