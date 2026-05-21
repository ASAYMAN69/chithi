// ==================== Initialize Data ====================
const initData = () => {
    // Profile
    if (!localStorage.getItem('userProfile')) {
        Storage.save('userProfile', {
            name: '亲爱的',
            bio: '永远在一起 💕',
            avatar: '😊'
        });
    }

    // Music
    if (!localStorage.getItem('musicData')) {
        Storage.save('musicData', {
            queue: [],
            currentIndex: -1,
            playing: false
        });
    }

    // Reels
    if (!localStorage.getItem('reelsData')) {
        Storage.save('reelsData', {
            items: [],
            currentIndex: 0
        });
    }

    // Canvas notes
    if (!localStorage.getItem('canvasNotes')) {
        Storage.save('canvasNotes', []);
    }
};

// ==================== Initialization ====================
const init = () => {
    initData();
    loadProfile();
    updateMusicUI();
    resizeCanvas();
    renderNotes();
    initWeather();

    window.addEventListener('resize', () => {
        resizeCanvas();
        resizeWeatherCanvases();
    });

    // Load saved weather
    const savedWeather = Storage.load('currentWeather', 'sunny');
    elements.weatherBg.className = `weather-bg ${savedWeather}`;
};

// Start the app
init();
