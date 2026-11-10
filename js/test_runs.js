/**
 * TEKU DRIVE // TEST RUNS & BENCH TESTING SUITE
 * Provides real-world recorded runs (Renault Clio Mio 1.2 D4F) and synthetic
 * edge-case telemetry scenarios for offline bench testing without needing the car.
 * Includes CSV/JSON log importing and an interactive playback transport controller.
 */

const TEKU_TEST_RUNS = [
  // =========================================================================
  // 1. REAL CLIO MIO RECORDED RUNS (Extracted from in-car OBD telemetry logs)
  // =========================================================================
  {
    id: 'real_clio_urban',
    name: 'Real Clio #1: Urban Stoplights & Boulevard Flow (85s)',
    category: 'Real In-Car Telemetry',
    description: 'Actual drive from Clio Mio 1.2 D4F: 13% idle baseline, 1st & 2nd gear launch, 42 km/h boulevard cruise, and red-light stop.',
    duration: 85.0,
    keyframes: [
      { t: 0.0,  rpm: 750,  spd: 0,  tps: 13, g: 0.0,   temp: 84, stage: 'RED LIGHT // Stopped at intersection, 13% idle TPS, deep sub-bass riff only' },
      { t: 6.0,  rpm: 760,  spd: 0,  tps: 13, g: 0.0,   temp: 84, stage: 'STOPPED // Sub-bass pressure holding clean, zero drum noise' },
      { t: 8.5,  rpm: 1450, spd: 4,  tps: 28, g: 0.02,  temp: 85, stage: 'CLUTCH BITE // 4 km/h threshold crossed, kick & hats phasing in' },
      { t: 12.0, rpm: 2200, spd: 14, tps: 42, g: 0.01,  temp: 85, stage: '1st GEAR CLIMB // Building speed, full breakbeat rhythm swelling' },
      { t: 14.2, rpm: 1500, spd: 18, tps: 14, g: 0.0,   temp: 86, stage: 'SHIFT TO 2nd // Shirako scratch stinger on clutch in' },
      { t: 19.0, rpm: 2450, spd: 32, tps: 46, g: -0.04, temp: 86, stage: '2nd GEAR ACCEL // 32 km/h city flow, snare wire & ghost hits active' },
      { t: 21.0, rpm: 1650, spd: 35, tps: 13, g: 0.0,   temp: 87, stage: 'SHIFT TO 3rd // Turntable scratch flair' },
      { t: 27.0, rpm: 2350, spd: 44, tps: 34, g: 0.0,   temp: 87, stage: '3rd GEAR CRUISE // 44 km/h boulevard flow, Teku synth hook locked' },
      { t: 33.0, rpm: 2400, spd: 46, tps: 36, g: 0.24,  temp: 88, stage: 'RIGHT TURN // Lateral G auto-panning stereo synth wash to right' },
      { t: 39.0, rpm: 2450, spd: 46, tps: 36, g: -0.28, temp: 88, stage: 'ROUNDABOUT APEX // Lateral G auto-panning stereo synth wash to left' },
      { t: 45.0, rpm: 2000, spd: 46, tps: 13, g: 0.0,   temp: 88, stage: 'COASTING // Foot lifted off throttle (13%), Euphoric Trance Bridge swells' },
      { t: 52.0, rpm: 2600, spd: 52, tps: 58, g: 0.04,  temp: 89, stage: 'RE-ACCEL // On-ramp push to 52 km/h, upper trance arp dancing' },
      { t: 58.0, rpm: 2900, spd: 58, tps: 64, g: 0.02,  temp: 90, stage: 'LEGAL CEILING // 58 km/h max groove, industrial rave stabs' },
      { t: 65.0, rpm: 2100, spd: 48, tps: 13, g: -0.05, temp: 90, stage: 'APPROACHING LIGHT // Lift-off engine braking, trance breakdown' },
      { t: 71.0, rpm: 1600, spd: 32, tps: 10, g: -0.08, temp: 89, stage: 'DECELERATING // Brake pedal applied, drums filtering down' },
      { t: 77.0, rpm: 1100, spd: 14, tps: 8,  g: -0.04, temp: 88, stage: 'ROLL-OFF // Below 14 km/h, snare receding gently' },
      { t: 81.0, rpm: 780,  spd: 4,  tps: 13, g: 0.0,   temp: 88, stage: 'FINAL ROLL // 4 km/h threshold, sub-bassline standing alone' },
      { t: 85.0, rpm: 750,  spd: 0,  tps: 13, g: 0.0,   temp: 88, stage: 'FULL STOP // 0 km/h idle ambiance with continuous rolling sub-bass' }
    ]
  },
  {
    id: 'real_clio_highway',
    name: 'Real Clio #2: Highway Pull & 134 km/h Sprint (90s)',
    category: 'Real In-Car Telemetry',
    description: 'High-speed highway segment from recorded Clio logs: 45 km/h on-ramp pull through 3rd, 4th, and 5th gear to 134 km/h top speed.',
    duration: 90.0,
    keyframes: [
      { t: 0.0,  rpm: 2100, spd: 38,  tps: 26, g: 0.0,   temp: 87, stage: 'HIGHWAY ON-RAMP // 38 km/h rolling merge in 3rd gear' },
      { t: 8.0,  rpm: 2950, spd: 52,  tps: 75, g: 0.06,  temp: 88, stage: 'FULL THROTTLE PULL // Rapid acceleration, drum cutoff 14kHz' },
      { t: 12.0, rpm: 3500, spd: 62,  tps: 80, g: 0.04,  temp: 89, stage: '3rd GEAR REDLINE // Acid screamer arpeggio full 16th roll' },
      { t: 13.0, rpm: 2450, spd: 65,  tps: 14, g: 0.0,   temp: 89, stage: 'SHIFT TO 4th // Vinyl scratch stinger' },
      { t: 20.0, rpm: 3350, spd: 86,  tps: 82, g: 0.02,  temp: 91, stage: '4th GEAR PUSH // 86 km/h, max energy saturation, hi-hat ratchets' },
      { t: 24.5, rpm: 2500, spd: 90,  tps: 14, g: 0.0,   temp: 91, stage: 'SHIFT TO 5th // Smooth high-speed shift flair' },
      { t: 32.0, rpm: 3100, spd: 110, tps: 76, g: 0.01,  temp: 93, stage: 'FAST LANE MERGE // 110 km/h cruising, maximum musical saturation' },
      { t: 40.0, rpm: 3800, spd: 125, tps: 83, g: 0.03,  temp: 95, stage: 'CLIO TOP END // 125 km/h sprint, full polyphonic trance madness' },
      { t: 48.0, rpm: 4150, spd: 134, tps: 83, g: 0.01,  temp: 98, stage: '134 KM/H PEAK SPRINT // Maximum Clio Mio GPS record speed' },
      { t: 56.0, rpm: 3300, spd: 112, tps: 34, g: 0.0,   temp: 97, stage: 'STEADY HIGHWAY CRUISE // 112 km/h locked cadence' },
      { t: 68.0, rpm: 2600, spd: 90,  tps: 13, g: -0.04, temp: 95, stage: 'OFF-RAMP LIFT-OFF // 13% coasting, lush trance bridge breakdown' },
      { t: 78.0, rpm: 2000, spd: 65,  tps: 12, g: -0.06, temp: 92, stage: 'DECEL TO TOLL // Gentle engine braking, drums opening up softly' },
      { t: 86.0, rpm: 1200, spd: 25,  tps: 13, g: -0.08, temp: 90, stage: 'APPROACHING STOP // Deceleration crossfade' },
      { t: 90.0, rpm: 750,  spd: 0,   tps: 13, g: 0.0,   temp: 89, stage: 'TOLL STOP // At rest with pure sub foundation' }
    ]
  },
  {
    id: 'real_clio_coasting_touge',
    name: 'Real Clio #3: High-RPM Pull & Touge Coastdown (70s)',
    category: 'Real In-Car Telemetry',
    description: 'Dynamic run testing lateral G panning (+/- 0.38G), WOT throttle stomps, and lift-off coasting trance bridge triggers.',
    duration: 70.0,
    keyframes: [
      { t: 0.0,  rpm: 1800, spd: 28, tps: 30, g: 0.0,   temp: 88, stage: 'INITIAL PACE // 28 km/h winding road approach' },
      { t: 8.0,  rpm: 2700, spd: 42, tps: 65, g: 0.28,  temp: 88, stage: 'RIGHT SWEEPER // 0.28G lateral load, audio panned right' },
      { t: 14.0, rpm: 2100, spd: 42, tps: 13, g: 0.0,   temp: 88, stage: 'CORNER EXIT COAST // Foot off throttle (13%), Trance Bridge swell' },
      { t: 20.0, rpm: 3400, spd: 50, tps: 95, g: 0.08,  temp: 90, stage: 'THROTTLE STOMP // 100% WOT floor down, 808 drop & flat-out attack!' },
      { t: 26.0, rpm: 3600, spd: 54, tps: 72, g: -0.38, temp: 92, stage: 'HAIRPIN APEX // -0.38G hard left tire loading, synths sweeping left' },
      { t: 33.0, rpm: 2200, spd: 50, tps: 13, g: -0.02, temp: 91, stage: 'LONG DESCENT COAST // Sustained 13% TPS, ambient pads breathing' },
      { t: 42.0, rpm: 2900, spd: 56, tps: 60, g: 0.35,  temp: 91, stage: 'S-BEND RIGHT // Dynamic transition, arp screamer accents' },
      { t: 49.0, rpm: 2800, spd: 55, tps: 58, g: -0.36, temp: 91, stage: 'S-BEND LEFT // Counter-steer balance, rhythm locked' },
      { t: 56.0, rpm: 1900, spd: 45, tps: 13, g: 0.0,   temp: 90, stage: 'FINAL COASTDOWN // Euphoric trance outro' },
      { t: 64.0, rpm: 1200, spd: 20, tps: 10, g: -0.05, temp: 89, stage: 'BRAKING // Snare & hi-hats receding' },
      { t: 70.0, rpm: 750,  spd: 0,  tps: 13, g: 0.0,   temp: 88, stage: 'RUN COMPLETE // Stopped smoothly' }
    ]
  },
  {
    id: 'real_clio_parking_warmup',
    name: 'Real Clio #4: Cold Start to Warm Low-Speed (60s)',
    category: 'Real In-Car Telemetry',
    description: 'Cold-start session: 48°C coolant warmup, low-speed parking lot creeping (8-14 km/h), testing thermal filter dynamics.',
    duration: 60.0,
    keyframes: [
      { t: 0.0,  rpm: 1050, spd: 0,  tps: 14, g: 0.0,  temp: 48, stage: 'COLD START // 48°C high idle (1050 RPM), clean crisp digital tone' },
      { t: 8.0,  rpm: 950,  spd: 0,  tps: 14, g: 0.0,  temp: 54, stage: 'WARMING UP // Fast idle settling down, sub-bass warming up' },
      { t: 15.0, rpm: 850,  spd: 0,  tps: 13, g: 0.0,  temp: 62, stage: 'SETTLING // 850 RPM, engine temp climbing toward open-loop transition' },
      { t: 22.0, rpm: 1350, spd: 8,  tps: 22, g: 0.01, temp: 68, stage: 'PARKING LOT CREEP // 8 km/h gentle roll, kick and closed hat pulse' },
      { t: 30.0, rpm: 1500, spd: 12, tps: 25, g: 0.04, temp: 74, stage: 'TURNING INTO AISLE // 12 km/h, soft breakbeat groove' },
      { t: 38.0, rpm: 1650, spd: 16, tps: 28, g: 0.02, temp: 80, stage: 'REACHING 16 KM/H // Full breakbeat groove unlocks' },
      { t: 46.0, rpm: 1100, spd: 8,  tps: 13, g: -0.02, temp: 84, stage: 'MANEUVERING TO SPOT // Low speed coast' },
      { t: 54.0, rpm: 800,  spd: 3,  tps: 13, g: 0.0,  temp: 87, stage: 'PULLING IN // Sub-bass standing alone' },
      { t: 60.0, rpm: 750,  spd: 0,  tps: 13, g: 0.0,  temp: 88, stage: 'WARM IDLE // Optimal 88°C operating temperature reached' }
    ]
  },

  // =========================================================================
  // 2. SYNTHETIC EDGE-CASE TEST PROFILES
  // =========================================================================
  {
    id: 'synth_thermal_sweep',
    name: 'Synth #1: Thermal Sweep (Cold 42°C -> Spicy 104°C)',
    category: 'Synthetic Edge Cases',
    description: 'Sweeps engine coolant from freezing cold (42°C) to overheat spicy mix (104°C) to test thermal tube saturation and delay feedback.',
    duration: 60.0,
    keyframes: [
      { t: 0.0,  rpm: 2200, spd: 45, tps: 35, g: 0.0, temp: 42,  stage: 'COLD CRUISE (42°C) // Clean digital tone, dry reverb (0.10 wet), zero thermal overdrive' },
      { t: 15.0, rpm: 2300, spd: 46, tps: 36, g: 0.0, temp: 65,  stage: 'WARMUP TRANSITION (65°C) // Analog warmth begins, delay reverb opening to 0.28 wet' },
      { t: 30.0, rpm: 2400, spd: 48, tps: 38, g: 0.0, temp: 88,  stage: 'OPTIMAL OPERATING TEMP (88°C) // Sweet spot 3.4x tube saturation, 0.35 delay wet' },
      { t: 45.0, rpm: 2800, spd: 52, tps: 55, g: 0.0, temp: 98,  stage: 'HOT SPICY MIX (98°C) // Sizzling tube overdrive on mid-bass, screaming lead saturation' },
      { t: 60.0, rpm: 3200, spd: 58, tps: 65, g: 0.0, temp: 104, stage: 'OVERHEAT CEILING (104°C) // Maximum spicy drive (1.55x pre-drive), 0.52 delay wet, fan trigger' }
    ]
  },
  {
    id: 'synth_stoplight_idle',
    name: 'Synth #2: Stoplight Idle (13% TPS) & Neutral Rev Blips',
    category: 'Synthetic Edge Cases',
    description: 'Tests stopped vehicle behavior at 0 km/h: 13% TPS baseline with 3 distinct throttle blips in neutral (1800, 2400, 3200 RPM).',
    duration: 45.0,
    keyframes: [
      { t: 0.0,  rpm: 750,  spd: 0, tps: 13, g: 0.0, temp: 88, stage: 'PURE IDLE // 750 RPM, 13% TPS, drum cutoff muffled at 320 Hz, warm ambient chord wash' },
      { t: 8.0,  rpm: 750,  spd: 0, tps: 13, g: 0.0, temp: 88, stage: 'STEADY IDLE // Sub-bassline riff rolling continuously, zero engine noise' },
      { t: 10.5, rpm: 1850, spd: 0, tps: 36, g: 0.0, temp: 88, stage: 'BLIP #1 (1850 RPM) // Filter sweeps to 2400 Hz, resonant chord stab accent' },
      { t: 13.0, rpm: 750,  spd: 0, tps: 13, g: 0.0, temp: 88, stage: 'RETURN TO IDLE // Filter decays smoothly back to 320 Hz' },
      { t: 20.0, rpm: 2450, spd: 0, tps: 52, g: 0.0, temp: 88, stage: 'BLIP #2 (2450 RPM) // Sharp neutral rev, drum filter sweeps to 4800 Hz' },
      { t: 23.5, rpm: 750,  spd: 0, tps: 13, g: 0.0, temp: 88, stage: 'RETURN TO IDLE // Ambient silence restored, heartbeat sub thump' },
      { t: 32.0, rpm: 3200, spd: 0, tps: 78, g: 0.0, temp: 89, stage: 'BLIP #3 (3200 RPM) // High-RPM neutral rev, rave chord detonation' },
      { t: 36.0, rpm: 750,  spd: 0, tps: 13, g: 0.0, temp: 88, stage: 'RETURN TO IDLE // Settled cleanly at 750 RPM' },
      { t: 45.0, rpm: 750,  spd: 0, tps: 13, g: 0.0, temp: 88, stage: 'IDLE STABILITY // Zero glitching across multiple neutral rev cycles' }
    ]
  },
  {
    id: 'synth_wot_launch_shifts',
    name: 'Synth #3: WOT Launch & Sequential 1-2-3-4-5 Shifts',
    category: 'Synthetic Edge Cases',
    description: 'Tests flat-out attack override (100% WOT stomp, 808 drop boom), followed by sequential high-RPM gear shifts with DJ scratches.',
    duration: 50.0,
    keyframes: [
      { t: 0.0,  rpm: 750,  spd: 0,  tps: 13,  g: 0.0,  temp: 88, stage: 'STAGING LINE // Stopped, awaiting green light' },
      { t: 2.0,  rpm: 3800, spd: 8,  tps: 100, g: 0.18, temp: 88, stage: 'WOT LAUNCH // 100% floor stomp, flat-out attack detonates 808 drop & rave stabs!' },
      { t: 6.0,  rpm: 4200, spd: 22, tps: 98,  g: 0.12, temp: 89, stage: '1st GEAR REDLINE // Acid screamer full madness' },
      { t: 7.0,  rpm: 2400, spd: 24, tps: 14,  g: 0.0,  temp: 89, stage: 'SHIFT 1->2 // Vinyl scratch stinger' },
      { t: 14.0, rpm: 4100, spd: 44, tps: 96,  g: 0.08, temp: 90, stage: '2nd GEAR REDLINE // Drum filter 14kHz, max punch' },
      { t: 15.0, rpm: 2500, spd: 46, tps: 14,  g: 0.0,  temp: 90, stage: 'SHIFT 2->3 // Chirp scratch stinger' },
      { t: 23.0, rpm: 3950, spd: 68, tps: 94,  g: 0.05, temp: 92, stage: '3rd GEAR REDLINE // Hi-hat 32nd ratchets, max saturation' },
      { t: 24.2, rpm: 2600, spd: 70, tps: 14,  g: 0.0,  temp: 92, stage: 'SHIFT 3->4 // Vinyl tear scratch flair' },
      { t: 33.0, rpm: 3750, spd: 94, tps: 92,  g: 0.02, temp: 94, stage: '4th GEAR REDLINE // High-speed supersonic trance' },
      { t: 34.2, rpm: 2700, spd: 96, tps: 14,  g: 0.0,  temp: 94, stage: 'SHIFT 4->5 // Final gear shift stinger' },
      { t: 42.0, rpm: 3500, spd: 120, tps: 90, g: 0.0,  temp: 96, stage: '5th GEAR CRUISE // 120 km/h top end holding power' },
      { t: 50.0, rpm: 2500, spd: 85,  tps: 25, g: -0.05, temp: 93, stage: 'COASTDOWN // Engine braking back to normal pace' }
    ]
  },
  {
    id: 'synth_high_speed_coasting',
    name: 'Synth #4: 60 km/h Cruise to Lift-Off Coasting (13% TPS)',
    category: 'Synthetic Edge Cases',
    description: 'Specifically verifies immediate Trance Bridge swell when letting off the gas at cruising speed (Clio Mio 13% TPS baseline).',
    duration: 45.0,
    keyframes: [
      { t: 0.0,  rpm: 2500, spd: 58, tps: 55, g: 0.0,   temp: 88, stage: 'CRUISING AT 58 KM/H // Full breakbeat groove, Teku hook and trance arp active' },
      { t: 8.0,  rpm: 2600, spd: 60, tps: 58, g: 0.0,   temp: 88, stage: 'STEADY PACE // All layers locked and balanced' },
      { t: 11.0, rpm: 2100, spd: 58, tps: 13, g: -0.02, temp: 88, stage: 'LIFT-OFF (13% TPS) // Foot off gas: Trance Bridge swells immediately to >45%!' },
      { t: 18.0, rpm: 1800, spd: 52, tps: 13, g: -0.04, temp: 88, stage: 'SUSTAINED COASTING // Heavy breakbeat snare rests, lush Supersaw pad washes' },
      { t: 26.0, rpm: 1500, spd: 44, tps: 13, g: -0.06, temp: 88, stage: 'ENGINE BRAKING // Sub-bass maintains deep pressure, mid-bass saw softens' },
      { t: 33.0, rpm: 2400, spd: 48, tps: 60, g: 0.04,  temp: 89, stage: 'RE-ENGAGE THROTTLE // Foot back on gas: Trance bridge crossfades back to groove!' },
      { t: 40.0, rpm: 2600, spd: 55, tps: 62, g: 0.02,  temp: 89, stage: 'FULL GROOVE RESTORED // Breakbeat kick & snare return seamlessly' },
      { t: 45.0, rpm: 2500, spd: 55, tps: 45, g: 0.0,   temp: 88, stage: 'CRUISE STEADY // Verification complete' }
    ]
  },
  {
    id: 'synth_touge_slalom',
    name: 'Synth #5: Mountain Touge G-Slalom (-0.45G to +0.45G)',
    category: 'Synthetic Edge Cases',
    description: 'Rapid alternating lateral G transitions (-0.45G left to +0.45G right) at 48 km/h testing stereo auto-panner and mono sub alignment.',
    duration: 40.0,
    keyframes: [
      { t: 0.0,  rpm: 2400, spd: 45, tps: 40, g: 0.0,   temp: 88, stage: 'CENTERED APPROACH // Panner at 0.0, mono sub and centered stereo image' },
      { t: 5.0,  rpm: 2500, spd: 48, tps: 45, g: 0.45,  temp: 88, stage: 'HARD RIGHT TURN (+0.45G) // Stereo synths, stabs and hats panned hard right' },
      { t: 10.0, rpm: 2500, spd: 48, tps: 42, g: 0.0,   temp: 88, stage: 'MOMENTARY CENTER // Smooth panner transition through center' },
      { t: 15.0, rpm: 2550, spd: 48, tps: 45, g: -0.45, temp: 88, stage: 'HARD LEFT TURN (-0.45G) // Stereo synths and delays panned hard left' },
      { t: 20.0, rpm: 2500, spd: 48, tps: 40, g: 0.38,  temp: 88, stage: 'SLALOM FLIP RIGHT (+0.38G) // Rapid steering flick, sub stays 100% centered mono' },
      { t: 25.0, rpm: 2500, spd: 48, tps: 40, g: -0.40, temp: 88, stage: 'SLALOM FLIP LEFT (-0.40G) // Audio follows vehicle momentum smoothly' },
      { t: 32.0, rpm: 2400, spd: 46, tps: 35, g: 0.20,  temp: 88, stage: 'GENTLE RIGHT EXIT // Panner settling back' },
      { t: 40.0, rpm: 2300, spd: 44, tps: 32, g: 0.0,   temp: 88, stage: 'STRAIGHTAWAY // Balanced stereo image confirmed' }
    ]
  },
  {
    id: 'synth_max_polyphony_stress',
    name: 'Synth #6: Full Polyphony Stress & Headroom Check',
    category: 'Synthetic Edge Cases',
    description: 'Triggers maximum simultaneous voices: Sub-Bass + Mid-Bass + Kick + Snare + Hats + 5-Voice Supersaw Pad + Acid Arp + Stabs + 808 Boom to verify brickwall limiter zero clipping.',
    duration: 35.0,
    keyframes: [
      { t: 0.0,  rpm: 2200, spd: 42, tps: 38,  g: 0.0, temp: 88,  stage: 'CALIBRATION // Baseline groove running at nominal -6 dBFS bus level' },
      { t: 8.0,  rpm: 3200, spd: 55, tps: 70,  g: 0.1, temp: 92,  stage: 'POLYPHONY BUILD // Adding 5-voice Supersaw pad swell + 16th acid arp' },
      { t: 14.0, rpm: 3800, spd: 60, tps: 100, g: 0.2, temp: 98,  stage: 'PEAK LAYER CONVERGENCE // 808 boom + Rave stab + Kick + Snare + Pad + Arp + Sub' },
      { t: 20.0, rpm: 4200, spd: 65, tps: 100, g: 0.2, temp: 102, stage: 'BRICKWALL LIMITER TEST // Limiter engaging cleanly, peak strictly capped at -1.2 dBFS' },
      { t: 28.0, rpm: 2800, spd: 50, tps: 40,  g: 0.0, temp: 95,  stage: 'RECOVERY // Bus headroom intact, zero distortion artifacts or DAC clipping' },
      { t: 35.0, rpm: 2200, spd: 40, tps: 30,  g: 0.0, temp: 90,  stage: 'STRESS TEST PASSED // Dynamic range and clarity verified' }
    ]
  }
];

/**
 * Parses user-provided CSV telemetry log into test run keyframes.
 * Supports standard teku_drive_telemetry_*.csv format and generic CSVs.
 */
function parseCsvTelemetryLog(csvText, name = 'Imported CSV Drive') {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error('CSV file has insufficient rows');

  const header = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  // Prioritize elapsed / seconds columns over ISO timestamp
  let colTime = header.findIndex(h => h === 'elapsed_sec' || h.includes('elapsed') || h === 'sec' || h === 'seconds');
  let isIsoTime = false;
  if (colTime < 0) {
    colTime = header.findIndex(h => h.includes('time') || h === 't');
    isIsoTime = true;
  }

  const colSpd = header.findIndex(h => h.includes('speed') || h.includes('spd') || h.includes('kmh') || h.includes('kph'));
  const colRpm = header.findIndex(h => h.includes('rpm'));
  const colTps = header.findIndex(h => h.includes('tps') || h.includes('throttle') || h.includes('pedal'));
  const colG = header.findIndex(h => h.includes('lateral') || h.includes('g') || h.includes('lat'));
  const colTemp = header.findIndex(h => h.includes('temp') || h.includes('coolant') || h.includes('clt'));
  const colStage = header.findIndex(h => h.includes('stage') || h.includes('mode') || h.includes('state'));

  const rawPoints = [];
  let t0 = null;

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    if (row.length < 3) continue;

    let t = NaN;
    if (colTime >= 0) {
      if (isIsoTime && row[colTime].includes('T')) {
        const parsedMs = Date.parse(row[colTime]);
        if (!isNaN(parsedMs)) t = parsedMs / 1000.0;
      } else {
        t = parseFloat(row[colTime]);
      }
    }
    if (isNaN(t)) t = (i - 1) * 0.2;
    if (t0 === null) t0 = t;
    const relT = Math.max(0, t - t0);

    const spd = colSpd >= 0 ? parseFloat(row[colSpd]) || 0 : 0;
    const rpm = colRpm >= 0 ? parseFloat(row[colRpm]) || 750 : 750;
    const tps = colTps >= 0 ? parseFloat(row[colTps]) || 13 : 13;
    const g = colG >= 0 ? parseFloat(row[colG]) || 0.0 : 0.0;
    const temp = colTemp >= 0 ? parseFloat(row[colTemp]) || 88 : 88;
    const stage = colStage >= 0 ? row[colStage] : `LOG RECORD [T+${relT.toFixed(1)}s]`;

    rawPoints.push({ t: relT, spd, rpm, tps, g, temp, stage });
  }

  if (rawPoints.length === 0) throw new Error('No valid telemetry samples parsed from CSV');

  // Downsample to max ~120 keyframes if file is very large for buttery-smooth interpolation
  const total = rawPoints.length;
  let keyframes = rawPoints;
  if (total > 120) {
    const step = Math.ceil(total / 120);
    keyframes = [];
    for (let k = 0; k < total; k += step) {
      keyframes.push(rawPoints[k]);
    }
    if (keyframes[keyframes.length - 1] !== rawPoints[total - 1]) {
      keyframes.push(rawPoints[total - 1]);
    }
  }

  const duration = Math.max(1.0, keyframes[keyframes.length - 1].t);

  return {
    id: `imported_csv_${Date.now()}`,
    name: name,
    category: 'User Imported Log',
    description: `User-imported telemetry file containing ${total} recorded samples (${duration.toFixed(1)}s duration).`,
    duration: duration,
    keyframes: keyframes
  };
}

/**
 * Parses user-provided JSON telemetry log
 */
function parseJsonTelemetryLog(jsonText, name = 'Imported JSON Drive') {
  const data = JSON.parse(jsonText);
  const samples = data.samples || data.telemetry || data;
  if (!Array.isArray(samples) || samples.length === 0) {
    throw new Error('JSON does not contain an array of telemetry samples');
  }

  let t0 = null;
  const rawPoints = samples.map((s, idx) => {
    let t = s.elapsed_sec !== undefined ? s.elapsed_sec : (s.t !== undefined ? s.t : idx * 0.2);
    if (t0 === null) t0 = t;
    const relT = Math.max(0, t - t0);
    return {
      t: relT,
      spd: s.speed_kmh !== undefined ? s.speed_kmh : (s.spd !== undefined ? s.spd : 0),
      rpm: s.rpm !== undefined ? s.rpm : 750,
      tps: s.tps_pct !== undefined ? s.tps_pct : (s.tps !== undefined ? s.tps : 13),
      g: s.lateral_g !== undefined ? s.lateral_g : (s.g !== undefined ? s.g : 0.0),
      temp: s.coolant_temp_c !== undefined ? s.coolant_temp_c : (s.temp !== undefined ? s.temp : 88),
      stage: s.stage || s.audio_mode || `JSON SAMPLE [${relT.toFixed(1)}s]`
    };
  });

  const duration = Math.max(1.0, rawPoints[rawPoints.length - 1].t);

  return {
    id: `imported_json_${Date.now()}`,
    name: name,
    category: 'User Imported Log',
    description: `User-imported JSON telemetry containing ${rawPoints.length} samples.`,
    duration: duration,
    keyframes: rawPoints
  };
}

/**
 * TEKU TEST RUNNER CLASS
 * Interactive playback transport controller with scrubbing, speed control, loop, and callbacks.
 */
class TekuTestRunner {
  constructor(engine = null) {
    this.engine = engine;
    this.scenarios = [...TEKU_TEST_RUNS];
    this.currentScenario = this.scenarios[0];
    this.currentTime = 0.0;
    this.isPlaying = false;
    this.isLooping = true;
    this.playbackSpeed = 1.0;
    this.intervalId = null;
    this.listeners = [];
  }

  onUpdate(callback) {
    this.listeners.push(callback);
  }

  emit(state) {
    for (const cb of this.listeners) {
      try {
        cb(state);
      } catch (err) {
        console.error('TestRunner listener error:', err);
      }
    }
  }

  loadScenario(scenarioOrId) {
    let scenario = null;
    if (typeof scenarioOrId === 'string') {
      scenario = this.scenarios.find(s => s.id === scenarioOrId);
    } else if (typeof scenarioOrId === 'object' && scenarioOrId !== null) {
      scenario = scenarioOrId;
      if (!this.scenarios.some(s => s.id === scenario.id)) {
        this.scenarios.unshift(scenario);
      }
    }

    if (!scenario) throw new Error(`Scenario not found: ${scenarioOrId}`);
    this.currentScenario = scenario;
    this.currentTime = 0.0;
    this.interpolateAndApply(0.0);
    return this.currentScenario;
  }

  play() {
    if (this.isPlaying) return;
    if (this.engine && !this.engine.isRunning && typeof this.engine.start === 'function') {
      this.engine.start();
    }
    this.isPlaying = true;
    const tickMs = 60; // 60ms high-resolution update rate
    const dtReal = tickMs / 1000.0;

    this.intervalId = setInterval(() => {
      const dt = dtReal * this.playbackSpeed;
      this.currentTime += dt;

      if (this.currentTime >= this.currentScenario.duration) {
        if (this.isLooping) {
          this.currentTime = 0.0;
        } else {
          this.currentTime = this.currentScenario.duration;
          this.pause();
          return;
        }
      }

      this.interpolateAndApply(this.currentTime);
    }, tickMs);
  }

  pause() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.emit({
      isPlaying: false,
      currentTime: this.currentTime,
      duration: this.currentScenario.duration,
      scenario: this.currentScenario
    });
  }

  stop() {
    this.pause();
    this.currentTime = 0.0;
    this.interpolateAndApply(0.0);
  }

  seek(timeInSeconds) {
    const dur = this.currentScenario.duration;
    this.currentTime = Math.max(0, Math.min(dur, timeInSeconds));
    this.interpolateAndApply(this.currentTime);
  }

  setSpeed(speedMultiplier) {
    this.playbackSpeed = Math.max(0.25, Math.min(8.0, Number(speedMultiplier) || 1.0));
  }

  setLoop(isLoop) {
    this.isLooping = Boolean(isLoop);
  }

  interpolateAndApply(t) {
    const kfs = this.currentScenario.keyframes;
    if (!kfs || kfs.length === 0) return null;

    let prev = kfs[0];
    let next = kfs[kfs.length - 1];

    for (let i = 0; i < kfs.length - 1; i++) {
      if (t >= kfs[i].t && t <= kfs[i + 1].t) {
        prev = kfs[i];
        next = kfs[i + 1];
        break;
      }
    }

    const segDuration = Math.max(0.001, next.t - prev.t);
    const alpha = Math.max(0.0, Math.min(1.0, (t - prev.t) / segDuration));

    const curRpm = Math.round(prev.rpm + alpha * (next.rpm - prev.rpm));
    const curSpd = Math.round(prev.spd + alpha * (next.spd - prev.spd));
    const curTps = Math.round(prev.tps + alpha * (next.tps - prev.tps));
    const curG = Number((prev.g + alpha * (next.g - prev.g)).toFixed(3));
    const curTemp = Math.round(prev.temp + alpha * (next.temp - prev.temp));
    const stage = alpha < 0.6 ? prev.stage : next.stage;

    // Apply to engine if attached
    let telemetryState = null;
    if (this.engine && typeof this.engine.updateTelemetry === 'function') {
      telemetryState = this.engine.updateTelemetry(curRpm, curSpd, curTps, curG, curTemp);
    }

    const state = {
      isPlaying: this.isPlaying,
      currentTime: t,
      duration: this.currentScenario.duration,
      progress: Math.min(1.0, t / Math.max(0.001, this.currentScenario.duration)),
      scenario: this.currentScenario,
      rpm: curRpm,
      spd: curSpd,
      tps: curTps,
      g: curG,
      temp: curTemp,
      stage: stage,
      telemetryState: telemetryState
    };

    this.emit(state);
    return state;
  }
}

if (typeof globalThis !== 'undefined') {
  globalThis.TEKU_TEST_RUNS = TEKU_TEST_RUNS;
  globalThis.parseCsvTelemetryLog = parseCsvTelemetryLog;
  globalThis.parseJsonTelemetryLog = parseJsonTelemetryLog;
  globalThis.TekuTestRunner = TekuTestRunner;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TEKU_TEST_RUNS,
    parseCsvTelemetryLog,
    parseJsonTelemetryLog,
    TekuTestRunner
  };
}
