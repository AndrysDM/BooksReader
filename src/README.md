# Biblioo - Lector de EPUB para React Native

Aplicación móvil para leer libros electrónicos en formato EPUB, desarrollada con React Native y Expo.

## Características

- 📚 **Biblioteca personal**: Importa y organiza tus libros EPUB
- 📖 **Lector completo**: 
  - Visualización de contenido EPUB
  - Navegación por capítulos
  - Control de tamaño de fuente
  - Tema claro/oscuro
  - Barra de progreso de lectura
- ❤️ **Favoritos**: Marca tus libros preferidos
- 💾 **Almacenamiento local**: Los libros y el progreso se guardan en el dispositivo
- 🎨 **Interfaz adaptable**: Se ajusta al tema del sistema

## Estructura del proyecto

```
/src
  /screens
    - LibraryScreen.tsx       # Pantalla principal con lista de libros
    - ReaderScreen.tsx        # Lector de EPUB
    - FavoritesScreen.tsx     # Lista de libros favoritos
    - BookDetailScreen.tsx    # Detalles de un libro
  /components
    - BookCard.tsx            # Tarjeta de libro para listas
    - EpubViewer.tsx          # Componente de visualización EPUB
  /context
    - LibraryContext.tsx      # Estado global de la biblioteca
    - ThemeContext.tsx        # Manejo de temas claro/oscuro
  /utils
    - fileHandler.ts          # Funciones para importar/gestionar archivos
    - storage.ts              # Funciones para guardar progreso de lectura
  /navigation
    - AppNavigator.tsx        # Configuración de navegación
  - App.tsx                   # Componente raíz
```

## Instalación

### Requisitos previos

- Node.js 18+
- npm o yarn
- Expo CLI
- Dispositivo móvil con Expo Go (para desarrollo)

### Pasos de instalación

1. Instalar dependencias:
```bash
npm install
```

2. Instalar dependencias adicionales requeridas:
```bash
npx expo install expo-document-picker expo-file-system @react-native-async-storage/async-storage react-native-webview
```

3. Iniciar la aplicación:
```bash
npm start
```

4. Escanear el código QR con Expo Go en tu dispositivo móvil

## Dependencias principales

- `expo` - SDK de Expo
- `@react-navigation/native` - Navegación
- `@react-native-async-storage/async-storage` - Almacenamiento local
- `expo-document-picker` - Selector de archivos
- `expo-file-system` - Sistema de archivos
- `react-native-webview` - Visualizador EPUB

## Uso

### Importar un libro

1. Abre la aplicación
2. Toca el botón "+ Importar" en la pantalla principal
3. Selecciona un archivo .epub desde tu dispositivo
4. El libro se añadirá a tu biblioteca

### Leer un libro

1. Toca cualquier libro en la biblioteca
2. Usa los controles en la parte superior para:
   - 📑 Ver lista de capítulos
   - ⚙️ Acceder a configuración (tamaño de fuente, tema, favoritos)

### Marcar como favorito

- Toca el icono del corazón en la tarjeta del libro
- O usa la pantalla de Favoritos para ver todos tus libros marcados

## Notas importantes

- Los archivos EPUB se almacenan en el directorio de documentos de la aplicación
- El progreso de lectura se guarda automáticamente
- El tema se sincroniza con la configuración del sistema pero puede cambiarse manualmente

## Limitaciones

Esta es una implementación básica del lector EPUB. Para una aplicación de producción, se recomienda:

- Implementar un parser EPUB completo (usando epubjs o similar)
- Extraer metadatos reales del archivo (autor, portada, descripción)
- Mejorar la renderización del contenido (imágenes, estilos CSS del EPUB)
- Añadir búsqueda dentro del libro
- Implementar sincronización en la nube
- Añadir soporte para marcadores y notas

## Licencia

MIT
