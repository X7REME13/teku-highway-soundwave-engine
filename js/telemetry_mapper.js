/**
 * TEKU DRIVE // TELEMETRY MAPPER MODULE
 * Translates raw vehicle OBD telemetry into continuous smooth gradients (0.0 to 1.0)
 * and detected driving events (shifts, throttle stabs).
 *
 * ZERO BINARY STEPS: Everything is a smooth mathematical gradient to prevent
 * jarring transitions and create an organic, living soundtrack.
 */

class TekuTelemetryMapper {
  constructor() {
    this.raw = { rpm: 750, speed: 0, throttle: 13, lateralG: 0, temp: 88 };
    this.smoothed = { rpm: 750, speed: 0, throttle: 13, lateralG: 0, temp: 88 };

    this.lastRpm = 750;
    this.lastThrottle = 13;
    this.lastTime = (typeof performance !== 'undefined') ? performance.now() : Date.now();

    this.dTPS = 0; // Throttle velocity (%/s)
    this.energyScore = 0.0; // Continuous 0.0 to 1.0

    // Continuous Layer Volume Gradients (0.0 to 1.0)
    this.gradients = {
      bass: 1.0,         // Always 100% active (The continuous foundation)
      drumsKickHat: 0.0, // Swells in smoothly between 4 and 20 km/h
      drumsFull: 0.0,    // Swells in between 18 and 48 km/h
      stabs: 0.0,        // Swells in between 42 and 76 km/h (boosted by energy)
      hook: 0.0,         // Swells in between 72 and 110 km/h (or RPM > 2900)
      drumCutoff: 300,   // Lowpass sweep from 300 Hz up to 14000 Hz
      thermal: 0.5       // 0.0 (cold) -> 0.5 (warm 88C) -> 1.0 (hot 105C)
    };

    this.events = [];
  }

  update(rpm, speed, throttle, lateralG, temp = 88) {
    const now = (typeof performance !== 'undefined') ? performance.now() : Date.now();
    const dt = Math.max(0.015, (now - this.lastTime) / 1000.0);
    this.lastTime = now;

    // 1. Compute Derivatives (Throttle Velocity %/s)
    const rawDTPS = (throttle - this.lastThrottle) / dt;
    this.dTPS = Math.max(-250, Math.min(300, rawDTPS));

    // 2. Smooth Values with 1-Pole Lowpass Filter
    const alpha = 0.30;
    this.smoothed.rpm += alpha * (rpm - this.smoothed.rpm);
    this.smoothed.speed += alpha * (speed - this.smoothed.speed);
    this.smoothed.throttle += alpha * (throttle - this.smoothed.throttle);
    this.smoothed.lateralG += alpha * (lateralG - this.smoothed.lateralG);
    this.smoothed.temp += alpha * (temp - this.smoothed.temp);

    this.raw = { rpm, speed, throttle, lateralG, temp };

    // 3. Clear transient events from previous tick
    this.events = [];

    // 4. Shift Detection (Clio 1.2 specific: RPM drops > 400 under low throttle at speed)
    const rpmDelta = rpm - this.lastRpm;
    if (this.lastRpm > 2000 && rpmDelta < -400 && throttle < 20 && speed > 15) {
      this.events.push('SHIFT');
    }

    // 5. Throttle Kick / Stab Detection (Sudden floor down > 90%/s)
    if (this.dTPS > 90) {
      this.events.push('THROTTLE_STAB');
    }

    // 6. Lift-off Detection
    if (this.dTPS < -100 && throttle < 15) {
      this.events.push('LIFT_OFF');
    }

    this.lastRpm = rpm;
    this.lastThrottle = throttle;

    // 7. Calculate Continuous Energy Gradient (0.0 to 1.0)
    const normRpm = Math.max(0, Math.min(1, (this.smoothed.rpm - 750) / (3800 - 750)));
    const normTps = this.smoothed.throttle / 100.0;
    const normDtps = Math.max(0, this.dTPS / 140.0);
    const normG = Math.min(1, Math.abs(this.smoothed.lateralG) / 0.35);

    this.energyScore = (0.40 * normRpm) + (0.30 * normTps) + (0.20 * normDtps) + (0.10 * normG);
    this.energyScore = Math.max(0, Math.min(1, this.energyScore));

    // 8. Compute Continuous Audio Layer Gradients (Smooth S-Curves / Power Laws)
    const s = this.smoothed.speed;

    // A. Kick & Hi-Hat Swell (4 to 20 km/h)
    if (s <= 4.0) {
      this.gradients.drumsKickHat = 0.0;
    } else if (s >= 20.0) {
      this.gradients.drumsKickHat = 1.0;
    } else {
      const t = (s - 4.0) / 16.0;
      this.gradients.drumsKickHat = Math.pow(t, 1.35); // Smooth organic swell
    }

    // B. Full Breakbeat & Snare Swell (18 to 48 km/h)
    if (s <= 18.0) {
      this.gradients.drumsFull = 0.0;
    } else if (s >= 48.0) {
      this.gradients.drumsFull = 1.0;
    } else {
      const t = (s - 18.0) / 30.0;
      this.gradients.drumsFull = Math.pow(t, 1.25);
    }

    // C. Industrial Stabs Swell (40 to 76 km/h + Energy Boost)
    if (s <= 4.0) {
      this.gradients.stabs = 0.0;
    } else {
      let stabBase = 0.0;
      if (s > 40.0) {
        stabBase = Math.min(1.0, (s - 40.0) / 36.0);
      }
      this.gradients.stabs = Math.min(1.0, (stabBase * 0.7) + (this.energyScore * 0.3));
    }

    // D. Peak Hook Swell (72 to 110 km/h or RPM > 2900)
    if (s <= 4.0) {
      this.gradients.hook = 0.0;
    } else {
      let hookSpeed = s > 72.0 ? Math.min(1.0, (s - 72.0) / 38.0) : 0.0;
      let hookRpm = this.smoothed.rpm > 2900 ? Math.min(1.0, (this.smoothed.rpm - 2900) / 800.0) : 0.0;
      this.gradients.hook = Math.max(hookSpeed, hookRpm);
    }

    // E. Continuous Drum Lowpass Filter Cutoff Sweep (320 Hz when stopped -> 14,000 Hz at 85 km/h)
    const speedRatio = Math.min(1.0, Math.max(0, s / 85.0));
    this.gradients.drumCutoff = 320 + Math.pow(speedRatio, 1.25) * (14000 - 320);

    // F. Continuous Thermal Gradient (0.0 at <=40°C, 0.5 at 88°C, 1.0 at >=104°C)
    const curTemp = this.smoothed.temp;
    if (curTemp <= 40) {
      this.gradients.thermal = 0.0;
    } else if (curTemp >= 104) {
      this.gradients.thermal = 1.0;
    } else if (curTemp <= 88) {
      this.gradients.thermal = Math.max(0, (curTemp - 40.0) / 96.0); // 0.0 -> 0.50
    } else {
      this.gradients.thermal = Math.min(1.0, 0.50 + ((curTemp - 88.0) / 16.0) * 0.50); // 0.50 -> 1.0
    }

    return {
      energy: this.energyScore,
      gradients: this.gradients,
      dTPS: this.dTPS,
      events: this.events,
      smoothed: this.smoothed
    };
  }
}

if (typeof globalThis !== 'undefined') {
  globalThis.TekuTelemetryMapper = TekuTelemetryMapper;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TekuTelemetryMapper };
}
