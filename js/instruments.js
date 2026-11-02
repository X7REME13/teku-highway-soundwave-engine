/**
 * TEKU DRIVE // INSTRUMENTS MODULE
 * Pure musical synthesizers calibrated to Teku-Ising acoustic DNA:
 * - Rolling Raw Sub/Mid Bass (Centerpiece, >94% energy under 250 Hz)
 * - Breakbeat Drum Kit (Kick, Snare, Ghost, Swung Hats, Crash)
 * - Industrial Rave Stabs
 * - Shirako DJ Turntable Vinyl Scratches
 * - Transition FX (Risers, Tape-stops, Sub drops)
 */

class TekuInstruments {
  constructor(ctx, mixer) {
    this.ctx = ctx;
    this.mixer = mixer;
    this.lastBassFreq = null;
  }

  // ==========================================
  // 1. THE TEKU RAW BASSLINE (Centerpiece Voice)
  // ==========================================
  triggerBass(freq, time, duration, vel = 0.85, isAccent = false, hasSlide = false) {
    const ctx = this.ctx;
    const now = time || ctx.currentTime;

    // Dual Detuned Sawtooth (Punchy mid-bass harmonics 80 - 250 Hz)
    const saw1 = ctx.createOscillator();
    const saw2 = ctx.createOscillator();
    saw1.type = 'sawtooth';
    saw2.type = 'sawtooth';

    // Sub-Bass Solid Foundation (40 - 70 Hz fundamental)
    const subOsc = ctx.createOscillator();
    subOsc.type = 'triangle';

    // Frequency & Portamento Slide
    const startFreq = (hasSlide && this.lastBassFreq) ? this.lastBassFreq : freq;
    saw1.frequency.setValueAtTime(startFreq, now);
    saw2.frequency.setValueAtTime(startFreq, now);
    subOsc.frequency.setValueAtTime(startFreq * 0.5, now); // Sub octave

    if (hasSlide) {
      saw1.frequency.exponentialRampToValueAtTime(freq, now + 0.08);
      saw2.frequency.exponentialRampToValueAtTime(freq, now + 0.08);
      subOsc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.08);
    }
    this.lastBassFreq = freq;

    // Micro-detune for analog width & thickness (+/- 6 cents)
    saw1.detune.setValueAtTime(6, now);
    saw2.detune.setValueAtTime(-6, now);

    // 24 dB/oct 4-Pole Low-Pass Filter
    const filter1 = ctx.createBiquadFilter();
    const filter2 = ctx.createBiquadFilter();
    filter1.type = 'lowpass';
    filter2.type = 'lowpass';

    const baseCutoff = isAccent ? 420 : 260; // Concentrated below 500 Hz!
    filter1.frequency.setValueAtTime(baseCutoff * 2.2, now);
    filter1.frequency.exponentialRampToValueAtTime(baseCutoff, now + duration * 0.6);
    filter1.Q.setValueAtTime(isAccent ? 5.5 : 3.2, now);

    filter2.frequency.setValueAtTime(baseCutoff * 2.0, now);
    filter2.frequency.exponentialRampToValueAtTime(baseCutoff, now + duration * 0.6);
    filter2.Q.setValueAtTime(isAccent ? 4.5 : 2.5, now);

    // Amplitude VCA Envelope
    const gain = ctx.createGain();
    const peakVol = Math.min(1.0, isAccent ? vel * 1.25 : vel);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(peakVol, now + 0.006); // Punchy 6ms attack
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Audio Routing: Oscillators -> Filters -> Gain -> Bass Bus
    saw1.connect(filter1);
    saw2.connect(filter1);
    subOsc.connect(filter1);
    filter1.connect(filter2);
    filter2.connect(gain);
    gain.connect(this.mixer.bassBus);

    saw1.start(now);
    saw2.start(now);
    subOsc.start(now);
    saw1.stop(now + duration + 0.02);
    saw2.stop(now + duration + 0.02);
    subOsc.stop(now + duration + 0.02);
  }

  // ==========================================
  // 2. BREAKBEAT DRUMS
  // ==========================================
  triggerKick(time, vel = 1.0) {
    const ctx = this.ctx;
    const now = time || ctx.currentTime;

    // Pitch envelope: 165 Hz punch dropping to 44 Hz sub-boom
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.setValueAtTime(165, now);
    osc.frequency.exponentialRampToValueAtTime(44, now + 0.042);

    gain.gain.setValueAtTime(vel * 1.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.30);

    osc.connect(gain);
    gain.connect(this.mixer.drumBus);

    // Sidechain Ducking: Momemtarily duck the bass bus on kick impact!
    this.mixer.triggerSidechain(now);

    osc.start(now);
    osc.stop(now + 0.32);
  }

  triggerSnare(time, vel = 1.0) {
    const ctx = this.ctx;
    const now = time || ctx.currentTime;

    // 1. Tonal Body (180 Hz drop to 80 Hz)
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.06);

    oscGain.gain.setValueAtTime(vel * 0.75, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(oscGain);

    // 2. Snappy Noise Wire (1,800 Hz Bandpass)
    const bufferSize = Math.floor(ctx.sampleRate * 0.18);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.Q.setValueAtTime(2.4, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(vel * 0.90, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    noise.connect(filter);
    filter.connect(noiseGain);

    oscGain.connect(this.mixer.drumBus);
    noiseGain.connect(this.mixer.drumBus);

    osc.start(now);
    noise.start(now);
    osc.stop(now + 0.14);
    noise.stop(now + 0.20);
  }

  triggerGhostSnare(time) {
    this.triggerSnare(time, 0.25);
  }

  triggerHat(time, isOpen = false, isAccent = false) {
    const ctx = this.ctx;
    const now = time || ctx.currentTime;
    const dur = isOpen ? 0.22 : 0.045;

    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(isOpen ? 7200 : 8800, now);

    const gain = ctx.createGain();
    const vol = isAccent ? 0.38 : (isOpen ? 0.32 : 0.18);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.mixer.drumBus);

    noise.start(now);
    noise.stop(now + dur + 0.01);
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
  // 3. INDUSTRIAL RAVE STABS (Sparse, Dark Minor Chords)
  // ==========================================
  triggerStab(time, rootMidi = 50) { // D3 base
    const ctx = this.ctx;
    const now = time || ctx.currentTime;
    const chordNotes = [rootMidi, rootMidi + 3, rootMidi + 7]; // Minor Triad

    chordNotes.forEach((midi, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      const freq = 440 * Math.pow(2, (midi - 69) / 12);
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime((idx - 1) * 8, now);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, now);
      filter.frequency.exponentialRampToValueAtTime(450, now + 0.24);
      filter.Q.setValueAtTime(4.0, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.mixer.stabBus);

      osc.start(now);
      osc.stop(now + 0.30);
    });
  }

  // ==========================================
  // 4. SHIRAKO TAKAMOTO TURNTABLE VINYL SCRATCHES
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
      // Forward push then backward pull
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

    } else { // 'tear'
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
  // 5. TRANSITION RISERS & DROPS
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
    gain.gain.setValueAtTime(0.001, now + duration); // Cut instantly right before drop downbeat!

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.mixer.fxBus);

    osc.start(now);
    osc.stop(now + duration);
  }

  triggerDropImpact(time) {
    this.triggerCrash(time);
    this.triggerDJScratch('baby_scratch', time);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TekuInstruments };
}
