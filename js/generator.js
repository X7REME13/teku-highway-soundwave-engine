/**
 * TEKU DRIVE // GENERATOR MODULE
 * Procedural music generation calibrated to Teku-Ising audio DNA:
 * - Multi-step sustained sub-bass riffs with syncopated pickups (no random 16th-note chaos)
 * - Authentic Nu-Skool Breakbeat & Big Beat drum grooves
 * - Hypnotic Mid-Synth Teku Hook Motif & Industrial Stab patterns
 */

if (typeof window === 'undefined' && typeof require !== 'undefined') {
  if (typeof TekuRNG === 'undefined') require('./rng.js');
  if (typeof TekuTheory === 'undefined') require('./theory.js');
}

class TekuGenerator {
  constructor(rng = null) {
    this.rng = rng || new TekuRNG();
    this.session = null;
    this.generateNewSession();
  }

  generateNewSession(seed = null, options = {}) {
    if (seed !== null) this.rng.setSeed(seed);

    // Pick Session Key & BPM (Calibrated for midtempo heavy cruising 110-116 BPM)
    let key = options.key || null;
    if (!key && options.keyName) {
      key = TekuTheory.KEYS.find(k => k.name.toLowerCase() === options.keyName.toLowerCase());
    }
    if (!key) key = this.rng.pick(TekuTheory.KEYS);

    const bpm = options.bpm || this.rng.randInt(110, 116);

    // Pick Riff Archetype & Scale
    const archetypes = ['teku_ising_signature', 'shirako_big_beat', 'accelecharger_tresillo', 'night_drift_303'];
    const archetype = options.archetype && archetypes.includes(options.archetype)
      ? options.archetype
      : this.rng.pick(archetypes);

    const progNames = Object.keys(TekuTheory.PROGRESSIONS);
    const progKey = this.rng.pick(progNames);

    // Generate Phrase A and Phrase B (Call & Response)
    const bassA = this.generateBassRiff(archetype, 'A');
    const bassB = this.generateBassRiff(archetype, 'B');

    // Generate Teku Mid-Synth Hook Motif (interlocks with bassline)
    const hookMotif = this.generateHookMotif();

    // Generate Breakbeat Drum Grooves
    const drumsA = this.generateBreakbeatPattern('main');
    const drumsB = this.generateBreakbeatPattern('variation');
    const drumsFill = this.generateBreakbeatPattern('fill');

    // Turnaround Fills (Bar 4 and Bar 8 endings)
    const turnaroundBass = this.generateTurnaroundFill(4);
    const turnaroundClimax = this.generateTurnaroundFill(8);

    // High-Register Tech-Trance / Acid Arpeggio ("Locura Arriba") & Bridge Sub Pattern
    const tranceArp = this.generateTranceArp();
    const bridgeBass = this.generateBridgeBass();

    this.session = {
      seed: this.rng.seedString,
      key: key,
      baseBpm: bpm,
      archetype: archetype,
      scaleType: progKey === 'hot_phrygian' ? 'phrygian' : 'aeolian',
      progression: TekuTheory.PROGRESSIONS[progKey],
      bassA: bassA,
      bassB: bassB,
      bridgeBass: bridgeBass,
      hookMotif: hookMotif,
      tranceArp: tranceArp,
      drumsA: drumsA,
      drumsB: drumsB,
      drumsFill: drumsFill,
      turnaroundBass: turnaroundBass,
      turnaroundClimax: turnaroundClimax,
      mutationCount: 0,
      lastMutation: null,
      mutationHistory: []
    };

    return this.session;
  }

  /**
   * Helper: Converts a list of note events [{step, len, deg, oct, accent, slide}]
   * into a 16-step array where held steps are marked as tied rests so notes sustain cleanly.
   */
  buildStepGrid(events) {
    const grid = new Array(16).fill(null).map(() => ({
      deg: 0,
      oct: 0,
      len: 0,
      accent: false,
      slide: false,
      rest: true,
      tied: false
    }));

    for (const ev of events) {
      if (ev.step < 0 || ev.step >= 16) continue;
      const len = Math.max(1, Math.min(16 - ev.step, ev.len || 1));
      grid[ev.step] = {
        deg: ev.deg || 0,
        oct: ev.oct || 0,
        len: len,
        accent: Boolean(ev.accent),
        slide: Boolean(ev.slide),
        rest: false,
        tied: false
      };
      for (let k = 1; k < len; k++) {
        if (ev.step + k < 16) {
          grid[ev.step + k] = {
            deg: ev.deg || 0,
            oct: ev.oct || 0,
            len: 0,
            accent: false,
            slide: false,
            rest: true,
            tied: true
          };
        }
      }
    }
    return grid;
  }

  /**
   * Generates a structured, groove-locked 16-step Teku bass riff.
   * Uses sustained sub notes (2-3 steps long) + tight syncopated 16th pickups.
   */
  generateBassRiff(archetype = 'teku_ising_signature', phrase = 'A') {
    // Pick cohesive tension intervals from the dark minor/phrygian palette
    const darkIntervals = [-2, 1, 3, 7, 10]; // b7 below, b2 phrygian, b3 minor, 5th, b7
    const tension1 = this.rng.pick([-2, 1, 3]);
    const tension2 = this.rng.pick([3, 7, 10, -2]);
    const turnNote1 = phrase === 'A' ? this.rng.pick([3, 7, 10]) : this.rng.pick([1, 8, 7]);
    const turnNote2 = phrase === 'A' ? this.rng.pick([-2, 1]) : this.rng.pick([10, -2, 1]);

    let events = [];

    if (archetype === 'teku_ising_signature') {
      // Extracted directly from Teku-Ising intro (0.0s - 35s):
      // Every quarter-note beat (steps 0, 4, 8, 12 = every 0.44s at 136 BPM) fires the iconic
      // 225Hz -> 100Hz -> 50Hz Teku Intro Bass-Kick Punch ("La Patada"), followed by 350ms sub sustain!
      events = [
        { step: 0,  len: 3, deg: 0,        oct: 0, accent: true,  slide: false },
        { step: 3,  len: 1, deg: tension1, oct: 0, accent: false, slide: true  },
        { step: 4,  len: 3, deg: 0,        oct: 0, accent: true,  slide: false },
        { step: 7,  len: 1, deg: tension2, oct: 0, accent: false, slide: true  },
        { step: 8,  len: 3, deg: 0,        oct: 0, accent: true,  slide: false },
        { step: 11, len: 1, deg: 0,        oct: 1, accent: true,  slide: true  },
        { step: 12, len: 2, deg: 0,        oct: 0, accent: true,  slide: false },
        { step: 14, len: 1, deg: turnNote1, oct: 0, accent: false, slide: false },
        { step: 15, len: 1, deg: turnNote2, oct: 0, accent: true, slide: true  }
      ];
    } else if (archetype === 'shirako_big_beat') {
      // Driving 2-step Big Beat pump with octave & subtonic bounce
      events = [
        { step: 0,  len: 2, deg: 0,         oct: 0, accent: true,  slide: false },
        { step: 2,  len: 2, deg: 0,         oct: 1, accent: true,  slide: true  },
        { step: 4,  len: 3, deg: 0,         oct: 0, accent: false, slide: false },
        { step: 7,  len: 1, deg: tension1,  oct: 0, accent: true,  slide: true  },
        { step: 8,  len: 2, deg: 0,         oct: 0, accent: true,  slide: false },
        { step: 10, len: 2, deg: tension2,  oct: 0, accent: true,  slide: false },
        { step: 12, len: 2, deg: turnNote1, oct: 0, accent: true,  slide: false },
        { step: 14, len: 2, deg: turnNote2, oct: 0, accent: true,  slide: true  }
      ];
    } else if (archetype === 'accelecharger_tresillo') {
      // 3 + 3 + 2 Tresillo sub-bass roller (huge sustained sub pressure)
      events = [
        { step: 0,  len: 3, deg: 0,         oct: 0, accent: true,  slide: false },
        { step: 3,  len: 3, deg: tension1,  oct: 0, accent: true,  slide: true  },
        { step: 6,  len: 2, deg: 0,         oct: 1, accent: true,  slide: false },
        { step: 8,  len: 3, deg: 0,         oct: 0, accent: true,  slide: false },
        { step: 11, len: 3, deg: tension2,  oct: 0, accent: true,  slide: true  },
        { step: 14, len: 2, deg: turnNote2, oct: 0, accent: true,  slide: true  }
      ];
    } else {
      // 'night_drift_303': Tight rolling acid bass anchored on root pedal
      events = [
        { step: 0,  len: 2, deg: 0,         oct: 0, accent: true,  slide: false },
        { step: 2,  len: 1, deg: 0,         oct: 0, accent: false, slide: false },
        { step: 3,  len: 1, deg: 0,         oct: 1, accent: true,  slide: true  },
        { step: 4,  len: 2, deg: 0,         oct: 0, accent: false, slide: false },
        { step: 6,  len: 2, deg: tension1,  oct: 0, accent: true,  slide: true  },
        { step: 8,  len: 2, deg: 0,         oct: 0, accent: true,  slide: false },
        { step: 10, len: 1, deg: 0,         oct: 0, accent: false, slide: false },
        { step: 11, len: 1, deg: tension2,  oct: 0, accent: true,  slide: true  },
        { step: 12, len: 2, deg: turnNote1, oct: 0, accent: true,  slide: false },
        { step: 14, len: 2, deg: turnNote2, oct: 0, accent: true,  slide: true  }
      ];
    }

    return this.buildStepGrid(events);
  }

  /**
   * Generates the dark mid-range Teku Synth Hook / Ostinato motif
   * (Heard in Teku-Ising at 50s - 85s, locking into the 3+3+2 syncopated groove)
   */
  generateHookMotif() {
    const hookDegrees = [0, 3, 7, 10, 8, 7, 3, 1];
    const d1 = this.rng.pick([7, 3, 0]);
    const d2 = this.rng.pick([8, 10, 7]);
    const d3 = this.rng.pick([3, 5, 7]);
    const d4 = this.rng.pick([1, -2, 3]);

    const events = [
      { step: 0,  len: 3, deg: d1, oct: 1, accent: true,  slide: false },
      { step: 3,  len: 3, deg: d2, oct: 1, accent: true,  slide: true  },
      { step: 6,  len: 2, deg: d3, oct: 1, accent: false, slide: false },
      { step: 8,  len: 3, deg: d1, oct: 1, accent: true,  slide: false },
      { step: 11, len: 3, deg: d3, oct: 1, accent: true,  slide: true  },
      { step: 14, len: 2, deg: d4, oct: 1, accent: true,  slide: true  }
    ];
    return this.buildStepGrid(events);
  }

  /**
   * Generates a 16-step High-Register Tech-Trance / Acid Arpeggio ("Locura Arriba")
   * Operates in Octave +2 / +3 with rhythmic trance-gate accents & octave jumps
   */
  generateTranceArp() {
    const arpTemplates = [
      // Classic Y2K Tech-Trance Rolling 16th Arpeggio
      [0, 3, 7, 12, 7, 3, 10, 12, 0, 3, 7, 15, 12, 10, 7, 3],
      // Shirako Acid Screamer Syncopated Arp
      [0, 12, 3, 10, 7, 12, 1, 7, 0, 12, 3, 15, 10, 7, 3, 1],
      // Euphoric Minor-9th Trance Gate Sequence
      [0, 7, 12, 14, 15, 12, 7, 3, 0, 7, 10, 12, 15, 14, 10, 7]
    ];
    const seq = this.rng.pick(arpTemplates);
    const pattern = [];
    for (let i = 0; i < 16; i++) {
      const deg = seq[i];
      const isOffbeatAccent = (i % 4 === 2) || (i === 3 || i === 7 || i === 11 || i === 14 || i === 15);
      pattern.push({
        deg: deg,
        oct: (deg >= 12) ? 2 : (this.rng.chance(0.35) ? 3 : 2),
        len: 1,
        accent: isOffbeatAccent,
        screamer: (i === 3 || i === 7 || i === 11 || i === 15),
        slide: (i % 4 === 3),
        rest: (i === 1 || i === 5 || i === 9) && this.rng.chance(0.30) // Slight trance-gate breathing
      });
    }
    return pattern;
  }

  /**
   * Generates a spacious, long-sustained Sub-Bass pattern for the Trance Bridge (Bars 9-12)
   * Lets the ears rest from the 16th-note mid-grit while keeping deep sub-bass pressure
   */
  generateBridgeBass() {
    const events = [
      { step: 0,  len: 8, deg: 0,  oct: 0, accent: true,  slide: false },
      { step: 8,  len: 6, deg: 0,  oct: 0, accent: false, slide: false },
      { step: 14, len: 2, deg: -2, oct: 0, accent: true,  slide: true  }
    ];
    return this.buildStepGrid(events);
  }

  /**
   * Generates authentic Nu-Skool Breakbeat / Big Beat drum patterns
   * Combines heavy syncopated kicks, punchy backbeat snares, and crisp 16th hats
   */
  generateBreakbeatPattern(type = 'main') {
    const steps = [];

    for (let i = 0; i < 16; i++) {
      const step = {
        kick: false,
        snare: false,
        ghostSnare: false,
        hat: true,
        openHat: false,
        accent: (i % 2 === 0)
      };

      if (type === 'main') {
        // Driving Breakbeat: Kick on 0, 3 (or 6), 10; Snare on 4 & 12
        if (i === 0 || i === 10) step.kick = true;
        if (i === 3 && this.rng.chance(0.75)) step.kick = true;
        if (i === 6 && !steps[3]?.kick) step.kick = true;
        if (i === 4 || i === 12) step.snare = true;
        if (i === 7 || i === 9 || i === 15) {
          if (this.rng.chance(0.65)) step.ghostSnare = true;
        }
        if (i === 2 || i === 14) step.openHat = true;
      } else if (type === 'variation') {
        // Syncopated Big Beat Variation
        if (i === 0 || i === 6 || i === 11) step.kick = true;
        if (i === 14 && this.rng.chance(0.5)) step.kick = true;
        if (i === 4 || i === 12) step.snare = true;
        if (i === 2 || i === 7 || i === 15) step.ghostSnare = true;
        if (i === 6 || i === 10 || i === 14) step.openHat = true;
      } else {
        // Turnaround Break Fill (Bar 4 / Bar 8)
        if (i === 0 || i === 3 || i === 6) step.kick = true;
        if (i === 4 || i === 8 || i === 11 || i === 12 || i === 14 || i === 15) step.snare = true;
        if (i === 9 || i === 10 || i === 13) step.ghostSnare = true;
        if (i === 2 || i === 6 || i === 12) step.openHat = true;
      }

      steps.push(step);
    }

    return steps;
  }

  /** Generates turnaround fills for bar 4 (4 steps) and bar 8 (8 steps) */
  generateTurnaroundFill(length = 4) {
    const fill = [];
    const walkDegrees = length === 4 ? [3, 1, 0, -2] : [7, 7, 5, 3, 3, 1, 0, -2];
    for (let i = 0; i < length; i++) {
      fill.push({
        deg: walkDegrees[i % walkDegrees.length],
        oct: (i % 3 === 0 && this.rng.chance(0.35)) ? 1 : 0,
        len: 1,
        accent: (i % 2 === 0) || (i === length - 1),
        slide: i === length - 1,
        rest: false,
        tied: false
      });
    }
    return fill;
  }

  /** 8-Bar Evolutionary Mutation: mutates turnaround/pickup intervals while keeping the groove locked */
  mutateSession() {
    if (!this.session) return null;
    this.session.mutationCount++;

    // Evolve pickup/turnaround degrees on steps 3, 7, 11, 14, 15 without breaking multi-step sustain
    const candidateSteps = [3, 7, 11, 14, 15];
    const targetStep = this.rng.pick(candidateSteps);
    const note = this.session.bassA[targetStep];
    let mutationRecord = null;

    if (note && !note.rest && note.len === 1) {
      const oldDeg = note.deg;
      const oldOct = note.oct;
      note.deg = this.rng.pick([0, 1, 3, 7, 10, -2]);
      note.oct = this.rng.chance(0.25) ? 1 : 0;
      note.slide = this.rng.chance(0.50);

      mutationRecord = {
        mutationIndex: this.session.mutationCount,
        step: targetStep,
        oldDeg: oldDeg,
        newDeg: note.deg,
        oct: note.oct,
        slide: note.slide,
        timestamp: Date.now()
      };

      this.session.lastMutation = mutationRecord;
      if (!this.session.mutationHistory) this.session.mutationHistory = [];
      this.session.mutationHistory.unshift(mutationRecord);
      if (this.session.mutationHistory.length > 12) this.session.mutationHistory.length = 12;
    }

    return mutationRecord;
  }
}

if (typeof globalThis !== 'undefined') {
  globalThis.TekuGenerator = TekuGenerator;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TekuGenerator };
}
