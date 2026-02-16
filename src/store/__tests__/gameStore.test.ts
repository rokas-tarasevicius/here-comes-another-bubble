import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../gameStore.ts';
import type { PlayerDecision } from '../../types/decisions.ts';

// ─── Helpers ─────────────────────────────────────────────────────────

/** Reset the store and localStorage before each test. */
beforeEach(() => {
  useGameStore.setState({
    gameState: null,
    currentScreen: 'title',
    decisionsThisTurn: [],
    isSimulating: false,
  });
  localStorage.clear();
});

/** Shortcut to start a new game with sensible defaults. */
function startGame(companyName = 'TestCo') {
  useGameStore.getState().newGame(
    companyName,
    'balanced',
    'ai-devtools',
    'normal',
    'realistic',
  );
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('newGame', () => {
  it('creates a game and sets gameState with the correct company name', () => {
    startGame('BubbleCorp');

    const { gameState } = useGameStore.getState();
    expect(gameState).not.toBeNull();
    expect(gameState!.company.name).toBe('BubbleCorp');
  });

  it('initializes at week 1', () => {
    startGame();

    const { gameState } = useGameStore.getState();
    expect(gameState!.meta.week).toBe(1);
  });

  it('switches screen to overview', () => {
    startGame();

    const { currentScreen } = useGameStore.getState();
    expect(currentScreen).toBe('overview');
  });

  it('clears any previous decisions', () => {
    // Pre-populate a decision
    useGameStore.setState({
      decisionsThisTurn: [{ type: 'set-pricing', model: 'free', pricePerUnit: 0 }],
    });

    startGame();

    const { decisionsThisTurn } = useGameStore.getState();
    expect(decisionsThisTurn).toHaveLength(0);
  });
});

describe('endWeek', () => {
  it('advances the week counter', () => {
    startGame();
    const weekBefore = useGameStore.getState().gameState!.meta.week;

    useGameStore.getState().endWeek();

    const weekAfter = useGameStore.getState().gameState!.meta.week;
    expect(weekAfter).toBe(weekBefore + 1);
  });

  it('clears decisions after advancing', () => {
    startGame();
    useGameStore.getState().addDecision({
      type: 'set-pricing',
      model: 'subscription',
      pricePerUnit: 29,
    });

    useGameStore.getState().endWeek();

    const { decisionsThisTurn } = useGameStore.getState();
    expect(decisionsThisTurn).toHaveLength(0);
  });

  it('does nothing when there is no active game', () => {
    // gameState is null — should not throw
    useGameStore.getState().endWeek();
    expect(useGameStore.getState().gameState).toBeNull();
  });

  it('sets isSimulating back to false after completing', () => {
    startGame();
    useGameStore.getState().endWeek();

    expect(useGameStore.getState().isSimulating).toBe(false);
  });
});

describe('addDecision', () => {
  it('adds a decision to the queue', () => {
    const decision: PlayerDecision = {
      type: 'start-feature',
      name: 'AI Chat',
      description: 'Chat feature',
      marketRelevance: 80,
    };

    useGameStore.getState().addDecision(decision);

    const { decisionsThisTurn } = useGameStore.getState();
    expect(decisionsThisTurn).toHaveLength(1);
    expect(decisionsThisTurn[0]).toEqual(decision);
  });

  it('appends multiple decisions in order', () => {
    useGameStore.getState().addDecision({
      type: 'set-pricing',
      model: 'freemium',
      pricePerUnit: 0,
    });
    useGameStore.getState().addDecision({
      type: 'start-feature',
      name: 'Analytics',
      description: 'Dashboard analytics',
      marketRelevance: 70,
    });

    const { decisionsThisTurn } = useGameStore.getState();
    expect(decisionsThisTurn).toHaveLength(2);
    expect(decisionsThisTurn[0].type).toBe('set-pricing');
    expect(decisionsThisTurn[1].type).toBe('start-feature');
  });
});

describe('removeDecision', () => {
  it('removes a decision by index', () => {
    useGameStore.getState().addDecision({
      type: 'set-pricing',
      model: 'freemium',
      pricePerUnit: 0,
    });
    useGameStore.getState().addDecision({
      type: 'start-feature',
      name: 'AI Chat',
      description: 'Chat',
      marketRelevance: 80,
    });
    useGameStore.getState().addDecision({
      type: 'post-job',
      role: 'engineer',
    });

    // Remove the middle one (index 1)
    useGameStore.getState().removeDecision(1);

    const { decisionsThisTurn } = useGameStore.getState();
    expect(decisionsThisTurn).toHaveLength(2);
    expect(decisionsThisTurn[0].type).toBe('set-pricing');
    expect(decisionsThisTurn[1].type).toBe('post-job');
  });

  it('does nothing for an out-of-range index', () => {
    useGameStore.getState().addDecision({
      type: 'post-job',
      role: 'engineer',
    });

    useGameStore.getState().removeDecision(99);

    expect(useGameStore.getState().decisionsThisTurn).toHaveLength(1);
  });
});

describe('clearDecisions', () => {
  it('empties the decisions queue', () => {
    useGameStore.getState().addDecision({
      type: 'post-job',
      role: 'engineer',
    });
    useGameStore.getState().addDecision({
      type: 'post-job',
      role: 'designer',
    });

    useGameStore.getState().clearDecisions();

    expect(useGameStore.getState().decisionsThisTurn).toHaveLength(0);
  });
});

describe('setScreen', () => {
  it('updates currentScreen', () => {
    useGameStore.getState().setScreen('finance');
    expect(useGameStore.getState().currentScreen).toBe('finance');

    useGameStore.getState().setScreen('team');
    expect(useGameStore.getState().currentScreen).toBe('team');
  });
});

describe('saveGame / loadGame', () => {
  it('round-trips game state through localStorage (default slot 0)', () => {
    startGame('SaveTestCo');
    useGameStore.getState().saveGame();

    // Wipe the in-memory state
    useGameStore.setState({ gameState: null });
    expect(useGameStore.getState().gameState).toBeNull();

    // Load it back
    useGameStore.getState().loadGame(0);

    const { gameState } = useGameStore.getState();
    expect(gameState).not.toBeNull();
    expect(gameState!.company.name).toBe('SaveTestCo');
    expect(gameState!.meta.week).toBe(1);
  });

  it('saves to a specific slot', () => {
    startGame('SlotTestCo');
    useGameStore.getState().saveGame(3);

    useGameStore.setState({ gameState: null });
    useGameStore.getState().loadGame(3);

    expect(useGameStore.getState().gameState!.company.name).toBe('SlotTestCo');
  });

  it('does nothing when saving with no active game', () => {
    useGameStore.getState().saveGame(0);
    expect(localStorage.getItem('hcab-save-0')).toBeNull();
  });

  it('does nothing when loading a non-existent slot', () => {
    startGame('Original');
    useGameStore.getState().loadGame(4);

    // State should remain unchanged
    expect(useGameStore.getState().gameState!.company.name).toBe('Original');
  });

  it('sets screen to overview after loading', () => {
    startGame('LoadScreenTest');
    useGameStore.getState().saveGame(0);
    useGameStore.getState().setScreen('finance');

    useGameStore.getState().loadGame(0);
    expect(useGameStore.getState().currentScreen).toBe('overview');
  });
});

describe('getSaveSlots', () => {
  it('returns an empty array when there are no saves', () => {
    const slots = useGameStore.getState().getSaveSlots();
    expect(slots).toEqual([]);
  });

  it('returns metadata for each saved slot', () => {
    startGame('SlotInfoCo');
    useGameStore.getState().saveGame(0);

    startGame('AnotherCo');
    // Advance a week so meta differs
    useGameStore.getState().endWeek();
    useGameStore.getState().saveGame(2);

    const slots = useGameStore.getState().getSaveSlots();
    expect(slots).toHaveLength(2);

    const slot0 = slots.find((s) => s.slot === 0);
    expect(slot0).toBeDefined();
    expect(slot0!.companyName).toBe('SlotInfoCo');
    expect(slot0!.week).toBe(1);
    expect(slot0!.savedAt).toBeTruthy();

    const slot2 = slots.find((s) => s.slot === 2);
    expect(slot2).toBeDefined();
    expect(slot2!.companyName).toBe('AnotherCo');
    expect(slot2!.week).toBe(2);
  });

  it('skips corrupted save data', () => {
    localStorage.setItem('hcab-save-1', 'not valid json{{{');

    startGame('GoodSave');
    useGameStore.getState().saveGame(0);

    const slots = useGameStore.getState().getSaveSlots();
    expect(slots).toHaveLength(1);
    expect(slots[0].slot).toBe(0);
  });
});

describe('deleteSave', () => {
  it('removes a save from localStorage', () => {
    startGame('DeleteMe');
    useGameStore.getState().saveGame(1);

    // Verify it exists
    expect(localStorage.getItem('hcab-save-1')).not.toBeNull();

    useGameStore.getState().deleteSave(1);
    expect(localStorage.getItem('hcab-save-1')).toBeNull();
  });

  it('does not affect other save slots', () => {
    startGame('KeepMe');
    useGameStore.getState().saveGame(0);
    useGameStore.getState().saveGame(1);

    useGameStore.getState().deleteSave(1);

    expect(localStorage.getItem('hcab-save-0')).not.toBeNull();
    expect(localStorage.getItem('hcab-save-1')).toBeNull();
  });
});
