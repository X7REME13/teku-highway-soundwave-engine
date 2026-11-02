/**
 * TEKU DRIVE // UI CONTROLLER & 30-BAND ISO SPECTRUM EQUALIZER
 * Connects sliders, telemetry replay, gradient displays, and the 30-band
 * 1/3-octave Teku VFD/LED spectrum analyzer to the TekuMusicEngine.
 */

// Initialize Engine Instance
const engine = new TekuMusicEngine();

// DOM Element Selectors
const btnAudio = document.getElementById('btn-audio');
const btnBluetooth = document.getElementById('btn-bluetooth');
const btnInstallPwa = document.getElementById('btn-install-pwa');
const btnReplay = document.getElementById('btn-replay');
const btnTranceBridge = document.getElementById('btn-trance-bridge');
const btnChillShift = document.getElementById('btn-chill-shift');
const btnStomp = document.getElementById('btn-stomp');
const obdBadge = document.getElementById('obd-badge');

// Initialize In-Car Telemetry & Diagnostic Logger
const logger = (typeof TekuTelemetryLogger !== 'undefined') ? new TekuTelemetryLogger(engine) : null;

// Initialize Web Bluetooth OBD-II Manager
const obd = (typeof TekuOBDBluetooth !== 'undefined') ? new TekuOBDBluetooth(engine, logger) : null;

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
const labelGradientUpper = document.getElementById('label-grad-upper');
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

  // Sync Demo Lab labels if present
  const valRpmDemo = document.getElementById('val-rpm-demo');
  const valSpdDemo = document.getElementById('val-spd-demo');
  const valTpsDemo = document.getElementById('val-tps-demo');
  const valGDemo = document.getElementById('val-g-demo');
  const valTempDemo = document.getElementById('val-temp-demo');
  if (valRpmDemo) valRpmDemo.textContent = rpm;
  if (valSpdDemo) valSpdDemo.textContent = spd;
  if (valTpsDemo) valTpsDemo.textContent = tps;
  if (valGDemo) valGDemo.textContent = g.toFixed(2);
  if (valTempDemo) valTempDemo.textContent = temp;

  // Ingest into Engine (computes continuous gradients & events)
  engine.updateTelemetry(rpm, spd, tps, g, temp);
  const st = engine.telemetryState;

  // Update Cockpit Digital Readouts
  const labelTempo = document.getElementById('label-tempo');
  if (labelTempo) labelTempo.textContent = Math.round(engine.bpm || 136);

  const labelThermalDrive = document.getElementById('label-thermal-drive');
  if (labelThermalDrive) {
    const driveAmount = (2.2 + st.gradients.thermal * 3.3).toFixed(1);
    labelThermalDrive.textContent = `${driveAmount}x Drive`;
  }

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
  if (labelGradientUpper) {
    labelGradientUpper.textContent = `${Math.round((st.gradients.upperMadness || 0) * 100)}%`;
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

  // Update Mode Badge & Name (Aligned to 60 km/h legal speed ceiling)
  let modeName = 'STOPPED (Sustained Sub-Bass Riff)';
  let badgeClass = 'idle';
  if (spd > 54 || rpm > 2800) {
    modeName = 'PEAK LEGAL (Full Breakbeat, Teku Hook & Stabs)';
    badgeClass = 'attack';
  } else if (spd > 36) {
    modeName = 'BOULEVARD (Breakbeat, Hook Swell & Stabs)';
    badgeClass = 'flow';
  } else if (spd > 16) {
    modeName = 'CITY (Rolling Breakbeat & Snare Groove)';
    badgeClass = 'flow';
  } else if (spd > 4) {
    modeName = 'ROLLING (Kick & Swung Hats Swelling In)';
    badgeClass = 'coasting';
  }

  if (modeBadge) {
    if (spd <= 0) {
      modeBadge.textContent = 'IDLE // 0 KM/H';
      modeBadge.className = 'badge-mode idle';
    } else {
      modeBadge.textContent = `${badgeClass.toUpperCase()} // ${spd} KM/H`;
      modeBadge.className = `badge-mode ${badgeClass}`;
    }
  }
  if (labelModeName) {
    labelModeName.textContent = modeName;
  }

  // Live animated visual meters for 2000s Teku Canopy
  const spdBarFill = document.getElementById('spd-bar-fill');
  const rpmBarFill = document.getElementById('rpm-bar-fill');
  const tpsBarFill = document.getElementById('tps-bar-fill');
  const gPipDot = document.getElementById('g-pip-dot');

  if (spdBarFill) spdBarFill.style.width = `${Math.min(100, Math.round((spd / 60) * 100))}%`;
  if (rpmBarFill) rpmBarFill.style.width = `${Math.min(100, Math.round((rpm / 4000) * 100))}%`;
  if (tpsBarFill) tpsBarFill.style.width = `${Math.min(100, tps)}%`;
  if (gPipDot) gPipDot.style.left = `${Math.min(95, Math.max(5, 50 + (g / 0.35) * 45))}%`;

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

  // Update Retro Digital Clusters (1987 Corvette C4 & 1984 Nissan 300ZX Z31)
  updateC4HUD(spd, rpm, tps, g, temp, st);
  updateZ31HUD(spd, rpm, tps, g, temp, st);

  // Record simulation/manual telemetry when OBD hardware is not connected
  if (logger && (!obd || !obd.isConnected)) {
    const now = Date.now();
    if (now - (logger._lastUiRecord || 0) > 150) {
      logger._lastUiRecord = now;
      logger.recordTelemetry({
        speed: spd,
        rpm,
        throttle: tps,
        lateralG: g,
        coolantTemp: temp,
        audioMode: badgeClass.toUpperCase(),
        bpm: engine.bpm,
        energy: st.energy,
        drumCutoff: st.gradients.drumCutoff,
        tubeDrive: (2.2 + (st.gradients.thermal || 0) * 3.3),
        pidLatencyMs: 0
      });
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

// ============================================================
// RETRO DIGITAL CLUSTER CONTROLLERS: 1987 C4 & 1984 Z31
// ============================================================

// Skin Switcher DOM Selectors
const btnSkinTeku = document.getElementById('btn-skin-teku');
const btnSkinC4 = document.getElementById('btn-skin-c4');
const btnSkinZ31 = document.getElementById('btn-skin-z31');
const hudTeku = document.getElementById('hud-teku');
const hudC4 = document.getElementById('hud-c4');
const hudZ31 = document.getElementById('hud-z31');

let currentSkin = 'teku';

function switchHudSkin(skin) {
  currentSkin = skin;
  if (hudTeku) hudTeku.style.display = (skin === 'teku') ? 'block' : 'none';
  if (hudC4) hudC4.style.display = (skin === 'c4') ? 'block' : 'none';
  if (hudZ31) hudZ31.style.display = (skin === 'z31') ? 'block' : 'none';

  if (btnSkinTeku) btnSkinTeku.classList.toggle('active', skin === 'teku');
  if (btnSkinC4) btnSkinC4.classList.toggle('active', skin === 'c4');
  if (btnSkinZ31) btnSkinZ31.classList.toggle('active', skin === 'z31');

  log(`[HUD] Active Cluster Skin: ${skin.toUpperCase()}`);
  updateUI();
}

if (btnSkinTeku) btnSkinTeku.addEventListener('click', () => switchHudSkin('teku'));
if (btnSkinC4) btnSkinC4.addEventListener('click', () => switchHudSkin('c4'));
if (btnSkinZ31) btnSkinZ31.addEventListener('click', () => switchHudSkin('z31'));

// URL param / hash skin selector for testing and deep-linking
if (typeof window !== 'undefined' && window.location) {
  if (window.location.hash === '#c4' || window.location.search.includes('hud=c4')) {
    switchHudSkin('c4');
  } else if (window.location.hash === '#z31' || window.location.search.includes('hud=z31')) {
    switchHudSkin('z31');
  }
}

// 1. 1987 Chevrolet Corvette C4 Digital Cluster
const valC4Spd = document.getElementById('val-c4-spd');
const valC4Drive = document.getElementById('val-c4-drive');
const valC4Temp = document.getElementById('val-c4-temp');
const valC4Bpm = document.getElementById('val-c4-bpm');
const valC4G = document.getElementById('val-c4-g');
const valC4Rpm = document.getElementById('val-c4-rpm');
const c4TempWarn = document.getElementById('c4-temp-warn-block');
const c4TempSub = document.getElementById('c4-temp-sub');
const c4Upshift = document.getElementById('c4-upshift-arrow');
const c4GearBox = document.getElementById('c4-gear-box');
const c4FlatoutBadge = document.getElementById('c4-flatout-badge');

const c4SpeedBars = Array.from({ length: 20 }, (_, i) => document.querySelector(`#c4-speed-ladder .bar-${i + 1}`));
const c4TpsBars = Array.from({ length: 14 }, (_, i) => document.querySelector(`#c4-tps-ladder .f${i + 1}`));
const c4TachBars = Array.from({ length: 24 }, (_, i) => document.querySelector(`#c4-tach-ladder .t${i + 1}`));

function updateC4HUD(spd, rpm, tps, g, temp, st) {
  if (!hudC4 || hudC4.style.display === 'none') return;

  // Digital values
  if (valC4Spd) valC4Spd.textContent = spd;
  if (valC4Drive) {
    const driveAmount = (2.2 + (st?.gradients?.thermal || 0) * 3.3).toFixed(1);
    valC4Drive.textContent = driveAmount;
  }
  if (valC4Temp) valC4Temp.textContent = temp.toFixed(0);
  if (valC4Bpm) valC4Bpm.textContent = Math.round(engine.bpm || 136);
  if (valC4G) valC4G.textContent = Math.abs(g).toFixed(2);
  if (valC4Rpm) valC4Rpm.textContent = String(Math.floor(rpm / 100)).padStart(2, '0');

  // Left Bay: 20-segment sweeping speed ribbon (calibrated to 0-120 km/h scale)
  const numSpdBars = Math.min(20, Math.max(0, Math.round((spd / 120) * 20)));
  for (let i = 0; i < 20; i++) {
    if (c4SpeedBars[i]) c4SpeedBars[i].classList.toggle('lit', i < numSpdBars);
  }

  // Center Bay: 14-segment fuel/throttle ladder
  const numTpsBars = Math.min(14, Math.max(0, Math.round((tps / 100) * 14)));
  for (let i = 0; i < 14; i++) {
    if (c4TpsBars[i]) c4TpsBars[i].classList.toggle('lit', i < numTpsBars);
  }

  // Flatout stomp indicator
  const isFlatout = Boolean((st?.gradients?.flatOut || 0) > 0.3 || tps >= 80);
  if (c4FlatoutBadge) {
    c4FlatoutBadge.textContent = isFlatout ? 'FLAT-OUT' : 'RESERVE';
    c4FlatoutBadge.classList.toggle('flatout', isFlatout);
  }

  // Coolant status & warning
  if (c4TempWarn) {
    c4TempWarn.classList.toggle('warn-red', temp > 95 || temp < 50);
  }
  if (c4TempSub) {
    if (temp < 60) c4TempSub.textContent = 'COLD // DIGITAL';
    else if (temp > 95) c4TempSub.textContent = 'HOT // OVERDRIVE';
    else c4TempSub.textContent = 'OPTIMAL 88°C';
  }

  // Right Bay: Arched Tachometer 24 segments (calibrated to 0-6000 RPM, 4 bars per 1000 RPM)
  const numTachBars = Math.min(24, Math.max(0, Math.round((rpm / 6000) * 24)));
  for (let i = 0; i < 24; i++) {
    if (c4TachBars[i]) c4TachBars[i].classList.toggle('lit', i < numTachBars);
  }

  // Upshift prompt & gear box
  const shouldUpshift = (rpm > 2300 && tps > 20 && spd < 58);
  if (c4Upshift) c4Upshift.classList.toggle('lit', shouldUpshift);

  let gear = 'P';
  if (spd <= 0 && rpm <= 850) gear = 'P';
  else if (spd < 18) gear = '1';
  else if (spd < 34) gear = '2';
  else if (spd < 48) gear = '3';
  else if (spd < 58) gear = '4';
  else gear = '5';
  if (c4GearBox) c4GearBox.textContent = `[ ${gear} ]`;
}

// 2. 1984 Nissan 300ZX (Z31) Monochrome Green VFD Cluster
const valZ31Spd = document.getElementById('val-z31-spd');
const valZ31Rpm = document.getElementById('val-z31-rpm');
const valZ31Temp = document.getElementById('val-z31-temp');
const z31TurnL = document.getElementById('z31-turn-l');
const z31TurnR = document.getElementById('z31-turn-r');
const z31ShiftLamp = document.getElementById('z31-shift-lamp');

const z31TpsBars = Array.from({ length: 12 }, (_, i) => document.querySelector(`#z31-tps-ladder .zb${i + 1}`));
const z31TachCols = Array.from({ length: 28 }, (_, i) => document.querySelector(`#z31-tach-ladder .c${i + 1}`));
const z31TempBars = Array.from({ length: 10 }, (_, i) => document.querySelector(`#z31-temp-ladder .zt${i + 1}`));

function updateZ31HUD(spd, rpm, tps, g, temp, st) {
  if (!hudZ31 || hudZ31.style.display === 'none') return;

  // Digital speed & RPM
  if (valZ31Spd) valZ31Spd.textContent = spd;
  if (valZ31Rpm) valZ31Rpm.textContent = String(Math.floor(rpm / 100)).padStart(2, '0');
  if (valZ31Temp) valZ31Temp.textContent = `${temp.toFixed(0)}°C`;

  // Top row: Lateral G turn arrows
  if (z31TurnL) z31TurnL.classList.toggle('lit', g < -0.06);
  if (z31TurnR) z31TurnR.classList.toggle('lit', g > 0.06);

  // Top row: Warning / Attack lamp
  const isAttack = Boolean((st?.gradients?.flatOut || 0) > 0.25 || tps >= 70 || rpm > 3200);
  if (z31ShiftLamp) {
    z31ShiftLamp.textContent = isAttack ? 'ATTACK // STOMP' : (rpm > 2400 ? 'SHIFT UP' : 'TURBO // BOOST');
    z31ShiftLamp.classList.toggle('lit', isAttack || rpm > 2400);
  }

  // Left gauge: 12-bar vertical throttle VFD
  const numTpsBars = Math.min(12, Math.max(0, Math.round((tps / 100) * 12)));
  for (let i = 0; i < 12; i++) {
    if (z31TpsBars[i]) z31TpsBars[i].classList.toggle('lit', i < numTpsBars);
  }

  // Center gauge: 28-column rising torque curve tachometer (calibrated to 0-7000 RPM, 4 columns per 1000 RPM)
  const numTachCols = Math.min(28, Math.max(0, Math.round((rpm / 7000) * 28)));
  for (let i = 0; i < 28; i++) {
    if (z31TachCols[i]) z31TachCols[i].classList.toggle('lit', i < numTachCols);
  }

  // Right gauge: 10-bar vertical coolant VFD (40°C - 110°C)
  const numTempBars = Math.min(10, Math.max(1, Math.round(((temp - 40) / 70) * 10)));
  for (let i = 0; i < 10; i++) {
    if (z31TempBars[i]) z31TempBars[i].classList.toggle('lit', i < numTempBars);
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
  const btnAudioText = document.getElementById('btn-audio-text');
  if (!engine.isRunning) {
    engine.start();
    updateUI();
    if (labelSessionSeed) labelSessionSeed.textContent = formatSessionTag();
    if (btnAudioText) {
      btnAudioText.textContent = 'MUTE TEKU SOUND SYSTEM';
    } else {
      btnAudio.textContent = 'Stop Audio Engine';
    }
    btnAudio.classList.remove('primary');
    btnAudio.classList.add('active');
    log(`Teku Music Engine started. Session: ${formatSessionTag()}`);
  } else {
    engine.stop();
    if (btnAudioText) {
      btnAudioText.textContent = 'PUMP UP THE BASSLINE';
    } else {
      btnAudio.textContent = 'Start Audio Engine';
    }
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

// Multi-View Switcher (Cockpit HUD vs Motorola Razr Flex vs Demo & Sim Lab)
const tabCockpit = document.getElementById('tab-cockpit');
const tabRazr = document.getElementById('tab-razr');
const tabDemo = document.getElementById('tab-demo');
const viewCockpit = document.getElementById('view-cockpit');
const viewDemo = document.getElementById('view-demo');
const btnBackCockpit = document.getElementById('btn-back-cockpit');

let currentView = 'cockpit';

function switchView(target) {
  currentView = target;
  if (target === 'demo') {
    if (viewCockpit) {
      viewCockpit.style.display = 'none';
      viewCockpit.classList.remove('razr-flex-active');
    }
    if (viewDemo) viewDemo.style.display = 'flex';
    if (tabCockpit) tabCockpit.classList.remove('active');
    if (tabRazr) tabRazr.classList.remove('active');
    if (tabDemo) tabDemo.classList.add('active');
  } else if (target === 'razr') {
    if (viewCockpit) {
      viewCockpit.style.display = 'flex';
      viewCockpit.classList.add('razr-flex-active');
    }
    if (viewDemo) viewDemo.style.display = 'none';
    if (tabCockpit) tabCockpit.classList.remove('active');
    if (tabRazr) tabRazr.classList.add('active');
    if (tabDemo) tabDemo.classList.remove('active');
    log('Motorola Razr Flex Mode engaged: Upper Eye-Level HUD + Lower Dash Touch Deck');
  } else {
    // Standard Cockpit HUD
    if (viewCockpit) {
      viewCockpit.style.display = 'flex';
      viewCockpit.classList.remove('razr-flex-active');
    }
    if (viewDemo) viewDemo.style.display = 'none';
    if (tabCockpit) tabCockpit.classList.add('active');
    if (tabRazr) tabRazr.classList.remove('active');
    if (tabDemo) tabDemo.classList.remove('active');
  }
}

if (tabCockpit) tabCockpit.addEventListener('click', () => switchView('cockpit'));
if (tabRazr) tabRazr.addEventListener('click', () => switchView('razr'));
if (tabDemo) tabDemo.addEventListener('click', () => switchView('demo'));
if (btnBackCockpit) btnBackCockpit.addEventListener('click', () => switchView('cockpit'));

// Auto-detect foldable posture if supported by browser/device
if (typeof window !== 'undefined' && window.matchMedia) {
  const foldQuery = window.matchMedia('(horizontal-viewport-segments: 2), (vertical-viewport-segments: 2)');
  if (foldQuery.matches) {
    switchView('razr');
  }
  if (foldQuery.addEventListener) {
    foldQuery.addEventListener('change', (e) => {
      if (e.matches) switchView('razr');
      else if (currentView === 'razr') switchView('cockpit');
    });
  }
}

// URL param/hash view selector for direct linking and testing
if (typeof window !== 'undefined' && window.location) {
  if (window.location.hash === '#razr' || window.location.search.includes('view=razr')) {
    switchView('razr');
  } else if (window.location.hash === '#demo' || window.location.search.includes('view=demo')) {
    switchView('demo');
  }
}

// Test Trance Bridge (Puente Atmosférico -> Snare Build-up -> Apex Drop)
if (btnTranceBridge) {
  btnTranceBridge.addEventListener('click', () => {
    if (!engine.isRunning) btnAudio.click();
    sliderSpd.value = 58;
    sliderRpm.value = 2650;
    sliderTps.value = 28;
    updateUI();
    engine.triggerBridgeNow();
    log('>>> ENTERING TRANCE BRIDGE (Bar 9/16): Supersaw Pad + Echo Arp + Deep Sub Wave -> Bar 13 Snare Build-Up -> Bar 15 Drop! <<<');
  });
}

// Web Bluetooth OBD-II Event Setup
if (obd) {
  obd.onStatus = (status, details) => {
    const bleDot = document.getElementById('ble-status-dot');
    if (bleDot) {
      if (status === 'CONNECTED' || status.startsWith('LIVE')) {
        bleDot.className = 'ble-dot live';
      } else {
        bleDot.className = 'ble-dot';
      }
    }
    if (obdBadge) {
      obdBadge.textContent = `OBD: ${status}`;
      if (status === 'CONNECTED' || status.startsWith('LIVE')) {
        obdBadge.className = 'badge-mode flow';
      } else if (status === 'SCANNING' || status === 'CONNECTING' || status === 'HANDSHAKE') {
        obdBadge.className = 'badge-mode coasting';
      } else if (status === 'ERROR') {
        obdBadge.className = 'badge-mode attack';
      } else {
        obdBadge.className = 'badge-mode idle';
      }
    }
    log(`[OBD-II BLE] ${status}: ${details}`);
  };

  obd.onTelemetry = (data) => {
    sliderRpm.value = data.rpm;
    sliderSpd.value = data.speed;
    sliderTps.value = data.throttle;
    sliderG.value = data.lateralG.toFixed(2);
    if (sliderTemp) sliderTemp.value = data.temp;

    updateUI();

    if (obdBadge) {
      obdBadge.textContent = `LIVE: ${data.pidLatencyMs}ms`;
      obdBadge.className = 'badge-mode flow';
    }
  };
}

// Bluetooth Connect Button
if (btnBluetooth && obd) {
  btnBluetooth.addEventListener('click', async () => {
    if (obd.isConnected) {
      obd.disconnect();
      btnBluetooth.textContent = '📶 Connect OBD-II (BLE)';
      btnBluetooth.style.borderColor = '#00f0ff';
      btnBluetooth.style.color = '#00f0ff';
      log('OBD-II BLE disconnected.');
    } else {
      if (!engine.isRunning) btnAudio.click();
      try {
        btnBluetooth.textContent = '⏳ Connecting...';
        await obd.connect();
        btnBluetooth.textContent = '🔌 Disconnect OBD-II';
        btnBluetooth.style.borderColor = '#00ffaa';
        btnBluetooth.style.color = '#00ffaa';
        log('OBD-II Bluetooth connected and streaming live vehicle telemetry!');
      } catch (err) {
        btnBluetooth.textContent = '📶 Connect OBD-II (BLE)';
        btnBluetooth.style.borderColor = '#00f0ff';
        btnBluetooth.style.color = '#00f0ff';
        log(`OBD-II connection failed: ${err.message}`);
      }
    }
  });
}

// ============================================================
// HUD TOAST NOTIFICATION CONTROLLER
// ============================================================
const toastEl = document.getElementById('teku-hud-toast');
const toastIcon = document.getElementById('toast-icon');
const toastMsg = document.getElementById('toast-msg');
const toastAction = document.getElementById('toast-action');
const toastClose = document.getElementById('toast-close');
let toastTimer = null;

function showHudToast(msg, icon = '💾', actionText = null, actionCb = null, durationMs = 4500) {
  if (!toastEl) return;
  if (toastTimer) clearTimeout(toastTimer);

  if (toastIcon) toastIcon.textContent = icon;
  if (toastMsg) toastMsg.textContent = msg;

  if (actionText && actionCb && toastAction) {
    toastAction.textContent = actionText;
    toastAction.style.display = 'inline-block';
    toastAction.onclick = () => {
      actionCb();
      hideHudToast();
    };
  } else if (toastAction) {
    toastAction.style.display = 'none';
  }

  toastEl.style.display = 'flex';

  if (durationMs > 0) {
    toastTimer = setTimeout(() => hideHudToast(), durationMs);
  }
}

function hideHudToast() {
  if (!toastEl) return;
  toastEl.style.display = 'none';
  if (toastTimer) {
    clearTimeout(toastTimer);
    toastTimer = null;
  }
}

if (toastClose) {
  toastClose.addEventListener('click', hideHudToast);
}

// ============================================================
// TELEMETRY & DIAGNOSTIC LOGGER CONTROLLER
// ============================================================
const btnDownloadLogs = document.getElementById('btn-download-logs');
const logCountBadge = document.getElementById('log-count-badge');
const logStatsSummary = document.getElementById('log-stats-summary');
const btnLabDownloadCsv = document.getElementById('btn-lab-download-csv');
const btnLabDownloadJson = document.getElementById('btn-lab-download-json');
const btnLabClearLogs = document.getElementById('btn-lab-clear-logs');

if (logger) {
  logger.onUpdate = (stats) => {
    if (logCountBadge) {
      logCountBadge.textContent = stats.count;
    }
    if (logStatsSummary) {
      logStatsSummary.textContent = `${stats.count} samples (${stats.durationFormatted})`;
    }
    if (btnDownloadLogs) {
      if (stats.count > 0) {
        btnDownloadLogs.classList.add('has-data');
      } else {
        btnDownloadLogs.classList.remove('has-data');
      }
    }
  };
}

if (btnDownloadLogs && logger) {
  btnDownloadLogs.addEventListener('click', () => {
    if (logger.records.length === 0) {
      updateUI();
    }
    const filename = logger.downloadCSV();
    log(`[LOGGER] Exported ${logger.records.length} telemetry points to ${filename}`);
    showHudToast(
      `Exported ${logger.records.length} points to CSV!`,
      '💾',
      'GET JSON',
      () => logger.downloadJSON()
    );
  });
}

if (btnLabDownloadCsv && logger) {
  btnLabDownloadCsv.addEventListener('click', () => {
    if (logger.records.length === 0) updateUI();
    const filename = logger.downloadCSV();
    log(`[LOGGER] Exported CSV: ${filename}`);
    showHudToast(`Downloaded ${logger.records.length} telemetry samples to CSV!`);
  });
}

if (btnLabDownloadJson && logger) {
  btnLabDownloadJson.addEventListener('click', () => {
    const filename = logger.downloadJSON();
    log(`[LOGGER] Exported JSON: ${filename}`);
    showHudToast('Downloaded diagnostic bundle to JSON!');
  });
}

if (btnLabClearLogs && logger) {
  btnLabClearLogs.addEventListener('click', () => {
    logger.clear();
    log('[LOGGER] Telemetry and diagnostic buffer cleared.');
    showHudToast('Telemetry buffer cleared.', '🗑');
  });
}

// Global Console Utilities for Developers & In-Car Testing
if (typeof window !== 'undefined') {
  window.tekuLogger = logger;
  window.downloadTekuLogs = (fmt = 'csv') => {
    if (!logger) return;
    if (fmt === 'json') return logger.downloadJSON();
    return logger.downloadCSV();
  };
  window.clearTekuLogs = () => logger?.clear();
}

// ============================================================
// FULLSCREEN MODE CONTROLLER
// ============================================================
const btnFullscreen = document.getElementById('btn-fullscreen');
const fsIcon = document.getElementById('fs-icon');
const fsLabel = document.getElementById('fs-label');

function isFullscreenActive() {
  return Boolean(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );
}

async function toggleFullscreen() {
  try {
    if (!isFullscreenActive()) {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      } else if (docEl.webkitRequestFullscreen) {
        await docEl.webkitRequestFullscreen();
      } else if (docEl.msRequestFullscreen) {
        await docEl.msRequestFullscreen();
      }
      log('[HUD] Fullscreen Mode engaged.');
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }
      log('[HUD] Exited Fullscreen Mode.');
    }
  } catch (err) {
    log(`[HUD] Fullscreen toggle: ${err.message}`);
  }
  updateFullscreenUI();
}

function updateFullscreenUI() {
  const active = isFullscreenActive();
  if (fsIcon) fsIcon.textContent = active ? '🗗' : '⛶';
  if (fsLabel) fsLabel.textContent = active ? 'EXIT' : 'FULLSCREEN';
  if (btnFullscreen) {
    btnFullscreen.classList.toggle('active', active);
    btnFullscreen.setAttribute('title', active ? 'Exit Fullscreen Mode' : 'Enter Fullscreen Mode');
  }
}

if (btnFullscreen) {
  btnFullscreen.addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', updateFullscreenUI);
  document.addEventListener('webkitfullscreenchange', updateFullscreenUI);
  document.addEventListener('mozfullscreenchange', updateFullscreenUI);
  document.addEventListener('MSFullscreenChange', updateFullscreenUI);
}

// ============================================================
// PWA MOBILE INSTALL CONTROLLER (ANDROID + IOS + DESKTOP)
// ============================================================
const btnInstallHeader = document.getElementById('btn-install-header');
const pwaMobileBanner = document.getElementById('pwa-mobile-banner');
const btnPwaAction = document.getElementById('btn-pwa-action');
const btnPwaDismiss = document.getElementById('btn-pwa-dismiss');
const pwaIosModal = document.getElementById('pwa-ios-modal');
const btnPwaIosClose = document.getElementById('btn-pwa-ios-close');
const btnPwaIosOk = document.getElementById('btn-pwa-ios-ok');

let deferredInstallPrompt = null;
const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const isMobileDevice = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isStandalone = (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) ||
                     (typeof navigator !== 'undefined' && navigator.standalone === true);

if (isStandalone && btnInstallHeader) {
  btnInstallHeader.style.display = 'none';
}

function isPwaDismissed() {
  try {
    return sessionStorage.getItem('teku_pwa_dismissed') === 'true';
  } catch {
    return false;
  }
}

function setPwaDismissed() {
  try {
    sessionStorage.setItem('teku_pwa_dismissed', 'true');
  } catch {}
}

function showPWAMobileBanner() {
  if (isStandalone || isPwaDismissed() || !pwaMobileBanner) return;

  if (isIOS) {
    if (btnPwaAction) btnPwaAction.textContent = 'HOW TO';
    pwaMobileBanner.style.display = 'flex';
  } else if (deferredInstallPrompt) {
    if (btnPwaAction) btnPwaAction.textContent = 'INSTALL';
    pwaMobileBanner.style.display = 'flex';
  } else if (isMobileDevice) {
    if (btnPwaAction) btnPwaAction.textContent = 'INSTALL';
    pwaMobileBanner.style.display = 'flex';
  }
}

function hidePWAMobileBanner() {
  if (pwaMobileBanner) pwaMobileBanner.style.display = 'none';
}

function openIOSGuide() {
  if (pwaIosModal) pwaIosModal.style.display = 'flex';
}

function closeIOSGuide() {
  if (pwaIosModal) pwaIosModal.style.display = 'none';
}

// 1. Intercept beforeinstallprompt (Android / Chrome)
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  if (btnInstallHeader) btnInstallHeader.style.display = 'inline-flex';
  if (btnInstallPwa) btnInstallPwa.style.display = 'inline-block';
  showPWAMobileBanner();
  log('[PWA] Native install prompt captured and ready.');
});

// 2. Trigger Installation Action
async function handleInstallTrigger() {
  if (isIOS) {
    openIOSGuide();
    hidePWAMobileBanner();
    return;
  }

  if (deferredInstallPrompt) {
    hidePWAMobileBanner();
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    log(`[PWA] Install prompt outcome: ${outcome}`);
    if (outcome === 'accepted') {
      deferredInstallPrompt = null;
      if (btnInstallHeader) btnInstallHeader.style.display = 'none';
    }
  } else {
    log('[PWA] Use your browser menu (⋮ or Share) -> "Add to Home screen" to install.');
    if (isMobileDevice) {
      alert('To install Teku HUD:\nOpen browser menu (⋮) -> Tap "Add to Home screen" or "Install App".');
    }
  }
}

// Header Install Pill click
if (btnInstallHeader) {
  btnInstallHeader.addEventListener('click', handleInstallTrigger);
}

// Mobile Banner Action click
if (btnPwaAction) {
  btnPwaAction.addEventListener('click', handleInstallTrigger);
}

// Banner Dismiss click
if (btnPwaDismiss) {
  btnPwaDismiss.addEventListener('click', () => {
    hidePWAMobileBanner();
    setPwaDismissed();
  });
}

// iOS Modal Listeners
if (btnPwaIosClose) btnPwaIosClose.addEventListener('click', closeIOSGuide);
if (btnPwaIosOk) btnPwaIosOk.addEventListener('click', closeIOSGuide);
if (pwaIosModal) {
  pwaIosModal.addEventListener('click', (e) => {
    if (e.target === pwaIosModal) closeIOSGuide();
  });
}

// 3. App Installed Event
window.addEventListener('appinstalled', () => {
  log('>>> TEKU SOUND SYSTEM INSTALLED AS PWA! <<<');
  deferredInstallPrompt = null;
  hidePWAMobileBanner();
  if (btnInstallHeader) btnInstallHeader.style.display = 'none';
  if (btnInstallPwa) btnInstallPwa.style.display = 'none';
});

// Auto-show banner on mobile devices after 1.5s if not installed
if (isMobileDevice && !isStandalone && !isPwaDismissed()) {
  setTimeout(() => {
    showPWAMobileBanner();
  }, 1500);
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

// Test Flat-Out Throttle Stomp (Immediate Visceral Attack & Rave Overdrive)
btnStomp.addEventListener('click', () => {
  if (!engine.isRunning) btnAudio.click();
  log('>>> FLAT-OUT FLOOR STOMP! (100% TPS WOT) -> DETONATING IMMEDIATE 808 SUB-DROP + 14kHz RAVE REZ SCREAMER! <<<');

  sliderTps.value = 100;
  sliderRpm.value = 3800;
  sliderSpd.value = 58;
  sliderG.value = 0.32;
  updateUI();

  setTimeout(() => {
    sliderTps.value = 28;
    sliderRpm.value = 2300;
    sliderG.value = 0.0;
    updateUI();
    log('>>> FLAT-OUT SPRINT COMPLETED: Coasting into Boulevard Flow <<<');
  }, 2600);
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
  { t: 24.0, rpm: 2300, spd: 46, tps: 32, g: 0.0,   temp: 88, stage: "STAGE 3: BOULEVARD FLOW // TEKU HOOK & TECH-TRANCE ARP SWELL" },
  { t: 28.0, rpm: 2450, spd: 48, tps: 35, g: 0.26,  temp: 88, stage: "STAGE 3: ENTERING ROUNDABOUT // STEREO PANNING RIGHT" },
  { t: 33.0, rpm: 2500, spd: 48, tps: 35, g: -0.34, temp: 88, stage: "STAGE 3: ROUNDABOUT APEX // STEREO AUTO-PAN SWEEP (-0.34G LEFT)" },
  { t: 37.0, rpm: 1950, spd: 48, tps: 12, g: 0.02,  temp: 88, stage: "STAGE 3B: TRANCE BRIDGE (PUENTE) // SUPERSAW PAD & ECHO ARP BREATHER" },
  { t: 41.0, rpm: 2500, spd: 50, tps: 40, g: 0.0,   temp: 89, stage: "STAGE 4: ON-RAMP BUILD-UP // SNARE ROLL & FILTER SWEEP TO 14kHz" },
  { t: 43.0, rpm: 3200, spd: 56, tps: 88, g: 0.12,  temp: 91, stage: "STAGE 4: THROTTLE STOMP (2nd GEAR) // 1.2s RISER INTO 808 SUB DROP!" },
  { t: 48.0, rpm: 3680, spd: 58, tps: 92, g: 0.08,  temp: 94, stage: "STAGE 4: UPPER MADNESS SPRINT // ACID SCREAMER ARP & 32nd HAT RATCHETS" },
  { t: 53.0, rpm: 3400, spd: 60, tps: 60, g: 0.0,   temp: 96, stage: "STAGE 4: 60 KM/H LEGAL CEILING // 100% PUNCH, SATURATION & PEAK GROOVE" },
  { t: 57.0, rpm: 2200, spd: 50, tps: 14, g: -0.02, temp: 93, stage: "STAGE 5: DECELERATION & COASTING // EUPHORIC TRANCE BRIDGE" },
  { t: 61.0, rpm: 1800, spd: 38, tps: 8,  g: -0.06, temp: 91, stage: "STAGE 5: MODERATE BRAKING // GRADUAL BREAKDOWN TO CITY GROOVE" },
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
  const bar = engine.bar || 1;
  const session = engine.generator.session;
  const chordIdx = Math.floor((bar - 1) / 2) % session.progression.length;
  const chord = session.progression[chordIdx];
  const sec = (engine.arranger && engine.arranger.sectionName) ? engine.arranger.sectionName : 'GROOVE';

  if (labelBarCycle) {
    labelBarCycle.textContent = `Bar ${bar} of 16 (${sec})`;
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

  // Skip frame render if Cockpit view is currently hidden
  if (canvas.offsetWidth === 0 || canvas.offsetHeight === 0) return;

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
  const isNarrow = plotW < 520;

  const zoneBoundaries = isNarrow ? [
    { startBand: 0,  endBand: 8,  title: 'SUB 25-125Hz',   color: '#00f0ff' },
    { startBand: 8,  endBand: 20, title: 'MID/HOOK 160-2k', color: '#ff8800' },
    { startBand: 20, endBand: 30, title: 'AIR 2.5k-20k',    color: '#ff0077' }
  ] : [
    { startBand: 0,  endBand: 8,  title: 'SUB-BASS // 25–125Hz',       color: '#00f0ff' },
    { startBand: 8,  endBand: 20, title: 'MID-GRIT & HOOK // 160–2kHz', color: '#ff8800' },
    { startBand: 20, endBand: 30, title: 'BREAKS & AIR // 2.5k–20kHz',  color: '#ff0077' }
  ];

  ctx.font = isNarrow ? '700 7.5px Orbitron, monospace' : '700 9px Orbitron, monospace';
  ctx.textAlign = 'left';
  for (const z of zoneBoundaries) {
    const zx = padLeft + z.startBand * colStep;
    ctx.fillStyle = z.color;
    ctx.fillText(z.title, zx + 2, isNarrow ? 11 : 13);

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

    // Draw Frequency Band Label at Bottom (Thinned on narrow screens to prevent text collisions)
    const shouldDrawLabel = !isNarrow || (b % 3 === 0 || b === 29);
    if (shouldDrawLabel) {
      const labelX = x + barW * 0.5;
      const labelY = padTop + plotH + (isNarrow ? 4 : 6);
      if (b < 8) {
        ctx.fillStyle = litSegs > 2 ? '#00f0ff' : 'rgba(0, 240, 255, 0.65)';
      } else if (b < 20) {
        ctx.fillStyle = litSegs > 2 ? '#ffaa00' : 'rgba(255, 170, 0, 0.65)';
      } else {
        ctx.fillStyle = litSegs > 2 ? '#ff4499' : 'rgba(255, 68, 153, 0.65)';
      }
      ctx.font = isNarrow ? '700 7px Orbitron, monospace' : '700 8px Orbitron, monospace';
      ctx.fillText(ISO_30_LABELS[b], labelX, labelY);
    }
  }

  ctx.restore();
}

drawVisualizer();
