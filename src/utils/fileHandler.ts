import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Book } from '../context/LibraryContext';

const EPUBS_DIR = `${FileSystem.documentDirectory}epubs/`;

export const ensureEpubsDir = async () => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(EPUBS_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(EPUBS_DIR, { intermediates: true });
    }
  } catch (error) {
    console.error('Error creating epubs directory:', error);
  }
};

export const pickAndImportEpub = async (): Promise<Omit<Book, 'id' | 'progress' | 'currentChapter' | 'isFavorite'> | null> => {
  try {
    await ensureEpubsDir();

    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/epub+zip',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const file = result.assets[0];
    const fileName = `${Date.now()}_${file.name}`;
    const destPath = `${EPUBS_DIR}${fileName}`;

    // Copy file to our directory
    await FileSystem.copyAsync({
      from: file.uri,
      to: destPath,
    });

    // Extract metadata from filename if possible
    const nameWithoutExt = file.name.replace('.epub', '').replace('.EPUB', '');
    
    return {
      title: nameWithoutExt,
      author: 'Desconocido',
      filePath: destPath,
      importDate: new Date().toISOString(),
      cover: undefined,
    };
  } catch (error) {
    console.error('Error importing EPUB:', error);
    return null;
  }
};

export const deleteEpubFile = async (filePath: string) => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(filePath);
    }
  } catch (error) {
    console.error('Error deleting EPUB file:', error);
  }
};

export const getEpubFileInfo = async (filePath: string) => {
  try {
    const info = await FileSystem.getInfoAsync(filePath);
    return info;
  } catch (error) {
    console.error('Error getting file info:', error);
    return null;
  }
};
