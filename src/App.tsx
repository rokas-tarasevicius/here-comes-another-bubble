import { useEffect, useCallback, useRef } from 'react';
import './index.css';
import { useGameStore } from './store/index.ts';
import { useTheme } from './hooks/useTheme.ts';
import { ThemeContext } from './contexts/ThemeContext.tsx';
import { AppShell } from './components/layout/AppShell.tsx';
import { MainMenuScreen } from './components/screens/MainMenuScreen.tsx';
import { NewGameScreen } from './components/screens/NewGameScreen.tsx';
import { OverviewScreen } from './components/screens/OverviewScreen.tsx';
import { FinanceScreen } from './components/screens/FinanceScreen.tsx';
import { MarketScreen } from './components/screens/MarketScreen.tsx';
import { CompanyScreen } from './components/screens/CompanyScreen.tsx';
import { TeamScreen } from './components/screens/TeamScreen.tsx';
import { DecisionScreen } from './components/screens/DecisionScreen.tsx';
import { GameOverScreen } from './components/screens/GameOverScreen.tsx';
import { LeaderboardScreen } from './components/screens/LeaderboardScreen.tsx';
import { WeekRecap } from './components/shared/WeekRecap.tsx';
import { Tutorial } from './components/shared/Tutorial.tsx';
import { BackgroundMusic } from './components/shared/BackgroundMusic.tsx';
import { ThemeToggle } from './components/shared/ThemeToggle.tsx';

// ─── Screen router ─────────────────────────────────────────────────────

const GAMEPLAY_SCREENS = [
  { id: 'overview', Component: OverviewScreen },
  { id: 'company', Component: CompanyScreen },
  { id: 'team', Component: TeamScreen },
  { id: 'finance', Component: FinanceScreen },
  { id: 'market', Component: MarketScreen },
  { id: 'decisions', Component: DecisionScreen },
] as const;

function GameplayScreen() {
  const currentScreen = useGameStore((s) => s.currentScreen);
  const visited = useRef(new Set<string>([currentScreen]));
  visited.current.add(currentScreen);

  return (
    <>
      {GAMEPLAY_SCREENS.map(({ id, Component }) => {
        if (!visited.current.has(id)) return null;
        const active = currentScreen === id;
        return (
          <div key={id} hidden={!active}>
            <Component />
          </div>
        );
      })}
    </>
  );
}

// ─── App root ──────────────────────────────────────────────────────────

function App() {
  const { theme, toggleTheme } = useTheme();
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
          const { decisionsThisTurn } = useGameStore.getState();
          const unresolved = gameState.pendingDecisions.filter(
            (d) => d.deadline <= gameState.meta.week && !decisionsThisTurn.some(
              (dt) => dt.type === 'respond-to-event' && dt.decisionId === d.id
            )
          );
          if (unresolved.length > 0) {
            setScreen('decisions');
          } else {
            originalEndWeek();
          }
        }
      }

      // Number keys 1-6 for screen navigation
      if (gameState && !gameState.meta.gameOver && !gameState.meta.gameWon) {
        const screens = ['overview', 'company', 'team', 'finance', 'market', 'decisions'];
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= screens.length) {
          e.preventDefault();
          setScreen(screens[num - 1]);
        }
      }

      // Escape = back to main menu (from gameplay)
      if (e.key === 'Escape' && gameState && !gameState.meta.gameOver && !gameState.meta.gameWon) {
        e.preventDefault();
        if (window.confirm('Return to main menu? Unsaved progress will be lost.')) {
          setScreen('title');
        }
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
      currentScreen !== 'gameover' &&
      currentScreen !== 'newgame'
    ) {
      setScreen('gameover');
    }
  }, [gameState?.meta.gameOver, gameState?.meta.gameWon, currentScreen, setScreen]);

  let screen;
  if (currentScreen === 'title') {
    screen = <MainMenuScreen />;
  } else if (currentScreen === 'newgame') {
    screen = <NewGameScreen />;
  } else if (currentScreen === 'gameover') {
    screen = <GameOverScreen />;
  } else if (currentScreen === 'leaderboard') {
    screen = <LeaderboardScreen />;
  } else {
    screen = (
      <>
        <AppShell>
          <GameplayScreen />
        </AppShell>
        <WeekRecap />
        <Tutorial />
      </>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {screen}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-center gap-2">
        <ThemeToggle />
        <BackgroundMusic />
      </div>
    </ThemeContext.Provider>
  );
}

export default App;
