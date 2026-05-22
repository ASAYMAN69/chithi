// ==================== Initialize Data ====================
const initData = async () => {
    try {
        await API.getUser();
    } catch (e) {
        console.warn('User init failed:', e);
    }
};

// ==================== Initialization ====================
const init = async () => {
    loadLikedNotes();
    await initData();
    loadProfile();
    await loadNotes();
    updateMusicUI();
    loadWeather();

    window.addEventListener('resize', () => {
        resizeWeatherCanvases();
    });
};

// Run checkUser first - it will call init() if authorized
checkUser();

// Start the app
init();
