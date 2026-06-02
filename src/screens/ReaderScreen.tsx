import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLibrary } from '../context/LibraryContext';
import { useTheme } from '../context/ThemeContext';
import { EpubViewer } from '../components/EpubViewer';
import { saveReadingProgress } from '../utils/storage';

export const ReaderScreen: React.FC = () => {
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const router = useRouter();
  const { getBookById, updateBookProgress, toggleFavorite } = useLibrary();
  const { colors, themeMode, toggleTheme } = useTheme();
  
  const [fontSize, setFontSize] = useState(16);
  const [showSettings, setShowSettings] = useState(false);
  const [showChapters, setShowChapters] = useState(false);
  const [currentProgress, setCurrentProgress] = useState({ chapter: 0, percentage: 0 });

  const book = bookId ? getBookById(bookId) : undefined;

  useEffect(() => {
    if (book) {
      setCurrentProgress({
        chapter: book.currentChapter,
        percentage: book.progress,
      });
    }
  }, [book]);

  if (!book) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Libro no encontrado</Text>
      </View>
    );
  }

  const handleProgressChange = (progress: { chapter: number; percentage: number }) => {
    setCurrentProgress(progress);
    updateBookProgress(book.id, progress.percentage, progress.chapter);
    saveReadingProgress(book.id, {
      chapter: progress.chapter,
      progress: progress.percentage,
      timestamp: new Date().toISOString(),
    });
  };

  const chapters = Array.from({ length: 5 }, (_, i) => `Capítulo ${i + 1}`);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    iconButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.border,
    },
    progressBar: {
      height: 4,
      backgroundColor: colors.progressBarBackground,
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.progressBar,
    },
    settingsModal: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    settingsContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
    },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    settingLabel: {
      color: colors.text,
      fontSize: 16,
    },
    fontSizeButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    fontSizeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    fontSizeButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: 'bold',
    },
    closeButton: {
      marginTop: 20,
      padding: 16,
      backgroundColor: colors.primary,
      borderRadius: 8,
      alignItems: 'center',
    },
    closeButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 16,
    },
    chapterList: {
      padding: 20,
    },
    chapterItem: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    chapterText: {
      color: colors.text,
      fontSize: 16,
    },
    activeChapter: {
      color: colors.primary,
      fontWeight: 'bold',
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.back()}
        >
          <Text style={{ fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        
        <Text style={{ color: colors.text, fontWeight: '600' }} numberOfLines={1}>
          {book.title}
        </Text>

        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowChapters(true)}
          >
            <Text style={{ fontSize: 20 }}>📑</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowSettings(true)}
          >
            <Text style={{ fontSize: 20 }}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${currentProgress.percentage}%` }]} />
      </View>

      {/* EPUB Viewer */}
      <EpubViewer
        epubPath={book.filePath}
        initialChapter={book.currentChapter}
        onProgressChange={handleProgressChange}
        fontSize={fontSize}
      />

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.settingsModal}>
          <View style={styles.settingsContent}>
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
              Configuración
            </Text>

            {/* Font Size */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Tamaño de fuente</Text>
              <View style={styles.fontSizeButtons}>
                <TouchableOpacity
                  style={styles.fontSizeButton}
                  onPress={() => setFontSize(Math.max(12, fontSize - 2))}
                >
                  <Text style={styles.fontSizeButtonText}>A-</Text>
                </TouchableOpacity>
                <Text style={{ color: colors.text, paddingHorizontal: 12 }}>{fontSize}px</Text>
                <TouchableOpacity
                  style={styles.fontSizeButton}
                  onPress={() => setFontSize(Math.min(32, fontSize + 2))}
                >
                  <Text style={styles.fontSizeButtonText}>A+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Theme Toggle */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Tema</Text>
              <TouchableOpacity
                style={[styles.fontSizeButton, { backgroundColor: colors.border }]}
                onPress={toggleTheme}
              >
                <Text style={{ fontSize: 20 }}>{themeMode === 'dark' ? '🌙' : '☀️'}</Text>
              </TouchableOpacity>
            </View>

            {/* Favorite Toggle */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Favorito</Text>
              <TouchableOpacity
                style={[styles.fontSizeButton, { backgroundColor: colors.border }]}
                onPress={() => toggleFavorite(book.id)}
              >
                <Text style={{ fontSize: 20 }}>{book.isFavorite ? '❤️' : '🤍'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowSettings(false)}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Chapters Modal */}
      <Modal
        visible={showChapters}
        transparent
        animationType="slide"
        onRequestClose={() => setShowChapters(false)}
      >
        <View style={styles.settingsModal}>
          <View style={styles.settingsContent}>
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
              Capítulos
            </Text>

            <ScrollView>
              {chapters.map((chapter, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.chapterItem}
                  onPress={() => {
                    setCurrentProgress({ chapter: index, percentage: ((index + 1) / chapters.length) * 100 });
                    updateBookProgress(book.id, ((index + 1) / chapters.length) * 100, index);
                    setShowChapters(false);
                  }}
                >
                  <Text
                    style={[
                      styles.chapterText,
                      currentProgress.chapter === index && styles.activeChapter,
                    ]}
                  >
                    {chapter}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowChapters(false)}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};
