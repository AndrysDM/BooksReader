# Biblioo - Lector de EPUB para React Native

Aplicación móvil para leer libros en formato EPUB construida con React Native y Expo.

## Características

- 📚 **Biblioteca personal**: Importa y organiza tus libros EPUB
- 📖 **Lector completo**: Visualización de libros con navegación por capítulos
- 🎨 **Temas claro/oscuro**: Cambia entre modos según tu preferencia
- 🔤 **Tamaño de fuente ajustable**: Personaliza la lectura a tu gusto
- ❤️ **Favoritos**: Marca tus libros preferidos
- 📊 **Seguimiento de progreso**: Recuerda automáticamente dónde quedaste
- 💾 **Almacenamiento local**: Tus libros se guardan en el dispositivo

## Estructura del proyecto

```
/workspace
├── app/                      # Pantallas principales (Expo Router)
│   ├── (tabs)/              # Navegación por pestañas
│   │   ├── index.tsx        # Biblioteca principal
│   │   ├── favorites.tsx    # Pantalla de favoritos
│   │   └── _layout.tsx      # Layout de tabs
│   ├── reader/              # Pantalla del lector
│   │   └── index.tsx
│   ├── details/             # Detalles del libro
│   │   └── index.tsx
│   └── _layout.tsx          # Layout raíz con providers
├── components/              # Componentes reutilizables
│   ├── BookCard.tsx         # Tarjeta de libro
│   └── EpubViewer.tsx       # Visor EPUB con WebView
├── context/                 # Contextos de React
│   ├── LibraryContext.tsx   # Gestión de biblioteca
│   └── ThemeContext.tsx     # Gestión de temas
├── utils/                   # Utilidades
│   └── storage.ts           # AsyncStorage + FileSystem
└── package.json
```

## Instalación

1. Asegúrate de tener Node.js instalado
2. Instala las dependencias:
```bash
npm install
```

3. Inicia la aplicación:
```bash
npm start
```

## Dependencias principales

- `expo` - Framework base
- `expo-router` - Navegación basada en archivos
- `@react-native-async-storage/async-storage` - Almacenamiento local
- `expo-file-system` - Manejo de archivos
- `expo-document-picker` - Importar archivos EPUB
- `react-native-webview` - Renderizar contenido EPUB
- `epubjs` - Procesamiento de archivos EPUB (vía CDN en WebView)

## Uso

1. **Importar un libro**: Toca el botón "+" en la pantalla principal
2. **Leer**: Toca cualquier libro para abrir el lector
3. **Favoritos**: Toca el corazón en la tarjeta del libro
4. **Configuración**: En el lector, toca ⚙️ para ajustar tema y tamaño de fuente
5. **Navegar capítulos**: Usa los botones ◀ Anterior y Siguiente ▶

## Notas

- Los archivos EPUB se guardan en el directorio de documentos de la app
- El progreso se guarda automáticamente mientras lees
- La extracción de metadatos (autor, portada) puede mejorarse en versiones futuras

## Licencia

MIT

```
Biblioo
├─ .expo
│  ├─ devices.json
│  ├─ README.md
│  ├─ types
│  │  └─ router.d.ts
│  └─ web
│     └─ cache
│        └─ production
│           └─ images
│              └─ favicon
│                 └─ favicon-a4e030697a7571b3e95d31860e4da55d2f98e5e861e2b55e414f45a8556828ba-contain-transparent
│                    └─ favicon-48.png
├─ AGENTS.md
├─ app
│  ├─ home
│  │  └─ index.tsx
│  ├─ reader
│  │  └─ index.tsx
│  └─ _layout.tsx
├─ app.json
├─ assets
│  ├─ diccionario_produccion.json
│  ├─ images
│  │  ├─ android-icon-background.png
│  │  ├─ android-icon-foreground.png
│  │  ├─ android-icon-monochrome.png
│  │  ├─ favicon.png
│  │  ├─ icon.png
│  │  └─ splash-icon.png
│  └─ lemas_en.json
├─ CLAUDE.md
├─ components
│  ├─ home
│  │  ├─ BookCard.tsx
│  │  └─ ContinueReadingCard.tsx
│  └─ reader
│     └─ EpubViewer.tsx
├─ context
│  ├─ LibraryContext.tsx
│  └─ ThemeContext.tsx
├─ eas.json
├─ eslint.config.js
├─ hooks
│  ├─ use-color-scheme.ts
│  ├─ use-color-scheme.web.ts
│  └─ use-theme-color.ts
├─ package-lock.json
├─ package.json
├─ README.md
├─ TODO.md
├─ tsconfig.json
└─ utils
   ├─ storage
   │  ├─ db.ts
   │  ├─ queries
   │  │  ├─ annotations.ts
   │  │  ├─ books.ts
   │  │  └─ locations.ts
   │  ├─ schema.ts
   │  └─ types.ts
   └─ storage.ts

```