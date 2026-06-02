import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLibrary } from '../context/LibraryContext';
import { useTheme } from '../context/ThemeContext';
import { deleteEpubFile } from '../utils/fileHandler';
import { deleteReadingProgress } from '../utils/storage';

export const BookDetailScreen: React.FC = () => {
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const router = useRouter();
  const { getBookById, deleteBook, toggleFavorite } = useLibrary();
  const { colors } = useTheme();

  const book = bookId ? getBookById(bookId) : undefined;

  if (!book) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Libro no encontrado</Text>
      </View>
    );
  }

  const handleDelete = async () => {
    Alert.alert(
      'Eliminar libro',
      `¿Estás seguro de que quieres eliminar "${book.title}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteEpubFile(book.filePath);
            await deleteReadingProgress(book.id);
            deleteBook(book.id);
            router.back();
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 8,
      marginRight: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    content: {
      padding: 20,
    },
    coverContainer: {
      alignItems: 'center',
      marginBottom: 24,
    },
    cover: {
      width: 150,
      height: 220,
      borderRadius: 8,
      backgroundColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    coverText: {
      fontSize: 60,
    },
    infoSection: {
      marginBottom: 20,
    },
    label: {
      color: colors.textSecondary,
      fontSize: 14,
      marginBottom: 4,
    },
    value: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '500',
    },
    progressSection: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    progressBar: {
      height: 8,
      backgroundColor: colors.progressBarBackground,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.progressBar,
      borderRadius: 4,
    },
    actionButtons: {
      gap: 12,
    },
    button: {
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    primaryButton: {
      backgroundColor: colors.primary,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 16,
    },
    secondaryButton: {
      backgroundColor: colors.border,
    },
    secondaryButtonText: {
      color: colors.text,
      fontWeight: '600',
      fontSize: 16,
    },
    dangerButton: {
      backgroundColor: '#FF4444',
      marginTop: 12,
    },
    dangerButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 16,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={{ fontSize: 24, color: colors.text }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Detalles del libro</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Cover */}
        <View style={styles.coverContainer}>
          <View style={styles.cover}>
            {book.cover ? (
              // eslint-disable-next-line react/jsx-no-comment-textnodes
              <Text>Cover</Text>
            ) : (
              <Text style={styles.coverText}>📖</Text>
            )}
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <Text style={styles.label}>Título</Text>
          <Text style={styles.value}>{book.title}</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.label}>Autor</Text>
          <Text style={styles.value}>{book.author}</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.label}>Fecha de importación</Text>
          <Text style={styles.value}>{formatDate(book.importDate)}</Text>
        </View>

        {book.lastRead && (
          <View style={styles.infoSection}>
            <Text style={styles.label}>Última lectura</Text>
            <Text style={styles.value}>{formatDate(book.lastRead)}</Text>
          </View>
        )}

        {/* Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={[styles.label, { marginBottom: 0 }]}>Progreso de lectura</Text>
            <Text style={[styles.value, { fontSize: 16 }]}>{Math.round(book.progress)}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${book.progress}%` }]} />
          </View>
          <Text style={[styles.label, { marginTop: 8, marginBottom: 0 }]}>
            Capítulo {book.currentChapter + 1}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => router.push(`/reader?bookId=${book.id}`)}
          >
            <Text style={styles.primaryButtonText}>Continuar leyendo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => toggleFavorite(book.id)}
          >
            <Text style={styles.secondaryButtonText}>
              {book.isFavorite ? '❤️ Quitar de favoritos' : '🤍 Marcar como favorito'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={handleDelete}
          >
            <Text style={styles.dangerButtonText}>Eliminar libro</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};
