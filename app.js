// ==================== Storage Manager ====================
const Storage = {
    save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.warn('Storage save failed:', e);
        }
    },
    load(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.warn('Storage load failed:', e);
            return defaultValue;
        }
    },
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn('Storage remove failed:', e);
        }
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
const initData = () => {
    // Profile
    if (!localStorage.getItem('userProfile')) {
        Storage.save('userProfile', {
            name: 'Dear',
            bio: 'Together forever 💕',
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

    // Load canvas image
    const savedImage = Storage.load('canvasImage');
    if (savedImage && elements.drawingCanvas) {
        const img = new Image();
        img.onload = () => {
            elements.drawingCanvas.getContext('2d').drawImage(img, 0, 0);
        };
        img.src = savedImage;
    }
};

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

// ==================== Profile ====================
const loadProfile = () => {
    const profile = Storage.load('userProfile');
    if (profile) {
        elements.avatarEmoji.textContent = profile.avatar;
        elements.userName.value = profile.name;
        elements.userBio.value = profile.bio;
        elements.profileAvatarLarge.textContent = profile.avatar;
    }
};

const saveProfileData = () => {
    const profile = {
        name: elements.userName.value.trim() || 'Dear',
        bio: elements.userBio.value.trim() || 'Together forever 💕',
        avatar: elements.profileAvatarLarge.textContent
    };
    Storage.save('userProfile', profile);
    elements.avatarEmoji.textContent = profile.avatar;
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

const musicData = () => Storage.load('musicData');

const updateMusicUI = () => {
    const data = musicData();
    elements.discWrapper.classList.toggle('playing', data.playing);

    if (data.currentIndex >= 0 && data.queue.length > 0) {
        const song = data.queue[data.currentIndex];
        elements.musicCover.src = song.thumbnail;
        elements.musicTitle.textContent = song.title;
        elements.musicArtist.textContent = song.artist;
        elements.musicLike.classList.toggle('liked', song.liked);
    } else {
        elements.musicCover.src = 'https://picsum.photos/200?random=music';
        elements.musicTitle.textContent = 'No music playing';
        elements.musicArtist.textContent = 'Add your favorite song';
        elements.musicLike.classList.remove('liked');
    }

    renderSongList();
};

const renderSongList = () => {
    const data = musicData();
    elements.emptyQueue.style.display = data.queue.length === 0 ? 'block' : 'none';

    const existingItems = elements.songList.querySelectorAll('.song-item');
    existingItems.forEach(item => item.remove());

    data.queue.forEach((song, index) => {
        const item = document.createElement('div');
        item.className = `song-item ${index === data.currentIndex ? 'playing' : ''}`;
        item.innerHTML = `
            <div class="song-thumb">
                <img src="${song.thumbnail}" alt="${song.title}">
            </div>
            <div class="song-details">
                <div class="song-name">${song.title}</div>
                <div class="song-artist">${song.artist}</div>
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
        item.querySelector('.delete').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteSong(index);
        });
        elements.songList.appendChild(item);
    });
};

const playSong = (index) => {
    const data = musicData();
    if (index >= 0 && index < data.queue.length) {
        data.currentIndex = index;
        data.playing = true;
        Storage.save('musicData', data);
        updateMusicUI();
        updatePlayIcon();
    }
};

const updatePlayIcon = () => {
    const data = musicData();
    const playIcon = document.getElementById('playIcon');
    playIcon.innerHTML = data.playing
        ? '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>'
        : '<path d="M8 5v14l11-7z"/>';
};

const togglePlayPause = () => {
    const data = musicData();
    if (data.queue.length === 0) {
        showToast('Add a song first');
        return;
    }
    if (data.currentIndex < 0) {
        data.currentIndex = 0;
    }
    data.playing = !data.playing;
    Storage.save('musicData', data);
    updateMusicUI();
    updatePlayIcon();
};

const prevSong = () => {
    const data = musicData();
    if (data.queue.length === 0) return;
    if (data.currentIndex <= 0) {
        data.currentIndex = data.queue.length - 1;
    } else {
        data.currentIndex--;
    }
    Storage.save('musicData', data);
    updateMusicUI();
};

const nextSong = () => {
    const data = musicData();
    if (data.queue.length === 0) return;
    if (data.currentIndex >= data.queue.length - 1) {
        data.currentIndex = 0;
    } else {
        data.currentIndex++;
    }
    Storage.save('musicData', data);
    updateMusicUI();
};

const toggleLike = () => {
    const data = musicData();
    if (data.currentIndex >= 0) {
        data.queue[data.currentIndex].liked = !data.queue[data.currentIndex].liked;
        Storage.save('musicData', data);
        updateMusicUI();
    }
};

const deleteSong = (index) => {
    const data = musicData();
    data.queue.splice(index, 1);
    if (data.currentIndex >= data.queue.length) {
        data.currentIndex = data.queue.length - 1;
    }
    Storage.save('musicData', data);
    updateMusicUI();
    showToast('Deleted');
};

const extractYouTubeId = (url) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
};

const addSong = () => {
    const url = elements.youtubeUrl.value.trim();
    const videoId = extractYouTubeId(url);

    if (!videoId) {
        showToast('Please enter a valid YouTube URL');
        return;
    }

    const data = musicData();
    const song = {
        id: Date.now().toString(),
        youtubeId: videoId,
        title: `Song ${data.queue.length + 1}`,
        artist: 'Unknown Artist',
        thumbnail: `https://picsum.photos/200?random=${Date.now()}`,
        liked: false
    };

    data.queue.push(song);
    Storage.save('musicData', data);
    updateMusicUI();
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

// ==================== Reels ====================
const reelsData = () => Storage.load('reelsData');

const renderReels = () => {
    const data = reelsData();
    elements.reelsList.innerHTML = '';

    if (data.items.length === 0) {
        elements.reelsList.innerHTML = `
            <div class="reel-item">
                <div class="reel-info">
                    <div class="empty-state" style="color: white;">
                        <svg viewBox="0 0 24 24" fill="white">
                            <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
                        </svg>
                        <p>No feed yet<br>Click bottom-right to post your first video</p>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    data.items.forEach((reel, index) => {
        const item = document.createElement('div');
        item.className = 'reel-item';
        item.innerHTML = `
            <div class="reel-video-container">
                <iframe
                    class="reel-video"
                    src="https://www.youtube.com/embed/${reel.videoId}?autoplay=0&mute=1"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen>
                </iframe>
            </div>
            <div class="reel-info">
                <div class="reel-actions">
                    <div class="reel-action">
                        <button class="reel-action-btn ${reel.liked ? 'liked' : ''}" data-index="${index}">
                            <svg viewBox="0 0 24 24">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                        </button>
                        <span class="reel-action-count">${reel.likes}</span>
                    </div>
                </div>
                <div class="reel-title">${reel.title}</div>
                <div class="reel-desc">${reel.description}</div>
            </div>
        `;
        item.querySelector('.reel-action-btn').addEventListener('click', () => toggleReelLike(index));
        elements.reelsList.appendChild(item);
    });
};

const toggleReelLike = (index) => {
    const data = reelsData();
    data.items[index].liked = !data.items[index].liked;
    if (data.items[index].liked) {
        data.items[index].likes++;
    } else {
        data.items[index].likes--;
    }
    Storage.save('reelsData', data);
    renderReels();
};

const addReel = () => {
    const url = elements.reelVideoUrl.value.trim();
    const videoId = extractYouTubeId(url);

    if (!videoId) {
        showToast('Please enter a valid YouTube URL');
        return;
    }

    const title = elements.reelTitle.value.trim() || 'No title';
    const description = elements.reelDesc.value.trim() || '';

    const data = reelsData();
    data.items.unshift({
        id: Date.now().toString(),
        videoId: videoId,
        title: title,
        description: description,
        likes: 0,
        liked: false,
        createdAt: new Date().toISOString()
    });

    Storage.save('reelsData', data);
    renderReels();
    closeModal(elements.addReelModal);
    elements.reelVideoUrl.value = '';
    elements.reelTitle.value = '';
    elements.reelDesc.value = '';
    showToast('Feed published');
};

const switchToReels = () => {
    AppState.currentView = 'reels';
    elements.canvasView.classList.add('hidden');
    elements.reelsView.classList.add('active');
    renderReels();
};

const switchToCanvas = () => {
    AppState.currentView = 'canvas';
    elements.canvasView.classList.remove('hidden');
    elements.reelsView.classList.remove('active');
};

// Reels Events
elements.videoBtn.addEventListener('click', switchToReels);
elements.backToCanvas.addEventListener('click', switchToCanvas);
elements.addReelBtn.addEventListener('click', () => openModal(elements.addReelModal));
elements.closeAddReel.addEventListener('click', () => closeModal(elements.addReelModal));
elements.cancelAddReel.addEventListener('click', () => closeModal(elements.addReelModal));
elements.confirmAddReel.addEventListener('click', addReel);
elements.addReelModal.addEventListener('click', (e) => {
    if (e.target === elements.addReelModal) closeModal(elements.addReelModal);
});

// ==================== Canvas Drawing ====================
const canvas = elements.drawingCanvas;
const ctx = canvas.getContext('2d');
let lastPos = { x: 0, y: 0 };
let currentDrawing = [];

const resizeCanvas = () => {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
};

const getTouchPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
    };
};

const startDrawing = (e) => {
    e.preventDefault();
    AppState.isDrawing = true;
    const pos = getTouchPos(e);
    lastPos = pos;
    currentDrawing = [{
        x: pos.x,
        y: pos.y,
        color: AppState.currentColor,
        width: AppState.currentTool === 'eraser' ? 20 : 3,
        isEraser: AppState.currentTool === 'eraser'
    }];
};

const draw = (e) => {
    if (!AppState.isDrawing) return;
    e.preventDefault();

    const pos = getTouchPos(e);

    ctx.beginPath();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (AppState.currentTool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.lineWidth = 20;
    } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = AppState.currentColor;
        ctx.lineWidth = 3;
    }

    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    currentDrawing.push({
        x: pos.x,
        y: pos.y,
        color: AppState.currentColor,
        width: AppState.currentTool === 'eraser' ? 20 : 3,
        isEraser: AppState.currentTool === 'eraser'
    });

    lastPos = pos;
};

const stopDrawing = () => {
    AppState.isDrawing = false;
    currentDrawing = [];
    Storage.save('canvasImage', canvas.toDataURL());
};

// Canvas Events
canvas.addEventListener('touchstart', startDrawing, { passive: false });
canvas.addEventListener('touchmove', draw, { passive: false });
canvas.addEventListener('touchend', stopDrawing);
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseleave', stopDrawing);

// Tool Selection
elements.penTool.addEventListener('click', () => {
    AppState.currentTool = 'pen';
    elements.penTool.classList.add('active');
    elements.eraserTool.classList.remove('active');
    elements.noteTool.classList.remove('active');
});

elements.eraserTool.addEventListener('click', () => {
    AppState.currentTool = 'eraser';
    elements.eraserTool.classList.add('active');
    elements.penTool.classList.remove('active');
    elements.noteTool.classList.remove('active');
});

elements.noteTool.addEventListener('click', () => {
    elements.noteTool.classList.add('active');
    elements.penTool.classList.remove('active');
    elements.eraserTool.classList.remove('active');
});

// Color Selection
elements.colorPicker.addEventListener('click', (e) => {
    const dot = e.target.closest('.color-dot');
    if (dot) {
        elements.colorPicker.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
        dot.classList.add('selected');
        AppState.currentColor = dot.dataset.color;
    }
});

// Sticky Notes
const createNote = (x, y) => {
    const notes = Storage.load('canvasNotes') || [];
    const note = {
        id: Date.now().toString(),
        x: x,
        y: y,
        content: '',
        color: AppState.currentColor,
        width: 150,
        height: 100
    };
    notes.push(note);
    Storage.save('canvasNotes', notes);
    renderNotes();
};

const renderNotes = () => {
    const notes = Storage.load('canvasNotes') || [];
    elements.notesContainer.innerHTML = '';

    notes.forEach(note => {
        const el = document.createElement('div');
        el.className = 'sticky-note';
        el.id = `note-${note.id}`;
        el.style.cssText = `
            left: ${note.x}px;
            top: ${note.y}px;
            background: ${note.color}20;
            border-left: 4px solid ${note.color};
        `;
        el.innerHTML = `
            <textarea class="sticky-note-content" style="color: ${note.color};">${note.content}</textarea>
            <button class="sticky-note-delete" aria-label="Delete">×</button>
        `;

        const textarea = el.querySelector('textarea');
        textarea.addEventListener('input', () => {
            const notes = Storage.load('canvasNotes') || [];
            const idx = notes.findIndex(n => n.id === note.id);
            if (idx >= 0) {
                notes[idx].content = textarea.value;
                Storage.save('canvasNotes', notes);
            }
        });

        const deleteBtn = el.querySelector('.sticky-note-delete');
        deleteBtn.addEventListener('click', () => {
            const notes = Storage.load('canvasNotes') || [];
            const idx = notes.findIndex(n => n.id === note.id);
            if (idx >= 0) {
                notes.splice(idx, 1);
                Storage.save('canvasNotes', notes);
                el.remove();
                showToast('Note deleted');
            }
        });

        // Drag functionality
        let isDragging = false;
        let startX, startY;

        el.addEventListener('touchstart', (e) => {
            if (e.target === textarea) return;
            isDragging = true;
            startX = e.touches[0].clientX - note.x;
            startY = e.touches[0].clientY - note.y;
        });

        el.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            note.x = e.touches[0].clientX - startX;
            note.y = e.touches[0].clientY - startY;
            el.style.left = `${note.x}px`;
            el.style.top = `${note.y}px`;
        });

        el.addEventListener('touchend', () => {
            if (isDragging) {
                isDragging = false;
                const notes = Storage.load('canvasNotes') || [];
                const idx = notes.findIndex(n => n.id === note.id);
                if (idx >= 0) {
                    notes[idx].x = note.x;
                    notes[idx].y = note.y;
                    Storage.save('canvasNotes', notes);
                }
            }
        });

        elements.notesContainer.appendChild(el);
    });
};

canvas.addEventListener('dblclick', (e) => {
    if (AppState.currentTool === 'note') {
        const pos = getTouchPos(e);
        createNote(pos.x - 75, pos.y - 50);
    }
});

// Click to create note
elements.noteTool.addEventListener('click', () => {
    showToast('Double-tap canvas to create note');
});

// ==================== Weather Animation ====================
const weatherTypes = ['sunny', 'rainy', 'cloudy', 'snowy'];
let raindrops = [];
let snowflakes = [];
let rainCtx, snowCtx;

const initWeather = () => {
    // Initialize canvases
    rainCtx = elements.rainCanvas.getContext('2d');
    snowCtx = elements.snowCanvas.getContext('2d');

    resizeWeatherCanvases();
    window.addEventListener('resize', resizeWeatherCanvases);

    // Start weather cycle
    changeWeather();
    setInterval(changeWeather, 15000);

    // Start animations
    requestAnimationFrame(animateRain);
    requestAnimationFrame(animateSnow);
};

const resizeWeatherCanvases = () => {
    elements.rainCanvas.width = window.innerWidth;
    elements.rainCanvas.height = window.innerHeight;
    elements.snowCanvas.width = window.innerWidth;
    elements.snowCanvas.height = window.innerHeight;
};

const changeWeather = () => {
    const randomWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
    elements.weatherBg.className = `weather-bg ${randomWeather}`;
    Storage.save('currentWeather', randomWeather);
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
