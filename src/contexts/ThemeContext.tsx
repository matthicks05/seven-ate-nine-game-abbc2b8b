import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'vibrant' | 'forest' | 'ocean' | 'sunset' | 'cosmic';

interface ThemeColors {
  gameTable: string;
  gameTablePattern: string;
  cardBackground: string;
  cardBorder: string;
  cardShadow: string;
  primary: string;
  primaryGlow: string;
  primaryForeground: string;
  secondary: string;
  secondaryGlow: string;
  secondaryForeground: string;
  accent: string;
  accentGlow: string;
  accentForeground: string;
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  input: string;
  ring: string;
  destructive: string;
  destructiveForeground: string;
}

const themes: Record<Theme, ThemeColors> = {
  vibrant: {
    gameTable: '260 85% 25%',
    gameTablePattern: '265 80% 35%',
    cardBackground: '0 0% 100%',
    cardBorder: '260 20% 80%',
    cardShadow: '260 50% 15%',
    primary: '280 100% 70%',
    primaryGlow: '285 100% 85%',
    primaryForeground: '0 0% 100%',
    secondary: '195 100% 65%',
    secondaryGlow: '195 100% 80%',
    secondaryForeground: '0 0% 100%',
    accent: '45 100% 65%',
    accentGlow: '50 100% 75%',
    accentForeground: '25 85% 15%',
    background: '265 60% 15%',
    foreground: '280 20% 95%',
    muted: '265 40% 25%',
    mutedForeground: '265 15% 70%',
    border: '265 30% 35%',
    input: '265 40% 25%',
    ring: '280 100% 70%',
    destructive: '0 85% 60%',
    destructiveForeground: '0 0% 98%'
  },
  forest: {
    gameTable: '120 50% 20%',
    gameTablePattern: '125 45% 25%',
    cardBackground: '0 0% 100%',
    cardBorder: '120 20% 80%',
    cardShadow: '120 60% 15%',
    primary: '140 80% 50%',
    primaryGlow: '145 85% 65%',
    primaryForeground: '0 0% 100%',
    secondary: '280 70% 60%',
    secondaryGlow: '285 80% 75%',
    secondaryForeground: '0 0% 100%',
    accent: '35 90% 55%',
    accentGlow: '40 95% 70%',
    accentForeground: '25 85% 15%',
    background: '125 45% 18%',
    foreground: '140 20% 95%',
    muted: '125 35% 28%',
    mutedForeground: '125 15% 70%',
    border: '125 25% 35%',
    input: '125 35% 28%',
    ring: '140 80% 50%',
    destructive: '0 85% 60%',
    destructiveForeground: '0 0% 98%'
  },
  ocean: {
    gameTable: '200 60% 25%',
    gameTablePattern: '205 55% 30%',
    cardBackground: '0 0% 100%',
    cardBorder: '200 20% 80%',
    cardShadow: '200 70% 15%',
    primary: '195 85% 60%',
    primaryGlow: '200 90% 75%',
    primaryForeground: '0 0% 100%',
    secondary: '160 75% 55%',
    secondaryGlow: '165 85% 70%',
    secondaryForeground: '0 0% 100%',
    accent: '50 95% 60%',
    accentGlow: '55 100% 75%',
    accentForeground: '25 85% 15%',
    background: '205 55% 18%',
    foreground: '195 20% 95%',
    muted: '205 45% 28%',
    mutedForeground: '205 15% 70%',
    border: '205 35% 35%',
    input: '205 45% 28%',
    ring: '195 85% 60%',
    destructive: '0 85% 60%',
    destructiveForeground: '0 0% 98%'
  },
  sunset: {
    gameTable: '15 70% 25%',
    gameTablePattern: '20 65% 30%',
    cardBackground: '0 0% 100%',
    cardBorder: '15 20% 80%',
    cardShadow: '15 80% 15%',
    primary: '350 85% 65%',
    primaryGlow: '355 90% 80%',
    primaryForeground: '0 0% 100%',
    secondary: '25 90% 60%',
    secondaryGlow: '30 95% 75%',
    secondaryForeground: '0 0% 100%',
    accent: '55 95% 65%',
    accentGlow: '60 100% 80%',
    accentForeground: '25 85% 15%',
    background: '20 65% 18%',
    foreground: '350 20% 95%',
    muted: '20 55% 28%',
    mutedForeground: '20 15% 70%',
    border: '20 45% 35%',
    input: '20 55% 28%',
    ring: '350 85% 65%',
    destructive: '0 85% 60%',
    destructiveForeground: '0 0% 98%'
  },
  cosmic: {
    gameTable: '240 80% 15%',
    gameTablePattern: '245 75% 20%',
    cardBackground: '0 0% 100%',
    cardBorder: '240 20% 80%',
    cardShadow: '240 90% 10%',
    primary: '270 100% 75%',
    primaryGlow: '275 100% 90%',
    primaryForeground: '0 0% 100%',
    secondary: '300 90% 70%',
    secondaryGlow: '305 95% 85%',
    secondaryForeground: '0 0% 100%',
    accent: '180 90% 65%',
    accentGlow: '185 95% 80%',
    accentForeground: '25 85% 15%',
    background: '245 75% 12%',
    foreground: '270 20% 95%',
    muted: '245 65% 22%',
    mutedForeground: '245 15% 70%',
    border: '245 55% 32%',
    input: '245 65% 22%',
    ring: '270 100% 75%',
    destructive: '0 85% 60%',
    destructiveForeground: '0 0% 98%'
  }
};

const themeNames: Record<Theme, string> = {
  vibrant: 'Vibrant Purple',
  forest: 'Forest Green',
  ocean: 'Ocean Blue',
  sunset: 'Sunset Orange',
  cosmic: 'Cosmic Space'
};

interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (theme: Theme) => void;
  themes: typeof themeNames;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('game-theme');
    return (saved as Theme) || 'vibrant';
  });

  const setTheme = (theme: Theme) => {
    setCurrentTheme(theme);
    localStorage.setItem('game-theme', theme);
  };

  useEffect(() => {
    const colors = themes[currentTheme];
    const root = document.documentElement;

    // Apply all theme colors to CSS variables
    Object.entries(colors).forEach(([key, value]) => {
      const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      root.style.setProperty(`--${cssVar}`, value);
    });
  }, [currentTheme]);

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, themes: themeNames }}>
      {children}
    </ThemeContext.Provider>
  );
};