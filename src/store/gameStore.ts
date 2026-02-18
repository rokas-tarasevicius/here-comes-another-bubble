import { create } from 'zustand';
import type {
  GameState,
  FounderArchetype,
  MarketSegment,
  Difficulty,
  Tone,
  ProductFocus,
  AcquisitionChannel,
  PricingModel,
  EventLogEntry,
  TeamMember,
} from '../types/index.ts';
import type { PlayerDecision } from '../types/decisions.ts';
import type { Feature } from '../types/index.ts';
import { createInitialState, advanceWeek, applySeekFunding } from '../engine/index.ts';
import { generateId } from '../utils/id.ts';
import { randomName } from '../data/names.ts';

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

const TUTORIAL_DONE_KEY = 'hcab-tutorial-done';

interface GameStoreState {
  gameState: GameState | null;
  currentScreen: string;
  decisionsThisTurn: PlayerDecision[];
  isSimulating: boolean;
  showWeekRecap: boolean;
  lastSaveTime: number | null;
  tutorialStep: number | null;
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
  setPricing: (model: PricingModel, price: number) => void;
  hireTeam: (count: number, salary: number) => void;
  fireTeam: (count: number) => void;
  makeOffer: (candidateId: string, salary: number) => void;
  fireMember: (memberId: string) => void;
  dismissWeekRecap: () => void;
  startTutorial: () => void;
  nextTutorialStep: () => void;
  skipTutorial: () => void;
  seekFunding: (targetStage: string) => void;
  continueInfiniteMode: () => void;
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
  tutorialStep: null,

  // ── Actions ────────────────────────────────────────────────────────

  newGame(companyName, archetype, segment, difficulty, tone) {
    const gameState = createInitialState(
      companyName,
      archetype,
      segment,
      difficulty,
      tone,
    );
    const tutorialDone = localStorage.getItem(TUTORIAL_DONE_KEY) === '1';
    set({
      gameState,
      currentScreen: 'overview',
      decisionsThisTurn: [],
      isSimulating: false,
      showWeekRecap: false,
      lastSaveTime: null,
      tutorialStep: tutorialDone ? null : 0,
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

  startTutorial() {
    set({ tutorialStep: 0 });
  },

  nextTutorialStep() {
    const { tutorialStep } = get();
    if (tutorialStep === null) return;
    const maxStep = 5;
    if (tutorialStep >= maxStep) {
      localStorage.setItem(TUTORIAL_DONE_KEY, '1');
      set({ tutorialStep: null });
    } else {
      set({ tutorialStep: tutorialStep + 1 });
    }
  },

  skipTutorial() {
    localStorage.setItem(TUTORIAL_DONE_KEY, '1');
    set({ tutorialStep: null, currentScreen: 'overview' });
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

  setPricing(model, price) {
    const { gameState } = get();
    if (!gameState) return;

    const currentModel = gameState.finances.pricingModel;
    const week = gameState.meta.week;
    const lastChange = gameState.finances.lastPricingChangeWeek ?? 0;

    // Block model changes within 8-week cooldown
    if (currentModel !== model && (week - lastChange) < 8 && lastChange > 0) {
      return; // Too soon to switch models
    }

    let newState = { ...gameState };
    const newLogEntries: EventLogEntry[] = [];
    const currentPrice = gameState.finances.pricePerUnit;
    const customers = gameState.product.customers;

    // Switching costs when changing pricing MODEL
    if (currentModel !== model && customers > 0) {
      const customerLoss = 0.15;
      const reputationLoss = -5;

      const lostCustomers = Math.round(customers * customerLoss);
      newLogEntries.push({
        id: `pricing-${Date.now()}`,
        week,
        eventId: 'pricing-switch-penalty',
        title: 'Pricing Model Changed',
        description: `Switching from ${currentModel} to ${model} caused ${lostCustomers} customers to churn.`,
        category: 'product',
      });

      newState = {
        ...newState,
        product: {
          ...newState.product,
          customers: Math.max(0, newState.product.customers - lostCustomers),
        },
        company: {
          ...newState.company,
          reputation: Math.max(0, newState.company.reputation + reputationLoss),
        },
      };
    }

    // Price increase churn: customers leave when you raise prices
    // Severity scales with how much you raised and the segment's price sensitivity
    if (price > currentPrice && customers > 0 && currentPrice > 0) {
      const priceIncreaseRatio = price / currentPrice; // e.g. 2.0 = doubled price
      const sensitivity = gameState.market.segmentData.priceSensitivity;
      // Churn fraction: e.g. doubling price at 0.5 sensitivity = 25% churn
      // Extreme hikes (10x+) cap at losing most customers
      const churnFraction = Math.min(0.9, (priceIncreaseRatio - 1) * sensitivity * 0.5);
      const lostFromPriceHike = Math.round(newState.product.customers * churnFraction);

      if (lostFromPriceHike > 0) {
        newLogEntries.push({
          id: `price-hike-${Date.now()}`,
          week,
          eventId: 'price-hike-churn',
          title: 'Customers Left After Price Increase',
          description: `Raising price from $${currentPrice} to $${price} caused ${lostFromPriceHike} customers to leave.`,
          category: 'product',
        });

        newState = {
          ...newState,
          product: {
            ...newState.product,
            customers: Math.max(0, newState.product.customers - lostFromPriceHike),
          },
        };
      }
    }

    set({
      gameState: {
        ...newState,
        finances: {
          ...newState.finances,
          pricingModel: model,
          pricePerUnit: price,
          lastPricingChangeWeek: currentModel !== model ? week : newState.finances.lastPricingChangeWeek,
        },
        eventLog: [...newState.eventLog, ...newLogEntries],
      },
    });
  },

  hireTeam(count, salary) {
    const { gameState } = get();
    if (!gameState) return;
    const hiringCost = count * salary * 2;
    if (gameState.finances.cash < hiringCost) return;

    const roles: Array<'engineer' | 'designer' | 'marketer' | 'sales' | 'ops'> = ['engineer', 'designer', 'marketer', 'sales', 'ops'];
    const newMembers: TeamMember[] = [];
    for (let i = 0; i < count; i++) {
      newMembers.push({
        id: `hire-${Date.now()}-${i}`,
        name: randomName(),
        role: roles[Math.floor(Math.random() * 2)], // mostly engineers/designers
        skill: 40 + Math.floor(Math.random() * 30),
        salary,
        morale: 70 + Math.floor(Math.random() * 20),
        weekHired: gameState.meta.week,
        traits: [],
        boosts: {},
      });
    }

    const allMembers = [...gameState.team.members, ...newMembers];
    const newSize = allMembers.length;
    const newAvg = newSize > 0 ? Math.round(allMembers.reduce((s, m) => s + m.salary, 0) / newSize) : salary;
    const culturePenalty = count >= 3 ? -5 : count >= 2 ? -3 : 0;

    set({
      gameState: {
        ...gameState,
        team: {
          ...gameState.team,
          members: allMembers,
          teamSize: newSize,
          avgSalary: newAvg,
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
    if (!gameState || gameState.team.members.length === 0) return;
    const actual = Math.min(count, gameState.team.members.length);
    // Remove from the end (most recently hired)
    const newMembers = gameState.team.members.slice(0, -actual);
    const newSize = newMembers.length;
    const newAvg = newSize > 0 ? Math.round(newMembers.reduce((s, m) => s + m.salary, 0) / newSize) : 0;
    const moralePenalty = actual >= 3 ? -12 : actual >= 2 ? -8 : -4;
    set({
      gameState: {
        ...gameState,
        team: {
          ...gameState.team,
          members: newMembers,
          teamSize: newSize,
          avgSalary: newAvg,
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

  makeOffer(candidateId, salary) {
    const { gameState } = get();
    if (!gameState) return;
    const candidate = gameState.team.candidates.find(c => c.id === candidateId);
    if (!candidate) return;

    // Check if already have a pending offer for this candidate
    if (gameState.team.pendingOffers.some(o => o.candidateId === candidateId)) return;

    set({
      gameState: {
        ...gameState,
        team: {
          ...gameState.team,
          pendingOffers: [...gameState.team.pendingOffers, {
            candidateId,
            offeredSalary: salary,
            weekOffered: gameState.meta.week,
          }],
        },
      },
    });
  },

  fireMember(memberId) {
    const { gameState } = get();
    if (!gameState) return;
    const member = gameState.team.members.find(m => m.id === memberId);
    if (!member) return;

    const newMembers = gameState.team.members.filter(m => m.id !== memberId);
    const newSize = newMembers.length;
    const newAvg = newSize > 0 ? Math.round(newMembers.reduce((s, m) => s + m.salary, 0) / newSize) : 0;
    const moralePenalty = -4;

    set({
      gameState: {
        ...gameState,
        team: {
          ...gameState.team,
          members: newMembers,
          teamSize: newSize,
          avgSalary: newAvg,
          morale: Math.max(0, gameState.team.morale + moralePenalty),
        },
        company: {
          ...gameState.company,
          culture: Math.max(0, gameState.company.culture - 3),
          reputation: Math.max(0, gameState.company.reputation - 1),
        },
      },
    });
  },

  seekFunding(targetStage) {
    const { gameState } = get();
    if (!gameState) return;
    const nextState = applySeekFunding(gameState, targetStage);
    set({ gameState: { ...nextState, meta: { ...nextState.meta, fundingSoughtThisWeek: true } } });
  },

  continueInfiniteMode() {
    const { gameState } = get();
    if (!gameState || !gameState.meta.gameWon) return;
    set({
      gameState: {
        ...gameState,
        meta: {
          ...gameState.meta,
          gameWon: false,
          gameWonReason: undefined,
          infiniteMode: true,
        },
      },
      currentScreen: 'overview',
    });
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

      // Migrate saved legacy pricing models to subscription
      const legacyPricing = payload.gameState.finances.pricingModel as string;
      if (legacyPricing === 'freemium' || legacyPricing === 'free' || legacyPricing === 'enterprise' || legacyPricing === 'one-time') {
        payload.gameState.finances.pricingModel = 'subscription';
        if (payload.gameState.finances.pricePerUnit === 0) {
          payload.gameState.finances.pricePerUnit = payload.gameState.market?.segmentData?.defaultPrice ?? 25;
        }
      }

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
