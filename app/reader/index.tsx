import EpubViewer, { EpubViewerRef, SearchResult } from '@/components/reader/EpubViewer';
import Slider from '@react-native-community/slider';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { useLibrary } from '../../context/LibraryContext';
import { useTheme } from '../../context/ThemeContext';

import { Ionicons } from '@expo/vector-icons';
import diccionarioData from '../../assets/diccionario_produccion.json'; // Ajusta la ruta a tu carpeta assets
import lemasData from '../../assets/lemas_en.json';

import { getBookCache } from '@/utils/storage/queries/locations';
import { BookCache } from '../../utils/storage/types';


import ChaptersModal from '@/components/reader/ChaptersModal';
import DictionaryModal from '@/components/reader/DictionaryModal';
import styles from '@/components/reader/reader.styles';
import ReaderHeader from '@/components/reader/ReaderHeader';
import SearchResultsModal from '@/components/reader/SearchResultsModal';
import SettingsModal from '@/components/reader/SettingsModal';
// Tipamos el JSON para evitar quejas de TypeScript
const diccionario: Record<string, string> = diccionarioData;
const lemas: Record<string, string> = lemasData;

export default function ReaderScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  // 1. Extraemos solo lo que existe en tu interfaz tipada de LibraryContext
  const { books, updateProgress, deleteBook } = useLibrary();
  const { colors, theme, fontSize,  } = useTheme();

  const [showSettings, setShowSettings] = useState(false);
  const [showChapters, setShowChapters] = useState(false);


  const [chapters, setChapters] = useState<{ title: string; href: string; level: number }[]>([]);
  const [showControls, setShowControls] = useState(false);

  // Progress states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentProgress, setCurrentProgress] = useState<number>(0);

  const [chapterTitle, setChapterTitle] = useState<string>('Capítulo');

  //ESTADOS PARA LA BÚSQUEDA DE TEXTO
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [isSearchingText, setIsSearchingText] = useState<boolean>(false);

  const epubViewerRef = useRef<EpubViewerRef>(null);

  // Convertimos de forma segura el ID string de la URL a número para SQLite
  const book = books.find(b => b.id === Number(params.id));

  const [selectedText, setSelectedText] = useState<string>('');
  const [translation, setTranslation] = useState<string>('');
  const [showDictionaryModal, setShowDictionaryModal] = useState<boolean>(false);

  const [cfiCache, setCfiCache] = useState<string[] | null>(null);
  const flattenChapters = useCallback((navItems: any[], level = 0): any[] => {
    if (!navItems || !Array.isArray(navItems)) return [];

    let flatList: any[] = [];

    navItems.forEach((item) => {
      flatList.push({
        title: item.title || 'Capítulo',
        href: item.href,
        level: level
      });

      if (item.subitems && Array.isArray(item.subitems) && item.subitems.length > 0) {
        // Nota cómo llamamos a la función interna de forma recursiva de forma segura
        flatList = flatList.concat(flattenChapters(item.subitems, level + 1));
      }
    });

    return flatList;
  }, []);

  useEffect(() => {
    async function loadCachedData() {
      try {
        // 1. Buscamos si este libro ya tiene caché en SQLite
        const cache: BookCache | null = await getBookCache(book?.id || 0);

        if (cache && cache.cfiIndexCache) {
          try {
            const parsedCfis = typeof cache.cfiIndexCache === 'string'
              ? JSON.parse(cache.cfiIndexCache)
              : cache.cfiIndexCache;

            if (Array.isArray(parsedCfis) && parsedCfis.length > 0) {
              setCfiCache(parsedCfis); // Guarda el array real en tu estado
            } else {

            }
          } catch (parseError) {
            console.error('❌ Error al parsear cfiIndexCache desde la DB:', parseError);
          }
        } else {
          console.log('⏳ No hay caché de CFIs (locations). Se generarán en el WebView.');
        }

        if (cache && cache.tocCache && cache.tocCache.length > 0) {
          const flatChapters = flattenChapters(cache.tocCache);
          setChapters(flatChapters);
        } else {
          console.log('⏳ No hay caché de capítulos. Te jodes.');
        }
      } catch (error) {
        console.error('Error al cargar la caché del libro:', error);
      }
    }

    if (book?.id) {
      loadCachedData();
    }
  }, [book?.id, flattenChapters]);

  if (!book) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Libro no encontrado</Text>
      </View>
    );
  }

  // 2. CORREGIDO: Orden de parámetros ajustado a la firma de tu base de datos SQLite
  const handleProgressChange = async (progress: number, chapter: string, cfi: string, details?: any) => {
    setCurrentProgress(progress);
    if (details) {
      if (details.currentPage) setCurrentPage(details.currentPage);
      if (details.totalPages) setTotalPages(details.totalPages);
      if (details.chapterTitle) setChapterTitle(details.chapterTitle);
    }
    // updateProgress espera: (id, progress, lastCfi, lastChapterTitle)
    await updateProgress(book.id, progress, cfi, chapter);
  };

  const handleTextSelected = (text: string) => {
    const palabraLimpia = text.toLowerCase().replace(/^[.,\/#!$%\^&\*;:{}=\-_`~()¿?¡!«»"']+|[.,\/#!$%\^&\*;:{}=\-_`~()¿?¡!«»"']+/g, "").trim();

    if (!palabraLimpia) return;

    let resultado = null;

    if (diccionario[palabraLimpia]) {
      resultado = diccionario[palabraLimpia];
    } else {
      const formaBase = lemas[palabraLimpia];
      if (formaBase && diccionario[formaBase]) {
        resultado = diccionario[formaBase];
        console.log(`Lema encontrado: ${palabraLimpia} -> ${formaBase}`);
      }
    }

    if (!resultado) {
      resultado = "No se encontró una traducción exacta para esta palabra.";
    }

    setSelectedText(text);
    setTranslation(resultado);
    setShowDictionaryModal(true);
  };

  const handleGoToChapter = (href: string) => {
    epubViewerRef.current?.goToChapter(href);
    setShowChapters(false);
  };

  // ACCIÓN DISPARADORA DE BÚSQUEDA DESDE RN
  const handleSearchText = () => {
    if (searchQuery.trim().length < 3) return;
    setIsSearching(true);
    setSearchResults([]);
    setShowSearchModal(true);
    epubViewerRef.current?.search(searchQuery);
  };

  // MANEJADOR DE SELECCIÓN DE UN RESULTADO DE BÚSQUEDA
  const handleSelectSearchResult = (cfi: string) => {
    epubViewerRef.current?.goToChapter(cfi);
    setShowSearchModal(false);
    setIsSearchingText(false);
  };

  const handleToggleControls = () => {
    setShowControls(prev => !prev);
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

  // 3. CORREGIDO: Cambiado item.label por item.title para leer el TOC correctamente

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Viewer - occupying full screen behind controls */}
      <EpubViewer
        ref={epubViewerRef}
        book={book}
        fontSize={fontSize}
        theme={theme}
        cfiIndex={cfiCache}
        onProgressChange={handleProgressChange}
        onToggleControls={handleToggleControls}
        onTextSelected={handleTextSelected}
        onSearchResults={(results) => {
          setSearchResults(results);
          setIsSearching(false);
        }}
      />

      {/* Header (Slide/Overlay from Top) */}
      {showControls && (
        <ReaderHeader
          bookTitle={book.title}
          bookAuthor={book.author || 'Autor Desconocido'}
          isSearchingText={isSearchingText}
          setIsSearchingText={setIsSearchingText}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setSearchResults={setSearchResults}
          handleSearchText={handleSearchText}
          onBack={() => router.back()}
          onShowSettings={() => setShowSettings(true)}
        />
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
                ({Math.round(currentProgress * 100)}%)
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
      <ChaptersModal
        isVisible={showChapters}
        onClose={() => setShowChapters(false)}
        chapters={chapters}
        onSelectChapter={handleGoToChapter}
      />

      {/* Settings Modal */}
      <SettingsModal
        isVisible={showSettings}
        onClose={() => setShowSettings(false)}
        currentProgress={currentProgress}
        onDeleteBook={handleDeleteBook}
      />
      {/* Dictionary Floating Modal (Quick Lookup) */}
      <DictionaryModal
        isVisible={showDictionaryModal}
        onClose={() => setShowDictionaryModal(false)}
        selectedText={selectedText}
        translation={translation}
      />

      {/* --- MODAL INFERIOR DE RESULTADOS DE BÚSQUEDA --- */}
      <SearchResultsModal
        isVisible={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        searchQuery={searchQuery}
        isSearching={isSearching}
        searchResults={searchResults}
        onSelectResult={handleSelectSearchResult}
      />
    </View>
  );
}