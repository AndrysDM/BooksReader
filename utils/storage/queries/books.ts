import { getDBConnection } from '../db';
import { Book, BookRow } from '../types';

/**
 * Mapea una fila de la base de datos (BookRow) al modelo nativo de TypeScript (Book).
 */
const mapBookRowToBook = (row: BookRow): Book => ({
  id: row.id,
  filePath: row.file_path,
  title: row.title,
  author: row.author,
  coverUrl: row.cover_url,
  progress: row.progress,
  isFavorite: row.is_favorite === 1,
  createdAt: new Date(row.created_at),
  lastReadAt: row.last_read_at ? new Date(row.last_read_at) : null,
  lastCfi: row.last_cfi,
  lastChapterTitle: row.last_chapter_title,
});

/**
 * Obtiene todos los libros guardados en la biblioteca, ordenados por los leídos recientemente.
 */
export const getBooks = async (): Promise<Book[]> => {
  const db = await getDBConnection();
  const rows = await db.getAllAsync<BookRow>(
    'SELECT * FROM books ORDER BY CASE WHEN last_read_at IS NULL THEN 1 ELSE 0 END, last_read_at DESC, created_at DESC;'
  );
  return rows.map(mapBookRowToBook);
};

/**
 * Obtiene un único libro por su ID. Retorna null si no existe.
 */
export const getBook = async (id: number): Promise<Book | null> => {
  const db = await getDBConnection();
  const row = await db.getFirstAsync<BookRow>('SELECT * FROM books WHERE id = ?;', [id]);
  return row ? mapBookRowToBook(row) : null;
};

/**
 * Inserta un nuevo libro en la base de datos.
 * @returns El ID asignado automáticamente por SQLite.
 */
export const addBook = async (book: Omit<Book, 'id' | 'createdAt' | 'lastReadAt' | 'lastCfi' | 'lastChapterTitle' | 'progress' | 'isFavorite'>): Promise<number> => {
  const db = await getDBConnection();
  const result = await db.runAsync(
    `INSERT INTO books (file_path, title, author, cover_url) VALUES (?, ?, ?, ?);`,
    [book.filePath, book.title, book.author, book.coverUrl]
  );
  return result.lastInsertRowId;
};

/**
 * Elimina un libro de la base de datos por su ID.
 * Nota: Debido a PRAGMA foreign_keys = ON y ON DELETE CASCADE, esto borrará automáticamente sus anotaciones y caché.
 */
export const deleteBook = async (id: number): Promise<void> => {
  const db = await getDBConnection();
  await db.runAsync('DELETE FROM books WHERE id = ?;', [id]);
};

/**
 * Alterna el estado de favorito de un libro (isFavorite).
 */
export const toggleFavorite = async (id: number): Promise<void> => {
  const db = await getDBConnection();
  await db.runAsync(
    `UPDATE books SET is_favorite = NOT is_favorite WHERE id = ?;`,
    [id]
  );
};

/**
 * Actualiza el progreso actual de la lectura. Se ejecuta periódicamente en caliente mientras el usuario lee.
 */
export const updateProgress = async (
  id: number,
  progress: number,
  lastCfi: string,
  lastChapterTitle: string
): Promise<void> => {
  const db = await getDBConnection();
  await db.runAsync(
    `UPDATE books 
     SET progress = ?, last_cfi = ?, last_chapter_title = ?, last_read_at = datetime('now') 
     WHERE id = ?;`,
    [progress, lastCfi, lastChapterTitle, id]
  );
};