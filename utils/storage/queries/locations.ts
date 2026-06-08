import { getDBConnection } from '../db';
import { BookCache, BookLocationRow, TocItem } from '../types';

/**
 * Guarda o actualiza la caché pesada de un libro (ubicaciones CFI y árbol de capítulos TOC).
 * Usa una operación UPSERT (INSERT ON CONFLICT) para actualizar si ya existía.
 */
export const saveBookCache = async (
  bookId: number, 
  cfiArray: string[], 
  tocTree: TocItem[]
): Promise<void> => {
  const db = await getDBConnection();
  const cfiCacheJson = JSON.stringify(cfiArray);
  const tocCacheJson = JSON.stringify(tocTree);

  await db.runAsync(
    `INSERT INTO book_locations (book_id, cfi_index_cache, toc_cache, updated_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(book_id) DO UPDATE SET
       cfi_index_cache = excluded.cfi_index_cache,
       toc_cache = excluded.toc_cache,
       updated_at = datetime('now');`,
    [bookId, cfiCacheJson, tocCacheJson]
  );
};

/**
 * Recupera la caché completa de un libro (CFIs y TOC) parseada de vuelta a sus tipos nativos.
 * Retorna null si el libro aún no ha generado caché.
 */
export const getBookCache = async (bookId: number): Promise<BookCache | null> => {
  const db = await getDBConnection();

  const row = await db.getFirstAsync<BookLocationRow>(
    'SELECT * FROM book_locations WHERE book_id = ?;',
    [bookId]
  );

  if (!row) return null;

  try {
    return {
      bookId: row.book_id,
      cfiIndexCache: JSON.parse(row.cfi_index_cache) as string[],
      tocCache: JSON.parse(row.toc_cache) as TocItem[],
      updatedAt: new Date(row.updated_at)
    };
  } catch (error) {
    console.error(`Error al parsear la caché del libro con ID ${bookId}:`, error);
    return null;
  }
};