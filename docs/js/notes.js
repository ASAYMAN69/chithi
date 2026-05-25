// ==================== Note Modal ====================
const noteModal = document.getElementById('noteModal');
const noteModalUser = document.getElementById('noteModalUser');
const noteModalText = document.getElementById('noteModalText');
const noteLikeBtn = document.getElementById('noteLikeBtn');
const closeNoteModal = document.getElementById('closeNoteModal');

let currentNoteId = null;
let likedNotes = new Set();

let noteOffset = 0;
let hasMoreNotes = true;
let isLoadingNotes = false;
const NOTES_INITIAL = 20;
const NOTES_PAGE = 10;

// Image note state
let noteMode = 'text';
let noteImageKey = null;
let noteImageFile = null;

const getImageCdnUrl = (key) => {
    const user = localStorage.getItem('user');
    const pass = localStorage.getItem('password');
    return `${CONNECTION_URL}/cdn/images/${key}.webp?username=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}`;
};

const openNoteModal = async (note) => {
    currentNoteId = note.id;
    const currentUser = localStorage.getItem('user');
    const isOwner = note.username === currentUser;

    noteModalUser.textContent = note.username;

    const colors = ['#FFB6C1', '#87CEEB', '#98D8C8', '#FFD700', '#DDA0DD'];
    const colorIndex = note.username.charCodeAt(0) % colors.length;
    noteModal.style.backgroundColor = colors[colorIndex] + 'cc';

    // Show text, image, or voice based on note type
    elements.noteModalImage.onerror = null;
    elements.noteDownloadBtn.style.display = 'none';
    const voicePlayer = document.getElementById('voicePlayer');
    const voiceAudio = document.getElementById('noteVoicePlayer');
    const speedBtn = document.getElementById('voiceSpeedBtn');
    if (voiceAudio) { voiceAudio.pause(); voiceAudio.src = ''; voiceAudio.playbackRate = 1; }
    if (voicePlayer) { voicePlayer.style.display = 'none'; }
    if (speedBtn) speedBtn.textContent = '1x';

    if (note.type === 'voice' && note.noteText) {
        noteModalText.style.display = 'none';
        noteModalText.textContent = '';
        elements.noteModalImage.style.display = 'none';
        elements.noteModalImage.src = '';
        elements.noteDownloadBtn.style.display = 'flex';
        elements.noteDownloadBtn.dataset.key = note.noteText;

        if (voicePlayer && voiceAudio) {
            voicePlayer.style.display = 'block';
            const username = localStorage.getItem('user');
            const password = localStorage.getItem('password');
            fetch(`${CONNECTION_URL}/api/files/${note.noteText}/download`, {
                headers: { 'X-Username': username, 'X-Password': password }
            })
            .then(r => r.blob())
            .then(blob => {
                const url = URL.createObjectURL(blob);
                voiceAudio.src = url;
            })
            .catch(() => { voicePlayer.style.display = 'none'; showToast('Failed to load voice note'); });
        }
    } else if (note.type === 'image' && note.noteText) {
        noteModalText.style.display = 'none';
        noteModalText.textContent = '';
        elements.noteModalImage.style.display = 'block';
        elements.noteModalImage.src = getImageCdnUrl(note.noteText);
        elements.noteModalImage.onerror = () => {
            elements.noteModalImage.style.display = 'none';
            noteModalText.style.display = 'block';
            noteModalText.textContent = '[Image failed to load]';
        };
        elements.noteDownloadBtn.style.display = 'flex';
        elements.noteDownloadBtn.dataset.key = note.noteText;
    } else {
        noteModalText.style.display = 'block';
        noteModalText.textContent = note.noteText;
        noteModalText.dataset.original = note.noteText;
        elements.noteModalImage.style.display = 'none';
        elements.noteModalImage.src = '';
    }

    noteLikeBtn.classList.toggle('liked', likedNotes.has(note.id));
    noteLikeBtn.style.display = isOwner ? 'none' : 'flex';

    const editBtn = document.getElementById('editNoteBtn');
    editBtn.style.display = (isOwner && note.type !== 'image' && note.type !== 'voice') ? 'flex' : 'none';

    const deleteBtn = document.getElementById('deleteNoteBtn');
    deleteBtn.style.display = isOwner ? 'flex' : 'none';

    const likesContainer = document.getElementById('noteLikesContainer');
    if (likesContainer) {
        try {
            const likes = await API.getNoteLikes(note.id);
            const hasLiked = likes.some(l => l.username === currentUser);
            if (hasLiked) {
                likedNotes.add(note.id);
            } else {
                likedNotes.delete(note.id);
            }
            localStorage.setItem('likedNotes', JSON.stringify([...likedNotes]));

            noteLikeBtn.classList.toggle('liked', hasLiked);

            if (likes.length > 0) {
                likesContainer.innerHTML = `<strong>Liked by:</strong> ${likes.map(l => escapeHtml(l.username)).join(', ')}`;
                likesContainer.style.display = 'block';
            } else {
                likesContainer.style.display = 'none';
            }
        } catch (e) {
            console.warn('Sync likes failed:', e);
        }
    }

    const tsEl = document.getElementById('noteTimestamp');
    if (tsEl) tsEl.textContent = formatNoteTime(note.createdAt);

    openModal(noteModal);
};

document.getElementById('editNoteBtn').addEventListener('click', () => {
    const currentText = noteModalText.dataset.original;
    switchNoteMode('text');
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

elements.noteDownloadBtn.addEventListener('click', async () => {
    const key = elements.noteDownloadBtn.dataset.key;
    if (!key) return;
    try {
        const response = await fetch(`${CONNECTION_URL}/api/files/${key}/download`, {
            headers: { 'X-Username': localStorage.getItem('user'), 'X-Password': localStorage.getItem('password') }
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Download failed');
        }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${key}.${blob.type.split('/')[1] || 'png'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (e) {
        showToast(e.message || 'Download failed');
    }
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
                likesContainer.innerHTML = `<strong>Liked by:</strong> ${likes.map(l => escapeHtml(l.username)).join(', ')}`;
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

// ==================== Voice Playback Speed ====================
const speedBtn = document.getElementById('voiceSpeedBtn');
const speedCycle = [1, 1.5, 2, 0.5];
let speedIdx = 0;

if (speedBtn) {
    speedBtn.addEventListener('click', () => {
        const audio = document.getElementById('noteVoicePlayer');
        speedIdx = (speedIdx + 1) % speedCycle.length;
        const rate = speedCycle[speedIdx];
        speedBtn.textContent = rate + 'x';
        if (audio) audio.playbackRate = rate;
    });
}

const loadLikedNotes = () => {
    const stored = localStorage.getItem('likedNotes');
    if (stored) {
        likedNotes = new Set(JSON.parse(stored));
    }
};

const formatNoteTime = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

const renderNoteCards = (notes, startIndex) => {
    const container = document.getElementById('notesDisplay');
    if (!container) return;

    const colors = ['#FFB6C1', '#87CEEB', '#98D8C8', '#FFD700', '#DDA0DD'];

    notes.forEach((note, i) => {
        const card = document.createElement('div');
        card.className = 'note-card';
        card.style.backgroundColor = colors[(startIndex + i) % colors.length];
        card.style.display = 'block';
        card.dataset.id = note.id;

        const editedBadge = note.createdAt !== note.updatedAt ? `<span class="note-edited-badge">Edited ${formatNoteTime(note.updatedAt)}</span>` : '';
        if (note.type === 'image' && note.noteText) {
            const imgUrl = getImageCdnUrl(note.noteText);
            card.innerHTML = `<h4>${escapeHtml(note.username)}</h4><div class="note-card-img" style="background-image:url('${imgUrl}');background-size:cover;background-position:center;width:100%;height:90px;border-radius:8px;margin-top:4px;"></div>${editedBadge}`;
        } else if (note.type === 'voice' && note.noteText) {
            card.innerHTML = `<h4>${escapeHtml(note.username)}</h4>
                <div class="note-card-voice">
                    <button class="note-card-voice-play" data-key="${escapeHtml(note.noteText)}">
                        <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </button>
                    <div class="note-card-voice-info">
                        <div class="note-card-voice-duration">Voice note</div>
                        <div class="note-card-voice-progress">
                            <div class="note-card-voice-progress-fill"></div>
                        </div>
                    </div>
                </div>${editedBadge}`;
            const playBtn = card.querySelector('.note-card-voice-play');
            const progressFill = card.querySelector('.note-card-voice-progress-fill');
            let voiceAudio = null;
            playBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (voiceAudio && !voiceAudio.paused) {
                    voiceAudio.pause();
                    voiceAudio.currentTime = 0;
                    playBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
                    return;
                }
                try {
                    const resp = await fetch(`${CONNECTION_URL}/api/files/${note.noteText}/download`, {
                        headers: { 'X-Username': localStorage.getItem('user'), 'X-Password': localStorage.getItem('password') }
                    });
                    const blob = await resp.blob();
                    const url = URL.createObjectURL(blob);
                    voiceAudio = new Audio(url);
                    voiceAudio.onended = () => {
                        playBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
                        progressFill.style.width = '0%';
                    };
                    voiceAudio.ontimeupdate = () => {
                        if (voiceAudio.duration) {
                            progressFill.style.width = `${(voiceAudio.currentTime / voiceAudio.duration) * 100}%`;
                        }
                    };
                    voiceAudio.play();
                    playBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
                } catch (err) {
                    showToast('Failed to play voice note');
                }
            });
        } else {
            card.innerHTML = `<h4>${escapeHtml(note.username)}</h4><p>${escapeHtml(note.noteText)}</p>${editedBadge}`;
        }

        card.addEventListener('click', () => openNoteModal(note));
        container.appendChild(card);
    });
};

const loadMoreNotes = async () => {
    if (isLoadingNotes || !hasMoreNotes) return;
    isLoadingNotes = true;
    try {
        const limit = noteOffset === 0 ? NOTES_INITIAL : NOTES_PAGE;
        const data = await API.getNotes(noteOffset, limit);
        const notes = data.notes || [];
        hasMoreNotes = data.hasMore;
        renderNoteCards(notes, noteOffset);
        noteOffset += notes.length;
    } catch (err) {
        console.error('Load notes error:', err);
    } finally {
        isLoadingNotes = false;
    }
};

const loadNotes = async () => {
    noteOffset = 0;
    hasMoreNotes = true;
    const container = document.getElementById('notesDisplay');
    if (!container) return;
    container.innerHTML = '';
    await loadMoreNotes();
};

const mainContent = document.querySelector('.main-content');

const handleNotesScroll = () => {
    if (isLoadingNotes || !hasMoreNotes || !mainContent) return;
    if (mainContent.scrollTop + mainContent.clientHeight >= mainContent.scrollHeight - 400) {
        loadMoreNotes();
    }
};

if (mainContent) {
    mainContent.addEventListener('scroll', handleNotesScroll, { passive: true });
}

// ==================== Voice Recording (Standalone Modal) ====================
let mediaRecorder = null;
let recordedChunks = [];
let recordingTimer = null;
let recordingSeconds = 0;
let voiceBlob = null;
let voiceStream = null;

const voiceModal = document.getElementById('voiceModal');
const closeVoiceModal = document.getElementById('closeVoiceModal');
const cancelVoice = document.getElementById('cancelVoice');
const sendVoice = document.getElementById('sendVoice');
const voiceTriggerBtn = document.getElementById('voiceTriggerBtn');
const voiceRecordBtn = document.getElementById('voiceRecordBtn');
const voiceRecordIcon = document.getElementById('voiceRecordIcon');
const voiceRecordPause = document.getElementById('voiceRecordPause');
const voiceRecordPlay = document.getElementById('voiceRecordPlay');
const voiceRecordTimer = document.getElementById('voiceRecordTimer');
const voiceRecordStatus = document.getElementById('voiceRecordStatus');
const voiceRecordWave = document.getElementById('voiceRecordWave');
const voicePreview = document.getElementById('voicePreview');
const voicePreviewAudio = document.getElementById('voicePreviewAudio');
const voiceRecordGlow = document.getElementById('voiceRecordGlow');

const formatVoiceTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
};

const setRecordBtnState = (state) => {
    voiceRecordBtn.classList.toggle('recording', state === 'recording');
    voiceRecordBtn.classList.toggle('paused', state === 'paused');
    voiceRecordIcon.style.display = state === 'idle' ? 'flex' : 'none';
    voiceRecordPause.style.display = state === 'recording' ? 'flex' : 'none';
    voiceRecordPlay.style.display = state === 'paused' ? 'flex' : 'none';
    voiceRecordWave.style.display = state === 'recording' ? 'flex' : 'none';
    voiceRecordGlow.classList.toggle('active', state === 'recording');
};

const resetVoiceRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    if (voiceStream) { voiceStream.getTracks().forEach(t => t.stop()); voiceStream = null; }
    setRecordBtnState('idle');
    voicePreview.style.display = 'none';
    voicePreviewAudio.src = '';
    voiceRecordTimer.textContent = '0:00';
    voiceRecordStatus.textContent = 'Tap to record';
    voiceBlob = null;
    recordedChunks = [];
    mediaRecorder = null;
    if (recordingTimer) { clearInterval(recordingTimer); recordingTimer = null; }
};

const finishVoiceRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    if (recordingTimer) { clearInterval(recordingTimer); recordingTimer = null; }
};

const startVoiceRecording = async () => {
    try {
        voiceStream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 48000, channelCount: 1, echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
        recordedChunks = [];
        voiceBlob = null;
        recordingSeconds = 0;
        if (recordingTimer) { clearInterval(recordingTimer); recordingTimer = null; }

        mediaRecorder = new MediaRecorder(voiceStream, { mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm', audioBitsPerSecond: 128000 });

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) recordedChunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
            if (voiceStream) { voiceStream.getTracks().forEach(t => t.stop()); voiceStream = null; }
            if (recordingTimer) { clearInterval(recordingTimer); recordingTimer = null; }
            voiceBlob = new Blob(recordedChunks, { type: mediaRecorder.mimeType });
            const url = URL.createObjectURL(voiceBlob);
            voicePreviewAudio.src = url;
            voicePreview.style.display = 'block';
            setRecordBtnState('idle');
            voiceRecordStatus.textContent = 'Review your recording';
        };

        mediaRecorder.start();
        setRecordBtnState('recording');
        voiceRecordStatus.textContent = 'Recording...';
        voicePreview.style.display = 'none';
        voicePreviewAudio.src = '';

        recordingTimer = setInterval(() => {
            recordingSeconds++;
            voiceRecordTimer.textContent = formatVoiceTime(recordingSeconds);
            if (recordingSeconds >= 300) {
                finishVoiceRecording();
            }
        }, 1000);
    } catch (err) {
        voiceRecordStatus.textContent = 'Microphone access denied';
        showToast('Please allow microphone access to record voice');
    }
};

const pauseVoiceRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.pause();
        setRecordBtnState('paused');
        voiceRecordStatus.textContent = 'Paused';
        if (recordingTimer) { clearInterval(recordingTimer); recordingTimer = null; }
    }
};

const resumeVoiceRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'paused') {
        mediaRecorder.resume();
        setRecordBtnState('recording');
        voiceRecordStatus.textContent = 'Recording...';
        recordingTimer = setInterval(() => {
            recordingSeconds++;
            voiceRecordTimer.textContent = formatVoiceTime(recordingSeconds);
            if (recordingSeconds >= 300) {
                finishVoiceRecording();
            }
        }, 1000);
    }
};

// Open voice modal and auto-start recording
voiceTriggerBtn.addEventListener('click', () => {
    resetVoiceRecording();
    openModal(voiceModal);
    setTimeout(() => startVoiceRecording(), 300);
});

// Record button: cycle through record → pause → resume
voiceRecordBtn.addEventListener('click', () => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        startVoiceRecording();
    } else if (mediaRecorder.state === 'recording') {
        pauseVoiceRecording();
    } else if (mediaRecorder.state === 'paused') {
        resumeVoiceRecording();
    }
});

// Close handlers
const closeVoiceModalHandler = () => {
    resetVoiceRecording();
    closeModal(voiceModal);
};
closeVoiceModal.addEventListener('click', closeVoiceModalHandler);
cancelVoice.addEventListener('click', closeVoiceModalHandler);
voiceModal.addEventListener('click', (e) => {
    if (e.target === voiceModal) closeVoiceModalHandler();
});

// Send: if recording/paused, stop first, then upload
sendVoice.addEventListener('click', async () => {
    if (mediaRecorder && (mediaRecorder.state === 'recording' || mediaRecorder.state === 'paused')) {
        finishVoiceRecording();
        await new Promise(r => setTimeout(r, 200));
    }

    if (!voiceBlob) {
        showToast('Please record a voice note first');
        return;
    }

    sendVoice.disabled = true;
    sendVoice.textContent = 'Sending...';

    try {
        const uploadResult = await API.uploadVoice(voiceBlob);
        await API.createNote(uploadResult.key, 'voice');
        await loadNotes();
        showToast('Voice note sent!');
        closeVoiceModalHandler();
    } catch (e) {
        showToast(e.message || 'Failed to send voice note');
    }

    sendVoice.disabled = false;
    sendVoice.textContent = 'Send';
});

const resetImageUpload = () => {
    noteImageKey = null;
    noteImageFile = null;
    elements.noteImageInput.value = '';
    elements.noteImagePreview.style.display = 'none';
    elements.noteImagePreviewImg.src = '';
    elements.noteImageFileName.textContent = '';
};

const handleNoteImageSelect = (file) => {
    if (!file || !file.type.startsWith('image/')) {
        showToast('Please select an image file');
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        showToast('Image must be under 5MB');
        return;
    }
    noteImageFile = file;
    noteImageKey = null;
    elements.noteImagePreview.style.display = 'block';
    elements.noteImagePreviewImg.src = URL.createObjectURL(file);
    elements.noteImageFileName.textContent = file.name;
};

const switchNoteMode = (mode) => {
    const isText = mode === 'text';
    document.getElementById('noteTextGroup').style.display = isText ? 'block' : 'none';
    document.getElementById('noteImageUpload').style.display = isText ? 'none' : 'block';
    elements.noteTextMode.classList.toggle('active', isText);
    elements.noteImageMode.classList.toggle('active', !isText);
};

// Note mode toggle events
elements.noteTextMode.addEventListener('click', () => switchNoteMode('text'));
elements.noteImageMode.addEventListener('click', () => switchNoteMode('image'));

// Image dropzone click
elements.noteImageDropzone.addEventListener('click', () => elements.noteImageInput.click());
elements.noteImageInput.addEventListener('change', (e) => {
    if (e.target.files[0]) handleNoteImageSelect(e.target.files[0]);
});

// ==================== Add Note ====================
const resetAddNoteModal = () => {
    currentNoteId = null;
    noteMode = 'text';
    elements.noteText.value = '';
    resetImageUpload();
    document.querySelector('#addNoteModal .modal-header h3').textContent = 'Add Note';
    document.getElementById('confirmAddNote').textContent = 'Add';
    switchNoteMode('text');
};

elements.addNoteBtn.addEventListener('click', () => {
    resetAddNoteModal();
    openModal(elements.addNoteModal);
});
elements.closeAddNote.addEventListener('click', () => {
    resetAddNoteModal();
    closeModal(elements.addNoteModal);
});
elements.cancelAddNote.addEventListener('click', () => {
    resetAddNoteModal();
    closeModal(elements.addNoteModal);
});
elements.addNoteModal.addEventListener('click', (e) => {
    if (e.target === elements.addNoteModal) {
        resetAddNoteModal();
        closeModal(elements.addNoteModal);
    }
});

elements.confirmAddNote.addEventListener('click', async () => {
    elements.confirmAddNote.disabled = true;
    elements.addNoteBtn.disabled = true;

    const isEditing = currentNoteId !== null && document.querySelector('#addNoteModal .modal-header h3').textContent === 'Edit Note';

    try {
        if (noteMode === 'image') {
            if (!noteImageFile) {
                showToast('Please select an image');
                elements.confirmAddNote.disabled = false;
                elements.addNoteBtn.disabled = false;
                return;
            }

            elements.confirmAddNote.textContent = 'Uploading...';

            // Upload image, get key, create note
            const uploadResult = await API.uploadFile('image', noteImageFile);
            const imageKey = uploadResult.key;

            if (isEditing) {
                showToast('Cannot edit image note type');
                elements.confirmAddNote.disabled = false;
                elements.addNoteBtn.disabled = false;
                elements.confirmAddNote.textContent = 'Save';
                return;
            } else {
                await API.createNote(imageKey, 'image');
            }

            await loadNotes();
            showToast('Image note added!');
            closeModal(elements.addNoteModal);
        } else {
            const text = elements.noteText.value.trim();
            if (!text) {
                showToast('Please write something');
                elements.confirmAddNote.disabled = false;
                elements.addNoteBtn.disabled = false;
                return;
            }

            elements.confirmAddNote.textContent = isEditing ? 'Saving...' : 'Adding...';

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

            elements.noteText.value = '';
            closeModal(elements.addNoteModal);
        }
    } catch (e) {
        showToast(e.message || 'Failed to save note');
    }

    elements.confirmAddNote.disabled = false;
    elements.addNoteBtn.disabled = false;
    if (!isEditing && noteMode === 'text') {
        document.getElementById('confirmAddNote').textContent = 'Add';
    }
});
