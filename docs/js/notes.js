// ==================== Note Modal ====================
const noteModal = document.getElementById('noteModal');
const noteModalUser = document.getElementById('noteModalUser');
const noteModalText = document.getElementById('noteModalText');
const noteLikeBtn = document.getElementById('noteLikeBtn');
const closeNoteModal = document.getElementById('closeNoteModal');

let currentNoteId = null;
let likedNotes = new Set();

// Image note state
let noteMode = 'text';
let noteImageKey = null;
let noteImageFile = null;

const getImageCdnUrl = (key) => {
    return `${CONNECTION_URL}/cdn/images/${key}.webp`;
};

const openNoteModal = async (note) => {
    currentNoteId = note.id;
    const currentUser = localStorage.getItem('user');
    const isOwner = note.username === currentUser;

    noteModalUser.textContent = note.username;

    const colors = ['#FFB6C1', '#87CEEB', '#98D8C8', '#FFD700', '#DDA0DD'];
    const colorIndex = note.username.charCodeAt(0) % colors.length;
    noteModal.style.backgroundColor = colors[colorIndex] + 'cc';

    // Show text or image based on note type
    elements.noteModalImage.onerror = null;
    elements.noteDownloadBtn.style.display = 'none';

    if (note.type === 'image' && note.noteText) {
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
    editBtn.style.display = (isOwner && note.type !== 'image') ? 'flex' : 'none';

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
            headers: { 'X-Username': localStorage.getItem('user') }
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

            const editedBadge = note.createdAt !== note.updatedAt ? `<span class="note-edited-badge">Edited ${formatNoteTime(note.updatedAt)}</span>` : '';
            if (note.type === 'image' && note.noteText) {
                const imgUrl = getImageCdnUrl(note.noteText);
                card.innerHTML = `<h4>${escapeHtml(note.username)}</h4><div class="note-card-img" style="background-image:url('${imgUrl}');background-size:cover;background-position:center;width:100%;height:90px;border-radius:8px;margin-top:4px;"></div>${editedBadge}`;
            } else {
                card.innerHTML = `<h4>${escapeHtml(note.username)}</h4><p>${escapeHtml(note.noteText)}</p>${editedBadge}`;
            }

            card.addEventListener('click', () => openNoteModal(note));
            container.appendChild(card);
        });
    } catch (err) {
        console.error('Load notes error:', err);
    }
};

// ==================== Image Mode Toggle ====================
const switchNoteMode = (mode) => {
    noteMode = mode;
    elements.noteTextMode.classList.toggle('active', mode === 'text');
    elements.noteImageMode.classList.toggle('active', mode === 'image');
    elements.noteTextGroup.style.display = mode === 'text' ? 'block' : 'none';
    elements.noteImageUpload.style.display = mode === 'image' ? 'block' : 'none';
};

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
