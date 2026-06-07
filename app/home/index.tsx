import { ContinueReadingCard } from '@/components/ContinueReadingCard';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { readAsStringAsync } from 'expo-file-system/legacy';
import { useNavigation, useRouter } from 'expo-router'; // Añadido useNavigation
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { WebView } from 'react-native-webview';
import BookCard from '../../components/BookCard';
import { useLibrary } from '../../context/LibraryContext';
import { useTheme } from '../../context/ThemeContext';
import { Book, fileHandler } from '../../utils/storage';

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

    window.extractMetadata = function(base64Data) {
      try {
        const binaryString = atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const book = ePub(bytes.buffer);
        let extractedTitle = "";
        let extractedAuthor = "Autor desconocido";

        book.ready.then(() => {
          const metadata = book.package.metadata;
          extractedTitle = metadata.title || "";
          extractedAuthor = metadata.creator || "Autor desconocido";
          return book.coverUrl();
        }).then((url) => {
          if (url) {
            return fetch(url)
              .then(response => response.blob())
              .then(blob => {
                return new Promise((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = function() {
                    resolve(reader.result);
                  };
                  reader.readAsDataURL(blob);
                });
              });
          }
          return null;
        }).then((coverBase64) => {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'metadata_extracted',
            title: extractedTitle,
            author: extractedAuthor,
            cover: coverBase64
          }));
        }).catch((err) => {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'metadata_extracted',
            title: extractedTitle || "Libro importado",
            author: extractedAuthor || "Autor desconocido",
            cover: null,
            error: err.message
          }));
        });

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
let globalLastOpenedBookId: string | null = null;

export default function LibraryScreen() {
  const router = useRouter();
  const navigation = useNavigation(); // Hook para escuchar eventos de navegación
  const { books, addBook, toggleFavorite, updateBook } = useLibrary();
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
    globalLastOpenedBookId = book.id; // Guardado síncrono instantáneo
    try {
      if (updateBook) {
        await updateBook(book.id, {
          lastOpened: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error al actualizar la fecha lastOpened:', error);
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
      } else if (data.type === 'metadata_extracted') {
        const newBook: Book = {
          id: Date.now().toString(),
          title: data.title || tempBookFilename.replace('.epub', ''),
          author: data.author || 'Autor desconocido',
          cover: data.cover || undefined,
          filePath: tempBookPath!,
          importDate: new Date().toISOString(),
          progress: 0,
          currentChapter: 0,
          isFavorite: false,
          totalChapters: 1,
        };

        await addBook(newBook);
        cleanupImport();
        Alert.alert('Éxito', 'Libro importado correctamente');
      } else if (data.type === 'error') {
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
      const newBook: Book = {
        id: Date.now().toString(),
        title: tempBookFilename.replace('.epub', ''),
        author: 'Autor desconocido',
        filePath: tempBookPath,
        importDate: new Date().toISOString(),
        progress: 0,
        currentChapter: 0,
        isFavorite: false,
        totalChapters: 1,
      };
      await addBook(newBook);
      Alert.alert('Importado', 'Libro importado (no se pudieron extraer todos los metadatos)');
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
    const list = filter === 'all' ? books : books.filter(book => book.isFavorite);
    return [...list]; // Copia superficial para forzar refresco visual en las tarjetas principales
  }, [books, filter, refreshKey]);

  // Selección inteligente del libro en lectura activa
  const currentReadingBook = useMemo(() => {

    // 1. Prioridad: Si coincide con el ID guardado en memoria en esta sesión
    if (globalLastOpenedBookId) {
      const lastBook = books.find(book => book.id === globalLastOpenedBookId);
      if (lastBook) return lastBook;
    }

    // 2. Fallback: Ordenar por fecha 'lastOpened'
    return [...books].sort((a, b) => {
      const timeA = a.lastOpened ? new Date(a.lastOpened).getTime() : 0;
      const timeB = b.lastOpened ? new Date(b.lastOpened).getTime() : 0;
      return timeB - timeA;
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
          <TouchableOpacity style={styles.headerActionButton}>
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
        keyExtractor={(item) => item.id}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  }, subIconContainer: {
    position: 'absolute',
    bottom: 7, // Ajusta para posicionar verticalmente
    right: 2, // Ajusta para posicionar horizontalmente
    borderRadius: 12, // Ajusta para redondear el contenedor del sub-icono
    padding: 2, // Añade padding para el sub-icono
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerActionButton: {
    padding: 4,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
    zIndex: 10,
    elevation: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  filterDropdownButton: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 11,
    elevation: 11,
  },
  filterDropdownText: {
    fontSize: 14,
    fontWeight: '500',
  },
  continueCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 16,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  continueCover: {
    width: 60,
    height: 90,
    borderRadius: 8,
  },
  continueDetails: {
    flex: 1,
  },
  continueTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  continueAuthor: {
    fontSize: 13,
    marginBottom: 12,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  progressPercentage: {
    fontSize: 12,
  },
  continueChapter: {
    fontSize: 12,
  },
  emptyList: {
    flexGrow: 1,
  },
  continueReadingContainer: {
    paddingHorizontal: 16,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 32,
    marginHorizontal: 16,
    borderRadius: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  loaderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContent: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    width: '80%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  loaderText: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loaderSubtext: {
    marginTop: 8,
    fontSize: 13,
    textAlign: 'center',
  },
  dropdownOverlay: {
    position: 'absolute',
    // Rompe el contenedor padre expandiéndose a toda la pantalla para capturar el touch
    top: -1000,
    bottom: -1000,
    left: -1000,
    right: -1000,
    backgroundColor: 'transparent',
    zIndex: 40,
  },
  dropdownContent: {
    position: 'absolute',
    // 👇 Esto lo empuja exactamente al límite inferior de tu filterDropdownButton
    top: '100%',
    right: 0,
    marginTop: 4, // Pequeña separación del botón
    width: 130,
    borderRadius: 8,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 50, // Asegura que quede por encima de las listas de libros
  },
  dropdownOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dropdownOptionText: {
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
});