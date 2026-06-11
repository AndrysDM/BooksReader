import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

type ThemeType = 'light' | 'dark';
type ReaderMode = 'light' | 'dark' | 'sepia';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (t: ThemeType) => void;
  toggleTheme: () => void;
  readerMode: ReaderMode;
  setReaderMode: (m: ReaderMode) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  colors: {
    background: string;
    text: string;
    secondaryText: string;
    card: string;
    border: string;
    primary: string;
    accent: string;
  };
}

const lightColors = {
  background: '#FFFFFF',
  text: '#1A1A1A',
  secondaryText: '#666666',
  card: '#F5F5F5',
  border: '#E0E0E0',
  primary: '#970080ff',
  accent: '#FF5722',
};

const darkColors = {
  background: '#121212',
  text: '#FFFFFF',
  secondaryText: '#B0B0B0',
  card: '#1E1E1E',
  border: '#333333',
  primary: '#64B5F6',
  accent: '#FF8A65',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>('light');
  const [readerMode, setReaderModeState] = useState<ReaderMode>('light');
  const [fontSize, setFontSize] = useState<number>(16);

  const UI_THEME_KEY = '@biblioo:ui_theme';
  const READER_MODE_KEY = '@biblioo:reader_mode';
  const FONT_SIZE_KEY = '@biblioo:font_size';

  useEffect(() => {
    // load persisted preferences
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(UI_THEME_KEY);
        if (stored === 'light' || stored === 'dark') setThemeState(stored);

        const storedReader = await AsyncStorage.getItem(READER_MODE_KEY);
        if (storedReader === 'light' || storedReader === 'dark' || storedReader === 'sepia') setReaderModeState(storedReader as ReaderMode);

        const storedFont = await AsyncStorage.getItem(FONT_SIZE_KEY);
        if (storedFont) setFontSize(Number(storedFont));
      } catch (err) {
        console.error('Error loading theme prefs', err);
      }
    })();
  }, []);

  const setTheme = async (t: ThemeType) => {
    try {
      await AsyncStorage.setItem(UI_THEME_KEY, t);
    } catch (err) {
      console.error('Error saving ui theme', err);
    }
    setThemeState(t);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const setReaderMode = async (m: ReaderMode) => {
    try {
      await AsyncStorage.setItem(READER_MODE_KEY, m);
    } catch (err) {
      console.error('Error saving reader mode', err);
    }
    setReaderModeState(m);
  };

  const colors = theme === 'light' ? lightColors : darkColors;

  // persist font size when changed
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(FONT_SIZE_KEY, String(fontSize));
      } catch (err) {
        /* ignore */
      }
    })();
  }, [fontSize]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, readerMode, setReaderMode, fontSize, setFontSize, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
