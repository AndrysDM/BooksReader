import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Book } from '../utils/storage';
import { useTheme } from '../context/ThemeContext';

interface EpubViewerProps {
  book: Book;
  fontSize: number;
  theme: 'light' | 'dark';
  onProgressChange?: (progress: number, chapter: number) => void;
  onChapterChange?: (chapter: number, title: string) => void;
}

export default function EpubViewer({ 
  book, 
  fontSize, 
  theme,
  onProgressChange,
  onChapterChange 
}: EpubViewerProps) {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const { colors } = useTheme();

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.jsdelivr.net/npm/epubjs/dist/epub.min.js"></script>
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: Georgia, serif;
      line-height: 1.6;
      background-color: ${theme === 'dark' ? '#1a1a1a' : '#ffffff'};
      color: ${theme === 'dark' ? '#e0e0e0' : '#1a1a1a'};
    }
    .epub-container {
      max-width: 800px;
      margin: 0 auto;
    }
    #viewer {
      width: 100%;
      height: 100vh;
    }
    .controls {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 10px;
      z-index: 1000;
    }
    .btn {
      padding: 10px 20px;
      background: ${colors.primary};
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
    }
    .chapter-list {
      position: fixed;
      top: 0;
      right: -300px;
      width: 300px;
      height: 100vh;
      background: ${theme === 'dark' ? '#2a2a2a' : '#f5f5f5'};
      overflow-y: auto;
      transition: right 0.3s ease;
      z-index: 1001;
      padding: 20px;
    }
    .chapter-list.open {
      right: 0;
    }
    .chapter-item {
      padding: 10px;
      border-bottom: 1px solid ${colors.border};
      cursor: pointer;
    }
    .chapter-item:hover {
      background: ${colors.card};
    }
  </style>
</head>
<body>
  <div id="viewer"></div>
  
  <div class="controls">
    <button class="btn" onclick="prevPage()">◀ Anterior</button>
    <button class="btn" onclick="toggleChapters()">📑 Capítulos</button>
    <button class="btn" onclick="nextPage()">Siguiente ▶</button>
  </div>

  <div class="chapter-list" id="chapterList"></div>

  <script>
    let book;
    let rendition;
    let currentChapter = 0;
    let chapters = [];

    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'loading' }));

    try {
      book = ePub("${book.filePath}");
      
      book.ready.then(() => {
        const metadata = book.package.metadata;
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'metadata',
          title: metadata.title,
          author: metadata.creator
        }));

        return book.loaded.navigation;
      }).then((navigation) => {
        chapters = navigation.toc;
        renderChapterList();
      });

      rendition = book.renderTo("viewer", {
        width: "100%",
        height: "100%",
        flow: "paginated"
      });

      rendition.display();

      rendition.on("relocated", (location) => {
        const progress = location.location.start.percentage;
        const chapter = location.start.displayed.page;
        
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'progress',
          progress: Math.round(progress * 100),
          chapter: chapter
        }));
      });

      rendition.on("rendered", () => {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
        applyFontSize(${fontSize});
      });

    } catch (error) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'error',
        message: error.message
      }));
    }

    function nextPage() {
      rendition.next();
    }

    function prevPage() {
      rendition.prev();
    }

    function toggleChapters() {
      const list = document.getElementById('chapterList');
      list.classList.toggle('open');
    }

    function renderChapterList() {
      const list = document.getElementById('chapterList');
      list.innerHTML = '<h3>Capítulos</h3>' + chapters.map((chap, index) => 
        '<div class="chapter-item" onclick="goToChapter(' + index + ')">' + 
        (chap.label || 'Capítulo ' + (index + 1)) + 
        '</div>'
      ).join('');
    }

    function goToChapter(index) {
      rendition.display(index);
      document.getElementById('chapterList').classList.remove('open');
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'chapter',
        chapter: index
      }));
    }

    function applyFontSize(size) {
      if (rendition) {
        rendition.themes.fontSize(size + 'px');
      }
    }

    function changeTheme(themeName) {
      if (rendition) {
        if (themeName === 'dark') {
          rendition.themes.register('dark', {
            body: { 'background-color': '#1a1a1a', color: '#e0e0e0' }
          });
          rendition.themes.select('dark');
        } else {
          rendition.themes.select(null);
        }
      }
    }
  </script>
</body>
</html>
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'progress':
          onProgressChange?.(data.progress, data.chapter);
          break;
        case 'chapter':
          onChapterChange?.(data.chapter, '');
          break;
        case 'ready':
          setLoading(false);
          break;
        case 'error':
          console.error('EPUB Error:', data.message);
          setLoading(false);
          break;
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loading}>
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
        startInLoadingState={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    zIndex: 1000,
  },
  webview: {
    flex: 1,
  },
});
