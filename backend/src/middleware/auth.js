const fs = require('fs');
const { getAllowedUsersPath } = require('../utils/paths');

let allowedUsers = new Map();

const loadAllowedUsers = () => {
  const configPath = getAllowedUsersPath();
  try {
    if (fs.existsSync(configPath)) {
      const data = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      // Migrate old format { usernames: [...] } → { users: { user: pass } }
      if (data.usernames && Array.isArray(data.usernames) && !data.users) {
        console.warn('WARNING: allowed-users.json uses old format. Re-run "npm run setup" to add passwords.');
        console.warn('Treating all users as password-less for now.');
        allowedUsers = new Map(data.usernames.map(u => [u, null]));
        console.log('Loaded allowed users (legacy, no passwords):', [...allowedUsers.keys()]);
        return;
      }

      if (data.users && typeof data.users === 'object') {
        allowedUsers = new Map(Object.entries(data.users));
        console.log('Loaded allowed users:', [...allowedUsers.keys()]);
      } else {
        console.log('No valid "users" object found in allowed-users.json, running in open mode');
      }
    } else {
      console.log('No allowed-users.json found, running in open mode');
    }
  } catch (err) {
    console.error('Error loading allowed users:', err);
  }
};

const isValidUser = (username, password) => {
  if (allowedUsers.size === 0) return true;
  if (!allowedUsers.has(username)) return false;
  const storedPass = allowedUsers.get(username);
  // null stored password = legacy migration mode, accept any password
  if (storedPass === null) return true;
  return storedPass === password;
};

const authMiddleware = (req, res, next) => {
  const username = req.headers['x-username'];
  const password = req.headers['x-password'];

  if (allowedUsers.size > 0) {
    if (!username || !allowedUsers.has(username)) {
      return res.status(401).json({ error: 'Unauthorized: unknown username' });
    }
    if (!isValidUser(username, password)) {
      return res.status(401).json({ error: 'Unauthorized: incorrect password' });
    }
  }

  next();
};

loadAllowedUsers();

module.exports = { authMiddleware, loadAllowedUsers, isValidUser, allowedUsers };
