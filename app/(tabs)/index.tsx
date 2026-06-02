import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useLibrary } from '../../context/LibraryContext';
import { useTheme } from '../../context/ThemeContext';
import BookCard from '../../components/BookCard';
import * as DocumentPicker from 'expo-document-picker';
import { fileHandler, Book } from '../../utils/storage';

export default function LibraryScreen() {
  const router = useRouter();
  const { books, loading, addBook, toggleFavorite } = useLibrary();
  const { colors, theme, toggleTheme } = useTheme();
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');

  const handleImportBook = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/epub+zip',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const file = result.assets[0];
      const filename = `${Date.now()}_${file.name}`;
      const savedPath = await fileHandler.saveBook(file.uri, filename);

      // Crear objeto libro básico (en producción, extraer metadatos reales del EPUB)
      const newBook: Book = {
        id: Date.now().toString(),
        title: file.name.replace('.epub', ''),
        author: 'Autor desconocido',
        filePath: savedPath,
        importDate: new Date().toISOString(),
        progress: 0,
        currentChapter: 0,
        isFavorite: false,
        totalChapters: 1,
      };

      await addBook(newBook);
      
      Alert.alert('Éxito', 'Libro importado correctamente');
    } catch (error) {
      console.error('Error importing book:', error);
      Alert.alert('Error', 'No se pudo importar el libro');
    }
  };

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

      {loading ? (
        <View style={styles.loading}>
          <Text style={{ color: colors.text }}>Cargando...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredBooks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BookCard
              book={item}
              onPress={() => router.push(`/app/reader?id=${item.id}`)}
              onFavoritePress={() => toggleFavorite(item.id)}
            />
          )}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={filteredBooks.length === 0 && styles.emptyList}
        />
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
});
