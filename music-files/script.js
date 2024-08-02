let audioContext = null;
let analyser = null;
let masterGainNode = null;
let pianoGainNode = null;
let kickGainNode = null;
let snareGainNode = null;
let hihatGainNode = null;
let tomGainNode = null;
let crashGainNode = null;
let rideGainNode = null;
let recorder = null;
let recordedChunks = [];
let recordedBuffer = null;
let sequencerInterval = null;
const sequencerSteps = 16;
const sequencer = [];
const drumSounds = ['kick', 'snare', 'hihat', 'tom', 'crash', 'ride'];
const currentlyPressedKeys = new Set();
const activeOscillators = new Map();

const keyMapping = {
    'z': 'C1',  's': 'C#1', 'x': 'D1',  'd': 'D#1', 'c': 'E1',  'v': 'F1',  'g': 'F#1', 
    'b': 'G1',  'h': 'G#1', 'n': 'A1',  'j': 'A#1', 'm': 'B1', 
    'q': 'C',   '2': 'C#',  'w': 'D',   '3': 'D#',  'e': 'E',   'r': 'F',   '5': 'F#', 
    't': 'G',   '6': 'G#',  'y': 'A',   '7': 'A#',  'u': 'B',   'i': 'C2'
};

const frequencies = {
  'C1': 130.81, 'C#1': 138.59, 'D1': 146.83, 'D#1': 155.56, 'E1': 164.81,
  'F1': 174.61, 'F#1': 185.00, 'G1': 196.00, 'G#1': 207.65, 'A1': 220.00,
  'A#1': 233.08, 'B1': 246.94,
  'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13, 'E': 329.63,
  'F': 349.23, 'F#': 369.99, 'G': 392.00, 'G#': 415.30, 'A': 440.00,
  'A#': 466.16, 'B': 493.88, 'C2': 523.25
};

const initializeAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    masterGainNode = audioContext.createGain();
    pianoGainNode = audioContext.createGain();
    kickGainNode = audioContext.createGain();
    snareGainNode = audioContext.createGain();
    hihatGainNode = audioContext.createGain();
    tomGainNode = audioContext.createGain();
    crashGainNode = audioContext.createGain();
    rideGainNode = audioContext.createGain();

    masterGainNode.connect(audioContext.destination);
    pianoGainNode.connect(masterGainNode);
    kickGainNode.connect(masterGainNode);
    snareGainNode.connect(masterGainNode);
    hihatGainNode.connect(masterGainNode);
    tomGainNode.connect(masterGainNode);
    crashGainNode.connect(masterGainNode);
    rideGainNode.connect(masterGainNode);
    analyser.fftSize = 2048;
    analyser.connect(masterGainNode);

    console.log("AudioContext initialized");

    ['click', 'touchstart'].forEach(eventType => {
      document.addEventListener(eventType, () => {
        if (audioContext.state === 'suspended') {
          audioContext.resume().then(() => {
            console.log('AudioContext resumed');
          });
        }
      });
    });

    drumSounds.forEach((drum, rowIndex) => {
      sequencer[rowIndex] = Array(sequencerSteps).fill(false);
    });

    document.getElementById('kickVolume').addEventListener('input', (e) => {
      kickGainNode.gain.value = e.target.value;
    });
    document.getElementById('snareVolume').addEventListener('input', (e) => {
      snareGainNode.gain.value = e.target.value;
    });
    document.getElementById('hihatVolume').addEventListener('input', (e) => {
      hihatGainNode.gain.value = e.target.value;
    });
    document.getElementById('tomVolume').addEventListener('input', (e) => {
      tomGainNode.gain.value = e.target.value;
    });
    document.getElementById('crashVolume').addEventListener('input', (e) => {
      crashGainNode.gain.value = e.target.value;
    });
    document.getElementById('rideVolume').addEventListener('input', (e) => {
      rideGainNode.gain.value = e.target.value;
    });
    document.getElementById('pianoVolume').addEventListener('input', (e) => {
      pianoGainNode.gain.value = e.target.value;
    });
  }
};

const generateNoiseBuffer = () => {
  const bufferSize = audioContext.sampleRate;
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const output = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  return buffer;
};

const playKick = () => {
  initializeAudioContext();

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
  gain.gain.setValueAtTime(1, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);

  oscillator.connect(gain);
  gain.connect(kickGainNode);
  kickGainNode.connect(analyser);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.5);
};

const playSnare = () => {
  initializeAudioContext();

  const noiseBuffer = generateNoiseBuffer();
  const noise = audioContext.createBufferSource();
  const noiseFilter = audioContext.createBiquadFilter();
  const noiseGain = audioContext.createGain();

  noise.buffer = noiseBuffer;
  noiseFilter.type = 'highpass';
  noiseFilter.frequency.value = 1000;
  noiseGain.gain.setValueAtTime(1, audioContext.currentTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(snareGainNode);
  snareGainNode.connect(analyser);
  noise.start();
  noise.stop(audioContext.currentTime + 0.2);

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
  gain.gain.setValueAtTime(0.7, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);

  oscillator.connect(gain);
  gain.connect(snareGainNode);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.2);
};

const playHiHat = () => {
  initializeAudioContext();

  const noiseBuffer = generateNoiseBuffer();
  const noise = audioContext.createBufferSource();
  const noiseFilter = audioContext.createBiquadFilter();
  const noiseGain = audioContext.createGain();

  noise.buffer = noiseBuffer;
  noiseFilter.type = 'highpass';
  noiseFilter.frequency.value = 5000;
  noiseGain.gain.setValueAtTime(0.5, audioContext.currentTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(hihatGainNode);
  hihatGainNode.connect(analyser);
  noise.start();
  noise.stop(audioContext.currentTime + 0.1);
};

const playTom = () => {
  initializeAudioContext();

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
  gain.gain.setValueAtTime(1, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);

  oscillator.connect(gain);
  gain.connect(tomGainNode);
  tomGainNode.connect(analyser);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.5);
};

const playCrash = () => {
  initializeAudioContext();

  const noiseBuffer = generateNoiseBuffer();
  const noise = audioContext.createBufferSource();
  const noiseGain = audioContext.createGain();

  noise.buffer = noiseBuffer;
  noiseGain.gain.setValueAtTime(1, audioContext.currentTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1);

  noise.connect(noiseGain);
  noiseGain.connect(crashGainNode);
  crashGainNode.connect(analyser);
  noise.start();
  noise.stop(audioContext.currentTime + 1);
};

const playRide = () => {
  initializeAudioContext();

  const noiseBuffer = generateNoiseBuffer();
  const noise = audioContext.createBufferSource();
  const noiseGain = audioContext.createGain();

  noise.buffer = noiseBuffer;
  noiseGain.gain.setValueAtTime(0.5, audioContext.currentTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);

  noise.connect(noiseGain);
  noiseGain.connect(rideGainNode);
  rideGainNode.connect(analyser);
  noise.start();
  noise.stop(audioContext.currentTime + 0.5);
};

const bufferLength = 1024;
const dataArray = new Uint8Array(bufferLength);
const frequencyDataArray = new Uint8Array(bufferLength);

const waveformCanvas = document.getElementById('waveformCanvas');
const waveformCtx = waveformCanvas.getContext('2d');

const pianoCanvas = document.getElementById('pianoCanvas');
const pianoCtx = pianoCanvas.getContext('2d');

const drawVisualizations = () => {
  requestAnimationFrame(drawVisualizations);

  if (analyser) {
    analyser.getByteTimeDomainData(dataArray);
    analyser.getByteFrequencyData(frequencyDataArray);
  }

  waveformCtx.fillStyle = 'rgb(50, 50, 50)';
  waveformCtx.fillRect(0, 0, waveformCanvas.width, waveformCanvas.height);

  waveformCtx.lineWidth = 2;
  waveformCtx.strokeStyle = 'rgb(255, 255, 255)';
  waveformCtx.beginPath();
  const sliceWidth = waveformCanvas.width * 1.0 / bufferLength;
  let x = 0;

  for (let i = 0; i < bufferLength; i++) {
    const v = dataArray[i] / 128.0;
    const y = v * (waveformCanvas.height / 2) / 2;

    if (i === 0) {
      waveformCtx.moveTo(x, y);
    } else {
      waveformCtx.lineTo(x, y);
    }

    x += sliceWidth;
  }

  waveformCtx.lineTo(waveformCanvas.width, waveformCanvas.height / 4);
  waveformCtx.stroke();

  const barWidth = (waveformCanvas.width / bufferLength) * 2.5;
  let barHeight;
  x = 0;

  for (let i = 0; i < bufferLength; i++) {
    barHeight = frequencyDataArray[i];
    waveformCtx.fillStyle = 'rgb(' + (barHeight + 100) + ',50,50)';
    waveformCtx.fillRect(x, waveformCanvas.height / 2 + (waveformCanvas.height / 4 - barHeight / 2), barWidth, barHeight / 2);

    x += barWidth + 1;
  }
};

drawVisualizations();

const createOscillator = (frequency) => {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  gain.gain.value = pianoGainNode.gain.value;

  oscillator.connect(gain);
  gain.connect(pianoGainNode);
  return { oscillator, gain };
};

const startOscillator = (key) => {
  initializeAudioContext();

  const frequency = frequencies[keyMapping[key]];
  if (frequency && !activeOscillators.has(key)) {
    const { oscillator, gain } = createOscillator(frequency);
    oscillator.connect(analyser);
    oscillator.start();
    activeOscillators.set(key, { oscillator, gain });
  }
};

const stopOscillator = (key) => {
  const oscillatorObj = activeOscillators.get(key);
  if (oscillatorObj) {
    oscillatorObj.gain.gain.setValueAtTime(0, audioContext.currentTime + 0.1);
    oscillatorObj.oscillator.stop(audioContext.currentTime + 0.1);
    activeOscillators.delete(key);
  }
};

document.addEventListener('keydown', (event) => {
  if (!currentlyPressedKeys.has(event.key) && keyMapping[event.key]) {
    currentlyPressedKeys.add(event.key);
    startOscillator(event.key);
  }
});

document.addEventListener('keyup', (event) => {
  if (currentlyPressedKeys.has(event.key) && keyMapping[event.key]) {
    currentlyPressedKeys.delete(event.key);
    stopOscillator(event.key);
  }
});

const whiteKeys = ['C1', 'D1', 'E1', 'F1', 'G1', 'A1', 'B1', 'C', 'D', 'E', 'F', 'G', 'A', 'B', 'C2'];
const blackKeys = ['C#1', 'D#1', 'F#1', 'G#1', 'A#1', 'C#', 'D#', 'F#', 'G#', 'A#'];

const whiteKeyWidth = 40;
const whiteKeyHeight = 150;
const blackKeyWidth = 30;
const blackKeyHeight = 100;
const whiteKeyOffsets = whiteKeys.map((_, i) => i * (whiteKeyWidth + 1));
const blackKeyOffsets = [1, 2, 4, 5, 6, 8, 9, 11, 12, 13].map(i => i * (whiteKeyWidth + 1) - blackKeyWidth / 2);

const drawPiano = () => {
  pianoCtx.clearRect(0, 0, pianoCanvas.width, pianoCanvas.height);

  whiteKeyOffsets.forEach((offset, i) => {
    pianoCtx.fillStyle = 'white';
    pianoCtx.fillRect(offset, 0, whiteKeyWidth, whiteKeyHeight);
    pianoCtx.strokeRect(offset, 0, whiteKeyWidth, whiteKeyHeight);
    pianoCtx.fillStyle = 'black';
    pianoCtx.font = '10px Arial';
    const correspondingKey = Object.keys(keyMapping).find(key => keyMapping[key] === whiteKeys[i]);
    pianoCtx.fillText(whiteKeys[i] + `(${correspondingKey})`, offset + 2, whiteKeyHeight - 15);
  });

  blackKeyOffsets.forEach((offset, i) => {
    pianoCtx.fillStyle = 'black';
    pianoCtx.fillRect(offset, 0, blackKeyWidth, blackKeyHeight);
    pianoCtx.strokeRect(offset, 0, blackKeyWidth, blackKeyHeight);
    pianoCtx.fillStyle = 'white';
    pianoCtx.font = '10px Arial';
    const correspondingKey = Object.keys(keyMapping).find(key => keyMapping[key] === blackKeys[i]);
    pianoCtx.fillText(blackKeys[i] + `(${correspondingKey})`, offset + 2, blackKeyHeight - 10);
  });
};

pianoCanvas.addEventListener('mousedown', (e) => {
  initializeAudioContext();

  const rect = pianoCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  for (let i = 0; i < blackKeyOffsets.length; i++) {
    if (x > blackKeyOffsets[i] && x < blackKeyOffsets[i] + blackKeyWidth && y < blackKeyHeight) {
      playSound(frequencies[blackKeys[i]]);
      return;
    }
  }

  for (let i = 0; i < whiteKeyOffsets.length; i++) {
    if (x > whiteKeyOffsets[i] && x < whiteKeyOffsets[i] + whiteKeyWidth) {
      playSound(frequencies[whiteKeys[i]]);
      return;
    }
  }
});

pianoCanvas.addEventListener('touchstart', (e) => {
  initializeAudioContext();

  const rect = pianoCanvas.getBoundingClientRect();
  const x = e.touches[0].clientX - rect.left;
  const y = e.touches[0].clientY - rect.top;

  for (let i = 0; i < blackKeyOffsets.length; i++) {
    if (x > blackKeyOffsets[i] && x < blackKeyOffsets[i] + blackKeyWidth && y < blackKeyHeight) {
      playSound(frequencies[blackKeys[i]]);
      return;
    }
  }

  for (let i = 0; i < whiteKeyOffsets.length; i++) {
    if (x > whiteKeyOffsets[i] && x < whiteKeyOffsets[i] + whiteKeyWidth) {
      playSound(frequencies[whiteKeys[i]]);
      return;
    }
  }
});

drawPiano();

document.getElementById('startRecording').addEventListener('click', () => {
  initializeAudioContext();
  recordedChunks = [];

  const mediaStream = audioContext.createMediaStreamDestination();
  masterGainNode.connect(mediaStream);
  recorder = new MediaRecorder(mediaStream.stream);

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  };

  recorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: 'audio/wav' });
    const reader = new FileReader();
    reader.readAsArrayBuffer(blob);
    reader.onloadend = () => {
      audioContext.decodeAudioData(reader.result, (buffer) => {
        recordedBuffer = buffer;
        document.getElementById('playRecording').disabled = false;
        document.getElementById('downloadRecording').disabled = false;
      });
    };
  };

  recorder.start();
  document.getElementById('startRecording').disabled = true;
  document.getElementById('stopRecording').disabled = false;
  console.log('Recording started');
});

document.getElementById('stopRecording').addEventListener('click', () => {
  recorder.stop();
  document.getElementById('startRecording').disabled = false;
  document.getElementById('stopRecording').disabled = true;
  console.log('Recording stopped');
});

document.getElementById('playRecording').addEventListener('click', () => {
  if (recordedBuffer) {
    const playbackSource = audioContext.createBufferSource();
    playbackSource.buffer = recordedBuffer;
    playbackSource.connect(audioContext.destination);
    playbackSource.start();
    console.log('Playing recording');
  }
});

document.getElementById('downloadRecording').addEventListener('click', () => {
  if (recordedChunks.length > 0) {
    const blob = new Blob(recordedChunks, { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'recording.wav';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    console.log('Recording downloaded');
  }
});

document.querySelectorAll('.drum').forEach(button => {
  button.addEventListener('click', (e) => {
    const sound = e.target.dataset.sound;
    switch (sound) {
      case 'kick':
        playKick();
        break;
      case 'snare':
        playSnare();
        break;
      case 'hihat':
        playHiHat();
        break;
      case 'tom':
        playTom();
        break;
      case 'crash':
        playCrash();
        break;
      case 'ride':
        playRide();
        break;
    }
  });
});

const createSequencerGrid = () => {
  const sequencerContainer = document.getElementById('sequencer');
  sequencerContainer.innerHTML = '';

  drumSounds.forEach((drum, rowIndex) => {
    for (let step = 0; step < sequencerSteps; step++) {
      const cell = document.createElement('div');
      cell.className = 'sequencer-cell';
      cell.dataset.row = rowIndex;
      cell.dataset.step = step;
      cell.addEventListener('click', toggleCell);
      sequencerContainer.appendChild(cell);
    }
  });
};

const toggleCell = (e) => {
  const cell = e.target;
  const row = parseInt(cell.dataset.row);
  const step = parseInt(cell.dataset.step);

  sequencer[row][step] = !sequencer[row][step];
  cell.classList.toggle('active', sequencer[row][step]);
};

const playSequencer = () => {
  let currentStep = 0;
  const interval = (60 / parseInt(document.getElementById('bpm').value)) * 1000 / 4;

  sequencerInterval = setInterval(() => {
    if (!audioContext) {
      initializeAudioContext();
    }
    drumSounds.forEach((drum, rowIndex) => {
      if (sequencer[rowIndex][currentStep]) {
        switch (drum) {
          case 'kick':
            playKick();
            break;
          case 'snare':
            playSnare();
            break;
          case 'hihat':
            playHiHat();
            break;
          case 'tom':
            playTom();
            break;
          case 'crash':
            playCrash();
            break;
          case 'ride':
            playRide();
            break;
        }
      }
    });

    const cells = document.querySelectorAll('.sequencer-cell');
    cells.forEach(cell => {
      const step = parseInt(cell.dataset.step);
      cell.classList.toggle('current', step === currentStep);
    });

    currentStep = (currentStep + 1) % sequencerSteps;
  }, interval);
};

const stopSequencer = () => {
  clearInterval(sequencerInterval);

  const cells = document.querySelectorAll('.sequencer-cell');
  cells.forEach(cell => {
    cell.classList.remove('current');
  });
};

document.getElementById('startSequencer').addEventListener('click', () => {
  playSequencer();
  document.getElementById('startSequencer').disabled = true;
  document.getElementById('stopSequencer').disabled = false;
});

document.getElementById('stopSequencer').addEventListener('click', () => {
  stopSequencer();
  document.getElementById('startSequencer').disabled = false;
  document.getElementById('stopSequencer').disabled = true;
});

createSequencerGrid();
