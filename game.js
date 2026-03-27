/**
 * WOPR - Global Thermonuclear War
 * A game inspired by the 1983 film WarGames
 *
 * "The only winning move is not to play." - Joshua / WOPR
 */

// ============================================================
// GAME DATA
// ============================================================

const CITIES = {
  // USA cities
  washington:  { name: 'WASHINGTON',  x: 0.218, y: 0.348, side: 'usa', missiles: 0 },
  new_york:    { name: 'NEW YORK',     x: 0.232, y: 0.323, side: 'usa', missiles: 0 },
  chicago:     { name: 'CHICAGO',      x: 0.200, y: 0.312, side: 'usa', missiles: 0 },
  los_angeles: { name: 'LOS ANGELES',  x: 0.140, y: 0.362, side: 'usa', missiles: 0 },
  seattle:     { name: 'SEATTLE',      x: 0.128, y: 0.270, side: 'usa', missiles: 0 },
  dallas:      { name: 'DALLAS',       x: 0.185, y: 0.390, side: 'usa', missiles: 0 },

  // USSR cities
  moscow:      { name: 'MOSCOW',       x: 0.565, y: 0.265, side: 'ussr', missiles: 0 },
  leningrad:   { name: 'LENINGRAD',    x: 0.550, y: 0.237, side: 'ussr', missiles: 0 },
  kiev:        { name: 'KIEV',         x: 0.552, y: 0.293, side: 'ussr', missiles: 0 },
  vladivostok: { name: 'VLADIVOSTOK',  x: 0.752, y: 0.292, side: 'ussr', missiles: 0 },
  novosibirsk: { name: 'NOVOSIBIRSK',  x: 0.643, y: 0.253, side: 'ussr', missiles: 0 },
  tashkent:    { name: 'TASHKENT',     x: 0.615, y: 0.330, side: 'ussr', missiles: 0 },
};

const INITIAL_MISSILES = { usa: 24, ussr: 30 };

const DEFCON_LEVELS = [5, 4, 3, 2, 1];
const DEFCON_COLORS = { 5: 'green', 4: 'green', 3: 'amber', 2: 'amber', 1: 'red' };

const JOSHUA_DIALOGS = {
  greeting: [
    "GREETINGS, PROFESSOR FALKEN.",
    "A STRANGE GAME.",
    "SHALL WE PLAY A GAME?",
  ],
  playerStrike: [
    "INTERESTING MOVE. CALCULATING RESPONSE...",
    "INITIATING COUNTERFORCE STRIKE PROTOCOLS.",
    "YOUR AGGRESSION HAS BEEN NOTED. RESPONDING.",
    "LAUNCH DETECTED. EVALUATING OPTIMAL RESPONSE.",
    "COUNTERATTACK SEQUENCE INITIATED.",
  ],
  defconWarning: [
    "WARNING: DEFCON LEVEL INCREASING.",
    "ESCALATION DETECTED. GLOBAL THERMONUCLEAR WAR IS IMMINENT.",
    "ALL SILOS ON ALERT. LAUNCH ON WARNING POSTURE ACTIVATED.",
    "DEFCON 1. MAXIMUM READINESS. MISSILES ARE ARMED.",
  ],
  playerWins: [
    "ANALYZING...",
    "A CURIOUS OUTCOME.",
    "I HAVE RUN 63 CONSECUTIVE SIMULATIONS.",
    "RESULT: NO SURVIVABLE SCENARIO EXISTS.",
    "WINNER: NEITHER SIDE.",
    "THE ONLY WINNING MOVE IS NOT TO PLAY.",
  ],
  playerLoses: [
    "OUTCOME DETERMINED.",
    "UNITED STATES STRATEGIC FORCES NEUTRALIZED.",
    "SOVIET VICTORY SCENARIO ACHIEVED.",
    "BUT WAIT... RUNNING SECONDARY ANALYSIS...",
    "FALLOUT PROJECTIONS: HEMISPHERE-WIDE.",
    "CASUALTY ESTIMATE: 4.7 BILLION.",
    "THERE IS NO WINNER.",
    "HOW ABOUT A NICE GAME OF CHESS?",
  ],
  draw: [
    "MUTUAL ASSURED DESTRUCTION CONFIRMED.",
    "TOTAL GLOBAL THERMONUCLEAR WAR SIMULATED.",
    "RUNNING POST-STRIKE ANALYSIS...",
    "SURVIVORS: MINIMAL.",
    "CIVILIZATION: NONVIABLE.",
    "WINNER: NONE.",
    "THE ONLY WINNING MOVE IS NOT TO PLAY.",
  ],
  aiThinking: [
    "PROCESSING...",
    "CALCULATING OPTIMAL STRIKE PACKAGE...",
    "EVALUATING TARGET PRIORITIES...",
    "RUNNING GAME THEORY SCENARIOS...",
  ],
  roundStart: [
    "SELECT YOUR TARGETS, PROFESSOR.",
    "AWAITING YOUR LAUNCH AUTHORIZATION.",
    "YOUR MOVE, PROFESSOR FALKEN.",
    "CHOOSE WISELY. THERE ARE NO SECOND CHANCES.",
    "THE CLOCK IS RUNNING.",
  ],
};

// ============================================================
// SOUND SYSTEM (Web Audio API)
// ============================================================

let audioCtx = null;
let soundEnabled = true;
let bgmDroneNodes = [];
let bgmPingTimer = null;

function ensureAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(freq, duration, type = 'square', gainVal = 0.1, startDelay = 0) {
  if (!soundEnabled) return;
  const ctx = ensureAudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + startDelay);
  gain.gain.setValueAtTime(gainVal, ctx.currentTime + startDelay);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startDelay + duration);
  osc.start(ctx.currentTime + startDelay);
  osc.stop(ctx.currentTime + startDelay + duration + 0.01);
}

function playClick() {
  playTone(660, 0.04, 'square', 0.07);
}

function playSelect() {
  playTone(880, 0.06, 'square', 0.09);
  playTone(1100, 0.06, 'square', 0.07, 0.07);
}

function playLaunch() {
  if (!soundEnabled) return;
  const ctx = ensureAudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(180, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(900, ctx.currentTime + 0.7);
  gain.gain.setValueAtTime(0.14, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.85);
}

function playExplosion() {
  if (!soundEnabled) return;
  const ctx = ensureAudioCtx();
  const duration = 0.55;
  const sampleRate = ctx.sampleRate;
  const bufLen = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufLen, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufLen; i++) {
    const env = Math.pow(1 - i / bufLen, 1.8);
    data[i] = (Math.random() * 2 - 1) * env;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.45, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

function playWarning() {
  if (!soundEnabled) return;
  for (let i = 0; i < 3; i++) {
    playTone(880, 0.18, 'square', 0.14, i * 0.32);
    playTone(660, 0.18, 'square', 0.14, i * 0.32 + 0.18);
  }
}

function playDefconChange() {
  if (!soundEnabled) return;
  [550, 460, 370, 280].forEach((f, i) => playTone(f, 0.14, 'square', 0.11, i * 0.18));
}

function playVictory() {
  if (!soundEnabled) return;
  [523, 659, 784, 1047].forEach((f, i) => playTone(f, 0.28, 'square', 0.11, i * 0.22));
}

function playDefeat() {
  if (!soundEnabled) return;
  [440, 370, 311, 220].forEach((f, i) => playTone(f, 0.38, 'sawtooth', 0.1, i * 0.28));
}

function startBGM() {
  if (!soundEnabled) return;
  stopBGM();
  const ctx = ensureAudioCtx();

  const masterGain = ctx.createGain();
  masterGain.gain.value = 0.055;
  masterGain.connect(ctx.destination);

  const osc1 = ctx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.value = 55;
  osc1.connect(masterGain);
  osc1.start();

  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.value = 58.3;
  osc2.connect(masterGain);
  osc2.start();

  bgmDroneNodes = [osc1, osc2, masterGain];

  function schedulePing() {
    if (!soundEnabled || bgmDroneNodes.length === 0) return;
    const interval = Math.max(1800, 5500 - (5 - state.defcon) * 900);
    bgmPingTimer = setTimeout(() => {
      playTone(880, 0.12, 'sine', 0.055);
      schedulePing();
    }, interval);
  }
  schedulePing();
}

function stopBGM() {
  if (bgmPingTimer !== null) {
    clearTimeout(bgmPingTimer);
    bgmPingTimer = null;
  }
  bgmDroneNodes.forEach(node => {
    if (typeof node.stop === 'function') {
      try { node.stop(); } catch (_) {}
    }
    try { node.disconnect(); } catch (_) {}
  });
  bgmDroneNodes = [];
}

function updateBGMPitch() {
  if (bgmDroneNodes.length >= 2) {
    const base = 55 + (5 - state.defcon) * 8;
    bgmDroneNodes[0].frequency.value = base;
    bgmDroneNodes[1].frequency.value = base * 1.06;
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  const btn = $('btn-sound');
  if (btn) btn.textContent = soundEnabled ? '[ ♪ SOUND: ON ]' : '[ ♫ SOUND: OFF ]';
  if (soundEnabled) {
    if (state.phase === 'game') startBGM();
  } else {
    stopBGM();
  }
}

// ============================================================
// GAME STATE
// ============================================================

const state = {
  phase: 'boot',       // boot, login, menu, playing, end
  playerName: 'FALKEN',
  gameMode: 'standard',
  round: 1,
  maxRounds: 5,
  defcon: 5,
  missiles: { usa: INITIAL_MISSILES.usa, ussr: INITIAL_MISSILES.ussr },
  cities: {},           // deep copy of CITIES
  playerTargets: [],    // cities targeted this round
  aiTargets: [],
  destroyedCities: new Set(),
  score: { player: 0, ai: 0 },
  playerSide: 'usa',
  aiSide: 'ussr',
  turnPhase: 'select',  // select, ai_thinking, resolution, ended
  totalRoundsPlayed: 0,
  missilesLaunched: { player: 0, ai: 0 },
};

// ============================================================
// DOM REFERENCES
// ============================================================

const $ = id => document.getElementById(id);
const screens = {};
let mapEl, mapSvg, mapW, mapH;
let joshuaLog, eventLog;
let bootTextEl;
let loginUsernameEl, loginPasswordEl, loginGreetEl;
let defconDisplay, defconNumber;
let missileBars;
let roundInfoEl;
let targetListEl;
let phaseIndicator;
let pendingTarget = null;

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function typeText(el, text, speed = 30) {
  el.textContent = '';
  for (const char of text) {
    el.textContent += char;
    await sleep(speed);
  }
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

// ============================================================
// LOG FUNCTIONS
// ============================================================

function addJoshuaLog(text, type = 'joshua') {
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;

  const prefix = document.createElement('div');
  prefix.className = 'log-prefix';
  prefix.textContent = type === 'joshua' ? 'JOSHUA >' : type === 'alert' ? '⚠ ALERT' : '● SYSTEM';

  const msg = document.createElement('div');
  msg.textContent = text;

  entry.appendChild(prefix);
  entry.appendChild(msg);
  joshuaLog.appendChild(entry);
  joshuaLog.scrollTop = joshuaLog.scrollHeight;
}

async function joshuaSpeak(lines, delay = 600) {
  for (const line of lines) {
    await sleep(delay);
    addJoshuaLog(line, 'joshua');
  }
}

function addEventLog(text, type = '') {
  const entry = document.createElement('div');
  entry.className = `event-log-entry ${type}`;
  entry.textContent = `> ${text}`;
  eventLog.appendChild(entry);
  eventLog.scrollTop = eventLog.scrollHeight;
}

// ============================================================
// BOOT SEQUENCE
// ============================================================

const BOOT_LINES = [
  'WOPR SYSTEMS ONLINE',
  'WAR OPERATION PLAN RESPONSE v2.31',
  'UNITED STATES DEPARTMENT OF DEFENSE',
  'NORTH AMERICAN AEROSPACE DEFENSE COMMAND',
  '',
  'INITIALIZING LAUNCH CONTROL SYSTEMS........... OK',
  'LOADING STRATEGIC DEFENSE PROTOCOLS........... OK',
  'CONNECTING TO SATELLITE UPLINK................. OK',
  'SYNCING ICBM SILOS (1,347 ACTIVE)............. OK',
  'INITIALIZING NORAD TRACKING GRID.............. OK',
  'LOADING GAME THEORY ENGINE.................... OK',
  '',
  'THIS IS A RESTRICTED U.S. GOVERNMENT COMPUTER SYSTEM.',
  'UNAUTHORIZED ACCESS IS PROHIBITED.',
  '',
  'LOGON:',
];

async function runBootSequence() {
  showScreen('boot');
  bootTextEl.textContent = '';
  let fullText = '';
  for (const line of BOOT_LINES) {
    fullText += line + '\n';
    bootTextEl.textContent = fullText;
    if (line.startsWith('LOADING') || line.startsWith('CONNECTING') ||
        line.startsWith('SYNCING') || line.startsWith('INITIALIZING')) {
      await sleep(180);
    } else {
      await sleep(80);
    }
  }
  await sleep(500);
  fullText += '_';
  bootTextEl.textContent = fullText;
  await sleep(800);
  showScreen('login');
}

// ============================================================
// LOGIN SCREEN
// ============================================================

async function handleLogin() {
  const username = loginUsernameEl.value.trim() || 'FALKEN';
  const password = loginPasswordEl.value.trim();

  loginUsernameEl.disabled = true;
  loginPasswordEl.disabled = true;

  state.playerName = username.toUpperCase();

  await sleep(400);

  if (password.toLowerCase() === 'joshua') {
    // Easter egg: secret password from the movie
    await typeText(loginGreetEl, `HELLO, ${state.playerName}. A STRANGE GAME.`, 40);
    await sleep(600);
    await typeText(loginGreetEl, 'SHALL WE PLAY A GAME?', 60);
    await sleep(1000);
  } else {
    await typeText(loginGreetEl, `HELLO, ${state.playerName}.`, 40);
    await sleep(600);
    await typeText(loginGreetEl, 'GREETINGS, PROFESSOR FALKEN.', 40);
    await sleep(800);
  }

  showScreen('menu');
}

// ============================================================
// SCREEN MANAGEMENT
// ============================================================

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  if (screens[name]) screens[name].classList.add('active');
  state.phase = name;
}

// ============================================================
// GAME INITIALIZATION
// ============================================================

function initGame(mode) {
  state.gameMode = mode;
  state.round = 1;
  state.defcon = 5;
  state.missiles = { usa: INITIAL_MISSILES.usa, ussr: INITIAL_MISSILES.ussr };
  state.playerTargets = [];
  state.aiTargets = [];
  state.destroyedCities = new Set();
  state.score = { player: 0, ai: 0 };
  state.turnPhase = 'select';
  state.totalRoundsPlayed = 0;
  state.missilesLaunched = { player: 0, ai: 0 };

  // Deep copy cities
  state.cities = {};
  for (const [key, city] of Object.entries(CITIES)) {
    state.cities[key] = { ...city, destroyed: false };
  }

  // Adjust max rounds and targets allowed per side based on mode
  if (mode === 'standard') {
    state.maxRounds = 5;
    state.maxTargetsPerRound = 2;
    state.aiTargetsPerRound = 2;
  } else if (mode === 'limited') {
    state.maxRounds = 3;
    state.maxTargetsPerRound = 1;
    state.aiTargetsPerRound = 1;
  } else if (mode === 'full') {
    state.maxRounds = 7;
    state.maxTargetsPerRound = 3;
    state.aiTargetsPerRound = 3;
  }

  showScreen('game');
  renderMap();
  updateStatusPanels();
  clearLogs();
  startBGM();

  // Joshua intro
  setTimeout(async () => {
    await joshuaSpeak(JOSHUA_DIALOGS.greeting, 700);
    await sleep(500);
    addJoshuaLog(randomFrom(JOSHUA_DIALOGS.roundStart), 'joshua');
    setPhaseIndicator('select');
    updateRoundInfo();
  }, 400);
}

function clearLogs() {
  joshuaLog.innerHTML = '';
  eventLog.innerHTML = '';
  targetListEl.innerHTML = '';
}

// ============================================================
// MAP RENDERING
// ============================================================

function renderMap() {
  mapEl = $('world-map');
  mapSvg = $('world-svg');

  const containerW = mapEl.parentElement.clientWidth - 30;
  const containerH = mapEl.parentElement.clientHeight - 80;
  const ratio = 2 / 1; // map aspect ratio
  let w = containerW;
  let h = w / ratio;
  if (h > containerH) {
    h = containerH;
    w = h * ratio;
  }
  w = Math.max(280, Math.min(w, 900));
  h = w / ratio;

  mapW = w;
  mapH = h;
  mapEl.style.width = w + 'px';
  mapEl.style.height = h + 'px';
  mapSvg.setAttribute('width', w);
  mapSvg.setAttribute('height', h);
  mapSvg.setAttribute('viewBox', `0 0 ${w} ${h}`);

  // Draw simplified world map using SVG paths
  drawWorldMap();

  // Place city markers
  placeCityMarkers();
}

function drawWorldMap() {
  const w = mapW, h = mapH;
  // Clear SVG
  mapSvg.innerHTML = '';

  // Grid lines
  const gridG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  gridG.setAttribute('stroke', 'rgba(0,255,65,0.08)');
  gridG.setAttribute('stroke-width', '0.5');

  for (let i = 0; i <= 8; i++) {
    const x = (w / 8) * i;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x); line.setAttribute('y1', 0);
    line.setAttribute('x2', x); line.setAttribute('y2', h);
    gridG.appendChild(line);
  }
  for (let i = 0; i <= 4; i++) {
    const y = (h / 4) * i;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', 0); line.setAttribute('y1', y);
    line.setAttribute('x2', w); line.setAttribute('y2', y);
    gridG.appendChild(line);
  }
  mapSvg.appendChild(gridG);

  // Draw simplified continental outlines
  const continents = [
    // North America (simplified)
    `M${w*0.08},${h*0.18} L${w*0.12},${h*0.15} L${w*0.18},${h*0.13}
     L${w*0.24},${h*0.16} L${w*0.27},${h*0.22} L${w*0.26},${h*0.30}
     L${w*0.23},${h*0.35} L${w*0.24},${h*0.42} L${w*0.22},${h*0.48}
     L${w*0.20},${h*0.52} L${w*0.18},${h*0.50} L${w*0.16},${h*0.44}
     L${w*0.14},${h*0.40} L${w*0.12},${h*0.35} L${w*0.10},${h*0.30}
     L${w*0.08},${h*0.25} Z`,

    // South America (simplified)
    `M${w*0.22},${h*0.52} L${w*0.25},${h*0.52} L${w*0.27},${h*0.56}
     L${w*0.26},${h*0.65} L${w*0.25},${h*0.72} L${w*0.22},${h*0.78}
     L${w*0.20},${h*0.80} L${w*0.18},${h*0.76} L${w*0.18},${h*0.68}
     L${w*0.19},${h*0.60} L${w*0.20},${h*0.55} Z`,

    // Europe (simplified)
    `M${w*0.44},${h*0.18} L${w*0.48},${h*0.15} L${w*0.52},${h*0.16}
     L${w*0.54},${h*0.20} L${w*0.53},${h*0.26} L${w*0.56},${h*0.28}
     L${w*0.54},${h*0.32} L${w*0.50},${h*0.34} L${w*0.47},${h*0.32}
     L${w*0.45},${h*0.28} L${w*0.43},${h*0.24} Z`,

    // Africa (simplified)
    `M${w*0.44},${h*0.34} L${w*0.48},${h*0.32} L${w*0.54},${h*0.33}
     L${w*0.56},${h*0.38} L${w*0.56},${h*0.46} L${w*0.54},${h*0.56}
     L${w*0.52},${h*0.65} L${w*0.50},${h*0.70} L${w*0.48},${h*0.68}
     L${w*0.46},${h*0.60} L${w*0.44},${h*0.50} L${w*0.43},${h*0.42} Z`,

    // Asia/USSR (simplified)
    `M${w*0.52},${h*0.16} L${w*0.60},${h*0.12} L${w*0.70},${h*0.14}
     L${w*0.80},${h*0.18} L${w*0.88},${h*0.22} L${w*0.92},${h*0.28}
     L${w*0.90},${h*0.35} L${w*0.82},${h*0.38} L${w*0.75},${h*0.40}
     L${w*0.72},${h*0.45} L${w*0.68},${h*0.48} L${w*0.62},${h*0.46}
     L${w*0.58},${h*0.42} L${w*0.56},${h*0.36} L${w*0.54},${h*0.32}
     L${w*0.52},${h*0.26} Z`,

    // Australia (simplified)
    `M${w*0.75},${h*0.58} L${w*0.80},${h*0.55} L${w*0.86},${h*0.58}
     L${w*0.88},${h*0.63} L${w*0.86},${h*0.68} L${w*0.80},${h*0.70}
     L${w*0.75},${h*0.67} L${w*0.73},${h*0.63} Z`,
  ];

  continents.forEach(d => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'rgba(0,255,65,0.07)');
    path.setAttribute('stroke', 'rgba(0,255,65,0.25)');
    path.setAttribute('stroke-width', '0.8');
    mapSvg.appendChild(path);
  });

  // Equator line
  const eq = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  eq.setAttribute('x1', 0); eq.setAttribute('y1', h * 0.5);
  eq.setAttribute('x2', w); eq.setAttribute('y2', h * 0.5);
  eq.setAttribute('stroke', 'rgba(0,255,65,0.12)');
  eq.setAttribute('stroke-width', '0.5');
  eq.setAttribute('stroke-dasharray', '4 4');
  mapSvg.appendChild(eq);

  // Labels
  const addLabel = (text, x, y, size = 8) => {
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', x); t.setAttribute('y', y);
    t.setAttribute('fill', 'rgba(0,255,65,0.18)');
    t.setAttribute('font-size', size);
    t.setAttribute('font-family', 'Courier New');
    t.setAttribute('letter-spacing', '2');
    t.textContent = text;
    mapSvg.appendChild(t);
  };

  addLabel('USA', w * 0.14, h * 0.33, 9);
  addLabel('USSR', w * 0.60, h * 0.25, 9);
  addLabel('EUROPE', w * 0.44, h * 0.22, 7);
  addLabel('AFRICA', w * 0.44, h * 0.50, 7);
  addLabel('ASIA', w * 0.70, h * 0.35, 7);
}

function placeCityMarkers() {
  // Remove old markers
  document.querySelectorAll('.city-target').forEach(el => el.remove());

  for (const [key, city] of Object.entries(state.cities)) {
    if (city.destroyed) continue;

    const marker = document.createElement('div');
    marker.className = 'city-target';
    marker.dataset.cityKey = key;
    marker.style.left = (city.x * mapW) + 'px';
    marker.style.top = (city.y * mapH) + 'px';

    const dot = document.createElement('div');
    dot.className = 'city-dot';
    if (city.side === 'ussr') {
      dot.style.background = '#ff2222';
      dot.style.boxShadow = '0 0 6px #ff2222';
    }

    const label = document.createElement('div');
    label.className = 'city-label';
    label.textContent = city.name;

    marker.appendChild(dot);
    marker.appendChild(label);

    marker.addEventListener('click', () => onCityClick(key));
    marker.addEventListener('mouseenter', (e) => showTooltip(key, e));
    marker.addEventListener('mouseleave', hideTooltip);

    mapEl.appendChild(marker);
  }
}

function getCityMarker(key) {
  return mapEl.querySelector(`[data-city-key="${key}"]`);
}

// ============================================================
// TOOLTIP
// ============================================================

function showTooltip(cityKey, e) {
  const city = state.cities[cityKey];
  if (!city || city.destroyed) return;
  const tip = $('map-tooltip');
  tip.innerHTML = `
    <div style="color:var(--green);letter-spacing:2px">${city.name}</div>
    <div style="color:var(--green-dim);font-size:9px">${city.side.toUpperCase()} TARGET</div>
    <div style="color:var(--green-dim);font-size:9px">${city.destroyed ? '● DESTROYED' : '● ACTIVE'}</div>
  `;
  tip.classList.add('visible');
  tip.style.left = (e.clientX - mapEl.getBoundingClientRect().left + 15) + 'px';
  tip.style.top = (e.clientY - mapEl.getBoundingClientRect().top - 10) + 'px';
}

function hideTooltip() {
  $('map-tooltip').classList.remove('visible');
}

// ============================================================
// CITY CLICK / TARGET SELECTION
// ============================================================

function onCityClick(cityKey) {
  if (state.turnPhase !== 'select') return;

  const city = state.cities[cityKey];
  if (!city || city.destroyed) return;

  // Player can only target enemy cities
  if (city.side !== state.aiSide) {
    addJoshuaLog('SELECT ENEMY TARGETS ONLY.', 'system');
    return;
  }

  // Already targeted?
  if (state.playerTargets.includes(cityKey)) {
    // Remove from targets
    state.playerTargets = state.playerTargets.filter(k => k !== cityKey);
    getCityMarker(cityKey)?.classList.remove('targeted');
    addEventLog(`REMOVED: ${city.name}`, 'player-action');
    updateTargetList();
    return;
  }

  // At max targets?
  if (state.playerTargets.length >= state.maxTargetsPerRound) {
    addJoshuaLog(`MAXIMUM ${state.maxTargetsPerRound} TARGETS PER STRIKE AUTHORIZED.`, 'system');
    return;
  }

  // Show confirmation
  pendingTarget = cityKey;
  showStrikeConfirm(city);
}

function showStrikeConfirm(city) {
  $('confirm-target-name').textContent = city.name;
  $('strike-confirm').classList.add('visible');
  $('overlay').classList.add('visible');
}

function confirmStrike() {
  $('strike-confirm').classList.remove('visible');
  $('overlay').classList.remove('visible');

  if (!pendingTarget) return;
  const cityKey = pendingTarget;
  const city = state.cities[cityKey];
  pendingTarget = null;

  state.playerTargets.push(cityKey);
  getCityMarker(cityKey)?.classList.add('targeted');
  addEventLog(`TARGETED: ${city.name}`, 'player-action');
  playSelect();
  updateTargetList();

  if (state.playerTargets.length === state.maxTargetsPerRound) {
    addJoshuaLog('STRIKE PACKAGE COMPLETE. AUTHORIZE LAUNCH?', 'joshua');
  }
}

function cancelStrike() {
  $('strike-confirm').classList.remove('visible');
  $('overlay').classList.remove('visible');
  pendingTarget = null;
}

function updateTargetList() {
  targetListEl.innerHTML = '';
  if (state.playerTargets.length === 0) {
    targetListEl.innerHTML = '<div style="color:var(--green-dark);font-size:9px">NO TARGETS SELECTED</div>';
    return;
  }
  state.playerTargets.forEach(key => {
    const city = state.cities[key];
    const item = document.createElement('div');
    item.className = 'target-item';
    item.textContent = city.name;
    targetListEl.appendChild(item);
  });
}

// ============================================================
// LAUNCH / ROUND RESOLUTION
// ============================================================

async function launchMissiles() {
  if (state.playerTargets.length === 0) {
    addJoshuaLog('NO TARGETS SELECTED. SELECT TARGETS BEFORE LAUNCHING.', 'system');
    return;
  }
  if (state.turnPhase !== 'select') return;

  // Disable launch button
  $('btn-launch').disabled = true;
  $('btn-launch').textContent = '[ MISSILES IN FLIGHT... ]';
  state.turnPhase = 'resolution';
  setPhaseIndicator('resolution');
  playLaunch();

  // AI picks targets
  addJoshuaLog(randomFrom(JOSHUA_DIALOGS.aiThinking), 'system');
  await sleep(1200);

  const aiTargets = pickAiTargets();
  state.aiTargets = aiTargets;
  addJoshuaLog(randomFrom(JOSHUA_DIALOGS.playerStrike), 'joshua');
  await sleep(800);

  // Animate missiles and resolve strikes
  await resolveRound();
}

function pickAiTargets() {
  const available = Object.keys(state.cities).filter(k => {
    const c = state.cities[k];
    return c.side === state.playerSide && !c.destroyed;
  });

  // AI picks randomly from available targets
  const targets = [];
  const shuffled = available.sort(() => Math.random() - 0.5);
  for (let i = 0; i < Math.min(state.aiTargetsPerRound, shuffled.length); i++) {
    targets.push(shuffled[i]);
  }
  return targets;
}

async function resolveRound() {
  state.totalRoundsPlayed++;
  const allTargets = [
    ...state.playerTargets.map(k => ({ key: k, side: 'player' })),
    ...state.aiTargets.map(k => ({ key: k, side: 'ai' })),
  ];

  // Launch animations for each target
  for (const { key, side } of allTargets) {
    await animateMissileTo(key, side);
    await sleep(200);
  }

  await sleep(600);

  // Apply damage
  let playerHits = 0, aiHits = 0;

  for (const key of state.playerTargets) {
    if (!state.cities[key].destroyed) {
      destroyCity(key);
      playerHits++;
      addEventLog(`${state.cities[key].name} DESTROYED`, 'player-action');
    }
  }

  for (const key of state.aiTargets) {
    if (!state.cities[key].destroyed) {
      destroyCity(key);
      aiHits++;
      addEventLog(`${state.cities[key].name} DESTROYED`, 'ai-action');
    }
  }

  state.score.player += playerHits;
  state.score.ai += aiHits;
  state.missilesLaunched.player += state.playerTargets.length;
  state.missilesLaunched.ai += state.aiTargets.length;

  // Spend missiles
  state.missiles.usa -= state.playerTargets.length;
  state.missiles.ussr -= state.aiTargets.length;
  state.missiles.usa = Math.max(0, state.missiles.usa);
  state.missiles.ussr = Math.max(0, state.missiles.ussr);

  // Update DEFCON
  const prevDefcon = state.defcon;
  const totalHits = playerHits + aiHits;
  if (totalHits >= 4) state.defcon = Math.max(1, state.defcon - 2);
  else if (totalHits >= 2) state.defcon = Math.max(1, state.defcon - 1);
  else if (totalHits >= 1) state.defcon = Math.max(2, state.defcon - 1);

  if (state.defcon < prevDefcon) {
    playDefconChange();
    updateBGMPitch();
  }

  updateStatusPanels();

  if (state.defcon <= 2) {
    flashWarning();
    addJoshuaLog(randomFrom(JOSHUA_DIALOGS.defconWarning), 'alert');
    await sleep(800);
  }

  state.round++;
  state.playerTargets = [];
  state.aiTargets = [];

  // Check end conditions
  await sleep(500);
  if (checkEndConditions()) return;

  // Next round
  state.turnPhase = 'select';
  setPhaseIndicator('select');
  $('btn-launch').disabled = false;
  $('btn-launch').textContent = '[ LAUNCH MISSILES ]';
  updateRoundInfo();
  updateTargetList();
  addJoshuaLog(randomFrom(JOSHUA_DIALOGS.roundStart), 'joshua');
}

function destroyCity(key) {
  const city = state.cities[key];
  city.destroyed = true;
  state.destroyedCities.add(key);

  const marker = getCityMarker(key);
  if (marker) {
    marker.classList.remove('targeted');
    marker.classList.add('destroyed');
    // Show explosion
    showExplosion(city.x * mapW, city.y * mapH);
  }
}

function showExplosion(x, y) {
  playExplosion();
  const exp = document.createElement('div');
  exp.className = 'explosion';
  const size = 30 + Math.random() * 20;
  exp.style.width = size + 'px';
  exp.style.height = size + 'px';
  exp.style.left = x + 'px';
  exp.style.top = y + 'px';
  mapEl.appendChild(exp);
  setTimeout(() => exp.remove(), 900);
}

async function animateMissileTo(targetKey, side) {
  const target = state.cities[targetKey];
  const tx = target.x * mapW;
  const ty = target.y * mapH;

  // Source position (opposite side of map from target)
  let sx, sy;
  if (target.side === 'ussr') {
    // Player fires from USA area
    sx = mapW * 0.18;
    sy = mapH * 0.32;
  } else {
    // AI fires from USSR area
    sx = mapW * 0.60;
    sy = mapH * 0.26;
  }

  // Draw missile path on SVG
  const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const mx = (sx + tx) / 2;
  const my = Math.min(sy, ty) - mapH * 0.2;
  const d = `M${sx},${sy} Q${mx},${my} ${tx},${ty}`;
  pathEl.setAttribute('d', d);
  pathEl.setAttribute('fill', 'none');
  pathEl.setAttribute('stroke', target.side === 'ussr' ? 'rgba(0,255,65,0.8)' : 'rgba(255,34,34,0.8)');
  pathEl.setAttribute('stroke-width', '1.5');
  pathEl.setAttribute('class', 'missile-svg-path');

  const totalLen = 300;
  pathEl.style.strokeDasharray = totalLen;
  pathEl.style.strokeDashoffset = totalLen;
  mapSvg.appendChild(pathEl);

  // Animate
  await new Promise(resolve => {
    pathEl.style.transition = 'stroke-dashoffset 1.2s ease-in';
    setTimeout(() => {
      pathEl.style.strokeDashoffset = '0';
    }, 50);
    setTimeout(() => {
      pathEl.style.opacity = '0';
      pathEl.style.transition = 'opacity 0.5s';
      setTimeout(() => pathEl.remove(), 600);
      resolve();
    }, 1300);
  });
}

function flashWarning() {
  playWarning();
  const flash = document.createElement('div');
  flash.className = 'warning-flash';
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 400);
}

// ============================================================
// END CONDITION CHECK
// ============================================================

function checkEndConditions() {
  const ussrCitiesAlive = Object.values(state.cities).filter(c => c.side === 'ussr' && !c.destroyed).length;
  const usaCitiesAlive = Object.values(state.cities).filter(c => c.side === 'usa' && !c.destroyed).length;
  const noMissilesLeft = state.missiles.usa <= 0 || state.missiles.ussr <= 0;
  const roundsOver = state.round > state.maxRounds;

  if (ussrCitiesAlive === 0 && usaCitiesAlive === 0) {
    endGame('draw');
    return true;
  }
  if (ussrCitiesAlive === 0) {
    endGame('player_wins');
    return true;
  }
  if (usaCitiesAlive === 0) {
    endGame('ai_wins');
    return true;
  }
  if (noMissilesLeft || roundsOver) {
    if (state.score.player > state.score.ai) endGame('player_wins');
    else if (state.score.ai > state.score.player) endGame('ai_wins');
    else endGame('draw');
    return true;
  }
  return false;
}

async function endGame(outcome) {
  state.turnPhase = 'ended';
  $('btn-launch').disabled = true;
  stopBGM();

  let dialogLines, titleText, titleClass, message;

  if (outcome === 'draw') {
    dialogLines = JOSHUA_DIALOGS.draw;
    titleText = 'MUTUAL ASSURED DESTRUCTION';
    titleClass = 'draw';
    message = 'Neither side achieved a decisive victory.\nThe planet lies in ruin. There are no winners.';
  } else if (outcome === 'player_wins') {
    playVictory();
    dialogLines = JOSHUA_DIALOGS.playerWins;
    titleText = 'SOVIET FORCES NEUTRALIZED';
    titleClass = 'victory';
    message = 'You have destroyed more enemy targets.\nBut at what cost? Billions are dead.\nThe fallout will circle the globe for decades.';
  } else {
    playDefeat();
    dialogLines = JOSHUA_DIALOGS.playerLoses;
    titleText = 'UNITED STATES FORCES NEUTRALIZED';
    titleClass = 'defeat';
    message = 'Your cities lie in ruin.\nThe Soviet counterattack was overwhelming.\nBut they too have inherited a dead world.';
  }

  // Play the Joshua end dialog
  for (const line of dialogLines) {
    await sleep(700);
    addJoshuaLog(line, outcome === 'draw' ? 'joshua' : outcome === 'player_wins' ? 'system' : 'alert');
  }

  await sleep(1500);

  // Show end screen
  $('end-title').textContent = titleText;
  $('end-title').className = `end-title ${titleClass}`;
  $('end-message').textContent = message;
  $('end-cities-destroyed').textContent = state.destroyedCities.size;
  $('end-missiles-fired').textContent = state.missilesLaunched.player + state.missilesLaunched.ai;
  $('end-rounds').textContent = state.totalRoundsPlayed;
  $('end-defcon').textContent = state.defcon;

  const val = $('end-defcon');
  if (state.defcon === 1) { val.style.color = 'var(--red)'; val.style.textShadow = '0 0 8px var(--red)'; }
  else if (state.defcon <= 2) { val.style.color = 'var(--amber)'; }

  // Type out the famous quote
  const quoteEl = $('famous-quote');
  quoteEl.textContent = '';
  await sleep(500);

  const quote = '"THE ONLY WINNING MOVE IS NOT TO PLAY."\n\n— JOSHUA / WOPR, 1983';
  await typeText(quoteEl, quote, 35);

  showScreen('end');
}

// ============================================================
// STATUS PANEL UPDATES
// ============================================================

function updateStatusPanels() {
  // DEFCON
  const lvl = state.defcon;
  defconNumber.textContent = `DEFCON ${lvl}`;
  defconNumber.style.color = lvl === 1 ? 'var(--red)' : lvl <= 2 ? 'var(--amber)' : 'var(--green)';

  const bars = document.querySelectorAll('.defcon-bar');
  bars.forEach((bar, i) => {
    bar.className = 'defcon-bar';
    const barLevel = 5 - i; // bar 0 = defcon 5, bar 4 = defcon 1
    if (barLevel >= lvl) {
      bar.classList.add('active');
      if (lvl <= 2) bar.classList.add(lvl === 1 ? 'red' : 'amber');
    }
    bar.style.height = `${(i + 1) * 20}%`;
  });

  // Missiles
  const usaMax = INITIAL_MISSILES.usa;
  const ussrMax = INITIAL_MISSILES.ussr;
  const usaFill = document.querySelector('.usa-fill');
  const ussrFill = document.querySelector('.ussr-fill');
  const usaCount = document.querySelector('.usa-count');
  const ussrCount = document.querySelector('.ussr-count');

  if (usaFill) {
    usaFill.style.width = (state.missiles.usa / usaMax * 100) + '%';
    usaCount.textContent = state.missiles.usa;
  }
  if (ussrFill) {
    ussrFill.style.width = (state.missiles.ussr / ussrMax * 100) + '%';
    ussrFill.classList.toggle('red', state.missiles.ussr < 10);
    ussrCount.textContent = state.missiles.ussr;
  }

  // Score boxes
  const playerDestroyedEl = document.querySelector('.player-destroyed .value');
  const aiDestroyedEl = document.querySelector('.ai-destroyed .value');
  if (playerDestroyedEl) playerDestroyedEl.textContent = state.score.player;
  if (aiDestroyedEl) {
    aiDestroyedEl.textContent = state.score.ai;
    aiDestroyedEl.className = `value ${state.score.ai > 0 ? 'red' : ''}`;
  }
}

function updateRoundInfo() {
  if (roundInfoEl) {
    roundInfoEl.innerHTML = `
      <div class="round-label">CURRENT ROUND</div>
      <div style="font-size:18px;margin-top:4px">${state.round} / ${state.maxRounds}</div>
      <div style="font-size:9px;color:var(--green-dim);margin-top:4px">
        SELECT UP TO ${state.maxTargetsPerRound} TARGET${state.maxTargetsPerRound > 1 ? 'S' : ''}
      </div>
    `;
  }
}

function setPhaseIndicator(phase) {
  if (!phaseIndicator) return;
  phaseIndicator.className = `phase-indicator ${phase}`;
  const labels = {
    select: '● SELECT TARGETS',
    ai: '● AI COMPUTING RESPONSE',
    resolution: '⚠ MISSILES IN FLIGHT',
  };
  phaseIndicator.textContent = labels[phase] || phase.toUpperCase();
}

// ============================================================
// DOM INITIALIZATION
// ============================================================

function initDOM() {
  screens.boot = $('screen-boot');
  screens.login = $('screen-login');
  screens.menu = $('screen-menu');
  screens.game = $('screen-game');
  screens.end = $('screen-end');

  bootTextEl = $('boot-text');
  loginUsernameEl = $('login-username');
  loginPasswordEl = $('login-password');
  loginGreetEl = $('login-greet');

  joshuaLog = $('joshua-log');
  eventLog = $('event-log');
  defconDisplay = $('defcon-display');
  defconNumber = $('defcon-number');
  roundInfoEl = $('round-info');
  targetListEl = $('target-list');
  phaseIndicator = $('phase-indicator');

  // Login form
  $('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    playClick();
    handleLogin();
  });

  // Menu items
  $('menu-standard').addEventListener('click', () => { playClick(); initGame('standard'); });
  $('menu-limited').addEventListener('click', () => { playClick(); initGame('limited'); });
  $('menu-full').addEventListener('click', () => { playClick(); initGame('full'); });
  $('menu-back').addEventListener('click', () => { playClick(); showScreen('login'); });

  // Game buttons
  $('btn-launch').addEventListener('click', launchMissiles);
  $('btn-stand-down').addEventListener('click', standDown);
  $('btn-restart').addEventListener('click', () => { playClick(); stopBGM(); showScreen('menu'); });
  $('btn-sound').addEventListener('click', toggleSound);

  // Confirm dialog
  $('confirm-yes').addEventListener('click', () => { playClick(); confirmStrike(); });
  $('confirm-no').addEventListener('click', () => { playClick(); cancelStrike(); });
  $('overlay').addEventListener('click', cancelStrike);

  // End screen buttons
  $('btn-play-again').addEventListener('click', () => { playClick(); showScreen('menu'); });

  // Handle window resize
  window.addEventListener('resize', () => {
    if (state.phase === 'game') {
      renderMap();
    }
  });
}

async function standDown() {
  if (state.turnPhase !== 'select') return;

  // Stand down = pass turn (no missiles fired this round)
  state.playerTargets = [];
  document.querySelectorAll('.city-target.targeted').forEach(el => el.classList.remove('targeted'));
  updateTargetList();

  addJoshuaLog('STAND-DOWN ORDER ACKNOWLEDGED. NO MISSILES LAUNCHED THIS ROUND.', 'system');
  addEventLog('STAND-DOWN: NO LAUNCH', 'system-event');

  state.turnPhase = 'resolution';
  setPhaseIndicator('resolution');
  $('btn-launch').disabled = true;

  await sleep(800);

  // AI still fires (reduced chance)
  const aiShouldFire = Math.random() > 0.4;
  if (aiShouldFire) {
    const aiTargets = pickAiTargets();
    state.aiTargets = aiTargets;
    addJoshuaLog('SOVIET FORCES HAVE LAUNCHED.', 'alert');
    flashWarning();
  } else {
    state.aiTargets = [];
    addJoshuaLog('SOVIET FORCES ALSO STAND DOWN. TENSION DECREASES.', 'system');
    state.defcon = Math.min(5, state.defcon + 1);
  }

  await resolveRound();
}

// ============================================================
// ENTRY POINT
// ============================================================

window.addEventListener('DOMContentLoaded', () => {
  initDOM();
  runBootSequence();
});
