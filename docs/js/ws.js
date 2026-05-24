const toWsUrl = (httpUrl) => {
  return httpUrl.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
};

let ws = null;
let wsReconnectTimer = null;
let wsHeartbeatTimer = null;
let wsTypingTimer = null;

const statusEl = document.getElementById('activityStatus');
const statusDot = document.getElementById('activityDot');
const statusText = document.getElementById('activityText');

const formatLastSeen = (ts) => {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
};

const updateStatusUI = (data) => {
  if (!statusEl || !statusDot || !statusText) return;
  if (data.online) {
    statusDot.className = 'activity-dot online';
    statusText.textContent = data.typing ? 'Typing...' : 'Online';
  } else {
    statusDot.className = 'activity-dot offline';
    statusText.textContent = `Last seen ${formatLastSeen(data.lastActive)}`;
  }
};

const connectWS = () => {
  if (ws && (ws.readyState === 0 || ws.readyState === 1)) return;

  const username = localStorage.getItem('user');
  const password = localStorage.getItem('password');
  if (!username || !password) return;

  const baseUrl = window.__API_BASE_URL || CONNECTION_URL;
  const wsUrl = `${toWsUrl(baseUrl)}/ws?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;

  try {
    ws = new WebSocket(wsUrl);
  } catch (e) {
    scheduleReconnect();
    return;
  }

  ws.onopen = () => {
    if (wsHeartbeatTimer) clearInterval(wsHeartbeatTimer);
    wsHeartbeatTimer = setInterval(() => {
      if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  };

  ws.onmessage = (event) => {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch { return; }

    if (msg.type === 'presence') {
      const entries = Object.entries(msg.users);
      if (entries.length > 0) {
        const [, state] = entries[0];
        updateStatusUI(state);
      }
    } else if (msg.type === 'user_status' && msg.username !== localStorage.getItem('user')) {
      updateStatusUI(msg);
    } else if (msg.type === 'notes_updated' && typeof loadNotes === 'function') {
      loadNotes();
    }
  };

  ws.onclose = () => {
    if (wsHeartbeatTimer) {
      clearInterval(wsHeartbeatTimer);
      wsHeartbeatTimer = null;
    }
    scheduleReconnect();
  };

  ws.onerror = () => {
    ws.close();
  };
};

const scheduleReconnect = () => {
  if (wsReconnectTimer) return;
  wsReconnectTimer = setTimeout(() => {
    wsReconnectTimer = null;
    connectWS();
  }, 5000);
};

const sendTyping = (isTyping) => {
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify({ type: 'typing', isTyping }));
  }
};

const setupTypingDetection = (textarea) => {
  if (!textarea) return;
  textarea.addEventListener('input', () => {
    sendTyping(true);
    if (wsTypingTimer) clearTimeout(wsTypingTimer);
    wsTypingTimer = setTimeout(() => {
      sendTyping(false);
    }, 1500);
  });
  textarea.addEventListener('blur', () => {
    sendTyping(false);
    if (wsTypingTimer) {
      clearTimeout(wsTypingTimer);
      wsTypingTimer = null;
    }
  });
};

const disconnectWS = () => {
  if (wsReconnectTimer) {
    clearTimeout(wsReconnectTimer);
    wsReconnectTimer = null;
  }
  if (wsHeartbeatTimer) {
    clearInterval(wsHeartbeatTimer);
    wsHeartbeatTimer = null;
  }
  if (ws) {
    ws.onclose = null;
    ws.close();
    ws = null;
  }
};

const initWS = () => {
  setupTypingDetection(document.getElementById('noteText'));

  const user = localStorage.getItem('user');
  const pass = localStorage.getItem('password');
  if (user && pass) {
    connectWS();
    return;
  }
  const poll = setInterval(() => {
    if (localStorage.getItem('user') && localStorage.getItem('password')) {
      clearInterval(poll);
      connectWS();
    }
  }, 500);
};
initWS();
