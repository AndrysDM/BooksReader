# 📋 Plan de Desarrollo: Sistema de Almacenamiento y Motor de Lectura con SQLite

Este documento contiene la hoja de ruta detallada para migrar la persistencia de datos de la aplicación a una arquitectura relacional indexada, optimizar el rendimiento del visor e implementar características avanzadas de interactividad en el lector de ePubs.

---

## 💾 1. Migración del Almacenamiento a SQLite
*Migrar el sistema de persistencia y definir el nuevo modelo de datos relacional para el ecosistema de la biblioteca.*

- [x] **Configurar la inicialización de la Base de Datos (`storage.ts`)**
  - [x] Implementar la apertura asíncrona de `library.db` usando `expo-sqlite`.
  - [x] Asegurar la ejecución de `PRAGMA foreign_keys = ON;` al levantar la conexión.
- [x] **Definir el Esquema de Tablas e Índices**
  - [x] Crear tabla `books` con restricción `UNIQUE` en la ruta del archivo (`file_path`).
  - [x] Crear tabla `annotations` unificada para notas, marcadores y subrayados con borrado en cascada (`ON DELETE CASCADE`).
  - [x] Crear tabla `book_locations` para almacenar la caché de índices CFI.
  - [x] Crear índices de optimización: `idx_annotations_book_id` y `idx_locations_book_id`.
- [x] **Mapeo de Tipos y Métodos de Reemplazo**
  - [x] Adaptar las consultas de lectura para convertir enteros (`0`/`1`) en booleanos de TypeScript (`isFavorite`).
  - [x] Crear funciones CRUD esenciales para la vista principal (`getBooks`, `toggleFavorite`, `deleteBook`).

---

## 📥 2. Extractor de Archivos y Generación Externa de Locations
*Modificar el ciclo de vida de importación/apertura para procesar la estructura interna del ePub una sola vez.*

- [x] **Intercepción en la Apertura del Libro**
  - [x] Verificar en la base de datos si el libro abierto ya cuenta con localizaciones cacheadas.
  - [x] Disparar el proceso de extracción masiva únicamente si el conteo de registros en `book_locations` para ese `book_id` es igual a cero.
- [x] **Estrategia de Guardado Masivo de Alto Rendimiento**
  - [x] Capturar el array resultante de las ~1500 localizaciones fijas generadas por el motor.
  - [ ] Implementar una transacción manual en SQLite (`BEGIN TRANSACTION` / `COMMIT`) para escribir los miles de CFIs en disco en milisegundos.
  - [ ] Asegurar el cierre y liberación del cursor mediante `.finalizeAsync()`.

---

## 📖 3. Optimización del Visor (`EpubViewer`)
*Modificar el puente de comunicación entre el ecosistema nativo y el WebView para conseguir una carga instantánea.*

- [x] **Carga de Caché desde SQLite**
  - [x] Consultar de manera asíncrona las localizaciones del libro activo ordenadas estrictamente por su índice (`ORDER BY cfi_index ASC`).
  - [x] Guardar el set de CFIs en un estado de React Native como un array plano de strings (`string[]`).
- [x] **Inyección de Datos al Motor del Lector**
  - [x] Pasar el array de localizaciones serializado en JSON al WebView mediante la propiedad `injectedJavaScript`.
  - [x] Modificar el JS del visor para saltarse el proceso de paginación e invocar directamente el método de carga instantánea (`book.locations.load()`).

---

## 🔖 4. Lógica de Marcadores (Bookmarks)
*Permitir al usuario guardar puntos de interés o páginas específicas del libro para regresar a ellas más tarde.*

- [ ] **Persistencia de Marcadores**
  - [ ] Crear un método en `storage.ts` para insertar un registro en `annotations` con el tipo `'bookmark'`, guardando el `cfi` actual y la fecha de creación.
- [ ] **Sincronización en la Interfaz del Lector**
  - [ ] Consultar la lista de marcadores del libro activo al iniciar el visor.
  - [ ] Implementar la barra lateral o menú de marcadores en React Native, permitiendo al usuario tocar un elemento y lanzar una orden al WebView (`rendition.display(cfi)`) para saltar a esa posición.

---

## 📝 5. Gestión de Notas
*Permitir añadir texto o comentarios propios del usuario asociados a una ubicación específica del ePub.*

- [ ] **Flujo de Creación de Notas**
  - [ ] Diseñar un componente de interfaz modal en React Native para la entrada de texto del comentario (`note_content`).
  - [ ] Registrar la nota en la tabla `annotations` con `type: 'note'`, guardando el texto comentado, el CFI y el texto original del libro si aplica.
- [ ] **Visualización e Indicadores dentro del Texto**
  - [ ] Inyectar JavaScript en el WebView para pintar un indicador visual (icono o pestaña) en los CFIs que posean una nota guardada.
  - [ ] Configurar el listener de eventos en el WebView para capturar clics en los indicadores y abrir la nota correspondiente en la app.

---

## 🖍️ 6. Sistema de Subrayado (Highlights)
*Implementar la capacidad de colorear fragmentos de texto seleccionados por el usuario utilizando diferentes estilos.*

- [ ] **Captura de Selección en el WebView**
  - [ ] Escuchar el evento de selección de texto del motor del ePub (`rendition.on("selected", ...)`).
  - [ ] Extraer el texto seleccionado, el rango CFI exacto y enviar la información a React Native mediante `window.ReactNativeWebView.postMessage`.
- [ ] **Paleta de Colores y Persistencia**
  - [ ] Ofrecer al usuario una paleta con diferentes opciones de color en la interfaz flotante.
  - [ ] Guardar el subrayado en la base de datos bajo `type: 'highlight'`, almacenando el código hexadecimal en el campo `color`.
- [ ] **Renderizado Persistente**
  - [ ] Modificar el código de inicialización del WebView para recorrer todas las anotaciones de tipo subrayado del libro y aplicar el estilo visual dinámicamente en el documento (`rendition.annotations.add("highlight", cfi, {}, ...)`).

---

## 🔍 7. Motor de Búsqueda de Texto
*Implementar un buscador eficiente para localizar de forma inmediata palabras o frases específicas en el libro activo.*

- [ ] **Integración del Buscador en el Lector**
  - [ ] Crear una interfaz de barra de búsqueda en la cabecera del visor en React Native.
  - [ ] Exponer una función global en el WebView (`window.searchInBook`) que ejecute el motor de búsquedas nativo del ePub (`book.find(query)`).
- [ ] **Despliegue y Navegación de Coincidencias**
  - [ ] Comunicar el array de coincidencias (`cfi` y extracto/contexto del texto) de vuelta al componente de Expo mediante mensajes de WebView.
  - [ ] Renderizar los resultados en una lista nativa (`FlatList`) y habilitar el salto inmediato a la página exacta al presionar cualquier coincidencia.

---

## 🔗 8. Control y Manejo de Enlaces Internos y Externos (`<a>`)
*Asegurar que los hipervínculos dentro del HTML del ePub se comporten de manera correcta y fluida.*

- [ ] **Intercepción de Navegación en el WebView**
  - [ ] Configurar la propiedad `onShouldStartLoadWithRequest` en el componente `WebView` de React Native para analizar los clics en enlaces.
- [ ] **Lógica de Enrutamiento diferenciada**
  - [ ] **Enlaces Internos (Notas al pie, Capítulos, Índices):** Si el `href` apunta a un elemento o archivo interno del ePub (`#id` o `.xhtml`), permitir que el motor de lectura maneje la navegación internamente.
  - [ ] **Enlaces Externos (Páginas Web / HTTP / HTTPS):** Bloquear la recarga del WebView, capturar la URL externa e invocar el módulo nativo de Expo (`WebBrowser.openBrowserAsync(url)` o `Linking.openURL(url)`) para abrir el sitio de manera segura en el navegador del sistema.