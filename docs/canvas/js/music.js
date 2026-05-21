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
        elements.musicTitle.textContent = '还没有播放音乐';
        elements.musicArtist.textContent = '添加一首喜欢的歌吧';
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
                <button class="song-action-btn delete" data-index="${index}" aria-label="删除">
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
        showToast('先添加一首歌曲吧');
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
    showToast('已删除');
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
        showToast('请输入有效的 YouTube 链接');
        return;
    }

    const data = musicData();
    const song = {
        id: Date.now().toString(),
        youtubeId: videoId,
        title: `歌曲 ${data.queue.length + 1}`,
        artist: '未知艺术家',
        thumbnail: `https://picsum.photos/200?random=${Date.now()}`,
        liked: false
    };

    data.queue.push(song);
    Storage.save('musicData', data);
    updateMusicUI();
    closeModal(elements.addSongModal);
    elements.youtubeUrl.value = '';
    showToast('歌曲已添加');
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
