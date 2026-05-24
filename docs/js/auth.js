// ==================== User Auth ====================
const showUserModal = () => {
    const modal = document.getElementById('userModal');
    modal.classList.add('active');
    modal.style.display = 'flex';
    document.getElementById('saveUsername').addEventListener('click', saveUsername);
    const keyHandler = (e) => {
        if (e.key === 'Enter') saveUsername();
    };
    document.getElementById('usernameInput').addEventListener('keypress', keyHandler);
    document.getElementById('passwordInput').addEventListener('keypress', keyHandler);
};

const hideUserModal = () => {
    const modal = document.getElementById('userModal');
    modal.classList.remove('active');
    modal.style.display = 'none';
};

const checkUser = async () => {
    const user = localStorage.getItem('user');
    const password = localStorage.getItem('password');
    if (!user || !password) {
        showUserModal();
        return;
    }

    try {
        await API.getUser();
        hideUserModal();
    } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('password');
        showUserModal();
    }
};

const saveUsername = async () => {
    const name = document.getElementById('usernameInput').value.trim();
    if (!name) {
        showToast('Please enter a name');
        return;
    }

    const password = document.getElementById('passwordInput').value.trim();
    if (!password) {
        showToast('Please enter a password');
        return;
    }

    localStorage.setItem('user', name);
    localStorage.setItem('password', password);

    try {
        await API.getUser();
        hideUserModal();
        init();
    } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('password');
        showToast('Username or password not authorized. Ask the admin to add you.');
    }
};
