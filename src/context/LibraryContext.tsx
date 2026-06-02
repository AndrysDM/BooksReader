import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  lastRead?: string;
}

interface LibraryContextType {
  books: Book[];
  addBook: (book: Omit<Book, 'id' | 'progress' | 'currentChapter' | 'isFavorite'>) => void;
  updateBookProgress: (id: string, progress: number, currentChapter: number) => void;
  toggleFavorite: (id: string) => void;
  deleteBook: (id: string) => void;
  getBookById: (id: string) => Book | undefined;
  favoriteBooks: Book[];
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

const STORAGE_KEY = '@biblioo_books';

export const LibraryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setBooks(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading books:', error);
    }
  };

  const saveBooks = async (booksToSave: Book[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(booksToSave));
    } catch (error) {
      console.error('Error saving books:', error);
    }
  };

  const addBook = (bookData: Omit<Book, 'id' | 'progress' | 'currentChapter' | 'isFavorite'>) => {
    const newBook: Book = {
      ...bookData,
      id: Date.now().toString(),
      progress: 0,
      currentChapter: 0,
      isFavorite: false,
    };
    setBooks(prev => {
      const updated = [...prev, newBook];
      saveBooks(updated);
      return updated;
    });
  };

  const updateBookProgress = (id: string, progress: number, currentChapter: number) => {
    setBooks(prev => {
      const updated = prev.map(book =>
        book.id === id
          ? { ...book, progress, currentChapter, lastRead: new Date().toISOString() }
          : book
      );
      saveBooks(updated);
      return updated;
    });
  };

  const toggleFavorite = (id: string) => {
    setBooks(prev => {
      const updated = prev.map(book =>
        book.id === id ? { ...book, isFavorite: !book.isFavorite } : book
      );
      saveBooks(updated);
      return updated;
    });
  };

  const deleteBook = (id: string) => {
    setBooks(prev => {
      const updated = prev.filter(book => book.id !== id);
      saveBooks(updated);
      return updated;
    });
  };

  const getBookById = (id: string) => books.find(book => book.id === id);

  const favoriteBooks = books.filter(book => book.isFavorite);

  return (
    <LibraryContext.Provider
      value={{
        books,
        addBook,
        updateBookProgress,
        toggleFavorite,
        deleteBook,
        getBookById,
        favoriteBooks,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};
