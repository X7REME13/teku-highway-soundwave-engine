/**
 * TEKU HIGHWAY SOUNDWAVE ENGINE // UI & DOM VERIFICATION TEST
 * Validates DOM elements, zero-jitter tabular classes, retro HUD skins (C4, Z31),
 * Fullscreen controller, and PWA Mobile Install Prompts.
 */

const fs = require('fs');
const path = require('path');

const htmlContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const uiJsContent = fs.readFileSync(path.join(__dirname, 'js/ui.js'), 'utf8');
const manifestContent = fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8');
const swContent = fs.readFileSync(path.join(__dirname, 'sw.js'), 'utf8');

console.log('====================================================');
console.log('RUNNING TEKU HUD, FULLSCREEN & PWA VERIFICATION');
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

// 1. Fullscreen Button & Toggle Controller
console.log('TEST 1: Verifying Fullscreen Toggle Button & Handlers:');
assert(htmlContent.includes('id="btn-fullscreen"'), 'Fullscreen button #btn-fullscreen exists in HTML');
assert(htmlContent.includes('id="fs-icon"'), 'Fullscreen icon #fs-icon exists in HTML');
assert(uiJsContent.includes('toggleFullscreen'), 'toggleFullscreen function defined in ui.js');
assert(uiJsContent.includes('document.documentElement.requestFullscreen') || uiJsContent.includes('requestFullscreen'), 'Uses standard requestFullscreen API');
assert(uiJsContent.includes('fullscreenchange'), 'Listens for fullscreenchange events');

// 2. PWA Mobile Prompt, iOS Modal & Manifest
console.log('\nTEST 2: Verifying PWA Mobile Install Prompt & iOS Guide:');
assert(htmlContent.includes('id="pwa-mobile-banner"'), 'PWA mobile banner #pwa-mobile-banner exists in HTML');
assert(htmlContent.includes('id="pwa-ios-modal"'), 'iOS guide modal #pwa-ios-modal exists in HTML');
assert(htmlContent.includes('id="btn-install-header"'), 'Header install pill button #btn-install-header exists');
assert(htmlContent.includes('id="btn-pwa-action"'), 'Banner action button #btn-pwa-action exists');
assert(htmlContent.includes('id="btn-pwa-dismiss"'), 'Banner dismiss button #btn-pwa-dismiss exists');
assert(uiJsContent.includes('beforeinstallprompt'), 'Intercepts beforeinstallprompt for Android Chrome');
assert(uiJsContent.includes('isIOS'), 'Detects iOS devices for special Add to Home Screen instructions');
assert(uiJsContent.includes('showPWAMobileBanner'), 'Provides automated showPWAMobileBanner logic');
assert(uiJsContent.includes('appinstalled'), 'Listens for appinstalled event to clean up prompt');

// 3. Manifest.json & Service Worker
console.log('\nTEST 3: Verifying PWA Manifest & Service Worker Cache:');
const manifest = JSON.parse(manifestContent);
assert(manifest.display === 'standalone', 'Manifest display mode is "standalone"');
assert(manifest.icons.some(i => i.src.includes('icon-192')), 'Manifest has 192x192 icon');
assert(manifest.icons.some(i => i.src.includes('icon-512')), 'Manifest has 512x512 icon');
assert(manifest.icons.some(i => i.purpose === 'maskable'), 'Manifest has maskable icon for Android');
assert(swContent.includes('teku-soundwaves-v2') || swContent.includes('teku-soundwaves-v3') || swContent.includes('teku-soundwaves-v4') || swContent.includes('teku-soundwaves-v5') || swContent.includes('teku-soundwaves-v6') || swContent.includes('teku-soundwaves-v7'), 'Service worker cache key bumped to v2/v3/v4/v5/v6/v7');
assert(swContent.includes('teku-logo.png'), 'Authentic Teku logo cached in Service Worker');

// 4. Retro Digital Cluster HUDs (Corvette C4, Nissan 300ZX Z31, Honda S2000 AP1, Lexus LFA)
console.log('\nTEST 4: Verifying Retro HUD Clusters (Teku, C4, Z31, S2K, LFA):');
assert(htmlContent.includes('id="hud-c4"'), 'Corvette C4 container #hud-c4 exists in HTML');
assert(htmlContent.includes('id="hud-z31"'), 'Nissan 300ZX container #hud-z31 exists in HTML');
assert(htmlContent.includes('id="hud-s2k"'), 'Honda S2000 AP1 container #hud-s2k exists in HTML');
assert(htmlContent.includes('id="hud-lfa"'), 'Lexus LFA container #hud-lfa exists in HTML');
assert(htmlContent.includes('id="btn-skin-c4"'), 'Skin switch button #btn-skin-c4 exists');
assert(htmlContent.includes('id="btn-skin-z31"'), 'Skin switch button #btn-skin-z31 exists');
assert(htmlContent.includes('id="btn-skin-teku"'), 'Skin switch button #btn-skin-teku exists');
assert(htmlContent.includes('id="btn-skin-s2k"'), 'Skin switch button #btn-skin-s2k exists');
assert(htmlContent.includes('id="btn-skin-lfa"'), 'Skin switch button #btn-skin-lfa exists');

// Verify C4 specific segments
for (let i = 1; i <= 20; i++) {
  assert(htmlContent.includes(`bar-${i}`), `C4 speed ladder segment bar-${i} exists`);
}
for (let i = 1; i <= 14; i++) {
  assert(htmlContent.includes(`f${i}`), `C4 fuel/throttle ladder segment f${i} exists`);
}
for (let i = 1; i <= 24; i++) {
  assert(htmlContent.includes(`t${i}`), `C4 tachometer arc segment t${i} exists`);
}

// Verify Z31 specific segments
for (let i = 1; i <= 12; i++) {
  assert(htmlContent.includes(`zb${i}`), `Z31 throttle ladder segment zb${i} exists`);
}
for (let i = 1; i <= 28; i++) {
  assert(htmlContent.includes(`c${i}`), `Z31 torque curve column c${i} exists`);
}
for (let i = 1; i <= 10; i++) {
  assert(htmlContent.includes(`zt${i}`), `Z31 coolant ladder segment zt${i} exists`);
}

// Verify S2K specific segments (24-step F1 tach arc)
for (let i = 1; i <= 24; i++) {
  assert(htmlContent.includes(`s2k-${i}`), `S2K tachometer arc segment s2k-${i} exists`);
}

// Verify LFA elements
assert(htmlContent.includes('id="lfa-tach-arc"'), 'LFA motorized tachometer arc #lfa-tach-arc exists');
assert(htmlContent.includes('id="lfa-glow-ring"'), 'LFA outer glow ring #lfa-glow-ring exists');
assert(htmlContent.includes('id="lfa-g-pip"'), 'LFA G-force radar pip #lfa-g-pip exists');

// 5. Zero-Jitter Numeric Data Locking (Estación Terrena Standard)
console.log('\nTEST 5: Verifying Estación Terrena Zero-Jitter Layout Locking:');
assert(htmlContent.includes('tabular-nums'), 'CSS includes font-variant-numeric: tabular-nums');
assert(htmlContent.includes('"tnum" 1'), 'CSS includes font-feature-settings: "tnum" 1');
assert(htmlContent.includes('min-width: 3ch'), 'Fixed width 3ch allocated for speed readouts');
assert(htmlContent.includes('min-width: 4ch'), 'Fixed width 4ch allocated for RPM readouts');
assert(htmlContent.includes('min-width: 2.2ch'), 'Fixed width 2.2ch allocated for Teku speed and C4/Z31 RPM');
assert(htmlContent.includes('min-width: 5.5ch'), 'Fixed width 5.5ch allocated for G-force readouts');
assert(htmlContent.includes('min-width: 14ch'), 'Fixed width 14ch allocated for track bar phase cycle');
assert(htmlContent.includes('min-width: 90px'), 'Fixed width 90px allocated for headroom peak/rms and sim time');
assert(htmlContent.includes('#val-s2k-gear'), 'S2K gear included in tabular layout locking');
assert(htmlContent.includes('#val-lfa-gear'), 'LFA gear included in tabular layout locking');
assert(htmlContent.includes('#c4-gear-box'), 'C4 gear box included in tabular layout locking');
assert(htmlContent.includes('text-align: right'), 'Fixed numeric alignment text-align: right specified');

// 6. Flat-Out WOT Attack Overhaul
console.log('\nTEST 6: Verifying Flat-Out Stomp Overhaul:');
assert(uiJsContent.includes('sliderTps.value = 100'), 'btnStomp sets TPS to 100% WOT floor stomp');
assert(uiJsContent.includes('sliderRpm.value = 3800'), 'btnStomp revs engine to 3,800 RPM');
assert(uiJsContent.includes('FLAT-OUT FLOOR STOMP'), 'Visceral flat-out attack message logged');

// 7. In-Car Telemetry & Diagnostic Logger
console.log('\nTEST 7: Verifying In-Car Telemetry & Diagnostic Logger:');
assert(htmlContent.includes('id="btn-download-logs"'), 'Log download header button #btn-download-logs exists');
assert(htmlContent.includes('id="log-count-badge"'), 'Log count badge #log-count-badge exists');
assert(htmlContent.includes('id="btn-lab-download-csv"'), 'Lab CSV download button #btn-lab-download-csv exists');
assert(htmlContent.includes('id="btn-lab-download-json"'), 'Lab JSON download button #btn-lab-download-json exists');
assert(htmlContent.includes('id="btn-lab-clear-logs"'), 'Lab clear logs button #btn-lab-clear-logs exists');
assert(htmlContent.includes('id="teku-hud-toast"'), 'HUD toast container #teku-hud-toast exists');
assert(htmlContent.includes('js/telemetry_logger.js'), 'index.html loads js/telemetry_logger.js');
assert(swContent.includes('js/telemetry_logger.js'), 'Service worker caches js/telemetry_logger.js');
assert(swContent.includes('teku-soundwaves-v4') || swContent.includes('teku-soundwaves-v5') || swContent.includes('teku-soundwaves-v6') || swContent.includes('teku-soundwaves-v7'), 'Service worker cache bumped to v4/v5/v6/v7');
assert(uiJsContent.includes('window.downloadTekuLogs'), 'Exposes window.downloadTekuLogs for console/quick actions');

// Unit test TekuTelemetryLogger
const { TekuTelemetryLogger } = require('./js/telemetry_logger.js');
const testLogger = new TekuTelemetryLogger();
testLogger.recordTelemetry({ speed: 42, rpm: 2200, throttle: 42, lateralG: 0.12, coolantTemp: 88, pidLatencyMs: 45 });
assert(testLogger.records.length === 1, 'TekuTelemetryLogger records telemetry sample');
assert(testLogger.records[0].gear === '3', 'Estimates 3rd gear for 42 km/h');

const csv = testLogger.toCSV();
assert(csv.includes('timestamp_iso,elapsed_sec,speed_kmh,rpm,tps_pct,lateral_g,coolant_temp_c,gear'), 'CSV contains standard header');
assert(csv.includes('42,2200,42,0.12,88,"3"'), 'CSV contains formatted telemetry row');

testLogger.recordEvent('OBD_TX', 'ATSP5');
testLogger.recordEvent('OBD_RX', 'OK');
assert(testLogger.events.length === 2, 'Records OBD AT commands and responses');

const json = JSON.parse(testLogger.toJSON());
assert(json.summary.totalSamples === 1, 'JSON contains summary totalSamples');
assert(json.diagnosticEvents.length === 2, 'JSON contains diagnostic events');
assert(json.metadata.vehicle.includes('Renault Clio Mio'), 'JSON includes Clio Mio metadata');

testLogger.clear();
assert(testLogger.records.length === 0 && testLogger.events.length === 0, 'clear() resets logger buffers');

// 8. Smartphone IMU Motion Sensor & C4 Cluster Redesign
console.log('\nTEST 8: Verifying Smartphone IMU Motion Sensor & Delco C4 Redesign:');
assert(htmlContent.includes('js/motion_sensor.js'), 'index.html loads js/motion_sensor.js');
assert(swContent.includes('js/motion_sensor.js'), 'Service worker caches js/motion_sensor.js');
assert(uiJsContent.includes('new TekuMotionSensor'), 'ui.js initializes TekuMotionSensor instance');
assert(htmlContent.includes('id="c4-g-meter-cell"'), 'C4 G-force meter cell #c4-g-meter-cell exists for tap-to-zero');
assert(htmlContent.includes('id="btn-calibrate-g"'), 'Lab view has #btn-calibrate-g button');
assert(htmlContent.includes('CORVETTE // 1987'), 'C4 has authentic CORVETTE // 1987 plaque');
assert(uiJsContent.includes('calibrateGZero'), 'ui.js defines calibrateGZero mount handler');

// Unit test TekuMotionSensor
const { TekuMotionSensor } = require('./js/motion_sensor.js');
let dispatchedG = 0;
const testSensor = new TekuMotionSensor(null, (g) => { dispatchedG = g; });
assert(testSensor.isSupported !== undefined, 'TekuMotionSensor checks platform sensor support');
testSensor.processLinearAccel(1.962, 0); // 1.962 m/s² = 0.20 G in portrait
assert(dispatchedG > 0.03, 'TekuMotionSensor processes linear acceleration into lateral G');
assert(testSensor.smoothedLateralG > 0.03, 'Smoothed lateral G updated with automotive lowpass');
testSensor.calibrateZero();
assert(Math.abs(testSensor.smoothedLateralG) < 0.01, 'calibrateZero() cancels mount bias to 0.00 G');

// 9. Slower Cruising Tempo (112 BPM), Coasting UI & Neutral Rev
console.log('\nTEST 9: Verifying Slower Cruising Tempo (112 BPM), Coasting & Neutral Rev UI:');
assert(htmlContent.includes('id="label-tempo" style="display: none;">112</span>'), 'index.html defaults tempo readout to 112 BPM');
assert(htmlContent.includes('id="val-c4-bpm">112</span>'), 'C4 cluster defaults tempo to 112 BPM');
assert(htmlContent.includes('.screamer-badge.coasting'), 'CSS includes .screamer-badge.coasting');
assert(htmlContent.includes('.c4-reserve-badge.coasting'), 'CSS includes .c4-reserve-badge.coasting');
assert(uiJsContent.includes('COASTING // ${spd} KM/H'), 'ui.js formats dedicated COASTING badge with speed');
assert(uiJsContent.includes('NEUTRAL REV // ${rpm} RPM'), 'ui.js formats dedicated NEUTRAL REV badge with RPM');
assert(uiJsContent.includes('COASTING // DRIFT'), 'Z31 HUD reflects coasting state');
assert(swContent.includes('teku-soundwaves-v6') || swContent.includes('teku-soundwaves-v7'), 'Service Worker cache bumped to v6/v7 for seamless client update');

// 10. Dual-View Mode (RUN vs DEBUG), Stoplight Deck, Run Simulator & Music Debug Inspector
console.log('\nTEST 10: Verifying Dual-View Mode, Stoplight Deck, Run Simulator & Music Inspector:');
assert(htmlContent.includes('id="btn-view-run"'), 'RUN View toggle #btn-view-run exists');
assert(htmlContent.includes('id="btn-view-debug"'), 'DEBUG View toggle #btn-view-debug exists');
assert(htmlContent.includes('id="run-stoplight-deck"'), 'Stoplight action deck #run-stoplight-deck exists in RUN view');
assert(htmlContent.includes('id="btn-run-reroll"'), 'Stoplight button #btn-run-reroll exists');
assert(htmlContent.includes('id="btn-run-stomp"'), 'Stoplight button #btn-run-stomp exists');
assert(htmlContent.includes('id="btn-run-obd"'), 'Stoplight button #btn-run-obd exists');
assert(htmlContent.includes('id="btn-run-cal-g"'), 'Stoplight button #btn-run-cal-g exists');
assert(htmlContent.includes('id="btn-run-export"'), 'Stoplight button #btn-run-export exists');
assert(htmlContent.includes('id="select-test-run"'), 'Run Simulator scenario selector #select-test-run exists');
assert(htmlContent.includes('id="sim-scrubber"'), 'Run Simulator interactive scrubber #sim-scrubber exists');
assert(htmlContent.includes('id="btn-import-log"'), 'Run Simulator log file import button #btn-import-log exists');
assert(htmlContent.includes('id="debug-music-inspector"'), 'Music & Sequencer Debug Inspector #debug-music-inspector exists');
assert(htmlContent.includes('id="input-custom-seed"'), 'Custom seed text input #input-custom-seed exists');
assert(htmlContent.includes('id="btn-apply-seed"'), 'Apply seed button #btn-apply-seed exists');
assert(htmlContent.includes('id="btn-lock-seed"'), 'Seed lock toggle button #btn-lock-seed exists');
assert(htmlContent.includes('id="select-archetype"'), 'Archetype dropdown selector #select-archetype exists');
assert(htmlContent.includes('id="sequencer-matrix-table"'), '16-step sequencer matrix table #sequencer-matrix-table exists');
assert(htmlContent.includes('id="val-headroom-peak"'), 'Headroom peak dBFS readout #val-headroom-peak exists');
assert(htmlContent.includes('id="val-headroom-rms"'), 'Headroom RMS dBFS readout #val-headroom-rms exists');
assert(htmlContent.includes('id="led-clip-indicator"'), 'Clipping warning LED #led-clip-indicator exists');

// 11. UI Controller Wiring (ui.js)
console.log('\nTEST 11: Verifying UI Controller Wiring in js/ui.js:');
assert(uiJsContent.includes('updateS2KHUD'), 'ui.js defines updateS2KHUD for Honda S2000 cluster');
assert(uiJsContent.includes('updateLFAHUD'), 'ui.js defines updateLFAHUD for Lexus LFA cluster');
assert(uiJsContent.includes("switchHudSkin('s2k')"), 'ui.js supports switching to s2k skin');
assert(uiJsContent.includes("switchHudSkin('lfa')"), 'ui.js supports switching to lfa skin');
assert(uiJsContent.includes('btnRunReroll'), 'ui.js attaches listener to #btn-run-reroll');
assert(uiJsContent.includes('btnRunStomp'), 'ui.js attaches listener to #btn-run-stomp');
assert(uiJsContent.includes('btnRunObd'), 'ui.js attaches listener to #btn-run-obd');
assert(uiJsContent.includes('btnRunCalG'), 'ui.js attaches listener to #btn-run-cal-g');
assert(uiJsContent.includes('btnRunExport'), 'ui.js attaches listener to #btn-run-export');
assert(uiJsContent.includes('new TekuTestRunner'), 'ui.js instantiates TekuTestRunner bench engine');
const { TekuTestRunner } = require('./js/test_runs.js');
const runnerInst = new TekuTestRunner();
assert(typeof runnerInst.addListener === 'function', 'TekuTestRunner implements addListener method');
let updateFired = false;
const unsub = runnerInst.addListener(() => { updateFired = true; });
runnerInst.emit({});
assert(updateFired === true, 'runner.addListener receives emitted state');
if (typeof unsub === 'function') unsub();
assert(uiJsContent.includes("testRunner.addListener === 'function'"), 'ui.js performs defensive feature detection on testRunner.addListener');
assert(uiJsContent.includes('updateMusicInspectorUI'), 'ui.js defines updateMusicInspectorUI for matrix and headroom meters');
assert(uiJsContent.includes('getAudioLevels'), 'ui.js polls getAudioLevels for headroom and clipping monitoring');

// 12. Mobile Portrait Orientation Layout Optimization (360px - 390px)
console.log('\nTEST 12: Verifying Mobile Portrait Orientation Layout (360px - 390px):');
assert(htmlContent.includes('speed-card'), 'Teku cluster includes .speed-card class');
assert(htmlContent.includes('rev-counter-card'), 'Teku cluster includes .rev-counter-card class');
assert(htmlContent.includes('clamp(0.68rem, 2.8vw, 0.78rem)'), 'Header logo uses fluid clamp scaling for narrow portrait widths');
assert(htmlContent.includes('clamp(0.50rem, 2.0vw, 0.58rem)'), 'Mode badge uses fluid clamp scaling to fit 360px portrait');
assert(htmlContent.includes('clamp(1.9rem, 7.2vw, 2.4rem)'), 'Teku gauge big number scales safely within portrait cards');
assert(htmlContent.includes('.lfa-speed-big span:first-child'), 'LFA speed number explicitly scoped on mobile to avoid overflow');
assert(htmlContent.includes('grid-template-columns: repeat(2, 1fr)'), 'Stoplight action deck provides 2-column touch grid on mobile');
assert(htmlContent.includes('.demo-actions-grid'), 'Demo actions grid optimized for mobile portrait view');
assert(htmlContent.includes('.teku-brand'), 'Header brand styling applies to .teku-brand container');
assert(htmlContent.includes('.c4-dic-cell .dseg-wrap'), 'C4 DIC digital numbers targeted with explicit 7-segment mobile styling');
assert(htmlContent.includes('.teku-track-deck'), 'Teku track deck optimized for mobile portrait view');
assert(htmlContent.includes('.pwa-mobile-banner'), 'PWA mobile banner scoped for 360px portrait margins');
assert(htmlContent.includes('.visualizer-container canvas') && htmlContent.includes('155px'), 'Mobile CSS provides 155px canvas height for 30-band visualizer');
assert(uiJsContent.includes('(NUM_SEGMENTS * segH + (NUM_SEGMENTS - 1) * segGapY) > plotH') || uiJsContent.includes('segGapY = plotH < 90 ? 1 : 2'), 'ui.js dynamically adapts segH and segGapY to plotH');




console.log('\n====================================================');
if (failed === 0) {
  console.log('>>> ALL DOM, FULLSCREEN, PWA & LOGGER TESTS PASSED! <<<');
  console.log('====================================================\n');
  process.exit(0);
} else {
  console.error(`>>> ${failed} TESTS FAILED! <<<`);
  console.log('====================================================\n');
  process.exit(1);
}
