import EpubViewer, { EpubViewerRef } from '@/components/reader/EpubViewer';
import Slider from '@react-native-community/slider';
import * as NavigationBar from 'expo-navigation-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Modal, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLibrary } from '../../context/LibraryContext';
import { useTheme } from '../../context/ThemeContext';

import { Ionicons } from '@expo/vector-icons';
import diccionarioData from '../../assets/diccionario_produccion.json'; // Ajusta la ruta a tu carpeta assets
import lemasData from '../../assets/lemas_en.json';

// Tipamos el JSON para evitar quejas de TypeScript
const diccionario: Record<string, string> = diccionarioData;
const lemas: Record<string, string> = lemasData;

export default function ReaderScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { books, updateProgress, deleteBook, updateBook } = useLibrary();
  const { colors, theme, toggleTheme, fontSize, setFontSize } = useTheme();

  const [showSettings, setShowSettings] = useState(false);
  const [showChapters, setShowChapters] = useState(false);
  const [chapters, setChapters] = useState<{ label: string; href: string }[]>([]);
  const [showControls, setShowControls] = useState(false);

  // Progress states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentProgress, setCurrentProgress] = useState<number>(0);
  const [chapterTitle, setChapterTitle] = useState<string>('Capítulo');

  const epubViewerRef = useRef<EpubViewerRef>(null);
  const book = books.find(b => b.id === params.id);

  const [selectedText, setSelectedText] = useState<string>('');
  const [translation, setTranslation] = useState<string>('');
  const [showDictionaryModal, setShowDictionaryModal] = useState<boolean>(false);



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
  const handleTextSelected = (text: string) => {
    // Limpieza de puntuación
    const palabraLimpia = text.toLowerCase().replace(/^[.,\/#!$%\^&\*;:{}=\-_`~()¿?¡!«»"']+|[.,\/#!$%\^&\*;:{}=\-_`~()¿?¡!«»"']+$/g, "").trim();

    if (!palabraLimpia) return;

    let resultado = null;

    // 1. Búsqueda directa
    if (diccionario[palabraLimpia]) {
      resultado = diccionario[palabraLimpia];
    }
    // 2. Búsqueda por Lema (si no se encontró directa)
    else {
      const formaBase = lemas[palabraLimpia]; // Buscamos si tiene un lema
      if (formaBase && diccionario[formaBase]) {
        resultado = diccionario[formaBase];
        console.log(`Lema encontrado: ${palabraLimpia} -> ${formaBase}`);
      }
    }

    // Si después de todo no encontramos nada
    if (!resultado) {
      resultado = "No se encontró una traducción exacta para esta palabra.";
    }

    setSelectedText(text);
    setTranslation(resultado);
    setShowDictionaryModal(true);
  };
  // const handlePrevPage = () => {
  //   epubViewerRef.current?.prevPage();
  // };

  // const handleNextPage = () => {
  //   epubViewerRef.current?.nextPage();
  // };

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

  // Función para convertir la estructura de árbol en una lista plana fácil de leer por FlatList
  const flattenChapters = (navItems: any[], level = 0): any[] => {
    if (!navItems || !Array.isArray(navItems)) return [];

    let flatList: any[] = [];

    navItems.forEach((item) => {
      flatList.push({
        label: item.label,
        href: item.href,
        level: level
      });

      // Verificamos de forma segura si tiene subcapítulos
      if (item.subitems && Array.isArray(item.subitems) && item.subitems.length > 0) {
        flatList = flatList.concat(flattenChapters(item.subitems, level + 1));
      }
    });

    return flatList;
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
        onTextSelected={handleTextSelected}
      />

      {/* Header (Slide/Overlay from Top) */}
      {showControls && (
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={styles.headerLeftContainer}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                {book.title}
              </Text>
              <Text style={[styles.headerAutor, { color: colors.secondaryText }]} numberOfLines={1}>
                {book.author}
              </Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => { }} style={styles.headerButton}>
              <Ionicons name="search" size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { }} style={styles.headerButton}>
              <Ionicons name="bookmark-outline" size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.headerButton}>
              <Ionicons name="ellipsis-vertical-sharp" size={24} color={colors.text} />
            </TouchableOpacity>

          </View>
        </View>
      )}

      {/* Panel Inferior Unificado de Progreso y Navegación (Ancho completo) */}
      {showControls && (
        <View style={[styles.unifiedBottomPanel, { backgroundColor: colors.card, borderTopColor: colors.border }]}>

          {/* Fila Superior: Título del Capítulo, Páginas y Porcentaje */}
          <View style={styles.progressHeaderRow}>
            <Text style={[styles.progressChapterText, { color: colors.text }]} numberOfLines={1}>
              {chapterTitle}
            </Text>
            <View style={styles.progressStatsRight}>
              <Text style={[styles.progressStatText, { color: colors.secondaryText }]}>
                Pág. {currentPage}/{totalPages}
              </Text>
              <Text style={[styles.progressStatText, { color: colors.secondaryText, marginLeft: 8 }]}>
                ({currentProgress}%)
              </Text>
            </View>
          </View>

          {/* Fila Central: Barra Deslizante Interactiva (Slider) */}
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.pageSlider}
              minimumValue={1}
              maximumValue={totalPages > 0 ? totalPages : 100}
              step={1}
              value={currentPage}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
              onSlidingComplete={(value) => {
                if (totalPages > 1) {
                  const targetPercentage = (value - 1) / (totalPages - 1);
                  epubViewerRef.current?.goToPercentage?.(targetPercentage);
                } else {
                  epubViewerRef.current?.goToPercentage?.(0);
                }
              }}
            />
          </View>

          {/* Fila Inferior: Solo el botón de Capítulos centrado */}
          <View style={styles.bottomBarButtonsRow}>
            <TouchableOpacity onPress={() => setShowChapters(true)} style={styles.centerChaptersButton}>
              <Ionicons name="list" size={30} color={colors.text} />
            </TouchableOpacity>
          </View>

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
              // Planeamos el árbol de capítulos dinámicamente aquí
              data={flattenChapters(chapters)}
              keyExtractor={(item, index) => `${item.href}-${index}`}
              renderItem={({ item }) => {
                // Definimos una sangría dinámica según el nivel de anidación (0 para principal, 1 para subcapítulo, etc.)
                const indentation = (item.level || 0) * 20;

                return (
                  <TouchableOpacity
                    style={[
                      styles.chapterItem,
                      {
                        borderBottomColor: colors.border,
                        paddingLeft: 16 + indentation // Aplica el espacio a la izquierda
                      }
                    ]}
                    onPress={() => handleGoToChapter(item.href)}
                  >
                    <Text
                      style={[
                        item.level > 0 ? styles.subChapterLabel : styles.chapterLabel,
                        { color: item.level > 0 ? colors.secondaryText : colors.text }
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
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
            <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1,}}>
              <View style={styles.progressInfo}>
                <Text style={[styles.progressLabel, { color: colors.secondaryText }]}>Progreso actual</Text>
                <Text style={[styles.progressValue, { color: colors.text }]}>{currentProgress}% completado</Text>
              </View >
              <TouchableOpacity
                onPress={handleDeleteBook}
                style={[styles.themeToggle, { backgroundColor: '#ff4d4d', marginTop: 20 }]}
              >
                <Ionicons name="trash" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Dictionary Floating Modal (Quick Lookup) */}
      <Modal
        visible={showDictionaryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDictionaryModal(false)}
      >
        <TouchableOpacity
          style={styles.dictionaryOverlay}
          activeOpacity={1}
          onPress={() => setShowDictionaryModal(false)}
        >
          <View style={[styles.dictionaryContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.dictionaryHeader}>
              <Text style={[styles.dictionaryWord, { color: colors.text }]} numberOfLines={1}>
                <Ionicons name="search" size={20} color={colors.text} /> {selectedText}
              </Text>
              <TouchableOpacity
                style={styles.closeDictionaryButton}
                onPress={() => setShowDictionaryModal(false)}
              >
                <Ionicons name="close" size={24} color={colors.secondaryText} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.dictionaryTranslation, { color: colors.text }]}>
              {translation}
            </Text>
          </View>
        </TouchableOpacity>
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
    paddingRight: 24,
  },
  headerLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '70%',
    overflow: 'hidden',
    gap: 12,
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    fontSize: 16,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'left',
    fontSize: 14,
    fontWeight: '600',
  },
  headerAutor: {
    flex: 1,
    textAlign: 'left',
    fontSize: 12,
    fontWeight: '400',
  },
  headerActions: {
    flexDirection: 'row',
  },
  unifiedBottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    // Espacio de seguridad generoso abajo para evitar interferencias con la navegación del móvil
    paddingBottom: Platform.OS === 'ios' ? 45 : 33,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressChapterText: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
  },
  progressStatsRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressStatText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sliderContainer: {
    width: '100%',
    height: 40,
    justifyContent: 'center',
  },
  pageSlider: {
    width: '100%',
    height: 40,
  },
  bottomBarButtonsRow: {
    flexDirection: 'column',
    justifyContent: 'center', // Centra el botón horizontalmente
    alignItems: 'center',
    marginTop: 4,
  },
  centerChaptersButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBarButtonText: {
    fontSize: 15,
    fontWeight: '600',
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
  },
  progressLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  progressValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  subChapterLabel: {
    fontSize: 14,
    fontWeight: '400', // Un poco más delgado que el capítulo principal
  },
  dictionaryOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Un fondo oscuro sutil
    justifyContent: 'flex-end', // Lo posiciona abajo como un bottom sheet
  },
  dictionaryContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24, // Control de área segura
  },
  dictionaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dictionaryWord: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    marginRight: 10,
  },
  closeDictionaryButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  dictionaryTranslation: {
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
  },
});