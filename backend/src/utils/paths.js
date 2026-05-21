const path = require('path');
const os = require('os');
const fs = require('fs');

const HOME_DIR = path.join(os.homedir(), '.chithi');
const CONFIG_DIR = path.join(HOME_DIR, 'config');
const DATA_DIR = path.join(HOME_DIR, 'data');
const CDN_DIR = path.join(HOME_DIR, 'cdn');

const ensureDirs = () => {
  [HOME_DIR, CONFIG_DIR, DATA_DIR, CDN_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

module.exports = {
  HOME_DIR,
  CONFIG_DIR,
  DATA_DIR,
  CDN_DIR,
  ensureDirs,
  getDBPath: () => path.join(DATA_DIR, 'database.sqlite'),
  getAllowedUsersPath: () => path.join(CONFIG_DIR, 'allowed-users.json'),
  getLocationsPath: () => path.join(CONFIG_DIR, 'locations.json')
};
