import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark';

interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  primary: string;
  border: string;
  cardBackground: string;
  progressBar: string;
  progressBarBackground: string;
}

const lightColors: ThemeColors = {
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#666666',
  primary: '#4A90D9',
  border: '#E0E0E0',
  cardBackground: '#FFFFFF',
  progressBar: '#4A90D9',
  progressBarBackground: '#E0E0E0',
};

const darkColors: ThemeColors = {
  background: '#121212',
  surface: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#AAAAAA',
  primary: '#64B5F6',
  border: '#333333',
  cardBackground: '#1E1E1E',
  progressBar: '#64B5F6',
  progressBarBackground: '#333333',
};

interface ThemeContextType {
  themeMode: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = '@biblioo_theme';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const stored = await require('@react-native-async-storage/async-storage').default.getItem(STORAGE_KEY);
      if (stored) {
        setThemeModeState(stored as ThemeMode);
      } else {
        setThemeModeState(systemColorScheme === 'dark' ? 'dark' : 'light');
      }
    } catch (error) {
      console.error('Error loading theme:', error);
      setThemeModeState(systemColorScheme === 'dark' ? 'dark' : 'light');
    }
  };

  const saveTheme = async (mode: ThemeMode) => {
    try {
      await require('@react-native-async-storage/async-storage').default.setItem(STORAGE_KEY, mode);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    saveTheme(mode);
  };

  const toggleTheme = () => {
    setThemeMode(themeMode === 'light' ? 'dark' : 'light');
  };

  const colors = themeMode === 'light' ? lightColors : darkColors;

  return (
    <ThemeContext.Provider value={{ themeMode, colors, toggleTheme, setThemeMode }}>
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
