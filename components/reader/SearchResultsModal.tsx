import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, FlatList, Modal, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { SearchResult } from './EpubViewer'; // Asegúrate de que la ruta apunte a donde tienes la interfaz

interface SearchResultsModalProps {
  isVisible: boolean;
  onClose: () => void;
  searchQuery: string;
  isSearching: boolean;
  searchResults: SearchResult[];
  onSelectResult: (cfi: string) => void;
}

export default function SearchResultsModal({
  isVisible,
  onClose,
  searchQuery,
  isSearching,
  searchResults,
  onSelectResult,
}: SearchResultsModalProps) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <View style={{
          height: '65%',
          backgroundColor: colors.card,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          paddingTop: 8
        }}>
          
          {/* Barra superior del modal para cerrar */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingBottom: 8,
            borderBottomWidth: 0.5,
            borderBottomColor: colors.border
          }}>
            <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 16 }}>
              Resultados para {searchQuery}
            </Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Estado de Carga */}
          {isSearching ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.primary || colors.text} />
              <Text style={{ color: colors.secondaryText, marginTop: 12 }}>Buscando en las páginas...</Text>
            </View>
          ) : searchResults.length === 0 ? (
            /* Estado Vacío */
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
              <Ionicons name="search-outline" size={48} color={colors.secondaryText} style={{ marginBottom: 8 }} />
              <Text style={{ color: colors.text, textAlign: 'center', fontSize: 16 }}>
                No se encontraron coincidencias
              </Text>
              <Text style={{ color: colors.secondaryText, textAlign: 'center', marginTop: 4 }}>
                Prueba con otra palabra o verifica la ortografía.
              </Text>
            </View>
          ) : (
            /* Lista de Resultados */
            <FlatList
              data={searchResults}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={{ paddingBottom: 24 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => onSelectResult(item.cfi)}
                  style={{
                    padding: 16,
                    borderBottomWidth: 0.5,
                    borderBottomColor: colors.border
                  }}
                >
                  <Text style={{ fontWeight: 'bold', fontSize: 12, color: colors.primary || '#2196F3', marginBottom: 4 }}>
                    {item.chapterTitle}
                  </Text>
                  <Text style={{ color: colors.text, fontSize: 14, lineHeight: 20 }}>
                    {item.excerpt.trim()}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}