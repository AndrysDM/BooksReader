import { Ionicons } from '@expo/vector-icons'; // Asegúrate de usar tu librería de iconos interna
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Interfaz local del Libro (puedes importarla si ya la tienes global)
export interface Book {
  id: string;
  title: string;
  author: string;
  cover?: string;
  progress: number;
  currentChapter?: string | number;
  lastOpened?: string;
}

interface ContinueReadingCardProps {
  book: Book;
  colors: {
    background: string;
    card: string;
    text: string;
    secondaryText: string;
    primary: string;
    border?: string;
  };
  onPress: () => void; // Callback limpio para manejar la acción desde la pantalla padre
}

// Subcomponente interno para la barra de progreso integrada y segura con Flexbox
const BookProgressBar: React.FC<{ progress: number; colors: ContinueReadingCardProps['colors'] }> = ({ progress, colors }) => {
  const p = Number(progress) || 0;
  
  // Normalización estricta entre 0 y 100 (Soporta escala 0-1 y 0-100)
  const percentage = p <= 1 
    ? Math.min(Math.max(p * 100, 0), 100) 
    : Math.min(Math.max(p, 0), 100);

  return (
    <View style={barStyles.container}>
      {/* El contenedor contenedor 'track' usa flex: 1 para evitar desbordamientos */}
      <View style={[barStyles.track, { backgroundColor: colors.border || 'rgba(0,0,0,0.06)' }]}>
        <View style={[barStyles.fill, { width: `${percentage}%`, backgroundColor: colors.primary }]} />
      </View>
      <Text style={[barStyles.text, { color: colors.secondaryText }]}>
        {percentage.toFixed(0)}%
      </Text>
    </View>
  );
};

export const ContinueReadingCard: React.FC<ContinueReadingCardProps> = ({ book, colors, onPress }) => {
  return (
   <View style={styles.sectionContainer}>
      {/* Título de la sección alineado con el nuevo margen de la tarjeta */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Continuar leyendo
        </Text>
      </View>

      <TouchableOpacity 
        style={[styles.continueCard, { backgroundColor: colors.background }]} 
        onPress={onPress}
        activeOpacity={0.85}
      >
        {book.cover ? (
          <Image source={{ uri: book.cover }} style={styles.continueCover} />
        ) : (
          <View style={[styles.continueCover, { backgroundColor: colors.border || '#E0E0E0', justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="book-outline" size={32} color={colors.secondaryText} />
          </View>
        )}
        
        <View style={styles.continueDetails}>
          <Text style={[styles.continueTitle, { color: colors.text }]} numberOfLines={2}>
            {book.title}
          </Text>
          
          <Text style={[styles.continueAuthor, { color: colors.secondaryText }]} numberOfLines={1}>
            {book.author}
          </Text>
          
          <BookProgressBar progress={book.progress} colors={colors} />
          
          {book.currentChapter !== undefined && (
            <Text style={[styles.continueChapter, { color: colors.secondaryText }]} numberOfLines={1}>
              Capítulo {book.currentChapter}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    width: '100%',
    marginVertical: 4,
  },
  sectionHeader: {
    paddingHorizontal: 6, // Alineado exactamente con el margen de la tarjeta (6)
    marginBottom: 8,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  continueCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 14,          
    marginHorizontal: 0, 
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  continueCover: {
    width: 85,            
    height: 125,          
    borderRadius: 10,
    resizeMode: 'cover',
  },
  continueDetails: {
    flex: 1, 
    marginLeft: 16,       
    justifyContent: 'center',
  },
  continueTitle: {
    fontSize: 18,         
    fontWeight: 'bold',
    marginBottom: 4,
  },
  continueAuthor: {
    fontSize: 15,         
    marginBottom: 4,
  },
  continueChapter: {
    fontSize: 13,         
    marginTop: 4,
    fontWeight: '600',
  },
});

const barStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 6,
  },
  track: {
    flex: 1, 
    height: 8,            
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  text: {
    fontSize: 13,         
    fontWeight: '700',
    minWidth: 36,
    textAlign: 'right',
  },
});