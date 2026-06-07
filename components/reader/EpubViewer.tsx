import { readAsStringAsync } from 'expo-file-system/legacy';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../context/ThemeContext';
import { Book } from '../../utils/storage';

export interface EpubViewerRef {
  nextPage: () => void;
  prevPage: () => void;
  goToChapter: (href: string) => void;
  goToPercentage: (percentage: number) => void;
}

interface EpubViewerProps {
  book: Book;
  fontSize: number;
  theme: 'light' | 'dark';
  onProgressChange?: (progress: number, chapter: number, cfi?: string, details?: any) => void;
  onNavigationLoaded?: (toc: { label: string; href: string }[]) => void;
  onToggleControls?: () => void;
  onCoverExtracted?: (cover: string) => void;
  onTextSelected?: (text: string) => void;
}

const EpubViewer = forwardRef<EpubViewerRef, EpubViewerProps>(({
  book,
  fontSize,
  theme,
  onProgressChange,
  onNavigationLoaded,
  onToggleControls,
  onCoverExtracted,
  onTextSelected
}, ref) => {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const { colors } = useTheme();

  // Expose methods to the parent component
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
    goToPercentage(percentage) { // <- Agrega este bloque
      webViewRef.current?.injectJavaScript(`
      if (rendition && book && book.locations) {
        const cfi = book.locations.cfiFromPercentage(${percentage});
        if (cfi) rendition.display(cfi);
      }
      true;
    `);
    }
  }));

  // Listen for font size changes
  useEffect(() => {
    if (!loading && webViewRef.current) {
      webViewRef.current.injectJavaScript(`window.applyFontSize(${fontSize}); true;`);
    }
  }, [fontSize, loading]);

  // Listen for theme changes
  useEffect(() => {
    if (!loading && webViewRef.current) {
      webViewRef.current.injectJavaScript(`window.changeTheme('${theme}'); true;`);
    }
  }, [theme, loading]);

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

    window.onload = function() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready_to_receive' }));
    };

    window.initBook = function(base64Data, initialFontSize, initialTheme, initialCfi) {
      try {
        const binaryString = atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        book = ePub(bytes.buffer);
        
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
          // FUNCIÓN CORREGIDA: Mapea recursivamente las partes y sus subcapítulos
          function mapNavigationTree(items) {
            if (!items) return undefined;
            return items.map(chap => {
              const mapped = {
                label: chap.label ? chap.label.trim() : 'Capítulo',
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

          return book.locations.generate(1500);
        }).then(() => {
          if (rendition && rendition.currentLocation()) {
            triggerRelocated(rendition.currentLocation());
          }
        });

        rendition = book.renderTo("viewer", {
          width: "100%",
          height: "100%",
          flow: "paginated"
        });

        rendition.hooks.content.register((content) => {
          const doc = content.document;
          
          // 1. Inyectamos los estilos base de fondo y texto[cite: 1]
          const style = doc.createElement("style");
          const bg = currentTheme === 'dark' ? '#121212' : '#ffffff'; //[cite: 1]
          const text = currentTheme === 'dark' ? '#B0B0B0' : '#1A1A1A'; //[cite: 1]
          style.innerHTML = 'html, body { background-color: ' + bg + ' !important; color: ' + text + ' !important; }'; //[cite: 1]
          doc.head.appendChild(style); //[cite: 1]

          // 2. DETECTOR DE ENLACES REALES:[cite: 1]
          const links = doc.querySelectorAll('a'); //[cite: 1]
          links.forEach(link => {
            const href = link.getAttribute('href'); //[cite: 1]
            if (href && href !== '#' && href.trim() !== '' && link.textContent.trim().length < 60) { //[cite: 1]
              link.classList.add('enlace-real'); //[cite: 1]
            }
          });

          // 3. NUEVO: DETECTOR DE SELECCIÓN DE PALABRAS
          // Escuchamos cuando el usuario termina de seleccionar texto en el iframe
          doc.addEventListener('selectionchange', () => {
            const selection = doc.getSelection();
            const textoSeleccionado = selection ? selection.toString().trim() : '';

            // Validamos que sea una palabra o frase corta razonable (evitamos ruidos o párrafos enteros)
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
          'a': { 
            'color': 'inherit !important', 
            'text-decoration': 'none !important' 
          },
          '.enlace-real': { 
            'color': '#64B5F6 !important', 
            'text-decoration': 'underline !important' 
          },
          'h1': { 'color': '#FFFFFF !important' },
          'h2': { 'color': '#FFFFFF !important' },
          'h3': { 'color': '#FFFFFF !important' },
          'h4': { 'color': '#FFFFFF !important' },
          'h5': { 'color': '#FFFFFF !important' },
          'h6': { 'color': '#FFFFFF !important' }
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
          'a': { 
              'color': 'inherit !important', 
              'text-decoration': 'none !important' 
            },
            '.enlace-real': { 
              'color': '#2196F3 !important', 
              'text-decoration': 'underline !important' 
            },
          'h1': { 'color': '#1A1A1A !important' },
          'h2': { 'color': '#1A1A1A !important' },
          'h3': { 'color': '#1A1A1A !important' }
        });

        const displayPromise = initialCfi ? rendition.display(initialCfi) : rendition.display();

        displayPromise.then(() => {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
          window.applyFontSize(initialFontSize);
          window.changeTheme(initialTheme);
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
              rendition.next().catch(() => {
                isAnimating = false;
              });
            }, 200);

          } else if (diffX > threshold || (diffX > 45 && diffTime < 300)) {
            isAnimating = true;
            iframeBody.style.transition = 'transform 0.2s ease-out';
            iframeBody.style.transform = 'translateX(' + pageWidth + 'px)';
            
            setTimeout(() => {
              iframeBody.style.transition = 'none';
              iframeBody.style.transform = 'translateX(0)';
              rendition.prev().catch(() => {
                isAnimating = false;
              });
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

    function triggerRelocated(location) {
      if (!location || !location.start) return;
      
      const cfi = location.start.cfi;
      let progress = 0;
      let currentPage = 0;
      let totalPages = 0;
      let chapterTitle = "Capítulo";

      if (book.locations && book.locations.length() > 0) {
        currentPage = book.locations.locationFromCfi(cfi) || 0;
        totalPages = book.locations.length() || 0;
        const pct = book.locations.percentageFromCfi(cfi);
        progress = Math.round(pct * 100);
      } else {
        if (location.start.percentage !== undefined) {
          progress = Math.round(location.start.percentage * 100);
        } else if (location.location && location.location.start && location.location.start.percentage !== undefined) {
          progress = Math.round(location.location.start.percentage * 100);
        }
      }

      const section = book.spine.get(cfi);
      if (section) {
        if (!totalPages) {
          currentPage = section.index + 1;
          totalPages = book.spine.length;
        }
        const nav = book.navigation.get(section.href);
        if (nav) {
          chapterTitle = nav.label ? nav.label.trim() : "Capítulo " + (section.index + 1);
        } else {
          chapterTitle = "Capítulo " + (section.index + 1);
        }
      }

      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'progress',
        progress: progress,
        chapter: section ? section.index : 0,
        cfi: cfi,
        chapterTitle: chapterTitle,
        currentPage: currentPage,
        totalPages: totalPages
      }));
    }

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
          rendition.next().catch(() => {
            isAnimating = false;
          });
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
          rendition.prev().catch(() => {
            isAnimating = false;
          });
        }, 200);
      } else {
        rendition.prev();
      }
    };

    window.goToChapter = function(href) {
      if (rendition) {
        rendition.display(href);
      }
    };

    window.applyFontSize = function(size) {
      if (rendition) {
        rendition.themes.fontSize(size + 'px');
      }
    };

    window.changeTheme = function(themeName) {
      currentTheme = themeName;
      if (themeName === 'dark') {
        document.body.style.backgroundColor = '#121212';
        document.body.style.color = '#ffffff';
      } else {
        document.body.style.backgroundColor = '#ffffff';
        document.body.style.color = '#1A1A1A';
      }
      
      if (rendition) {
        rendition.themes.select(themeName);
      }
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
            // Usamos la función importada desde /legacy que sí soporta 'base64' sin dar errores
            const base64Data = await readAsStringAsync(book.filePath, {
              encoding: 'base64',
            });

            const cfiParam = book.currentCfi ? `"${book.currentCfi}"` : 'null';
            const js = `window.initBook("${base64Data}", ${fontSize}, "${theme}", ${cfiParam}); true;`;
            webViewRef.current?.injectJavaScript(js);
          } catch (err: any) {
            console.error('Error reading book file:', err);
            setLoading(false);
            Alert.alert(
              'Error',
              'No se pudo leer el archivo del libro. Es posible que el archivo esté corrupto o no se encuentre.'
            );
          }
          break;
        case 'navigation':
          onNavigationLoaded?.(data.toc);
          break;
        case 'progress':
          onProgressChange?.(data.progress, data.chapter, data.cfi, {
            chapterTitle: data.chapterTitle,
            currentPage: data.currentPage,
            totalPages: data.totalPages
          });
          break;
        case 'toggle_controls':
          onToggleControls?.();
          break;
        case 'cover':
          onCoverExtracted?.(data.cover);
          break;
        case 'text_selected': // 👈 AGREGA ESTE CASO
          onTextSelected?.(data.text);
          break;
        case 'ready':
          setLoading(false);
          break;
        case 'error':
          console.error('EPUB Error inside WebView:', data.message);
          setLoading(false);
          Alert.alert('Error al renderizar', 'El lector no pudo interpretar el formato del libro.');
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