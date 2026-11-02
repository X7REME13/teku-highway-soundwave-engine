/**
 * TEKU DRIVE // ARRANGER MODULE
 * Dynamic musical arrangement driven entirely by continuous gradients.
 * Schedules musical steps across Multi-Step Sustained Sub-Bass, Breakbeats,
 * Teku Hook Ostinato, Industrial Stabs, Scratches, and 808 Drops.
 *
 * ZERO BINARY CUTS: All layers crossfade, filter-sweep, and breathe with the vehicle.
 */

class TekuArranger {
  constructor(generator, instruments, mixer) {
    this.generator = generator;
    this.instruments = instruments;
    this.mixer = mixer;

    this.currentBar = 1;
    this.totalBars = 8;
    this.isPendingDrop = false;
    this.dropRiserTriggered = false;
  }

  /**
   * Schedules a single 16th-note step (0 to 15) at AudioContext time
   */
  scheduleStep(step, bar, time, telemetryState) {
    this.currentBar = bar;
    const session = this.generator.session;
    const { gradients, energy, events } = telemetryState;

    // 1. Audio Bus Continuous Automation (Smooth 60ms time constant)
    this.applyContinuousGradients(gradients, time);

    // 2. Event Handling: Shift Flair & Throttle Kick Riser
    if (events.includes('SHIFT')) {
      const scratchType = (bar % 2 === 0) ? 'baby_scratch' : 'chirp';
      this.instruments.triggerDJScratch(scratchType, time);
    }

    if (events.includes('THROTTLE_STAB') && !this.isPendingDrop) {
      this.isPendingDrop = true;
      this.dropRiserTriggered = false;
    }

    // Fire Riser 1/2 bar before the drop
    if (this.isPendingDrop && !this.dropRiserTriggered && step === 8) {
      this.instruments.triggerRiser(time, 0.88);
      this.dropRiserTriggered = true;
    }

    // Step 0 of new phrase: 808 Drop Impact if pending
    if (step === 0 && this.isPendingDrop && this.dropRiserTriggered) {
      this.instruments.triggerDropImpact(time);
      this.isPendingDrop = false;
      this.dropRiserTriggered = false;
    }

    // Pick Current Harmonic Chord (2 bars per chord in 8-bar cycle)
    const chordIndex = Math.floor((bar - 1) / 2) % session.progression.length;
    const chord = session.progression[chordIndex];
    const rootMidi = session.key.rootMidi + chord.degOffset;

    // Pick Step Data (A-A-B-A Form with Generative Turnarounds on Bar 4 & Bar 8)
    let bassNote, drumNote;
    if (bar === 4 && step >= 12 && session.turnaroundBass) {
      bassNote = session.turnaroundBass[step - 12];
      drumNote = session.drumsFill ? session.drumsFill[step] : session.drumsB[step];
    } else if (bar === 8 && step >= 8 && session.turnaroundClimax) {
      bassNote = session.turnaroundClimax[step - 8];
      drumNote = session.drumsFill ? session.drumsFill[step] : session.drumsB[step];
    } else if (bar % 2 === 0) {
      bassNote = session.bassB[step];
      drumNote = session.drumsB[step];
    } else {
      bassNote = session.bassA[step];
      drumNote = session.drumsA[step];
    }

    const secondsPerBeat = 60.0 / (session.baseBpm || 136);
    const stepDuration = secondsPerBeat / 4.0;

    // ==========================================
    // 1. SUSTAINED SUB/MID BASSLINE (Always Active, 100% Pure Music)
    // ==========================================
    if (bassNote && !bassNote.rest) {
      const midi = rootMidi + (bassNote.oct * 12) + bassNote.deg;
      const freq = 440 * Math.pow(2, (midi - 69) / 12);

      // Multi-step sustained duration (e.g. 3 steps = 330ms of deep sub pressure!)
      const noteSteps = Math.max(1, bassNote.len || 1);
      const dur = stepDuration * noteSteps * 0.96;

      const vel = 0.72 + (energy * 0.28);
      const cutoffBoost = gradients.bassCutoffBoost || 0;
      this.instruments.triggerBass(freq, time, dur, vel, bassNote.accent, bassNote.slide, cutoffBoost);
    }

    // ==========================================
    // 2. BREAKBEAT DRUMS (Continuously blended by speed gradients)
    // ==========================================
    if (drumNote) {
      // A. Kick Drum: Gain modulated by kickHat gradient
      if (drumNote.kick && gradients.drumsKickHat > 0.02) {
        const kickVol = gradients.drumsKickHat * (0.85 + energy * 0.25);
        this.instruments.triggerKick(time, kickVol);
      }

      // B. Hi-Hats: Swung 16ths modulated by kickHat gradient
      if (drumNote.hat && gradients.drumsKickHat > 0.05) {
        this.instruments.triggerHat(time, drumNote.openHat, drumNote.accent);
      }

      // C. Snare & Ghost Snare: Modulated by full breakbeat gradient
      if (drumNote.snare && gradients.drumsFull > 0.03) {
        const snareVol = gradients.drumsFull * (0.88 + energy * 0.22);
        this.instruments.triggerSnare(time, snareVol);
      } else if (drumNote.ghostSnare && gradients.drumsFull > 0.12) {
        this.instruments.triggerGhostSnare(time);
      }
    }

    // ==========================================
    // 3. TEKU MID-SYNTH HOOK OSTINATO (Modulated by hook gradient)
    // ==========================================
    if (gradients.hook > 0.05 && session.hookMotif) {
      const hookNote = session.hookMotif[step];
      if (hookNote && !hookNote.rest) {
        const hookMidi = rootMidi + (hookNote.oct * 12) + hookNote.deg;
        const hookFreq = 440 * Math.pow(2, (hookMidi - 69) / 12);
        const hookSteps = Math.max(1, hookNote.len || 1);
        const hookDur = stepDuration * hookSteps * 0.90;
        this.instruments.triggerHook(hookFreq, time, hookDur, gradients.hook, hookNote.accent, hookNote.slide);
      }
    }

    // ==========================================
    // 4. INDUSTRIAL RAVE STABS (Syncopated minor chord hits)
    // ==========================================
    if (gradients.stabs > 0.12) {
      const isDownbeatStab = (step === 0 && (bar === 1 || bar === 3 || bar === 5 || bar === 7));
      const isSyncopatedStab = (gradients.stabs > 0.42 && step === 6 && bar % 2 === 0);
      if (isDownbeatStab || isSyncopatedStab) {
        this.instruments.triggerStab(time, rootMidi + 12, gradients.stabs);
      }
    }

    // ==========================================
    // 5. SHIRAKO VINYL CUTS (Backbeat syncopation on turnaround bars)
    // ==========================================
    if (gradients.stabs > 0.28 && step === 12 && (bar === 2 || bar === 4 || bar === 6 || bar === 8)) {
      const cutType = (bar === 8) ? 'tear' : 'baby_scratch';
      this.instruments.triggerDJScratch(cutType, time);
    }
  }

  /**
   * Applies continuous mathematical gradients to mixer buses smoothly
   */
  applyContinuousGradients(gradients, time) {
    const ctx = this.mixer.ctx;
    const t = time || ctx.currentTime;
    const tc = 0.06; // 60ms smooth time constant (zero pops, clicks, or jumps)

    // 1. Drum Filter Cutoff Sweep (320 Hz when stopped -> 14,000 Hz at high speed)
    if (this.mixer.drumFilter && this.mixer.drumFilter.frequency) {
      this.mixer.drumFilter.frequency.setTargetAtTime(gradients.drumCutoff, t, tc);
    }

    // 2. Drum Bus Master Gain (overall drums volume swell)
    if (this.mixer.drumBus && this.mixer.drumBus.gain) {
      const overallDrumLevel = Math.max(gradients.drumsKickHat, gradients.drumsFull);
      this.mixer.drumBus.gain.setTargetAtTime(overallDrumLevel, t, tc);
    }

    // 3. Thermal Overdrive on Bass (continuous 2.2 -> 5.5)
    if (gradients.thermal !== undefined) {
      const drive = 2.2 + (gradients.thermal * 3.3);
      this.mixer.bassDistortion.curve = this.mixer.makeAsymmetricTubeCurve(drive);
    }
  }
}

if (typeof globalThis !== 'undefined') {
  globalThis.TekuArranger = TekuArranger;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TekuArranger };
}
