const DISC_PLACEHOLDER = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#2a2a2a"/><circle cx="50" cy="50" r="47" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="2" stroke-dasharray="3,3"/><circle cx="50" cy="50" r="14" fill="url(#g)"/><defs><radialGradient id="g"><stop stop-color="#FF8FAF" offset="0%"/><stop stop-color="#FF4D7D" offset="100%"/></radialGradient></defs></svg>`)}`;

// ==================== Disc Hint Bubble ====================
let hintDismissed = false;

const showHint = () => {
    if (hintDismissed) return;
    elements.discHint.classList.remove('hiding');
    elements.discHint.classList.add('visible');
};

const hideHint = () => {
    hintDismissed = true;
    elements.discHint.classList.remove('visible');
    elements.discHint.classList.add('hiding');
    setTimeout(() => {
        elements.discHint.style.display = 'none';
    }, 360);
};

elements.discHint.addEventListener('click', hideHint);

// Show hint after a moment
setTimeout(showHint, 800);

// ==================== Music Player ====================
let musicCtx = null;
let musicQueue = [];
let currentIndex = -1;
let isPlaying = false;

const audioPlayer = new Audio();
audioPlayer.preload = 'auto';

audioPlayer.addEventListener('ended', () => {
    nextSong();
});

audioPlayer.addEventListener('error', () => {
    showToast('Failed to play audio');
    isPlaying = false;
    updatePlayIcon();
});

const formatTime = (t) => {
    if (!t || isNaN(t)) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

const updateVolumeIcon = () => {
    const vol = getDisplayVolume();
    const svg = elements.volumeBtn.querySelector('svg');
    if (audioPlayer.muted || vol === 0) {
        svg.innerHTML = '<path d="M3 9v6h4l5 5V4L7 9H3zm13 0l-2-2-2 2-1.5-1.5 2-2-2-2L12 2.5 14 4.5l2-2 1.5 1.5-2 2 2 2z"/>';
    } else if (vol < 0.5) {
        svg.innerHTML = '<path d="M3 9v6h4l5 5V4L7 9H3zm8 0l2 2-2 2 1 1 3-3-3-3z"/>';
    } else {
        svg.innerHTML = '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>';
    }
};

const getDisplayVolume = () => {
    return Math.sqrt(audioPlayer.volume || 0.5);
};

const setLogVolume = (raw) => {
    audioPlayer.volume = raw * raw;
};

audioPlayer.addEventListener('timeupdate', () => {
    const pct = audioPlayer.duration ? (audioPlayer.currentTime / audioPlayer.duration) * 100 : 0;
    elements.progressFill.style.width = `${pct}%`;
    elements.currentTime.textContent = formatTime(audioPlayer.currentTime);
});

audioPlayer.addEventListener('loadedmetadata', () => {
    elements.totalTime.textContent = formatTime(audioPlayer.duration);
});

audioPlayer.addEventListener('volumechange', () => {
    const display = getDisplayVolume();
    elements.volumeFill.style.width = `${display * 100}%`;
    updateVolumeIcon();
});

elements.progressBar.addEventListener('click', (e) => {
    if (!audioPlayer.duration) return;
    const rect = elements.progressBar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioPlayer.currentTime = ratio * audioPlayer.duration;
});

elements.volumeTrack.addEventListener('click', (e) => {
    const rect = elements.volumeTrack.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    elements.volumeFill.style.width = `${ratio * 100}%`;
    setLogVolume(ratio);
});

elements.volumeBtn.addEventListener('click', () => {
    audioPlayer.muted = !audioPlayer.muted;
    updateVolumeIcon();
});

setLogVolume(Math.sqrt(0.5));
elements.volumeFill.style.width = `${Math.sqrt(0.5) * 100}%`;
updateVolumeIcon();

let musicUploadKey = null;
let musicUploadFile = null;

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
        elements.musicCover.src = song.thumbnailPath || DISC_PLACEHOLDER;
        elements.musicTitle.textContent = song.name;
        elements.musicArtist.textContent = song.description || 'Unknown';
    } else {
        elements.musicCover.src = DISC_PLACEHOLDER;
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
        const thumb = song.thumbnailPath ? escapeHtml(song.thumbnailPath) : DISC_PLACEHOLDER;
        const sName = escapeHtml(song.name || '');
        const sDesc = escapeHtml(song.description || 'Unknown');
        item.innerHTML = `
            <div class="song-thumb">
                <img src="${thumb}" alt="${sName}">
            </div>
            <div class="song-details">
                <div class="song-name">${sName}</div>
                <div class="song-artist">${sDesc}</div>
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
        const song = musicQueue[currentIndex];
        const fullUrl = song.musicPath.startsWith('http') ? song.musicPath : `${CONNECTION_URL}${song.musicPath}`;
        audioPlayer.src = fullUrl;
        audioPlayer.play().then(() => {
            isPlaying = true;
            updateMusicUI();
            updatePlayIcon();
        }).catch(() => {});
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
        const song = musicQueue[0];
        const fullUrl = song.musicPath.startsWith('http') ? song.musicPath : `${CONNECTION_URL}${song.musicPath}`;
        audioPlayer.src = fullUrl;
    }
    if (audioPlayer.paused) {
        audioPlayer.play().then(() => {
            isPlaying = true;
            updateMusicUI();
            updatePlayIcon();
        }).catch(() => {});
    } else {
        audioPlayer.pause();
        isPlaying = false;
        updateMusicUI();
        updatePlayIcon();
    }
};

const prevSong = () => {
    if (musicQueue.length === 0) return;
    if (currentIndex <= 0) {
        currentIndex = musicQueue.length - 1;
    } else {
        currentIndex--;
    }
    const song = musicQueue[currentIndex];
    const fullUrl = song.musicPath.startsWith('http') ? song.musicPath : `${CONNECTION_URL}${song.musicPath}`;
    audioPlayer.src = fullUrl;
    audioPlayer.play().then(() => {
        isPlaying = true;
        updateMusicUI();
        updatePlayIcon();
    }).catch(() => {});
};

const nextSong = () => {
    if (musicQueue.length === 0) return;
    if (currentIndex >= musicQueue.length - 1) {
        currentIndex = 0;
    } else {
        currentIndex++;
    }
    const song = musicQueue[currentIndex];
    const fullUrl = song.musicPath.startsWith('http') ? song.musicPath : `${CONNECTION_URL}${song.musicPath}`;
    audioPlayer.src = fullUrl;
    audioPlayer.play().then(() => {
        isPlaying = true;
        updateMusicUI();
        updatePlayIcon();
    }).catch(() => {});
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

// ==================== Add Song Flow ====================

const switchMusicTab = (tab) => {
    const tabs = [elements.musicTabUpload, elements.musicTabYoutube];
    const panels = [elements.uploadPanel, elements.youtubePanel];

    tabs.forEach(t => t.classList.remove('active'));
    panels.forEach(p => p.classList.remove('active'));

    if (tab === 'upload') {
        elements.musicTabUpload.classList.add('active');
        elements.uploadPanel.classList.add('active');
    }
};

const resetMusicUpload = () => {
    musicUploadKey = null;
    musicUploadFile = null;
    elements.musicDropzone.style.display = 'block';
    elements.musicUploading.style.display = 'none';
    elements.musicMeta.style.display = 'none';
    elements.musicPreview.src = '';
    elements.musicName.value = '';
    elements.musicAuthor.value = '';
    elements.musicFileInput.value = '';
    elements.confirmAddSong.disabled = true;
    elements.confirmAddSong.textContent = 'Select a file';
    switchMusicTab('upload');
};

const handleMusicFileSelect = async (file) => {
    if (!file || !file.type.startsWith('audio/')) {
        showToast('Please select an audio file');
        return;
    }
    if (file.size > 50 * 1024 * 1024) {
        showToast('File must be under 50MB');
        return;
    }

    elements.musicPreview.src = URL.createObjectURL(file);
    musicUploadFile = file;

    elements.musicDropzone.style.display = 'none';
    elements.musicUploading.style.display = 'block';
    elements.confirmAddSong.disabled = true;
    elements.confirmAddSong.textContent = 'Uploading...';

    try {
        const result = await API.uploadMusicFile(file);
        musicUploadKey = result.key;

        try {
            if (window.jsmediatags) {
                window.jsmediatags.read(file, {
                    onSuccess: (tag) => {
                        elements.musicName.value = tag.tags.title || file.name.replace(/\.[^/.]+$/, '');
                        elements.musicAuthor.value = tag.tags.artist || 'Unknown';
                    },
                    onError: () => {
                        elements.musicName.value = file.name.replace(/\.[^/.]+$/, '');
                        elements.musicAuthor.value = 'Unknown';
                    }
                });
            } else {
                elements.musicName.value = file.name.replace(/\.[^/.]+$/, '');
                elements.musicAuthor.value = 'Unknown';
            }
        } catch (e) {
            elements.musicName.value = file.name.replace(/\.[^/.]+$/, '');
            elements.musicAuthor.value = 'Unknown';
        }

        elements.musicUploading.style.display = 'none';
        elements.musicMeta.style.display = 'block';
        elements.confirmAddSong.disabled = false;
        elements.confirmAddSong.textContent = 'Add to Playlist';
    } catch (e) {
        showToast('Upload failed: ' + (e.message || 'Unknown error'));
        musicUploadKey = null;
        elements.musicUploading.style.display = 'none';
        elements.musicDropzone.style.display = 'block';
        elements.confirmAddSong.disabled = true;
        elements.confirmAddSong.textContent = 'Select a file';
    }
};

elements.musicTabUpload.addEventListener('click', () => switchMusicTab('upload'));

elements.musicDropzone.addEventListener('click', () => elements.musicFileInput.click());
elements.musicFileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) handleMusicFileSelect(e.target.files[0]);
});

elements.cancelAddSong.addEventListener('click', () => {
    resetMusicUpload();
    closeModal(elements.addSongModal);
});
elements.closeAddSong.addEventListener('click', () => {
    resetMusicUpload();
    closeModal(elements.addSongModal);
});
elements.addSongModal.addEventListener('click', (e) => {
    if (e.target === elements.addSongModal) {
        resetMusicUpload();
        closeModal(elements.addSongModal);
    }
});

elements.confirmAddSong.addEventListener('click', async () => {
    if (!musicUploadKey) return;

    elements.confirmAddSong.disabled = true;
    elements.confirmAddSong.textContent = 'Adding...';

    try {
        const newTrack = await API.addMusicTrack({
            key: musicUploadKey,
            name: elements.musicName.value.trim() || 'Untitled',
            author: elements.musicAuthor.value.trim() || 'Unknown'
        });
        musicQueue.push(newTrack);
        await updateMusicUI();
        resetMusicUpload();
        closeModal(elements.addSongModal);
        showToast('Song added!');
    } catch (e) {
        console.warn('Add track failed:', e);
        showToast('Failed to add song');
        elements.confirmAddSong.disabled = false;
        elements.confirmAddSong.textContent = 'Add to Playlist';
    }
});

// ==================== Event Listeners ====================

// Music Modal Events
elements.discWrapper.addEventListener('click', async () => {
    openModal(elements.musicModal);
    await updateMusicUI();
    if (musicQueue.length > 0 && currentIndex < 0) {
        playSong(0);
    }
});
elements.closeMusicModal.addEventListener('click', () => closeModal(elements.musicModal));
elements.musicModal.addEventListener('click', (e) => {
    if (e.target === elements.musicModal) closeModal(elements.musicModal);
});

elements.addSongBtn.addEventListener('click', () => {
    resetMusicUpload();
    openModal(elements.addSongModal);
});

elements.playPause.addEventListener('click', togglePlayPause);
elements.prevSong.addEventListener('click', prevSong);
elements.nextSong.addEventListener('click', nextSong);
