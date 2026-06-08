// ==========================================
// 1. MODELOS DE LA BASE DE DATOS (SQLite Rows)
// ==========================================

export interface BookRow {
  id: number;
  file_path: string;
  title: string;
  author: string | null;
  cover_url: string | null;
  progress: number;
  is_favorite: number;
  created_at: string;
  last_read_at: string | null;
  last_cfi: string | null;
  last_chapter_title: string | null;
}

export interface CategoryRow {
  id: number;
  name: string;
  created_at: string;
}

export interface BookCategoryRow {
  book_id: number;
  category_id: number;
}

export interface AnnotationRow {
  id: number;
  book_id: number;
  type: 'note' | 'bookmark' | 'highlight';
  cfi: string;
  text_content: string | null;
  color: string | null;
  created_at: string;
}

export interface BookLocationRow {
  book_id: number;
  cfi_index_cache: string;     // JSON stringificado del array de CFIs
  toc_cache: string;           // JSON stringificado del árbol de navegación (TOC)
  updated_at: string;
}

// ==========================================
// 2. MODELOS DE LA APLICACIÓN (TypeScript Dominios)
// ==========================================

export interface TocItem {
  label: string;
  href: string;
  subitems?: TocItem[];        // Estructura recursiva para subcapítulos
}

export interface Book {
  id: number;
  filePath: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  progress: number;
  isFavorite: boolean;
  createdAt: Date;
  lastReadAt: Date | null;
  lastCfi: string | null;
  lastChapterTitle: string | null;
}

export interface Category {
  id: number;
  name: string;
  createdAt: Date;
}

export interface Annotation {
  id: number;
  bookId: number;
  type: 'note' | 'bookmark' | 'highlight';
  cfi: string;
  textContent: string | null;
  color: string | null;
  createdAt: Date;
}

export interface BookCache {
  bookId: number;
  cfiIndexCache: string[];
  tocCache: TocItem[];
  updatedAt: Date;
}