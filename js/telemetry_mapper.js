/**
 * TEKU DRIVE // TELEMETRY MAPPER MODULE
 * Translates raw vehicle OBD telemetry into continuous smooth gradients (0.0 to 1.0)
 * and detected driving events (shifts, throttle stabs).
 *
 * ZERO BINARY STEPS: Everything is a smooth mathematical gradient to prevent
 * jarring transitions and create an organic, living soundtrack.
 */

// Throttle calibration (Renault Clio Mio 1.2 D4F / drive-by-wire electronic throttle body)
// Raw OBD-II PID 0111 reports throttle plate angle, not pedal potentiometer.
// Closed pedal (idle air control) baseline: ~12.5% to 14.0% (calibrated to 13.0%).
// Wide-open throttle ceiling: ~82.0% to 85.0%.
const IDLE_TPS_BASELINE = 13.0;
const WOT_TPS_CEILING = 82.0;

function calcEffectiveThrottle(rawTps) {
  if (rawTps <= IDLE_TPS_BASELINE) return 0.0;
  if (rawTps >= WOT_TPS_CEILING) return 100.0;
  return ((rawTps - IDLE_TPS_BASELINE) / (WOT_TPS_CEILING - IDLE_TPS_BASELINE)) * 100.0;
}

class TekuTelemetryMapper {
  constructor() {
    this.raw = { rpm: 750, speed: 0, throttle: 13, lateralG: 0, temp: 88, effectiveThrottle: 0 };
    this.smoothed = { rpm: 750, speed: 0, throttle: 13, lateralG: 0, temp: 88, effectiveThrottle: 0 };

    this.lastRpm = 750;
    this.lastSpeed = 0;
    this.lastThrottle = 13;
    this.lastEffectiveThrottle = 0;
    this.lastTime = (typeof performance !== 'undefined') ? performance.now() : Date.now();

    this.dTPS = 0; // Throttle velocity (%/s)
    this.dEffectiveTPS = 0; // Effective throttle velocity (%/s)
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
      drumCutoff: 320,   // Lowpass sweep from 320 Hz up to 14000 Hz
      thermal: 0.5,      // 0.0 (cold) -> 0.5 (warm 88C) -> 1.0 (hot 105C)
      thermalCold: 0.0,  // 1.0 at cold start (<=25C) -> 0.0 at operating temp (>=68C)
      thermalHot: 0.0,   // 0.0 at cruise (<=88C) -> 1.0 at spicy/fan threshold (>=102C)
      flatOut: 0.0,      // 0.0 (cruise) -> 1.0 (instant WOT floor / throttle stab attack)
      isIdle: true,      // true when vehicle is stopped (speed <= 4 km/h)
      idleRev: 0.0       // 0.0 (idle 750 RPM) -> 1.0 (neutral rev blip 2500+ RPM)
    };

    this.flatOutHold = 0.0;
    this.events = [];
  }

  update(rpm, speed, throttle, lateralG, temp = 88) {
    const now = (typeof performance !== 'undefined') ? performance.now() : Date.now();
    const dt = Math.max(0.015, (now - this.lastTime) / 1000.0);
    this.lastTime = now;

    const effectiveThrottle = calcEffectiveThrottle(throttle);

    // 1. Compute Derivatives (Throttle Velocity %/s and Speed Acceleration/Deceleration km/h/s)
    const rawDTPS = (throttle - this.lastThrottle) / dt;
    this.dTPS = Math.max(-250, Math.min(300, rawDTPS));

    const rawDEffTPS = (effectiveThrottle - this.lastEffectiveThrottle) / dt;
    this.dEffectiveTPS = Math.max(-300, Math.min(350, rawDEffTPS));

    const rawDSpeed = (speed - this.lastSpeed) / dt;
    this.dSpeed = Math.max(-100, Math.min(100, rawDSpeed));

    // 2. Smooth Values with Asymmetric 1-Pole Lowpass Filter
    // When driver floors it (throttle >= 70% or dTPS > 65), fast-attack alpha engages (alpha = 0.78)
    const isFastAttack = (throttle >= 70) || (effectiveThrottle >= 65) || (rawDTPS > 65);
    const alphaTps = isFastAttack ? 0.78 : 0.30;
    const alphaRpm = isFastAttack ? 0.65 : 0.30;
    const alpha = 0.30;

    this.smoothed.rpm += alphaRpm * (rpm - this.smoothed.rpm);
    this.smoothed.speed += alpha * (speed - this.smoothed.speed);
    this.smoothed.throttle += alphaTps * (throttle - this.smoothed.throttle);
    this.smoothed.effectiveThrottle = (this.smoothed.effectiveThrottle !== undefined ? this.smoothed.effectiveThrottle : effectiveThrottle) + alphaTps * (effectiveThrottle - (this.smoothed.effectiveThrottle !== undefined ? this.smoothed.effectiveThrottle : effectiveThrottle));
    this.smoothed.lateralG += alpha * (lateralG - this.smoothed.lateralG);
    this.smoothed.temp += alpha * (temp - this.smoothed.temp);

    this.raw = { rpm, speed, throttle, lateralG, temp, effectiveThrottle };

    // 3. Clear transient events from previous tick
    this.events = [];

    // 4. Shift Detection (Clio 1.2 specific: RPM drops > 400 under low throttle at speed)
    const rpmDelta = rpm - this.lastRpm;
    if (this.lastRpm > 2000 && rpmDelta < -400 && (effectiveThrottle < 18 || throttle < 20) && speed > 15) {
      this.events.push('SHIFT');
    }

    // 5. Throttle Kick / Stab Detection (Sudden floor down > 75%/s or snap from <60% to >=80%)
    if (this.dTPS > 75 || this.dEffectiveTPS > 90 || (throttle >= 80 && this.lastThrottle < 60) || (effectiveThrottle >= 80 && this.lastEffectiveThrottle < 45)) {
      this.events.push('THROTTLE_STAB');
    }

    // 6. Lift-off Detection
    if ((this.dTPS < -100 || this.dEffectiveTPS < -120) && (effectiveThrottle < 10 || throttle < 15)) {
      this.events.push('LIFT_OFF');
    }

    // 6B. Deceleration Detection (Vehicle slowing down / braking)
    if (this.dSpeed < -3.5 && speed > 10) {
      this.events.push('DECELERATING');
    }

    // 6C. Coasting Detection (Cruising at speed >= 14 km/h with foot off throttle or steady deceleration)
    const isCoasting = speed >= 14.0 && (effectiveThrottle <= 8.0 || this.smoothed.effectiveThrottle <= 8.0 || this.dSpeed < -1.5);
    if (isCoasting) {
      this.events.push('COASTING');
    }

    // 6D. Neutral Rev blip detection when stopped
    const isStopped = speed <= 4.0;
    let idleRevFactor = 0.0;
    if (isStopped) {
      const rpmBlip = Math.max(0.0, Math.min(1.0, (this.smoothed.rpm - 750) / 1800.0));
      const tpsBlip = effectiveThrottle > 6.0 ? Math.min(1.0, effectiveThrottle / 60.0) : 0.0;
      idleRevFactor = Math.min(1.0, Math.max(rpmBlip, tpsBlip));
      if (idleRevFactor > 0.25 || this.events.includes('THROTTLE_STAB')) {
        this.events.push('IDLE_REV');
      }
    }

    this.lastRpm = rpm;
    this.lastSpeed = speed;
    this.lastThrottle = throttle;
    this.lastEffectiveThrottle = effectiveThrottle;

    // 7. Calculate Continuous Energy Gradient (0.0 to 1.0)
    // Uses normalized effective throttle so 13% idle TPS does not falsely contribute energy
    const normRpm = Math.max(0, Math.min(1, (this.smoothed.rpm - 750) / (3800 - 750)));
    const normTps = Math.min(1.0, Math.max(0, this.smoothed.effectiveThrottle / 100.0));
    const normDtps = Math.max(0, this.dTPS / 140.0);
    const normG = Math.min(1, Math.abs(this.smoothed.lateralG) / 0.35);

    this.energyScore = (0.40 * normRpm) + (0.30 * normTps) + (0.20 * normDtps) + (0.10 * normG);
    this.energyScore = Math.max(0, Math.min(1, this.energyScore));

    // 7B. Flat-Out WOT Attack Calculation (Instantaneous visceral response!)
    const isWOT = (effectiveThrottle >= 75) || (this.smoothed.effectiveThrottle >= 70) || (throttle >= 72);
    if (isWOT || this.events.includes('THROTTLE_STAB')) {
      this.flatOutHold = Math.min(1.0, (this.flatOutHold || 0) + 0.65);
      if (effectiveThrottle >= 90 || throttle >= 85) this.flatOutHold = 1.0;
    } else {
      this.flatOutHold = Math.max(0.0, (this.flatOutHold || 0) * 0.72);
    }
    this.gradients.flatOut = Math.max(0.0, Math.min(1.0, this.flatOutHold));

    // 8. Compute Continuous Audio Layer Gradients
    // Speed (s) acts as the Macro Motion / State Detector:
    // - Stopped (0 - 4 km/h): Pure sub-bass foundation alone + warm idle ambiance
    // - Rolling (4 - 16 km/h): Kick & hat phase in smoothly
    // - City Cruise (14 - 36 km/h): Full breakbeat snare & groove
    // - Legal Speed Ceiling (by 55-60 km/h): All speed punch is 100% fully unlocked!
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
    const smoothedEff = this.smoothed.effectiveThrottle || 0;
    const isSmoothCoasting = s >= 14.0 && (smoothedEff <= 8.0 || this.dSpeed < -1.5);
    const isDecel = s > 12.0 && this.dSpeed < -2.0;

    if (isSmoothCoasting || isDecel || isCoasting) {
      const throttleFactor = Math.min(1.0, Math.max(0, (12.0 - smoothedEff) / 12.0));
      const speedFactor = Math.min(1.0, Math.max(0, (s - 12.0) / 24.0));
      const decelFactor = Math.min(1.0, Math.max(0, -this.dSpeed / 8.0));
      const bridgeFactor = Math.max(throttleFactor * speedFactor, decelFactor * 0.85);
      this.gradients.tranceBridge = Math.min(1.0, (this.gradients.tranceBridge || 0) * 0.70 + Math.max(0.40, bridgeFactor) * 0.30);
    } else {
      this.gradients.tranceBridge = Math.max(0.0, (this.gradients.tranceBridge || 0) * 0.70);
    }

    // Idle Cockpit & Neutral Rev Gradients
    this.gradients.isIdle = isStopped;
    this.gradients.idleRev = idleRevFactor;

    // E. Continuous Drum Lowpass Filter Cutoff Sweep (320 Hz when stopped -> 14,000 Hz at 58-60 km/h)
    // FLAT-OUT ATTACK OVERRIDE: Instant bypass to 14 kHz even at low speeds so floor-down launches rip through!
    // IDLE REV SWELL: When blipping throttle in neutral at 0 km/h, drum cutoff sweeps 320 Hz -> 3120 Hz
    const speedRatio = Math.min(1.0, Math.max(0, s / 58.0));
    const speedCutoff = 320 + Math.pow(speedRatio, 1.25) * (14000 - 320);
    const flatOutCutoff = (this.gradients.flatOut || 0) * 14000;
    const idleRevCutoff = isStopped ? (320 + idleRevFactor * 2800) : 0;
    this.gradients.drumCutoff = Math.min(14000, Math.round(Math.max(speedCutoff, flatOutCutoff, idleRevCutoff)));

    // E2. Continuous Bass Filter Cutoff Boost (0 Hz at idle -> +620 Hz at peak energy + flatOut boost)
    this.gradients.bassCutoffBoost = Math.round(Math.pow(this.energyScore, 1.15) * 620 + (this.gradients.flatOut || 0) * 380);

    // Flat-Out surge across upper synths and zeroing out trance bridge
    if (this.gradients.flatOut > 0.05) {
      this.gradients.stabs = Math.min(1.0, (this.gradients.stabs || 0) + this.gradients.flatOut * 0.75);
      this.gradients.hook = Math.min(1.0, (this.gradients.hook || 0) + this.gradients.flatOut * 0.85);
      this.gradients.upperMadness = Math.min(1.0, (this.gradients.upperMadness || 0) + this.gradients.flatOut * 0.95);
      this.gradients.tranceBridge = Math.max(0.0, (this.gradients.tranceBridge || 0) * (1.0 - this.gradients.flatOut));
    }

    // F. Continuous Thermal Gradients
    // curTemp: engine coolant temperature in °C
    // - thermal: generic 0.0 (<=40°C) -> 0.5 (88°C) -> 1.0 (>=104°C)
    // - thermalCold: 1.0 at cold start (<=25°C) -> 0.0 at operating temp (>=68°C)
    // - thermalHot: 0.0 at cruise (<=88°C) -> 1.0 at spicy/fan threshold (>=102°C)
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

    // Cold start profile factor (1.0 at <=25°C down to 0.0 at >=68°C)
    this.gradients.thermalCold = Math.max(0, Math.min(1.0, (68.0 - curTemp) / 43.0));

    // Hot spicy profile factor (0.0 at <=88°C up to 1.0 at >=102°C)
    this.gradients.thermalHot = Math.max(0, Math.min(1.0, (curTemp - 88.0) / 14.0));

    return {
      energy: this.energyScore,
      gradients: this.gradients,
      dTPS: this.dTPS,
      events: this.events,
      smoothed: this.smoothed,
      raw: this.raw
    };
  }
}

if (typeof globalThis !== 'undefined') {
  globalThis.TekuTelemetryMapper = TekuTelemetryMapper;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TekuTelemetryMapper };
}
