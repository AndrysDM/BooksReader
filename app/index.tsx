import BookCard from '@/components/home/BookCard';
import { ContinueReadingCard } from '@/components/home/ContinueReadingCard';
import styles from '@/components/home/home.styles';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { readAsStringAsync } from 'expo-file-system/legacy';
import { useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLibrary } from '../context/LibraryContext';
import { useTheme } from '../context/ThemeContext';
import { fileHandler } from '../utils/storage';
import { saveBookCache } from '../utils/storage/queries/locations';
import { Book } from '../utils/storage/types';

const extractorHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.5/jszip.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/epubjs/dist/epub.min.js"></script>
</head>
<body>
  <script>
    window.onload = function() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready_to_receive' }));
    };

    window.extractMetadata = async function(base64Data) {
      try {
        const binaryString = atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const book = ePub(bytes.buffer);
        await book.ready;
        
        // 1. Extraer Metadatos
        const metadata = book.package.metadata;
        const extractedTitle = metadata.title || "";
        const extractedAuthor = metadata.creator || "Autor desconocido";

        // 2. Extraer Árbol de Navegación con TU lógica recursiva original
        function mapNavigationTree(items) {
          if (!items) return undefined;
          return items.map(chap => {
            const mapped = {
              title: chap.label ? chap.label.trim() : 'Capítulo',
              href: chap.href
            };
            if (chap.subitems && chap.subitems.length > 0) {
              mapped.subitems = mapNavigationTree(chap.subitems);
            }
            return mapped;
          });
        }

        const tocTree = book.navigation && book.navigation.toc 
          ? mapNavigationTree(book.navigation.toc) 
          : [];

        // 3. GENERAR UBICACIONES (El cuello de botella)
        let locationsArray = [];
        try {
          // El culpable de la lentitud está aquí abajo
          await book.locations.generate(1500);
          locationsArray = book.locations.save(); 
        } catch (locErr) {
          console.error("Error generando locaciones:", locErr);
        }

        // 4. Extraer Imagen de Portada
        let coverBase64 = null;
        try {
          const url = await book.coverUrl();
          if (url) {
            const response = await fetch(url);
            const blob = await response.blob();
            coverBase64 = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = function() {
                resolve(reader.result);
              };
              reader.readAsDataURL(blob);
            });
          }
        } catch (coverErr) {
          console.error("Error procesando portada:", coverErr);
        }

        // 5. Enviar respuesta
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'metadata_extracted',
          title: extractedTitle,
          author: extractedAuthor,
          cover: coverBase64,
          locations: locationsArray,
          toc: tocTree
        }));

      } catch (error) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'error',
          message: error.message
        }));
      }
    };
  </script>
</body>
</html>
`;

// Variable global en memoria para registrar el último ID abierto en la sesión actual
let globalLastOpenedBookId: number | null = null;

export default function LibraryScreen() {
  const router = useRouter();
  const navigation = useNavigation(); // Hook para escuchar eventos de navegación
  const { books, addBook, toggleFavorite, updateProgress } = useLibrary();
  const { colors } = useTheme();
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [filterDropdownVisible, setFilterDropdownVisible] = useState(false);

  // Estado local para forzar el re-renderizado de los hooks useMemo cuando la pantalla gane foco
  const [refreshKey, setRefreshKey] = useState(0);

  // Estados del importador
  const [importingBook, setImportingBook] = useState<boolean>(false);
  const [tempBookPath, setTempBookPath] = useState<string | null>(null);
  const [tempBookFilename, setTempBookFilename] = useState<string>('');
  const extractorWebViewRef = useRef<WebView>(null);

  // Escucha cuando el usuario regresa a esta pantalla (Focus)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Incrementamos la llave para romper el caché de los useMemo e interfaz
      setRefreshKey(prev => prev + 1);
    });
    return unsubscribe;
  }, [navigation]);

  // Función para abrir el libro guardando el ID de inmediato
  const handleOpenBook = async (book: Book) => {
    globalLastOpenedBookId = book.id; // Ahora book.id es un 'number'

    try {
      if (updateProgress) {
        // Pasamos el progreso, CFI y capítulo actuales para que SQLite 
        // solo actualice la fecha de última lectura ('last_read_at')
        await updateProgress(
          book.id,
          book.progress,
          book.lastCfi || '',
          book.lastChapterTitle || ''
        );
      }
    } catch (error) {
      console.error('Error al actualizar la fecha de última lectura:', error);
    }

    router.push(`/reader?id=${book.id}`);
  };

  const handleImportBook = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/epub+zip',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      setImportingBook(true);

      const file = result.assets[0];
      const filename = `${Date.now()}_${file.name}`;
      const savedPath = await fileHandler.saveBook(file.uri, filename);

      setTempBookFilename(file.name);
      setTempBookPath(savedPath);
    } catch (error) {
      console.error('Error importing book:', error);
      setImportingBook(false);
      Alert.alert('Error', 'No se pudo importar el libro');
    }
  };

  const handleExtractorMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'ready_to_receive') {
        if (tempBookPath) {
          try {
            const base64Data = await readAsStringAsync(tempBookPath, {
              encoding: 'base64',
            });
            const js = `window.extractMetadata("${base64Data}"); true;`;
            extractorWebViewRef.current?.injectJavaScript(js);
          } catch (err) {
            console.error('Error reading temp file for extraction:', err);
            fallbackImport();
          }
        } else {
          fallbackImport();
        }
      }

      else if (data.type === 'metadata_extracted') {
        let finalCoverUrl: string | null = null;

        // 1. Si el extractor encontró una portada en Base64, la guardamos física en disco
        if (data.cover) {
          try {
            const coverFilename = `${Date.now()}_cover`;
            finalCoverUrl = await fileHandler.saveCoverImage(data.cover, coverFilename);
          } catch (coverErr) {
            console.error('Error saving cover image file, ignoring:', coverErr);
            // Si falla la portada, no rompemos la importación completa, se queda en null
          }
        }

        // 2. Preparamos el objeto limpio con el tipado estricto que espera SQLite
        const bookData = {
          title: data.title || tempBookFilename.replace('.epub', ''),
          author: data.author || 'Autor desconocido',
          coverUrl: finalCoverUrl, // Ruta física local (file://...)
          filePath: tempBookPath!,
        };

        // 3. Insertamos el libro en SQLite y obtenemos el ID numérico autogenerado
        const insertedBookId = await addBook(bookData);
        // 4. Guardamos los datos pesados en la caché unificada (locations y TOC)
        // Asumimos que data.locations es el array de strings CFI y data.toc es el árbol de navegación
        const locationsArray = data.locations || [];
        const tocTree = data.toc || [];

        if (locationsArray.length > 0 || tocTree.length > 0) {
          try {
            await saveBookCache(insertedBookId, locationsArray, tocTree);
          } catch (cacheErr) {
            console.error('Error saving book heavy cache:', cacheErr);
          }
        }

        cleanupImport();
        Alert.alert('Éxito', 'Libro importado correctamente');
      }

      else if (data.type === 'error') {
        console.error('Metadata extractor JavaScript error:', data.message);
        fallbackImport();
      }
    } catch (error) {
      console.error('Error parsing extractor message:', error);
      fallbackImport();
    }
  };

  const fallbackImport = async () => {
    if (tempBookPath) {
      try {
        // Preparamos los datos mínimos obligatorios para SQLite
        const bookData = {
          title: tempBookFilename.replace('.epub', ''),
          author: 'Autor desconocido',
          coverUrl: null, // No se pudieron extraer metadatos, se queda sin portada
          filePath: tempBookPath,
        };

        // Guardamos el libro en la base de datos
        await addBook(bookData);

        Alert.alert(
          'Importado',
          'Libro importado (no se pudieron extraer todos los metadatos)'
        );
      } catch (error) {
        console.error('Error en fallbackImport al guardar en SQLite:', error);
        Alert.alert('Error', 'No se pudo guardar el libro en la base de datos.');
      }
    }
    cleanupImport();
  };

  const cleanupImport = () => {
    setTempBookPath(null);
    setTempBookFilename('');
    setImportingBook(false);
  };

  const { width } = useWindowDimensions();
  const numColumns = Math.max(3, Math.floor((width - 16) / 120));
  const itemWidth = (width - 32 - (numColumns - 1) * 16) / numColumns;

  // Re-evalúa y rompe referencias viejas de los libros usando la refreshKey
  const filteredBooks = useMemo(() => {
    if(refreshKey){}
    return filter === 'all' ? books : books.filter(book => book.isFavorite);
  }, [books, filter, refreshKey]);

  // Selección inteligente del libro en lectura activa
  const currentReadingBook = useMemo(() => {
    if(refreshKey){}
    // 1. Prioridad: Si coincide con el ID numérico guardado en memoria en esta sesión
    if (globalLastOpenedBookId !== null) {
      const lastBook = books.find(book => book.id === globalLastOpenedBookId);
      if (lastBook) return lastBook;
    }

    // 2. Fallback: Usar el libro leído más recientemente (las fechas ya son objetos Date)
    if (books.length === 0) return undefined;

    return [...books].sort((a, b) => {
      const timeA = a.lastReadAt ? a.lastReadAt.getTime() : 0;
      const timeB = b.lastReadAt ? b.lastReadAt.getTime() : 0;
      return timeB - timeA; // Orden descendente (más reciente primero)
    })[0];
  }, [books, refreshKey]);

  const renderEmpty = () => (
    <View style={[styles.empty, { backgroundColor: colors.card }]}>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {books.length === 0 ? 'Tu biblioteca está vacía' : 'No hay favoritos'}
      </Text>
      <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
        {books.length === 0
          ? 'Importa tu primer libro EPUB para comenzar'
          : 'Marca libros como favoritos para verlos aquí'}
      </Text>
    </View>
  );


  const FilterDropdown = () => (
    <>
      {/* Capa invisible para cerrar al tocar fuera */}
      <TouchableOpacity
        style={styles.dropdownOverlay}
        activeOpacity={1}
        onPress={() => setFilterDropdownVisible(false)}
      />

      {/* Contenido del Dropdown alineado al botón */}
      <View style={[styles.dropdownContent, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={styles.dropdownOption}
          onPress={() => { setFilter('all'); setFilterDropdownVisible(false); }}
        >
          <Text style={[styles.dropdownOptionText, { color: colors.text, fontWeight: filter === 'all' ? 'bold' : 'normal' }]}>
            Todos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dropdownOption}
          onPress={() => { setFilter('favorites'); setFilterDropdownVisible(false); }}
        >
          <Text style={[styles.dropdownOptionText, { color: colors.text, fontWeight: filter === 'favorites' ? 'bold' : 'normal' }]}>
            Favoritos
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const FAB = () => (
    <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={handleImportBook}>
      <Ionicons name="add" size={30} color="#FFFFFF" />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header superior */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.appIcon, { backgroundColor: colors.primary }]}>
            <Ionicons name="book" size={22} color="#FFFFFF" />
            <View style={styles.subIconContainer}>
              <Ionicons name="chatbox-ellipses-outline" size={10} color={colors.primary} />
            </View><View style={styles.subIconContainer}>
              <Ionicons name="chatbox-ellipses" size={9.5} color={colors.background} />
            </View>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Biblioteca</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerActionButton}>
            <Ionicons name="search-sharp" size={30} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionButton} onPress={() => router.push('/settings')}>
            <Ionicons name="settings-sharp" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.continueReadingContainer}>
        {currentReadingBook && (
          <ContinueReadingCard
            book={currentReadingBook}
            colors={colors}
            onPress={() => handleOpenBook(currentReadingBook)}
          />
        )}

        <View style={[styles.sectionHeader, { marginTop: currentReadingBook ? 24 : 8 }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Mis libros</Text>

          <TouchableOpacity style={styles.filterDropdownButton} onPress={() => setFilterDropdownVisible(true)}>
            <Text style={[styles.filterDropdownText, { color: colors.secondaryText }]}>
              {filter === 'all' ? 'Todos' : 'Favoritos'}
            </Text>
            <Ionicons name="chevron-down" size={14} color={colors.secondaryText} style={{ marginTop: 2 }} />

            {/* Renderizado condicional directo, sin Modal nativo */}
            {filterDropdownVisible && <FilterDropdown />}
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        key={numColumns}
        data={filteredBooks}
        numColumns={numColumns}
        keyExtractor={(item) => item.id.toString()} // Aseguramos que el ID es string para FlatList
        removeClippedSubviews={false}
        renderItem={({ item }) => (
          <BookCard
            book={item}
            width={itemWidth}
            onPress={() => handleOpenBook(item)}
            onFavoritePress={() => toggleFavorite(item.id)}
          />
        )}
        columnWrapperStyle={{ gap: 16 }}
        contentContainerStyle={[
          styles.listContainer,
          filteredBooks.length === 0 && styles.emptyList
        ]}
        ListEmptyComponent={renderEmpty}
      />



      <FAB />
      {/* Modal de Carga */}
      <Modal visible={importingBook} transparent={true} animationType="fade">
        <View style={styles.loaderOverlay}>
          <View style={[styles.loaderContent, { backgroundColor: colors.card }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loaderText, { color: colors.text }]}>
              Importando libro...
            </Text>
            <Text style={[styles.loaderSubtext, { color: colors.secondaryText }]}>
              Extrayendo metadatos y portada.
            </Text>
          </View>
        </View>
      </Modal>

      {/* Extractor WebView */}
      {tempBookPath && (
        <View style={{ width: 0, height: 0, opacity: 0, position: 'absolute' }}>
          <WebView
            ref={extractorWebViewRef}
            originWhitelist={['*']}
            source={{ html: extractorHtml }}
            onMessage={handleExtractorMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
        </View>
      )}
    </View>
  );
}

