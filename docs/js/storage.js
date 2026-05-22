// ==================== Storage Manager ====================
const Storage = {
    async save(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
        try {
            if (key === 'userProfile') {
                await API.updateUser({ pfp: data.avatar, bio: data.bio });
            } else if (key === 'musicData') {
                console.log('Music save - using memory only');
            }
        } catch (e) {
            console.warn('Storage save to backend failed:', e);
        }
    },
    async load(key, defaultValue = null) {
        try {
            if (key === 'userProfile') {
                return await API.getUser().catch(() => defaultValue);
            } else if (key === 'musicData') {
                return await API.getMusic().catch(() => defaultValue);
            }
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.warn('Storage load failed:', e);
            return defaultValue;
        }
    },
    remove(key) {
        localStorage.removeItem(key);
    }
};
