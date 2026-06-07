import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  resolvedMode: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
  init: () => void;
  syncSystem: () => void;
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(mode: ThemeMode) {
  const resolved = mode === 'system' ? getSystemTheme() : mode;
  const root = document.documentElement;
  if (resolved === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  return resolved;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'system',
      resolvedMode: 'light',
      setMode: (mode) => {
        const resolved = applyTheme(mode);
        set({ mode, resolvedMode: resolved });
      },
      init: () => {
        const { mode } = get();
        const resolved = applyTheme(mode);
        set({ resolvedMode: resolved });
      },
      syncSystem: () => {
        const { mode } = get();
        if (mode === 'system') {
          const resolved = applyTheme('system');
          set({ resolvedMode: resolved });
        }
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);
