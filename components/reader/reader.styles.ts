import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    paddingRight: 24,
  },
  headerLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '70%',
    overflow: 'hidden',
    gap: 12,
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    fontSize: 16,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'left',
    fontSize: 14,
    fontWeight: '600',
  },
  headerAutor: {
    flex: 1,
    textAlign: 'left',
    fontSize: 12,
    fontWeight: '400',
  },
  headerActions: {
    flexDirection: 'row',
  },
  unifiedBottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    // Espacio de seguridad generoso abajo para evitar interferencias con la navegación del móvil
    paddingBottom: 34,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressChapterText: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
  },
  progressStatsRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressStatText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sliderContainer: {
    width: '100%',
    height: 40,
    justifyContent: 'center',
  },
  pageSlider: {
    width: '100%',
    height: 40,
  },
  bottomBarButtonsRow: {
    flexDirection: 'column',
    justifyContent: 'center', // Centra el botón horizontalmente
    alignItems: 'center',
    marginTop: 4,
  },
  centerChaptersButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBarButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  chapterItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  chapterLabel: {
    fontSize: 16,
  },
  emptyChaptersText: {
    textAlign: 'center',
    paddingVertical: 24,
    fontSize: 15,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 16,
  },
  themeToggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  themeToggleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  fontSizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fontButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fontSizeValue: {
    fontSize: 16,
    minWidth: 50,
    textAlign: 'center',
  },
  progressInfo: {
    marginTop: 16,
    paddingTop: 16,
  },
  progressLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  progressValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  subChapterLabel: {
    fontSize: 14,
    fontWeight: '400', // Un poco más delgado que el capítulo principal
  },
  dictionaryOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Un fondo oscuro sutil
    justifyContent: 'flex-end', // Lo posiciona abajo como un bottom sheet
  },
  dictionaryContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 20,
    paddingBottom: 34, // Control de área segura
  },
  dictionaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dictionaryWord: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    marginRight: 10,
  },
  closeDictionaryButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  dictionaryTranslation: {
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
  },
});

export default styles;