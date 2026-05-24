const getUsername = () => localStorage.getItem('user') || '';
const getPassword = () => localStorage.getItem('password') || '';

const apiFetch = async (endpoint, options = {}) => {
  const username = getUsername();
  const password = getPassword();
  const headers = {
    'Content-Type': 'application/json',
    'X-Username': username,
    'X-Password': password,
    ...options.headers
  };

  const response = await fetch(`${CONNECTION_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
};

const API = {
  // User
  getUser: () => apiFetch('/api/user'),
  updateUser: (data) => apiFetch('/api/user', { method: 'PUT', body: JSON.stringify(data) }),

  // Notes
  getNotes: (offset = 0, limit = 20) => apiFetch(`/api/notes?offset=${offset}&limit=${limit}`),
  createNote: (noteText, type) => apiFetch('/api/notes', { method: 'POST', body: JSON.stringify({ noteText, type: type || 'text' }) }),
  updateNote: async (id, noteText) => {
    const username = getUsername();
    const password = getPassword();
    const response = await fetch(`${CONNECTION_URL}/api/notes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Username': username, 'X-Password': password },
      body: JSON.stringify({ noteText })
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Update failed');
    }
    return response.json();
  },
  deleteNote: (id) => apiFetch(`/api/notes/${id}`, { method: 'DELETE' }),

  // Note Likes
  getNoteLikes: (noteId) => apiFetch(`/api/note-likes/${noteId}`),
  likeNote: async (noteId) => {
    const username = getUsername();
    const password = getPassword();
    const response = await fetch(`${CONNECTION_URL}/api/note-likes/${noteId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Username': username, 'X-Password': password }
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Like failed');
    }
    return response.json();
  },
  unlikeNote: async (noteId) => {
    const username = getUsername();
    const password = getPassword();
    const response = await fetch(`${CONNECTION_URL}/api/note-likes/${noteId}`, {
      method: 'DELETE',
      headers: { 'X-Username': username, 'X-Password': password }
    });
    return response.json();
  },

  // Music
  getMusic: () => apiFetch('/api/music'),
  addMusic: (data) => apiFetch('/api/music', { method: 'POST', body: JSON.stringify(data) }),
  deleteMusic: (id) => apiFetch(`/api/music/${id}`, { method: 'DELETE' }),

  // Weather
  getWeather: () => apiFetch('/api/weather'),

  // Canvas
  getCanvas: () => apiFetch('/api/canvas'),
  saveCanvas: (canvasData) => apiFetch('/api/canvas', { method: 'POST', body: JSON.stringify({ canvasData }) }),

  // Upload (returns URL)
  async uploadFile(type, file) {
    const username = getUsername();
    const password = getPassword();
    const formData = new FormData();
    formData.append('file', file);

    const endpoint = type === 'image' ? '/api/upload/image' : 
                     type === 'music' ? '/api/upload/music' : '/api/upload/video';

    const response = await fetch(`${CONNECTION_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'X-Username': username, 'X-Password': password },
      body: formData
    });

    if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
    return response.json();
  },

  // Music file upload (returns {key, ext})
  async uploadMusicFile(file) {
    const username = getUsername();
    const password = getPassword();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${CONNECTION_URL}/api/upload/music-file`, {
      method: 'POST',
      headers: { 'X-Username': username, 'X-Password': password },
      body: formData
    });

    if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
    return response.json();
  },

  // Music track (upload-based)
  addMusicTrack: (data) => apiFetch('/api/music/tracks', { method: 'POST', body: JSON.stringify(data) })
};