import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import styles from './reader.styles'; // Importación directa de la hoja central

interface SettingsModalProps {
  isVisible: boolean;
  onClose: () => void;
  currentProgress: number;
  onDeleteBook: () => void;
}

export default function SettingsModal({
  isVisible,
  onClose,
  currentProgress,
  onDeleteBook,
}: SettingsModalProps) {
  // Consumimos el contexto del tema directamente desde aquí para ahorrar código en el padre
  const { colors, theme, toggleTheme, fontSize, setFontSize } = useTheme();

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          
          {/* Header del Modal */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Configuración</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Text style={{ color: colors.text, fontSize: 24 }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Selector de Tema */}
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Tema</Text>
            <TouchableOpacity
              onPress={toggleTheme}
              style={[styles.themeToggle, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.themeToggleText}>
                {theme === 'light' ? '🌙 Oscuro' : '☀️ Claro'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tamaño de Fuente */}
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Tamaño de fuente</Text>
            <View style={styles.fontSizeControls}>
              <TouchableOpacity
                onPress={() => setFontSize(Math.max(12, fontSize - 2))}
                style={[styles.fontButton, { backgroundColor: colors.border }]}
              >
                <Text style={{ fontSize: 18, color: colors.text }}>A-</Text>
              </TouchableOpacity>
              
              <Text style={[styles.fontSizeValue, { color: colors.text }]}>{fontSize}px</Text>
              
              <TouchableOpacity
                onPress={() => setFontSize(Math.min(32, fontSize + 2))}
                style={[styles.fontButton, { backgroundColor: colors.border }]}
              >
                <Text style={{ fontSize: 18, color: colors.text }}>A+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Info de Progreso y Borrado */}
          <View style={{ 
            flexDirection: 'row', 
            width: '100%', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingTop: 12
          }}>
            <View style={styles.progressInfo}>
              <Text style={[styles.progressLabel, { color: colors.secondaryText }]}>Progreso actual</Text>
              <Text style={[styles.progressValue, { color: colors.text }]}>{Math.round(currentProgress*100)}% completado</Text>
            </View>
            
            <TouchableOpacity
              onPress={() => {
                onClose(); // Cerramos este modal antes de abrir el Alert de confirmación
                onDeleteBook();
              }}
              style={[styles.themeToggle, { backgroundColor: '#ff4d4d', marginTop: 8 }]}
            >
              <Ionicons name="trash" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}