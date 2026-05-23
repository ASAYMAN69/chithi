const { WebSocketServer } = require('ws');

const users = new Map();

const HEARTBEAT_TIMEOUT = 60000; // disconnect if no ping for 60s

let wss = null;

const broadcastWS = (message) => {
  if (!wss) return;
  const data = typeof message === 'string' ? message : JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(data);
    }
  });
};

const initWS = (server) => {
  wss = new WebSocketServer({ server, path: '/ws' });

  const userPing = (username) => {
    if (!username || !users.has(username)) return;
    users.set(username, { ...users.get(username), online: true, lastActive: Date.now() });
  };

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, 'http://localhost');
    let username = url.searchParams.get('username') || '';

    if (!username) {
      ws.close(4000, 'username required');
      return;
    }

    users.set(username, { online: true, typing: false, lastActive: Date.now() });

    const snapshot = {};
    users.forEach((state, uname) => {
      if (uname !== username) {
        snapshot[uname] = state;
      }
    });
    ws.send(JSON.stringify({ type: 'presence', users: snapshot }));

    broadcastWS({
      type: 'user_status',
      username,
      online: true,
      typing: false,
      lastActive: Date.now()
    });

    let heartbeatTimer = setInterval(() => {
      const state = users.get(username);
      if (!state || !state.online) {
        clearInterval(heartbeatTimer);
        return;
      }
      const idle = Date.now() - state.lastActive;
      if (idle > HEARTBEAT_TIMEOUT) {
        users.set(username, { ...state, online: false, lastActive: state.lastActive });
        broadcastWS(JSON.stringify({
          type: 'user_status',
          username,
          online: false,
          typing: false,
          lastActive: state.lastActive
        }));
        clearInterval(heartbeatTimer);
      }
    }, 15000);

    ws.on('message', (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      switch (msg.type) {
        case 'ping':
          userPing(username);
          break;

        case 'typing':
          if (users.has(username)) {
            users.set(username, {
              ...users.get(username),
              typing: !!msg.isTyping,
              lastActive: Date.now()
            });
            broadcastWS(JSON.stringify({
              type: 'user_status',
              username,
              online: true,
              typing: !!msg.isTyping,
              lastActive: Date.now()
            }));
          }
          break;

        default:
          break;
      }
    });

    ws.on('close', () => {
      clearInterval(heartbeatTimer);
      if (users.has(username)) {
        const state = users.get(username);
        users.set(username, { ...state, online: false, lastActive: Date.now() });
        broadcastWS(JSON.stringify({
          type: 'user_status',
          username,
          online: false,
          typing: false,
          lastActive: Date.now()
        }));
      }
    });

    ws.on('error', () => {
      clearInterval(heartbeatTimer);
    });
  });

  console.log('WebSocket server ready on /ws');
};

module.exports = { initWS, broadcastWS };
