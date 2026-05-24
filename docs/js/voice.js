const VOICE_MAX_SEC = 180;

let mediaRecorder = null;
let audioChunks = [];
let recordingTimer = null;
let recordingSeconds = 0;
let voiceStream = null;

const voiceBtn = document.getElementById('voiceNoteBtn');
const voiceModal = document.getElementById('voiceModal');
const voiceTimer = document.getElementById('voiceTimer');
const voicePauseBtn = document.getElementById('voicePauseBtn');
const voiceSendBtn = document.getElementById('voiceSendBtn');
const voiceCancelBtn = document.getElementById('voiceCancelBtn');
const voiceCloseBtn = document.getElementById('voiceCloseBtn');
const voicePreview = document.getElementById('voicePreview');
const voicePreviewAudio = document.getElementById('voicePreviewAudio');
const voiceSendAgainBtn = document.getElementById('voiceSendAgainBtn');
const voiceError = document.getElementById('voiceError');

const formatTimer = (sec) => {
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
};

const showVoiceError = (msg) => {
  voiceError.textContent = msg;
  voiceError.style.display = 'block';
  setTimeout(() => { voiceError.style.display = 'none'; }, 4000);
};

const closeVoiceModal = () => {
  if (recordingTimer) {
    clearInterval(recordingTimer);
    recordingTimer = null;
  }
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  if (voiceStream) {
    voiceStream.getTracks().forEach(t => t.stop());
    voiceStream = null;
  }
  voiceModal.classList.remove('active');
  voiceModal.style.display = 'none';
  audioChunks = [];
  recordingSeconds = 0;
  voiceTimer.textContent = '00:00';
  voicePauseBtn.textContent = 'Pause';
  voicePauseBtn.disabled = true;
  voiceSendBtn.disabled = true;
  voicePreview.style.display = 'none';
  voicePreviewAudio.src = '';
};

const stopRecording = () => {
  if (recordingTimer) {
    clearInterval(recordingTimer);
    recordingTimer = null;
  }
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  if (voiceStream) {
    voiceStream.getTracks().forEach(t => t.stop());
    voiceStream = null;
  }
  voicePauseBtn.disabled = true;
};

const startRecording = async () => {
  try {
    voiceStream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 48000, channelCount: 1, echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
  } catch (err) {
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      showVoiceError('Microphone access denied. Please allow mic access in your browser settings.');
    } else if (err.name === 'NotFoundError') {
      showVoiceError('No microphone found. Connect a mic and try again.');
    } else {
      showVoiceError('Could not access microphone: ' + err.message);
    }
    return;
  }

  audioChunks = [];
  recordingSeconds = 0;
  const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus'
    : 'audio/webm';

  mediaRecorder = new MediaRecorder(voiceStream, { mimeType, audioBitsPerSecond: 128000 });

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) audioChunks.push(e.data);
  };

  mediaRecorder.onstop = () => {
    const blob = new Blob(audioChunks, { type: mimeType });
    voicePreviewAudio.src = URL.createObjectURL(blob);
    voicePreview.style.display = 'block';
    voiceSendBtn.disabled = false;
  };

  mediaRecorder.start(100);
  voicePauseBtn.textContent = 'Pause';
  voicePauseBtn.disabled = false;
  voiceSendBtn.disabled = true;

  recordingTimer = setInterval(() => {
    recordingSeconds++;
    voiceTimer.textContent = formatTimer(recordingSeconds);
    if (recordingSeconds >= VOICE_MAX_SEC) {
      showVoiceError('Maximum 3 minutes reached');
      stopRecording();
    }
  }, 1000);
};

voiceBtn.addEventListener('click', () => {
  voiceModal.classList.add('active');
  voiceModal.style.display = 'flex';
  voicePreview.style.display = 'none';
  voicePreviewAudio.src = '';
  voiceError.style.display = 'none';
  voiceSendBtn.disabled = true;
  voicePauseBtn.disabled = true;
  voiceTimer.textContent = '00:00';
  recordingSeconds = 0;
  audioChunks = [];
  setTimeout(() => startRecording(), 300);
});

voicePauseBtn.addEventListener('click', () => {
  if (!mediaRecorder) return;
  if (mediaRecorder.state === 'recording') {
    mediaRecorder.pause();
    voicePauseBtn.textContent = 'Resume';
    if (recordingTimer) {
      clearInterval(recordingTimer);
      recordingTimer = null;
    }
  } else if (mediaRecorder.state === 'paused') {
    mediaRecorder.resume();
    voicePauseBtn.textContent = 'Pause';
    recordingTimer = setInterval(() => {
      recordingSeconds++;
      voiceTimer.textContent = formatTimer(recordingSeconds);
      if (recordingSeconds >= VOICE_MAX_SEC) {
        showVoiceError('Maximum 3 minutes reached');
        stopRecording();
      }
    }, 1000);
  }
});

voiceSendAgainBtn.addEventListener('click', () => {
  voicePreview.style.display = 'none';
  voicePreviewAudio.src = '';
  voiceSendBtn.disabled = true;
  voicePauseBtn.disabled = true;
  voiceTimer.textContent = '00:00';
  recordingSeconds = 0;
  audioChunks = [];
  setTimeout(() => startRecording(), 300);
});

voiceSendBtn.addEventListener('click', async () => {
  if (audioChunks.length === 0) return;
  const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus'
    : 'audio/webm';
  const blob = new Blob(audioChunks, { type: mimeType });

  voiceSendBtn.disabled = true;
  voiceSendBtn.textContent = 'Uploading...';

  try {
    const uploadResult = await API.uploadVoice(blob);
    await API.createNote(uploadResult.key, 'voice');
    await loadNotes();
    closeVoiceModal();
    showToast('Voice note sent!');
  } catch (e) {
    showToast(e.message || 'Failed to send voice note');
    voiceSendBtn.disabled = false;
    voiceSendBtn.textContent = 'Send';
  }
});

voiceCancelBtn.addEventListener('click', closeVoiceModal);
voiceCloseBtn.addEventListener('click', closeVoiceModal);
voiceModal.addEventListener('click', (e) => {
  if (e.target === voiceModal) closeVoiceModal();
});
