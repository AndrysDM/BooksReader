import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Book } from '../context/LibraryContext';
import { useTheme } from '../context/ThemeContext';

interface BookCardProps {
  book: Book;
  onPress: () => void;
  onFavoritePress?: () => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onPress, onFavoritePress }) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 12,
      marginHorizontal: 16,
      marginVertical: 8,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    cover: {
      width: 60,
      height: 90,
      borderRadius: 6,
      backgroundColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    coverText: {
      color: colors.textSecondary,
      fontSize: 24,
    },
    info: {
      flex: 1,
      marginLeft: 12,
    },
    title: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    author: {
      color: colors.textSecondary,
      fontSize: 14,
      marginBottom: 8,
    },
    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    progressBar: {
      flex: 1,
      height: 6,
      backgroundColor: colors.progressBarBackground,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.progressBar,
      borderRadius: 3,
    },
    progressText: {
      color: colors.textSecondary,
      fontSize: 12,
      width: 40,
      textAlign: 'right',
    },
    favoriteButton: {
      padding: 8,
    },
  });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cover}>
        {book.cover ? (
          <Image source={{ uri: book.cover }} style={styles.cover} />
        ) : (
          <Text style={styles.coverText}>📖</Text>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={styles.author} numberOfLines={1}>
          {book.author}
        </Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${book.progress}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{Math.round(book.progress)}%</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.favoriteButton} onPress={onFavoritePress}>
        <Text style={{ fontSize: 24 }}>{book.isFavorite ? '❤️' : '🤍'}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};
