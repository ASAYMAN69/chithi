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
                        <p>还没有动态<br>点击右下角发布第一个视频吧</p>
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
        showToast('请输入有效的 YouTube 链接');
        return;
    }

    const title = elements.reelTitle.value.trim() || '无标题';
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
    showToast('动态已发布');
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
