/**
 * TEKU DRIVE // ARRANGER MODULE
 * Dynamic musical arrangement driven entirely by continuous gradients.
 * Schedules musical steps across Bass, Breakbeats, Stabs, Scratches, and FX.
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

    // 1. Audio Bus Continuous Automation (Smooth 80ms time constant)
    this.applyContinuousGradients(gradients, time);

    // 2. Event Handling: Shift Flair & Throttle Kick Riser
    if (events.includes('SHIFT')) {
      this.instruments.triggerDJScratch('baby_scratch', time);
    }

    if (events.includes('THROTTLE_STAB') && !this.isPendingDrop) {
      this.isPendingDrop = true;
      this.dropRiserTriggered = false;
    }

    // Fire Riser 1 bar before the drop
    if (this.isPendingDrop && !this.dropRiserTriggered && step === 8) {
      this.instruments.triggerRiser(time, 0.88);
      this.dropRiserTriggered = true;
    }

    // Step 0 of new phrase: Drop Impact if pending
    if (step === 0 && this.isPendingDrop && this.dropRiserTriggered) {
      this.instruments.triggerDropImpact(time);
      this.isPendingDrop = false;
      this.dropRiserTriggered = false;
    }

    // Pick Current Harmonic Chord (2 bars per chord in 8-bar cycle)
    const chordIndex = Math.floor((bar - 1) / 2) % session.progression.length;
    const chord = session.progression[chordIndex];
    const rootMidi = session.key.rootMidi + chord.degOffset;

    // Pick Step Data (A-A-B-C Form with Generative Turnarounds)
    let bassNote, drumNote;
    if (bar === 4 && step >= 12 && session.turnaroundBass) {
      bassNote = session.turnaroundBass[step - 12];
      drumNote = session.drumsB[step];
    } else if (bar === 8 && step >= 8 && session.turnaroundClimax) {
      bassNote = session.turnaroundClimax[step - 8];
      drumNote = session.drumsB[step];
    } else if (bar === 3 || bar === 7) {
      bassNote = session.bassB[step];
      drumNote = session.drumsB[step];
    } else {
      bassNote = session.bassA[step];
      drumNote = session.drumsA[step];
    }

    // ==========================================
    // 1. BASSLINE: ALWAYS PLAYING (100% Music, 0% Engine Noise)
    // ==========================================
    if (bassNote && !bassNote.rest) {
      const midi = rootMidi + (bassNote.oct * 12) + bassNote.deg;
      const freq = 440 * Math.pow(2, (midi - 69) / 12);

      // Duration: 16th note length with accent extension
      const secondsPerBeat = 60.0 / (session.baseBpm || 136);
      const stepDuration = secondsPerBeat / 4.0;
      const dur = bassNote.accent ? stepDuration * 1.5 : stepDuration * 0.90;

      // Base velocity boosted by energy gradient
      const vel = 0.65 + (energy * 0.35);
      this.instruments.triggerBass(freq, time, dur, vel, bassNote.accent, bassNote.slide);
    }

    // ==========================================
    // 2. BREAKBEAT DRUMS (Continuously blended by speed gradients)
    // ==========================================
    if (drumNote) {
      // A. Kick Drum: Gain modulated by kickHat gradient
      if (drumNote.kick && gradients.drumsKickHat > 0.02) {
        const kickVol = gradients.drumsKickHat * (0.80 + energy * 0.30);
        this.instruments.triggerKick(time, kickVol);
      }

      // B. Hi-Hats: Swung 16ths modulated by kickHat gradient
      if (drumNote.hat && gradients.drumsKickHat > 0.05) {
        const hatVol = gradients.drumsKickHat;
        this.instruments.triggerHat(time, drumNote.openHat, drumNote.accent);
      }

      // C. Snare & Ghost Snare: Modulated by full breakbeat gradient
      if (drumNote.snare && gradients.drumsFull > 0.03) {
        const snareVol = gradients.drumsFull * (0.85 + energy * 0.25);
        this.instruments.triggerSnare(time, snareVol);
      } else if (drumNote.ghostSnare && gradients.drumsFull > 0.15) {
        this.instruments.triggerGhostSnare(time);
      }
    }

    // ==========================================
    // 3. INDUSTRIAL RAVE STABS (Sparse, modulated by stab gradient)
    // ==========================================
    if (gradients.stabs > 0.15) {
      // Only fires on Bar 1 & Bar 5 downbeat (Step 0)
      if (step === 0 && (bar === 1 || bar === 5)) {
        this.instruments.triggerStab(time, rootMidi + 12);
      }
    }

    // ==========================================
    // 4. SHIRAKO VINYL CUTS (Backbeat syncopation on even bars)
    // ==========================================
    if (gradients.stabs > 0.30 && step === 12 && bar % 2 === 0) {
      this.instruments.triggerDJScratch('baby_scratch', time);
    }
  }

  /**
   * Applies continuous mathematical gradients to mixer buses smoothly
   */
  applyContinuousGradients(gradients, time) {
    const ctx = this.mixer.ctx;
    const t = time || ctx.currentTime;
    const tc = 0.06; // 60ms smooth time constant (no pops, clicks, or jumps!)

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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TekuArranger };
}
