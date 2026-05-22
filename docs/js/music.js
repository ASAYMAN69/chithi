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
        elements.musicLike.classList.toggle('liked');
        showToast(elements.musicLike.classList.contains('liked') ? 'Liked \u{1F495}' : 'Unliked');
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
