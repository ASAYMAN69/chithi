// ==================== User Auth ====================
const showUserModal = () => {
    const modal = document.getElementById('userModal');
    modal.classList.add('active');
    modal.style.display = 'flex';
    document.getElementById('saveUsername').addEventListener('click', saveUsername);
    document.getElementById('usernameInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveUsername();
    });
};

const hideUserModal = () => {
    const modal = document.getElementById('userModal');
    modal.classList.remove('active');
    modal.style.display = 'none';
};

const checkUser = async () => {
    const user = localStorage.getItem('user');
    if (!user) {
        showUserModal();
        return;
    }

    try {
        await API.getUser();
        hideUserModal();
    } catch (e) {
        localStorage.removeItem('user');
        showUserModal();
    }
};

const saveUsername = async () => {
    const name = document.getElementById('usernameInput').value.trim();
    if (!name) {
        showToast('Please enter a name');
        return;
    }

    localStorage.setItem('user', name);

    try {
        await API.getUser();
        hideUserModal();
        init();
    } catch (e) {
        localStorage.removeItem('user');
        showToast('Username not authorized. Ask the admin to add you.');
    }
};
