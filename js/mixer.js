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

    // FFT Analyser for UI Visualizer
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.82;

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

    // --- 4. STAB BUS (With Ping-Pong Delay Send) ---
    this.stabBus = ctx.createGain();
    this.stabBus.gain.setValueAtTime(0.70, ctx.currentTime);
    this.stabBus.connect(this.panner);

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
   * Modulate Bass Distortion by Engine Coolant Temp (°C)
   * Cold: Crisp, clean 2.4 drive
   * Warm: Optimal 3.5 analog warmth
   * Hot (>95°C): Thick, heavily saturated 5.5 tube overdrive
   */
  updateThermalDistortion(temp) {
    if (!this.bassDistortion) return;
    let drive = 3.5;
    if (temp < 50) {
      drive = 2.4;
    } else if (temp > 95) {
      drive = 5.5;
    } else {
      // 50 - 95 range
      const ratio = (temp - 50.0) / 45.0;
      drive = 2.4 + ratio * 2.1;
    }
    this.bassDistortion.curve = this.makeAsymmetricTubeCurve(drive);
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
