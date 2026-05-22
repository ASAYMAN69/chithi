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


