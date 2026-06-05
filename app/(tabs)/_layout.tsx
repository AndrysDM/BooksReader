import { Stack } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Tu pantalla principal */}
      <Stack.Screen name="index" />
      {/* Puedes dejar las otras declaradas por si acaso, pero no mostrarán pestañas */}
      <Stack.Screen name="explore" />
      <Stack.Screen name="favorites" />
    </Stack>
  );
}