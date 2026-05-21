const fs = require('fs');
const { getAllowedUsersPath } = require('../utils/paths');

let allowedUsers = new Set();

const loadAllowedUsers = () => {
  const configPath = getAllowedUsersPath();
  try {
    if (fs.existsSync(configPath)) {
      const data = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      allowedUsers = new Set(data.usernames || []);
      console.log('Loaded allowed users:', [...allowedUsers]);
    } else {
      console.log('No allowed-users.json found, running in open mode');
    }
  } catch (err) {
    console.error('Error loading allowed users:', err);
  }
};

const authMiddleware = (req, res, next) => {
  const username = req.headers['x-username'];
  
  if (allowedUsers.size > 0) {
    if (!username || !allowedUsers.has(username)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }
  
  next();
};

loadAllowedUsers();

module.exports = { authMiddleware, loadAllowedUsers, allowedUsers };