/**
 * TEKU DRIVE // MAIN MUSIC ENGINE
 * Orchestrates pure generative music based on the Teku-Ising acoustic reference.
 * Fully continuous gradient mapping from OBD vehicle telemetry to musical sound.
 */

if (typeof window === 'undefined' && typeof require !== 'undefined') {
  if (typeof TekuRNG === 'undefined') require('./rng.js');
  if (typeof TekuTheory === 'undefined') require('./theory.js');
  if (typeof TekuGenerator === 'undefined') require('./generator.js');
  if (typeof TekuMixer === 'undefined') require('./mixer.js');
  if (typeof TekuInstruments === 'undefined') require('./instruments.js');
  if (typeof TekuTelemetryMapper === 'undefined') require('./telemetry_mapper.js');
  if (typeof TekuArranger === 'undefined') require('./arranger.js');
}

class TekuMusicEngine {
  constructor() {
    this.ctx = null;
    this.isRunning = false;

    // Sub-systems
    this.rng = new TekuRNG();
    this.generator = new TekuGenerator(this.rng);
    this.mixer = null;
    this.instruments = null;
    this.telemetryMapper = new TekuTelemetryMapper();
    this.arranger = null;

    // Lookahead Sequencer Clock
    this.currentStep = 0;
    this.bar = 1;
    this.nextNoteTime = 0.0;
    this.scheduleAheadSec = 0.12;
    this.lookaheadMs = 25.0;
    this.timerID = null;

    this.bpm = 136; // Calibrated to Teku-Ising ground truth
    this.stepCount = 16;

    // Telemetry Cache
    this.latestTelemetry = {
      rpm: 750,
      speed: 0,
      throttle: 13,
      lateralG: 0,
      temp: 88
    };

    this.telemetryState = {
      energy: 0.0,
      gradients: {
        bass: 1.0,
        drumsKickHat: 0.0,
        drumsFull: 0.0,
        stabs: 0.0,
        hook: 0.0,
        drumCutoff: 320,
        thermal: 0.5
      },
      dTPS: 0,
      events: [],
      smoothed: { rpm: 750, speed: 0, throttle: 13, lateralG: 0, temp: 88 }
    };
  }

  init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioCtx();

    this.mixer = new TekuMixer(this.ctx);
    this.instruments = new TekuInstruments(this.ctx, this.mixer);
    this.arranger = new TekuArranger(this.generator, this.instruments, this.mixer);
    this.bpm = this.generator.session.baseBpm || 136;
  }

  setSeed(seed) {
    this.generator.generateNewSession(seed);
    this.bpm = this.generator.session.baseBpm || 136;
    if (this.arranger) {
      this.arranger.currentBar = 1;
      this.arranger.isPendingDrop = false;
    }
  }

  start() {
    if (!this.ctx) this.init();
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isRunning = true;
    this.currentStep = 0;
    this.bar = 1;
    this.nextNoteTime = this.ctx.currentTime + 0.05;

    // Update telemetry state immediately
    this.updateTelemetry(
      this.latestTelemetry.rpm,
      this.latestTelemetry.speed,
      this.latestTelemetry.throttle,
      this.latestTelemetry.lateralG,
      this.latestTelemetry.temp
    );

    this.scheduler();
  }

  stop() {
    this.isRunning = false;
    if (this.timerID) {
      clearTimeout(this.timerID);
      this.timerID = null;
    }
    if (this.mixer && this.mixer.masterGain && this.ctx) {
      this.mixer.masterGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
    }
  }

  /**
   * Primary Telemetry Ingestion API (Maintains exact signature for live OBD & Replay)
   */
  updateTelemetry(rpm, speed, throttle, lateralG, temp = 88) {
    this.latestTelemetry = { rpm, speed, throttle, lateralG, temp };

    // Update mapper (computes continuous gradients & events)
    this.telemetryState = this.telemetryMapper.update(rpm, speed, throttle, lateralG, temp);

    // Dynamic Tempo micro-nudging (Centering at 136 BPM, ±4 BPM with speed gradient)
    const speedRatio = Math.min(1.0, speed / 110.0);
    this.bpm = (this.generator.session.baseBpm || 136) + (speedRatio * 4.0);

    // Apply continuous lateral panning
    if (this.mixer) {
      this.mixer.updateLateralPan(lateralG);
      this.mixer.updateThermalDistortion(temp);
    }
  }

  scheduler() {
    if (!this.isRunning) return;

    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadSec) {
      this.arranger.scheduleStep(this.currentStep, this.bar, this.nextNoteTime, this.telemetryState);
      this.advanceStep();
    }

    this.timerID = setTimeout(() => this.scheduler(), this.lookaheadMs);
  }

  triggerBridgeNow() {
    this.bar = 9;
    this.currentStep = 0;
    if (this.arranger) {
      this.arranger.currentBar = 9;
    }
  }

  advanceStep() {
    const secondsPerBeat = 60.0 / this.bpm;
    const secondsPer16th = secondsPerBeat / 4.0;
    this.nextNoteTime += secondsPer16th;

    this.currentStep++;
    if (this.currentStep >= this.stepCount) {
      this.currentStep = 0;
      this.bar++;
      if (this.bar > 16) {
        this.bar = 1;
      }
      // Evolutionary 8-bar mutation: slightly mutates 1-2 steps every 8 bars like a DJ working the track
      if (this.bar % 8 === 1) {
        this.generator.mutateSession();
      }
    }
  }
}

if (typeof globalThis !== 'undefined') {
  globalThis.TekuMusicEngine = TekuMusicEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TekuMusicEngine };
}
