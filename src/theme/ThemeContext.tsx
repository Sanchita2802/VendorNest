import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type Quality3D = 'high' | 'low' | 'off';

interface ThemeContextType {
  themeMode: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  reducedMotion: boolean;
  setReducedMotion: (val: boolean) => void;
  quality3D: Quality3D;
  setQuality3D: (val: Quality3D) => void;
  aiEnabled: boolean;
  setAiEnabled: (val: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('vendornest_theme_mode');
      if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    } catch {}
    return 'system';
  });

  const [reducedMotion, setReducedMotionState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('vendornest_reduced_motion');
      if (saved !== null) return JSON.parse(saved);
    } catch {}
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const [quality3D, setQuality3DState] = useState<Quality3D>(() => {
    try {
      const saved = localStorage.getItem('vendornest_3d_quality');
      if (saved === 'high' || saved === 'low' || saved === 'off') return saved;
    } catch {}
    return 'high';
  });

  const [aiEnabled, setAiEnabledState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('vendornest_ai_enabled');
      if (saved !== null) return JSON.parse(saved);
    } catch {}
    return true;
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const updateResolved = () => {
      let active: 'light' | 'dark' = 'light';
      if (themeMode === 'system') {
        active = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        active = themeMode;
      }
      setResolvedTheme(active);
      document.documentElement.setAttribute('data-theme', active);
    };

    updateResolved();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (themeMode === 'system') updateResolved();
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      localStorage.setItem('vendornest_theme_mode', mode);
    } catch {}
  };

  const toggleTheme = () => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark';
    setThemeMode(next);
  };

  const setReducedMotion = (val: boolean) => {
    setReducedMotionState(val);
    try {
      localStorage.setItem('vendornest_reduced_motion', JSON.stringify(val));
    } catch {}
  };

  const setQuality3D = (val: Quality3D) => {
    setQuality3DState(val);
    try {
      localStorage.setItem('vendornest_3d_quality', val);
    } catch {}
  };

  const setAiEnabled = (val: boolean) => {
    setAiEnabledState(val);
    try {
      localStorage.setItem('vendornest_ai_enabled', JSON.stringify(val));
    } catch {}
  };

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        resolvedTheme,
        setThemeMode,
        toggleTheme,
        reducedMotion,
        setReducedMotion,
        quality3D,
        setQuality3D,
        aiEnabled,
        setAiEnabled,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
