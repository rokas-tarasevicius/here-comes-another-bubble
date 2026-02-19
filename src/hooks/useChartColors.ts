import { useMemo } from 'react';
import { useThemeContext } from '../contexts/ThemeContext.tsx';

function readVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** Returns resolved chart color hex values that update on theme change. */
export function useChartColors() {
  const { theme } = useThemeContext();

  return useMemo(() => ({
    grid: readVar('--theme-chart-grid'),
    axis: readVar('--theme-chart-axis'),
    tick: readVar('--theme-chart-tick'),
    blue: readVar('--color-retro-blue'),
    green: readVar('--color-retro-green'),
    red: readVar('--color-retro-red'),
    orange: readVar('--color-retro-orange'),
    purple: readVar('--color-retro-purple'),
  }), [theme]);
}
