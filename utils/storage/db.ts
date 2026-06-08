import * as SQLite from 'expo-sqlite';
import { createSchema } from './schema';

const DB_NAME = 'library.db';
let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Abre, configura y devuelve la instancia de la base de datos SQLite.
 * Si ya existe una conexión abierta, la reutiliza.
 */
export const getDBConnection = async (): Promise<SQLite.SQLiteDatabase> => {
  if (dbInstance) {
    return dbInstance;
  }

  // 1. Abre el archivo físico de la base de datos de manera asíncrona
  const db = await SQLite.openDatabaseAsync(DB_NAME);

  // 2. Configura los interruptores internos de SQLite
  // - foreign_keys: Permite que al borrar un libro se eliminen sus notas automáticamente.
  // - journal_mode = WAL: Optimiza la lectura y escritura simultánea en dispositivos móviles.
  // - synchronous = NORMAL: Acelera drásticamente los guardados en disco de forma segura.
  await db.execAsync(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
  `);

  // 3. Ejecuta la creación de las tablas e índices
  await createSchema(db);

  dbInstance = db;
  return dbInstance;
};