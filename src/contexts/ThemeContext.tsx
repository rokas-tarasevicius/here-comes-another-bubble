import { createContext, useContext } from 'react';
import type { ThemeId } from '../types/theme.ts';

interface ThemeContextValue {
  theme: ThemeId;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggleTheme: () => {},
});

export function useThemeContext() {
  return useContext(ThemeContext);
}
