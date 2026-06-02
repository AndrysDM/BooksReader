import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { LibraryProvider } from './context/LibraryContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppNavigator } from './navigation/AppNavigator';

export default function App() {
  return (
    <LibraryProvider>
      <ThemeProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </ThemeProvider>
    </LibraryProvider>
  );
}
