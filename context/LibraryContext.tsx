import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storage, fileHandler, Book } from '../utils/storage';

interface LibraryContextType {
  books: Book[];
  loading: boolean;
  refreshBooks: () => Promise<void>;
  addBook: (book: Book) => Promise<void>;
  updateBook: (id: string, updates: Partial<Book>) => Promise<void>;
  deleteBook: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  updateProgress: (id: string, progress: number, chapter: number, cfi?: string) => Promise<void>;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBooks();
  }, []);

  async function loadBooks() {
    try {
      await fileHandler.init();
      const loadedBooks = await storage.getBooks();
      setBooks(loadedBooks);
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setLoading(false);
    }
  }

  async function refreshBooks() {
    await loadBooks();
  }

  async function addBook(book: Book) {
    await storage.addBook(book);
    await loadBooks();
  }

  async function updateBook(id: string, updates: Partial<Book>) {
    await storage.updateBook(id, updates);
    await loadBooks();
  }

  async function deleteBook(id: string) {
    const book = books.find(b => b.id === id);
    if (book) {
      await fileHandler.deleteBookFile(book.filePath);
    }
    await storage.deleteBook(id);
    await loadBooks();
  }

  async function toggleFavorite(id: string) {
    await storage.toggleFavorite(id);
    await loadBooks();
  }

  async function updateProgress(id: string, progress: number, chapter: number, cfi?: string) {
    await storage.updateProgress(id, progress, chapter, cfi);
    await loadBooks();
  }

  return (
    <LibraryContext.Provider value={{
      books,
      loading,
      refreshBooks,
      addBook,
      updateBook,
      deleteBook,
      toggleFavorite,
      updateProgress,
    }}>
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (context === undefined) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
}
