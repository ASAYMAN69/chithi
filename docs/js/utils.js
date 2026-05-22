const escapeHtml = (str) => {
    if (typeof str !== 'string') return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
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
