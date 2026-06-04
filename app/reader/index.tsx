import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, FlatList, Text, Alert, Platform, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLibrary } from '../../context/LibraryContext';
import { useTheme } from '../../context/ThemeContext';
import EpubViewer, { EpubViewerRef } from '../../components/EpubViewer';
import * as NavigationBar from 'expo-navigation-bar';

export default function ReaderScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { books, updateProgress, deleteBook, updateBook } = useLibrary();
  const { colors, theme, toggleTheme, fontSize, setFontSize } = useTheme();
  
  const [showSettings, setShowSettings] = useState(false);
  const [showChapters, setShowChapters] = useState(false);
  const [chapters, setChapters] = useState<Array<{ label: string; href: string }>>([]);
  const [showControls, setShowControls] = useState(false);
  
  // Progress states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentProgress, setCurrentProgress] = useState<number>(0);
  const [chapterTitle, setChapterTitle] = useState<string>('Capítulo');

  const epubViewerRef = useRef<EpubViewerRef>(null);
  const book = books.find(b => b.id === params.id);

  // Manage Status Bar and Navigation Bar visibility based on controls toggle
  useEffect(() => {
    const toggleSystemUI = async () => {
      try {
        if (showControls) {
          StatusBar.setHidden(false, 'slide');
          if (Platform.OS === 'android') {
            await NavigationBar.setVisibilityAsync('visible');
          }
        } else {
          StatusBar.setHidden(true, 'slide');
          if (Platform.OS === 'android') {
            await NavigationBar.setVisibilityAsync('hidden');
            await NavigationBar.setBehaviorAsync('overlay-swipe');
          }
        }
      } catch (error) {
        console.warn('System UI NavigationBar error:', error);
      }
    };

    toggleSystemUI();
    
    // Restore UI when leaving reader screen
    return () => {
      StatusBar.setHidden(false);
      if (Platform.OS === 'android') {
        NavigationBar.setVisibilityAsync('visible');
      }
    };
  }, [showControls]);

  if (!book) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Libro no encontrado</Text>
      </View>
    );
  }

  const handleProgressChange = async (progress: number, chapter: number, cfi?: string, details?: any) => {
    setCurrentProgress(progress);
    if (details) {
      if (details.currentPage) setCurrentPage(details.currentPage);
      if (details.totalPages) setTotalPages(details.totalPages);
      if (details.chapterTitle) setChapterTitle(details.chapterTitle);
    }
    await updateProgress(book.id, progress, chapter, cfi);
  };

  const handlePrevPage = () => {
    epubViewerRef.current?.prevPage();
  };

  const handleNextPage = () => {
    epubViewerRef.current?.nextPage();
  };

  const handleGoToChapter = (href: string) => {
    epubViewerRef.current?.goToChapter(href);
    setShowChapters(false);
  };

  const handleToggleControls = () => {
    setShowControls(prev => !prev);
  };

  const handleCoverExtracted = async (coverBase64: string) => {
    if (book && !book.cover) {
      await updateBook(book.id, { cover: coverBase64 });
    }
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
      {/* Viewer - occupying full screen behind controls */}
      <EpubViewer
        ref={epubViewerRef}
        book={book}
        fontSize={fontSize}
        theme={theme}
        onProgressChange={handleProgressChange}
        onNavigationLoaded={setChapters}
        onToggleControls={handleToggleControls}
        onCoverExtracted={handleCoverExtracted}
      />

      {/* Header (Slide/Overlay from Top) */}
      {showControls && (
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
      )}

      {/* Progress Information Panel (Float Overlay above bottom bar) */}
      {showControls && (
        <View style={[styles.progressOverlay, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.progressChapterText, { color: colors.text }]} numberOfLines={1}>
            {chapterTitle}
          </Text>
          <View style={styles.progressStatsRow}>
            <Text style={[styles.progressStatText, { color: colors.secondaryText }]}>
              Pág. {currentPage} de {totalPages}
            </Text>
            <Text style={[styles.progressStatText, { color: colors.secondaryText }]}>
              {currentProgress}% completado
            </Text>
          </View>
        </View>
      )}

      {/* Bottom Navigation Bar (Slide/Overlay from Bottom) */}
      {showControls && (
        <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TouchableOpacity onPress={handlePrevPage} style={styles.bottomBarButton}>
            <Text style={[styles.bottomBarButtonText, { color: colors.text }]}>◀ Anterior</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setShowChapters(true)} style={styles.bottomBarButton}>
            <Text style={[styles.bottomBarButtonText, { color: colors.text }]}>📑 Capítulos</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleNextPage} style={styles.bottomBarButton}>
            <Text style={[styles.bottomBarButtonText, { color: colors.text }]}>Siguiente ▶</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Chapters Modal */}
      <Modal
        visible={showChapters}
        transparent
        animationType="slide"
        onRequestClose={() => setShowChapters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Capítulos</Text>
              <TouchableOpacity onPress={() => setShowChapters(false)}>
                <Text style={{ color: colors.text, fontSize: 24 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={chapters}
              keyExtractor={(item, index) => `${item.href}-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.chapterItem, { borderBottomColor: colors.border }]}
                  onPress={() => handleGoToChapter(item.href)}
                >
                  <Text style={[styles.chapterLabel, { color: colors.text }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={[styles.emptyChaptersText, { color: colors.secondaryText }]}>
                  No se encontraron capítulos o el libro se está cargando.
                </Text>
              }
            />
          </View>
        </View>
      </Modal>

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
              <Text style={[styles.progressValue, { color: colors.text }]}>{currentProgress}% completado</Text>
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
    position: 'relative',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
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
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  bottomBarButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  bottomBarButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressOverlay: {
    position: 'absolute',
    bottom: 68,
    left: 16,
    right: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 100,
  },
  progressChapterText: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  progressStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
  },
  progressStatText: {
    fontSize: 13,
    fontWeight: '500',
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
  chapterItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  chapterLabel: {
    fontSize: 16,
  },
  emptyChaptersText: {
    textAlign: 'center',
    paddingVertical: 24,
    fontSize: 15,
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
