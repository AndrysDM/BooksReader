import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLibrary } from '../../context/LibraryContext';
import { useTheme } from '../../context/ThemeContext';

export default function BookDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { books, deleteBook, toggleFavorite } = useLibrary();
  const { colors } = useTheme();
  
  const book = books.find(b => b.id === params.id);

  if (!book) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Libro no encontrado</Text>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      'Eliminar libro',
      '¿Estás seguro de que quieres eliminar este libro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            await deleteBook(book.id);
            router.back();
          }
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

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: colors.text }]}>← Volver</Text>
        </TouchableOpacity>
      </View>

      {/* Cover */}
      <View style={styles.coverSection}>
        {book.cover ? (
          // En producción usar Image component
          <View style={[styles.cover, { backgroundColor: colors.primary }]}>
            <Text style={styles.coverPlaceholder}>{book.title.charAt(0).toUpperCase()}</Text>
          </View>
        ) : (
          <View style={[styles.cover, { backgroundColor: colors.primary }]}>
            <Text style={styles.coverPlaceholder}>{book.title.charAt(0).toUpperCase()}</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.infoSection}>
        <Text style={[styles.title, { color: colors.text }]}>{book.title}</Text>
        <Text style={[styles.author, { color: colors.secondaryText }]}>por {book.author}</Text>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Details */}
        <View style={styles.detailsContainer}>
          <DetailRow 
            label="Fecha de importación" 
            value={formatDate(book.importDate)} 
            colors={colors} 
          />
          <DetailRow 
            label="Progreso" 
            value={`${Math.round(book.progress)}% completado`} 
            colors={colors} 
          />
          <DetailRow 
            label="Capítulo actual" 
            value={`Capítulo ${book.currentChapter + 1}`} 
            colors={colors} 
          />
          <DetailRow 
            label="Estado" 
            value={book.isFavorite ? '❤️ Favorito' : 'No favorito'} 
            colors={colors} 
          />
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push(`/reader?id=${book.id}`)}
          >
            <Text style={styles.actionButtonText}>📖 Leer ahora</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButtonSecondary, { borderColor: colors.border }]}
            onPress={() => toggleFavorite(book.id)}
          >
            <Text style={[styles.actionButtonTextSecondary, { color: colors.text }]}>
              {book.isFavorite ? '🤍 Quitar de favoritos' : '❤️ Marcar como favorito'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.deleteButton, { borderColor: '#FF5722' }]}
            onPress={handleDelete}
          >
            <Text style={styles.deleteButtonText}>🗑️ Eliminar libro</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

function DetailRow({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: colors.secondaryText }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.text }]}>{value}</Text>
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
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
  },
  coverSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  cover: {
    width: 150,
    height: 220,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  coverPlaceholder: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  infoSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  author: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  detailsContainer: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonSecondary: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  actionButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 8,
  },
  deleteButtonText: {
    color: '#FF5722',
    fontSize: 16,
    fontWeight: '600',
  },
});
