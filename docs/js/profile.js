// ==================== Profile ====================
let currentUser = null;

const loadProfile = async () => {
    try {
        currentUser = await API.getUser();
        elements.avatarEmoji.textContent = currentUser.pfp || '\u{1F60A}';
        elements.userBio.value = currentUser.bio || '';
        elements.profileAvatarLarge.textContent = currentUser.pfp || '\u{1F60A}';
    } catch (e) {
        console.warn('Load profile failed:', e);
    }
};

const saveProfileData = async () => {
    const pfp = elements.profileAvatarLarge.textContent;
    const bio = elements.userBio.value.trim() || '';

    try {
        currentUser = await API.updateUser({ pfp, bio });
        elements.avatarEmoji.textContent = currentUser.pfp;
    } catch (e) {
        console.warn('Save profile failed:', e);
    }

    elements.avatarEmoji.textContent = pfp;
    showToast('Saved successfully \u{1F495}');
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
