import {
  copyAsync,
  deleteAsync,
  documentDirectory,
  EncodingType,
  getInfoAsync,
  makeDirectoryAsync,
  readAsStringAsync,
  writeAsStringAsync
} from 'expo-file-system/legacy';

export const fileHandler = {
  booksDir: `${documentDirectory}books/`,
  coversDir: `${documentDirectory}covers/`, // Nueva carpeta para portadas físicas

  async init(): Promise<void> {
    try {
      // Inicializar directorio de libros
      const dirInfo = await getInfoAsync(this.booksDir);
      if (!dirInfo.exists) {
        await makeDirectoryAsync(this.booksDir, { intermediates: true });
      }

      // Inicializar directorio de portadas
      const coversInfo = await getInfoAsync(this.coversDir);
      if (!coversInfo.exists) {
        await makeDirectoryAsync(this.coversDir, { intermediates: true });
      }
    } catch (error) {
      console.error('Error initializing directories:', error);
    }
  },

  async saveBook(uri: string, filename: string): Promise<string> {
    const newPath = `${this.booksDir}${filename}`;
    try {
      const existingInfo = await getInfoAsync(newPath);
      if (existingInfo.exists) {
        await deleteAsync(newPath);
      }
      await copyAsync({ from: uri, to: newPath });
      return newPath;
    } catch (error) {
      console.error('Error saving book:', error);
      throw error;
    }
  },

  /**
   * Toma el String Base64 enviado por el WebView, lo escribe como un archivo de imagen real
   * y retorna la ruta del archivo local listo para SQLite.
   */
  async saveCoverImage(base64Data: string, filename: string): Promise<string> {
    const cleanFilename = filename.replace(/[^a-zA-Z0-0]/g, '_'); // Sanitizar el nombre
    const newPath = `${this.coversDir}${cleanFilename}_cover.png`;
    
    try {
      // Quitar el prefijo "data:image/png;base64," si viene incluido en el string
      const pureBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');

      const existingInfo = await getInfoAsync(newPath);
      if (existingInfo.exists) {
        await deleteAsync(newPath);
      }

      // Escribir el string binario directamente a disco como archivo
      await writeAsStringAsync(newPath, pureBase64, {
        encoding: EncodingType.Base64,
      });

      return newPath;
    } catch (error) {
      console.error('Error saving cover image:', error);
      throw error;
    }
  },

  async deleteBookFile(filePath: string): Promise<void> {
    try {
      const info = await getInfoAsync(filePath);
      if (info.exists) {
        await deleteAsync(filePath);
      }
    } catch (error) {
      console.error('Error deleting book file:', error);
    }
  },

  /**
   * Elimina también la portada física si se elimina el libro
   */
  async deleteCoverFile(coverPath: string): Promise<void> {
    try {
      if (!coverPath) return;
      const info = await getInfoAsync(coverPath);
      if (info.exists) {
        await deleteAsync(coverPath);
      }
    } catch (error) {
      console.error('Error deleting cover file:', error);
    }
  },

  async readBookContent(filePath: string): Promise<string | null> {
    try {
      const content = await readAsStringAsync(filePath);
      return content;
    } catch (error) {
      console.error('Error reading book content:', error);
      return null;
    }
  },
};