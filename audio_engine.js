/**
 * TEKU-DRIVE // Clio Mio 1.2 Generative Audio Engine
 * Driving Mode Recognition + 8-Bar Generative Narrative + Procedural TB-303
 */

class TekuAudioEngine {
  constructor() {
    this.ctx = null;
    this.isRunning = false;

    // Renault Clio Mio 1.2 Calibrated Limits
    this.CLIO = {
      IDLE_RPM: 750,
      CHILL_SHIFT_RPM: 2400,
      ATTACK_RPM: 3800,
      MAX_LATERAL_G: 0.35
    };

    // Telemetry & Driving Dynamics State
    this.telemetry = {
      rpm: 750,
      speed: 0,
      throttle: 13,
      lateralG: 0.0,
      temp: 88, // Engine Coolant Temp (ECT in °C)
      dTPS: 0.0, // Throttle velocity (%/s)
      aggressionScore: 0.0,
      mode: 'IDLE' // IDLE, CHILL, FLOW, ATTACK
    };

    // Gear Shift Detector State
    this.lastRpm = 750;
    this.lastThrottle = 13;
    this.lastTelemetryTime = performance.now();
    this.onShiftDetected = null;

    // 8-Bar Generative Musical Narrative
    this.bar = 1;
    this.currentStep = 0; // 0 to 15 within the current bar
    this.stepCount = 16;
    this.lookaheadMs = 25.0;
    this.scheduleAheadSec = 0.1;
    this.nextNoteTime = 0.0;
    this.timerID = null;
    this.bpm = 122;

    // Generative Chords (Cyberpunk / Phrygian cycle in D)
    // Dm (Bars 1-2) -> Bb (Bars 3-4) -> C (Bars 5-6) -> Am (Bars 7-8)
    this.chords = [
      { name: 'D Minor',  root: 38, scale: [0, 1, 3, 5, 7, 8, 10, 12, 13, 15, 17, 19, 24] },  // D Phrygian / Aeolian
      { name: 'Bb Major', root: 34, scale: [0, 2, 4, 5, 7, 8, 10, 12, 14, 16, 17, 19, 24] },  // Bb Lydian
      { name: 'C Major',  root: 36, scale: [0, 2, 4, 5, 7, 9, 10, 12, 14, 16, 17, 19, 24] },  // C Mixolydian
      { name: 'A Minor',  root: 33, scale: [0, 2, 3, 5, 7, 8, 10, 12, 14, 15, 17, 19, 24] }   // A Aeolian
    ];
    this.currentChord = this.chords[0];

    // Active Motif Selection: 'auto', 'halogen', 'shirako', 'anthem', 'metro'
    this.activeMotifKey = 'auto';
    this.currentMotifId = 'halogen';
    this.autoCycleOrder = ['halogen', 'shirako', 'anthem', 'metro'];
    this.autoCycleIndex = 0;

    // TB-303 Portamento & Cutoff Tracking
    this.last303Freq = null;
    this.currentAcidCutoff = 260;

    // 16V Cam Screamer (>3,000 RPM) Instrument State
    this.screamerActive = false;
    this.screamerCutoff = 1800;

    // Automotive SFX Tracking
    this.lastBovTime = 0;
    this.lastNitroxTime = 0;

    // Shirako Acoustic Perspective ('arena' or 'headphones')
    this.acousticPerspective = 'arena';

    // ==========================================
    // 4 STRUCTURED TEKU MOTIF ARCHETYPES (A-A-B-C Phrasing)
    // ==========================================
    this.motifs = {
      halogen: {
        id: 'halogen',
        name: 'HALOGEN // i_o SPEC',
        desc: 'Dark Cyberpunk / Warehouse Midtempo & Heavy Rolling Sub-Bass',
        // Rolling 16th Sub-Bass (Unrelenting driving pulse)
        bassA: [
          { deg: 0, oct: 0, slide: false, accent: true,  rest: false }, // 0: Root Downbeat Slam
          { deg: 0, oct: 0, slide: false, accent: false, rest: false }, // 1: 16th roll
          { deg: 1, oct: 0, slide: true,  accent: true,  rest: false }, // 2: Phrygian b2 slide
          { deg: 0, oct: 0, slide: false, accent: false, rest: false }, // 3: Root
          { deg: 0, oct: 0, slide: false, accent: true,  rest: false }, // 4: Kick hit
          { deg: 0, oct: 0, slide: false, accent: false, rest: false }, // 5: Roll
          { deg: 12, oct: 0, slide: true,  accent: true,  rest: false }, // 6: Octave sub pop
          { deg: 7, oct: 0, slide: false, accent: false, rest: false }, // 7: 5th
          { deg: 0, oct: 0, slide: false, accent: true,  rest: false }, // 8: Downbeat slam
          { deg: 0, oct: 0, slide: false, accent: false, rest: false }, // 9: Roll
          { deg: 10, oct: 0, slide: false, accent: true,  rest: false }, // 10: b7 punch
          { deg: 1, oct: 0, slide: true,  accent: false, rest: false }, // 11: b2 slide
          { deg: 0, oct: 0, slide: false, accent: true,  rest: false }, // 12: Kick hit
          { deg: 7, oct: 0, slide: false, accent: false, rest: false }, // 13: 5th
          { deg: 12, oct: 0, slide: true,  accent: true,  rest: false }, // 14: Octave slide
          { deg: 3, oct: 0, slide: false, accent: false, rest: false }  // 15: m3
        ],
        bassB: [
          { deg: 1, oct: 0, slide: false, accent: true,  rest: false }, // 0: b2 tension slam
          { deg: 1, oct: 0, slide: false, accent: false, rest: false }, // 1
          { deg: 3, oct: 0, slide: true,  accent: true,  rest: false }, // 2: m3
          { deg: 1, oct: 0, slide: false, accent: false, rest: false }, // 3
          { deg: 5, oct: 0, slide: false, accent: true,  rest: false }, // 4: 4th
          { deg: 7, oct: 0, slide: true,  accent: true,  rest: false }, // 5: 5th slide
          { deg: 8, oct: 0, slide: false, accent: false, rest: false }, // 6: b6
          { deg: 7, oct: 0, slide: false, accent: true,  rest: false }, // 7
          { deg: 0, oct: 0, slide: false, accent: true,  rest: false }, // 8
          { deg: 10, oct: 0, slide: false, accent: false, rest: false }, // 9
          { deg: 12, oct: 0, slide: true,  accent: true,  rest: false }, // 10
          { deg: 10, oct: 0, slide: false, accent: false, rest: false }, // 11
          { deg: 13, oct: 0, slide: true,  accent: true,  rest: false }, // 12: High b2 slide
          { deg: 12, oct: 0, slide: false, accent: false, rest: false }, // 13
          { deg: 10, oct: 0, slide: true,  accent: true,  rest: false }, // 14
          { deg: 7, oct: 0, slide: false, accent: false, rest: false }  // 15
        ],
        // Lead Phrase A: Sian/i_o dark hypnotic analog stabs with ping-pong delay
        leadA: [
          { deg: 0, oct: 1, accent: true, rest: false },  // 0: D4 stab
          { rest: true }, { rest: true },
          { deg: 3, oct: 1, accent: false, rest: false }, // 3: F4 stab
          { rest: true }, { rest: true },
          { deg: 7, oct: 1, accent: true, rest: false },  // 6: A4 stab
          { rest: true },
          { deg: 12, oct: 1, accent: true, rest: false }, // 8: D5 high ringing apex
          { rest: true }, { rest: true },
          { deg: 10, oct: 1, accent: true, rest: false }, // 11: C5
          { deg: 12, oct: 1, accent: true, rest: false }, // 12: D5
          { rest: true },
          { deg: 7, oct: 1, accent: false, rest: false }, // 14: A4
          { rest: true }
        ],
        leadB: [
          { deg: 8, oct: 1, accent: true, rest: false },  // 0: Bb4
          { rest: true },
          { deg: 7, oct: 1, accent: false, rest: false }, // 2: A4
          { rest: true },
          { deg: 5, oct: 1, accent: true, rest: false },  // 4: G4
          { rest: true },
          { deg: 3, oct: 1, accent: false, rest: false }, // 6: F4
          { deg: 5, oct: 1, accent: true, rest: false },  // 7: G4
          { deg: 7, oct: 1, accent: true, rest: false },  // 8: A4
          { rest: true }, { rest: true },
          { deg: 10, oct: 1, accent: true, rest: false }, // 11: C5
          { deg: 12, oct: 1, accent: true, rest: false }, // 12: D5
          { deg: 13, oct: 1, accent: true, rest: false }, // 13: Eb5 (Phrygian peak!)
          { deg: 12, oct: 1, accent: false, rest: false },// 14: D5
          { rest: true }
        ],
        arp: [0, 7, 12, 10, 7, 3, 1, 0, 0, 7, 12, 13, 12, 10, 7, 3]
      },

      shirako: {
        id: 'shirako',
        name: 'SHIRAKO // BASSLINE',
        desc: 'Nu-Skool Breaks & Phrygian Acid Slides',
        // Bassline & Acid Phrase A (Steps 0 - 15)
        bassA: [
          { deg: 0, oct: 0, slide: false, accent: true,  rest: false }, // 0
          { rest: true },                                              // 1
          { deg: 1, oct: 0, slide: true,  accent: false, rest: false }, // 2 (b2 slide)
          { deg: 0, oct: 0, slide: false, accent: false, rest: false }, // 3
          { rest: true },                                              // 4
          { deg: 0, oct: 0, slide: false, accent: false, rest: false }, // 5
          { deg: 12, oct: 0, slide: true,  accent: true,  rest: false }, // 6 (Octave pop)
          { deg: 7, oct: 0, slide: false, accent: false, rest: false }, // 7 (5th)
          { rest: true },                                              // 8
          { deg: 0, oct: 0, slide: false, accent: false, rest: false }, // 9
          { deg: 10, oct: 0, slide: false, accent: true,  rest: false }, // 10 (b7)
          { deg: 1, oct: 0, slide: true,  accent: false, rest: false }, // 11 (b2 slide)
          { rest: true },                                              // 12
          { deg: 0, oct: 0, slide: false, accent: false, rest: false }, // 13
          { deg: 12, oct: 0, slide: true,  accent: true,  rest: false }, // 14 (Octave slide)
          { deg: 3, oct: 0, slide: false, accent: false, rest: false }  // 15 (m3)
        ],
        // Bassline Phrase B (Tension)
        bassB: [
          { deg: 1, oct: 0, slide: false, accent: true,  rest: false }, // 0 (b2 tension)
          { deg: 1, oct: 0, slide: true,  accent: false, rest: false }, // 1
          { deg: 3, oct: 0, slide: false, accent: true,  rest: false }, // 2 (m3)
          { rest: true },                                              // 3
          { deg: 5, oct: 0, slide: false, accent: true,  rest: false }, // 4 (4th)
          { deg: 7, oct: 0, slide: true,  accent: true,  rest: false }, // 5
          { deg: 8, oct: 0, slide: false, accent: false, rest: false }, // 6 (b6)
          { deg: 7, oct: 0, slide: false, accent: false, rest: false }, // 7
          { deg: 0, oct: 0, slide: false, accent: true,  rest: false }, // 8
          { deg: 10, oct: 0, slide: true, accent: false, rest: false }, // 9
          { deg: 12, oct: 0, slide: false, accent: true, rest: false }, // 10
          { rest: true },                                              // 11
          { deg: 13, oct: 0, slide: true, accent: true,  rest: false }, // 12 (High b2 slide!)
          { deg: 12, oct: 0, slide: false, accent: false, rest: false }, // 13
          { deg: 10, oct: 0, slide: true, accent: false, rest: false }, // 14
          { deg: 7, oct: 0, slide: false, accent: false, rest: false }  // 15
        ],
        // Lead Phrase A: Call and response hook
        leadA: [
          { rest: true }, { rest: true }, { rest: true },
          { deg: 0, oct: 1, accent: true, rest: false }, // 3 (D4 stab)
          { rest: true }, { rest: true },
          { deg: 3, oct: 1, accent: true, rest: false }, // 6 (F4 stab)
          { rest: true },
          { deg: 7, oct: 1, accent: true, rest: false }, // 8 (A4 ring)
          { rest: true }, { rest: true },
          { deg: 10, oct: 1, accent: true, rest: false }, // 11 (C5)
          { deg: 12, oct: 1, accent: true, rest: false }, // 12 (D5 apex!)
          { rest: true }, { rest: true }, { rest: true }
        ],
        // Lead Phrase B
        leadB: [
          { deg: 8, oct: 1, accent: true, rest: false }, // 0 (Bb4)
          { rest: true },
          { deg: 7, oct: 1, accent: false, rest: false }, // 2 (A4)
          { rest: true },
          { deg: 5, oct: 1, accent: true, rest: false }, // 4 (G4)
          { rest: true },
          { deg: 3, oct: 1, accent: false, rest: false }, // 6 (F4)
          { deg: 5, oct: 1, accent: true, rest: false }, // 7 (G4)
          { deg: 7, oct: 1, accent: true, rest: false }, // 8 (A4)
          { rest: true }, { rest: true },
          { deg: 10, oct: 1, accent: true, rest: false }, // 11
          { deg: 12, oct: 1, accent: true, rest: false }, // 12
          { deg: 15, oct: 1, accent: true, rest: false }, // 13
          { deg: 12, oct: 1, accent: false, rest: false }, // 14
          { rest: true }
        ],
        arp: [0, 7, 12, 15, 12, 7, 3, 7, 0, 7, 12, 13, 12, 7, 10, 7]
      },

      anthem: {
        id: 'anthem',
        name: 'TEKU-ISING // PATA DE BASS',
        desc: 'Original AcceleRacers Shirako Big Beat - Heavy Syncopated Sub-Bass & Vinyl Scratch Breaks',
        // Authentic AcceleRacers Teku-Ising Breakbeat Bassline (Big Beat Swagger & Syncopation)
        bassA: [
          { deg: 0,  oct: 0, slide: false, accent: true,  rest: false }, // 0: Downbeat Sub Slam (PATA!)
          { rest: true },                                                // 1: Silence / subwoofer breathing space
          { deg: 12, oct: 0, slide: true,  accent: true,  rest: false }, // 2: Octave pop slap
          { rest: true },                                                // 3
          { deg: 0,  oct: 0, slide: false, accent: false, rest: false }, // 4: Snare lock root hit
          { rest: true },                                                // 5
          { deg: 5,  oct: 0, slide: true,  accent: true,  rest: false }, // 6: Breakbeat 4th-to-5th slide
          { deg: 7,  oct: 0, slide: false, accent: false, rest: false }, // 7: 5th resolution
          { deg: 0,  oct: 0, slide: false, accent: true,  rest: false }, // 8: Downbeat Sub Slam
          { rest: true },                                                // 9
          { deg: 1,  oct: 0, slide: true,  accent: true,  rest: false }, // 10: Phrygian b2 tension slide!
          { rest: true },                                                // 11
          { deg: 12, oct: 0, slide: false, accent: true,  rest: false }, // 12: High octave snap + snare
          { rest: true },                                                // 13
          { deg: 10, oct: 0, slide: true,  accent: true,  rest: false }, // 14: b7 slide turnaround
          { rest: true }                                                 // 15
        ],
        bassB: [
          { deg: 8,  oct: 0, slide: false, accent: true,  rest: false }, // 0: Bb sub slam
          { rest: true },                                                // 1
          { deg: 20, oct: 0, slide: true,  accent: true,  rest: false }, // 2: High Bb pop
          { rest: true },                                                // 3
          { deg: 10, oct: 0, slide: false, accent: false, rest: false }, // 4: C chord root
          { rest: true },                                                // 5
          { deg: 12, oct: 0, slide: true,  accent: true,  rest: false }, // 6: D slide
          { rest: true },                                                // 7
          { deg: 0,  oct: 0, slide: false, accent: true,  rest: false }, // 8: D Root slam
          { rest: true },                                                // 9
          { deg: 5,  oct: 0, slide: true,  accent: true,  rest: false }, // 10: G slide
          { deg: 7,  oct: 0, slide: false, accent: false, rest: false }, // 11: A
          { deg: 12, oct: 0, slide: false, accent: true,  rest: false }, // 12: High D punch
          { rest: true },                                                // 13
          { deg: 8,  oct: 0, slide: true,  accent: true,  rest: false }, // 14: Bb turnaround slide
          { rest: true }                                                 // 15
        ],
        leadA: [
          { deg: 0,  oct: 1, accent: true, rest: false },  // 0: D4
          { deg: 12, oct: 1, accent: true, rest: false },  // 1: D5 octave laser!
          { rest: true },
          { deg: 10, oct: 1, accent: false, rest: false }, // 3: C5
          { deg: 7,  oct: 1, accent: true, rest: false },  // 4: A4
          { rest: true },
          { deg: 3,  oct: 1, accent: true, rest: false },  // 6: F4
          { deg: 5,  oct: 1, accent: true, rest: false },  // 7: G4
          { deg: 7,  oct: 1, accent: true, rest: false },  // 8: A4
          { rest: true },
          { deg: 10, oct: 1, accent: false, rest: false }, // 10: C5
          { deg: 12, oct: 1, accent: true, rest: false },  // 11: D5
          { deg: 15, oct: 1, accent: true, rest: false },  // 12: F5 high climax!
          { deg: 14, oct: 1, accent: false, rest: false }, // 13: E5
          { deg: 12, oct: 1, accent: true, rest: false },  // 14: D5
          { rest: true }                                   // 15
        ],
        leadB: [
          { deg: 8,  oct: 1, accent: true, rest: false },  // 0: Bb4
          { rest: true },
          { deg: 7,  oct: 1, accent: false, rest: false }, // 2: A4
          { deg: 5,  oct: 1, accent: true, rest: false },  // 3: G4
          { deg: 7,  oct: 1, accent: true, rest: false },  // 4: A4
          { rest: true },
          { deg: 10, oct: 1, accent: true, rest: false },  // 6: C5
          { deg: 12, oct: 1, accent: true, rest: false },  // 7: D5
          { deg: 13, oct: 1, accent: true, rest: false },  // 8: Eb5 (Phrygian tension!)
          { deg: 12, oct: 1, accent: false, rest: false }, // 9: D5
          { deg: 10, oct: 1, accent: true, rest: false },  // 10: C5
          { rest: true },
          { deg: 8,  oct: 1, accent: true, rest: false },  // 12: Bb4
          { deg: 7,  oct: 1, accent: false, rest: false }, // 13: A4
          { deg: 5,  oct: 1, accent: true, rest: false },  // 14: G4
          { deg: 7,  oct: 1, accent: true, rest: false }   // 15: A4
        ],
        arp: [0, 12, 7, 10, 12, 15, 12, 7, 0, 12, 10, 13, 12, 7, 5, 3]
      },

      metro: {
        id: 'metro',
        name: 'METRO // NIGHT RUN',
        desc: 'Deep Tuner Cascading 16th Arpeggios',
        bassA: [
          { deg: 0, oct: 0, slide: false, accent: true,  rest: false }, // 0
          { deg: 0, oct: 0, slide: false, accent: false, rest: false }, // 1
          { deg: 7, oct: 0, slide: true,  accent: false, rest: false }, // 2 (5th)
          { deg: 0, oct: 0, slide: false, accent: true,  rest: false }, // 3
          { rest: true },                                              // 4
          { deg: 0, oct: 0, slide: false, accent: false, rest: false }, // 5
          { deg: 10, oct: 0, slide: false, accent: true,  rest: false }, // 6 (b7)
          { rest: true },                                              // 7
          { deg: 0, oct: 0, slide: false, accent: true,  rest: false }, // 8
          { deg: 0, oct: 0, slide: false, accent: false, rest: false }, // 9
          { deg: 12, oct: 0, slide: true,  accent: true,  rest: false }, // 10 (Octave slide)
          { deg: 7, oct: 0, slide: false, accent: false, rest: false }, // 11
          { rest: true },                                              // 12
          { deg: 3, oct: 0, slide: false, accent: false, rest: false }, // 13
          { deg: 5, oct: 0, slide: true,  accent: true,  rest: false }, // 14
          { deg: 0, oct: 0, slide: false, accent: false, rest: false }  // 15
        ],
        bassB: [
          { deg: 10, oct: 0, slide: false, accent: true,  rest: false }, // 0
          { deg: 10, oct: 0, slide: true,  accent: false, rest: false }, // 1
          { deg: 12, oct: 0, slide: false, accent: true,  rest: false }, // 2
          { rest: true },                                              // 3
          { deg: 7, oct: 0, slide: false, accent: true,  rest: false }, // 4
          { deg: 5, oct: 0, slide: true,  accent: false, rest: false }, // 5
          { deg: 3, oct: 0, slide: false, accent: true,  rest: false }, // 6
          { rest: true },                                              // 7
          { deg: 0, oct: 0, slide: false, accent: true,  rest: false }, // 8
          { deg: 0, oct: 0, slide: false, accent: false, rest: false }, // 9
          { deg: 7, oct: 0, slide: true,  accent: true,  rest: false }, // 10
          { rest: true },                                              // 11
          { deg: 8, oct: 0, slide: false, accent: true,  rest: false }, // 12
          { deg: 10, oct: 0, slide: true, accent: false, rest: false }, // 13
          { deg: 12, oct: 0, slide: false, accent: true, rest: false }, // 14
          { rest: true }
        ],
        leadA: [
          { deg: 0, oct: 1, accent: true, rest: false },  // 0
          { deg: 7, oct: 1, accent: false, rest: false }, // 1
          { deg: 10, oct: 1, accent: false, rest: false },// 2
          { deg: 12, oct: 1, accent: true, rest: false }, // 3
          { deg: 10, oct: 1, accent: false, rest: false },// 4
          { deg: 7, oct: 1, accent: false, rest: false }, // 5
          { deg: 3, oct: 1, accent: true, rest: false },  // 6
          { deg: 7, oct: 1, accent: false, rest: false }, // 7
          { deg: 0, oct: 1, accent: true, rest: false },  // 8
          { deg: 7, oct: 1, accent: false, rest: false }, // 9
          { deg: 12, oct: 1, accent: true, rest: false }, // 10
          { deg: 14, oct: 1, accent: false, rest: false },// 11 (E5)
          { deg: 12, oct: 1, accent: true, rest: false }, // 12
          { deg: 10, oct: 1, accent: false, rest: false },// 13
          { deg: 7, oct: 1, accent: true, rest: false },  // 14
          { deg: 3, oct: 1, accent: false, rest: false }  // 15
        ],
        leadB: [
          { deg: 12, oct: 1, accent: true, rest: false }, // 0
          { deg: 15, oct: 1, accent: false, rest: false },// 1
          { deg: 14, oct: 1, accent: false, rest: false },// 2
          { deg: 12, oct: 1, accent: true, rest: false }, // 3
          { deg: 10, oct: 1, accent: false, rest: false },// 4
          { deg: 7, oct: 1, accent: false, rest: false }, // 5
          { deg: 5, oct: 1, accent: true, rest: false },  // 6
          { deg: 7, oct: 1, accent: false, rest: false }, // 7
          { deg: 8, oct: 1, accent: true, rest: false },  // 8
          { deg: 10, oct: 1, accent: false, rest: false },// 9
          { deg: 12, oct: 1, accent: true, rest: false }, // 10
          { deg: 14, oct: 1, accent: false, rest: false },// 11
          { deg: 15, oct: 1, accent: true, rest: false }, // 12
          { deg: 12, oct: 1, accent: false, rest: false },// 13
          { deg: 10, oct: 1, accent: true, rest: false }, // 14
          { deg: 7, oct: 1, accent: false, rest: false }  // 15
        ],
        arp: [0, 7, 10, 12, 10, 7, 3, 7, 0, 7, 12, 14, 12, 10, 7, 3]
      }
    };

    // Generative Turnaround Buffers (Bars 4 and 8)
    this.turnaroundBass = null;
    this.turnaroundLead = null;
    this.turnaroundClimaxBass = null;
    this.turnaroundClimaxLead = null;
    this.initTurnarounds();

    // Master Audio Graph Nodes
    this.masterGain = null;
    this.panner = null;
    this.analyser = null;
    this.acidFilter = null;
    this.distortion = null;
    this.bassFilter = null;
    this.bassGain = null;
    this.leadFilter = null;
    this.leadGain = null;
    this.delayLeft = null;
    this.delayRight = null;
    this.delayGain = null;

    // Continuous Analog Engine Nodes
    this.analogIdleOsc1 = null;
    this.analogIdleOsc2 = null;
    this.analogIdleOsc3 = null;
    this.analogIdleNoiseNode = null;
    this.analogIdleExhaustFilter = null;
    this.analogIdleNoiseGain = null;
    this.analogIdleLfo = null;
    this.analogIdlePitchMod = null;
    this.analogIdleVca = null;
    this.analogIdleFilter = null;
    this.analogIdleDrive = null;
    this.analogColdValveGain = null;
    this.analogIdleStarted = false;
  }

  initTurnarounds() {
    this.mutateTurnaroundBar4();
    this.mutateTurnaroundBar8();
  }

  mutateTurnaroundBar4() {
    const isAggressive = (this.telemetry && this.telemetry.aggressionScore > 0.45) || (this.telemetry && this.telemetry.mode === 'ATTACK');
    if (isAggressive) {
      this.turnaroundBass = [
        { deg: 10, oct: 0, slide: false, accent: true, rest: false },
        { deg: 12, oct: 0, slide: true,  accent: true, rest: false },
        { deg: 13, oct: 0, slide: true,  accent: true, rest: false },
        { deg: 12, oct: 0, slide: false, accent: false, rest: false }
      ];
      this.turnaroundLead = [
        { deg: 10, oct: 1, accent: true, rest: false },
        { deg: 12, oct: 1, accent: true, rest: false },
        { deg: 15, oct: 1, accent: true, rest: false },
        { deg: 17, oct: 1, accent: true, rest: false }
      ];
    } else {
      this.turnaroundBass = [
        { deg: 7, oct: 0, slide: false, accent: true,  rest: false },
        { deg: 5, oct: 0, slide: true,  accent: false, rest: false },
        { deg: 3, oct: 0, slide: false, accent: false, rest: false },
        { deg: 0, oct: 0, slide: false, accent: true,  rest: false }
      ];
      this.turnaroundLead = [
        { deg: 7, oct: 1, accent: false, rest: false },
        { deg: 5, oct: 1, accent: false, rest: false },
        { deg: 3, oct: 1, accent: false, rest: false },
        { rest: true }
      ];
    }
  }

  mutateTurnaroundBar8() {
    const isAggressive = (this.telemetry && this.telemetry.aggressionScore > 0.45) || (this.telemetry && this.telemetry.mode === 'ATTACK');
    const scale = [0, 3, 5, 7, 8, 10, 12, 13, 15];
    this.turnaroundClimaxBass = [];
    this.turnaroundClimaxLead = [];
    for (let i = 0; i < 8; i++) {
      const idx = isAggressive ? (i % scale.length) : Math.floor((7 - i) * (scale.length / 8));
      this.turnaroundClimaxBass.push({
        deg: scale[idx % scale.length],
        oct: isAggressive && i >= 4 ? 1 : 0,
        slide: i % 2 === 1,
        accent: i === 0 || i === 4 || i === 7,
        rest: false
      });
      this.turnaroundClimaxLead.push({
        deg: scale[(idx + 2) % scale.length],
        oct: 1,
        accent: i % 2 === 0,
        rest: !isAggressive && i % 2 === 1
      });
    }
  }

  setMotif(motifKey) {
    if (motifKey === 'auto') {
      this.activeMotifKey = 'auto';
    } else if (this.motifs[motifKey]) {
      this.activeMotifKey = motifKey;
      this.currentMotifId = motifKey;
    }
  }

  init() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.75, this.ctx.currentTime);

    this.panner = this.ctx.createStereoPanner();
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 128;

    // --- 1. ACID 303 BUS: Filter -> Waveshaper Saturation -> Panner ---
    this.distortion = this.ctx.createWaveShaper();
    this.distortion.curve = this.makeDistortionCurve(18);
    this.distortion.oversample = '2x';

    this.acidFilter = this.ctx.createBiquadFilter();
    this.acidFilter.type = 'lowpass';
    this.acidFilter.frequency.setValueAtTime(260, this.ctx.currentTime);
    this.acidFilter.Q.setValueAtTime(10, this.ctx.currentTime);

    this.acidFilter.connect(this.distortion);
    this.distortion.connect(this.panner);

    // --- 2. DEDICATED SOLID ROLLING SUB/MID BASS BUS ---
    // Sub-Bass Low-Shelf Boost (+4.5 dB at 55 Hz) for heavy subwoofer rumble
    this.subBoost = this.ctx.createBiquadFilter();
    this.subBoost.type = 'lowshelf';
    this.subBoost.frequency.setValueAtTime(55, this.ctx.currentTime);
    this.subBoost.gain.setValueAtTime(4.5, this.ctx.currentTime);

    this.bassFilter = this.ctx.createBiquadFilter();
    this.bassFilter.type = 'lowpass';
    this.bassFilter.frequency.setValueAtTime(500, this.ctx.currentTime);

    this.bassGain = this.ctx.createGain();
    this.bassGain.gain.setValueAtTime(0.95, this.ctx.currentTime);

    // Dedicated Raw Bassline Overdrive (WaveShaperNode with 4x oversampling)
    this.bassDistortion = this.ctx.createWaveShaper();
    this.bassDistortion.curve = this.makeAsymmetricTubeCurve(3.8);
    this.bassDistortion.oversample = '4x';

    this.bassFilter.connect(this.subBoost);
    this.subBoost.connect(this.bassDistortion);
    this.bassDistortion.connect(this.bassGain);
    this.bassGain.connect(this.masterGain);

    // --- 3. DEDICATED TEKU LEAD BUS ---
    this.leadFilter = this.ctx.createBiquadFilter();
    this.leadFilter.type = 'lowpass';
    this.leadFilter.frequency.setValueAtTime(2600, this.ctx.currentTime);
    this.leadFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    this.leadGain = this.ctx.createGain();
    this.leadGain.gain.setValueAtTime(0.65, this.ctx.currentTime);

    this.leadFilter.connect(this.leadGain);
    this.leadGain.connect(this.panner);

    // --- 4. STEREO PING-PONG DELAY BUS (Dotted 8th Trance Echo) ---
    this.delayGain = this.ctx.createGain();
    this.delayGain.gain.setValueAtTime(0.40, this.ctx.currentTime);

    this.delayLeft = this.ctx.createDelay(2.0);
    this.delayRight = this.ctx.createDelay(2.0);
    this.delayLeft.delayTime.setValueAtTime(0.36, this.ctx.currentTime);
    this.delayRight.delayTime.setValueAtTime(0.24, this.ctx.currentTime);

    this.delayFeedbackL = this.ctx.createGain();
    this.delayFeedbackL.gain.setValueAtTime(0.34, this.ctx.currentTime);
    this.delayFeedbackR = this.ctx.createGain();
    this.delayFeedbackR.gain.setValueAtTime(0.34, this.ctx.currentTime);

    this.delayFilter = this.ctx.createBiquadFilter();
    this.delayFilter.type = 'lowpass';
    this.delayFilter.frequency.setValueAtTime(3200, this.ctx.currentTime);

    // Cross-channel feedback ping-pong loop
    this.delayLeft.connect(this.delayFilter);
    this.delayFilter.connect(this.delayFeedbackL);
    this.delayFeedbackL.connect(this.delayRight);

    this.delayRight.connect(this.delayFeedbackR);
    this.delayFeedbackR.connect(this.delayLeft);

    const delayMerger = this.ctx.createChannelMerger(2);
    this.delayLeft.connect(delayMerger, 0, 0);
    this.delayRight.connect(delayMerger, 0, 1);
    delayMerger.connect(this.delayGain);
    this.delayGain.connect(this.masterGain);

    // --- 5. DRUM BUS (Gradual choke & deceleration crossfade) ---
    this.drumFilter = this.ctx.createBiquadFilter();
    this.drumFilter.type = 'lowpass';
    this.drumFilter.frequency.setValueAtTime(14000, this.ctx.currentTime);
    this.drumFilter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    this.drumGain = this.ctx.createGain();
    this.drumGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.drumFilter.connect(this.drumGain);
    this.drumGain.connect(this.masterGain);

    // --- 6. CONTINUOUS ANALOG ENGINE IDLE GENERATOR ---
    // Deep, living, breathing analog engine thrum (organic analog drift, continuous resonance)
    this.idleGain = this.ctx.createGain();
    this.idleGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
    this.idleGain.connect(this.masterGain);

    // Continuous Analog Oscillator 1: Combustion firing fundamental (25 Hz @ 750 RPM)
    this.analogIdleOsc1 = this.ctx.createOscillator();
    this.analogIdleOsc1.type = 'triangle';
    this.analogIdleOsc1.frequency.setValueAtTime(25.0, this.ctx.currentTime);

    // Continuous Analog Oscillator 2: Crankshaft 2nd harmonic (50 Hz @ 750 RPM)
    this.analogIdleOsc2 = this.ctx.createOscillator();
    this.analogIdleOsc2.type = 'sawtooth';
    this.analogIdleOsc2.frequency.setValueAtTime(50.4, this.ctx.currentTime);

    // Continuous Sub-Chassis Pressure (22 Hz subwoofer body resonance)
    this.analogIdleOsc3 = this.ctx.createOscillator();
    this.analogIdleOsc3.type = 'sine';
    this.analogIdleOsc3.frequency.setValueAtTime(22.0, this.ctx.currentTime);

    // Continuous Exhaust Noise Generator (Pink Noise through acoustic pipe cavity filter)
    const noiseBufferSize = Math.floor(this.ctx.sampleRate * 2.0);
    const noiseBuffer = this.ctx.createBuffer(1, noiseBufferSize, this.ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < noiseBufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      noiseData[i] = (b0 + b1 + b2 + white * 0.5362) * 0.15;
    }
    this.analogIdleNoiseNode = this.ctx.createBufferSource();
    this.analogIdleNoiseNode.buffer = noiseBuffer;
    this.analogIdleNoiseNode.loop = true;

    // Exhaust pipe cavity filter (modeling exhaust gas velocity through muffler)
    this.analogIdleExhaustFilter = this.ctx.createBiquadFilter();
    this.analogIdleExhaustFilter.type = 'bandpass';
    this.analogIdleExhaustFilter.frequency.setValueAtTime(68, this.ctx.currentTime);
    this.analogIdleExhaustFilter.Q.setValueAtTime(2.2, this.ctx.currentTime);

    this.analogIdleNoiseGain = this.ctx.createGain();
    this.analogIdleNoiseGain.gain.setValueAtTime(0.32, this.ctx.currentTime);

    this.analogIdleNoiseNode.connect(this.analogIdleExhaustFilter);
    this.analogIdleExhaustFilter.connect(this.analogIdleNoiseGain);

    // Analog LFO: Organic Cam Lobing & Rotational Flutter (3.8 Hz)
    this.analogIdleLfo = this.ctx.createOscillator();
    this.analogIdleLfo.type = 'sine';
    this.analogIdleLfo.frequency.setValueAtTime(3.8, this.ctx.currentTime);

    // Pitch flutter modulation (+/- 1.4 Hz drift)
    this.analogIdlePitchMod = this.ctx.createGain();
    this.analogIdlePitchMod.gain.setValueAtTime(1.4, this.ctx.currentTime);
    this.analogIdleLfo.connect(this.analogIdlePitchMod);
    this.analogIdlePitchMod.connect(this.analogIdleOsc1.frequency);
    this.analogIdlePitchMod.connect(this.analogIdleOsc2.frequency);

    // Throbbing amplitude VCA (tremolo for physical engine thrum)
    this.analogIdleVca = this.ctx.createGain();
    this.analogIdleVca.gain.setValueAtTime(0.72, this.ctx.currentTime);

    const lfoAmpMod = this.ctx.createGain();
    lfoAmpMod.gain.setValueAtTime(0.15, this.ctx.currentTime);
    this.analogIdleLfo.connect(lfoAmpMod);
    lfoAmpMod.connect(this.analogIdleVca.gain);

    // Sum oscillators into VCA
    const oscMix = this.ctx.createGain();
    oscMix.gain.setValueAtTime(0.55, this.ctx.currentTime);
    this.analogIdleOsc1.connect(oscMix);
    this.analogIdleOsc2.connect(oscMix);
    this.analogIdleOsc3.connect(oscMix);
    this.analogIdleNoiseGain.connect(oscMix);

    oscMix.connect(this.analogIdleVca);

    // Analog 4-pole style Low-Pass Filter
    this.analogIdleFilter = this.ctx.createBiquadFilter();
    this.analogIdleFilter.type = 'lowpass';
    this.analogIdleFilter.frequency.setValueAtTime(135, this.ctx.currentTime);
    this.analogIdleFilter.Q.setValueAtTime(2.6, this.ctx.currentTime);

    // Analog Tube Saturation Shaper
    this.analogIdleDrive = this.ctx.createWaveShaper();
    this.analogIdleDrive.curve = this.makeAsymmetricTubeCurve(3.2);
    this.analogIdleDrive.oversample = '4x';

    this.analogIdleVca.connect(this.analogIdleFilter);
    this.analogIdleFilter.connect(this.analogIdleDrive);
    this.analogIdleDrive.connect(this.idleGain);

    // Continuous Valvetrain Clatter Node (active when cold)
    this.analogColdValveGain = this.ctx.createGain();
    this.analogColdValveGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    const valveFilter = this.ctx.createBiquadFilter();
    valveFilter.type = 'bandpass';
    valveFilter.frequency.setValueAtTime(3200, this.ctx.currentTime);
    valveFilter.Q.setValueAtTime(6.0, this.ctx.currentTime);

    this.analogIdleNoiseNode.connect(valveFilter);
    valveFilter.connect(this.analogColdValveGain);
    this.analogColdValveGain.connect(this.idleGain);

    // --- 6B. THERMAL HEADER CRACKLE / PRE-IGNITION BUS (> 95°C Hot Idle) ---
    this.hotCrackleFilter = this.ctx.createBiquadFilter();
    this.hotCrackleFilter.type = 'bandpass';
    this.hotCrackleFilter.frequency.setValueAtTime(2400, this.ctx.currentTime);
    this.hotCrackleFilter.Q.setValueAtTime(3.5, this.ctx.currentTime);

    this.hotCrackleDistortion = this.ctx.createWaveShaper();
    this.hotCrackleDistortion.curve = this.makeAsymmetricTubeCurve(5.5);
    this.hotCrackleDistortion.oversample = '4x';

    this.hotCrackleGain = this.ctx.createGain();
    this.hotCrackleGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

    this.hotCrackleFilter.connect(this.hotCrackleDistortion);
    this.hotCrackleDistortion.connect(this.hotCrackleGain);
    this.hotCrackleGain.connect(this.masterGain);

    // --- 7. STEREO BBD CHORUS / FLANGER MODULATOR ---
    this.chorusInput = this.ctx.createGain();
    this.chorusInput.gain.setValueAtTime(0.55, this.ctx.currentTime);

    this.chorusDelayL = this.ctx.createDelay(0.08);
    this.chorusDelayR = this.ctx.createDelay(0.08);
    this.chorusDelayL.delayTime.setValueAtTime(0.007, this.ctx.currentTime);
    this.chorusDelayR.delayTime.setValueAtTime(0.007, this.ctx.currentTime);

    this.chorusLfo = this.ctx.createOscillator();
    this.chorusLfo.type = 'sine';
    this.chorusLfo.frequency.setValueAtTime(0.38, this.ctx.currentTime);

    this.chorusLfoGainL = this.ctx.createGain();
    this.chorusLfoGainR = this.ctx.createGain();
    this.chorusLfoGainL.gain.setValueAtTime(0.0022, this.ctx.currentTime);
    this.chorusLfoGainR.gain.setValueAtTime(-0.0022, this.ctx.currentTime); // Inverted phase for wide stereo

    this.chorusLfo.connect(this.chorusLfoGainL);
    this.chorusLfo.connect(this.chorusLfoGainR);
    this.chorusLfoGainL.connect(this.chorusDelayL.delayTime);
    this.chorusLfoGainR.connect(this.chorusDelayR.delayTime);

    this.chorusInput.connect(this.chorusDelayL);
    this.chorusInput.connect(this.chorusDelayR);

    this.chorusMerger = this.ctx.createChannelMerger(2);
    this.chorusDelayL.connect(this.chorusMerger, 0, 0);
    this.chorusDelayR.connect(this.chorusMerger, 0, 1);

    this.chorusOutput = this.ctx.createGain();
    this.chorusOutput.gain.setValueAtTime(0.48, this.ctx.currentTime);
    this.chorusMerger.connect(this.chorusOutput);
    this.chorusOutput.connect(this.masterGain);
    this.chorusLfo.start();

    // Send Teku lead into stereo chorus
    this.leadGain.connect(this.chorusInput);

    // --- 8. DEDICATED 16V CAM SCREAMER BUS (>3,000 RPM) ---
    this.screamerFilter = this.ctx.createBiquadFilter();
    this.screamerFilter.type = 'bandpass';
    this.screamerFilter.frequency.setValueAtTime(2400, this.ctx.currentTime);
    this.screamerFilter.Q.setValueAtTime(4.5, this.ctx.currentTime); // High screaming resonance

    this.screamerDistortion = this.ctx.createWaveShaper();
    this.screamerDistortion.curve = this.makeAsymmetricTubeCurve(4.2);
    this.screamerDistortion.oversample = '4x';

    this.screamerGain = this.ctx.createGain();
    this.screamerGain.gain.setValueAtTime(0.0, this.ctx.currentTime); // Clamped to zero below 3000 RPM

    this.screamerFilter.connect(this.screamerDistortion);
    this.screamerDistortion.connect(this.screamerGain);
    this.screamerGain.connect(this.masterGain);
    this.screamerGain.connect(this.chorusInput); // Send into chorus
    this.screamerGain.connect(this.delayLeft);   // Send into ping-pong delay

    // --- 9. MASTER ANALOG TUBE SATURATION & COMPRESSOR CHAIN ---
    this.tubeSaturator = this.ctx.createWaveShaper();
    this.tubeSaturator.curve = this.makeAsymmetricTubeCurve(2.6);
    this.tubeSaturator.oversample = '4x';

    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
    this.compressor.knee.setValueAtTime(6, this.ctx.currentTime);
    this.compressor.ratio.setValueAtTime(4, this.ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.005, this.ctx.currentTime);
    this.compressor.release.setValueAtTime(0.12, this.ctx.currentTime);

    this.panner.connect(this.masterGain);
    this.masterGain.connect(this.tubeSaturator);
    this.tubeSaturator.connect(this.compressor);
    this.compressor.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
  }

  makeAsymmetricTubeCurve(amount = 2.6) {
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    for (let i = 0; i < n_samples; ++i) {
      let x = (i * 2) / n_samples - 1;
      if (x >= 0) {
        curve[i] = Math.tanh(x * amount);
      } else {
        curve[i] = Math.tanh(x * (amount * 1.25)) * 0.92;
      }
    }
    return curve;
  }

  makeDistortionCurve(amount) {
    const k = amount;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  start() {
    if (!this.ctx) this.init();
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isRunning = true;
    this.currentStep = 0;
    this.bar = 1;

    // Start continuous analog idle generators if not yet started
    if (!this.analogIdleStarted) {
      this.analogIdleOsc1.start();
      this.analogIdleOsc2.start();
      this.analogIdleOsc3.start();
      this.analogIdleLfo.start();
      this.analogIdleNoiseNode.start();
      this.analogIdleStarted = true;
    }

    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
    }
    this.updateTelemetry(this.telemetry.rpm || 750, this.telemetry.speed || 0, this.telemetry.throttle || 13, this.telemetry.lateralG || 0, this.telemetry.temp !== undefined ? this.telemetry.temp : 88);

    this.nextNoteTime = this.ctx.currentTime + 0.05;
    this.scheduler();
  }

  stop() {
    this.isRunning = false;
    if (this.timerID) clearTimeout(this.timerID);
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
    }
  }

  /**
   * INGEST TELEMETRY & RUN DRIVING MODE CLASSIFIER
   */
  updateTelemetry(rpm, speed, throttle, lateralG, temp = 88) {
    const now = performance.now();
    const dt = Math.max(0.02, (now - this.lastTelemetryTime) / 1000.0);

    // Compute Throttle Velocity (% per second)
    const dTPS = (throttle - this.lastThrottle) / dt;
    this.telemetry.dTPS = Math.max(-200, Math.min(300, dTPS));

    // Shift Detection (Clio 1.2 specific signature)
    const rpmDelta = rpm - this.lastRpm;
    if (this.lastRpm > 2000 && rpmDelta < -400 && throttle < 20 && speed > 15) {
      this.triggerShiftFlair();
    }

    this.lastRpm = rpm;
    this.lastThrottle = throttle;
    this.lastTelemetryTime = now;

    this.telemetry.rpm = rpm;
    this.telemetry.speed = speed;
    this.telemetry.throttle = throttle;
    this.telemetry.lateralG = lateralG;
    this.telemetry.temp = temp;

    // Dynamic Saturation and Overdrive Scaling based on Temperature
    if (this.tubeSaturator && this.bassDistortion) {
      if (temp > 95) {
        // Hot Overheated Idle: Heavy tube distortion & aggressive saturation (Cranked!)
        this.tubeSaturator.curve = this.makeAsymmetricTubeCurve(5.2);
        this.bassDistortion.curve = this.makeAsymmetricTubeCurve(5.5);
      } else if (temp < 50) {
        // Cold Start: Sharp, lean metallic clipping
        this.tubeSaturator.curve = this.makeAsymmetricTubeCurve(3.6);
        this.bassDistortion.curve = this.makeAsymmetricTubeCurve(4.2);
      } else {
        // Warm Optimal (50 - 95°C): Deep, warm analog purr
        this.tubeSaturator.curve = this.makeAsymmetricTubeCurve(2.8);
        this.bassDistortion.curve = this.makeAsymmetricTubeCurve(3.8);
      }
    }

    // --- DRIVING MODE RECOGNITION ALGORITHM ---
    // Normalize against Clio 1.2 physical sweet spots
    const normRPM = Math.max(0, Math.min(1, (rpm - this.CLIO.IDLE_RPM) / (this.CLIO.ATTACK_RPM - this.CLIO.IDLE_RPM)));
    const normTPSVel = Math.max(0, Math.min(1, dTPS / 120.0));
    const normG = Math.max(0, Math.min(1, Math.abs(lateralG) / this.CLIO.MAX_LATERAL_G));
    const normTPS = throttle / 100.0;

    // Aggression Score (0.0 to 1.0)
    let score = (0.40 * normRPM) + (0.35 * normTPSVel) + (0.15 * normTPS) + (0.10 * normG);
    this.telemetry.aggressionScore = Math.max(0, Math.min(1, score));

    // --- GRADUAL DECELERATION & IDLE BLEND (5 km/h to 18 km/h transition zone) ---
    let drumFactor = 0.0;
    let idleFactor = 1.0;

    if (speed > 18) {
      drumFactor = 1.0;
      idleFactor = 0.0;
    } else if (speed <= 5) {
      drumFactor = 0.0;
      idleFactor = 1.0;
    } else {
      // Between 5 and 18 km/h: smooth gradual transition curve
      const t = (speed - 5.0) / 13.0; // 0.0 at 5 km/h, 1.0 at 18 km/h
      drumFactor = Math.pow(t, 1.25); // Progressive roll-off
      idleFactor = 1.0 - t;
    }

    // Dynamic Bus Crossfading
    if (this.drumGain && this.drumFilter && this.ctx) {
      this.drumGain.gain.setTargetAtTime(drumFactor, this.ctx.currentTime, 0.08);
      // Low-pass filter sweeps down from 14,000 Hz down to 350 Hz as you come to a stop!
      const drumCutoff = 350 + drumFactor * 13650;
      this.drumFilter.frequency.setTargetAtTime(drumCutoff, this.ctx.currentTime, 0.08);
    }

    if (this.idleGain && this.ctx) {
      this.idleGain.gain.setTargetAtTime(idleFactor, this.ctx.currentTime, 0.08);
    }

    // --- CONTINUOUS ANALOG ENGINE PARAMETER MODULATION ---
    if (this.analogIdleOsc1 && this.ctx) {
      const now = this.ctx.currentTime;
      // Firing fundamental: 4-cylinder 4-stroke fires 2 times per crankshaft revolution: f0 = (RPM / 60) * 2
      // 750 RPM -> 25 Hz; 900 RPM -> 30 Hz; 1100 RPM -> 36.7 Hz
      const baseFiringFreq = Math.max(18, (rpm / 60.0) * 2.0);
      this.analogIdleOsc1.frequency.setTargetAtTime(baseFiringFreq, now, 0.04);
      this.analogIdleOsc2.frequency.setTargetAtTime(baseFiringFreq * 2.0 + 0.6, now, 0.04);
      this.analogIdleOsc3.frequency.setTargetAtTime(Math.max(16, baseFiringFreq * 0.8), now, 0.04);

      // Cam LFO rate tracks rotational speed
      const lfoRate = 3.2 + Math.max(0, (rpm - 700) * 0.0035);
      this.analogIdleLfo.frequency.setTargetAtTime(lfoRate, now, 0.05);

      // Thermal Modulation of Continuous Analog Circuit
      if (temp < 50) {
        // Cold Engine (<50°C): Higher cutoff, rougher uneven lope, metallic solid-lifter valvetrain chatter
        this.analogIdleFilter.frequency.setTargetAtTime(260, now, 0.06);
        this.analogIdleFilter.Q.setTargetAtTime(3.6, now, 0.06);
        this.analogIdlePitchMod.gain.setTargetAtTime(2.6, now, 0.06);
        this.analogColdValveGain.gain.setTargetAtTime(0.20, now, 0.06);
        this.analogIdleNoiseGain.gain.setTargetAtTime(0.40, now, 0.06);
      } else if (temp > 95) {
        // Hot Overheated (>95°C): Deep, heat-soaked, heavy tube saturation, lower muffled lope
        this.analogIdleFilter.frequency.setTargetAtTime(105, now, 0.06);
        this.analogIdleFilter.Q.setTargetAtTime(3.2, now, 0.06);
        this.analogIdlePitchMod.gain.setTargetAtTime(1.8, now, 0.06);
        this.analogColdValveGain.gain.setTargetAtTime(0.0, now, 0.06);
        this.analogIdleNoiseGain.gain.setTargetAtTime(0.26, now, 0.06);
      } else {
        // Warm Optimal (50°C - 95°C): Silky smooth 750 RPM purr, warm 135 Hz analog tube warmth
        this.analogIdleFilter.frequency.setTargetAtTime(135, now, 0.06);
        this.analogIdleFilter.Q.setTargetAtTime(2.5, now, 0.06);
        this.analogIdlePitchMod.gain.setTargetAtTime(1.4, now, 0.06);
        this.analogColdValveGain.gain.setTargetAtTime(0.0, now, 0.06);
        this.analogIdleNoiseGain.gain.setTargetAtTime(0.32, now, 0.06);
      }
    }

    // --- STATE MACHINE (5 km/h IDLE THRESHOLD + COASTING) ---
    if (speed <= 5) {
      this.telemetry.mode = 'IDLE';
    } else if (speed <= 16 && throttle <= 20) {
      this.telemetry.mode = 'COASTING';
    } else if (dTPS > 90 || score >= 0.65 || rpm >= 3400) {
      this.telemetry.mode = 'ATTACK';
    } else if (score >= 0.32 || rpm >= 2400) {
      this.telemetry.mode = 'FLOW';
    } else {
      this.telemetry.mode = 'CHILL';
    }

    // --- AUDIO DSP PARAMETER MAPPING ---
    // 1. Dynamic Tempo (BPM) - Calibrated for Authentic AcceleRacers Midtempo Big Beat
    if (this.telemetry.mode === 'IDLE') {
      if (temp < 50) {
        this.bpm = 96;  // Cold fast idle lope
      } else if (temp > 95) {
        this.bpm = 88;  // Hot overheated thermal rumble
      } else {
        this.bpm = 84;  // Warm optimal 750 RPM purr
      }
    } else if (this.telemetry.mode === 'COASTING') {
      this.bpm = 88 + (speed / 16.0) * 10.0;
    } else if (this.telemetry.mode === 'CHILL') {
      this.bpm = 100;
    } else if (this.telemetry.mode === 'FLOW') {
      this.bpm = 106; // Authentic AcceleRacers Teku-Ising Midtempo Breakbeat tempo!
    } else { // ATTACK
      this.bpm = 114; // Heavy Big Beat sprint (The Prodigy / Chemical Brothers style)
    }

    // 2. Acid 303 Low-Pass Cutoff & Lead Cutoff
    let targetAcidCutoff = 260;
    let targetLeadCutoff = 2200;

    if (this.telemetry.mode === 'IDLE') {
      targetAcidCutoff = 260; // Muffled warm sub
      targetLeadCutoff = 1200;
    } else if (this.telemetry.mode === 'COASTING') {
      const coastRatio = Math.max(0, (speed - 5) / 11.0);
      targetAcidCutoff = 260 + coastRatio * 500;
      targetLeadCutoff = 1200 + coastRatio * 1000;
    } else if (this.telemetry.mode === 'CHILL') {
      targetAcidCutoff = 260 + normRPM * 650;
      targetLeadCutoff = 1800 + normRPM * 1400;
    } else if (this.telemetry.mode === 'FLOW') {
      targetAcidCutoff = 900 + normRPM * 2400;
      targetLeadCutoff = 3200 + normRPM * 2800;
    } else { // ATTACK
      targetAcidCutoff = 3200 + normRPM * 4300;
      targetLeadCutoff = 5800 + normRPM * 3800;
    }

    this.currentAcidCutoff = targetAcidCutoff;

    if (this.acidFilter && this.ctx) {
      this.acidFilter.frequency.setTargetAtTime(targetAcidCutoff, this.ctx.currentTime, 0.035);
      const targetQ = 8 + normTPS * 10;
      this.acidFilter.Q.setTargetAtTime(targetQ, this.ctx.currentTime, 0.05);
    }

    if (this.leadFilter && this.ctx) {
      this.leadFilter.frequency.setTargetAtTime(targetLeadCutoff, this.ctx.currentTime, 0.04);
    }

    // Dynamic delay times synced to BPM
    if (this.delayLeft && this.delayRight && this.ctx) {
      const dotted8th = (60.0 / this.bpm) * 0.75;
      const eighth = (60.0 / this.bpm) * 0.50;
      this.delayLeft.delayTime.setTargetAtTime(dotted8th, this.ctx.currentTime, 0.1);
      this.delayRight.delayTime.setTargetAtTime(eighth, this.ctx.currentTime, 0.1);
    }

    // 3. Stereo Panner (Clio 0.35G = 100% Pan)
    if (this.panner && this.ctx) {
      const pan = Math.max(-1, Math.min(1, lateralG / this.CLIO.MAX_LATERAL_G));
      this.panner.pan.setTargetAtTime(pan, this.ctx.currentTime, 0.06);
    }

    // 4. 16V Cam Screamer (>3,000 RPM) Instrument Activation
    if (this.screamerGain && this.screamerFilter && this.ctx) {
      if (rpm >= 3000) {
        this.screamerActive = true;
        const screamerIntensity = Math.min(1.0, (rpm - 3000) / 1000.0);
        const gainVal = 0.65 + screamerIntensity * 0.45;
        this.screamerGain.gain.setTargetAtTime(gainVal, this.ctx.currentTime, 0.04);

        // Filter sweeps up from 1800 Hz to 8200 Hz
        this.screamerCutoff = 1800 + screamerIntensity * 6400;
        this.screamerFilter.frequency.setTargetAtTime(this.screamerCutoff, this.ctx.currentTime, 0.04);
      } else {
        this.screamerActive = false;
        this.screamerCutoff = 1800;
        this.screamerGain.gain.setTargetAtTime(0.0, this.ctx.currentTime, 0.05);
      }
    }

    // 5. Automotive Throttle SFX (Turbo BOV on lift-off & Nitrox on stomp)
    if (dTPS < -45 && this.lastThrottle > 35 && speed > 20) {
      if (!this.lastBovTime || (now - this.lastBovTime > 1200)) {
        this.triggerTurboBOV();
        this.lastBovTime = now;
        if (typeof log === 'function') log('>>> TURBO BOV FLUTTER (Throttle Lift-Off!) <<<');
      }
    }

    if (dTPS > 110 && throttle > 70) {
      if (!this.lastNitroxTime || (now - this.lastNitroxTime > 2000)) {
        this.triggerNitroxPurge();
        this.lastNitroxTime = now;
        if (typeof log === 'function') log('>>> NITROX 3 BOOST PURGE! <<<');
      }
    }
  }

  triggerShiftFlair() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Layer 1: DJ Vinyl Baby Scratch (Shirako Takamoto signature!)
    this.triggerDJScratch('baby_scratch', now);

    // Layer 2: White noise sweep + mechanical shift clunk
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.18);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3200, now);
    filter.frequency.exponentialRampToValueAtTime(500, now + 0.16);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
    noise.stop(now + 0.20);

    if (this.onShiftDetected) this.onShiftDetected();
  }

  // --- SEQUENCER SCHEDULER ---
  scheduler() {
    if (!this.isRunning) return;

    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadSec) {
      this.scheduleStep(this.currentStep, this.bar, this.nextNoteTime);
      this.advanceStep();
    }

    this.timerID = setTimeout(() => this.scheduler(), this.lookaheadMs);
  }

  advanceStep() {
    const secondsPerBeat = 60.0 / this.bpm;
    const secondsPer16th = secondsPerBeat / 4.0;
    this.nextNoteTime += secondsPer16th;

    this.currentStep++;
    if (this.currentStep >= this.stepCount) {
      this.currentStep = 0;
      this.bar++;
      if (this.bar > 8) {
        this.bar = 1;

        // Auto-cycle motif after completing 8 bars if set to 'auto'
        if (this.activeMotifKey === 'auto') {
          this.autoCycleIndex = (this.autoCycleIndex + 1) % this.autoCycleOrder.length;
          this.currentMotifId = this.autoCycleOrder[this.autoCycleIndex];
        }
      }

      // Update Current Chord in 8-Bar Cycle:
      // Bars 1-2: Dm | Bars 3-4: Bb | Bars 5-6: C | Bars 7-8: Am
      const chordIdx = Math.floor((this.bar - 1) / 2);
      this.currentChord = this.chords[chordIdx];

      // Mutate generative turnaround fills on Bar 4 and Bar 8
      if (this.bar === 4) {
        this.mutateTurnaroundBar4();
      } else if (this.bar === 8) {
        this.mutateTurnaroundBar8();
      }
    }
  }

  scheduleStep(step, bar, time) {
    const mode = this.telemetry.mode;
    const speed = this.telemetry.speed;
    const motif = this.motifs[this.currentMotifId] || this.motifs.shirako;

    // Pick phrase for Bass & Lead (A-A-B-C Structure)
    let bassStep, leadStep;
    if (bar === 4 && step >= 12 && this.turnaroundBass) {
      bassStep = this.turnaroundBass[step - 12];
      leadStep = this.turnaroundLead[step - 12];
    } else if (bar === 8 && step >= 8 && this.turnaroundClimaxBass) {
      bassStep = this.turnaroundClimaxBass[step - 8];
      leadStep = this.turnaroundClimaxLead[step - 8];
    } else if (bar === 3 || bar === 7) {
      bassStep = motif.bassB[step];
      leadStep = motif.leadB[step];
    } else { // Bars 1, 2, 5, 6
      bassStep = motif.bassA[step];
      leadStep = motif.leadA[step];
    }

    // ==========================================
    // 1. CONTINUOUS ANALOG IDLE ENGINE (True Organic Hardware Generator)
    // ==========================================
    // The continuous analog engine circuit (analogIdleOsc1/2/3, analogIdleLfo, analogIdleNoiseNode,
    // analogIdleFilter, analogIdleDrive, analogColdValveGain) runs unbroken through this.idleGain.
    // It generates authentic, continuous physical 4-cylinder combustion rumble, crankshaft harmonics,
    // and cam lope flutter without discrete 16th-note ticks or synthetic pads.
    if (speed <= 18) {
      const temp = this.telemetry.temp !== undefined ? this.telemetry.temp : 88;

      if (temp < 50) {
        // --- A. COLD START / FAST IDLE (<50°C) ---
        // High valvetrain clatter is continuously synthesized via analogColdValveGain (3.2 kHz bandpass).
        // On downbeats, add subtle mechanical valve-tappet impulses:
        if (step % 4 === 0) {
          this.triggerColdValveChatter(time, true);
        }
      } else if (temp > 95) {
        // --- B. HOT OVERHEATED IDLE (>95°C) ---
        // The continuous analog circuit drives heavy asymmetric tube saturation (drive factor 5.2).
        // Unburnt fuel detonations and glowing header thermal contraction pops ("crack-pop!") fire irregularly:
        if ((step === 3 || step === 11) && Math.random() > 0.45) {
          this.triggerHotHeaderCrackle(time);
        }
      } else {
        // --- C. WARM OPTIMAL PURR (50°C - 95°C) ---
        // 100% continuous analog engine thrum at 750 RPM. No metronome ticks, no synth kicks, no acid blips.
        // Pure uninterrupted mechanical purr.
      }
    }

    // ==========================================
    // 2. RAW BASSLINE DOMINANT DRIVING ENGINE (> 5 km/h)
    // ==========================================
    if (speed > 5) {
      const bassRoot = this.currentChord.root;
      const bassMidi = bassRoot + (bassStep.oct * 12) + (bassStep.deg || 0);
      const bassFreq = 440 * Math.pow(2, (bassMidi - 69) / 12);

      const leadTonic = 38 + 24; // D4 base
      const leadMidi = leadTonic + (leadStep.oct * 12) + (leadStep.deg || 0);
      const leadFreq = 440 * Math.pow(2, (leadMidi - 69) / 12);

      // --- VOICE 1: Dedicated Raw Solid Rolling Sub/Mid Bass (Centerpiece!) ---
      if (!bassStep.rest) {
        let bassDur = bassStep.accent ? 0.24 : 0.15;
        let bassVel = bassStep.accent ? 0.90 : 0.65;
        if (mode === 'CHILL' || mode === 'COASTING') {
          bassVel *= 0.85;
        } else if (mode === 'ATTACK') {
          bassVel = Math.min(1.2, bassVel * 1.35);
        }
        this.triggerRollingBass(bassFreq, time, bassDur, bassVel, bassStep.accent, bassStep.slide);
      }

      // --- VOICE 2: Authentic TB-303 Acid Bassline (Accents & Slides Only) ---
      // In authentic Teku Big Beat, the 303 only squelches on key syncopated accents & slides, leaving room for sub-bass!
      if (!bassStep.rest && (bassStep.accent || bassStep.slide)) {
        let acidDur = bassStep.slide ? 0.28 : 0.14;
        let acidVel = bassStep.accent ? 0.48 : 0.30;
        const acidFreq = 440 * Math.pow(2, (bassMidi - 69) / 12);
        this.trigger303Note(acidFreq, time, acidDur, acidVel, bassStep.accent, bassStep.slide);
      }

      // --- VOICE 3: Melodic synth leads MUTED to eliminate "Geometry Dash" arcade feel! ---
      // Real Teku music is pure Big Beat, turntable scratches, and raw sub-bass weight.
      // In ATTACK mode only, fires a dark filtered industrial rave stab on Bar 1 & Bar 5 downbeat.
      if (mode === 'ATTACK' && step === 0 && (bar === 1 || bar === 5)) {
        this.triggerIndustrialStab(time, leadTonic);
      }

      // --- VOICE 4: DEDICATED TEKU 16V CAM SCREAMER (>3,000 RPM) ---
      // Above 3,000 RPM: NO video game chiptune melodies!
      // Fires an acoustic 16V intake resonance roar on downbeats, and authentic Shirako DJ Turntable scratches!
      if (this.telemetry.rpm >= 3000) {
        if (step === 0 || step === 8) {
          const firingFreq = (this.telemetry.rpm / 60) * 2; // Clio 1.2 4-cylinder firing fundamental (100 - 135 Hz)
          this.trigger16VInductionRoar(firingFreq, time);
        } else if (step === 12 && (bar % 2 === 0)) {
          // Shirako cuts live vinyl on the backbeat!
          this.triggerDJScratch('baby_scratch', time);
        }
      }
    }

    // ==========================================
    // 3. PROCEDURAL BREAKBEAT DRUMS (> 5 km/h)
    // ==========================================
    if (speed > 5) {
      const isFillBar = (bar === 4 || bar === 8);

      // Kick & Snare Groove: Halogen 4-on-the-floor Warehouse Techno vs. Teku Breakbeat Syncopation
      const isHalogen = (this.currentMotifId === 'halogen');

      if (isHalogen) {
        // Warehouse Techno: Solid 4-on-the-floor kick (Steps 0, 4, 8, 12)
        if (step % 4 === 0) {
          this.triggerKick(time);
        } else if (mode === 'ATTACK' && (step === 2 || step === 10 || step === 14)) {
          this.triggerKick(time); // Driving double kick
        }

        // Snare / Clap: Crisp offbeat on 4, 12
        if (step === 4 || step === 12) {
          this.triggerSnare(time, 0.95);
        } else if (isFillBar && step >= 12 && mode !== 'COASTING') {
          this.triggerSnare(time, 0.70);
        }
      } else {
        // Teku Breakbeat Syncopation (Steps 0, 6, 10)
        if (step === 0 || step === 6 || step === 10) {
          this.triggerKick(time);
        } else if (mode === 'ATTACK' && (step === 2 || step === 14)) {
          this.triggerKick(time); // Driving double-kick
        }

        // Snare: Backbeat on 4, 12
        if (step === 4 || step === 12) {
          this.triggerSnare(time, 1.0);
        } else if (isFillBar && step >= 12 && mode !== 'COASTING') {
          // Turnaround snare fill
          this.triggerSnare(time, 0.65);
        }
      }

      // Hi-Hats: 16th rolling breakbeat
      if (step % 2 === 0 || mode === 'ATTACK') {
        const accent = (step % 4 === 2);
        this.triggerHiHat(time, accent);
      }

      // Crash cymbal on Bar 1, Step 0
      if (bar === 1 && step === 0 && mode !== 'CHILL' && mode !== 'COASTING') {
        this.triggerCrash(time);
      }
    }
  }

  // --- SOUND SYNTHESIS METHODS ---

  triggerRollingBass(freq, time, duration, vel, isAccent = false, hasSlide = false) {
    // Lock fundamental into physical subwoofer territory (38 - 75 Hz)
    let subFreq = freq;
    while (subFreq > 80) subFreq /= 2;

    const subOsc = this.ctx.createOscillator();
    const midOsc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Portamento / Slide support
    if (hasSlide && this.lastBassFreq) {
      subOsc.frequency.setValueAtTime(this.lastBassFreq, time);
      subOsc.frequency.exponentialRampToValueAtTime(subFreq, time + 0.055);
      midOsc.frequency.setValueAtTime(this.lastBassFreq * 2.0, time);
      midOsc.frequency.exponentialRampToValueAtTime(subFreq * 2.0, time + 0.055);
    } else {
      // Pure Sub-Bass Sine (Deep chassis rumble with pitch snap)
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(subFreq * 1.4, time);
      subOsc.frequency.exponentialRampToValueAtTime(subFreq, time + 0.025);

      // Raw Mid Harmonic (Sawtooth for gritty TEKU-ISING tube bite)
      midOsc.type = (this.currentMotifId === 'anthem' || this.currentMotifId === 'teku' || this.currentMotifId === 'halogen') ? 'sawtooth' : 'triangle';
      midOsc.frequency.setValueAtTime(subFreq * 2.0, time);
      midOsc.frequency.exponentialRampToValueAtTime(subFreq, time + 0.035);
    }
    this.lastBassFreq = subFreq;

    // "Pata de Bass" Punch Slap (Fast pitch-decay transient layer locking with kick)
    const isPata = (this.currentMotifId === 'anthem' || this.currentMotifId === 'teku');
    if (isPata || isAccent) {
      const punchOsc = this.ctx.createOscillator();
      const punchGain = this.ctx.createGain();
      punchOsc.type = 'sine';
      punchOsc.frequency.setValueAtTime(subFreq * 3.8, time);
      punchOsc.frequency.exponentialRampToValueAtTime(subFreq, time + 0.028);

      const punchVol = isAccent ? vel * 1.45 : vel * 1.05;
      punchGain.gain.setValueAtTime(0, time);
      punchGain.gain.linearRampToValueAtTime(punchVol * 0.75, time + 0.003);
      punchGain.gain.exponentialRampToValueAtTime(0.001, time + 0.045);

      punchOsc.connect(punchGain);
      punchGain.connect(this.bassFilter);
      punchOsc.start(time);
      punchOsc.stop(time + 0.055);
    }

    // Heavy raw bass gain driving into asymmetric tube overdrive
    const targetGain = isAccent ? vel * 1.55 : vel * 1.35;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(targetGain, time + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    subOsc.connect(gain);
    midOsc.connect(gain);
    gain.connect(this.bassFilter);

    subOsc.start(time);
    midOsc.start(time);
    subOsc.stop(time + duration + 0.02);
    midOsc.stop(time + duration + 0.02);
  }


  trigger303Note(freq, time, duration, vel, isAccent = false, hasSlide = false) {
    const osc = this.ctx.createOscillator();
    const noteFilter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';

    // Portamento / Slide
    if (hasSlide && this.last303Freq) {
      osc.frequency.setValueAtTime(this.last303Freq, time);
      osc.frequency.exponentialRampToValueAtTime(freq, time + 0.065);
    } else {
      osc.frequency.setValueAtTime(freq, time);
    }
    this.last303Freq = freq;

    // Snappy per-note Filter Envelope ("Acid Bite")
    noteFilter.type = 'lowpass';
    const baseCutoff = this.currentAcidCutoff || 300;
    const spike = isAccent ? 2600 : 900;
    const peakCutoff = Math.min(12000, baseCutoff + spike);
    const decayTime = isAccent ? 0.16 : 0.08;

    noteFilter.frequency.setValueAtTime(peakCutoff, time);
    noteFilter.frequency.exponentialRampToValueAtTime(baseCutoff, time + decayTime);
    noteFilter.Q.setValueAtTime(isAccent ? 12 : 6, time);

    // Gain envelope
    const gainVel = isAccent ? vel * 1.3 : vel;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(gainVel, time + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(noteFilter);
    noteFilter.connect(gain);
    gain.connect(this.acidFilter);

    osc.start(time);
    osc.stop(time + duration + 0.02);
  }

  triggerTekuLead(freq, time, duration, vel, isAccent = false, isPluck = false) {
    // 3 Detuned Oscillators (Supersaw / Cyber Trance Lead)
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const osc3 = this.ctx.createOscillator();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc3.type = isPluck ? 'square' : 'sawtooth';

    osc1.frequency.setValueAtTime(freq, time);
    osc2.frequency.setValueAtTime(freq * Math.pow(2, -12 / 1200), time); // -12 cents
    osc3.frequency.setValueAtTime(freq * Math.pow(2, 12 / 1200), time);  // +12 cents

    const voiceFilter = this.ctx.createBiquadFilter();
    voiceFilter.type = 'lowpass';
    const startCutoff = isAccent ? 7500 : (isPluck ? 4200 : 5500);
    const endCutoff = isPluck ? 800 : 2000;
    voiceFilter.frequency.setValueAtTime(startCutoff, time);
    voiceFilter.frequency.exponentialRampToValueAtTime(endCutoff, time + duration);
    voiceFilter.Q.setValueAtTime(isPluck ? 6.0 : 3.0, time);

    const voiceGain = this.ctx.createGain();
    const targetVel = isAccent ? vel * 1.25 : vel;
    voiceGain.gain.setValueAtTime(0, time);
    voiceGain.gain.linearRampToValueAtTime(targetVel * 0.33, time + 0.006); // scaled for 3 oscs
    voiceGain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc1.connect(voiceFilter);
    osc2.connect(voiceFilter);
    osc3.connect(voiceFilter);
    voiceFilter.connect(voiceGain);

    // Direct Lead Bus
    voiceGain.connect(this.leadFilter);

    // Send to Stereo Ping-Pong Delay
    if (this.delayLeft) {
      const delaySend = this.ctx.createGain();
      delaySend.gain.setValueAtTime(isPluck ? 0.45 : 0.35, time);
      voiceGain.connect(delaySend);
      delaySend.connect(this.delayLeft);
    }

    osc1.start(time);
    osc2.start(time);
    osc3.start(time);
    osc1.stop(time + duration + 0.02);
    osc2.stop(time + duration + 0.02);
    osc3.stop(time + duration + 0.02);
  }

  triggerTekuPluck(freq, time) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2600, time);
    filter.Q.setValueAtTime(5, time);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.18, time + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.idleGain);

    // Send to delay
    if (this.delayLeft) {
      const send = this.ctx.createGain();
      send.gain.setValueAtTime(0.5, time);
      gain.connect(send);
      send.connect(this.delayLeft);
    }

    osc.start(time);
    osc.stop(time + 0.3);
  }

  triggerArpNote(freq, time, vel = 0.15) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(vel, time + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);

    osc.connect(gain);
    gain.connect(this.leadFilter);

    osc.start(time);
    osc.stop(time + 0.1);
  }

  // --- DISTINCT MECHANICAL IDLE SOUND GENERATORS (Temperature Reactive) ---

  triggerColdCamChug(time, isDownbeat = false) {
    // Uneven cold cam lope: 78 Hz -> 44 Hz pitch punch with sharp bite & high oil drag
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    const startFreq = isDownbeat ? 84 : 70;
    const endFreq = isDownbeat ? 48 : 42;
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.08);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, time);
    filter.frequency.exponentialRampToValueAtTime(140, time + 0.1);
    filter.Q.setValueAtTime(4.0, time);

    const vol = isDownbeat ? 0.40 : 0.28;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(vol, time + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.idleGain);

    osc.start(time);
    osc.stop(time + 0.16);
  }

  triggerColdValveChatter(time, isAccent = false) {
    // 3,400 Hz metallic solid lifter / tappet clatter (unexpanded cold valvetrain)
    const dur = isAccent ? 0.022 : 0.015;
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isAccent ? 3400 : 3800, time);
    filter.Q.setValueAtTime(8.5, time); // tight resonant metallic ping

    const gain = this.ctx.createGain();
    const vol = isAccent ? 0.18 : 0.10;
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.idleGain);

    noise.start(time);
    noise.stop(time + dur + 0.005);
  }

  triggerWarmExhaustPurr(time) {
    // Optimal operating temperature (88°C): Deep 750 RPM purr, warm 48 Hz chassis pulse
    const subOsc = this.ctx.createOscillator();
    const harmOsc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(48, time);
    subOsc.frequency.exponentialRampToValueAtTime(36, time + 0.18);

    harmOsc.type = 'triangle';
    harmOsc.frequency.setValueAtTime(96, time);
    harmOsc.frequency.exponentialRampToValueAtTime(72, time + 0.18);

    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    subOsc.connect(gain);
    harmOsc.connect(gain);
    gain.connect(this.idleGain);

    subOsc.start(time);
    harmOsc.start(time);
    subOsc.stop(time + 0.24);
    harmOsc.stop(time + 0.24);
  }

  triggerDistortedHotExhaust(time) {
    // Overheated engine (> 95°C): Heavily saturated 44 Hz sub-drone + distorted exhaust burble
    const osc = this.ctx.createOscillator();
    const subOsc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(56, time);
    osc.frequency.exponentialRampToValueAtTime(36, time + 0.22);

    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(38, time);
    subOsc.frequency.exponentialRampToValueAtTime(28, time + 0.22);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280, time);
    filter.frequency.exponentialRampToValueAtTime(140, time + 0.2);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.44, time + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.26);

    osc.connect(filter);
    subOsc.connect(filter);
    filter.connect(gain);
    gain.connect(this.hotCrackleDistortion);

    osc.start(time);
    subOsc.start(time);
    osc.stop(time + 0.28);
    subOsc.stop(time + 0.28);
  }

  triggerHotHeaderCrackle(time) {
    // Overheated engine (> 95°C): Glowing stainless header expansion clicks & unburnt fuel pops
    const isBigPop = Math.random() > 0.6;
    const dur = isBigPop ? 0.045 : 0.022;
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.18));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = isBigPop ? 'lowpass' : 'bandpass';
    const centerFreq = isBigPop ? 1600 : (2200 + Math.random() * 2000);
    filter.frequency.setValueAtTime(centerFreq, time);
    filter.Q.setValueAtTime(5.5, time);

    const gain = this.ctx.createGain();
    const vol = isBigPop ? 0.42 : 0.24;
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.hotCrackleFilter);

    noise.start(time);
    noise.stop(time + dur + 0.005);
  }

  triggerIdleTick(time, isDownbeat = false) {
    const temp = this.telemetry.temp !== undefined ? this.telemetry.temp : 88;
    const bufferSize = this.ctx.sampleRate * 0.025;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';

    // Cold valve tick is sharper & louder
    const centerFreq = temp < 50 ? (isDownbeat ? 7500 : 9800) : (isDownbeat ? 6000 : 8500);
    filter.frequency.setValueAtTime(centerFreq, time);
    filter.Q.setValueAtTime(temp < 50 ? 5.5 : 4.0, time);

    const gain = this.ctx.createGain();
    const baseVol = isDownbeat ? 0.12 : 0.06;
    const vol = temp < 50 ? baseVol * 1.6 : baseVol;
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + (temp < 50 ? 0.03 : 0.02));

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.idleGain);

    noise.start(time);
    noise.stop(time + 0.035);
  }

  triggerWhisperingAcid(freq, time) {
    // Muffled, resonant 303 blip purring quietly under the hood
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280, time);
    filter.Q.setValueAtTime(8, time);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.08, time + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.idleGain);

    osc.start(time);
    osc.stop(time + 0.13);
  }

  triggerSubDrone(time, rootMidi) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const freq = 440 * Math.pow(2, (rootMidi - 69) / 12);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.3, time + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.9);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.95);
  }

  triggerKick(time) {
    // Sian & i_o Heavy Warehouse Techno Kick: 185 Hz -> 42 Hz with click transient
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(185, time);
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.038);

    gain.gain.setValueAtTime(1.15, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.32);

    // Sidechain Ducking Pump: Duck the raw bass bus momentarily on kick impact (TEKU-ISING kick-lock)
    if (this.bassGain && this.bassGain.gain) {
      this.bassGain.gain.cancelScheduledValues(time);
      this.bassGain.gain.setValueAtTime(0.95, time);
      this.bassGain.gain.setValueAtTime(0.12, time + 0.004);
      this.bassGain.gain.exponentialRampToValueAtTime(0.95, time + 0.065);
    }

    // Click transient for punch
    const clickSize = Math.floor(this.ctx.sampleRate * 0.008);
    const clickBuffer = this.ctx.createBuffer(1, clickSize, this.ctx.sampleRate);
    const clickData = clickBuffer.getChannelData(0);
    for (let i = 0; i < clickSize; i++) clickData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (clickSize * 0.3));

    const clickNode = this.ctx.createBufferSource();
    clickNode.buffer = clickBuffer;
    const clickGain = this.ctx.createGain();
    clickGain.gain.setValueAtTime(0.4, time);

    clickNode.connect(clickGain);
    clickGain.connect(this.drumFilter);

    osc.connect(gain);
    gain.connect(this.drumFilter);

    clickNode.start(time);
    osc.start(time);
    osc.stop(time + 0.34);
  }

  triggerSnare(time, vel = 1.0) {
    // Tone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.frequency.setValueAtTime(220, time);
    osc.frequency.exponentialRampToValueAtTime(120, time + 0.05);

    oscGain.gain.setValueAtTime(0.4 * vel, time);
    oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.12);

    osc.connect(oscGain);
    oscGain.connect(this.drumFilter);
    osc.start(time);
    osc.stop(time + 0.15);

    // Noise Snap
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(800, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.6 * vel, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.drumFilter);

    noise.start(time);
    noise.stop(time + 0.16);
  }

  triggerHiHat(time, accent = false) {
    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7500, time);

    const gain = this.ctx.createGain();
    const hatVol = accent ? 0.32 : 0.16;
    gain.gain.setValueAtTime(hatVol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + (accent ? 0.07 : 0.035));

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.drumFilter);

    noise.start(time);
    noise.stop(time + 0.08);
  }

  triggerCrash(time) {
    const bufferSize = this.ctx.sampleRate * 0.8;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(4500, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.75);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.drumFilter);

    noise.start(time);
    noise.stop(time + 0.8);
  }

  // ==========================================
  // TEKU 16V INTAKE INDUCTION ROAR (>3,000 RPM)
  // ==========================================
  trigger16VInductionRoar(firingFreq, time) {
    if (!this.ctx || this.telemetry.rpm < 3000) return;

    // Firing fundamental of 4-cylinder 1.2L engine (100 Hz @ 3,000 RPM, 133 Hz @ 4,000 RPM)
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const osc3 = this.ctx.createOscillator();
    const roarFilter = this.ctx.createBiquadFilter();
    const roarGain = this.ctx.createGain();

    // 1st harmonic (engine firing fundamental) + 2nd & 3rd intake resonance harmonics
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(firingFreq, time);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(firingFreq * 2.0, time);

    osc3.type = 'sawtooth';
    osc3.frequency.setValueAtTime(firingFreq * 3.0, time);

    // Resonant acoustic intake formant (peaks around 1200 - 2800 Hz)
    roarFilter.type = 'bandpass';
    const rpmRatio = Math.max(0, Math.min(1, (this.telemetry.rpm - 3000) / 1200.0));
    const formantCutoff = 1200 + rpmRatio * 1600;
    roarFilter.frequency.setValueAtTime(formantCutoff, time);
    roarFilter.Q.setValueAtTime(4.5, time);

    const vel = 0.35 + rpmRatio * 0.35;
    roarGain.gain.setValueAtTime(0, time);
    roarGain.gain.linearRampToValueAtTime(vel, time + 0.015);
    roarGain.gain.exponentialRampToValueAtTime(0.001, time + 0.30);

    osc1.connect(roarFilter);
    osc2.connect(roarFilter);
    osc3.connect(roarFilter);
    roarFilter.connect(roarGain);
    // Route directly into bass distortion overdrive!
    roarGain.connect(this.bassDistortion);

    osc1.start(time);
    osc2.start(time);
    osc3.start(time);
    osc1.stop(time + 0.32);
    osc2.stop(time + 0.32);
    osc3.stop(time + 0.32);
  }

  triggerIndustrialStab(time, rootMidi) {
    // Dark, menacing Big Beat / 90s Prodigy rave stab (filtered fifth chord hit)
    const rootFreq = 440 * Math.pow(2, (rootMidi - 69) / 12);
    const fifthFreq = rootFreq * 1.4983;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(rootFreq, time);
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(fifthFreq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, time);
    filter.frequency.exponentialRampToValueAtTime(400, time + 0.22);
    filter.Q.setValueAtTime(5.0, time);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.40, time + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.leadFilter);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.26);
    osc2.stop(time + 0.26);
  }

  // ==========================================
  // SHIRAKO TAKAMOTO DJ TURNTABLISM & SCRATCHES
  // ==========================================
  triggerDJScratch(type = 'baby_scratch', time = null) {
    if (!this.ctx) return;
    const t = time || this.ctx.currentTime;

    if (type === 'baby_scratch') {
      // Forward scratch (chirp up) + Backward scratch (chirp down)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Bandpass formant filter for needle-on-vinyl friction drag
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, t);
      filter.Q.setValueAtTime(3.5, t);

      // Forward scrub (350 Hz -> 1450 Hz)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(350, t);
      osc.frequency.exponentialRampToValueAtTime(1450, t + 0.045);
      // Backward scrub (1450 Hz -> 420 Hz)
      osc.frequency.exponentialRampToValueAtTime(420, t + 0.10);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.55, t + 0.015);
      gain.gain.setValueAtTime(0.35, t + 0.045);
      gain.gain.linearRampToValueAtTime(0.50, t + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

      // Vinyl surface crackle layer
      const noiseLen = Math.floor(this.ctx.sampleRate * 0.11);
      const noiseBuf = this.ctx.createBuffer(1, noiseLen, this.ctx.sampleRate);
      const noiseData = noiseBuf.getChannelData(0);
      for (let i = 0; i < noiseLen; i++) {
        noiseData[i] = (Math.random() * 2 - 1) * (0.2 + 0.8 * Math.random());
      }
      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = noiseBuf;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.25, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

      osc.connect(filter);
      noiseNode.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      noiseNode.start(t);
      osc.stop(t + 0.12);
      noiseNode.stop(t + 0.12);
    } else if (type === 'spinback') {
      // Classic DJ Spinback (fast vinyl rewind)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(4500, t);
      filter.frequency.exponentialRampToValueAtTime(400, t + 0.45);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(3200, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.45);

      gain.gain.setValueAtTime(0.65, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.48);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      gain.connect(this.delayLeft); // Echo the spinback!

      osc.start(t);
      osc.stop(t + 0.50);
    } else if (type === 'chirp') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, t);
      osc.frequency.exponentialRampToValueAtTime(600, t + 0.04);
      gain.gain.setValueAtTime(0.7, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.05);
    }
  }

  // ==========================================
  // BASSLINE WEAPONIZED SUBWOOFER SONIC CANNON
  // ==========================================
  triggerSonicCannon(time = null) {
    if (!this.ctx) return;
    const t = time || this.ctx.currentTime;

    // Phase 1: Seismic Sub-Frequency Sweep (62 Hz -> 22 Hz shockwave)
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(62, t);
    subOsc.frequency.exponentialRampToValueAtTime(22, t + 0.7);

    subGain.gain.setValueAtTime(1.35, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);

    subOsc.connect(subGain);
    subGain.connect(this.subBoost);

    // Phase 2: Distorted Sub-Harmonic Overdrive (Square wave + tube saturation)
    const squareOsc = this.ctx.createOscillator();
    const squareGain = this.ctx.createGain();
    const squareFilter = this.ctx.createBiquadFilter();

    squareFilter.type = 'lowpass';
    squareFilter.frequency.setValueAtTime(120, t);
    squareFilter.frequency.exponentialRampToValueAtTime(30, t + 0.5);

    squareOsc.type = 'square';
    squareOsc.frequency.setValueAtTime(31, t);
    squareOsc.frequency.exponentialRampToValueAtTime(15, t + 0.5);

    squareGain.gain.setValueAtTime(0.8, t);
    squareGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    squareOsc.connect(squareFilter);
    squareFilter.connect(squareGain);
    squareGain.connect(this.tubeSaturator);

    // Phase 3: Pressure Dispersion Noise Burst ("WHUUMPH")
    const blastLen = Math.floor(this.ctx.sampleRate * 0.4);
    const blastBuf = this.ctx.createBuffer(1, blastLen, this.ctx.sampleRate);
    const blastData = blastBuf.getChannelData(0);
    for (let i = 0; i < blastLen; i++) blastData[i] = Math.random() * 2 - 1;

    const blastNode = this.ctx.createBufferSource();
    blastNode.buffer = blastBuf;

    const blastFilter = this.ctx.createBiquadFilter();
    blastFilter.type = 'lowpass';
    blastFilter.frequency.setValueAtTime(90, t);
    blastFilter.frequency.exponentialRampToValueAtTime(25, t + 0.35);

    const blastGain = this.ctx.createGain();
    blastGain.gain.setValueAtTime(0.9, t);
    blastGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    blastNode.connect(blastFilter);
    blastFilter.connect(blastGain);
    blastGain.connect(this.masterGain);

    subOsc.start(t);
    squareOsc.start(t);
    blastNode.start(t);

    subOsc.stop(t + 0.9);
    squareOsc.stop(t + 0.65);
    blastNode.stop(t + 0.45);
  }

  // ==========================================
  // TURBO BLOW-OFF VALVE (BOV) & NITROX 3 PURGE
  // ==========================================
  triggerTurboBOV(time = null) {
    if (!this.ctx) return;
    const t = time || this.ctx.currentTime;

    const duration = 0.35;
    const bufSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufSize; i++) {
      const timeSec = i / this.ctx.sampleRate;
      const flutter = 0.5 + 0.5 * Math.sin(2 * Math.PI * 18 * timeSec);
      const env = Math.exp(-timeSec * 8);
      data[i] = (Math.random() * 2 - 1) * flutter * env;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(5200, t);
    filter.frequency.exponentialRampToValueAtTime(2800, t + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    gain.connect(this.delayRight); // Echo the BOV in right channel

    noise.start(t);
    noise.stop(t + duration + 0.02);
  }

  triggerNitroxPurge(time = null) {
    if (!this.ctx) return;
    const t = time || this.ctx.currentTime;

    const dur = 0.45;
    const bufSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(4200, t);
    filter.frequency.exponentialRampToValueAtTime(1400, t + dur);
    filter.Q.setValueAtTime(2.0, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.85, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(t);
    noise.stop(t + dur + 0.02);
  }

  // ==========================================
  // ACOUSTIC PERSPECTIVE: ARENA VS HEADPHONES
  // ==========================================
  setAcousticPerspective(mode) {
    this.acousticPerspective = mode;
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    if (mode === 'headphones') {
      if (this.subBoost) {
        this.subBoost.gain.setTargetAtTime(1.5, now, 0.05);
        this.subBoost.frequency.setTargetAtTime(80, now, 0.05);
      }
      if (this.compressor) {
        this.compressor.threshold.setTargetAtTime(-18, now, 0.05);
        this.compressor.ratio.setTargetAtTime(3.0, now, 0.05);
      }
      if (this.chorusOutput) {
        this.chorusOutput.gain.setTargetAtTime(0.25, now, 0.05);
      }
    } else { // 'arena' (Bassline Subwoofer Array)
      if (this.subBoost) {
        this.subBoost.gain.setTargetAtTime(5.5, now, 0.05);
        this.subBoost.frequency.setTargetAtTime(55, now, 0.05);
      }
      if (this.compressor) {
        this.compressor.threshold.setTargetAtTime(-13, now, 0.05);
        this.compressor.ratio.setTargetAtTime(4.5, now, 0.05);
      }
      if (this.chorusOutput) {
        this.chorusOutput.gain.setTargetAtTime(0.50, now, 0.05);
      }
    }
  }
}

// --- UI & TELEMETRY CONTROLLER ---

const engine = new TekuAudioEngine();

const btnAudio = document.getElementById('btn-audio');
const btnChillShift = document.getElementById('btn-chill-shift');
const btnStomp = document.getElementById('btn-stomp');
const btnReplay = document.getElementById('btn-replay');

const modeBadge = document.getElementById('mode-badge');
const labelModeName = document.getElementById('label-mode-name');
const labelBarCycle = document.getElementById('label-bar-cycle');
const labelChord = document.getElementById('label-chord');
const labelAggScore = document.getElementById('label-agg-score');
const logBox = document.getElementById('log-output');

const sliderRpm = document.getElementById('slider-rpm');
const sliderSpd = document.getElementById('slider-spd');
const sliderTps = document.getElementById('slider-tps');
const sliderG = document.getElementById('slider-g');

const valRpm = document.getElementById('val-rpm');
const valSpd = document.getElementById('val-spd');
const valTps = document.getElementById('val-tps');
const valG = document.getElementById('val-g');

const labelCutoff = document.getElementById('label-cutoff');
const labelTempo = document.getElementById('label-tempo');
const labelDtps = document.getElementById('label-dtps');
const labelPan = document.getElementById('label-pan');
const cardRpm = document.getElementById('card-rpm');

// 16V Cam Screamer & Soundboard DOM Elements
const cardScreamer = document.getElementById('card-screamer');
const screamerBadge = document.getElementById('screamer-status-badge');
const valScreamerCutoff = document.getElementById('val-screamer-cutoff');
const screamerRpmFill = document.getElementById('screamer-rpm-fill');

const btnPerspectiveArena = document.getElementById('btn-perspective-arena');
const btnPerspectiveHeadphones = document.getElementById('btn-perspective-headphones');

// Engine Coolant Temp (ECT) DOM Elements
const cardTemp = document.getElementById('card-temp');
const sliderTemp = document.getElementById('slider-temp');
const valTemp = document.getElementById('val-temp');
const labelThermalState = document.getElementById('label-thermal-state');

const btnSfxScratch = document.getElementById('btn-sfx-scratch');
const btnSfxSpinback = document.getElementById('btn-sfx-spinback');
const btnSfxCannon = document.getElementById('btn-sfx-cannon');
const btnSfxBov = document.getElementById('btn-sfx-bov');
const btnSfxNitrox = document.getElementById('btn-sfx-nitrox');

function log(msg) {
  const line = document.createElement('div');
  line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  logBox.prepend(line);
}

// Visual flash on gear shift
engine.onShiftDetected = () => {
  cardRpm.classList.add('shift-flair');
  setTimeout(() => cardRpm.classList.remove('shift-flair'), 400);
  log('>>> GEAR SHIFT DETECTED! (DJ Baby Scratch fired) <<<');
};

function updateUI() {
  const rpm = parseInt(sliderRpm.value);
  const spd = parseInt(sliderSpd.value);
  const tps = parseInt(sliderTps.value);
  const g = parseFloat(sliderG.value);
  const temp = sliderTemp ? parseInt(sliderTemp.value) : 88;

  valRpm.textContent = rpm;
  valSpd.textContent = spd;
  valTps.textContent = tps;
  valG.textContent = (g >= 0 ? '+' : '') + g.toFixed(2);
  if (valTemp) valTemp.textContent = temp;

  engine.updateTelemetry(rpm, spd, tps, g, temp);

  // Update Dynamic Labels
  labelCutoff.textContent = `${Math.round(engine.acidFilter ? engine.acidFilter.frequency.value : 260)} Hz`;
  labelTempo.textContent = `${Math.round(engine.bpm)} BPM`;
  labelDtps.textContent = `${Math.round(engine.telemetry.dTPS)} %/s`;
  labelAggScore.textContent = engine.telemetry.aggressionScore.toFixed(2);

  // Update 16V Cam Screamer (>3000 RPM) Gauge
  const rpmFillPct = Math.max(0, Math.min(100, ((rpm - 700) / (4200 - 700)) * 100));
  if (screamerRpmFill) screamerRpmFill.style.width = `${rpmFillPct}%`;

  if (cardScreamer && screamerBadge && valScreamerCutoff) {
    if (rpm >= 3000) {
      cardScreamer.classList.add('screaming');
      screamerBadge.className = 'screamer-badge screaming';
      screamerBadge.textContent = 'SCREAMING (16V)';
      valScreamerCutoff.textContent = `${Math.round(engine.screamerCutoff)} Hz`;
    } else {
      cardScreamer.classList.remove('screaming');
      screamerBadge.className = 'screamer-badge dormant';
      screamerBadge.textContent = 'DORMANT (<3K)';
      valScreamerCutoff.textContent = 'OFFLINE';
    }
  }

  // Update Driving Mode Badge
  const mode = engine.telemetry.mode;
  modeBadge.textContent = mode;
  modeBadge.className = 'badge-mode';

  if (mode === 'IDLE') {
    modeBadge.classList.add('idle');
    labelModeName.textContent = 'IDLE (Continuous Analog 4-Cyl Rumble & Lope)';
  } else if (mode === 'COASTING') {
    modeBadge.classList.add('coasting');
    labelModeName.textContent = 'COASTING TO STOP (Gradual Analog Idle Crossfade)';
  } else if (mode === 'CHILL') {
    modeBadge.classList.add('chill');
    labelModeName.textContent = 'CHILL ECO (Raw Rolling Sub-Bassline)';
  } else if (mode === 'FLOW') {
    modeBadge.classList.add('flow');
    labelModeName.textContent = 'FLOW TEKU-ISING (106 BPM Big Beat & Overdrive)';
  } else { // ATTACK
    modeBadge.classList.add('attack');
    labelModeName.textContent = 'TEKU ATTACK! (16V Induction Roar & Vinyl Scratches)';
  }

  // Update Tachometer LED Shift Light Bar (Clio 1.2 calibrated)
  updateShiftLights(rpm);

  // Update Engine Coolant Temp (ECT) State & Idle Timbre
  if (labelThermalState && valTemp) {
    if (temp < 50) {
      valTemp.style.color = '#38bdf8';
      labelThermalState.textContent = 'COLD // FAST IDLE & VALVE CLATTER (<50°C)';
      labelThermalState.style.color = '#38bdf8';
    } else if (temp > 95) {
      valTemp.style.color = '#ff0055';
      labelThermalState.textContent = 'HOT // HEAVY TUBE DISTORTION & HEADER CRACKLE (>95°C)';
      labelThermalState.style.color = '#ff0055';
    } else {
      valTemp.style.color = 'var(--teku-cyan)';
      labelThermalState.textContent = 'WARM // CONTINUOUS ANALOG TUBE PURR (88°C)';
      labelThermalState.style.color = 'var(--teku-cyan)';
    }
  }

  // Panning label
  if (Math.abs(g) < 0.05) {
    labelPan.textContent = 'Center';
  } else if (g < 0) {
    labelPan.textContent = `Hard Left (${Math.round((Math.abs(g) / 0.35) * 100)}%)`;
  } else {
    labelPan.textContent = `Hard Right (${Math.round((g / 0.35) * 100)}%)`;
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

// Sliders Listeners
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
    log('Audio Engine started. Generative 8-bar loop running.');
  } else {
    engine.stop();
    btnAudio.textContent = 'Start Audio Engine';
    btnAudio.classList.remove('active');
    btnAudio.classList.add('primary');
    log('Audio Engine stopped.');
  }
});

// Test Chill Gear-Shift @ 2.4k RPM
btnChillShift.addEventListener('click', () => {
  if (!engine.isRunning) btnAudio.click();
  log('>>> Simulating Chill Driving: Accel to 2,400 RPM then Gear Shift <<<');

  sliderRpm.value = 1600;
  sliderSpd.value = 25;
  sliderTps.value = 35;
  updateUI();

  setTimeout(() => {
    // Revs climb to 2,400 RPM
    sliderRpm.value = 2400;
    sliderSpd.value = 32;
    sliderTps.value = 40;
    updateUI();
  }, 400);

  setTimeout(() => {
    // Lift throttle & clutch in (RPM drops to 1,600)
    sliderTps.value = 5;
    sliderRpm.value = 1600;
    sliderSpd.value = 34; // Speed maintained
    updateUI();
  }, 1000);
});

// Test Throttle Stomp (Attack Mode)
btnStomp.addEventListener('click', () => {
  if (!engine.isRunning) btnAudio.click();
  log('>>> STOMPING ACCELERATOR! (dTPS > 120 %/s) <<<');

  sliderTps.value = 95; // Instant stomp
  sliderRpm.value = 3600;
  sliderSpd.value = 48;
  sliderG.value = 0.28; // Taking a fast corner
  updateUI();

  setTimeout(() => {
    sliderTps.value = 30;
    sliderRpm.value = 2400;
    sliderG.value = 0.0;
    updateUI();
    log('Stomp finished. Returning to Flow mode.');
  }, 2500);
});

// Acoustic Perspective Mode Listeners
if (btnPerspectiveArena && btnPerspectiveHeadphones) {
  btnPerspectiveArena.addEventListener('click', () => {
    btnPerspectiveArena.classList.add('selected');
    btnPerspectiveHeadphones.classList.remove('selected');
    engine.setAcousticPerspective('arena');
    log('[ACOUSTIC PERSPECTIVE] Subwoofer Arena engaged (Bassline array, +5.5dB sub-shelf).');
  });

  btnPerspectiveHeadphones.addEventListener('click', () => {
    btnPerspectiveHeadphones.classList.add('selected');
    btnPerspectiveArena.classList.remove('selected');
    engine.setAcousticPerspective('headphones');
    log('[ACOUSTIC PERSPECTIVE] Shirako DJ Headphones engaged (Crisp 303 squelch & needle scratch detail).');
  });
}

// Shirako Soundboard SFX Listeners
if (btnSfxScratch) {
  btnSfxScratch.addEventListener('click', () => {
    if (!engine.isRunning) btnAudio.click();
    engine.triggerDJScratch('baby_scratch');
    log('>>> [SHIRAKO DECK] DJ Baby Scratch fired! <<<');
  });
}

if (btnSfxSpinback) {
  btnSfxSpinback.addEventListener('click', () => {
    if (!engine.isRunning) btnAudio.click();
    engine.triggerDJScratch('spinback');
    log('>>> [SHIRAKO DECK] Turntable Spinback fired! <<<');
  });
}

if (btnSfxCannon) {
  btnSfxCannon.addEventListener('click', () => {
    if (!engine.isRunning) btnAudio.click();
    engine.triggerSonicCannon();
    log('>>> [BASSLINE] WEAPONIZED SUBWOOFER SONIC CANNON BLAST! <<<');
  });
}

if (btnSfxBov) {
  btnSfxBov.addEventListener('click', () => {
    if (!engine.isRunning) btnAudio.click();
    engine.triggerTurboBOV();
    log('>>> [TEKU TUNER] Turbo BOV Pressure Flutter fired! <<<');
  });
}

if (btnSfxNitrox) {
  btnSfxNitrox.addEventListener('click', () => {
    if (!engine.isRunning) btnAudio.click();
    engine.triggerNitroxPurge();
    log('>>> [NITROX 3] NITROUS PURGE FIRED! <<<');
  });
}

// ==========================================
// EXTENDED 75-SECOND DRIVING REPLAY ENGINE
// ==========================================

const replayHud = document.getElementById('replay-hud');
const replayStageName = document.getElementById('replay-stage-name');
const replayTimeLabel = document.getElementById('replay-time-label');
const replayProgressFill = document.getElementById('replay-progress-fill');

// Keyframes for a realistic 75-second Clio 1.2 driving journey
const tripKeyframes = [
  { t: 0.0,  rpm: 750,  spd: 0,  tps: 13, g: 0.0,   temp: 82, stage: "STAGE 1: RED LIGHT COCKPIT IDLE (Continuous Analog Rumble)" },
  { t: 7.0,  rpm: 750,  spd: 0,  tps: 13, g: 0.0,   temp: 84, stage: "STAGE 1: IDLE ATMOSPHERE (Continuous Analog Engine Purr)" },
  { t: 9.5,  rpm: 1900, spd: 14, tps: 45, g: 0.02,  temp: 85, stage: "STAGE 2: GREEN LIGHT! 1st GEAR LAUNCH" },
  { t: 13.0, rpm: 2450, spd: 22, tps: 52, g: 0.01,  temp: 86, stage: "STAGE 2: CLIMBING TO 2,450 RPM SHIFT POINT" },
  { t: 13.8, rpm: 1550, spd: 24, tps: 8,  g: 0.0,   temp: 86, stage: "STAGE 2: SHIFT TO 2nd GEAR (DJ Scratch Fired!)" },
  { t: 18.0, rpm: 2400, spd: 36, tps: 48, g: -0.03, temp: 87, stage: "STAGE 2: 2nd GEAR ACCELERATION" },
  { t: 19.0, rpm: 1650, spd: 38, tps: 10, g: 0.0,   temp: 87, stage: "STAGE 2: SHIFT TO 3rd GEAR (DJ Scratch Fired!)" },
  { t: 24.0, rpm: 2300, spd: 46, tps: 32, g: 0.0,   temp: 88, stage: "STAGE 3: CHILL BOULEVARD CRUISE (Rolling Sub-Bass)" },
  { t: 28.0, rpm: 2450, spd: 48, tps: 35, g: 0.26,  temp: 88, stage: "STAGE 3: ENTERING ROUNDABOUT (Right Turn)" },
  { t: 33.0, rpm: 2500, spd: 48, tps: 35, g: -0.34, temp: 88, stage: "STAGE 3: ROUNDABOUT APEX (Hard Left Stereo Sweep!)" },
  { t: 37.0, rpm: 2350, spd: 50, tps: 28, g: 0.02,  temp: 88, stage: "STAGE 3: EXITING ROUNDABOUT INTO BOULEVARD" },
  { t: 41.0, rpm: 2500, spd: 54, tps: 40, g: 0.0,   temp: 89, stage: "STAGE 4: APPROACHING ON-RAMP" },
  { t: 43.0, rpm: 3200, spd: 62, tps: 88, g: 0.12,  temp: 91, stage: "STAGE 4: TEKU ATTACK! 16V CAM SCREAMER FIRED (>3,000 RPM)" },
  { t: 48.0, rpm: 3680, spd: 74, tps: 92, g: 0.08,  temp: 94, stage: "STAGE 4: 3,680 RPM PULL! (16V Induction Roar & Heavy Overdrive)" },
  { t: 53.0, rpm: 3400, spd: 76, tps: 60, g: 0.0,   temp: 96, stage: "STAGE 4: HIGHWAY FLOW (Hot Overheated Exhaust Saturated >95°C)" },
  { t: 57.0, rpm: 2400, spd: 65, tps: 18, g: -0.02, temp: 93, stage: "STAGE 5: LIFTING OFF THROTTLE (Turbo BOV Flutter!)" },
  { t: 61.0, rpm: 1800, spd: 40, tps: 8,  g: -0.06, temp: 91, stage: "STAGE 5: MODERATE BRAKING INTO CITY TRAFFIC" },
  { t: 64.0, rpm: 1400, spd: 22, tps: 6,  g: -0.08, temp: 90, stage: "STAGE 5: DECELERATING (Drums Beginning Choke)" },
  { t: 67.0, rpm: 1100, spd: 14, tps: 4,  g: -0.05, temp: 89, stage: "STAGE 5: COASTING DOWN (Smooth Idle Crossfade)" },
  { t: 69.5, rpm: 880,  spd: 7,  tps: 0,  g: -0.02, temp: 88, stage: "STAGE 5: APPROACHING 5 KM/H IDLE ZONE" },
  { t: 72.0, rpm: 750,  spd: 4,  tps: 13, g: 0.0,   temp: 88, stage: "STAGE 6: ROLLING AT 4 KM/H (ANALOG IDLE ENGAGED)" },
  { t: 75.0, rpm: 750,  spd: 0,  tps: 13, g: 0.0,   temp: 88, stage: "STAGE 6: FULL STOP / CONTINUOUS ANALOG IDLE PURR" }
];

let replayInterval = null;
const TOTAL_TRIP_TIME = 75.0; // Seconds

btnReplay.addEventListener('click', () => {
  // If already running, cancel replay
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

  log('>>> LAUNCHING 75-SECOND IMMERSIVE CLIO 1.2 REPLAY <<<');
  btnReplay.textContent = 'Stop Replay (X)';
  btnReplay.classList.add('active');
  replayHud.style.display = 'flex';

  let currentElapsed = 0.0;
  const updateIntervalMs = 100; // 10 updates per second (super smooth!)
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
      log('75-second journey finished. Clio is now idling.');
      return;
    }

    // Find surrounding keyframes for linear interpolation
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

    // Smooth interpolated values
    const curRpm = Math.round(prev.rpm + alpha * (next.rpm - prev.rpm));
    const curSpd = Math.round(prev.spd + alpha * (next.spd - prev.spd));
    const curTps = Math.round(prev.tps + alpha * (next.tps - prev.tps));
    const curG   = +(prev.g + alpha * (next.g - prev.g)).toFixed(2);
    const curTemp = prev.temp !== undefined && next.temp !== undefined
      ? Math.round(prev.temp + alpha * (next.temp - prev.temp))
      : 88;

    sliderRpm.value = curRpm;
    sliderSpd.value = curSpd;
    sliderTps.value = curTps;
    sliderG.value = curG;
    if (sliderTemp) sliderTemp.value = curTemp;
    updateUI();

    // Update Progress HUD
    const pct = Math.min(100, (currentElapsed / TOTAL_TRIP_TIME) * 100);
    replayProgressFill.style.width = `${pct}%`;
    replayTimeLabel.textContent = `${currentElapsed.toFixed(1)}s / ${TOTAL_TRIP_TIME.toFixed(1)}s`;
    replayStageName.textContent = prev.stage;

  }, updateIntervalMs);
});

// TEKU MOTIF SELECTOR CONTROLLER
const labelMotifName = document.getElementById('label-motif-name');
const btnMotifAuto = document.getElementById('btn-motif-auto');
const btnMotifHalogen = document.getElementById('btn-motif-halogen');
const btnMotifShirako = document.getElementById('btn-motif-shirako');
const btnMotifAnthem = document.getElementById('btn-motif-anthem');
const btnMotifMetro = document.getElementById('btn-motif-metro');

const motifButtons = [btnMotifAuto, btnMotifHalogen, btnMotifShirako, btnMotifAnthem, btnMotifMetro];

motifButtons.forEach(btn => {
  if (!btn) return;
  btn.addEventListener('click', () => {
    motifButtons.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    const motifKey = btn.getAttribute('data-motif');
    engine.setMotif(motifKey);
    updateMotifUI();
    const currentMotif = engine.motifs[engine.currentMotifId];
    log(`[TEKU MOTIF] Selected: ${engine.activeMotifKey.toUpperCase()} // ${currentMotif ? currentMotif.name : ''}`);
  });
});

function updateMotifUI() {
  if (!labelMotifName) return;
  const activeKey = engine.activeMotifKey;
  const currentMotif = engine.motifs[engine.currentMotifId];
  if (activeKey === 'auto') {
    const shortName = currentMotif ? currentMotif.name.split('//')[0].trim() : 'SHIRAKO';
    labelMotifName.textContent = `AUTO (${shortName})`;
  } else {
    labelMotifName.textContent = currentMotif ? currentMotif.name : 'SHIRAKO';
  }
}

// Periodic Musical HUD Updates (Bar Cycle, Chords, Active Motif)
setInterval(() => {
  if (!engine.isRunning) return;
  labelBarCycle.textContent = `Bar ${engine.bar} of 8 (Step ${engine.currentStep + 1}/16)`;
  labelChord.textContent = engine.currentChord.name;
  updateMotifUI();
}, 100);

// Visualizer Canvas (Widescreen Dual-Subwoofer Spectrum)
const canvas = document.getElementById('visualizer');
const canvasCtx = canvas.getContext('2d');

function drawVisualizer() {
  requestAnimationFrame(drawVisualizer);

  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  // Deep cyber cockpit background
  canvasCtx.fillStyle = '#010307';
  canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

  const centerY = canvas.height / 2;

  // Center Neon Horizon Grid Line
  canvasCtx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
  canvasCtx.lineWidth = 1;
  canvasCtx.beginPath();
  canvasCtx.moveTo(0, centerY);
  canvasCtx.lineTo(canvas.width, centerY);
  canvasCtx.stroke();

  if (!engine.analyser || !engine.isRunning) {
    // Idle neon grid pulse
    canvasCtx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    canvasCtx.strokeRect(canvas.width / 2 - 60, centerY - 2, 120, 4);
    return;
  }

  const bufferLength = engine.analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  engine.analyser.getByteFrequencyData(dataArray);

  // Responsive Mirrored Dual-Subwoofer Equalizer from Center
  const numBars = Math.min(64, Math.max(32, Math.floor((canvas.width / 2) / 14)));
  const barWidth = (canvas.width / 2) / numBars;

  for (let i = 0; i < numBars; i++) {
    const dataIdx = Math.floor((i / numBars) * bufferLength);
    const val = dataArray[dataIdx] || 0;
    const barHeight = (val / 255.0) * (canvas.height * 0.47);

    // Teku Tri-Color Palette: Electric Cyan -> Teku Orange -> Hot Magenta
    let barColor;
    if (i < numBars * 0.25) {
      barColor = 'rgba(0, 240, 255, 0.9)'; // Deep Bass: Electric Cyan
    } else if (i < numBars * 0.65) {
      barColor = 'rgba(255, 119, 0, 0.9)'; // Mids: Teku Orange
    } else {
      barColor = 'rgba(255, 0, 119, 0.95)'; // Treble / Squelch: Hot Magenta
    }

    canvasCtx.fillStyle = barColor;
    canvasCtx.shadowColor = barColor;
    canvasCtx.shadowBlur = 6;

    // Right Side Bar (Top & Bottom Mirrored)
    const rightX = (canvas.width / 2) + (i * barWidth);
    canvasCtx.fillRect(rightX + 1, centerY - barHeight, barWidth - 2, barHeight * 2);

    // Left Side Bar (Top & Bottom Mirrored)
    const leftX = (canvas.width / 2) - ((i + 1) * barWidth);
    canvasCtx.fillRect(leftX + 1, centerY - barHeight, barWidth - 2, barHeight * 2);
  }

  canvasCtx.shadowBlur = 0;
}

drawVisualizer();
