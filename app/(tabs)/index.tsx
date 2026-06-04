import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, useWindowDimensions, Modal, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useLibrary } from '../../context/LibraryContext';
import { useTheme } from '../../context/ThemeContext';
import BookCard from '../../components/BookCard';
import * as DocumentPicker from 'expo-document-picker';
import { fileHandler, Book } from '../../utils/storage';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';

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

export default function LibraryScreen() {
  const router = useRouter();
  const { books, loading, addBook, toggleFavorite } = useLibrary();
  const { colors, theme, toggleTheme } = useTheme();
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  
  // Importer and Extractor States
  const [importingBook, setImportingBook] = useState<boolean>(false);
  const [tempBookPath, setTempBookPath] = useState<string | null>(null);
  const [tempBookFilename, setTempBookFilename] = useState<string>('');
  const extractorWebViewRef = useRef<WebView>(null);

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

      // Save temp metadata to read inside background extractor webview
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
            const base64Data = await FileSystem.readAsStringAsync(tempBookPath, {
              encoding: FileSystem.EncodingType.Base64,
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
  const numColumns = Math.max(2, Math.floor((width - 16) / 120));
  const itemWidth = (width - 32 - (numColumns - 1) * 16) / numColumns;

  const filteredBooks = filter === 'all' 
    ? books 
    : books.filter(book => book.isFavorite);

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
      {books.length === 0 && (
        <TouchableOpacity style={[styles.importButton, { backgroundColor: colors.primary }]} onPress={handleImportBook}>
          <Text style={styles.importButtonText}>Importar libro</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Mi Biblioteca</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={toggleTheme} style={styles.themeButton}>
            <Text style={styles.themeIcon}>{theme === 'light' ? '🌙' : '☀️'}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleImportBook} 
            style={[styles.importButtonSmall, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.importIcon}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && { backgroundColor: colors.primary }]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, { color: filter === 'all' ? '#FFFFFF' : colors.text }]}>
            Todos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'favorites' && { backgroundColor: colors.primary }]}
          onPress={() => setFilter('favorites')}
        >
          <Text style={[styles.filterText, { color: filter === 'favorites' ? '#FFFFFF' : colors.text }]}>
            ❤️ Favoritos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Grid List */}
      {loading ? (
        <View style={styles.loading}>
          <Text style={{ color: colors.text }}>Cargando...</Text>
        </View>
      ) : (
        <FlatList
          key={numColumns}
          data={filteredBooks}
          numColumns={numColumns}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BookCard
              book={item}
              width={itemWidth}
              onPress={() => router.push(`/reader?id=${item.id}`)}
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
      )}

      {/* Importing Loader Modal */}
      <Modal
        visible={importingBook}
        transparent={true}
        animationType="fade"
      >
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

      {/* Invisible background metadata extractor WebView */}
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeButton: {
    padding: 8,
  },
  themeIcon: {
    fontSize: 24,
  },
  importButtonSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  importIcon: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginHorizontal: 32,
    borderRadius: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  importButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  importButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyList: {
    flexGrow: 1,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
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
});
