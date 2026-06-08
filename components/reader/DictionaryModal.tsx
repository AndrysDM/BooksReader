import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import styles from './reader.styles'; // Importación directa de la hoja central

interface DictionaryModalProps {
  isVisible: boolean;
  onClose: () => void;
  selectedText: string;
  translation: string;
}

export default function DictionaryModal({
  isVisible,
  onClose,
  selectedText,
  translation,
}: DictionaryModalProps) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* El overlay es cliqueable para cerrar el modal al tocar fuera */}
      <TouchableOpacity
        style={styles.dictionaryOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.dictionaryContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
          
          {/* Header del Diccionario */}
          <View style={styles.dictionaryHeader}>
            <Text style={[styles.dictionaryWord, { color: colors.text }]} numberOfLines={1}>
              <Ionicons name="search" size={20} color={colors.text} /> {selectedText}
            </Text>
            
            <TouchableOpacity
              style={styles.closeDictionaryButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color={colors.secondaryText} />
            </TouchableOpacity>
          </View>

          {/* Cuerpo con el Significado/Traducción */}
          <Text style={[styles.dictionaryTranslation, { color: colors.text }]}>
            {translation}
          </Text>
          
        </View>
      </TouchableOpacity>
    </Modal>
  );
}