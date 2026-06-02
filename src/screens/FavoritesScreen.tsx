import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useLibrary } from '../context/LibraryContext';
import { useTheme } from '../context/ThemeContext';
import { BookCard } from '../components/BookCard';

export const FavoritesScreen: React.FC = () => {
  const router = useRouter();
  const { favoriteBooks, toggleFavorite } = useLibrary();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const handleBookPress = (bookId: string) => {
    router.push(`/reader?bookId=${bookId}`);
  };

  const handleFavoritePress = (bookId: string) => {
    toggleFavorite(bookId);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
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
      <Text style={styles.emptyIcon}>💝</Text>
      <Text style={styles.emptyText}>
        No tienes libros favoritos{'\n'}
        Marca libros con el corazón para verlos aquí
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Favoritos</Text>
      </View>

      <FlatList
        data={favoriteBooks}
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
        contentContainerStyle={favoriteBooks.length === 0 ? { flex: 1 } : undefined}
      />
    </View>
  );
};
