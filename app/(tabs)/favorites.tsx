import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useLibrary } from '../../context/LibraryContext';
import { useTheme } from '../../context/ThemeContext';
import BookCard from '../../components/BookCard';

export default function FavoritesScreen() {
  const router = useRouter();
  const { books, toggleFavorite } = useLibrary();
  const { colors } = useTheme();

  const favoriteBooks = books.filter(book => book.isFavorite);

  const renderEmpty = () => (
    <View style={[styles.empty, { backgroundColor: colors.card }]}>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No hay favoritos</Text>
      <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
        Marca libros como favoritos para verlos aquí
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Mis Favoritos</Text>
      </View>

      <FlatList
        data={favoriteBooks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <BookCard
            book={item}
            onPress={() => router.push(`/app/reader?id=${item.id}`)}
            onFavoritePress={() => toggleFavorite(item.id)}
          />
        )}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={favoriteBooks.length === 0 && styles.emptyList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
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
  },
  emptyList: {
    flexGrow: 1,
  },
});
