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

    // ========================================================
    // A. PHYSICAL SUB-BASS FOUNDATION (The 42 - 82 Hz Sweet Spot)
    // ========================================================
    // Fold frequency down into the physical sub-bass range (42 - 82 Hz)
    // Never allows subsonic inaudible rumble (<40 Hz) or weak bass
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
    subSine.frequency.setValueAtTime(subStartFreq, now);

    // 2. Secondary Triangle Sub Oscillator (Analog acoustic body warmth)
    const subTri = ctx.createOscillator();
    subTri.type = 'triangle';
    subTri.frequency.setValueAtTime(subStartFreq, now);

    if (hasSlide) {
      subSine.frequency.exponentialRampToValueAtTime(subEndFreq, now + 0.08);
      subTri.frequency.exponentialRampToValueAtTime(subEndFreq, now + 0.08);
    }

    // Dedicated Sub Lowpass Filter (gentle 115 Hz cutoff, flat 0.707 Q, no mid-peaking)
    const subFilter = ctx.createBiquadFilter();
    subFilter.type = 'lowpass';
    subFilter.frequency.setValueAtTime(115, now);
    subFilter.Q.setValueAtTime(0.707, now);

    // Sub Amplitude VCA (Massive sub presence, punchy 5ms attack, solid sustain)
    const subGain = ctx.createGain();
    const subPeak = Math.min(1.40, isAccent ? vel * 1.55 : vel * 1.30);
    subGain.gain.setValueAtTime(0.001, now);
    subGain.gain.linearRampToValueAtTime(subPeak, now + 0.005);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 1.08);

    subSine.connect(subFilter);
    subTri.connect(subFilter);
    subFilter.connect(subGain);

    // Connect Sub directly to uncompromised subBassBus (rock-solid mono, full clean headroom)
    if (this.mixer.subBassBus) {
      subGain.connect(this.mixer.subBassBus);
    } else {
      subGain.connect(this.mixer.bassBus);
    }

    // ========================================================
    // B. TEKU / ROLAND TB-303 MID-BASS GRIT (Harmonics 90 - 450 Hz)
    // ========================================================
    const saw1 = ctx.createOscillator();
    const saw2 = ctx.createOscillator();
    saw1.type = 'sawtooth';
    saw2.type = 'sawtooth';

    saw1.frequency.setValueAtTime(targetFreq, now);
    saw2.frequency.setValueAtTime(targetFreq, now);

    if (hasSlide) {
      saw1.frequency.exponentialRampToValueAtTime(freq, now + 0.08);
      saw2.frequency.exponentialRampToValueAtTime(freq, now + 0.08);
    }
    this.lastBassFreq = freq;

    // Analog chorus detune (+/- 5 cents)
    saw1.detune.setValueAtTime(5, now);
    saw2.detune.setValueAtTime(-5, now);

    // Resonant Lowpass Filter for the mid-grit sweep
    const midFilter = ctx.createBiquadFilter();
    midFilter.type = 'lowpass';
    const baseCutoff = isAccent ? 460 : 300;
    midFilter.frequency.setValueAtTime(baseCutoff * 1.8, now);
    midFilter.frequency.exponentialRampToValueAtTime(baseCutoff, now + duration * 0.65);
    midFilter.Q.setValueAtTime(isAccent ? 2.4 : 1.8, now);

    // Mid-Saw VCA (balanced so it adds bite without drowning out the sub-bass)
    const midGain = ctx.createGain();
    const midPeak = isAccent ? vel * 0.42 : vel * 0.32;
    midGain.gain.setValueAtTime(0.001, now);
    midGain.gain.linearRampToValueAtTime(midPeak, now + 0.006);
    midGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    saw1.connect(midFilter);
    saw2.connect(midFilter);
    midFilter.connect(midGain);

    if (this.mixer.midBassBus) {
      midGain.connect(this.mixer.midBassBus);
    } else {
      midGain.connect(this.mixer.bassBus);
    }

    // Start all 4 oscillators together
    subSine.start(now);
    subTri.start(now);
    saw1.start(now);
    saw2.start(now);

    const stopTime = now + duration + 0.04;
    subSine.stop(stopTime);
    subTri.stop(stopTime);
    saw1.stop(stopTime);
    saw2.stop(stopTime);
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
}

if (typeof globalThis !== 'undefined') {
  globalThis.TekuInstruments = TekuInstruments;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TekuInstruments };
}
