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
    this.lastSpeed = 0;
    this.lastThrottle = 13;
    this.lastTime = (typeof performance !== 'undefined') ? performance.now() : Date.now();

    this.dTPS = 0; // Throttle velocity (%/s)
    this.dSpeed = 0; // Speed acceleration / deceleration rate (km/h per s)
    this.energyScore = 0.0; // Continuous 0.0 to 1.0

    // Continuous Layer Volume Gradients (0.0 to 1.0)
    this.gradients = {
      bass: 1.0,         // Always 100% active (The continuous foundation)
      drumsKickHat: 0.0, // Swells in smoothly between 4 and 20 km/h
      drumsFull: 0.0,    // Swells in between 18 and 48 km/h
      stabs: 0.0,        // Swells in between 32 and 74 km/h (boosted by energy)
      hook: 0.0,         // Swells in between 38 and 82 km/h (or RPM > 2350)
      upperMadness: 0.0, // High-register Tech-Trance Arp & Acid madness (22 to 85 km/h + RPM/Throttle)
      tranceBridge: 0.0, // Anti-fatigue Trance Bridge swell when coasting at speed or during bridge bars
      drumCutoff: 300,   // Lowpass sweep from 300 Hz up to 14000 Hz
      thermal: 0.5       // 0.0 (cold) -> 0.5 (warm 88C) -> 1.0 (hot 105C)
    };

    this.events = [];
  }

  update(rpm, speed, throttle, lateralG, temp = 88) {
    const now = (typeof performance !== 'undefined') ? performance.now() : Date.now();
    const dt = Math.max(0.015, (now - this.lastTime) / 1000.0);
    this.lastTime = now;

    // 1. Compute Derivatives (Throttle Velocity %/s and Speed Acceleration/Deceleration km/h/s)
    const rawDTPS = (throttle - this.lastThrottle) / dt;
    this.dTPS = Math.max(-250, Math.min(300, rawDTPS));

    const rawDSpeed = (speed - this.lastSpeed) / dt;
    this.dSpeed = Math.max(-100, Math.min(100, rawDSpeed));

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

    // 6B. Deceleration Detection (Vehicle slowing down / braking)
    if (this.dSpeed < -3.5 && speed > 10) {
      this.events.push('DECELERATING');
    }

    this.lastRpm = rpm;
    this.lastSpeed = speed;
    this.lastThrottle = throttle;

    // 7. Calculate Continuous Energy Gradient (0.0 to 1.0)
    const normRpm = Math.max(0, Math.min(1, (this.smoothed.rpm - 750) / (3800 - 750)));
    const normTps = this.smoothed.throttle / 100.0;
    const normDtps = Math.max(0, this.dTPS / 140.0);
    const normG = Math.min(1, Math.abs(this.smoothed.lateralG) / 0.35);

    this.energyScore = (0.40 * normRpm) + (0.30 * normTps) + (0.20 * normDtps) + (0.10 * normG);
    this.energyScore = Math.max(0, Math.min(1, this.energyScore));

    // 8. Compute Continuous Audio Layer Gradients
    // Speed (s) acts as the Macro Motion / State Detector:
    // - Stopped (0 - 4 km/h): Pure sub-bass foundation alone
    // - Rolling (4 - 16 km/h): Kick & hat phase in smoothly
    // - City Cruise (14 - 36 km/h): Full breakbeat snare & groove
    // - Legal Speed Ceiling (by 55-60 km/h): All speed punch (stabs, hook, upper madness, 14kHz drum cutoff) is 100% fully unlocked!
    // No musical content is locked behind illegal speeds (> 60 km/h) for driver safety.
    const s = this.smoothed.speed;

    // A. Kick & Hi-Hat Swell (4 to 16 km/h)
    if (s <= 4.0) {
      this.gradients.drumsKickHat = 0.0;
    } else if (s >= 16.0) {
      this.gradients.drumsKickHat = 1.0;
    } else {
      const t = (s - 4.0) / 12.0;
      this.gradients.drumsKickHat = Math.pow(t, 1.35); // Smooth organic swell
    }

    // B. Full Breakbeat & Snare Swell (14 to 36 km/h)
    if (s <= 14.0) {
      this.gradients.drumsFull = 0.0;
    } else if (s >= 36.0) {
      this.gradients.drumsFull = 1.0;
    } else {
      const t = (s - 14.0) / 22.0;
      this.gradients.drumsFull = Math.pow(t, 1.25);
    }

    // C. Industrial Stabs Swell (22 to 52 km/h + Energy Boost)
    if (s <= 4.0) {
      this.gradients.stabs = 0.0;
    } else {
      let stabBase = 0.0;
      if (s > 22.0) {
        stabBase = Math.min(1.0, (s - 22.0) / 30.0);
      }
      this.gradients.stabs = Math.min(1.0, (stabBase * 0.72) + (this.energyScore * 0.28));
    }

    // D. Teku Synth Hook Ostinato Swell (26 to 56 km/h or RPM > 2200)
    if (s <= 4.0) {
      this.gradients.hook = 0.0;
    } else {
      let hookSpeed = s > 26.0 ? Math.pow(Math.min(1.0, (s - 26.0) / 30.0), 1.25) : 0.0;
      let hookRpm = this.smoothed.rpm > 2200 ? Math.min(1.0, (this.smoothed.rpm - 2200) / 1000.0) : 0.0;
      this.gradients.hook = Math.max(hookSpeed, hookRpm);
    }

    // D2. Upper Madness Gradient ("Locura Arriba" - Tech-Trance Arp, Acid Screamer & 32nd Hat Ratchets)
    if (s <= 4.0) {
      this.gradients.upperMadness = 0.0;
    } else {
      const speedMadness = s > 20.0 ? Math.pow(Math.min(1.0, (s - 20.0) / 36.0), 1.15) : 0.0;
      const rpmMadness = this.smoothed.rpm > 1950 ? Math.min(1.0, (this.smoothed.rpm - 1950) / 1350.0) : 0.0;
      this.gradients.upperMadness = Math.min(1.0, Math.max(speedMadness * 0.78 + this.energyScore * 0.35, rpmMadness));
    }

    // D3. Anti-Fatigue Trance Bridge Gradient
    // Swells smoothly when coasting at speed (low throttle) OR actively decelerating/braking
    const isCoasting = s > 18.0 && this.smoothed.throttle < 19.0;
    const isDecelerating = s > 15.0 && this.dSpeed < -2.0;
    if (isCoasting || isDecelerating) {
      const throttleFactor = Math.min(1.0, Math.max(0, (20.0 - this.smoothed.throttle) / 10.0));
      const speedFactor = Math.min(1.0, Math.max(0, (s - 15.0) / 25.0));
      const decelFactor = Math.min(1.0, Math.max(0, -this.dSpeed / 10.0));
      const bridgeFactor = Math.max(throttleFactor * speedFactor, decelFactor * 0.85);
      this.gradients.tranceBridge = Math.min(1.0, (this.gradients.tranceBridge || 0) * 0.75 + bridgeFactor * 0.25);
    } else {
      this.gradients.tranceBridge = Math.max(0.0, (this.gradients.tranceBridge || 0) * 0.70);
    }

    // E. Continuous Drum Lowpass Filter Cutoff Sweep (320 Hz when stopped -> 14,000 Hz at 58-60 km/h)
    const speedRatio = Math.min(1.0, Math.max(0, s / 58.0));
    this.gradients.drumCutoff = 320 + Math.pow(speedRatio, 1.25) * (14000 - 320);

    // E2. Continuous Bass Filter Cutoff Boost (0 Hz at idle -> +620 Hz at peak energy)
    this.gradients.bassCutoffBoost = Math.round(Math.pow(this.energyScore, 1.15) * 620);

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
