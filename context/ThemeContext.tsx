import React, { createContext, ReactNode, useContext, useState } from 'react';

type ThemeType = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeType;
  toggleTheme: () => void;
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
  const [theme, setTheme] = useState<ThemeType>('light');
  const [fontSize, setFontSize] = useState<number>(16);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const colors = theme === 'light' ? lightColors : darkColors;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, fontSize, setFontSize, colors }}>
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
