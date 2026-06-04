import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

export interface Book {
  id: string;
  title: string;
  author: string;
  cover?: string;
  filePath: string;
  importDate: string;
  progress: number;
  currentChapter: number;
  isFavorite: boolean;
  totalChapters: number;
  currentCfi?: string;
}

const BOOKS_KEY = '@biblioo_books';

export const storage = {
  async getBooks(): Promise<Book[]> {
    try {
      const data = await AsyncStorage.getItem(BOOKS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting books:', error);
      return [];
    }
  },

  async saveBooks(books: Book[]): Promise<void> {
    try {
      await AsyncStorage.setItem(BOOKS_KEY, JSON.stringify(books));
    } catch (error) {
      console.error('Error saving books:', error);
      throw error;
    }
  },

  async addBook(book: Book): Promise<void> {
    const books = await this.getBooks();
    books.push(book);
    await this.saveBooks(books);
  },

  async updateBook(id: string, updates: Partial<Book>): Promise<void> {
    const books = await this.getBooks();
    const index = books.findIndex(b => b.id === id);
    if (index !== -1) {
      books[index] = { ...books[index], ...updates };
      await this.saveBooks(books);
    }
  },

  async deleteBook(id: string): Promise<void> {
    const books = await this.getBooks();
    const filtered = books.filter(b => b.id !== id);
    await this.saveBooks(filtered);
  },

  async getBook(id: string): Promise<Book | null> {
    const books = await this.getBooks();
    return books.find(b => b.id === id) || null;
  },

  async toggleFavorite(id: string): Promise<void> {
    const books = await this.getBooks();
    const book = books.find(b => b.id === id);
    if (book) {
      book.isFavorite = !book.isFavorite;
      await this.saveBooks(books);
    }
  },

  async updateProgress(id: string, progress: number, chapter: number, cfi?: string): Promise<void> {
    await this.updateBook(id, { progress, currentChapter: chapter, currentCfi: cfi });
  },
};

export const fileHandler = {
  booksDir: `${FileSystem.documentDirectory}books/`,

  async init(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.booksDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.booksDir, { intermediates: true });
      }
    } catch (error) {
      console.error('Error initializing books directory:', error);
    }
  },

  async saveBook(uri: string, filename: string): Promise<string> {
    const newPath = `${this.booksDir}${filename}`;
    
    try {
      const existingInfo = await FileSystem.getInfoAsync(newPath);
      if (existingInfo.exists) {
        await FileSystem.deleteAsync(newPath);
      }
      
      await FileSystem.copyAsync({
        from: uri,
        to: newPath,
      });
      
      return newPath;
    } catch (error) {
      console.error('Error saving book:', error);
      throw error;
    }
  },

  async deleteBookFile(filePath: string): Promise<void> {
    try {
      const info = await FileSystem.getInfoAsync(filePath);
      if (info.exists) {
        await FileSystem.deleteAsync(filePath);
      }
    } catch (error) {
      console.error('Error deleting book file:', error);
    }
  },

  async readBookContent(filePath: string): Promise<string | null> {
    try {
      const content = await FileSystem.readAsStringAsync(filePath);
      return content;
    } catch (error) {
      console.error('Error reading book content:', error);
      return null;
    }
  },
};
