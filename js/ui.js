/**
 * TEKU DRIVE // UI CONTROLLER
 * Connects sliders, telemetry replay, gradient displays, and canvas visualizer
 * to the TekuMusicEngine.
 */

// Initialize Engine Instance
const engine = new TekuMusicEngine();

// DOM Element Selectors
const btnAudio = document.getElementById('btn-audio');
const btnReplay = document.getElementById('btn-replay');
const btnChillShift = document.getElementById('btn-chill-shift');
const btnStomp = document.getElementById('btn-stomp');

const sliderRpm = document.getElementById('slider-rpm');
const sliderSpd = document.getElementById('slider-spd');
const sliderTps = document.getElementById('slider-tps');
const sliderG = document.getElementById('slider-g');
const sliderTemp = document.getElementById('slider-temp');

const valRpm = document.getElementById('val-rpm');
const valSpd = document.getElementById('val-spd');
const valTps = document.getElementById('val-tps');
const valG = document.getElementById('val-g');
const valTemp = document.getElementById('val-temp');

const modeBadge = document.getElementById('mode-badge');
const labelModeName = document.getElementById('label-mode-name');
const labelBarCycle = document.getElementById('label-bar-cycle');
const labelChord = document.getElementById('label-chord');
const labelAggScore = document.getElementById('label-agg-score');
const labelPan = document.getElementById('label-pan');
const labelThermalState = document.getElementById('label-thermal-state');
const labelCutoff = document.getElementById('label-cutoff');
const logOutput = document.getElementById('log-output');

// Session Seed & Gradient Displays
const labelSessionSeed = document.getElementById('label-session-seed');
const btnRerollSeed = document.getElementById('btn-reroll-seed');
const labelGradientDrums = document.getElementById('label-grad-drums');
const labelGradientStabs = document.getElementById('label-grad-stabs');
const labelGradientCutoff = document.getElementById('label-grad-cutoff');
const labelGradientDrive = document.getElementById('label-grad-drive');

function log(msg) {
  if (!logOutput) return;
  const t = (performance.now() / 1000.0).toFixed(2);
  logOutput.innerHTML = `[+${t}s] ${msg}\n` + logOutput.innerHTML.slice(0, 1500);
}

function updateUI() {
  const rpm = parseInt(sliderRpm.value);
  const spd = parseInt(sliderSpd.value);
  const tps = parseInt(sliderTps.value);
  const g = parseFloat(sliderG.value);
  const temp = sliderTemp ? parseInt(sliderTemp.value) : 88;

  valRpm.textContent = rpm;
  valSpd.textContent = spd;
  valTps.textContent = tps;
  valG.textContent = g.toFixed(2);
  if (valTemp) valTemp.textContent = temp;

  // Ingest into Engine (computes continuous gradients & events)
  engine.updateTelemetry(rpm, spd, tps, g, temp);
  const st = engine.telemetryState;

  // Update Status Displays
  if (labelAggScore) labelAggScore.textContent = st.energy.toFixed(2);
  if (labelCutoff) labelCutoff.textContent = `${Math.round(st.gradients.drumCutoff)} Hz`;

  // Update Continuous Gradient Indicators
  if (labelGradientDrums) {
    const drumPct = Math.round(Math.max(st.gradients.drumsKickHat, st.gradients.drumsFull) * 100);
    labelGradientDrums.textContent = `${drumPct}%`;
  }
  if (labelGradientStabs) {
    labelGradientStabs.textContent = `${Math.round(st.gradients.stabs * 100)}%`;
  }
  if (labelGradientCutoff) {
    labelGradientCutoff.textContent = `${Math.round(st.gradients.drumCutoff)} Hz`;
  }
  if (labelGradientDrive) {
    const driveAmount = (2.2 + st.gradients.thermal * 3.3).toFixed(1);
    labelGradientDrive.textContent = `${driveAmount}x`;
  }

  // Update Mode Badge & Name
  let modeName = 'STOPPED (Raw Sub-Bass Riff)';
  let badgeClass = 'idle';
  if (spd > 75 || rpm > 3000) {
    modeName = 'PEAK (Full Breakbeat, Stabs & Heavy Drive)';
    badgeClass = 'attack';
  } else if (spd > 45) {
    modeName = 'BOULEVARD (Breakbeat, Filter Open & Stabs)';
    badgeClass = 'flow';
  } else if (spd > 18) {
    modeName = 'CITY (Rolling Breakbeat & Snare)';
    badgeClass = 'flow';
  } else if (spd > 4) {
    modeName = 'ROLLING (Kick & Swung Hats Swelling In)';
    badgeClass = 'coasting';
  }

  if (modeBadge) {
    modeBadge.textContent = badgeClass.toUpperCase();
    modeBadge.className = `badge-mode ${badgeClass}`;
  }
  if (labelModeName) {
    labelModeName.textContent = modeName;
  }

  // Update Tachometer LEDs
  updateShiftLights(rpm);

  // Update Thermal State
  if (labelThermalState && valTemp) {
    if (temp < 50) {
      valTemp.style.color = '#38bdf8';
      labelThermalState.textContent = 'COLD // CLEAN TUBE DRIVE (2.4x)';
      labelThermalState.style.color = '#38bdf8';
    } else if (temp > 95) {
      valTemp.style.color = '#ff0055';
      labelThermalState.textContent = 'HOT // HEAVY SATURATION DRIVE (5.5x)';
      labelThermalState.style.color = '#ff0055';
    } else {
      valTemp.style.color = 'var(--teku-cyan)';
      labelThermalState.textContent = 'WARM // OPTIMAL TUBE DRIVE (3.5x)';
      labelThermalState.style.color = 'var(--teku-cyan)';
    }
  }

  // Stereo Panning Label
  if (labelPan) {
    if (Math.abs(g) < 0.05) {
      labelPan.textContent = 'Center';
    } else if (g < 0) {
      labelPan.textContent = `Hard Left (${Math.round((Math.abs(g) / 0.35) * 100)}%)`;
    } else {
      labelPan.textContent = `Hard Right (${Math.round((g / 0.35) * 100)}%)`;
    }
  }
}

// 8-LED Tachometer Shift Lights Controller
function updateShiftLights(rpm) {
  const thresholds = [1100, 1500, 1900, 2300, 2750, 3200, 3500, 3750];
  for (let i = 1; i <= 8; i++) {
    const el = document.getElementById(`led-${i}`);
    if (el) {
      if (rpm >= thresholds[i - 1]) {
        el.classList.add('on');
      } else {
        el.classList.remove('on');
      }
    }
  }
}

// Slider Listeners
sliderRpm.addEventListener('input', updateUI);
sliderSpd.addEventListener('input', updateUI);
sliderTps.addEventListener('input', updateUI);
sliderG.addEventListener('input', updateUI);
if (sliderTemp) sliderTemp.addEventListener('input', updateUI);

// Start / Stop Audio Engine
btnAudio.addEventListener('click', () => {
  if (!engine.isRunning) {
    engine.start();
    updateUI();
    btnAudio.textContent = 'Stop Audio Engine';
    btnAudio.classList.remove('primary');
    btnAudio.classList.add('active');
    log(`Teku Music Engine started. Session: ${engine.generator.session.seed} (${engine.generator.session.key.name}, ${engine.bpm.toFixed(1)} BPM)`);
  } else {
    engine.stop();
    btnAudio.textContent = 'Start Audio Engine';
    btnAudio.classList.remove('active');
    btnAudio.classList.add('primary');
    log('Teku Music Engine stopped.');
  }
});

// Seed Reroll Listener
if (btnRerollSeed) {
  btnRerollSeed.addEventListener('click', () => {
    engine.setSeed(null); // Fresh random seed
    if (labelSessionSeed) labelSessionSeed.textContent = engine.generator.session.seed;
    log(`>>> Rerolled Session: ${engine.generator.session.seed} // ${engine.generator.session.key.name} (${engine.bpm.toFixed(1)} BPM) <<<`);
  });
}

// Test Chill Gear-Shift @ 2.4k RPM
btnChillShift.addEventListener('click', () => {
  if (!engine.isRunning) btnAudio.click();
  log('>>> Simulating Chill Driving: Accel to 2,400 RPM then Gear Shift <<<');

  sliderRpm.value = 1600;
  sliderSpd.value = 25;
  sliderTps.value = 35;
  updateUI();

  setTimeout(() => {
    sliderRpm.value = 2400;
    sliderSpd.value = 32;
    sliderTps.value = 40;
    updateUI();
  }, 400);

  setTimeout(() => {
    sliderTps.value = 5;
    sliderRpm.value = 1600;
    sliderSpd.value = 34;
    updateUI();
    log('Shift executed: DJ Scratch Stinger fired on RPM drop!');
  }, 1000);
});

// Test Throttle Stomp (Attack Mode Riser & Drop)
btnStomp.addEventListener('click', () => {
  if (!engine.isRunning) btnAudio.click();
  log('>>> THROTTLE STAB! (dTPS > 90%/s) -> Scheduling Riser into Drop! <<<');

  sliderTps.value = 95;
  sliderRpm.value = 3600;
  sliderSpd.value = 55;
  sliderG.value = 0.28;
  updateUI();

  setTimeout(() => {
    sliderTps.value = 35;
    sliderRpm.value = 2500;
    sliderG.value = 0.0;
    updateUI();
  }, 2200);
});

// ==========================================
// EXTENDED 75-SECOND DRIVING REPLAY ENGINE
// ==========================================
const replayHud = document.getElementById('replay-hud');
const replayStageName = document.getElementById('replay-stage-name');
const replayTimeLabel = document.getElementById('replay-time-label');
const replayProgressFill = document.getElementById('replay-progress-fill');

const tripKeyframes = [
  { t: 0.0,  rpm: 750,  spd: 0,  tps: 13, g: 0.0,   temp: 82, stage: "STAGE 1: STOPPED // RAW ROLLING SUB-BASSLINE LOOP ONLY" },
  { t: 7.0,  rpm: 750,  spd: 0,  tps: 13, g: 0.0,   temp: 84, stage: "STAGE 1: STOPPED // 100% SUB-BASS RIFF (NO ENGINE NOISE)" },
  { t: 9.5,  rpm: 1900, spd: 14, tps: 45, g: 0.02,  temp: 85, stage: "STAGE 2: LAUNCH // KICK & SWUNG HATS SWELLING IN (14 KM/H)" },
  { t: 13.0, rpm: 2450, spd: 22, tps: 52, g: 0.01,  temp: 86, stage: "STAGE 2: CLIMBING TO SHIFT POINT // DRUMS OPENING UP" },
  { t: 13.8, rpm: 1550, spd: 24, tps: 8,  g: 0.0,   temp: 86, stage: "STAGE 2: SHIFT TO 2nd GEAR // SHIRAKO VINYL SCRATCH STINGER" },
  { t: 18.0, rpm: 2400, spd: 36, tps: 48, g: -0.03, temp: 87, stage: "STAGE 3: 36 KM/H CITY CRUISE // FULL BREAKBEAT SNARE & GHOSTS" },
  { t: 19.0, rpm: 1650, spd: 38, tps: 10, g: 0.0,   temp: 87, stage: "STAGE 3: SHIFT TO 3rd GEAR // DJ SCRATCH STINGER" },
  { t: 24.0, rpm: 2300, spd: 46, tps: 32, g: 0.0,   temp: 88, stage: "STAGE 3: BOULEVARD FLOW // SYNCED BREAKBEAT & BASS GROOVE" },
  { t: 28.0, rpm: 2450, spd: 48, tps: 35, g: 0.26,  temp: 88, stage: "STAGE 3: ENTERING ROUNDABOUT // STEREO PANNING RIGHT" },
  { t: 33.0, rpm: 2500, spd: 48, tps: 35, g: -0.34, temp: 88, stage: "STAGE 3: ROUNDABOUT APEX // STEREO AUTO-PAN SWEEP (-0.34G LEFT)" },
  { t: 37.0, rpm: 2350, spd: 50, tps: 28, g: 0.02,  temp: 88, stage: "STAGE 3: EXITING ROUNDABOUT // PAN RETURNS TO CENTER" },
  { t: 41.0, rpm: 2500, spd: 54, tps: 40, g: 0.0,   temp: 89, stage: "STAGE 4: ON-RAMP ACCELERATION // DRUM CUTOFF SWEEPS TO 14kHz" },
  { t: 43.0, rpm: 3200, spd: 62, tps: 88, g: 0.12,  temp: 91, stage: "STAGE 4: THROTTLE STOMP // 1.2s RISER ROLL TRIGGERED!" },
  { t: 48.0, rpm: 3680, spd: 74, tps: 92, g: 0.08,  temp: 94, stage: "STAGE 4: PEAK HIGHWAY SPRINT // INDUSTRIAL STABS & TUBE OVERDRIVE" },
  { t: 53.0, rpm: 3400, spd: 76, tps: 60, g: 0.0,   temp: 96, stage: "STAGE 4: OVERHEAT >95°C // THICK 5.5x ASYMMETRIC TUBE SATURATION" },
  { t: 57.0, rpm: 2400, spd: 65, tps: 18, g: -0.02, temp: 93, stage: "STAGE 5: LIFT-OFF THROTTLE // DRUM CUTOFF LOWPASS DUCK" },
  { t: 61.0, rpm: 1800, spd: 40, tps: 8,  g: -0.06, temp: 91, stage: "STAGE 5: MODERATE BRAKING // GRADUAL BREAKDOWN TO CITY GROOVE" },
  { t: 64.0, rpm: 1400, spd: 22, tps: 6,  g: -0.08, temp: 90, stage: "STAGE 5: DECELERATING // DRUMS LOWPASS FILTER SWEPT DOWN" },
  { t: 67.0, rpm: 1100, spd: 14, tps: 4,  g: -0.05, temp: 89, stage: "STAGE 5: SMOOTH GRADIENT CROSSFADE // SNARE RECEDING" },
  { t: 69.5, rpm: 880,  spd: 7,  tps: 0,  g: -0.02, temp: 88, stage: "STAGE 5: APPROACHING 4 KM/H THRESHOLD // KICK GENTLY ROLLING OFF" },
  { t: 72.0, rpm: 750,  spd: 4,  tps: 13, g: 0.0,   temp: 88, stage: "STAGE 6: ROLLING AT 4 KM/H // BASSLINE STANDS ALONE" },
  { t: 75.0, rpm: 750,  spd: 0,  tps: 13, g: 0.0,   temp: 88, stage: "STAGE 6: FULL STOP // SILKY CONTINUOUS SUB-BASS RIFF" }
];

let replayInterval = null;
const TOTAL_TRIP_TIME = 75.0;

btnReplay.addEventListener('click', () => {
  if (replayInterval) {
    clearInterval(replayInterval);
    replayInterval = null;
    btnReplay.textContent = 'Replay Clio CSV Run (75s)';
    btnReplay.classList.remove('active');
    replayHud.style.display = 'none';
    log('Replay stopped by user.');
    return;
  }

  if (!engine.isRunning) btnAudio.click();

  log('>>> LAUNCHING 75-SECOND CLIO GRADIENT REPLAY <<<');
  btnReplay.textContent = 'Stop Replay (X)';
  btnReplay.classList.add('active');
  replayHud.style.display = 'flex';

  let currentElapsed = 0.0;
  const updateIntervalMs = 100;
  const dt = updateIntervalMs / 1000.0;

  replayInterval = setInterval(() => {
    currentElapsed += dt;

    if (currentElapsed >= TOTAL_TRIP_TIME) {
      clearInterval(replayInterval);
      replayInterval = null;
      btnReplay.textContent = 'Replay Clio CSV Run (75s)';
      btnReplay.classList.remove('active');
      replayHud.style.display = 'none';
      sliderRpm.value = 750;
      sliderSpd.value = 0;
      sliderTps.value = 13;
      sliderG.value = 0.0;
      if (sliderTemp) sliderTemp.value = 88;
      updateUI();
      log('75-second journey complete. Stopped at red light: Sub-bassline riff running.');
      return;
    }

    let prev = tripKeyframes[0];
    let next = tripKeyframes[tripKeyframes.length - 1];

    for (let i = 0; i < tripKeyframes.length - 1; i++) {
      if (currentElapsed >= tripKeyframes[i].t && currentElapsed <= tripKeyframes[i + 1].t) {
        prev = tripKeyframes[i];
        next = tripKeyframes[i + 1];
        break;
      }
    }

    const span = Math.max(0.001, next.t - prev.t);
    const alpha = (currentElapsed - prev.t) / span;

    sliderRpm.value = Math.round(prev.rpm + alpha * (next.rpm - prev.rpm));
    sliderSpd.value = Math.round(prev.spd + alpha * (next.spd - prev.spd));
    sliderTps.value = Math.round(prev.tps + alpha * (next.tps - prev.tps));
    sliderG.value = +(prev.g + alpha * (next.g - prev.g)).toFixed(2);
    if (sliderTemp) {
      sliderTemp.value = Math.round(prev.temp + alpha * (next.temp - prev.temp));
    }
    updateUI();

    const pct = Math.min(100, (currentElapsed / TOTAL_TRIP_TIME) * 100);
    replayProgressFill.style.width = `${pct}%`;
    replayTimeLabel.textContent = `${currentElapsed.toFixed(1)}s / ${TOTAL_TRIP_TIME.toFixed(1)}s`;
    replayStageName.textContent = prev.stage;
  }, updateIntervalMs);
});

// Periodic Musical HUD Updates (Bar Cycle, Chords)
setInterval(() => {
  if (!engine.isRunning) return;
  if (labelBarCycle) labelBarCycle.textContent = `Bar ${engine.bar} of 8 (Step ${engine.currentStep + 1}/16)`;
  if (labelChord) {
    const session = engine.generator.session;
    const chordIndex = Math.floor((engine.bar - 1) / 2) % session.progression.length;
    const chord = session.progression[chordIndex];
    labelChord.textContent = `${session.key.name} (${chord.name} // ${chord.label})`;
  }
  if (labelSessionSeed) {
    labelSessionSeed.textContent = `${engine.generator.session.seed} (${engine.bpm.toFixed(1)} BPM)`;
  }
}, 100);

// Visualizer Canvas (Mirrored Dual-Sub Spectrum)
const canvas = document.getElementById('visualizer');
const canvasCtx = canvas ? canvas.getContext('2d') : null;

function drawVisualizer() {
  if (!canvas || !canvasCtx) return;
  requestAnimationFrame(drawVisualizer);

  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  // Background
  canvasCtx.fillStyle = '#010307';
  canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

  const centerY = canvas.height / 2;

  // Horizon line
  canvasCtx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
  canvasCtx.lineWidth = 1;
  canvasCtx.beginPath();
  canvasCtx.moveTo(0, centerY);
  canvasCtx.lineTo(canvas.width, centerY);
  canvasCtx.stroke();

  if (!engine.mixer || !engine.mixer.analyser || !engine.isRunning) {
    canvasCtx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    canvasCtx.strokeRect(canvas.width / 2 - 60, centerY - 2, 120, 4);
    return;
  }

  const analyser = engine.mixer.analyser;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);

  const numBars = Math.min(64, Math.max(32, Math.floor((canvas.width / 2) / 14)));
  const barWidth = (canvas.width / 2) / numBars;

  for (let i = 0; i < numBars; i++) {
    const dataIdx = Math.floor((i / numBars) * bufferLength);
    const val = dataArray[dataIdx] || 0;
    const barHeight = (val / 255.0) * (canvas.height * 0.47);

    let barColor;
    if (i < numBars * 0.35) {
      barColor = 'rgba(0, 240, 255, 0.95)'; // Sub & Punch: Electric Cyan
    } else if (i < numBars * 0.70) {
      barColor = 'rgba(255, 119, 0, 0.90)'; // Mids: Teku Orange
    } else {
      barColor = 'rgba(255, 0, 119, 0.95)'; // Squelch: Hot Magenta
    }

    canvasCtx.fillStyle = barColor;
    canvasCtx.shadowColor = barColor;
    canvasCtx.shadowBlur = 6;

    // Right Mirrored
    const rightX = (canvas.width / 2) + (i * barWidth);
    canvasCtx.fillRect(rightX + 1, centerY - barHeight, barWidth - 2, barHeight * 2);

    // Left Mirrored
    const leftX = (canvas.width / 2) - ((i + 1) * barWidth);
    canvasCtx.fillRect(leftX + 1, centerY - barHeight, barWidth - 2, barHeight * 2);
  }

  canvasCtx.shadowBlur = 0;
}

drawVisualizer();
