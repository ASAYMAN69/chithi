// ==================== DOM Elements ====================
const elements = {
    // Views
    canvasView: document.getElementById('canvasView'),
    reelsView: document.getElementById('reelsView'),

    // Header buttons
    videoBtn: document.getElementById('videoBtn'),
    discWrapper: document.getElementById('discWrapper'),
    avatarBtn: document.getElementById('avatarBtn'),
    avatarEmoji: document.getElementById('avatarEmoji'),

    // Canvas
    drawingCanvas: document.getElementById('drawingCanvas'),
    notesContainer: document.getElementById('notesContainer'),
    penTool: document.getElementById('penTool'),
    eraserTool: document.getElementById('eraserTool'),
    noteTool: document.getElementById('noteTool'),
    colorPicker: document.getElementById('colorPicker'),

    // Reels
    reelsList: document.getElementById('reelsList'),
    backToCanvas: document.getElementById('backToCanvas'),
    addReelBtn: document.getElementById('addReelBtn'),

    // Profile Modal
    profileModal: document.getElementById('profileModal'),
    closeProfileModal: document.getElementById('closeProfileModal'),
    cancelProfile: document.getElementById('cancelProfile'),
    saveProfile: document.getElementById('saveProfile'),
    profileAvatarLarge: document.getElementById('profileAvatarLarge'),
    userName: document.getElementById('userName'),
    userBio: document.getElementById('userBio'),

    // Music Modal
    musicModal: document.getElementById('musicModal'),
    closeMusicModal: document.getElementById('closeMusicModal'),
    addSongBtn: document.getElementById('addSongBtn'),
    playPause: document.getElementById('playPause'),
    prevSong: document.getElementById('prevSong'),
    nextSong: document.getElementById('nextSong'),
    musicLike: document.getElementById('musicLike'),
    musicCover: document.getElementById('musicCover'),
    musicTitle: document.getElementById('musicTitle'),
    musicArtist: document.getElementById('musicArtist'),
    songList: document.getElementById('songList'),
    emptyQueue: document.getElementById('emptyQueue'),

    // Add Song Modal
    addSongModal: document.getElementById('addSongModal'),
    closeAddSong: document.getElementById('closeAddSong'),
    cancelAddSong: document.getElementById('cancelAddSong'),
    confirmAddSong: document.getElementById('confirmAddSong'),
    youtubeUrl: document.getElementById('youtubeUrl'),

    // Add Reel Modal
    addReelModal: document.getElementById('addReelModal'),
    closeAddReel: document.getElementById('closeAddReel'),
    cancelAddReel: document.getElementById('cancelAddReel'),
    confirmAddReel: document.getElementById('confirmAddReel'),
    reelVideoUrl: document.getElementById('reelVideoUrl'),
    reelTitle: document.getElementById('reelTitle'),
    reelDesc: document.getElementById('reelDesc'),

    // Weather
    weatherBg: document.getElementById('weatherBg'),
    rainCanvas: document.getElementById('rainCanvas'),
    snowCanvas: document.getElementById('snowCanvas'),

    // Toast
    toast: document.getElementById('toast')
};

// ==================== Toast ====================
const showToast = (message) => {
    elements.toast.textContent = message;
    elements.toast.classList.add('show');
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 2000);
};

// ==================== Modal Helpers ====================
const openModal = (modal) => modal.classList.add('active');
const closeModal = (modal) => modal.classList.remove('active');
