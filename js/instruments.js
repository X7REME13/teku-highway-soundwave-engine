/**
 * TEKU DRIVE // INSTRUMENTS MODULE
 * Pure musical synthesizers calibrated to Teku-Ising acoustic DNA:
 * - Rolling Sustained Sub/Mid Bass (True ADSR sustain hold, >94% energy under 250 Hz)
 * - Big Beat / Nu-Skool Breakbeat Drum Kit (Kick, Snare, Ghost, Swung Hats, Crash)
 * - Teku Mid-Synth Hook Ostinato (50s-85s Teku-Ising motif)
 * - Industrial Rave Minor Chord Stabs
 * - Shirako DJ Turntable Vinyl Scratches & 808 Sub Drops
 */

class TekuInstruments {
  constructor(ctx, mixer) {
    this.ctx = ctx;
    this.mixer = mixer;
    this.lastBassFreq = null;
    this.lastHookFreq = null;
    this.lastArpFreq = null;

    // Thermal sound staging
    this.thermalCold = 0.0;
    this.thermalHot = 0.0;
    this.temp = 88;
  }

  updateThermalState(temp, gradients = null) {
    this.temp = temp;
    if (gradients) {
      this.thermalCold = gradients.thermalCold !== undefined ? gradients.thermalCold : 0.0;
      this.thermalHot = gradients.thermalHot !== undefined ? gradients.thermalHot : 0.0;
    } else {
      this.thermalCold = Math.max(0, Math.min(1.0, (68.0 - temp) / 43.0));
      this.thermalHot = Math.max(0, Math.min(1.0, (temp - 88.0) / 14.0));
    }
  }

  // ==========================================
  // 1. THE TEKU RAW BASSLINE + INTRO BASS-KICK PUNCH ("LA PATADA DE ENTRADA")
  // ==========================================
  triggerBass(freq, time, duration, vel = 0.85, isAccent = false, hasSlide = false, cutoffBoost = 0) {
    const ctx = this.ctx;
    const now = time || ctx.currentTime;
    const dur = Math.max(0.08, duration || 0.22);

    // ========================================================
    // A. PHYSICAL SUB-BASS FOUNDATION + TEKU-ISING INTRO PITCH THUMP
    // ========================================================
    const targetFreq = (hasSlide && this.lastBassFreq) ? this.lastBassFreq : freq;
    let subStartFreq = targetFreq;
    while (subStartFreq > 82) subStartFreq *= 0.5;
    while (subStartFreq < 42) subStartFreq *= 2.0;

    let subEndFreq = freq;
    while (subEndFreq > 82) subEndFreq *= 0.5;
    while (subEndFreq < 42) subEndFreq *= 2.0;

    // 1. Primary Pure Sine Sub Oscillator (100% focused fundamental pressure)
    const subSine = ctx.createOscillator();
    subSine.type = 'sine';

    // 2. Secondary Triangle Sub Oscillator (Warm 2nd/3rd harmonic body)
    const subTri = ctx.createOscillator();
    subTri.type = 'triangle';

    // TEKU-ISING INTRO PITCH SWEEP ("La Patada"):
    // Measured from reference 0.0s-2.2s: starts at ~225 Hz (or ~3.5x sub) -> 100 Hz at 38ms -> locks onto 50 Hz at 78ms!
    if (hasSlide) {
      subSine.frequency.setValueAtTime(subStartFreq, now);
      subTri.frequency.setValueAtTime(subStartFreq, now);
      subSine.frequency.exponentialRampToValueAtTime(subEndFreq, now + Math.min(0.09, dur * 0.45));
      subTri.frequency.exponentialRampToValueAtTime(subEndFreq, now + Math.min(0.09, dur * 0.45));
    } else {
      const punchStart = isAccent ? Math.min(235, subEndFreq * 3.8) : Math.min(175, subEndFreq * 2.6);
      const punchMid = subEndFreq * 1.65;
      subSine.frequency.setValueAtTime(punchStart, now);
      subSine.frequency.exponentialRampToValueAtTime(punchMid, now + 0.032);
      subSine.frequency.exponentialRampToValueAtTime(subEndFreq, now + 0.076);

      subTri.frequency.setValueAtTime(punchStart * 0.85, now);
      subTri.frequency.exponentialRampToValueAtTime(subEndFreq, now + 0.065);
    }

    // Dedicated Sub Lowpass Filter (Opens to 210 Hz for the initial 75ms chest thump, then settles to 120 Hz)
    const subFilter = ctx.createBiquadFilter();
    subFilter.type = 'lowpass';
    subFilter.frequency.setValueAtTime(isAccent ? 230 : 175, now);
    subFilter.frequency.exponentialRampToValueAtTime(120, now + 0.080);
    subFilter.Q.setValueAtTime(0.85, now);

    // TRUE SUSTAINED SUB ADSR ENVELOPE (Hard -1.8dB chest impact transient -> deep sustained hold)
    const subGain = ctx.createGain();
    const subPeak = Math.min(1.62, isAccent ? vel * 1.68 : vel * 1.42);
    const subSustain = subPeak * 0.82;
    const holdEnd = now + dur * 0.84;
    subGain.gain.setValueAtTime(0.001, now);
    subGain.gain.linearRampToValueAtTime(subPeak, now + 0.004); // Instant 4ms Teku impact attack
    subGain.gain.exponentialRampToValueAtTime(subSustain, now + 0.085); // 80ms chest thump decay into sustain
    subGain.gain.linearRampToValueAtTime(subSustain * 0.90, holdEnd);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.99);

    subSine.connect(subFilter);
    subTri.connect(subFilter);
    subFilter.connect(subGain);

    // 3. Dedicated Teku-Ising Upper-Bass Chest-Kick Thump Oscillator (225 Hz -> 95 Hz -> 50 Hz in 85ms)
    // Gives every accented bass hit that exact "DOOM-BASS" physical kick transient from the intro of Teku-Ising!
    const punchOsc = ctx.createOscillator();
    const punchGain = ctx.createGain();
    punchOsc.type = 'triangle';
    const thumpStart = isAccent ? 225 : 170;
    punchOsc.frequency.setValueAtTime(thumpStart, now);
    punchOsc.frequency.exponentialRampToValueAtTime(102, now + 0.036);
    punchOsc.frequency.exponentialRampToValueAtTime(subEndFreq, now + 0.082);

    const punchAmt = (isAccent ? 0.95 : (hasSlide ? 0.25 : 0.62)) * vel;
    punchGain.gain.setValueAtTime(0.001, now);
    punchGain.gain.linearRampToValueAtTime(punchAmt, now + 0.003);
    punchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.090);
    punchOsc.connect(punchGain);

    if (this.mixer.subBassBus) {
      subGain.connect(this.mixer.subBassBus);
      punchGain.connect(this.mixer.subBassBus);
    } else {
      subGain.connect(this.mixer.bassBus);
      punchGain.connect(this.mixer.bassBus);
    }

    // ========================================================
    // B. TEKU / BIG BEAT MID-BASS GRIT (Harmonic Growl 85 - 650 Hz)
    // ========================================================
    // Keep mid-bass fundamental in the punchy 65 - 145 Hz register
    let midStartFreq = targetFreq;
    while (midStartFreq < 65) midStartFreq *= 2.0;
    let midEndFreq = freq;
    while (midEndFreq < 65) midEndFreq *= 2.0;

    const saw1 = ctx.createOscillator();
    const saw2 = ctx.createOscillator();
    const pulse = ctx.createOscillator();
    saw1.type = 'sawtooth';
    saw2.type = 'sawtooth';
    pulse.type = 'square';

    if (hasSlide) {
      saw1.frequency.setValueAtTime(midStartFreq, now);
      saw2.frequency.setValueAtTime(midStartFreq, now);
      pulse.frequency.setValueAtTime(midStartFreq * 0.5, now);
      const slideTime = now + Math.min(0.09, dur * 0.45);
      saw1.frequency.exponentialRampToValueAtTime(midEndFreq, slideTime);
      saw2.frequency.exponentialRampToValueAtTime(midEndFreq, slideTime);
      pulse.frequency.exponentialRampToValueAtTime(midEndFreq * 0.5, slideTime);
    } else {
      // Subtle 22ms pitch snap on the mid-bass attack too
      const snapStart = isAccent ? midEndFreq * 1.45 : midEndFreq * 1.18;
      saw1.frequency.setValueAtTime(snapStart, now);
      saw2.frequency.setValueAtTime(snapStart, now);
      pulse.frequency.setValueAtTime(snapStart * 0.5, now);
      saw1.frequency.exponentialRampToValueAtTime(midEndFreq, now + 0.024);
      saw2.frequency.exponentialRampToValueAtTime(midEndFreq, now + 0.024);
      pulse.frequency.exponentialRampToValueAtTime(midEndFreq * 0.5, now + 0.024);
    }
    this.lastBassFreq = freq;

    // Wide analog detune (+/- 7 cents)
    saw1.detune.setValueAtTime(7, now);
    saw2.detune.setValueAtTime(-7, now);

    // 24dB/oct Cascaded Lowpass Filter with Envelope Sweep
    const midFilter1 = ctx.createBiquadFilter();
    const midFilter2 = ctx.createBiquadFilter();
    midFilter1.type = 'lowpass';
    midFilter2.type = 'lowpass';

    const baseCutoff = Math.max(140, (isAccent ? 380 : 250) + cutoffBoost);
    const peakCutoff = isAccent ? baseCutoff * 2.6 : baseCutoff * 1.85;

    midFilter1.frequency.setValueAtTime(peakCutoff, now);
    midFilter1.frequency.exponentialRampToValueAtTime(baseCutoff, now + dur * 0.65);
    midFilter1.Q.setValueAtTime(isAccent ? 3.4 : 2.1, now);

    midFilter2.frequency.setValueAtTime(peakCutoff * 1.1, now);
    midFilter2.frequency.exponentialRampToValueAtTime(baseCutoff, now + dur * 0.65);
    midFilter2.Q.setValueAtTime(isAccent ? 1.9 : 1.25, now);

    // Sustained Mid-Bass VCA
    const midGain = ctx.createGain();
    const midPeak = isAccent ? vel * 0.54 : vel * 0.38;
    midGain.gain.setValueAtTime(0.001, now);
    midGain.gain.linearRampToValueAtTime(midPeak, now + 0.005);
    midGain.gain.linearRampToValueAtTime(midPeak * 0.75, holdEnd);
    midGain.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.99);

    saw1.connect(midFilter1);
    saw2.connect(midFilter1);
    pulse.connect(midFilter1);
    midFilter1.connect(midFilter2);
    midFilter2.connect(midGain);

    if (this.mixer.midBassBus) {
      midGain.connect(this.mixer.midBassBus);
    } else {
      midGain.connect(this.mixer.bassBus);
    }

    // Start & Stop all oscillators cleanly
    const stopTime = now + dur + 0.02;
    subSine.start(now);
    subTri.start(now);
    punchOsc.start(now);
    saw1.start(now);
    saw2.start(now);
    pulse.start(now);

    subSine.stop(stopTime);
    subTri.stop(stopTime);
    punchOsc.stop(now + 0.10);
    saw1.stop(stopTime);
    saw2.stop(stopTime);
    pulse.stop(stopTime);
  }

  // ==========================================
  // 2. TEKU MID-SYNTH HOOK / OSTINATO (50s-85s Motif)
  // ==========================================
  triggerHook(freq, time, duration, vel = 0.55, isAccent = false, hasSlide = false) {
    const ctx = this.ctx;
    const now = time || ctx.currentTime;
    const dur = Math.max(0.08, duration || 0.22);

    // Keep hook in the dark, gritty mid register (180 - 520 Hz, never high squeaky chiptune)
    let hookFreq = freq;
    while (hookFreq < 175) hookFreq *= 2.0;
    while (hookFreq > 520) hookFreq *= 0.5;

    const startFreq = (hasSlide && this.lastHookFreq) ? this.lastHookFreq : hookFreq;
    this.lastHookFreq = hookFreq;

    const coldFactor = this.thermalCold || 0;
    const hotFactor = this.thermalHot || 0;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'square';

    osc1.frequency.setValueAtTime(startFreq, now);
    osc2.frequency.setValueAtTime(startFreq, now);

    const baseDetune = 9 * (1.0 - coldFactor * 0.55) + (hotFactor * 6);
    const drift = (hotFactor > 0.05) ? (Math.random() - 0.5) * 12 * hotFactor : 0;
    osc1.detune.setValueAtTime(baseDetune + drift, now);
    osc2.detune.setValueAtTime(-baseDetune + drift, now);

    if (hasSlide) {
      osc1.frequency.exponentialRampToValueAtTime(hookFreq, now + 0.06);
      osc2.frequency.exponentialRampToValueAtTime(hookFreq, now + 0.06);
    }

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    const baseCut = isAccent ? 1450 : 950;
    const cut = baseCut * (1.0 - coldFactor * 0.20) + (hotFactor * 320);
    filter.frequency.setValueAtTime(cut * 1.6, now);
    filter.frequency.exponentialRampToValueAtTime(cut * 0.65, now + dur * 0.85);
    filter.Q.setValueAtTime(3.5 + hotFactor * 1.8, now);

    const gain = ctx.createGain();
    const peak = vel * (isAccent ? 0.34 : 0.24);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(peak, now + 0.008);
    gain.gain.linearRampToValueAtTime(peak * 0.70, now + dur * 0.78);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.mixer.stabBus);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + dur + 0.02);
    osc2.stop(now + dur + 0.02);
  }

  // ==========================================
  // 2B. TECH-TRANCE UPPER MADNESS ARP & ACID SCREAMER (800 Hz - 10 kHz)
  // ==========================================
  triggerTranceArp(freq, time, duration, vel = 0.70, isAccent = false, isScreamer = false, hasSlide = false) {
    const ctx = this.ctx;
    const now = time || ctx.currentTime;
    const dur = Math.max(0.06, duration || 0.14);

    // Clamp into the exciting upper Tech-Trance register (620 Hz - 3,600 Hz fundamental, harmonics to 14 kHz)
    let arpFreq = freq;
    while (arpFreq < 620) arpFreq *= 2.0;
    while (arpFreq > 3600) arpFreq *= 0.5;

    const startFreq = (hasSlide && this.lastArpFreq) ? this.lastArpFreq : arpFreq;
    this.lastArpFreq = arpFreq;

    // 3 Detuned Hypersaw/Acid Voices for wide Y2K Tech-Trance sheen
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc3.type = isScreamer ? 'sawtooth' : 'square';

    osc1.frequency.setValueAtTime(startFreq, now);
    osc2.frequency.setValueAtTime(startFreq, now);
    osc3.frequency.setValueAtTime(isScreamer ? startFreq * 2.0 : startFreq, now); // Octave shimmer on screamers!

    const coldFactor = this.thermalCold || 0;
    const hotFactor = this.thermalHot || 0;

    const baseDetune = 14 * (1.0 - coldFactor * 0.55) + (hotFactor * 12);
    const arpDrift = (hotFactor > 0.05) ? (Math.random() - 0.5) * 18 * hotFactor : 0;
    osc1.detune.setValueAtTime(baseDetune + arpDrift, now);
    osc2.detune.setValueAtTime(-baseDetune + arpDrift, now);
    osc3.detune.setValueAtTime(baseDetune * 0.5 + arpDrift, now);

    if (hasSlide) {
      const slideTime = now + 0.045;
      osc1.frequency.exponentialRampToValueAtTime(arpFreq, slideTime);
      osc2.frequency.exponentialRampToValueAtTime(arpFreq, slideTime);
      osc3.frequency.exponentialRampToValueAtTime(isScreamer ? arpFreq * 2.0 : arpFreq, slideTime);
    }

    // High-Q Acid / Trance Pluck Filter (Sweeps from 7.5 kHz down to 1.4 kHz)
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    const rawPeakCut = isScreamer ? 9200 : (isAccent ? 6800 : 4800);
    const rawBaseCut = isScreamer ? 2400 : 1350;
    const peakCut = rawPeakCut * (1.0 - coldFactor * 0.22) + (hotFactor * 1800);
    const baseCut = rawBaseCut * (1.0 - coldFactor * 0.20) + (hotFactor * 600);
    filter.frequency.setValueAtTime(peakCut, now);
    filter.frequency.exponentialRampToValueAtTime(baseCut, now + dur * 0.88);
    const baseQ = isScreamer ? 6.2 : (isAccent ? 4.5 : 2.8);
    filter.Q.setValueAtTime(baseQ + hotFactor * 1.8, now);

    const gain = ctx.createGain();
    const peakGain = vel * (isScreamer ? 0.28 : (isAccent ? 0.24 : 0.18));
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.005);
    gain.gain.linearRampToValueAtTime(peakGain * 0.65, now + dur * 0.65);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc1.connect(filter);
    osc2.connect(filter);
    osc3.connect(filter);
    filter.connect(gain);

    if (this.mixer.tranceBus) {
      gain.connect(this.mixer.tranceBus);
    } else {
      gain.connect(this.mixer.stabBus);
    }

    const stopTime = now + dur + 0.02;
    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    osc1.stop(stopTime);
    osc2.stop(stopTime);
    osc3.stop(stopTime);
  }

  // ==========================================
  // 2C. EUPHORIC TRANCE ATMOSPHERIC PAD (Anti-Fatigue Bridge / Breakdown)
  // ==========================================
  triggerTrancePad(rootMidi = 50, time = null, duration = 1.8, vel = 0.75, filterOpenness = 0.5) {
    const ctx = this.ctx;
    const now = time || ctx.currentTime;
    const dur = Math.max(0.4, duration);

    // Lush Minor 9th / Add11 Trance Chord Voicing (Root, m3, 5th, m7, 9th) in Octave 4/5
    const intervals = [12, 15, 19, 22, 26];
    const padFilter = ctx.createBiquadFilter();
    padFilter.type = 'lowpass';

    // Smooth atmospheric filter sweep across the bridge/build-up (750 Hz -> 5,800 Hz)
    const startCut = 750 + (filterOpenness * 3200);
    const endCut = Math.min(6800, startCut * 1.45);
    padFilter.frequency.setValueAtTime(startCut, now);
    padFilter.frequency.exponentialRampToValueAtTime(endCut, now + dur * 0.90);
    padFilter.Q.setValueAtTime(1.4, now);

    const padGain = ctx.createGain();
    const peak = vel * 0.14; // Balanced across 5 voices
    padGain.gain.setValueAtTime(0.001, now);
    padGain.gain.linearRampToValueAtTime(peak, now + Math.min(0.25, dur * 0.25)); // Breathing Trance swell attack
    padGain.gain.linearRampToValueAtTime(peak * 0.85, now + dur * 0.78);
    padGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    padFilter.connect(padGain);
    if (this.mixer.tranceBus) {
      padGain.connect(this.mixer.tranceBus);
    } else {
      padGain.connect(this.mixer.stabBus);
    }

    intervals.forEach((semi, idx) => {
      const oscA = ctx.createOscillator();
      const oscB = ctx.createOscillator();
      oscA.type = 'sawtooth';
      oscB.type = 'sawtooth';

      const freq = 440 * Math.pow(2, (rootMidi + semi - 69) / 12);
      oscA.frequency.setValueAtTime(freq, now);
      oscB.frequency.setValueAtTime(freq, now);

      // Wide Supersaw detune spread (-18c to +18c)
      const spread = (idx - 2) * 6;
      oscA.detune.setValueAtTime(spread + 11, now);
      oscB.detune.setValueAtTime(spread - 11, now);

      oscA.connect(padFilter);
      oscB.connect(padFilter);

      oscA.start(now);
      oscB.start(now);
      oscA.stop(now + dur + 0.03);
      oscB.stop(now + dur + 0.03);
    });
  }

  // ==========================================
  // 3. BIG BEAT / BREAKBEAT DRUM KIT
  // ==========================================
  triggerKick(time, vel = 1.0) {
    const ctx = this.ctx;
    const now = time || ctx.currentTime;

    // 1. Sub-Punch Body (175 Hz transient -> 48 Hz chest thump)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';

    osc.frequency.setValueAtTime(175, now);
    osc.frequency.exponentialRampToValueAtTime(52, now + 0.038);
    osc.frequency.exponentialRampToValueAtTime(44, now + 0.26);

    gain.gain.setValueAtTime(vel * 1.25, now);
    gain.gain.linearRampToValueAtTime(vel * 0.95, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    // 2. Beater Click Transient (Punchy mid-snap at 950 Hz)
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(920, now);
    clickOsc.frequency.exponentialRampToValueAtTime(120, now + 0.018);

    clickGain.gain.setValueAtTime(vel * 0.55, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.022);

    osc.connect(gain);
    clickOsc.connect(clickGain);
    gain.connect(this.mixer.drumBus);
    clickGain.connect(this.mixer.drumBus);

    // Sidechain Ducking: Momentarily duck the bass bus on kick impact
    this.mixer.triggerSidechain(now);

    osc.start(now);
    clickOsc.start(now);
    osc.stop(now + 0.30);
    clickOsc.stop(now + 0.025);
  }

  triggerSnare(time, vel = 1.0) {
    const ctx = this.ctx;
    const now = time || ctx.currentTime;

    // 1. Fat Breakbeat Tonal Body (210 Hz drop to 105 Hz)
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(210, now);
    osc.frequency.exponentialRampToValueAtTime(105, now + 0.065);

    oscGain.gain.setValueAtTime(vel * 0.85, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(oscGain);

    // 2. Crisp Breakbeat Snare Wire Crack (Wideband noise + 2.1kHz resonance)
    const bufferSize = Math.floor(ctx.sampleRate * 0.20);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2100, now);
    filter.Q.setValueAtTime(1.4, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(vel * 0.95, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);

    noise.connect(filter);
    filter.connect(noiseGain);

    oscGain.connect(this.mixer.drumBus);
    noiseGain.connect(this.mixer.drumBus);

    osc.start(now);
    noise.start(now);
    osc.stop(now + 0.15);
    noise.stop(now + 0.21);
  }

  triggerGhostSnare(time) {
    this.triggerSnare(time, 0.28);
  }

  triggerHat(time, isOpen = false, isAccent = false) {
    const ctx = this.ctx;
    const now = time || ctx.currentTime;
    const dur = isOpen ? 0.20 : 0.048;

    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(isOpen ? 6400 : 8200, now);

    const gain = ctx.createGain();
    const vol = isAccent ? 0.34 : (isOpen ? 0.30 : 0.16);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.mixer.drumBus);

    noise.start(now);
    noise.stop(now + dur + 0.01);
  }

  triggerHatRatchet(time, vel = 0.8) {
    const ctx = this.ctx;
    const now = time || ctx.currentTime;
    // Double 32nd-note metallic hi-hat sizzle (9.5 kHz highpass) for upper spectrum sparkle
    [0, 0.052].forEach((offset, i) => {
      const t = now + offset;
      const dur = 0.038;
      const bufferSize = Math.floor(ctx.sampleRate * dur);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let j = 0; j < bufferSize; j++) data[j] = Math.random() * 2 - 1;

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(9500, t);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vel * (i === 0 ? 0.26 : 0.34), t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.mixer.drumBus);

      noise.start(t);
      noise.stop(t + dur + 0.01);
    });
  }

  triggerCrash(time) {
    const ctx = this.ctx;
    const now = time || ctx.currentTime;
    const dur = 1.6;

    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(4500, now);
    filter.Q.setValueAtTime(1.2, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.42, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.mixer.drumBus);

    noise.start(now);
    noise.stop(now + dur + 0.02);
  }

  // ==========================================
  // 4. INDUSTRIAL RAVE STABS (Dark Minor Chords)
  // ==========================================
  triggerStab(time, rootMidi = 50, vel = 0.85) {
    const ctx = this.ctx;
    const now = time || ctx.currentTime;
    const chordNotes = [rootMidi, rootMidi + 3, rootMidi + 7, rootMidi + 10]; // Minor 7th Rave Stab

    chordNotes.forEach((midi, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      const freq = 440 * Math.pow(2, (midi - 69) / 12);
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime((idx - 1.5) * 9, now);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, now);
      filter.frequency.exponentialRampToValueAtTime(420, now + 0.22);
      filter.Q.setValueAtTime(3.6, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.24 * vel, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.mixer.stabBus);

      osc.start(now);
      osc.stop(now + 0.27);
    });
  }

  // ==========================================
  // 5. SHIRAKO TAKAMOTO TURNTABLE VINYL SCRATCHES
  // ==========================================
  triggerDJScratch(type = 'baby_scratch', time = null) {
    const ctx = this.ctx;
    const now = time || ctx.currentTime;
    const duration = type === 'tear' ? 0.38 : (type === 'chirp' ? 0.12 : 0.24);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(8.0, now);

    if (type === 'baby_scratch') {
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.linearRampToValueAtTime(1850, now + 0.10);
      osc.frequency.linearRampToValueAtTime(320, now + 0.22);

      filter.frequency.setValueAtTime(1200, now);
      filter.frequency.linearRampToValueAtTime(2800, now + 0.10);
      filter.frequency.linearRampToValueAtTime(900, now + 0.22);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.42, now + 0.04);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.23);
    } else if (type === 'chirp') {
      osc.frequency.setValueAtTime(1800, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.11);
      filter.frequency.setValueAtTime(2400, now);
      gain.gain.setValueAtTime(0.48, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    } else {
      osc.frequency.setValueAtTime(550, now);
      osc.frequency.linearRampToValueAtTime(1400, now + 0.12);
      osc.frequency.linearRampToValueAtTime(900, now + 0.20);
      osc.frequency.linearRampToValueAtTime(1600, now + 0.32);
      gain.gain.setValueAtTime(0.44, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
    }

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.mixer.fxBus);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  // ==========================================
  // 6. TRANSITION RISERS & DROPS
  // ==========================================
  triggerRiser(time, duration = 1.2) {
    const ctx = this.ctx;
    const now = time || ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + duration);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.exponentialRampToValueAtTime(6000, now + duration);
    filter.Q.setValueAtTime(4.0, now);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.exponentialRampToValueAtTime(0.45, now + duration - 0.05);
    gain.gain.setValueAtTime(0.001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.mixer.fxBus);

    osc.start(now);
    osc.stop(now + duration);
  }

  triggerDropImpact(time) {
    const ctx = this.ctx;
    const now = time || ctx.currentTime;

    // 1. Massive 808 Sub-Boom (88 Hz dropping to 36 Hz with rich sub sustain)
    const boomOsc = ctx.createOscillator();
    const boomGain = ctx.createGain();
    boomOsc.type = 'sine';
    boomOsc.frequency.setValueAtTime(88, now);
    boomOsc.frequency.exponentialRampToValueAtTime(36, now + 0.22);

    boomGain.gain.setValueAtTime(1.4, now);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

    boomOsc.connect(boomGain);
    if (this.mixer.subBassBus) {
      boomGain.connect(this.mixer.subBassBus);
    } else {
      boomGain.connect(this.mixer.bassBus);
    }
    boomOsc.start(now);
    boomOsc.stop(now + 0.80);

    // 2. Metallic Crash & DJ Scratch flair
    this.triggerCrash(now);
    this.triggerDJScratch('baby_scratch', now);
  }

  /**
   * Visceral Flat-Out WOT Attack Detonation
   * Fires immediate 808 Sub-Drop, Dual Rave Stabs, Chirp Scratch, and Crash
   */
  triggerFlatOutImpact(time, rootMidi = 50) {
    const ctx = this.ctx;
    const now = time || ctx.currentTime;

    // 1. Massive 808 Sub-Drop boom
    this.triggerDropImpact(now);

    // 2. Dual-octave Industrial Rave Chord Stab impact
    this.triggerStab(now, rootMidi, 1.0);
    this.triggerStab(now + 0.02, rootMidi + 12, 0.85);

    // 3. Fast Chirp Scratch & Crash Stinger
    this.triggerDJScratch('chirp', now);
    this.triggerCrash(now);

    // 4. Fast high-Q pitch riser pulse for instant adrenaline
    this.triggerRiser(now, 0.35);
  }
}

if (typeof globalThis !== 'undefined') {
  globalThis.TekuInstruments = TekuInstruments;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TekuInstruments };
}
