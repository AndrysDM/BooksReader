import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useLibrary } from '../../context/LibraryContext';
import { useTheme } from '../../context/ThemeContext';
import { Annotation } from '../../utils/storage/types';

interface BookmarksModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectBookmark: (cfi: string) => void;
  bookId: number;
}

export default function BookmarksModal({
  isVisible,
  onClose,
  onSelectBookmark,
  bookId,
}: BookmarksModalProps) {
  const { colors } = useTheme();
  const { currentAnnotations, removeBookmark } = useLibrary();

  // Filtramos para renderizar únicamente las anotaciones tipo marcadores (bookmarks)
  const bookmarks = currentAnnotations.filter(
    (annot) => annot.bookId === bookId && annot.type === 'bookmark'
  );

  const handleDelete = async (cfi: string) => {
    await removeBookmark(bookId, cfi);
  };

  const renderItem = ({ item }: { item: Annotation }) => (
    <View style={[styles.bookmarkItem, { borderBottomColor: colors.border }]}>
      <TouchableOpacity
        style={styles.textContainer}
        onPress={() => onSelectBookmark(item.cfi)}
      >
        <Ionicons
          name="bookmark"
          size={18}
          color={colors.primary}
          style={styles.iconMargin}
        />
        <Text
          style={[styles.bookmarkText, { color: colors.text }]}
          numberOfLines={2}
        >
          {item.textContent || 'Marcador sin descripción'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => handleDelete(item.cfi)}
        style={styles.deleteButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="trash-outline" size={20} color={colors.accent} />
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        {/* Fondo translúcido que cierra al tocar */}
        <TouchableOpacity style={styles.dismissArea} onPress={onClose} />

        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          {/* Header del Modal */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Marcadores ({bookmarks.length})
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Cuerpo / Lista */}
          {bookmarks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="bookmark-outline"
                size={48}
                color={colors.secondaryText}
              />
              <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
                No tienes marcadores guardados en este libro.
              </Text>
            </View>
          ) : (
            <FlatList
              data={bookmarks}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  dismissArea: {
    flex: 1,
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: '60%', // Ocupa más de la mitad inferior de la pantalla
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  listContainer: {
    paddingBottom: 24,
  },
  bookmarkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },
  iconMargin: {
    marginRight: 10,
  },
  bookmarkText: {
    fontSize: 15,
    lineHeight: 20,
    flex: 1,
  },
  deleteButton: {
    padding: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 15,
    marginTop: 12,
    lineHeight: 22,
  },
});