import { StyleSheet } from 'react-native';
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingTop: 50,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    appIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    }, subIconContainer: {
        position: 'absolute',
        bottom: 7, // Ajusta para posicionar verticalmente
        right: 2, // Ajusta para posicionar horizontalmente
        borderRadius: 12, // Ajusta para redondear el contenedor del sub-icono
        padding: 2, // Añade padding para el sub-icono
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerActionButton: {
        padding: 4,
    },
    sectionHeader: {
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        marginTop: 8,
        zIndex: 10,
        elevation: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    filterDropdownButton: {
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        zIndex: 11,
        elevation: 11,
    },
    filterDropdownText: {
        fontSize: 14,
        fontWeight: '500',
    },
    continueCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        marginHorizontal: 16,
        alignItems: 'center',
        gap: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    continueCover: {
        width: 60,
        height: 90,
        borderRadius: 8,
    },
    continueDetails: {
        flex: 1,
    },
    continueTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    continueAuthor: {
        fontSize: 13,
        marginBottom: 12,
    },
    progressBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    progressBar: {
        height: 4,
        borderRadius: 2,
    },
    progressPercentage: {
        fontSize: 12,
    },
    continueChapter: {
        fontSize: 12,
    },
    emptyList: {
        flexGrow: 1,
    },
    continueReadingContainer: {
        paddingHorizontal: 16,
    },
    listContainer: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    empty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        marginTop: 32,
        marginHorizontal: 16,
        borderRadius: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
    },
    loaderOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loaderContent: {
        padding: 32,
        borderRadius: 20,
        alignItems: 'center',
        width: '80%',
        maxWidth: 320,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    loaderText: {
        marginTop: 20,
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    loaderSubtext: {
        marginTop: 8,
        fontSize: 13,
        textAlign: 'center',
    },
    dropdownOverlay: {
        position: 'absolute',
        // Rompe el contenedor padre expandiéndose a toda la pantalla para capturar el touch
        top: -1000,
        bottom: -1000,
        left: -1000,
        right: -1000,
        backgroundColor: 'transparent',
        zIndex: 40,
    },
    dropdownContent: {
        position: 'absolute',
        // 👇 Esto lo empuja exactamente al límite inferior de tu filterDropdownButton
        top: '100%',
        right: 0,
        marginTop: 4, // Pequeña separación del botón
        width: 130,
        borderRadius: 8,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 50, // Asegura que quede por encima de las listas de libros
    },
    dropdownOption: {
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    dropdownOptionText: {
        fontSize: 14,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
});
export default styles;