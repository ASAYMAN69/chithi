// ==================== Profile ====================
const loadProfile = () => {
    const profile = Storage.load('userProfile');
    if (profile) {
        elements.avatarEmoji.textContent = profile.avatar;
        elements.userName.value = profile.name;
        elements.userBio.value = profile.bio;
        elements.profileAvatarLarge.textContent = profile.avatar;
    }
};

const saveProfileData = () => {
    const profile = {
        name: elements.userName.value.trim() || '亲爱的',
        bio: elements.userBio.value.trim() || '永远在一起 💕',
        avatar: elements.profileAvatarLarge.textContent
    };
    Storage.save('userProfile', profile);
    elements.avatarEmoji.textContent = profile.avatar;
    showToast('保存成功 💕');
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
