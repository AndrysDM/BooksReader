import AsyncStorage from '@react-native-async-storage/async-storage';

const PROGRESS_PREFIX = '@biblioo_progress_';

export interface ReadingProgress {
  chapter: number;
  progress: number; // percentage 0-100
  cfi?: string; // EPUB CFI position
  timestamp: string;
}

export const saveReadingProgress = async (bookId: string, progress: ReadingProgress) => {
  try {
    await AsyncStorage.setItem(`${PROGRESS_PREFIX}${bookId}`, JSON.stringify(progress));
  } catch (error) {
    console.error('Error saving reading progress:', error);
  }
};

export const getReadingProgress = async (bookId: string): Promise<ReadingProgress | null> => {
  try {
    const stored = await AsyncStorage.getItem(`${PROGRESS_PREFIX}${bookId}`);
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  } catch (error) {
    console.error('Error getting reading progress:', error);
    return null;
  }
};

export const deleteReadingProgress = async (bookId: string) => {
  try {
    await AsyncStorage.removeItem(`${PROGRESS_PREFIX}${bookId}`);
  } catch (error) {
    console.error('Error deleting reading progress:', error);
  }
};

export const clearAllProgress = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const progressKeys = keys.filter(key => key.startsWith(PROGRESS_PREFIX));
    await AsyncStorage.multiRemove(progressKeys);
  } catch (error) {
    console.error('Error clearing all progress:', error);
  }
};
