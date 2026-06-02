import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useLibrary } from '../context/LibraryContext';
import { useTheme } from '../context/ThemeContext';
import { BookCard } from '../components/BookCard';
import { pickAndImportEpub } from '../utils/fileHandler';

export const LibraryScreen: React.FC = () => {
  const router = useRouter();
  const { books, addBook, toggleFavorite } = useLibrary();
  const { colors, themeMode } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const handleImportBook = async () => {
    const bookData = await pickAndImportEpub();
    if (bookData) {
      addBook(bookData);
      Alert.alert('Éxito', 'Libro importado correctamente');
    }
  };

  const handleBookPress = (bookId: string) => {
    router.push(`/reader?bookId=${bookId}`);
  };

  const handleFavoritePress = (bookId: string) => {
    toggleFavorite(bookId);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Aquí podrías recargar la lista si fuera necesario
    setTimeout(() => setRefreshing(false), 500);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
    },
    importButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    importButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    emptyText: {
      color: colors.textSecondary,
      fontSize: 16,
      textAlign: 'center',
      marginTop: 16,
    },
    emptyIcon: {
      fontSize: 64,
    },
  });

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📚</Text>
      <Text style={styles.emptyText}>
        Tu biblioteca está vacía{'\n'}
        Importa un libro EPUB para comenzar a leer
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mi Biblioteca</Text>
        <TouchableOpacity style={styles.importButton} onPress={handleImportBook}>
          <Text style={styles.importButtonText}>+ Importar</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={books}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <BookCard
            book={item}
            onPress={() => handleBookPress(item.id)}
            onFavoritePress={() => handleFavoritePress(item.id)}
          />
        )}
        ListEmptyComponent={renderEmpty}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={books.length === 0 ? { flex: 1 } : undefined}
      />
    </View>
  );
};
