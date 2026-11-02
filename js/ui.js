/**
 * TEKU DRIVE // UI CONTROLLER & 30-BAND ISO SPECTRUM EQUALIZER
 * Connects sliders, telemetry replay, gradient displays, and the 30-band
 * 1/3-octave Teku VFD/LED spectrum analyzer to the TekuMusicEngine.
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
const labelGradientHook = document.getElementById('label-grad-hook');
const labelGradientCutoff = document.getElementById('label-grad-cutoff');
const labelGradientDrive = document.getElementById('label-grad-drive');

function formatSessionTag() {
  const s = engine.generator.session;
  const archLabel = (s.archetype || 'teku').replace(/_/g, ' ').toUpperCase();
  return `${s.seed} (${s.key.name}, ${s.baseBpm} BPM // ${archLabel})`;
}

if (labelSessionSeed && engine.generator && engine.generator.session) {
  labelSessionSeed.textContent = formatSessionTag();
}

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
  if (labelGradientHook) {
    labelGradientHook.textContent = `${Math.round((st.gradients.hook || 0) * 100)}%`;
  }
  if (labelGradientCutoff) {
    labelGradientCutoff.textContent = `${Math.round(st.gradients.drumCutoff)} Hz`;
  }
  if (labelGradientDrive) {
    const driveAmount = (2.2 + st.gradients.thermal * 3.3).toFixed(1);
    labelGradientDrive.textContent = `${driveAmount}x`;
  }

  // Update Screamer / Breakbeat Filter Card
  const valScreamerCutoff = document.getElementById('val-screamer-cutoff');
  const screamerFill = document.getElementById('screamer-rpm-fill');
  const screamerBadge = document.getElementById('screamer-status-badge');
  const cardScreamer = document.getElementById('card-screamer');
  if (valScreamerCutoff) {
    valScreamerCutoff.textContent = `${Math.round(st.gradients.drumCutoff)} Hz`;
  }
  if (screamerFill) {
    screamerFill.style.width = `${Math.min(100, Math.round(st.energy * 100))}%`;
  }
  if (screamerBadge && cardScreamer) {
    if (st.energy > 0.65 || spd > 65) {
      screamerBadge.textContent = 'OVERDRIVE';
      screamerBadge.className = 'screamer-badge screaming';
      cardScreamer.classList.add('screaming');
    } else {
      screamerBadge.textContent = spd <= 4 ? 'SUB-IDLE' : 'GROOVE';
      screamerBadge.className = 'screamer-badge dormant';
      cardScreamer.classList.remove('screaming');
    }
  }

  // Update Mode Badge & Name
  let modeName = 'STOPPED (Sustained Sub-Bass Riff)';
  let badgeClass = 'idle';
  if (spd > 70 || rpm > 2950) {
    modeName = 'PEAK (Full Breakbeat, Teku Hook & Stabs)';
    badgeClass = 'attack';
  } else if (spd > 40) {
    modeName = 'BOULEVARD (Breakbeat, Hook Swell & Stabs)';
    badgeClass = 'flow';
  } else if (spd > 18) {
    modeName = 'CITY (Rolling Breakbeat & Snare Groove)';
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
    if (labelSessionSeed) labelSessionSeed.textContent = formatSessionTag();
    btnAudio.textContent = 'Stop Audio Engine';
    btnAudio.classList.remove('primary');
    btnAudio.classList.add('active');
    log(`Teku Music Engine started. Session: ${formatSessionTag()}`);
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
    if (labelSessionSeed) labelSessionSeed.textContent = formatSessionTag();
    log(`>>> Rerolled Session: ${formatSessionTag()} <<<`);
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
  log('>>> THROTTLE STAB! (dTPS > 90%/s) -> Scheduling Riser into 808 Drop! <<<');

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
  { t: 24.0, rpm: 2300, spd: 46, tps: 32, g: 0.0,   temp: 88, stage: "STAGE 3: BOULEVARD FLOW // TEKU HOOK & BREAKBEAT GROOVE" },
  { t: 28.0, rpm: 2450, spd: 48, tps: 35, g: 0.26,  temp: 88, stage: "STAGE 3: ENTERING ROUNDABOUT // STEREO PANNING RIGHT" },
  { t: 33.0, rpm: 2500, spd: 48, tps: 35, g: -0.34, temp: 88, stage: "STAGE 3: ROUNDABOUT APEX // STEREO AUTO-PAN SWEEP (-0.34G LEFT)" },
  { t: 37.0, rpm: 2350, spd: 50, tps: 28, g: 0.02,  temp: 88, stage: "STAGE 3: EXITING ROUNDABOUT // PAN RETURNS TO CENTER" },
  { t: 41.0, rpm: 2500, spd: 54, tps: 40, g: 0.0,   temp: 89, stage: "STAGE 4: ON-RAMP ACCELERATION // DRUM CUTOFF SWEEPS TO 14kHz" },
  { t: 43.0, rpm: 3200, spd: 62, tps: 88, g: 0.12,  temp: 91, stage: "STAGE 4: THROTTLE STOMP // 1.2s RISER INTO 808 SUB DROP!" },
  { t: 48.0, rpm: 3680, spd: 74, tps: 92, g: 0.08,  temp: 94, stage: "STAGE 4: PEAK HIGHWAY SPRINT // TEKU HOOK, STABS & TUBE OVERDRIVE" },
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

    const segDuration = Math.max(0.001, next.t - prev.t);
    const alpha = (currentElapsed - prev.t) / segDuration;

    const curRpm = Math.round(prev.rpm + alpha * (next.rpm - prev.rpm));
    const curSpd = Math.round(prev.spd + alpha * (next.spd - prev.spd));
    const curTps = Math.round(prev.tps + alpha * (next.tps - prev.tps));
    const curG = prev.g + alpha * (next.g - prev.g);
    const curTemp = Math.round(prev.temp + alpha * (next.temp - prev.temp));

    sliderRpm.value = curRpm;
    sliderSpd.value = curSpd;
    sliderTps.value = curTps;
    sliderG.value = curG.toFixed(2);
    if (sliderTemp) sliderTemp.value = curTemp;

    if (replayStageName && replayStageName.textContent !== prev.stage) {
      replayStageName.textContent = prev.stage;
      log(`[TRIP] ${prev.stage}`);
    }
    if (replayTimeLabel) {
      replayTimeLabel.textContent = `${currentElapsed.toFixed(1)}s / ${TOTAL_TRIP_TIME.toFixed(1)}s`;
    }
    if (replayProgressFill) {
      replayProgressFill.style.width = `${(currentElapsed / TOTAL_TRIP_TIME) * 100.0}%`;
    }

    updateUI();
  }, updateIntervalMs);
});

// Periodic Sequencer Bar & Chord Status Polling
setInterval(() => {
  if (!engine.isRunning) return;
  const bar = engine.currentBar;
  const session = engine.generator.session;
  const chordIdx = Math.floor((bar - 1) / 2) % session.progression.length;
  const chord = session.progression[chordIdx];

  if (labelBarCycle) {
    labelBarCycle.textContent = `Bar ${bar} of 8 (${chord.name})`;
  }
  if (labelChord) {
    labelChord.textContent = `${session.key.name} // ${chord.label}`;
  }
}, 100);

// =========================================================================
// TEKU BASSLINE MK-II // 30-BAND 1/3-OCTAVE ISO SPECTRUM EQUALIZER
// =========================================================================
const canvas = document.getElementById('visualizer');
const canvasCtx = canvas ? canvas.getContext('2d') : null;

const ISO_30_FREQS = [
  25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200,
  250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000,
  2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500, 16000, 20000
];

const ISO_30_LABELS = [
  '25', '31', '40', '50', '63', '80', '100', '125', '160', '200',
  '250', '315', '400', '500', '630', '800', '1K', '1.2K', '1.6K', '2K',
  '2.5K', '3.1K', '4K', '5K', '6.3K', '8K', '10K', '12K', '16K', '20K'
];

const NUM_BANDS = 30;
const NUM_SEGMENTS = 18;
const bandSmooth = new Float32Array(NUM_BANDS);
const peakHoldSeg = new Float32Array(NUM_BANDS);
const peakHoldTimer = new Int32Array(NUM_BANDS);
const peakDropVel = new Float32Array(NUM_BANDS);
let fftDataBuffer = null;

/**
 * Computes normalized energy (0.0 .. 1.0) for each of the 30 ISO 1/3-octave bands
 */
function compute30BandLevels(analyser, sampleRate) {
  const binCount = analyser.frequencyBinCount;
  if (!fftDataBuffer || fftDataBuffer.length !== binCount) {
    fftDataBuffer = new Uint8Array(binCount);
  }
  analyser.getByteFrequencyData(fftDataBuffer);

  const nyquist = sampleRate * 0.5;
  const binHz = nyquist / binCount;
  const sixthOct = Math.pow(2, 1 / 6); // +/- 1/6 octave band edges

  for (let b = 0; b < NUM_BANDS; b++) {
    const fc = ISO_30_FREQS[b];
    const fLow = fc / sixthOct;
    const fHigh = Math.min(nyquist * 0.98, fc * sixthOct);

    const exactIdxCenter = fc / binHz;
    const idxLow = Math.max(0, Math.floor(fLow / binHz));
    const idxHigh = Math.min(binCount - 1, Math.ceil(fHigh / binHz));

    let rawVal = 0;
    if (idxHigh <= idxLow + 1) {
      // Fractional bin interpolation for narrow sub-bass bands (25 - 80 Hz)
      const i0 = Math.min(binCount - 1, Math.max(0, Math.floor(exactIdxCenter)));
      const i1 = Math.min(binCount - 1, i0 + 1);
      const frac = exactIdxCenter - i0;
      rawVal = fftDataBuffer[i0] * (1 - frac) + fftDataBuffer[i1] * frac;
    } else {
      // RMS + Peak blend across bins in the 1/3-octave band
      let sumSq = 0;
      let maxVal = 0;
      let count = 0;
      for (let k = idxLow; k <= idxHigh; k++) {
        const v = fftDataBuffer[k];
        sumSq += v * v;
        if (v > maxVal) maxVal = v;
        count++;
      }
      const rms = count > 0 ? Math.sqrt(sumSq / count) : 0;
      rawVal = rms * 0.55 + maxVal * 0.45;
    }

    // Visual pink-noise tilt compensation so mids/highs dance vividly alongside the massive sub
    const tilt = fc > 140 ? (1.0 + Math.log2(fc / 140.0) * 0.14) : 1.05;
    const norm = Math.min(1.0, Math.max(0.0, (rawVal / 255.0) * tilt));

    // Fast attack, smooth release
    if (norm > bandSmooth[b]) {
      bandSmooth[b] = bandSmooth[b] * 0.25 + norm * 0.75;
    } else {
      bandSmooth[b] = bandSmooth[b] * 0.84 + norm * 0.16;
    }
  }
}

function getSegmentColor(bandIdx, segIdx, totalSegs, isLit) {
  const ratio = segIdx / totalSegs;
  if (!isLit) {
    // Dim unlit VFD matrix cell
    if (bandIdx < 8) return 'rgba(0, 240, 255, 0.06)';
    if (bandIdx < 20) return 'rgba(255, 136, 0, 0.05)';
    return 'rgba(255, 0, 119, 0.06)';
  }

  // Top overload segments (top 2 segments)
  if (segIdx >= totalSegs - 2) {
    return '#ffffff';
  }

  // Zone 1: Sub-Bass & Deep Punch (25 Hz - 125 Hz, Bands 0..7)
  if (bandIdx < 8) {
    if (ratio > 0.72) return '#70ffff';
    return '#00f0ff';
  }

  // Zone 2: Mid-Bass Grit & Teku Hook (160 Hz - 2 kHz, Bands 8..19)
  if (bandIdx < 20) {
    if (ratio < 0.30) return '#00d8ff';
    if (ratio < 0.72) return '#ff8800';
    return '#ffdd00';
  }

  // Zone 3: Breakbeat Crack, Scratches & High Air (2.5 kHz - 20 kHz, Bands 20..29)
  if (ratio < 0.35) return '#ff7700';
  if (ratio < 0.75) return '#ff0077';
  return '#ff55cc';
}

function drawVisualizer() {
  if (!canvas || !canvasCtx) return;
  requestAnimationFrame(drawVisualizer);

  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || 800;
  const cssH = canvas.clientHeight || 215;
  if (canvas.width !== Math.floor(cssW * dpr) || canvas.height !== Math.floor(cssH * dpr)) {
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
  }

  const ctx = canvasCtx;
  ctx.save();
  ctx.scale(dpr, dpr);

  // 1. Deep Teku Head-Unit Background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, cssH);
  bgGrad.addColorStop(0, '#020611');
  bgGrad.addColorStop(0.5, '#010308');
  bgGrad.addColorStop(1, '#030816');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, cssW, cssH);

  // Layout Margins
  const padLeft = 36;
  const padRight = 14;
  const padTop = 26;
  const padBottom = 24;
  const plotW = cssW - padLeft - padRight;
  const plotH = cssH - padTop - padBottom;

  // 2. Horizontal dB Reference Gridlines & Left Axis Labels
  const dbMarks = [
    { label: '0dB',  yRatio: 0.05 },
    { label: '-6dB', yRatio: 0.35 },
    { label: '-12dB', yRatio: 0.65 },
    { label: '-24dB', yRatio: 0.95 }
  ];

  ctx.font = '600 9px Orbitron, monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  for (const mark of dbMarks) {
    const y = padTop + mark.yRatio * plotH;
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.11)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(cssW - padRight, y);
    ctx.stroke();

    ctx.fillStyle = 'rgba(142, 160, 184, 0.65)';
    ctx.fillText(mark.label, padLeft - 5, y);
  }

  // 3. Acoustic Zone Dividers (Sub-Bass | Mid-Grit & Hook | Breakbeat & Air)
  const colStep = plotW / NUM_BANDS;
  const zoneBoundaries = [
    { startBand: 0,  endBand: 8,  title: 'SUB-BASS // 25–125Hz',       color: '#00f0ff' },
    { startBand: 8,  endBand: 20, title: 'MID-GRIT & HOOK // 160–2kHz', color: '#ff8800' },
    { startBand: 20, endBand: 30, title: 'BREAKS & AIR // 2.5k–20kHz',  color: '#ff0077' }
  ];

  ctx.font = '700 9px Orbitron, monospace';
  ctx.textAlign = 'left';
  for (const z of zoneBoundaries) {
    const zx = padLeft + z.startBand * colStep;
    ctx.fillStyle = z.color;
    ctx.fillText(z.title, zx + 2, 13);

    if (z.startBand > 0) {
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.22)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(zx - 1, padTop - 4);
      ctx.lineTo(zx - 1, padTop + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // 4. Compute or Animate 30-Band Levels
  const isPlaying = Boolean(engine.mixer && engine.mixer.analyser && engine.isRunning);
  if (isPlaying) {
    const sr = (engine.ctx && engine.ctx.sampleRate) ? engine.ctx.sampleRate : 44100;
    compute30BandLevels(engine.mixer.analyser, sr);
  } else {
    // Subtle standby Teku diagnostic wave when audio is stopped
    const t = performance.now() * 0.0025;
    for (let b = 0; b < NUM_BANDS; b++) {
      bandSmooth[b] = 0.07 + 0.05 * Math.sin(t + b * 0.35);
    }
  }

  // 5. Render 30 Segmented LED Columns + Floating Peak-Hold Caps + Bottom Labels
  const gapX = Math.max(2, Math.floor(colStep * 0.20));
  const barW = Math.max(4, colStep - gapX);
  const segGapY = 2;
  const segH = Math.max(3, (plotH - (NUM_SEGMENTS - 1) * segGapY) / NUM_SEGMENTS);

  ctx.font = '700 8px Orbitron, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  for (let b = 0; b < NUM_BANDS; b++) {
    const x = padLeft + b * colStep + gapX * 0.5;
    const level = bandSmooth[b];
    const litSegs = Math.min(NUM_SEGMENTS, Math.round(level * NUM_SEGMENTS));

    // Update Floating Peak-Hold Cap
    if (litSegs >= peakHoldSeg[b]) {
      peakHoldSeg[b] = litSegs;
      peakHoldTimer[b] = 14; // Hold peak for 14 frames
      peakDropVel[b] = 0.0;
    } else {
      if (peakHoldTimer[b] > 0) {
        peakHoldTimer[b]--;
      } else {
        peakDropVel[b] += 0.035;
        peakHoldSeg[b] = Math.max(0, peakHoldSeg[b] - peakDropVel[b]);
      }
    }

    // Draw all 18 segments from bottom (seg 0) to top (seg NUM_SEGMENTS-1)
    for (let s = 0; s < NUM_SEGMENTS; s++) {
      const segY = padTop + plotH - (s + 1) * segH - s * segGapY;
      const isLit = s < litSegs;
      ctx.fillStyle = getSegmentColor(b, s, NUM_SEGMENTS, isLit);

      if (isLit && s === litSegs - 1) {
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 6;
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.fillRect(x, segY, barW, segH);
    }

    // Draw Floating Peak-Hold Cap
    ctx.shadowBlur = 0;
    const peakIdx = Math.min(NUM_SEGMENTS - 1, Math.floor(peakHoldSeg[b]));
    if (peakIdx > 0) {
      const peakY = padTop + plotH - (peakIdx + 1) * segH - peakIdx * segGapY;
      const capColor = b < 8 ? '#00f0ff' : (b < 20 ? '#ffdd00' : '#ff3399');
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = capColor;
      ctx.shadowBlur = 8;
      ctx.fillRect(x, peakY, barW, Math.max(2, segH * 0.75));
      ctx.shadowBlur = 0;
    }

    // Draw Frequency Band Label at Bottom
    const labelX = x + barW * 0.5;
    const labelY = padTop + plotH + 6;
    if (b < 8) {
      ctx.fillStyle = litSegs > 2 ? '#00f0ff' : 'rgba(0, 240, 255, 0.65)';
    } else if (b < 20) {
      ctx.fillStyle = litSegs > 2 ? '#ffaa00' : 'rgba(255, 170, 0, 0.65)';
    } else {
      ctx.fillStyle = litSegs > 2 ? '#ff4499' : 'rgba(255, 68, 153, 0.65)';
    }
    ctx.fillText(ISO_30_LABELS[b], labelX, labelY);
  }

  ctx.restore();
}

drawVisualizer();
