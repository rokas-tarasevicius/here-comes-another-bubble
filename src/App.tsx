import { useEffect, useCallback } from 'react';
import './index.css';
import { useGameStore } from './store/index.ts';
import { AppShell } from './components/layout/AppShell.tsx';
import { MainMenuScreen } from './components/screens/MainMenuScreen.tsx';
import { NewGameScreen } from './components/screens/NewGameScreen.tsx';
import { OverviewScreen } from './components/screens/OverviewScreen.tsx';
import { FinanceScreen } from './components/screens/FinanceScreen.tsx';
import { MarketScreen } from './components/screens/MarketScreen.tsx';
import { DecisionScreen } from './components/screens/DecisionScreen.tsx';
import { GameOverScreen } from './components/screens/GameOverScreen.tsx';
import { LeaderboardScreen } from './components/screens/LeaderboardScreen.tsx';
import { WeekRecap } from './components/shared/WeekRecap.tsx';

// ─── Screen router ─────────────────────────────────────────────────────

function GameplayScreen() {
  const currentScreen = useGameStore((s) => s.currentScreen);

  switch (currentScreen) {
    case 'overview':
      return <OverviewScreen />;
    case 'finance':
      return <FinanceScreen />;
    case 'market':
      return <MarketScreen />;
    case 'decisions':
      return <DecisionScreen />;
    default:
      return <OverviewScreen />;
  }
}

// ─── App root ──────────────────────────────────────────────────────────

function App() {
  const currentScreen = useGameStore((s) => s.currentScreen);
  const gameState = useGameStore((s) => s.gameState);
  const endWeek = useGameStore((s) => s.endWeek);
  const saveGame = useGameStore((s) => s.saveGame);
  const isSimulating = useGameStore((s) => s.isSimulating);
  const setScreen = useGameStore((s) => s.setScreen);
  const showWeekRecap = useGameStore((s) => s.showWeekRecap);
  const dismissWeekRecap = useGameStore((s) => s.dismissWeekRecap);

  // Auto-save after each week advance
  const originalEndWeek = useCallback(() => {
    endWeek();
    saveGame(0);
  }, [endWeek, saveGame]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Enter or Escape dismisses week recap if showing
      if (showWeekRecap && (e.key === 'Enter' || e.key === 'Escape')) {
        e.preventDefault();
        dismissWeekRecap();
        return;
      }

      // N = Next Week (only during gameplay, not while recap is showing)
      if (e.key === 'n' || e.key === 'N') {
        if (gameState && !gameState.meta.gameOver && !gameState.meta.gameWon && !isSimulating && !showWeekRecap) {
          e.preventDefault();
          originalEndWeek();
        }
      }

      // Number keys 1-4 for screen navigation
      if (gameState && !gameState.meta.gameOver && !gameState.meta.gameWon) {
        const screens = ['overview', 'finance', 'market', 'decisions'];
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= 4) {
          e.preventDefault();
          setScreen(screens[num - 1]);
        }
      }

      // Escape = back to main menu (from gameplay)
      if (e.key === 'Escape' && gameState) {
        e.preventDefault();
        setScreen('title');
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, isSimulating, originalEndWeek, setScreen, showWeekRecap, dismissWeekRecap]);

  // Check for game over or game won redirect
  useEffect(() => {
    if (
      (gameState?.meta.gameOver || gameState?.meta.gameWon) &&
      currentScreen !== 'title' &&
      currentScreen !== 'gameover'
    ) {
      setScreen('gameover');
    }
  }, [gameState?.meta.gameOver, gameState?.meta.gameWon, currentScreen, setScreen]);

  // Title / New Game screens (no AppShell)
  if (currentScreen === 'title') {
    return <MainMenuScreen />;
  }

  if (currentScreen === 'newgame') {
    return <NewGameScreen />;
  }

  if (currentScreen === 'gameover') {
    return <GameOverScreen />;
  }

  if (currentScreen === 'leaderboard') {
    return <LeaderboardScreen />;
  }

  // All gameplay screens wrapped in AppShell
  return (
    <>
      <AppShell>
        <GameplayScreen />
      </AppShell>
      <WeekRecap />
    </>
  );
}

export default App;
