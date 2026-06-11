import styles from '@/components/home/home.styles';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function UIThemePage() {
  const router = useRouter();
  const { theme, setTheme, colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, padding: 20 }]}> 
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>Tema de la App</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: colors.primary }}>Cerrar</Text>
        </TouchableOpacity>
      </View>

      <Text style={{ color: colors.secondaryText, marginBottom: 12 }}>Este ajuste cambia el tema de la interfaz (no el color del libro).</Text>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity onPress={() => setTheme('light')} style={{ padding: 12, borderRadius: 10, backgroundColor: theme === 'light' ? colors.primary : colors.card }}>
          <Text style={{ color: theme === 'light' ? '#fff' : colors.text }}>Claro</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTheme('dark')} style={{ padding: 12, borderRadius: 10, backgroundColor: theme === 'dark' ? colors.primary : colors.card }}>
          <Text style={{ color: theme === 'dark' ? '#fff' : colors.text }}>Oscuro</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
