import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { fileHandler } from '../utils/storage';
import * as bookQueries from '../utils/storage/queries/books';
import { Book } from '../utils/storage/types';

interface LibraryContextType {
  books: Book[];
  loading: boolean;
  refreshBooks: () => Promise<void>;
  addBook: (book: Omit<Book, 'id' | 'createdAt' | 'lastReadAt' | 'lastCfi' | 'lastChapterTitle' | 'progress' | 'isFavorite'>) => Promise<number>;
  deleteBook: (id: number) => Promise<void>;
  toggleFavorite: (id: number) => Promise<void>;
  updateProgress: (id: number, progress: number, lastCfi: string, lastChapterTitle: string) => Promise<void>;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAndLoad() {
      try {
        await fileHandler.init(); // Inicializa el directorio físico de ePubs
        const loadedBooks = await bookQueries.getBooks();
        setBooks(loadedBooks);
      } catch (error) {
        console.error('Error inicializando la biblioteca:', error);
      } finally {
        setLoading(false);
      }
    }

    initAndLoad();
  }, []); 

  async function loadBooks() {
    try {
      const loadedBooks = await bookQueries.getBooks();
      setBooks(loadedBooks);
    } catch (error) {
      console.error('Error cargando libros desde SQLite:', error);
    } finally {
      setLoading(false);
    }
  }

  async function refreshBooks() {
    await loadBooks();
  }

  async function addBook(book: Omit<Book, 'id' | 'createdAt' | 'lastReadAt' | 'lastCfi' | 'lastChapterTitle' | 'progress' | 'isFavorite'>): Promise<number> {
    const insertedId = await bookQueries.addBook(book);
    await loadBooks();
    return insertedId;
  }

  async function deleteBook(id: number) {
    const book = books.find(b => b.id === id);
    if (book) {
      await fileHandler.deleteBookFile(book.filePath);
    }
    await bookQueries.deleteBook(id);
    await loadBooks();
  }

  async function toggleFavorite(id: number) {
    await bookQueries.toggleFavorite(id);
    await loadBooks();
  }

  async function updateProgress(id: number, progress: number, lastCfi: string, lastChapterTitle: string) {
    await bookQueries.updateProgress(id, progress, lastCfi, lastChapterTitle);
    await loadBooks();
  }

  return (
    <LibraryContext.Provider value={{
      books,
      loading,
      refreshBooks,
      addBook,
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