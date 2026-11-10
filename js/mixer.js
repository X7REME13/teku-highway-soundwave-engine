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

    // --- 1. MASTER BUS & TWO-STAGE DYNAMICS (Glue Compressor + Brickwall Limiter) ---
    this.masterGain = ctx.createGain();
    this.userVolume = 0.50; // Calibrated default master volume (-6 dBFS headroom to prevent harshness)
    this.masterGain.gain.setValueAtTime(this.userVolume, ctx.currentTime);

    // Car Audio Stereo Panner (fed by lateral G)
    if (ctx.createStereoPanner) {
      this.panner = ctx.createStereoPanner();
      this.panner.pan.setValueAtTime(0, ctx.currentTime);
    } else {
      this.panner = ctx.createGain(); // Fallback
    }

    // Stage 1: Warm Glue Compressor (-12 dBFS threshold, 3:1 ratio, smooth 15ms attack)
    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-12, ctx.currentTime);
    this.compressor.knee.setValueAtTime(10, ctx.currentTime);
    this.compressor.ratio.setValueAtTime(3.0, ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.015, ctx.currentTime);
    this.compressor.release.setValueAtTime(0.16, ctx.currentTime);

    // Stage 2: True Peak Brickwall Limiter (-1.2 dBFS ceiling, 20:1 ratio, 1ms attack)
    this.limiter = ctx.createDynamicsCompressor();
    this.limiter.threshold.setValueAtTime(-1.2, ctx.currentTime);
    this.limiter.knee.setValueAtTime(0, ctx.currentTime);
    this.limiter.ratio.setValueAtTime(20.0, ctx.currentTime);
    this.limiter.attack.setValueAtTime(0.001, ctx.currentTime);
    this.limiter.release.setValueAtTime(0.050, ctx.currentTime);

    // High-Resolution FFT Analyser for 30-Band 1/3-Octave Teku Equalizer & Headroom Meter
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 4096;
    this.analyser.smoothingTimeConstant = 0.78;
    if ('minDecibels' in this.analyser) {
      this.analyser.minDecibels = -85;
      this.analyser.maxDecibels = -10;
    }

    // Time-domain buffer for RMS & Peak dBFS measurement
    this._timeDataBuffer = new Float32Array(512);

    // Master routing chain: MasterGain -> Glue Compressor -> Limiter -> Analyser -> Output
    this.masterGain.connect(this.compressor);
    this.compressor.connect(this.limiter);
    this.limiter.connect(this.analyser);
    this.analyser.connect(ctx.destination);

    // --- 2. PRE-COMPUTED STATIC SATURATION CURVES (Zero dynamic allocations during playback) ---
    this.staticTubeCurve = this.makeAsymmetricTubeCurve(3.0);
    this.staticMildCurve = this.makeAsymmetricTubeCurve(1.6);

    // --- 3. BASS BUS ARCHITECTURE (Subsonic HPF + Parallel Clean Sub & Warm Mid-Bass) ---
    this.bassBus = ctx.createGain();
    this.bassBus.gain.setValueAtTime(1.0, ctx.currentTime);

    // Sidechain Ducking Gain (applied to both Sub and Mid)
    this.bassSidechainGain = ctx.createGain();
    this.bassSidechainGain.gain.setValueAtTime(1.0, ctx.currentTime);

    // Subsonic 30 Hz High-Pass Filter (removes DC offset and inaudible speaker-straining rumble)
    this.subHpf = ctx.createBiquadFilter();
    this.subHpf.type = 'highpass';
    this.subHpf.frequency.setValueAtTime(30, ctx.currentTime);
    this.subHpf.Q.setValueAtTime(0.707, ctx.currentTime);

    // Dedicated Sub-Bass Bus: Pure, clean sine foundation calibrated for -6 dBFS headroom
    this.subBassBus = ctx.createGain();
    this.subBassBus.gain.setValueAtTime(0.88, ctx.currentTime);

    // Mid-Bass Pre-Drive, Static Tube Distortion, and Post-Trim
    this.midBassBus = ctx.createGain();
    this.midBassBus.gain.setValueAtTime(0.68, ctx.currentTime);

    this.bassPreDrive = ctx.createGain();
    this.bassPreDrive.gain.setValueAtTime(1.0, ctx.currentTime);

    this.bassDistortion = ctx.createWaveShaper();
    this.bassDistortion.curve = this.staticTubeCurve;
    this.bassDistortion.oversample = '4x';

    this.bassPostTrim = ctx.createGain();
    this.bassPostTrim.gain.setValueAtTime(0.85, ctx.currentTime);

    // Route Sub through Subsonic HPF into Sidechain Ducking
    this.subBassBus.connect(this.subHpf);
    this.subHpf.connect(this.bassSidechainGain);

    // Route Mid through PreDrive -> Static Tube -> PostTrim -> Sidechain Ducking
    this.midBassBus.connect(this.bassPreDrive);
    this.bassPreDrive.connect(this.bassDistortion);
    this.bassDistortion.connect(this.bassPostTrim);
    this.bassPostTrim.connect(this.bassSidechainGain);

    // Route legacy bassBus into midBassBus for backward compatibility
    this.bassBus.connect(this.midBassBus);

    // Bass connects directly to masterGain (bypassing panner so sub stays rock-solid mono)
    this.bassSidechainGain.connect(this.masterGain);

    // --- 4. DRUM BUS ---
    this.drumBus = ctx.createGain();
    this.drumBus.gain.setValueAtTime(0.82, ctx.currentTime);

    this.drumFilter = ctx.createBiquadFilter();
    this.drumFilter.type = 'lowpass';
    this.drumFilter.frequency.setValueAtTime(14000, ctx.currentTime);

    this.drumBus.connect(this.drumFilter);
    this.drumFilter.connect(this.panner);

    // --- 5. STAB & TRANCE LEAD BUS (Monophonic/Lead Distortion Path) ---
    this.stabBus = ctx.createGain();
    this.stabBus.gain.setValueAtTime(0.65, ctx.currentTime);

    this.tranceBus = ctx.createGain();
    this.tranceBus.gain.setValueAtTime(0.70, ctx.currentTime);

    this.synthPreDrive = ctx.createGain();
    this.synthPreDrive.gain.setValueAtTime(1.0, ctx.currentTime);

    this.synthDistortion = ctx.createWaveShaper();
    this.synthDistortion.curve = this.staticMildCurve;
    this.synthDistortion.oversample = '2x';

    this.synthPostTrim = ctx.createGain();
    this.synthPostTrim.gain.setValueAtTime(0.85, ctx.currentTime);

    this.tranceBus.connect(this.synthPreDrive);
    this.stabBus.connect(this.synthPreDrive);
    this.synthPreDrive.connect(this.synthDistortion);
    this.synthDistortion.connect(this.synthPostTrim);
    this.synthPostTrim.connect(this.panner);

    // --- 6. DEDICATED CLEAN STEREO PAD BUS (Bypasses distortion to eliminate polyphonic IMD) ---
    this.padBus = ctx.createGain();
    this.padBus.gain.setValueAtTime(0.62, ctx.currentTime);
    this.padBus.connect(this.panner);

    if (ctx.createDelay) {
      this.delayNode = ctx.createDelay(1.0);
      this.delayNode.delayTime.setValueAtTime(0.40, ctx.currentTime); // Dotted 16th at 112 BPM

      this.delayFeedback = ctx.createGain();
      this.delayFeedback.gain.setValueAtTime(0.35, ctx.currentTime);

      this.delayFilter = ctx.createBiquadFilter();
      this.delayFilter.type = 'bandpass';
      this.delayFilter.frequency.setValueAtTime(1800, ctx.currentTime);
      this.delayFilter.Q.setValueAtTime(0.7, ctx.currentTime);

      this.delayWet = ctx.createGain();
      this.delayWet.gain.setValueAtTime(0.32, ctx.currentTime);

      // Route shaped synth signal and clean pad into delay line
      this.synthPostTrim.connect(this.delayNode);
      this.padBus.connect(this.delayNode);

      this.delayNode.connect(this.delayFilter);
      this.delayFilter.connect(this.delayFeedback);
      this.delayFeedback.connect(this.delayNode);
      this.delayFilter.connect(this.delayWet);
      this.delayWet.connect(this.panner);
    }

    // --- 7. FX BUS ---
    this.fxBus = ctx.createGain();
    this.fxBus.gain.setValueAtTime(0.75, ctx.currentTime);
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
    gainParam.setValueAtTime(0.25, t); // Quick duck (-12 dB dip for punchy kick impact)
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
   * Modulates smooth PreDrive & PostTrim GainNodes (ZERO curve reallocations during audio playback)
   */
  updateThermalState(temp, gradients = null) {
    const t = this.ctx.currentTime;
    const tc = 0.08; // 80ms smooth time constant

    // 1. Modulate Bass PreDrive & PostTrim
    if (this.bassPreDrive && this.bassPreDrive.gain && this.bassPreDrive.gain.setTargetAtTime) {
      let preDrive = 1.0;
      let postTrim = 0.85;
      if (temp < 50) {
        preDrive = 0.70;
        postTrim = 0.95;
      } else if (temp > 95) {
        const ratio = Math.min(1.0, (temp - 95.0) / 10.0);
        preDrive = 1.15 + ratio * 0.45; // 1.15x -> 1.60x drive
        postTrim = 0.80 - ratio * 0.15; // compensate volume
      } else {
        const ratio = (temp - 50.0) / 45.0;
        preDrive = 0.80 + ratio * 0.35;
        postTrim = 0.90 - ratio * 0.05;
      }
      this.bassPreDrive.gain.setTargetAtTime(preDrive, t, tc);
      if (this.bassPostTrim && this.bassPostTrim.gain) {
        this.bassPostTrim.gain.setTargetAtTime(postTrim, t, tc);
      }
    }

    // 2. Modulate Synth Lead Saturation PreDrive
    if (this.synthPreDrive && this.synthPreDrive.gain && this.synthPreDrive.gain.setTargetAtTime) {
      let synthDrive = 0.90;
      if (temp < 65) {
        synthDrive = 0.75;
      } else if (temp > 92) {
        const spicyRatio = Math.min(1.0, (temp - 92.0) / 13.0);
        synthDrive = 1.0 + spicyRatio * 0.50; // 1.0 -> 1.5x sizzling drive
      } else {
        const warmRatio = (temp - 65.0) / 27.0;
        synthDrive = 0.85 + warmRatio * 0.20;
      }
      this.synthPreDrive.gain.setTargetAtTime(synthDrive, t, tc);
    }

    // 3. Modulate Delay Wetness & Feedback
    if (this.delayWet && this.delayWet.gain && this.delayWet.gain.setTargetAtTime) {
      let targetWet = 0.32;
      if (temp < 65) {
        const coldRatio = Math.max(0, (temp - 20) / 45.0);
        targetWet = 0.10 + coldRatio * 0.20;
      } else if (temp > 92) {
        const hotRatio = Math.min(1.0, (temp - 92.0) / 13.0);
        targetWet = 0.32 + hotRatio * 0.16;
      }
      this.delayWet.gain.setTargetAtTime(targetWet, t, 0.12);
    }

    if (this.delayFeedback && this.delayFeedback.gain && this.delayFeedback.gain.setTargetAtTime) {
      let targetFeedback = 0.35;
      if (temp < 65) {
        targetFeedback = 0.18;
      } else if (temp > 92) {
        const hotRatio = Math.min(1.0, (temp - 92.0) / 13.0);
        targetFeedback = 0.35 + hotRatio * 0.10;
      }
      this.delayFeedback.gain.setTargetAtTime(targetFeedback, t, 0.12);
    }
  }

  updateThermalDistortion(temp) {
    this.updateThermalState(temp);
  }

  /**
   * Real-time Audio Headroom & Telemetry Monitor
   * Returns current RMS dBFS, Peak dBFS, Limiter Reduction dB, and clipping status
   */
  getAudioLevels() {
    if (!this.analyser) {
      return { rmsDb: -90, peakDb: -90, reductionDb: 0, isClipping: false };
    }

    if (!this._timeDataBuffer || this._timeDataBuffer.length !== this.analyser.fftSize) {
      this._timeDataBuffer = new Float32Array(this.analyser.fftSize);
    }

    if (this.analyser.getFloatTimeDomainData) {
      this.analyser.getFloatTimeDomainData(this._timeDataBuffer);
    } else {
      // Fallback for older WebAudio implementations
      const uintBuf = new Uint8Array(this.analyser.fftSize);
      this.analyser.getByteTimeDomainData(uintBuf);
      for (let i = 0; i < uintBuf.length; i++) {
        this._timeDataBuffer[i] = (uintBuf[i] - 128) / 128.0;
      }
    }

    let sumSq = 0;
    let peakAbs = 0;
    const len = this._timeDataBuffer.length;
    for (let i = 0; i < len; i++) {
      const v = Math.abs(this._timeDataBuffer[i]);
      if (v > peakAbs) peakAbs = v;
      sumSq += v * v;
    }

    const rms = Math.sqrt(sumSq / Math.max(1, len));
    const rmsDb = rms > 0.00001 ? Math.max(-90, 20 * Math.log10(rms)) : -90;
    const peakDb = peakAbs > 0.00001 ? Math.max(-90, 20 * Math.log10(peakAbs)) : -90;

    // DynamicsCompressor reduction is negative dB (e.g. -2.5 dB)
    let reductionDb = 0;
    if (this.limiter && typeof this.limiter.reduction === 'number') {
      reductionDb = this.limiter.reduction;
    } else if (this.compressor && typeof this.compressor.reduction === 'number') {
      reductionDb = this.compressor.reduction;
    }

    const isClipping = peakDb >= -0.2;

    return {
      rmsDb: Math.round(rmsDb * 10) / 10,
      peakDb: Math.round(peakDb * 10) / 10,
      reductionDb: Math.round(reductionDb * 10) / 10,
      isClipping: isClipping
    };
  }

  /**
   * Update Stereo Panner based on Lateral G (+/- 0.35 G)
   */
  updateLateralPan(g) {
    if (!this.panner || !this.panner.pan) return;
    const pan = Math.max(-0.85, Math.min(0.85, (g / 0.35) * 0.75));
    this.panner.pan.setTargetAtTime(pan, this.ctx.currentTime, 0.04);
  }

  /**
   * Set Master Audio Volume (0.0 to 1.0) with smooth anti-pop gain transition
   */
  setMasterVolume(vol) {
    const v = Math.max(0.0, Math.min(1.0, Number(vol)));
    this.userVolume = v;
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      if (this.masterGain.gain.cancelScheduledValues) {
        this.masterGain.gain.cancelScheduledValues(now);
      }
      if (this.masterGain.gain.setTargetAtTime) {
        this.masterGain.gain.setTargetAtTime(v, now, 0.015);
      } else if (this.masterGain.gain.setValueAtTime) {
        this.masterGain.gain.setValueAtTime(v, now);
      }
    }
    return this.userVolume;
  }
}

if (typeof globalThis !== 'undefined') {
  globalThis.TekuMixer = TekuMixer;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TekuMixer };
}
