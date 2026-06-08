import { SQLiteDatabase } from 'expo-sqlite';

export const createSchema = async (db: SQLiteDatabase): Promise<void> => {
  // 1. Tabla de Libros (Metadatos generales y estado dinámico de lectura)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_path TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      author TEXT,
      cover_url TEXT,
      progress REAL DEFAULT 0.0,
      is_favorite INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      last_read_at TEXT,
      last_cfi TEXT,
      last_chapter_title TEXT
    );
  `);

  // 2. Tabla de Categorías (Creadas por el usuario)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // 3. Tabla Intermedia: Relación Muchos a Muchos entre Libros y Categorías
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS book_categories (
      book_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      PRIMARY KEY (book_id, category_id),
      FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
    );
  `);

  // 4. Tabla Unificada de Anotaciones (Notas, marcadores y subrayados)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS annotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL,
      type TEXT CHECK(type IN ('note', 'bookmark', 'highlight')) NOT NULL,
      cfi TEXT NOT NULL,
      text_content TEXT,
      color TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE
    );
  `);

  // 5. Tabla de Almacenamiento Pesado (Caché de CFIs y Árbol de Navegación)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS book_locations (
      book_id INTEGER PRIMARY KEY,
      cfi_index_cache TEXT NOT NULL,
      toc_cache TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE
    );
  `);

  // 6. Índices de Optimización para consultas rápidas
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_annotations_book_id ON annotations(book_id);
    CREATE INDEX IF NOT EXISTS idx_locations_book_id ON book_locations(book_id);
    CREATE INDEX IF NOT EXISTS idx_book_categories_cat_id ON book_categories(category_id);
  `);
};