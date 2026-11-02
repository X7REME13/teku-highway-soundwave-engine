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
    this.totalBars = 16;
    this.sectionName = 'GROOVE';
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
    const upperMadness = gradients.upperMadness || 0;
    const coastBridge = gradients.tranceBridge || 0;

    // Determine 16-bar Macro-Structure Section (Anti-Fatigue Trance Architecture)
    const isDriving = (gradients.drumsKickHat || 0) > 0.05;
    const isBridgeBar = isDriving && ((bar >= 9 && bar <= 12) || coastBridge > 0.45);
    const isBuildUpBar = isDriving && (bar === 13 || bar === 14);
    const isClimaxBar = isDriving && (bar === 15 || bar === 16);

    if (!isDriving) {
      this.sectionName = 'IDLE BASS';
    } else if (isBridgeBar) {
      this.sectionName = 'TRANCE BRIDGE';
    } else if (isBuildUpBar) {
      this.sectionName = 'TRANCE BUILD-UP';
    } else if (isClimaxBar) {
      this.sectionName = 'APEX DROP';
    } else if (upperMadness > 0.55) {
      this.sectionName = 'UPPER MADNESS';
    } else {
      this.sectionName = 'TEKU GROOVE';
    }

    // 1. Audio Bus Continuous Automation (Smooth 60ms time constant)
    this.applyContinuousGradients(gradients, time, isBridgeBar, isBuildUpBar);

    // 2. Event Handling: Shift Flair & Throttle Kick Riser
    if (events.includes('SHIFT')) {
      const scratchType = (bar % 2 === 0) ? 'baby_scratch' : 'chirp';
      this.instruments.triggerDJScratch(scratchType, time);
    }

    if (events.includes('THROTTLE_STAB') && !this.isPendingDrop) {
      this.isPendingDrop = true;
      this.dropRiserTriggered = false;
    }

    // Automatic Trance Build-Up Riser on Bar 14 Step 0 -> Drop on Bar 15 Step 0
    if (isBuildUpBar && bar === 14 && step === 0) {
      const secondsPerBeat = 60.0 / (session.baseBpm || 136);
      this.instruments.triggerRiser(time, secondsPerBeat * 4.0);
    }

    // Climax Drop Impact on Bar 15 Step 0
    if (isClimaxBar && bar === 15 && step === 0) {
      this.instruments.triggerDropImpact(time);
    }

    // Fire Riser 1/2 bar before a manual throttle-stab drop
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

    // Pick Current Harmonic Chord (2 bars per chord across progression)
    const chordIndex = Math.floor((bar - 1) / 2) % session.progression.length;
    const chord = session.progression[chordIndex];
    const rootMidi = session.key.rootMidi + chord.degOffset;

    // Pick Step Data (16-Bar Form with Trance Bridge on 9-12 & Build-Up on 13-14)
    let bassNote, drumNote;
    if (isBridgeBar && session.bridgeBass) {
      bassNote = session.bridgeBass[step];
      drumNote = session.drumsA[step];
    } else if ((bar === 4 || bar === 12) && step >= 12 && session.turnaroundBass) {
      bassNote = session.turnaroundBass[step - 12];
      drumNote = session.drumsFill ? session.drumsFill[step] : session.drumsB[step];
    } else if ((bar === 8 || bar === 16) && step >= 8 && session.turnaroundClimax) {
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
    // 1. SUSTAINED SUB/MID BASSLINE (Always Active, Deep Breathing in Bridge)
    // ==========================================
    if (bassNote && !bassNote.rest) {
      const midi = rootMidi + (bassNote.oct * 12) + bassNote.deg;
      const freq = 440 * Math.pow(2, (midi - 69) / 12);

      // Multi-step sustained duration (e.g. 8 steps in Bridge = 880ms of warm sub wave!)
      const noteSteps = Math.max(1, bassNote.len || 1);
      const dur = stepDuration * noteSteps * 0.96;

      const vel = isBridgeBar ? 0.80 : (0.72 + (energy * 0.28));
      // Soften mid-bass saw filter during the Trance Bridge so ears rest while sub-bass stays deep
      const cutoffBoost = isBridgeBar ? -90 : (gradients.bassCutoffBoost || 0);
      this.instruments.triggerBass(freq, time, dur, vel, bassNote.accent, bassNote.slide, cutoffBoost);
    }

    // ==========================================
    // 2. BREAKBEAT DRUMS & TRANCE SNARE BUILD-UP
    // ==========================================
    if (isBuildUpBar) {
      // Trance Build-Up (Bars 13-14): Accelerating Snare Roll + Open Hats
      const isBar13Roll = (bar === 13 && step % 2 === 0); // 8th-note snare roll
      const isBar14Roll = (bar === 14);                   // 16th-note snare roll climax
      if (isBar13Roll || isBar14Roll) {
        const progress = ((bar - 13) * 16 + step) / 32.0; // 0.0 -> 1.0 across 2 bars
        const rollVel = (0.30 + progress * 0.75) * Math.max(0.35, gradients.drumsKickHat);
        this.instruments.triggerSnare(time, rollVel);
      }
      if (step % 4 === 0 && gradients.drumsKickHat > 0.05) {
        this.instruments.triggerKick(time, gradients.drumsKickHat * 0.85);
      }
      if (step % 4 === 2 && gradients.drumsKickHat > 0.05) {
        this.instruments.triggerHat(time, true, true);
      }
    } else if (isBridgeBar) {
      // Trance Atmospheric Bridge (Bars 9-12): Rest the heavy breakbeat snare!
      // Only a soft heartbeat kick on beat 1 and shimmering offbeat open hi-hats
      if (step === 0 && gradients.drumsKickHat > 0.05) {
        this.instruments.triggerKick(time, gradients.drumsKickHat * 0.55);
      }
      if (step % 4 === 2 && gradients.drumsKickHat > 0.08) {
        this.instruments.triggerHat(time, true, false);
      }
    } else if (drumNote) {
      // Full Teku Breakbeat Groove (Bars 1-8 & Climax Bars 15-16)
      if (drumNote.kick && gradients.drumsKickHat > 0.02) {
        const kickVol = gradients.drumsKickHat * (0.85 + energy * 0.25);
        this.instruments.triggerKick(time, kickVol);
      }

      if (drumNote.hat && gradients.drumsKickHat > 0.05) {
        this.instruments.triggerHat(time, drumNote.openHat, drumNote.accent);
      }

      // High-frequency 32nd-note Hi-Hat Ratchet sparkle when Upper Madness is active
      if (upperMadness > 0.45 && (step === 7 || step === 15) && (bar % 2 === 0 || isClimaxBar)) {
        this.instruments.triggerHatRatchet(time, upperMadness * 0.90);
      }

      if (drumNote.snare && gradients.drumsFull > 0.03) {
        const snareVol = gradients.drumsFull * (0.88 + energy * 0.22);
        this.instruments.triggerSnare(time, snareVol);
      } else if (drumNote.ghostSnare && gradients.drumsFull > 0.12) {
        this.instruments.triggerGhostSnare(time);
      }
    }

    // ==========================================
    // 3. EUPHORIC TRANCE ATMOSPHERIC PAD (Bridge & Build-Up Anti-Fatigue Layer)
    // ==========================================
    if ((isBridgeBar || isBuildUpBar || isClimaxBar) && (step === 0 || step === 8)) {
      const padDur = stepDuration * 8.2; // 2-beat lush overlapping Supersaw chord swell
      const openness = isBuildUpBar ? 0.85 : (isClimaxBar ? 1.0 : 0.45 + (bar - 9) * 0.10);
      const padVel = isBridgeBar ? 0.85 : (isBuildUpBar ? 0.95 : 0.65);
      this.instruments.triggerTrancePad(rootMidi, time, padDur, padVel, openness);
    }

    // ==========================================
    // 4. UPPER MADNESS ("LOCURA ARRIBA"): TECH-TRANCE ARP & ACID SCREAMER
    // ==========================================
    // Active during high-speed driving, Trance Bridge (floating echo), Build-up, or Climax Drop
    const arpLevel = isClimaxBar
      ? Math.max(0.85, upperMadness)
      : (isBridgeBar || isBuildUpBar ? Math.max(0.55, upperMadness * 0.9) : upperMadness);

    if (arpLevel > 0.08 && session.tranceArp) {
      const arpNote = session.tranceArp[step];
      // At moderate madness play 8th notes & offbeat accents; at high madness play full 16th hypnotic roll
      const shouldPlayStep = (arpLevel > 0.42) || (step % 2 === 0) || arpNote.screamer;
      if (arpNote && !arpNote.rest && shouldPlayStep) {
        const arpMidi = rootMidi + (arpNote.oct * 12) + arpNote.deg;
        const arpFreq = 440 * Math.pow(2, (arpMidi - 69) / 12);
        const arpDur = stepDuration * 0.82;
        const isScreamer = arpNote.screamer && (arpLevel > 0.50 || isClimaxBar || isBuildUpBar);
        this.instruments.triggerTranceArp(
          arpFreq,
          time,
          arpDur,
          arpLevel,
          arpNote.accent,
          isScreamer,
          arpNote.slide
        );
      }
    }

    // ==========================================
    // 5. TEKU MID-SYNTH HOOK OSTINATO (Modulated by hook gradient, rests in Bridge)
    // ==========================================
    if (!isBridgeBar && gradients.hook > 0.05 && session.hookMotif) {
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
    // 6. INDUSTRIAL RAVE STABS (Syncopated minor chord hits)
    // ==========================================
    if (!isBridgeBar && gradients.stabs > 0.12) {
      const isDownbeatStab = (step === 0 && (bar % 2 === 1));
      const isSyncopatedStab = (gradients.stabs > 0.42 && step === 6 && bar % 2 === 0);
      if (isDownbeatStab || isSyncopatedStab) {
        this.instruments.triggerStab(time, rootMidi + 12, gradients.stabs);
      }
    }

    // ==========================================
    // 7. SHIRAKO VINYL CUTS (Backbeat syncopation on turnaround bars)
    // ==========================================
    if (gradients.stabs > 0.28 && step === 12 && (bar === 2 || bar === 4 || bar === 6 || bar === 8 || bar === 16)) {
      const cutType = (bar === 8 || bar === 16) ? 'tear' : 'baby_scratch';
      this.instruments.triggerDJScratch(cutType, time);
    }
  }

  /**
   * Applies continuous mathematical gradients to mixer buses smoothly
   */
  applyContinuousGradients(gradients, time, isBridgeBar = false, isBuildUpBar = false) {
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

    // 3. Mid-Bass Grit Ducking during Trance Bridge (Rests the ears while keeping Sub-Bass 100% deep)
    if (this.mixer.midBassBus && this.mixer.midBassBus.gain) {
      const targetMidBass = isBridgeBar ? 0.28 : (isBuildUpBar ? 0.55 : 0.88);
      this.mixer.midBassBus.gain.setTargetAtTime(targetMidBass, t, 0.12);
    }

    // 4. Trance Bus & Echo Delay Wet Swell
    if (this.mixer.delayWet && this.mixer.delayWet.gain) {
      const targetWet = (isBridgeBar || isBuildUpBar) ? 0.52 : 0.34;
      this.mixer.delayWet.gain.setTargetAtTime(targetWet, t, 0.10);
    }

    // 5. Thermal Overdrive on Bass (continuous 2.2 -> 5.5)
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
