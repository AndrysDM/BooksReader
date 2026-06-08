import { Stack } from 'expo-router';
import React from 'react';
import { LibraryProvider } from '../context/LibraryContext';
import { ThemeProvider } from '../context/ThemeContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <LibraryProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="home/index"  options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="reader/index" options={{ presentation: 'fullScreenModal' }} />
        </Stack>
      </LibraryProvider>
    </ThemeProvider>
  );
}
