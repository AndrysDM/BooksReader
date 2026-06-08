import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Book } from '../../utils/storage/types';

interface BookCardProps {
  book: Book;
  onPress: () => void;
  onFavoritePress?: () => void;
  width: number;
}

export default function BookCard({ book, onPress, onFavoritePress, width }: BookCardProps) {
  const { colors } = useTheme();
  const height = width * 1.5;

  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        { 
          width, 
          height, 
          backgroundColor: colors.card, 
          borderColor: colors.border 
        }
      ]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      {book.coverUrl ? (
        <Image source={{ uri: book.coverUrl }} style={styles.cover} />
      ) : (
        <View style={[styles.placeholderCover, { backgroundColor: colors.primary }]}>
          <Text style={styles.placeholderText}>
            {book.title.charAt(0).toUpperCase()}
          </Text>
          <Text style={styles.placeholderTitle} numberOfLines={2}>
            {book.title}
          </Text>
        </View>
      )}

      {/* Book Spine Shadow Overlay (gives a realistic 3D book feel) */}
      <View style={styles.spineOverlay} />
      
      {/* Favorite Button overlay */}
      <TouchableOpacity 
        style={[styles.favoriteButton, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
        onPress={onFavoritePress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.favoriteIcon}>{book.isFavorite ? '❤️' : '🤍'}</Text>
      </TouchableOpacity>
      
      {/* Progress percentage pill overlay */}
      <View style={[styles.progressBadge, { backgroundColor: 'rgba(0, 0, 0, 0.65)' }]}>
        <Text style={styles.progressText}>
          {Math.round(book.progress)}%
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  cover: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderCover: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  placeholderText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  placeholderTitle: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  spineOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.15)',
    zIndex: 5,
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  favoriteIcon: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  progressBadge: {
    position: 'absolute',
    bottom: 8,
    left: 14, // Leave space for spine
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    zIndex: 10,
  },
  progressText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
