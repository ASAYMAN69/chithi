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
