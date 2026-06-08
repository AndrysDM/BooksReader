import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { fileHandler } from '../utils/storage';
import * as annotQueries from '../utils/storage/queries/annotations';
import * as bookQueries from '../utils/storage/queries/books';
import { Annotation, Book } from '../utils/storage/types';

interface LibraryContextType {
  books: Book[];
  loading: boolean;
  refreshBooks: () => Promise<void>;
  addBook: (book: Omit<Book, 'id' | 'createdAt' | 'lastReadAt' | 'lastCfi' | 'lastChapterTitle' | 'progress' | 'isFavorite'>) => Promise<number>;
  deleteBook: (id: number) => Promise<void>;
  toggleFavorite: (id: number) => Promise<void>;
  updateProgress: (id: number, progress: number, lastCfi: string, lastChapterTitle: string) => Promise<void>;
  
  // ==========================================
  // ESTADOS Y ACCIONES PARA ANOTACIONES
  // ==========================================
  currentAnnotations: Annotation[];
  loadAnnotations: (bookId: number) => Promise<void>;
  addAnnotation: (annotation: Omit<Annotation, 'id' | 'createdAt'>) => Promise<Annotation>;
  removeAnnotation: (id: number) => Promise<void>;
  removeBookmark: (bookId: number, cfi: string) => Promise<void>;
  modifyAnnotation: (id: number, updates: { textContent?: string | null; color?: string | null }) => Promise<void>;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado en caliente para las anotaciones del libro actual en el lector
  const [currentAnnotations, setCurrentAnnotations] = useState<Annotation[]>([]);

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

  // ==========================================
  // IMPLEMENTACIÓN DE MÉTODOS DE ANOTACIONES
  // ==========================================

  /**
   * Carga todas las anotaciones de un libro en memoria. 
   * Ejecútala en el useEffect de inicialización de tu ReaderScreen.
   */
  async function loadAnnotations(bookId: number) {
    try {
      const annot = await annotQueries.getAnnotationsByBook(bookId);
      setCurrentAnnotations(annot);
    } catch (error) {
      console.error(`Error cargando anotaciones del libro ${bookId}:`, error);
    }
  }

  /**
   * Crea una nota, marcador o subrayado e impacta el estado de forma síncrona.
   */
  async function addAnnotation(annotation: Omit<Annotation, 'id' | 'createdAt'>): Promise<Annotation> {
    const created = await annotQueries.createAnnotation(annotation);
    setCurrentAnnotations(prev => [...prev, created]);
    return created;
  }

  /**
   * Elimina cualquier anotación basándose en su ID físico de SQLite.
   */
  async function removeAnnotation(id: number) {
    await annotQueries.deleteAnnotation(id);
    setCurrentAnnotations(prev => prev.filter(a => a.id !== id));
  }

  /**
   * Elimina un marcador directamente por su CFI. Perfecta para el toggle del ReaderHeader.
   */
  async function removeBookmark(bookId: number, cfi: string) {
    await annotQueries.deleteBookmarkByCfi(bookId, cfi);
    setCurrentAnnotations(prev => prev.filter(a => !(a.cfi === cfi && a.type === 'bookmark')));
  }

  /**
   * Modifica el cuerpo de texto de una nota o cambia el color de un highlight.
   */
  async function modifyAnnotation(id: number, updates: { textContent?: string | null; color?: string | null }) {
    await annotQueries.updateAnnotation(id, updates);
    setCurrentAnnotations(prev => 
      prev.map(a => (a.id === id ? { ...a, ...updates } : a))
    );
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
      
      // Pasar valores de anotaciones al provider
      currentAnnotations,
      loadAnnotations,
      addAnnotation,
      removeAnnotation,
      removeBookmark,
      modifyAnnotation,
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