import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, FlatList, Text, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLibrary } from '../../context/LibraryContext';
import { useTheme } from '../../context/ThemeContext';
import EpubViewer from '../../components/EpubViewer';

export default function ReaderScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { books, updateProgress, deleteBook } = useLibrary();
  const { colors, theme, toggleTheme, fontSize, setFontSize } = useTheme();
  
  const [showSettings, setShowSettings] = useState(false);
  const [showChapters, setShowChapters] = useState(false);
  const book = books.find(b => b.id === params.id);

  if (!book) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Libro no encontrado</Text>
      </View>
    );
  }

  const handleProgressChange = async (progress: number, chapter: number) => {
    await updateProgress(book.id, progress, chapter);
  };

  const handleDeleteBook = () => {
    Alert.alert(
      'Eliminar libro',
      '¿Estás seguro de que quieres eliminar este libro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            await deleteBook(book.id);
            router.back();
          }
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Text style={[styles.headerButtonText, { color: colors.text }]}>← Volver</Text>
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {book.title}
        </Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.headerButton}>
            <Text style={[styles.headerButtonText, { color: colors.text }]}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDeleteBook} style={styles.headerButton}>
            <Text style={[styles.headerButtonText, { color: colors.text }]}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Viewer */}
      <EpubViewer
        book={book}
        fontSize={fontSize}
        theme={theme}
        onProgressChange={handleProgressChange}
      />

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Configuración</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <Text style={{ color: colors.text, fontSize: 24 }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Theme Toggle */}
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Tema</Text>
              <TouchableOpacity 
                onPress={toggleTheme}
                style={[styles.themeToggle, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.themeToggleText}>{theme === 'light' ? '🌙 Oscuro' : '☀️ Claro'}</Text>
              </TouchableOpacity>
            </View>

            {/* Font Size */}
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

            {/* Progress Info */}
            <View style={styles.progressInfo}>
              <Text style={[styles.progressLabel, { color: colors.secondaryText }]}>Progreso actual</Text>
              <Text style={[styles.progressValue, { color: colors.text }]}>{book.progress}% completado</Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    fontSize: 16,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 16,
  },
  themeToggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  themeToggleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  fontSizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fontButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fontSizeValue: {
    fontSize: 16,
    minWidth: 50,
    textAlign: 'center',
  },
  progressInfo: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  progressLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  progressValue: {
    fontSize: 18,
    fontWeight: '600',
  },
});
