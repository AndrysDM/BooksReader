import { getDBConnection } from '../db';
import { Annotation, AnnotationRow } from '../types';

// ============================================================================
// AUXILIAR: Mapeador de Base de Datos (Row) a Dominio de la App (TypeScript)
// ============================================================================
const mapRowToAnnotation = (row: AnnotationRow): Annotation => ({
  id: row.id,
  bookId: row.book_id,
  type: row.type,
  cfi: row.cfi,
  textContent: row.text_content,
  color: row.color,
  createdAt: new Date(row.created_at), // Convierte el string ISO de SQLite a objeto Date
});

// ============================================================================
// QUERIES / OPERACIONES
// ============================================================================

/**
 * Inserta una nueva anotación (nota, marcador o subrayado) en la base de datos.
 * @returns La anotación recién creada con su ID autogenerado.
 */
export const createAnnotation = async (
  annotation: Omit<Annotation, 'id' | 'createdAt'>
): Promise<Annotation> => {
  const db = await getDBConnection();
  
  const query = `
    INSERT INTO annotations (book_id, type, cfi, text_content, color)
    VALUES (?, ?, ?, ?, ?);
  `;

  const result = await db.runAsync(
    query,
    annotation.bookId,
    annotation.type,
    annotation.cfi,
    annotation.textContent,
    annotation.color
  );

  // Recuperamos la fila recién insertada para devolverla mapeada con su fecha por defecto
  const lastInsertedRow = await db.getFirstAsync<AnnotationRow>(
    'SELECT * FROM annotations WHERE id = ?;',
    result.lastInsertRowId
  );

  if (!lastInsertedRow) {
    throw new Error('❌ Error al recuperar la anotación recién creada.');
  }

  return mapRowToAnnotation(lastInsertedRow);
};

/**
 * Obtiene todas las anotaciones asociadas a un libro específico.
 * Las ordena cronológicamente (de las más antiguas a las más recientes).
 */
export const getAnnotationsByBook = async (bookId: number): Promise<Annotation[]> => {
  const db = await getDBConnection();
  
  const query = `
    SELECT * FROM annotations 
    WHERE book_id = ? 
    ORDER BY datetime(created_at) ASC;
  `;

  const rows = await db.getAllAsync<AnnotationRow>(query, bookId);
  return rows.map(mapRowToAnnotation);
};

/**
 * Obtiene las anotaciones filtradas por tipo para un libro específico.
 * Útil para pestañas separadas de "Notas", "Marcadores" o "Subrayados".
 */
export const getAnnotationsByType = async (
  bookId: number,
  type: 'note' | 'bookmark' | 'highlight'
): Promise<Annotation[]> => {
  const db = await getDBConnection();
  
  const query = `
    SELECT * FROM annotations 
    WHERE book_id = ? AND type = ?
    ORDER BY datetime(created_at) DESC;
  `;

  const rows = await db.getAllAsync<AnnotationRow>(query, bookId, type);
  return rows.map(mapRowToAnnotation);
};

/**
 * Actualiza el contenido de texto o el color de una anotación existente.
 */
export const updateAnnotation = async (
  id: number,
  updates: { textContent?: string | null; color?: string | null }
): Promise<void> => {
  const db = await getDBConnection();
  
  // Construcción dinámica simple para no machacar datos existentes si solo se pasa un campo
  const fields: string[] = [];
  const params: any[] = [];

  if (updates.textContent !== undefined) {
    fields.push('text_content = ?');
    params.push(updates.textContent);
  }
  if (updates.color !== undefined) {
    fields.push('color = ?');
    params.push(updates.color);
  }

  if (fields.length === 0) return;

  const query = `UPDATE annotations SET ${fields.join(', ')} WHERE id = ?;`;
  params.push(id);

  await db.runAsync(query, ...params);
};

/**
 * Elimina una anotación por su ID único.
 */
export const deleteAnnotation = async (id: number): Promise<void> => {
  const db = await getDBConnection();
  await db.runAsync('DELETE FROM annotations WHERE id = ?;', id);
};

/**
 * Verifica si ya existe un marcador ('bookmark') en una posición CFI específica de un libro.
 * Útil para pintar el ícono de la cinta relleno o vacío en el ReaderHeader.
 */
export const checkBookmarkExists = async (bookId: number, cfi: string): Promise<boolean> => {
  const db = await getDBConnection();
  
  const query = `
    SELECT 1 FROM annotations 
    WHERE book_id = ? AND cfi = ? AND type = 'bookmark' 
    LIMIT 1;
  `;
  
  const row = await db.getFirstAsync(query, bookId, cfi);
  return row !== null;
};

/**
 * Elimina un marcador basándose en su ubicación exacta (CFI).
 * Conveniente para cuando el usuario vuelve a tocar el botón de marcador en el Header para quitarlo.
 */
export const deleteBookmarkByCfi = async (bookId: number, cfi: string): Promise<void> => {
  const db = await getDBConnection();
  
  const query = `
    DELETE FROM annotations 
    WHERE book_id = ? AND cfi = ? AND type = 'bookmark';
  `;
  
  await db.runAsync(query, bookId, cfi);
};