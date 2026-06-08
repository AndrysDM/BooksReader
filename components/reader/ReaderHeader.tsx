import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import styles from './reader.styles';


interface ReaderHeaderProps {
  bookTitle: string;
  bookAuthor: string;
  isSearchingText: boolean;
  setIsSearchingText: (val: boolean) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  setSearchResults: (results: any[]) => void;
  handleSearchText: () => void;
  onBack: () => void;
  onShowSettings: () => void;
}

export default function ReaderHeader({
  bookTitle,
  bookAuthor,
  isSearchingText,
  setIsSearchingText,
  searchQuery,
  setSearchQuery,
  setSearchResults,
  handleSearchText,
  onBack,
  onShowSettings,
}: ReaderHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      {isSearchingText ? (
        /* --- MODO: ESCRIBIENDO BÚSQUEDA --- */
        <View style={{ flexDirection: 'row', flex: 1, alignItems: 'center', paddingRight: 8 }}>
          <TouchableOpacity
            onPress={() => {
              setIsSearchingText(false);
              setSearchQuery('');
              setSearchResults([]);
            }}
            style={styles.headerButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <TextInput
            placeholder="Buscar texto en el libro..."
            placeholderTextColor={colors.secondaryText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchText}
            autoFocus
            style={{
              flex: 1,
              color: colors.text,
              fontSize: 16,
              paddingVertical: 4,
              paddingHorizontal: 8,
            }}
          />

          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4, marginRight: 8 }}>
              <Ionicons name="close-circle" size={20} color={colors.secondaryText} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleSearchText}
            disabled={searchQuery.trim().length < 3}
            style={[styles.headerButton, { opacity: searchQuery.trim().length < 3 ? 0.4 : 1 }]}
          >
            <Ionicons name="checkmark" size={24} color={colors.primary || colors.text} />
          </TouchableOpacity>
        </View>
      ) : (
        /* --- MODO: VISTA NORMAL DEL HEADER --- */
        <>
          <View style={styles.headerLeftContainer}>
            <TouchableOpacity onPress={onBack} style={styles.headerButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                {bookTitle}
              </Text>
              <Text style={[styles.headerAutor, { color: colors.secondaryText }]} numberOfLines={1}>
                {bookAuthor}
              </Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => setIsSearchingText(true)} style={styles.headerButton}>
              <Ionicons name="search" size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { }} style={styles.headerButton}>
              <Ionicons name="bookmark-outline" size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onShowSettings} style={styles.headerButton}>
              <Ionicons name="ellipsis-vertical-sharp" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}