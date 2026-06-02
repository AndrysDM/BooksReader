import React from 'react';
import { Stack } from 'expo-router';
import { ThemeProvider } from '../context/ThemeContext';
import { LibraryProvider } from '../context/LibraryContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <LibraryProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="reader/index" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="details/index" options={{ presentation: 'card' }} />
        </Stack>
      </LibraryProvider>
    </ThemeProvider>
  );
}
