import { readAsStringAsync } from 'expo-file-system/legacy';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../context/ThemeContext';
import { Book } from '../../utils/storage/types';

export interface SearchResult {
  cfi: string;
  excerpt: string;
  chapterTitle: string;
}
export interface EpubViewerRef {
  nextPage: () => void;
  prevPage: () => void;
  goToChapter: (href: string) => void;
  goToPercentage: (percentage: number) => void;
  search: (query: string) => void;
}

interface EpubViewerProps {
  book: Book;
  fontSize: number;
  theme: 'light' | 'dark';
  onProgressChange?: (progress: number, chapter: string, cfi: string, details?: any) => void;
  onNavigationLoaded?: (toc: { title: string; href: string; level?: number }[]) => void;
  onToggleControls?: () => void;
  onCoverExtracted?: (cover: string) => void;
  onTextSelected?: (text: string) => void;
  cfiIndex: string[] | null; // Caché de ubicaciones recibido de SQLite
  onSearchResults?: (results: SearchResult[]) => void;
}

const EpubViewer = forwardRef<EpubViewerRef, EpubViewerProps>(({
  book,
  fontSize,
  theme,
  cfiIndex,
  onProgressChange,
  onNavigationLoaded,
  onToggleControls,
  onCoverExtracted,
  onTextSelected,
  onSearchResults
}, ref) => {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const { colors } = useTheme();

  useImperativeHandle(ref, () => ({
    nextPage() {
      webViewRef.current?.injectJavaScript('window.nextPage(); true;');
    },
    prevPage() {
      webViewRef.current?.injectJavaScript('window.prevPage(); true;');
    },
    goToChapter(href) {
      webViewRef.current?.injectJavaScript(`window.goToChapter("${href}"); true;`);
    },
    goToPercentage(percentage) {
      webViewRef.current?.injectJavaScript(`window.goToPercentage(${percentage}); true;`);
    },
    search(query: string) {
      webViewRef.current?.injectJavaScript(`window.searchTextInBook("${query.replace(/"/g, '\\"SafeString')}"); true;`);
    }
  }));

  useEffect(() => {
    if (!loading && webViewRef.current) {
      webViewRef.current.injectJavaScript(`window.applyFontSize(${fontSize}); true;`);
    }
  }, [fontSize, loading]);

  useEffect(() => {
    if (!loading && webViewRef.current) {
      webViewRef.current.injectJavaScript(`window.changeTheme('${theme}'); true;`);
    }
  }, [theme, loading]);

  /*html*/
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.5/jszip.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/epubjs/dist/epub.min.js"></script>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: ${theme === 'dark' ? '#121212' : '#ffffff'};
      color: ${theme === 'dark' ? '#ffffff' : '#1A1A1A'};
      transition: background-color 0.3s ease, color 0.3s ease;
    }
    #viewer {
      width: 100vw;
      height: 100vh;
      overflow: hidden;
    }
    #viewer iframe {
      background-color: transparent !important;
      background: transparent !important;
    }
  </style>
</head>
<body>
  <div id="viewer"></div>

  <script>
    let book;
    let rendition;
    let chapters = [];
    let currentTheme = '${theme}';

    let touchStartStartX = 0;
    let touchStartStartTime = 0;
    let isDragging = false;
    let isAnimating = false;
    let iframeBody = null;

    let currentDoc = null;

    window.onload = function() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready_to_receive' }));
    };

    window.initBook = function(base64Data, initialFontSize, initialTheme, initialCfi, cfiIndexRaw) {
      try {
        const binaryString = atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        book = ePub(bytes.buffer);
        
        // Carga el index de CFIs desde SQLite de forma instantánea
        if (cfiIndexRaw && Array.isArray(cfiIndexRaw) && cfiIndexRaw.length > 0) {
          book.locations.load(cfiIndexRaw);
        }
        
        book.ready.then(() => {
          const metadata = book.package.metadata;
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'metadata',
            title: metadata.title,
            author: metadata.creator
          }));

          book.coverUrl().then((url) => {
            if (url) {
              fetch(url)
                .then(response => response.blob())
                .then(blob => {
                  const reader = new FileReader();
                  reader.onloadend = function() {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'cover',
                      cover: reader.result
                    }));
                  };
                  reader.readAsDataURL(blob);
                })
                .catch(err => console.error("Cover extraction error:", err));
            }
          });

          return book.loaded.navigation;
        }).then((navigation) => {
          function mapNavigationTree(items) {
            if (!items) return undefined;
            return items.map(chap => {
              const mapped = {
                title: chap.label ? chap.label.trim() : 'Capítulo',
                href: chap.href
              };
              if (chap.subitems && chap.subitems.length > 0) {
                mapped.subitems = mapNavigationTree(chap.subitems);
              }
              return mapped;
            });
          }

          chapters = navigation.toc;
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'navigation',
            toc: mapNavigationTree(chapters)
          }));
        });

        rendition = book.renderTo("viewer", {
          width: "100%",
          height: "100%",
          flow: "paginated"
        });

        rendition.hooks.content.register((content) => {
          const doc = content.document;
          currentDoc = doc;

          const style = doc.createElement("style");
          const bg = currentTheme === 'dark' ? '#121212' : '#ffffff';
          const text = currentTheme === 'dark' ? '#B0B0B0' : '#1A1A1A';
          style.innerHTML = 'html, body { background-color: ' + bg + ' !important; color: ' + text + ' !important; }';
          doc.head.appendChild(style);

          const links = doc.querySelectorAll('a');
          links.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href !== '#' && href.trim() !== '' && link.textContent.trim().length < 60) {
              link.classList.add('enlace-real');
            }
          });

          doc.addEventListener('selectionchange', () => {
            const selection = doc.getSelection();
            const textoSeleccionado = selection ? selection.toString().trim() : '';

            if (textoSeleccionado && textoSeleccionado.length > 0 && textoSeleccionado.length < 50) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'text_selected',
                text: textoSeleccionado
              }));
            }
          });
        });

        rendition.themes.register('dark', {
          'html': { 'background-color': '#121212 !important' },
          'body': { 
            'background-color': '#121212 !important', 
            'color': '#B0B0B0 !important',
            'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important',
            'line-height': '1.6 !important'
          },
          'p': { 'color': '#B0B0B0 !important' },
          'span': { 'color': '#B0B0B0 !important' },
          'div': { 'color': '#B0B0B0 !important' },
          'a': { 'color': 'inherit !important', 'text-decoration': 'none !important' },
          '.enlace-real': { 'color': '#64B5F6 !important', 'text-decoration': 'underline !important' },
          'h1': { 'color': '#FFFFFF !important' }, 'h2': { 'color': '#FFFFFF !important' }, 'h3': { 'color': '#FFFFFF !important' }
        });
        
        rendition.themes.register('light', {
          'html': { 'background-color': '#ffffff !important' },
          'body': { 
            'background-color': '#FFFFFF !important', 
            'color': '#1A1A1A !important',
            'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important',
            'line-height': '1.6 !important'
          },
          'p': { 'color': '#1A1A1A !important' },
          'span': { 'color': '#1A1A1A !important' },
          'div': { 'color': '#1A1A1A !important' },
          'a': { 'color': 'inherit !important', 'text-decoration': 'none !important' },
          '.enlace-real': { 'color': '#2196F3 !important', 'text-decoration': 'underline !important' },
          'h1': { 'color': '#1A1A1A !important' }, 'h2': { 'color': '#1A1A1A !important' }, 'h3': { 'color': '#1A1A1A !important' }
        });

        const displayPromise = initialCfi ? rendition.display(initialCfi) : rendition.display();
        if (initialCfi) {
          rendition.display(initialCfi);
        }
        
        displayPromise.then(() => {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
          window.applyFontSize(initialFontSize);
          window.changeTheme(initialTheme);
          
          if (rendition.currentLocation()) {
            triggerRelocated(rendition.currentLocation());
          }
        });

        rendition.on("relocated", (location) => {
          triggerRelocated(location);
          isAnimating = false; 
        });

        rendition.on("click", (event) => {
          if (event.target.tagName !== 'A') {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'toggle_controls' }));
          }
        });

        document.body.addEventListener('click', function(e) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'toggle_controls' }));
        });

        // --- GESTOS TOUCH ---
        rendition.on("touchstart", (event) => {
          if (isAnimating) return;
          isDragging = true;
          touchStartStartX = event.touches[0].clientX;
          touchStartStartTime = new Date().getTime();
          
          const contents = rendition.getContents()[0];
          if (contents) {
            iframeBody = contents.document.body;
            iframeBody.style.transition = 'none';
          }
        });

        rendition.on("touchmove", (event) => {
          if (!isDragging || !iframeBody) return;
          const currentX = event.touches[0].clientX;
          const dx = currentX - touchStartStartX;
          iframeBody.style.transform = 'translateX(' + dx + 'px)';
        });

        rendition.on("touchend", (event) => {
          if (!isDragging || !iframeBody) return;
          isDragging = false;
          
          const endX = event.changedTouches[0].clientX;
          const diffX = endX - touchStartStartX;
          const diffTime = new Date().getTime() - touchStartStartTime;
          
          const pageWidth = window.innerWidth; 
          const threshold = pageWidth * 0.25;
          
          if (diffX < -threshold || (diffX < -45 && diffTime < 300)) {
            isAnimating = true;
            iframeBody.style.transition = 'transform 0.2s ease-out';
            iframeBody.style.transform = 'translateX(-' + pageWidth + 'px)';
            setTimeout(() => {
              iframeBody.style.transition = 'none';
              iframeBody.style.transform = 'translateX(0)';
              rendition.next().catch(() => { isAnimating = false; });
            }, 200);
          } else if (diffX > threshold || (diffX > 45 && diffTime < 300)) {
            isAnimating = true;
            iframeBody.style.transition = 'transform 0.2s ease-out';
            iframeBody.style.transform = 'translateX(' + pageWidth + 'px)';
            setTimeout(() => {
              iframeBody.style.transition = 'none';
              iframeBody.style.transform = 'translateX(0)';
              rendition.prev().catch(() => { isAnimating = false; });
            }, 200);
          } else {
            iframeBody.style.transition = 'transform 0.2s ease-out';
            iframeBody.style.transform = 'translateX(0)';
          }
        });

      } catch (error) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'error',
          message: error.message
        }));
      }
    };

    // --- MOTOR DE BÚSQUEDA INTERNO ---
    window.searchTextInBook = function(query) {
      if (!book) return;
      
      const cleanQuery = query.trim().toLowerCase();
      if (cleanQuery.length < 3) return; // Evitar búsquedas absurdas de 1 o 2 letras

      // Promesa para buscar en todos los ítems del esqueleto (spine)
      const searchPromises = book.spine.spineItems.map(item => {
        return item.load(book.load.bind(book))
          .then(doc => {
            const results = item.find(cleanQuery);
            item.unload(); // Liberar memoria inmediatamente
            
            // Mapear los resultados de este capítulo
            return results.map(result => {
              // Intentamos conseguir el título del capítulo para el contexto de la UI
              const nav = book.navigation.get(item.href);
              const chapterLabel = nav && nav.label ? nav.label.trim() : "Capítulo " + (item.index + 1);

              return {
                cfi: result.cfi,
                excerpt: result.excerpt, // Fragmento de texto que rodea la coincidencia
                chapterTitle: chapterLabel
              };
            });
          })
          .catch(err => {
            console.error("Error buscando en item:", item.href, err);
            return [];
          });
      });

      // Esperar a que se procesen todos los capítulos
      Promise.all(searchPromises).then(allResults => {
        // Aplanar el array de arrays de resultados
        const flattenedResults = allResults.reduce((acc, val) => acc.concat(val), []);
        
        // Enviar los resultados de vuelta a React Native
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'search_results',
          query: query,
          results: flattenedResults
        }));
      });
    };

   function triggerRelocated(location) {
      if (!location || !location.start) return;
      
      const cfi = location.start.cfi;
      let progress = 0;
      let currentPage = 0;
      let totalPages = 0;
      let chapterTitle = "Capítulo";
      let firstTextPreview = "";

      // ========================================================
      // EXTRACTOR DE TEXTO REAL (REPARADO Y LIGERO)
      // ========================================================
      try {
        if (rendition && typeof rendition.getRange === 'function') {
          const exactRange = rendition.getRange(cfi);
          
          if (exactRange) {
            let foundText = "";

            // CASO 1: El CFI apunta directo a un nodo de texto plano
            if (exactRange.startContainer && exactRange.startContainer.nodeType === 3) {
              const fullTxt = exactRange.startContainer.textContent || "";
              const offset = exactRange.startOffset || 0;
              foundText = fullTxt.substring(offset).trim();
            }

            // CASO 2: Si viene vacío o apuntó a una etiqueta estructural superior
            if (!foundText || foundText.length < 4) {
              const fragment = exactRange.cloneContents();
              if (fragment) {
                const element = fragment.querySelector('h1, h2, h3, h4, h5, h6, p, li, span, a');
                foundText = element ? element.textContent : fragment.textContent;
              }
            }

            // SALVAGUARDA: Si el nodo sigue rebelde, miramos a su hermano inmediato
            if (!foundText || foundText.trim().length < 5) {
              if (exactRange.startContainer) {
                let containerNode = exactRange.startContainer;
                if (containerNode.nodeType === 3) containerNode = containerNode.parentElement;
                if (containerNode) {
                  foundText = containerNode.textContent || 
                              (containerNode.nextElementSibling ? containerNode.nextElementSibling.textContent : "");
                }
              }
            }

            // LIMPIEZA ADAPTATIVA DEL TEXTO CRUDO
            if (foundText) {
              foundText = foundText.normalize("NFC");
              if (foundText.length > 60) {
                foundText = foundText.substring(0, 57) + "...";
              }
              firstTextPreview = foundText;
            }
          }
        }
      } catch (cfiExtractionError) {
        console.error("Error en extractor por rango:", cfiExtractionError);
      }
      // ========================================================

      // --- Lógica de progreso e historial (Intacta) ---
      if (book.locations && book.locations.length() > 0) {
        currentPage = book.locations.locationFromCfi(cfi) || 0;
        totalPages = book.locations.length() || 0;
        
        if (totalPages > 0 && currentPage > 0) {
          progress = currentPage / totalPages;
        } else {
          const pct = book.locations.percentageFromCfi(cfi);
          progress = pct || 0;
        }
      } else {
        if (location.start.percentage !== undefined) {
          progress = location.start.percentage;
        }
      }

      if (progress > 1) progress = 1;
      if (progress < 0) progress = 0;

      const section = book.spine.get(cfi);
      if (section) {
        if (!totalPages) {
          currentPage = section.index + 1;
          totalPages = book.spine.length;
        }
        const nav = book.navigation.get(section.href);
        chapterTitle = nav && nav.label ? nav.label.trim() : "Capítulo " + (section.index + 1);
      }

      if (!firstTextPreview) {
        firstTextPreview = chapterTitle;
      }

      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'progress',
        progress: progress,
        chapter: chapterTitle,
        cfi: cfi,
        chapterTitle: chapterTitle,
        currentPage: currentPage,
        totalPages: totalPages,
        pageTextPreview: firstTextPreview 
      }));
    }

    window.goToPercentage = function(percentage) {
      if (rendition && book) {
        // Recibe directamente el flotante 0-1 mapeado desde el Slider de RN
        const fraction = percentage; 
        
        if (book.locations && typeof book.locations.cfiFromPercentage === 'function' && book.locations.length() > 0) {
          const cfi = book.locations.cfiFromPercentage(fraction);
          if (cfi) rendition.display(cfi);
        } else {
          const spineIndex = Math.floor(fraction * book.spine.length);
          const section = book.spine.get(spineIndex);
          if (section) rendition.display(section.href);
        }
      }
    };

    window.nextPage = function() {
      if (!rendition || isAnimating) return;
      const contents = rendition.getContents()[0];
      if (contents) {
        isAnimating = true;
        const body = contents.document.body;
        body.style.transition = 'transform 0.2s ease-out';
        const pageWidth = window.innerWidth;
        body.style.transform = 'translateX(-' + pageWidth + 'px)';
        setTimeout(() => {
          body.style.transition = 'none';
          body.style.transform = 'translateX(0)';
          rendition.next().catch(() => { isAnimating = false; });
        }, 200);
      } else {
        rendition.next();
      }
    };

    window.prevPage = function() {
      if (!rendition || isAnimating) return;
      const contents = rendition.getContents()[0];
      if (contents) {
        isAnimating = true;
        const body = contents.document.body;
        body.style.transition = 'transform 0.2s ease-out';
        const pageWidth = window.innerWidth;
        body.style.transform = 'translateX(' + pageWidth + 'px)';
        setTimeout(() => {
          body.style.transition = 'none';
          body.style.transform = 'translateX(0)';
          rendition.prev().catch(() => { isAnimating = false; });
        }, 200);
      } else {
        rendition.prev();
      }
    };

    window.goToChapter = function(href) {
      if (rendition) rendition.display(href);
    };

    window.applyFontSize = function(size) {
      if (rendition) rendition.themes.fontSize(size + 'px');
    };

    window.changeTheme = function(themeName) {
      currentTheme = themeName;
      document.body.style.backgroundColor = themeName === 'dark' ? '#121212' : '#ffffff';
      document.body.style.color = themeName === 'dark' ? '#ffffff' : '#1A1A1A';
      if (rendition) rendition.themes.select(themeName);
    };
  </script>
</body>
</html>
`;

  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      switch (data.type) {
        case 'ready_to_receive':
          try {
            const base64Data = await readAsStringAsync(book.filePath, {
              encoding: 'base64',
            });

            const cfiParam = book.lastCfi ? `"${book.lastCfi}"` : 'null';
            const cfiIndexParam = cfiIndex ? JSON.stringify(cfiIndex) : 'null';

            const js = `window.initBook("${base64Data}", ${fontSize}, "${theme}", ${cfiParam}, ${cfiIndexParam}); true;`;
            webViewRef.current?.injectJavaScript(js);
          } catch (err: any) {
            console.error('Error reading book file:', err);
            setLoading(false);
            Alert.alert('Error', 'No se pudo abrir el archivo físico del libro.');
          }
          break;
        case 'navigation':
          onNavigationLoaded?.(data.toc);
          break;
        case 'progress':
          onProgressChange?.(data.progress, data.chapter, data.cfi, {
            chapterTitle: data.chapterTitle,
            currentPage: data.currentPage,
            totalPages: data.totalPages,
            pageTextPreview: data.pageTextPreview || data.chapterTitle || 'Inicio de sección'
          });
          break;
        case 'toggle_controls':
          onToggleControls?.();
          break;
        case 'cover':
          onCoverExtracted?.(data.cover);
          break;
        case 'text_selected':
          onTextSelected?.(data.text);
          break;
        case 'ready':
          setLoading(false);
          break;
        case 'search_results':
          onSearchResults?.(data.results);
          break;
        case 'error':
          console.error('EPUB Error inside WebView:', data.message);
          setLoading(false);
          break;
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View style={[styles.loading, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        style={styles.webview}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        allowFileAccessFromFileURLs={true}
        mixedContentMode="always"
      />
    </View>
  );
});

EpubViewer.displayName = 'EpubViewer';

export default EpubViewer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});