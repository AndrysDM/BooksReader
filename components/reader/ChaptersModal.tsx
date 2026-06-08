import React from 'react';
import { FlatList, Modal, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import styles from './reader.styles'; // Importación directa de la hoja central

interface ChapterItem {
  title: string;
  href: string;
  level: number;
}

interface ChaptersModalProps {
  isVisible: boolean;
  onClose: () => void;
  chapters: ChapterItem[];
  onSelectChapter: (href: string) => void;
}

export default function ChaptersModal({
  isVisible,
  onClose,
  chapters,
  onSelectChapter,
}: ChaptersModalProps) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card, maxHeight: '80%' }]}>
          
          {/* Header del Modal */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Capítulos</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Text style={{ color: colors.text, fontSize: 24 }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Lista de Capítulos */}
          <FlatList
            data={chapters}
            keyExtractor={(item, index) => `${item.href}-${index}`}
            renderItem={({ item }) => {
              // Definimos una sangría dinámica según el nivel de anidación
              const indentation = (item.level || 0) * 20;

              return (
                <TouchableOpacity
                  style={[
                    styles.chapterItem,
                    {
                      borderBottomColor: colors.border,
                      paddingLeft: 16 + indentation // Aplica el espacio a la izquierda
                    }
                  ]}
                  onPress={() => onSelectChapter(item.href)}
                >
                  <Text
                    style={[
                      item.level > 0 ? styles.subChapterLabel : styles.chapterLabel,
                      { color: item.level > 0 ? colors.secondaryText : colors.text }
                    ]}
                  >
                    {item.title}
                  </Text>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <Text style={[styles.emptyChaptersText, { color: colors.secondaryText }]}>
                No se encontraron capítulos o el libro se está cargando.
              </Text>
            }
          />
        </View>
      </View>
    </Modal>
  );
}