import React, { useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../context/ThemeContext';

interface EpubViewerProps {
  epubPath: string;
  initialChapter?: number;
  onProgressChange?: (progress: { chapter: number; percentage: number }) => void;
  fontSize?: number;
}

export const EpubViewer: React.FC<EpubViewerProps> = ({
  epubPath,
  initialChapter = 0,
  onProgressChange,
  fontSize = 16,
}) => {
  const { themeMode, colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: Georgia, serif;
      line-height: 1.6;
      background-color: ${themeMode === 'dark' ? '#1a1a1a' : '#ffffff'};
      color: ${themeMode === 'dark' ? '#e0e0e0' : '#333333'};
      font-size: ${fontSize}px;
    }
    .chapter {
      max-width: 100%;
    }
    .nav-button {
      position: fixed;
      bottom: 20px;
      padding: 12px 24px;
      background-color: ${colors.primary};
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
    }
    #prev-btn { left: 20px; }
    #next-btn { right: 20px; }
    .hidden { display: none; }
  </style>
</head>
<body>
  <div id="epub-content" class="chapter">
    <h2>Cargando libro...</h2>
    <p>Por favor espere mientras cargamos el contenido.</p>
  </div>
  
  <button id="prev-btn" class="nav-button hidden" onclick="prevChapter()">← Anterior</button>
  <button id="next-btn" class="nav-button hidden" onclick="nextChapter()">Siguiente →</button>

  <script>
    let currentChapter = ${initialChapter};
    let totalChapters = 5; // Simulado - en producción se obtiene del EPUB
    
    // Simulación de capítulos para demostración
    const chapters = [
      "<h1>Capítulo 1</h1><p>Bienvenido a este libro electrónico. Este es el primer capítulo de demostración.</p><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>",
      "<h1>Capítulo 2</h1><p>Continuamos con el segundo capítulo. El contenido real se cargaría desde el archivo EPUB.</p><p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>",
      "<h1>Capítulo 3</h1><p>El tercer capítulo contiene más información sobre el tema del libro.</p><p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>",
      "<h1>Capítulo 4</h1><p>Casi llegamos al final. Esperemos que esté disfrutando de la lectura.</p><p>Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>",
      "<h1>Capítulo 5</h1><p>Este es el último capítulo. Gracias por leer este libro de demostración.</p><p>Fin del libro.</p>"
    ];
    
    function renderChapter(index) {
      if (index >= 0 && index < chapters.length) {
        document.getElementById('epub-content').innerHTML = chapters[index];
        currentChapter = index;
        
        // Actualizar botones
        document.getElementById('prev-btn').classList.toggle('hidden', index === 0);
        document.getElementById('next-btn').classList.toggle('hidden', index >= chapters.length - 1);
        
        // Reportar progreso
        const percentage = ((index + 1) / chapters.length) * 100;
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'progress',
          chapter: index,
          percentage: percentage
        }));
        
        // Scroll al inicio
        window.scrollTo(0, 0);
      }
    }
    
    function prevChapter() {
      if (currentChapter > 0) {
        renderChapter(currentChapter - 1);
      }
    }
    
    function nextChapter() {
      if (currentChapter < chapters.length - 1) {
        renderChapter(currentChapter + 1);
      }
    }
    
    // Inicializar
    renderChapter(currentChapter);
    
    // Detectar scroll para progreso
    let lastScrollPercent = 0;
    window.addEventListener('scroll', function() {
      const scrollPercent = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
      if (Math.abs(scrollPercent - lastScrollPercent) > 5) {
        lastScrollPercent = scrollPercent;
        const totalProgress = ((currentChapter / chapters.length) * 100) + ((scrollPercent / 100) * (100 / chapters.length));
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'scroll',
          percentage: Math.round(totalProgress)
        }));
      }
    });
    
    // Mensaje inicial
    setTimeout(() => {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'loaded' }));
    }, 500);
  </script>
</body>
</html>
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'progress' && onProgressChange) {
        onProgressChange({
          chapter: data.chapter,
          percentage: data.percentage,
        });
      }
    } catch (error) {
      console.error('Error parsing webview message:', error);
    }
  };

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Error al cargar el EPUB</Text>
        <Text style={{ color: colors.textSecondary }}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {loading && (
        <View style={[styles.loading, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.textSecondary, marginTop: 10 }}>Cargando libro...</Text>
        </View>
      )}
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webview}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={(e) => setError(e.nativeEvent.description)}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});
