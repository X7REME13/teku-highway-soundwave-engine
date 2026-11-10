/**
 * TEKU HIGHWAY SOUNDWAVE ENGINE // SPEEDOMETER ACCURACY & FUNCTIONALITY SUITE
 * Validates exact mathematical calibration, monotonicity, simulated DOM element execution,
 * and live browser DOM fidelity across all 5 digital instrument clusters:
 * 1. Teku 2000s Tuner Canopy
 * 2. 1987 Chevrolet Corvette C4 Delco LCD
 * 3. 1984 Nissan 300ZX (Z31) Green VFD
 * 4. 1999 Honda S2000 AP1 F1 Digital Arc
 * 5. 2010 Lexus LFA / Cyber-Apex Motorized Tach Ring
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('====================================================');
console.log('RUNNING SPEEDOMETER ACCURACY & FUNCTIONALITY TESTS');
console.log('====================================================\n');

let failed = 0;
function assert(cond, msg) {
  if (cond) {
    console.log(`   ✓ ${msg}`);
  } else {
    console.error(`   ✗ FAILURE: ${msg}`);
    failed++;
  }
}

// =========================================================================
// SECTION 1: MATHEMATICAL CALIBRATION & FORMULA VALIDATION
// =========================================================================
console.log('TEST 1: Validating Speedometer & Tachometer Scaling Formulas:');

// 1.1 Teku 2000s Tuner Canopy Formulas
function tekuSpdBar(spd) { return Math.min(100, Math.round((spd / 60) * 100)); }
function tekuRpmBar(rpm) { return Math.min(100, Math.round((rpm / 4000) * 100)); }
function tekuShiftLeds(rpm) {
  const th = [1100, 1500, 1900, 2300, 2750, 3200, 3500, 3750];
  return th.filter(t => rpm >= t).length;
}

assert(tekuSpdBar(0) === 0, 'Teku speed bar at 0 km/h is 0%');
assert(tekuSpdBar(30) === 50, 'Teku speed bar at 30 km/h is 50%');
assert(tekuSpdBar(60) === 100, 'Teku speed bar at 60 km/h legal limit is 100%');
assert(tekuSpdBar(100) === 100, 'Teku speed bar above 60 km/h is clamped at 100%');
assert(tekuRpmBar(750) === 19, 'Teku RPM bar at 750 RPM idle is 19%');
assert(tekuRpmBar(2000) === 50, 'Teku RPM bar at 2000 RPM is 50%');
assert(tekuRpmBar(4000) === 100, 'Teku RPM bar at 4000 RPM is 100%');
assert(tekuShiftLeds(750) === 0, 'Teku shift lights: 0 lit at 750 RPM idle');
assert(tekuShiftLeds(1600) === 2, 'Teku shift lights: 2 lit at 1600 RPM');
assert(tekuShiftLeds(2500) === 4, 'Teku shift lights: 4 lit at 2500 RPM');
assert(tekuShiftLeds(3250) === 6, 'Teku shift lights: 6 lit at 3250 RPM');
assert(tekuShiftLeds(3800) === 8, 'Teku shift lights: All 8 lit at 3800 RPM redline');

// 1.2 1987 Corvette C4 Delco LCD Formulas
function c4SpeedBars(spd) { return Math.min(20, Math.max(0, Math.round((spd / 120) * 20))); }
function c4TachBars(rpm) { return Math.min(24, Math.max(0, Math.round((rpm / 6000) * 24))); }
function c4Gear(spd, rpm) {
  if (spd <= 0 && rpm <= 850) return 'P';
  if (spd < 18) return '1';
  if (spd < 34) return '2';
  if (spd < 48) return '3';
  if (spd < 58) return '4';
  return '5';
}

assert(c4SpeedBars(0) === 0, 'C4 speed ladder at 0 km/h has 0/20 bars lit');
assert(c4SpeedBars(30) === 5, 'C4 speed ladder at 30 km/h has exactly 5/20 bars lit (25%)');
assert(c4SpeedBars(60) === 10, 'C4 speed ladder at 60 km/h has exactly 10/20 bars lit (50%)');
assert(c4SpeedBars(90) === 15, 'C4 speed ladder at 90 km/h has exactly 15/20 bars lit (75%)');
assert(c4SpeedBars(120) === 20, 'C4 speed ladder at 120 km/h has 20/20 bars lit (100%)');
assert(c4SpeedBars(134) === 20, 'C4 speed ladder at Clio peak 134 km/h is clamped to 20/20');
assert(c4TachBars(750) === 3, 'C4 tach arc at 750 RPM idle has 3/24 bars lit');
assert(c4TachBars(1500) === 6, 'C4 tach arc at 1500 RPM has exactly 6/24 bars lit (25%)');
assert(c4TachBars(3000) === 12, 'C4 tach arc at 3000 RPM has exactly 12/24 bars lit (50%)');
assert(c4TachBars(4500) === 18, 'C4 tach arc at 4500 RPM has exactly 18/24 bars lit (75%)');
assert(c4TachBars(6000) === 24, 'C4 tach arc at 6000 RPM has 24/24 bars lit (100%)');
assert(c4Gear(0, 750) === 'P', 'C4 gear at stopped idle is P (Park)');
assert(c4Gear(12, 1800) === '1', 'C4 gear at 12 km/h is 1st');
assert(c4Gear(25, 2200) === '2', 'C4 gear at 25 km/h is 2nd');
assert(c4Gear(42, 2400) === '3', 'C4 gear at 42 km/h is 3rd');
assert(c4Gear(54, 2600) === '4', 'C4 gear at 54 km/h is 4th');
assert(c4Gear(85, 3000) === '5', 'C4 gear at 85 km/h is 5th');

// 1.3 1984 Nissan 300ZX Z31 VFD Formulas
function z31TachCols(rpm) { return Math.min(28, Math.max(0, Math.round((rpm / 7000) * 28))); }

assert(z31TachCols(750) === 3, 'Z31 torque tach at 750 RPM idle has 3/28 columns lit');
assert(z31TachCols(1000) === 4, 'Z31 torque tach at 1000 RPM has exactly 4 cols (4 cols/1000 RPM)');
assert(z31TachCols(2000) === 8, 'Z31 torque tach at 2000 RPM has exactly 8 cols');
assert(z31TachCols(3000) === 12, 'Z31 torque tach at 3000 RPM has exactly 12 cols');
assert(z31TachCols(5000) === 20, 'Z31 torque tach at 5000 RPM has exactly 20 cols');
assert(z31TachCols(7000) === 28, 'Z31 torque tach at 7000 RPM has all 28 cols lit (100%)');

// 1.4 1999 Honda S2000 AP1 F1 Digital Arc Formulas
function s2kTachBars(rpm) { return Math.min(24, Math.max(0, Math.round((rpm / 6000) * 24))); }
function s2kGear(spd, rpm) {
  if (spd <= 0 && rpm <= 850) return 'N';
  if (spd < 20) return '1';
  if (spd < 36) return '2';
  if (spd < 52) return '3';
  if (spd < 68) return '4';
  if (spd < 85) return '5';
  return '6';
}
function s2kVtec(rpm, tps) { return (rpm >= 3200) || (tps > 75 && rpm > 2600); }

assert(s2kTachBars(750) === 3, 'S2K F1 tach arc at 750 RPM idle has 3/24 bars lit');
assert(s2kTachBars(1500) === 6, 'S2K F1 tach arc at 1500 RPM has exactly 6/24 bars lit');
assert(s2kTachBars(3000) === 12, 'S2K F1 tach arc at 3000 RPM has exactly 12/24 bars lit');
assert(s2kTachBars(4750) === 19, 'S2K F1 tach arc at 4750 RPM reaches segment 19 (amber ceiling)');
assert(s2kTachBars(5000) === 20, 'S2K F1 tach arc at 5000 RPM enters redline segment 20');
assert(s2kTachBars(6000) === 24, 'S2K F1 tach arc at 6000 RPM has all 24 bars lit (full redline)');
assert(s2kGear(0, 750) === 'N', 'S2K gear at stopped idle is N (Neutral)');
assert(s2kGear(15, 1800) === '1', 'S2K gear at 15 km/h is 1st');
assert(s2kGear(30, 2200) === '2', 'S2K gear at 30 km/h is 2nd');
assert(s2kGear(45, 2400) === '3', 'S2K gear at 45 km/h is 3rd');
assert(s2kGear(60, 2600) === '4', 'S2K gear at 60 km/h is 4th');
assert(s2kGear(75, 2800) === '5', 'S2K gear at 75 km/h is 5th');
assert(s2kGear(95, 3200) === '6', 'S2K gear at 95 km/h is 6th');
assert(s2kVtec(2500, 30) === false, 'S2K VTEC dormant at 2500 RPM normal driving');
assert(s2kVtec(3250, 40) === true, 'S2K VTEC engages at 3250 RPM');
assert(s2kVtec(2800, 85) === true, 'S2K VTEC engages on aggressive throttle stomp at 2800 RPM');

// 1.5 2010 Lexus LFA Motorized Tach Ring Formulas
function lfaTachOffset(rpm) {
  const frac = Math.min(1.0, Math.max(0.0, rpm / 6000.0));
  return Math.round(741 - (frac * 741 * 0.8));
}
function lfaRingMode(rpm) {
  if (rpm >= 4500) return 'redline';
  if (rpm >= 2800) return 'power';
  return 'normal';
}

assert(lfaTachOffset(0) === 741, 'LFA tach arc at 0 RPM has dashoffset 741 (0% sweep)');
assert(lfaTachOffset(3000) === Math.round(741 - 0.5 * 741 * 0.8), 'LFA tach arc at 3000 RPM is exactly half of 80% sweep');
assert(lfaTachOffset(6000) === Math.round(741 - 741 * 0.8), 'LFA tach arc at 6000 RPM reaches maximum 80% sweep (148px offset)');
assert(lfaRingMode(750) === 'normal', 'LFA glow ring is normal at 750 RPM');
assert(lfaRingMode(3200) === 'power', 'LFA glow ring shifts to power amber at 3200 RPM');
assert(lfaRingMode(4800) === 'redline', 'LFA glow ring shifts to redline crimson at 4800 RPM');

// =========================================================================
// SECTION 2: MONOTONICITY & ZERO DEAD-ZONE CONTINUITY AUDIT
// =========================================================================
console.log('\nTEST 2: Verifying Continuous Monotonicity (Zero Regressions & No Dead Zones):');

// Speed monotonicity: 0 to 140 km/h in 1 km/h increments
let prevC4Spd = -1;
let spdRegressions = 0;
for (let s = 0; s <= 140; s++) {
  const bars = c4SpeedBars(s);
  if (bars < prevC4Spd) spdRegressions++;
  prevC4Spd = bars;
}
assert(spdRegressions === 0, 'C4 speed ladder increases monotonically from 0 to 140 km/h with zero regressions');

// RPM monotonicity: 700 to 7000 RPM in 50 RPM increments
let prevC4Tach = -1;
let prevZ31Tach = -1;
let prevS2kTach = -1;
let prevLfaOffset = 9999;
let rpmRegressions = 0;

for (let r = 700; r <= 7000; r += 50) {
  const c4 = c4TachBars(r);
  const z31 = z31TachCols(r);
  const s2k = s2kTachBars(r);
  const lfa = lfaTachOffset(r);

  if (c4 < prevC4Tach || z31 < prevZ31Tach || s2k < prevS2kTach || lfa > prevLfaOffset) {
    rpmRegressions++;
  }
  prevC4Tach = c4;
  prevZ31Tach = z31;
  prevS2kTach = s2k;
  prevLfaOffset = lfa;
}
assert(rpmRegressions === 0, 'All 4 tachometer ladders and arcs increase monotonically from 700 to 7000 RPM');

// =========================================================================
// SECTION 3: SIMULATED IN-MEMORY DOM EXECUTION TEST (FULL TEST MATRIX)
// =========================================================================
console.log('\nTEST 3: Simulating DOM Element Updates Across Telemetry Matrix:');

class MockElement {
  constructor(id) {
    this.id = id;
    this.textContent = '';
    this.style = {};
    const classes = new Set();
    this.classList = {
      add: (c) => classes.add(c),
      remove: (c) => classes.delete(c),
      toggle: (c, force) => {
        if (force === undefined) {
          if (classes.has(c)) classes.delete(c);
          else classes.add(c);
        } else if (force) {
          classes.add(c);
        } else {
          classes.delete(c);
        }
      },
      contains: (c) => classes.has(c),
      get size() { return classes.size; }
    };
  }
}

// Build mock DOM elements matching index.html IDs
const dom = {
  // Teku
  valSpd: new MockElement('val-spd'),
  valRpm: new MockElement('val-rpm'),
  spdBarFill: new MockElement('spd-bar-fill'),
  rpmBarFill: new MockElement('rpm-bar-fill'),
  shiftLeds: Array.from({ length: 8 }, (_, i) => new MockElement(`led-${i + 1}`)),

  // C4
  hudC4: new MockElement('hud-c4'),
  valC4Spd: new MockElement('val-c4-spd'),
  valC4Rpm: new MockElement('val-c4-rpm'),
  valC4GearBox: new MockElement('c4-gear-box'),
  c4Upshift: new MockElement('c4-upshift-arrow'),
  c4SpeedBars: Array.from({ length: 20 }, (_, i) => new MockElement(`c4-bar-${i + 1}`)),
  c4TachBars: Array.from({ length: 24 }, (_, i) => new MockElement(`c4-tach-${i + 1}`)),

  // Z31
  hudZ31: new MockElement('hud-z31'),
  valZ31Spd: new MockElement('val-z31-spd'),
  valZ31Rpm: new MockElement('val-z31-rpm'),
  z31TachCols: Array.from({ length: 28 }, (_, i) => new MockElement(`z31-col-${i + 1}`)),

  // S2K
  hudS2k: new MockElement('hud-s2k'),
  valS2kSpd: new MockElement('val-s2k-spd'),
  valS2kGear: new MockElement('val-s2k-gear'),
  s2kVtecLight: new MockElement('s2k-vtec-light'),
  s2kTachBars: Array.from({ length: 24 }, (_, i) => new MockElement(`s2k-bar-${i + 1}`)),

  // LFA
  hudLfa: new MockElement('hud-lfa'),
  valLfaSpd: new MockElement('val-lfa-spd'),
  valLfaRpm: new MockElement('val-lfa-rpm'),
  valLfaGear: new MockElement('val-lfa-gear'),
  lfaTachArc: new MockElement('lfa-tach-arc'),
  lfaGlowRing: new MockElement('lfa-glow-ring')
};

// Simulated controller update functions matching js/ui.js
function runMockTelemetryUpdate(spd, rpm, tps, g = 0.0, temp = 88) {
  // Teku
  dom.valSpd.textContent = spd;
  dom.valRpm.textContent = rpm;
  dom.spdBarFill.style.width = `${Math.min(100, Math.round((spd / 60) * 100))}%`;
  dom.rpmBarFill.style.width = `${Math.min(100, Math.round((rpm / 4000) * 100))}%`;
  const thresholds = [1100, 1500, 1900, 2300, 2750, 3200, 3500, 3750];
  dom.shiftLeds.forEach((led, i) => led.classList.toggle('on', rpm >= thresholds[i]));

  // C4
  dom.valC4Spd.textContent = spd;
  dom.valC4Rpm.textContent = String(Math.floor(rpm / 100)).padStart(2, '0');
  const numC4Spd = Math.min(20, Math.max(0, Math.round((spd / 120) * 20)));
  dom.c4SpeedBars.forEach((b, i) => b.classList.toggle('lit', i < numC4Spd));
  const numC4Tach = Math.min(24, Math.max(0, Math.round((rpm / 6000) * 24)));
  dom.c4TachBars.forEach((b, i) => b.classList.toggle('lit', i < numC4Tach));
  dom.valC4GearBox.textContent = `[ ${c4Gear(spd, rpm)} ]`;
  dom.c4Upshift.classList.toggle('lit', rpm > 2300 && tps > 20 && spd < 58);

  // Z31
  dom.valZ31Spd.textContent = spd;
  dom.valZ31Rpm.textContent = String(Math.floor(rpm / 100)).padStart(2, '0');
  const numZ31Tach = Math.min(28, Math.max(0, Math.round((rpm / 7000) * 28)));
  dom.z31TachCols.forEach((c, i) => c.classList.toggle('lit', i < numZ31Tach));

  // S2K
  dom.valS2kSpd.textContent = spd;
  dom.valS2kGear.textContent = s2kGear(spd, rpm);
  const numS2kTach = Math.min(24, Math.max(0, Math.round((rpm / 6000) * 24)));
  dom.s2kTachBars.forEach((b, i) => b.classList.toggle('lit', i < numS2kTach));
  const isVtec = (rpm >= 3200) || (tps > 75 && rpm > 2600);
  dom.s2kVtecLight.classList.toggle('lit', isVtec);

  // LFA
  dom.valLfaSpd.textContent = spd;
  dom.valLfaRpm.textContent = rpm;
  dom.valLfaGear.textContent = s2kGear(spd, rpm); // ASG follows 6-speed mapping
  const frac = Math.min(1.0, Math.max(0.0, rpm / 6000.0));
  dom.lfaTachArc.style.strokeDashoffset = Math.round(741 - (frac * 741 * 0.8));
  dom.lfaGlowRing.classList.toggle('power', rpm >= 2800 && rpm < 4500);
  dom.lfaGlowRing.classList.toggle('redline', rpm >= 4500);
}

// Checkpoint A: 0 km/h, 750 RPM (Idle)
runMockTelemetryUpdate(0, 750, 13);
assert(dom.valSpd.textContent === 0 && dom.valC4Spd.textContent === 0 && dom.valS2kSpd.textContent === 0 && dom.valLfaSpd.textContent === 0, 'Checkpoint 0 km/h: All clusters report exact 0 speed');
assert(dom.valC4Rpm.textContent === '07' && dom.valLfaRpm.textContent === 750, 'Checkpoint 750 RPM: Digital RPM formats accurately');
assert(dom.valC4GearBox.textContent === '[ P ]' && dom.valS2kGear.textContent === 'N', 'Checkpoint Stopped: C4 shows [ P ], S2K shows N');
assert(dom.c4SpeedBars.filter(b => b.classList.contains('lit')).length === 0, 'Checkpoint Stopped: 0 speed bars lit on C4');
assert(dom.s2kTachBars.filter(b => b.classList.contains('lit')).length === 3, 'Checkpoint Idle: Exactly 3 tach bars lit on S2K');

// Checkpoint B: 30 km/h, 2200 RPM (2nd Gear City Flow)
runMockTelemetryUpdate(30, 2200, 40);
assert(dom.valSpd.textContent === 30 && dom.valC4Spd.textContent === 30 && dom.valS2kSpd.textContent === 30, 'Checkpoint 30 km/h: Speed reads exact 30');
assert(dom.valC4Rpm.textContent === '22' && dom.valLfaRpm.textContent === 2200, 'Checkpoint 2200 RPM: RPM reads exact 2200');
assert(dom.valS2kGear.textContent === '2', 'Checkpoint 30 km/h: S2K shows 2nd gear');
assert(dom.c4SpeedBars.filter(b => b.classList.contains('lit')).length === 5, 'Checkpoint 30 km/h: Exactly 5 bars lit on C4 (25%)');
assert(dom.s2kTachBars.filter(b => b.classList.contains('lit')).length === 9, 'Checkpoint 2200 RPM: Exactly 9 tach bars lit on S2K');
assert(!dom.s2kVtecLight.classList.contains('lit'), 'Checkpoint 2200 RPM: VTEC dormant');

// Checkpoint C: 60 km/h, 3200 RPM (Legal Limit / VTEC Point)
runMockTelemetryUpdate(60, 3200, 65);
assert(dom.valSpd.textContent === 60 && dom.valC4Spd.textContent === 60 && dom.valS2kSpd.textContent === 60, 'Checkpoint 60 km/h: Speed reads exact 60');
assert(dom.c4SpeedBars.filter(b => b.classList.contains('lit')).length === 10, 'Checkpoint 60 km/h: Exactly 10 bars lit on C4 (50%)');
assert(dom.s2kVtecLight.classList.contains('lit'), 'Checkpoint 3200 RPM: VTEC engages on S2K');
assert(dom.lfaGlowRing.classList.contains('power'), 'Checkpoint 3200 RPM: LFA outer glow ring shifts to power mode');

// Checkpoint D: 100 km/h, 4800 RPM (Highway Redline Approach)
runMockTelemetryUpdate(100, 4800, 85);
assert(dom.valSpd.textContent === 100 && dom.valLfaSpd.textContent === 100, 'Checkpoint 100 km/h: Speed reads exact 100');
assert(dom.c4SpeedBars.filter(b => b.classList.contains('lit')).length === 17, 'Checkpoint 100 km/h: Exactly 17 bars lit on C4');
assert(dom.s2kTachBars.filter(b => b.classList.contains('lit')).length === 19, 'Checkpoint 4800 RPM: S2K reaches segment 19');
assert(dom.lfaGlowRing.classList.contains('redline'), 'Checkpoint 4800 RPM: LFA glow ring shifts to redline');

// Checkpoint E: 134 km/h, 6000 RPM (Clio GPS Peak Speed)
runMockTelemetryUpdate(134, 6000, 100);
assert(dom.valSpd.textContent === 134 && dom.valC4Spd.textContent === 134 && dom.valS2kSpd.textContent === 134, 'Checkpoint 134 km/h: All clusters report exact 134 top speed');
assert(dom.c4SpeedBars.filter(b => b.classList.contains('lit')).length === 20, 'Checkpoint 134 km/h: C4 speed capped at 20/20 bars');
assert(dom.s2kTachBars.filter(b => b.classList.contains('lit')).length === 24, 'Checkpoint 6000 RPM: S2K tach arc fully lit at 24/24 bars');
assert(dom.lfaTachArc.style.strokeDashoffset === 148, 'Checkpoint 6000 RPM: LFA tach arc at max 80% sweep (148px offset)');

// =========================================================================
// SECTION 4: LIVE CHROMIUM SINGLE-SHOT DUMP-DOM VERIFICATION
// =========================================================================
console.log('\nTEST 4: Live Headless Chromium DOM Verification (Single Invocation):');
try {
  const targetUrl = 'http://localhost:8080/index.html?hud=s2k&spd=85&rpm=4200&tps=75';
  const cmd = `/usr/bin/chromium --headless=new --no-sandbox --disable-gpu --dump-dom "${targetUrl}"`;
  const renderedHtml = execSync(cmd, { timeout: 35000, stdio: ['pipe', 'pipe', 'ignore'] }).toString();

  assert(renderedHtml.includes('id="val-s2k-spd">85<'), 'Live Chromium DOM: S2K speed renders exact "85" from URL preset');
  assert(renderedHtml.includes('id="val-s2k-gear">5<') || renderedHtml.includes('id="val-s2k-gear">6<'), 'Live Chromium DOM: S2K gear renders 5th/6th gear');
  assert(renderedHtml.includes('s2k-rev-indicator lit'), 'Live Chromium DOM: S2K VTEC lamp is lit at 4200 RPM');
  assert(renderedHtml.includes('s2k-tach-seg s2k-17 lit'), 'Live Chromium DOM: S2K segment 17 is lit at 4200 RPM');
  console.log('   ✓ Single-shot Chromium DOM inspection verified successfully');
} catch (err) {
  console.error(`   ✗ FAILURE executing Chromium test: ${err.message}`);
  failed++;
}

// =========================================================================
// SECTION 5: SPEEDOMETER CALIBRATION SCENARIO IN TEST RUNS
// =========================================================================
console.log('\nTEST 5: Verifying Speedometer Calibration Scenario in TEKU_TEST_RUNS:');
const { TEKU_TEST_RUNS } = require('./js/test_runs.js');
const calRun = TEKU_TEST_RUNS.find(r => r.id === 'synth_speedometer_calibration');
assert(Boolean(calRun), 'synth_speedometer_calibration scenario exists in TEKU_TEST_RUNS');
assert(calRun.keyframes.length >= 8, `Calibration scenario contains ${calRun?.keyframes?.length} keyframe milestones`);

const spdCheckpoints = [0, 20, 40, 60, 80, 100, 120, 134];
const allChecked = spdCheckpoints.every(target => calRun.keyframes.some(kf => kf.spd === target));
assert(allChecked, 'Calibration scenario visits every benchmark checkpoint: 0, 20, 40, 60, 80, 100, 120, 134 km/h');

console.log('\n====================================================');
if (failed === 0) {
  console.log('>>> ALL SPEEDOMETER ACCURACY & FUNCTIONALITY TESTS PASSED! <<<');
  console.log('====================================================\n');
  process.exit(0);
} else {
  console.error(`>>> ${failed} SPEEDOMETER ACCURACY TESTS FAILED! <<<`);
  console.log('====================================================\n');
  process.exit(1);
}
