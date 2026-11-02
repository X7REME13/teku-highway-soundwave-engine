/**
 * TEKU DRIVE // AUDIO MIXER & BUS ROUTING MODULE
 * Routes musical channels with dynamic tube saturation, sidechain pump,
 * stereo auto-panning (lateral G), and master car audio glue compression.
 */

class TekuMixer {
  constructor(ctx) {
    this.ctx = ctx;
    this.initBuses();
  }

  initBuses() {
    const ctx = this.ctx;

    // --- 1. MASTER BUS & GLUE COMPRESSION ---
    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.85, ctx.currentTime);

    // Car Audio Stereo Panner (fed by lateral G)
    if (ctx.createStereoPanner) {
      this.panner = ctx.createStereoPanner();
      this.panner.pan.setValueAtTime(0, ctx.currentTime);
    } else {
      this.panner = ctx.createGain(); // Fallback
    }

    // Master Glue Compressor (protects car amplifiers while letting deep sub-bass breathe)
    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-7, ctx.currentTime);
    this.compressor.knee.setValueAtTime(6, ctx.currentTime);
    this.compressor.ratio.setValueAtTime(2.4, ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.035, ctx.currentTime); // 35ms allows full 45-75Hz sub wave punch
    this.compressor.release.setValueAtTime(0.18, ctx.currentTime);

    // High-Resolution FFT Analyser for 30-Band 1/3-Octave Teku Equalizer
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 4096;
    this.analyser.smoothingTimeConstant = 0.78;
    if ('minDecibels' in this.analyser) {
      this.analyser.minDecibels = -85;
      this.analyser.maxDecibels = -10;
    }

    this.masterGain.connect(this.compressor);
    this.compressor.connect(this.analyser);
    this.analyser.connect(ctx.destination);

    // --- 2. BASS BUS ARCHITECTURE (Parallel Sub-Bass & Saturated Mid-Bass) ---
    this.bassBus = ctx.createGain();
    this.bassBus.gain.setValueAtTime(1.0, ctx.currentTime);

    // Sidechain Ducking Gain (applied to both Sub and Mid)
    this.bassSidechainGain = ctx.createGain();
    this.bassSidechainGain.gain.setValueAtTime(1.0, ctx.currentTime);

    // A. Dedicated Sub-Bass Bus: Pure, massive, clean sine foundation
    this.subBassBus = ctx.createGain();
    this.subBassBus.gain.setValueAtTime(1.35, ctx.currentTime); // +2.6dB dedicated sub boost!

    // B. Mid-Bass Bus: Receives tube distortion and saturation
    this.midBassBus = ctx.createGain();
    this.midBassBus.gain.setValueAtTime(0.75, ctx.currentTime);

    this.bassDistortion = ctx.createWaveShaper();
    this.bassDistortion.curve = this.makeAsymmetricTubeCurve(3.2);
    this.bassDistortion.oversample = '4x';

    // Route Sub directly into Sidechain Ducking (uncompromised clean sine power, no square-wave clipping)
    this.subBassBus.connect(this.bassSidechainGain);

    // Route Mid through Tube Distortion into Sidechain Ducking
    this.midBassBus.connect(this.bassDistortion);
    this.bassDistortion.connect(this.bassSidechainGain);

    // Route legacy bassBus into midBassBus for backward compatibility
    this.bassBus.connect(this.midBassBus);

    // Bass connects directly to masterGain (bypassing panner so sub stays rock-solid mono!)
    this.bassSidechainGain.connect(this.masterGain);

    // --- 3. DRUM BUS ---
    this.drumBus = ctx.createGain();
    this.drumBus.gain.setValueAtTime(1.0, ctx.currentTime);

    this.drumFilter = ctx.createBiquadFilter();
    this.drumFilter.type = 'lowpass';
    this.drumFilter.frequency.setValueAtTime(14000, ctx.currentTime);

    this.drumBus.connect(this.drumFilter);
    this.drumFilter.connect(this.panner);

    // --- 4. STAB BUS ---
    this.stabBus = ctx.createGain();
    this.stabBus.gain.setValueAtTime(0.75, ctx.currentTime);

    // --- 4B. TRANCE & UPPER MADNESS BUS (With Dotted-16th Stereo Echo Delay) ---
    this.tranceBus = ctx.createGain();
    this.tranceBus.gain.setValueAtTime(0.85, ctx.currentTime);

    // Sizzling Thermal Overdrive for Synth Leads, Pads & Stabs ("Spicy Mix")
    this.synthDistortion = ctx.createWaveShaper();
    this.synthDistortion.curve = this.makeAsymmetricTubeCurve(1.2);
    this.synthDistortion.oversample = '2x';

    this.tranceBus.connect(this.synthDistortion);
    this.stabBus.connect(this.synthDistortion);
    this.synthDistortion.connect(this.panner);

    if (ctx.createDelay) {
      this.delayNode = ctx.createDelay(1.0);
      this.delayNode.delayTime.setValueAtTime(0.40, ctx.currentTime); // Dotted 16th at 112 BPM

      this.delayFeedback = ctx.createGain();
      this.delayFeedback.gain.setValueAtTime(0.38, ctx.currentTime);

      this.delayFilter = ctx.createBiquadFilter();
      this.delayFilter.type = 'bandpass';
      this.delayFilter.frequency.setValueAtTime(1800, ctx.currentTime);
      this.delayFilter.Q.setValueAtTime(0.7, ctx.currentTime);

      this.delayWet = ctx.createGain();
      this.delayWet.gain.setValueAtTime(0.36, ctx.currentTime);

      // Route shaped synth signal into delay line
      this.synthDistortion.connect(this.delayNode);
      this.delayNode.connect(this.delayFilter);
      this.delayFilter.connect(this.delayFeedback);
      this.delayFeedback.connect(this.delayNode);
      this.delayFilter.connect(this.delayWet);
      this.delayWet.connect(this.panner);
    }

    // --- 5. FX BUS ---
    this.fxBus = ctx.createGain();
    this.fxBus.gain.setValueAtTime(0.85, ctx.currentTime);
    this.fxBus.connect(this.panner);

    // Route Panner to Master
    this.panner.connect(this.masterGain);
  }

  /**
   * Sidechain Ducking: Ducks bass on kick impact
   */
  triggerSidechain(time) {
    const t = time || this.ctx.currentTime;
    const gainParam = this.bassSidechainGain.gain;
    gainParam.cancelScheduledValues(t);
    gainParam.setValueAtTime(0.22, t); // Quick duck (-13 dB dip for punchy kick impact)
    gainParam.exponentialRampToValueAtTime(1.0, t + 0.11); // Smooth 110ms release
  }

  /**
   * Asymmetric Tube Saturation Curve
   */
  makeAsymmetricTubeCurve(amount = 3.0) {
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    for (let i = 0; i < n_samples; ++i) {
      let x = (i * 2) / n_samples - 1;
      if (x >= 0) {
        curve[i] = Math.tanh(x * amount);
      } else {
        curve[i] = Math.tanh(x * (amount * 1.3)) * 0.92;
      }
    }
    return curve;
  }

  /**
   * Modulate Bass & Synth Saturation + Delay Reverb by Engine Coolant Temp (°C)
   * Cold (<65°C): Clean digital tone (1.6x-2.2x sub), dry reverb (0.10 wet)
   * Warm (65-92°C): Optimal analog warmth (3.4x sub, 1.4x lead, 0.36 wet)
   * Hot (>92°C): Sizzling spicy mix (up to 5.8x sub overdrive, 4.4x lead saturation, 0.52 wet)
   */
  updateThermalState(temp, gradients = null) {
    // 1. Modulate Bass Distortion
    if (this.bassDistortion) {
      let bassDrive = 3.4;
      if (temp < 50) {
        bassDrive = 1.6 + Math.max(0, (temp - 20) / 30.0) * 0.8;
      } else if (temp > 95) {
        const ratio = Math.min(1.0, (temp - 95.0) / 10.0);
        bassDrive = 3.8 + ratio * 2.0; // 3.8 -> 5.8x
      } else {
        const ratio = (temp - 50.0) / 45.0;
        bassDrive = 2.4 + ratio * 1.4; // 2.4 -> 3.8x
      }
      this.bassDistortion.curve = this.makeAsymmetricTubeCurve(bassDrive);
    }

    // 2. Modulate Synth Lead / Pad Saturation ("Spicy Mix")
    if (this.synthDistortion) {
      let synthDrive = 1.2;
      if (temp < 65) {
        synthDrive = 1.0; // Clean linear pass
      } else if (temp > 92) {
        const spicyRatio = Math.min(1.0, (temp - 92.0) / 13.0);
        synthDrive = 1.4 + spicyRatio * 3.0; // 1.4 -> 4.4x sizzling lead saturation!
      } else {
        const warmRatio = (temp - 65.0) / 27.0;
        synthDrive = 1.0 + warmRatio * 0.4; // 1.0 -> 1.4x
      }
      this.synthDistortion.curve = this.makeAsymmetricTubeCurve(synthDrive);
    }

    // 3. Modulate Delay Wetness & Feedback
    const t = this.ctx.currentTime;
    if (this.delayWet && this.delayWet.gain && this.delayWet.gain.setTargetAtTime) {
      let targetWet = 0.36;
      if (temp < 65) {
        const coldRatio = Math.max(0, (temp - 20) / 45.0);
        targetWet = 0.10 + coldRatio * 0.24; // 0.10 -> 0.34
      } else if (temp > 92) {
        const hotRatio = Math.min(1.0, (temp - 92.0) / 13.0);
        targetWet = 0.36 + hotRatio * 0.16; // 0.36 -> 0.52
      }
      this.delayWet.gain.setTargetAtTime(targetWet, t, 0.12);
    }

    if (this.delayFeedback && this.delayFeedback.gain && this.delayFeedback.gain.setTargetAtTime) {
      let targetFeedback = 0.38;
      if (temp < 65) {
        targetFeedback = 0.18;
      } else if (temp > 92) {
        const hotRatio = Math.min(1.0, (temp - 92.0) / 13.0);
        targetFeedback = 0.38 + hotRatio * 0.10;
      }
      this.delayFeedback.gain.setTargetAtTime(targetFeedback, t, 0.12);
    }
  }

  updateThermalDistortion(temp) {
    this.updateThermalState(temp);
  }

  /**
   * Update Stereo Panner based on Lateral G (+/- 0.35 G)
   */
  updateLateralPan(g) {
    if (!this.panner || !this.panner.pan) return;
    const pan = Math.max(-0.85, Math.min(0.85, (g / 0.35) * 0.75));
    this.panner.pan.setTargetAtTime(pan, this.ctx.currentTime, 0.04);
  }
}

if (typeof globalThis !== 'undefined') {
  globalThis.TekuMixer = TekuMixer;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TekuMixer };
}
