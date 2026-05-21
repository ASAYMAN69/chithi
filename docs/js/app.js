// ==================== Storage Manager ====================
const Storage = {
    async save(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
        try {
            if (key === 'userProfile') {
                await API.updateUser({ pfp: data.avatar, bio: data.bio });
            } else if (key === 'musicData') {
                console.log('Music save - using memory only');
            }
        } catch (e) {
            console.warn('Storage save to backend failed:', e);
        }
    },
    async load(key, defaultValue = null) {
        try {
            if (key === 'userProfile') {
                return await API.getUser().catch(() => defaultValue);
            } else if (key === 'musicData') {
                return await API.getMusic().catch(() => defaultValue);
            }
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.warn('Storage load failed:', e);
            return defaultValue;
        }
    },
    remove(key) {
        localStorage.removeItem(key);
    }
};

// ==================== App State ====================
const AppState = {
    currentView: 'canvas',
    currentTool: 'pen',
    currentColor: '#FFB6C1',
    isDrawing: false,
    isPlaying: false,
    weatherTimer: null
};

// ==================== Initialize Data ====================
const initData = async () => {
    try {
        await API.getUser();
    } catch (e) {
        console.warn('User init failed:', e);
    }
};

// ==================== DOM Elements ====================
const elements = {
    // Header buttons
    discWrapper: document.getElementById('discWrapper'),
    avatarBtn: document.getElementById('avatarBtn'),
    avatarEmoji: document.getElementById('avatarEmoji'),

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

    

    // Weather
    weatherBg: document.getElementById('weatherBg'),
    rainCanvas: document.getElementById('rainCanvas'),
    snowCanvas: document.getElementById('snowCanvas'),

    // Toast
    toast: document.getElementById('toast'),

    // Add Note Modal
    addNoteBtn: document.getElementById('addNoteBtn'),
    addNoteModal: document.getElementById('addNoteModal'),
    closeAddNote: document.getElementById('closeAddNote'),
    cancelAddNote: document.getElementById('cancelAddNote'),
    confirmAddNote: document.getElementById('confirmAddNote'),
    noteText: document.getElementById('noteText'),

    // Upload Modal
    uploadModal: document.getElementById('uploadModal'),
    closeUploadModal: document.getElementById('closeUploadModal'),
    cancelUpload: document.getElementById('cancelUpload'),
    confirmUpload: document.getElementById('confirmUpload'),
    uploadDropzone: document.getElementById('uploadDropzone'),
    fileInput: document.getElementById('fileInput'),
    uploadPreview: document.getElementById('uploadPreview'),
    uploadHint: document.getElementById('uploadHint')
};

// ==================== Note Modal ====================
const noteModal = document.getElementById('noteModal');
const noteModalUser = document.getElementById('noteModalUser');
const noteModalText = document.getElementById('noteModalText');
const noteLikeBtn = document.getElementById('noteLikeBtn');
const closeNoteModal = document.getElementById('closeNoteModal');

let currentNoteId = null;
let likedNotes = new Set();

const openNoteModal = async (note) => {
    currentNoteId = note.id;
    const currentUser = localStorage.getItem('user');
    const isOwner = note.username === currentUser;
    
    noteModalUser.textContent = note.username;
    noteModalText.textContent = note.noteText;
    noteModalText.dataset.original = note.noteText;
    
    const colors = ['#FFB6C1', '#87CEEB', '#98D8C8', '#FFD700', '#DDA0DD'];
    const colorIndex = note.username.charCodeAt(0) % colors.length;
    noteModal.style.backgroundColor = colors[colorIndex] + 'cc';
    
    // Set initial state from localStorage immediately
    noteLikeBtn.classList.toggle('liked', likedNotes.has(note.id));
    noteLikeBtn.style.display = isOwner ? 'none' : 'flex';
    
    const editBtn = document.getElementById('editNoteBtn');
    editBtn.style.display = isOwner ? 'flex' : 'none';

    const deleteBtn = document.getElementById('deleteNoteBtn');
    deleteBtn.style.display = isOwner ? 'flex' : 'none';
    
    const likesContainer = document.getElementById('noteLikesContainer');
    if (likesContainer) {
        try {
            const likes = await API.getNoteLikes(note.id);
            // Sync local likedNotes with server state for the current user
            const hasLiked = likes.some(l => l.username === currentUser);
            if (hasLiked) {
                likedNotes.add(note.id);
            } else {
                likedNotes.delete(note.id);
            }
            localStorage.setItem('likedNotes', JSON.stringify([...likedNotes]));
            
            // Update UI with definitive server state
            noteLikeBtn.classList.toggle('liked', hasLiked);

            if (likes.length > 0) {
                likesContainer.innerHTML = `<strong>Liked by:</strong> ${likes.map(l => l.username).join(', ')}`;
                likesContainer.style.display = 'block';
            } else {
                likesContainer.style.display = 'none';
            }
        } catch (e) {
            console.warn('Sync likes failed:', e);
        }
    }
    
    openModal(noteModal);
};

document.getElementById('editNoteBtn').addEventListener('click', () => {
    const currentText = noteModalText.dataset.original;
    document.getElementById('noteText').value = currentText;
    document.querySelector('#addNoteModal .modal-header h3').textContent = 'Edit Note';
    document.getElementById('confirmAddNote').textContent = 'Save';
    closeModal(noteModal);
    openModal(elements.addNoteModal);
});

document.getElementById('deleteNoteBtn').addEventListener('click', () => {
    closeModal(noteModal);
    openModal(document.getElementById('confirmDeleteModal'));
});

document.getElementById('cancelDeleteNote').addEventListener('click', () => {
    closeModal(document.getElementById('confirmDeleteModal'));
    openModal(noteModal);
});

document.getElementById('confirmDeleteNote').addEventListener('click', async () => {
    if (!currentNoteId) return;
    try {
        await API.deleteNote(currentNoteId);
        await loadNotes();
        showToast('Note deleted!');
        closeModal(document.getElementById('confirmDeleteModal'));
    } catch (e) {
        showToast(e.message || 'Delete failed');
    }
});

document.getElementById('confirmAddNote').textContent = 'Add';
document.querySelector('#addNoteModal .modal-header h3').textContent = 'Add Note';

const toggleNoteLike = async () => {
    if (!currentNoteId) return;
    
    try {
        if (likedNotes.has(currentNoteId)) {
            await API.unlikeNote(currentNoteId);
            likedNotes.delete(currentNoteId);
            noteLikeBtn.classList.remove('liked');
        } else {
            const likes = await API.likeNote(currentNoteId);
            likedNotes.add(currentNoteId);
            noteLikeBtn.classList.add('liked');
            const likesContainer = document.getElementById('noteLikesContainer');
            if (likesContainer && likes.length > 0) {
                likesContainer.innerHTML = `<strong>Liked by:</strong> ${likes.map(l => l.username).join(', ')}`;
                likesContainer.style.display = 'block';
            }
        }
        localStorage.setItem('likedNotes', JSON.stringify([...likedNotes]));
    } catch (e) {
        showToast(e.message || 'Action failed');
    }
};

noteLikeBtn.addEventListener('click', toggleNoteLike);
closeNoteModal.addEventListener('click', () => closeModal(noteModal));
noteModal.addEventListener('click', (e) => {
    if (e.target === noteModal) closeModal(noteModal);
});

const loadLikedNotes = () => {
    const stored = localStorage.getItem('likedNotes');
    if (stored) {
        likedNotes = new Set(JSON.parse(stored));
    }
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

// ==================== Profile ====================
let currentUser = null;

const loadProfile = async () => {
    try {
        currentUser = await API.getUser();
        elements.avatarEmoji.textContent = currentUser.pfp || '😊';
        elements.userBio.value = currentUser.bio || '';
        elements.profileAvatarLarge.textContent = currentUser.pfp || '😊';
    } catch (e) {
        console.warn('Load profile failed:', e);
    }
};

const saveProfileData = async () => {
    const pfp = elements.profileAvatarLarge.textContent;
    const bio = elements.userBio.value.trim() || '';
    
    try {
        currentUser = await API.updateUser({ pfp, bio });
        elements.avatarEmoji.textContent = currentUser.pfp;
    } catch (e) {
        console.warn('Save profile failed:', e);
    }
    
    elements.avatarEmoji.textContent = pfp;
    showToast('Saved successfully 💕');
};

// Profile Modal Events
elements.avatarBtn.addEventListener('click', () => openModal(elements.profileModal));
elements.closeProfileModal.addEventListener('click', () => closeModal(elements.profileModal));
elements.cancelProfile.addEventListener('click', () => {
    loadProfile();
    closeModal(elements.profileModal);
});
elements.saveProfile.addEventListener('click', () => {
    saveProfileData();
    closeModal(elements.profileModal);
});
elements.profileModal.addEventListener('click', (e) => {
    if (e.target === elements.profileModal) closeModal(elements.profileModal);
});

// ==================== Music Player ====================
let musicCtx = null;
let musicQueue = [];
let currentIndex = -1;
let isPlaying = false;

const musicData = async () => {
    try {
        musicQueue = await API.getMusic();
    } catch (e) {
        musicQueue = [];
    }
    return { queue: musicQueue, currentIndex, playing: isPlaying };
};

const updateMusicUI = async () => {
    await musicData();
    elements.discWrapper.classList.toggle('playing', isPlaying);

    if (currentIndex >= 0 && musicQueue.length > 0) {
        const song = musicQueue[currentIndex];
        elements.musicCover.src = song.thumbnailPath || 'https://picsum.photos/200?random=music';
        elements.musicTitle.textContent = song.name;
        elements.musicArtist.textContent = song.description || 'Unknown';
    } else {
        elements.musicCover.src = 'https://picsum.photos/200?random=music';
        elements.musicTitle.textContent = 'No music playing';
        elements.musicArtist.textContent = 'Add your favorite song';
    }

    renderSongList();
};

const renderSongList = () => {
    elements.emptyQueue.style.display = musicQueue.length === 0 ? 'block' : 'none';

    const existingItems = elements.songList.querySelectorAll('.song-item');
    existingItems.forEach(item => item.remove());

    musicQueue.forEach((song, index) => {
        const item = document.createElement('div');
        item.className = `song-item ${index === currentIndex ? 'playing' : ''}`;
        item.innerHTML = `
            <div class="song-thumb">
                <img src="${song.thumbnailPath || 'https://picsum.photos/200?random=music'}" alt="${song.name}">
            </div>
            <div class="song-details">
                <div class="song-name">${song.name}</div>
                <div class="song-artist">${song.description || 'Unknown'}</div>
            </div>
            <div class="song-actions">
                <button class="song-action-btn delete" data-index="${index}" aria-label="Delete">
                    <svg viewBox="0 0 24 24">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                </button>
            </div>
        `;
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.song-action-btn')) {
                playSong(index);
            }
        });
        item.querySelector('.delete').addEventListener('click', async (e) => {
            e.stopPropagation();
            await deleteSong(index);
        });
        elements.songList.appendChild(item);
    });
};

const playSong = (index) => {
    if (index >= 0 && index < musicQueue.length) {
        currentIndex = index;
        isPlaying = true;
        updateMusicUI();
        updatePlayIcon();
    }
};

const updatePlayIcon = () => {
    const playIcon = document.getElementById('playIcon');
    playIcon.innerHTML = isPlaying
        ? '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>'
        : '<path d="M8 5v14l11-7z"/>';
};

const togglePlayPause = async () => {
    if (musicQueue.length === 0) {
        showToast('Add a song first');
        return;
    }
    if (currentIndex < 0) {
        currentIndex = 0;
    }
    isPlaying = !isPlaying;
    updateMusicUI();
    updatePlayIcon();
};

const prevSong = () => {
    if (musicQueue.length === 0) return;
    if (currentIndex <= 0) {
        currentIndex = musicQueue.length - 1;
    } else {
        currentIndex--;
    }
    updateMusicUI();
};

const nextSong = () => {
    if (musicQueue.length === 0) return;
    if (currentIndex >= musicQueue.length - 1) {
        currentIndex = 0;
    } else {
        currentIndex++;
    }
    updateMusicUI();
};

const toggleLike = () => {
    if (currentIndex >= 0 && musicQueue[currentIndex]) {
        const song = musicQueue[currentIndex];
        // For now, toggle class locally
        elements.musicLike.classList.toggle('liked');
        showToast(elements.musicLike.classList.contains('liked') ? 'Liked 💕' : 'Unliked');
    }
};

const deleteSong = async (index) => {
    const song = musicQueue[index];
    if (song && song.id) {
        try {
            await API.deleteMusic(song.id);
        } catch (e) {
            console.warn('Delete failed:', e);
        }
    }
    musicQueue.splice(index, 1);
    if (currentIndex >= musicQueue.length) {
        currentIndex = musicQueue.length - 1;
    }
    updateMusicUI();
    showToast('Deleted');
};

const extractYouTubeId = (url) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
};

const addSong = async () => {
    const url = elements.youtubeUrl.value.trim();
    const videoId = extractYouTubeId(url);

    if (!videoId) {
        showToast('Please enter a valid YouTube URL');
        return;
    }

    try {
        const newSong = await API.addMusic({
            musicPath: `https://www.youtube.com/watch?v=${videoId}`,
            thumbnailPath: `https://picsum.photos/200?random=${Date.now()}`,
            name: `Song ${musicQueue.length + 1}`,
            description: '',
            priority: musicQueue.length
        });
        musicQueue.push(newSong);
    } catch (e) {
        console.warn('Add song failed:', e);
    }

    await updateMusicUI();
    closeModal(elements.addSongModal);
    elements.youtubeUrl.value = '';
    showToast('Song added');
};


// Music Modal Events
elements.discWrapper.addEventListener('click', () => {
    openModal(elements.musicModal);
    updateMusicUI();
});
elements.closeMusicModal.addEventListener('click', () => closeModal(elements.musicModal));
elements.musicModal.addEventListener('click', (e) => {
    if (e.target === elements.musicModal) closeModal(elements.musicModal);
});

elements.addSongBtn.addEventListener('click', () => openModal(elements.addSongModal));
elements.closeAddSong.addEventListener('click', () => closeModal(elements.addSongModal));
elements.cancelAddSong.addEventListener('click', () => closeModal(elements.addSongModal));
elements.confirmAddSong.addEventListener('click', addSong);
elements.addSongModal.addEventListener('click', (e) => {
    if (e.target === elements.addSongModal) closeModal(elements.addSongModal);
});

elements.playPause.addEventListener('click', togglePlayPause);
elements.prevSong.addEventListener('click', prevSong);
elements.nextSong.addEventListener('click', nextSong);
elements.musicLike.addEventListener('click', toggleLike);



// ==================== Weather Animation ====================
let raindrops = [];
let snowflakes = [];
let rainCtx, snowCtx;

const initWeather = () => {
    rainCtx = elements.rainCanvas.getContext('2d');
    snowCtx = elements.snowCanvas.getContext('2d');

    resizeWeatherCanvases();
    window.addEventListener('resize', resizeWeatherCanvases);

    requestAnimationFrame(animateRain);
    requestAnimationFrame(animateSnow);
};

const resizeWeatherCanvases = () => {
    elements.rainCanvas.width = window.innerWidth;
    elements.rainCanvas.height = window.innerHeight;
    elements.snowCanvas.width = window.innerWidth;
    elements.snowCanvas.height = window.innerHeight;
};

const mapWeatherCondition = (condition) => {
    const map = {
        'Clear': 'sunny',
        'Mainly Clear': 'sunny',
        'Partly Cloudy': 'cloudy',
        'Overcast': 'cloudy',
        'Fog': 'cloudy',
        'Depositing Rime Fog': 'cloudy',
        'Light Drizzle': 'rainy',
        'Moderate Drizzle': 'rainy',
        'Dense Drizzle': 'rainy',
        'Slight Rain': 'rainy',
        'Moderate Rain': 'rainy',
        'Heavy Rain': 'rainy',
        'Slight Snow': 'snowy',
        'Moderate Snow': 'snowy',
        'Heavy Snow': 'snowy',
        'Slight Showers': 'rainy',
        'Moderate Showers': 'rainy',
        'Violent Showers': 'rainy',
        'Thunderstorm': 'rainy',
        'Thunderstorm with Hail': 'rainy',
        'Thunderstorm with Heavy Hail': 'rainy'
    };
    return map[condition] || 'sunny';
};

const loadWeather = async () => {
    try {
        const weather = await API.getWeather();
        const condition = mapWeatherCondition(weather.weather_condition);
        elements.weatherBg.className = `weather-bg ${condition}`;
        
        setInterval(async () => {
            try {
                const w = await API.getWeather();
                const c = mapWeatherCondition(w.weather_condition);
                elements.weatherBg.className = `weather-bg ${c}`;
            } catch (e) {
                console.warn('Weather refresh failed:', e);
            }
        }, 900000);
    } catch (e) {
        console.warn('Weather load failed:', e);
        elements.weatherBg.className = `weather-bg sunny`;
    }
};

const animateRain = () => {
    rainCtx.clearRect(0, 0, elements.rainCanvas.width, elements.rainCanvas.height);

    // Add new drops
    if (Math.random() < 0.3) {
        raindrops.push({
            x: Math.random() * elements.rainCanvas.width,
            y: -10,
            speed: 8 + Math.random() * 8,
            length: 15 + Math.random() * 15
        });
    }

    // Update and draw drops
    raindrops = raindrops.filter(drop => drop.y < elements.rainCanvas.height);

    raindrops.forEach(drop => {
        rainCtx.beginPath();
        rainCtx.strokeStyle = 'rgba(174, 194, 224, 0.5)';
        rainCtx.lineWidth = 1;
        rainCtx.moveTo(drop.x, drop.y);
        rainCtx.lineTo(drop.x - 2, drop.y + drop.length);
        rainCtx.stroke();
        drop.y += drop.speed;
    });

    requestAnimationFrame(animateRain);
};

const animateSnow = () => {
    snowCtx.clearRect(0, 0, elements.snowCanvas.width, elements.snowCanvas.height);

    // Add new snowflakes
    if (Math.random() < 0.1) {
        snowflakes.push({
            x: Math.random() * elements.snowCanvas.width,
            y: -10,
            speed: 1 + Math.random() * 2,
            size: 2 + Math.random() * 4,
            wobble: Math.random() * Math.PI * 2
        });
    }

    // Update and draw snowflakes
    snowflakes = snowflakes.filter(flake => flake.y < elements.snowCanvas.height);

    snowflakes.forEach(flake => {
        snowCtx.beginPath();
        snowCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        snowCtx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
        snowCtx.fill();

        flake.y += flake.speed;
        flake.wobble += 0.05;
        flake.x += Math.sin(flake.wobble) * 0.5;
    });

    requestAnimationFrame(animateSnow);
};

// ==================== User Auth ====================
const showUserModal = () => {
    const modal = document.getElementById('userModal');
    modal.classList.add('active');
    modal.style.display = 'flex';
    document.getElementById('saveUsername').addEventListener('click', saveUsername);
    document.getElementById('usernameInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveUsername();
    });
};

const hideUserModal = () => {
    const modal = document.getElementById('userModal');
    modal.classList.remove('active');
    modal.style.display = 'none';
};

const checkUser = async () => {
    const user = localStorage.getItem('user');
    if (!user) {
        showUserModal();
        return;
    }
    
    try {
        await API.getUser();
        hideUserModal();
    } catch (e) {
        localStorage.removeItem('user');
        showUserModal();
    }
};

const saveUsername = async () => {
    const name = document.getElementById('usernameInput').value.trim();
    if (!name) {
        showToast('Please enter a name');
        return;
    }
    
    localStorage.setItem('user', name);
    
    try {
        await API.getUser();
        hideUserModal();
        init();
    } catch (e) {
        localStorage.removeItem('user');
        showToast('Username not authorized. Ask the admin to add you.');
    }
};

const loadNotes = async () => {
    try {
        const notes = await API.getNotes();
        const container = document.getElementById('notesDisplay');
        if (!container) return;
        container.innerHTML = '';
        
        const colors = ['#FFB6C1', '#87CEEB', '#98D8C8', '#FFD700', '#DDA0DD'];
        
        notes.forEach((note, index) => {
            const card = document.createElement('div');
            card.className = 'note-card';
            card.style.backgroundColor = colors[index % colors.length];
            card.style.display = 'block';
            card.dataset.id = note.id;
            card.innerHTML = `<h4>${note.username}</h4><p>${note.noteText}</p>`;
            card.addEventListener('click', () => openNoteModal(note));
            container.appendChild(card);
        });
    } catch (err) {
        console.error('Load notes error:', err);
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

// ==================== Add Note ====================
elements.addNoteBtn.addEventListener('click', () => openModal(elements.addNoteModal));
elements.closeAddNote.addEventListener('click', () => closeModal(elements.addNoteModal));
elements.cancelAddNote.addEventListener('click', () => closeModal(elements.addNoteModal));
elements.addNoteModal.addEventListener('click', (e) => {
    if (e.target === elements.addNoteModal) closeModal(elements.addNoteModal);
});

elements.confirmAddNote.addEventListener('click', async () => {
    const text = elements.noteText.value.trim();
    if (!text) {
        showToast('Please write something');
        return;
    }
    
    const isEditing = currentNoteId !== null && document.querySelector('#addNoteModal .modal-header h3').textContent === 'Edit Note';
    
    elements.confirmAddNote.disabled = true;
    elements.addNoteBtn.disabled = true;
    elements.confirmAddNote.textContent = isEditing ? 'Saving...' : 'Adding...';
    
    try {
        if (isEditing) {
            await API.updateNote(currentNoteId, text);
            await loadNotes();
            showToast('Note updated!');
            document.querySelector('#addNoteModal .modal-header h3').textContent = 'Add Note';
            document.getElementById('confirmAddNote').textContent = 'Add';
            currentNoteId = null;
        } else {
            await API.createNote(text);
            await loadNotes();
            showToast('Note added!');
        }
    } catch (e) {
        showToast(e.message || 'Failed to save note');
    }
    
    elements.noteText.value = '';
    elements.confirmAddNote.disabled = false;
    elements.addNoteBtn.disabled = false;
    if (!isEditing) elements.confirmAddNote.textContent = 'Add';
    closeModal(elements.addNoteModal);
});

// ==================== Upload ====================
let uploadType = 'image';
let selectedFile = null;

document.querySelectorAll('.upload-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.upload-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        uploadType = tab.dataset.type;
        
        const hints = { image: 'Max 5MB (jpg, png, gif, webp)', music: 'Max 50MB (mp3, wav, ogg)', video: 'Max 100MB (mp4, webm)' };
        elements.uploadHint.textContent = hints[uploadType];
        
        const accepts = { image: 'image/*', music: 'audio/*', video: 'video/*' };
        elements.fileInput.accept = accepts[uploadType];
    });
});

elements.uploadDropzone.addEventListener('click', () => elements.fileInput.click());
elements.fileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) handleFileSelect(e.target.files[0]);
});

elements.closeUploadModal.addEventListener('click', () => closeModal(elements.uploadModal));
elements.cancelUpload.addEventListener('click', () => closeModal(elements.uploadModal));
elements.uploadModal.addEventListener('click', (e) => {
    if (e.target === elements.uploadModal) closeModal(elements.uploadModal);
});

const handleFileSelect = (file) => {
    selectedFile = file;
    document.getElementById('fileName').textContent = file.name;
    elements.uploadPreview.style.display = 'block';
    
    const previewImg = document.getElementById('previewImg');
    const previewAudio = document.getElementById('previewAudio');
    const previewVideo = document.getElementById('previewVideo');
    
    previewImg.style.display = 'none';
    previewAudio.style.display = 'none';
    previewVideo.style.display = 'none';
    
    if (file.type.startsWith('image/')) {
        previewImg.src = URL.createObjectURL(file);
        previewImg.style.display = 'block';
    } else if (file.type.startsWith('audio/')) {
        previewAudio.src = URL.createObjectURL(file);
        previewAudio.style.display = 'block';
    } else if (file.type.startsWith('video/')) {
        previewVideo.src = URL.createObjectURL(file);
        previewVideo.style.display = 'block';
    }
};

elements.confirmUpload.addEventListener('click', async () => {
    if (!selectedFile) {
        showToast('Select a file first');
        return;
    }
    
    try {
        const result = await API.uploadFile(uploadType, selectedFile);
        showToast('Uploaded! URL: ' + result.url);
        closeModal(elements.uploadModal);
        elements.uploadPreview.style.display = 'none';
        selectedFile = null;
    } catch (e) {
        showToast('Upload failed');
    }
});

// Add upload button to music modal
const uploadBtn = document.createElement('button');
uploadBtn.className = 'add-song-btn';
uploadBtn.textContent = 'Upload File';
uploadBtn.style.marginTop = '10px';
uploadBtn.addEventListener('click', () => {
    closeModal(elements.musicModal);
    openModal(elements.uploadModal);
});
document.getElementById('songList').parentElement.appendChild(uploadBtn);

// Start the app
init();
