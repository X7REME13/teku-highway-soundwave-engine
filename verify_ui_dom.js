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
assert(swContent.includes('teku-soundwaves-v2') || swContent.includes('teku-soundwaves-v3') || swContent.includes('teku-soundwaves-v4') || swContent.includes('teku-soundwaves-v5') || swContent.includes('teku-soundwaves-v6'), 'Service worker cache key bumped to v2/v3/v4/v5/v6');
assert(swContent.includes('teku-logo.png'), 'Authentic Teku logo cached in Service Worker');

// 4. Retro Digital Cluster HUDs (Corvette C4 & Nissan 300ZX Z31)
console.log('\nTEST 4: Verifying Retro HUD Clusters (1987 C4 & 1984 Z31):');
assert(htmlContent.includes('id="hud-c4"'), 'Corvette C4 container #hud-c4 exists in HTML');
assert(htmlContent.includes('id="hud-z31"'), 'Nissan 300ZX container #hud-z31 exists in HTML');
assert(htmlContent.includes('id="btn-skin-c4"'), 'Skin switch button #btn-skin-c4 exists');
assert(htmlContent.includes('id="btn-skin-z31"'), 'Skin switch button #btn-skin-z31 exists');
assert(htmlContent.includes('id="btn-skin-teku"'), 'Skin switch button #btn-skin-teku exists');

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

// 5. Zero-Jitter Numeric Data Locking (Estación Terrena Standard)
console.log('\nTEST 5: Verifying Estación Terrena Zero-Jitter Layout Locking:');
assert(htmlContent.includes('tabular-nums'), 'CSS includes font-variant-numeric: tabular-nums');
assert(htmlContent.includes('"tnum" 1'), 'CSS includes font-feature-settings: "tnum" 1');
assert(htmlContent.includes('min-width: 3ch'), 'Fixed width 3ch allocated for speed readouts');
assert(htmlContent.includes('min-width: 4ch'), 'Fixed width 4ch allocated for RPM readouts');
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
assert(swContent.includes('teku-soundwaves-v4') || swContent.includes('teku-soundwaves-v5') || swContent.includes('teku-soundwaves-v6'), 'Service worker cache bumped to v4/v5/v6');
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
assert(swContent.includes('teku-soundwaves-v6'), 'Service Worker cache bumped to v6 for seamless client update');

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
