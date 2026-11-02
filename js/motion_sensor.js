/**
 * TEKU DRIVE // REAL-TIME VEHICLE DYNAMICS MOTION SENSOR
 * Captures live lateral G-force and vehicle cornering from smartphone IMU
 * (accelerometer & gyroscope) for real-time stereo auto-panning and cockpit telemetry.
 *
 * Supports:
 * 1. Modern W3C LinearAccelerationSensor (Android Chrome high-performance sensor API)
 * 2. Standard DeviceMotionEvent with event.acceleration (dynamic linear acceleration)
 * 3. Fallback to event.accelerationIncludingGravity with dynamic gravity tracking
 * 4. iOS 13+ DeviceMotionEvent.requestPermission() user-activation flow
 * 5. Screen orientation auto-compensation (0° portrait, 90° landscape, 270° landscape, 180° inverted)
 * 6. Dynamic Mount Zero Calibration ("Tap to Zero G")
 */

class TekuMotionSensor {
  constructor(engine = null, onUpdate = null) {
    this.engine = engine;
    this.onUpdate = onUpdate;

    this.isSupported = (typeof window !== 'undefined' && ('DeviceMotionEvent' in window || 'LinearAccelerationSensor' in window));
    this.isSecureContext = (typeof window !== 'undefined' && Boolean(window.isSecureContext));
    this.isActive = false;
    this.permissionState = 'prompt'; // 'prompt', 'granted', 'denied', 'unsupported'

    // G-Force Readings
    this.rawLateralG = 0.0;
    this.smoothedLateralG = 0.0;
    this.zeroBias = 0.0; // Mount angle calibration offset

    // Sensor Telemetry & Diagnostics
    this.eventCount = 0;
    this.lastEventTime = 0;
    this.sampleRateHz = 0;
    this.sensorType = 'none'; // 'linear-sensor', 'devicemotion-linear', 'devicemotion-gravity'
    this.linearSensor = null;

    // Gravity tracker for dynamic leveling (low-pass filter on gravity vector)
    this.gravityFilter = { x: 0, y: 0, z: 9.8 };

    // Auto-init passive listener if permitted
    this.init();
  }

  /**
   * Safe screen orientation detection (modern ScreenOrientation API + legacy window.orientation fallback)
   */
  getOrientationAngle() {
    if (typeof window === 'undefined') return 0;
    if (window.screen && screen.orientation && typeof screen.orientation.angle === 'number') {
      return screen.orientation.angle;
    }
    if (typeof window.orientation === 'number') {
      return window.orientation;
    }
    return 0;
  }

  /**
   * Initialize sensor listeners
   */
  init() {
    if (typeof window === 'undefined') return;

    // Check if secure context is active
    if (!this.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      console.warn('[MotionSensor] Insecure context detected (HTTP over IP). Mobile Chrome blocks motion sensors on insecure origins.');
    }

    // Try modern W3C LinearAccelerationSensor (Android Chrome native)
    this.initLinearSensor();

    // Attach standard DeviceMotionEvent listener
    this.initDeviceMotion();
  }

  /**
   * Modern W3C LinearAccelerationSensor (Best on Android Chrome: delivers pure acceleration without gravity)
   */
  initLinearSensor() {
    if (typeof window === 'undefined' || typeof LinearAccelerationSensor === 'undefined') return;

    try {
      this.linearSensor = new LinearAccelerationSensor({ frequency: 50 });
      this.linearSensor.addEventListener('reading', () => {
        this.sensorType = 'linear-sensor';
        this.isActive = true;
        this.processLinearAccel(this.linearSensor.x, this.linearSensor.y);
      });
      this.linearSensor.addEventListener('error', (event) => {
        if (event.error.name === 'NotAllowedError') {
          this.permissionState = 'denied';
        }
      });
      this.linearSensor.start();
    } catch (e) {
      // LinearAccelerationSensor unavailable or requires explicit permission - fallback to devicemotion
    }
  }

  /**
   * Standard DeviceMotionEvent listener (Supported across all modern browsers)
   */
  initDeviceMotion() {
    if (typeof window === 'undefined' || !window.addEventListener) return;

    const onMotion = (event) => {
      // If modern LinearAccelerationSensor is already supplying readings, let it take precedence
      if (this.sensorType === 'linear-sensor' && this.eventCount > 10) return;

      this.isActive = true;
      this.eventCount++;
      const now = (typeof performance !== 'undefined') ? performance.now() : Date.now();
      if (this.lastEventTime > 0) {
        const dt = (now - this.lastEventTime) / 1000;
        if (dt > 0) {
          const instantHz = Math.round(1 / dt);
          this.sampleRateHz = Math.round(this.sampleRateHz * 0.9 + instantHz * 0.1);
        }
      }
      this.lastEventTime = now;

      // 1. Prefer pure dynamic linear acceleration if available (accelerometer + gyroscope sensor fusion)
      if (event.acceleration && (event.acceleration.x !== null || event.acceleration.y !== null)) {
        this.sensorType = 'devicemotion-linear';
        this.processLinearAccel(event.acceleration.x || 0, event.acceleration.y || 0);
        return;
      }

      // 2. Fallback to accelerationIncludingGravity with dynamic gravity tracking
      if (event.accelerationIncludingGravity) {
        const acc = event.accelerationIncludingGravity;
        if (acc.x !== null || acc.y !== null) {
          this.sensorType = 'devicemotion-gravity';
          this.processGravityAccel(acc.x || 0, acc.y || 0, acc.z || 9.8);
        }
      }
    };

    window.addEventListener('devicemotion', onMotion, { passive: true });
  }

  /**
   * Process dynamic linear acceleration (gravity already removed by sensor fusion)
   */
  processLinearAccel(ax, ay) {
    const angle = this.getOrientationAngle();
    let rawG = 0;

    // Map axes according to screen rotation
    if (angle === 90) {
      // Landscape right: Y axis is lateral
      rawG = (ay / 9.81);
    } else if (angle === 270 || angle === -90) {
      // Landscape left: -Y axis is lateral
      rawG = -(ay / 9.81);
    } else if (angle === 180) {
      // Upside down portrait: -X axis is lateral
      rawG = -(ax / 9.81);
    } else {
      // Standard portrait (0°):
      // When car turns left, inertial force pushes phone right (+X).
      rawG = (ax / 9.81);
    }

    // Apply zero-calibration offset
    const calibratedG = rawG - this.zeroBias;
    this.updateG(calibratedG);
  }

  /**
   * Process acceleration with gravity (filters out static earth gravity vector)
   */
  processGravityAccel(ax, ay, az) {
    // Low-pass filter to estimate static mount tilt vector (gravity baseline)
    this.gravityFilter.x += 0.05 * (ax - this.gravityFilter.x);
    this.gravityFilter.y += 0.05 * (ay - this.gravityFilter.y);
    this.gravityFilter.z += 0.05 * (az - this.gravityFilter.z);

    // Subtract static gravity to isolate dynamic lateral cornering force
    const dynamicX = ax - this.gravityFilter.x;
    const dynamicY = ay - this.gravityFilter.y;

    const angle = this.getOrientationAngle();
    let rawG = 0;

    if (angle === 90) {
      rawG = (dynamicY / 9.81);
    } else if (angle === 270 || angle === -90) {
      rawG = -(dynamicY / 9.81);
    } else if (angle === 180) {
      rawG = -(dynamicX / 9.81);
    } else {
      rawG = (dynamicX / 9.81);
    }

    const calibratedG = rawG - this.zeroBias;
    this.updateG(calibratedG);
  }

  /**
   * Updates smoothed lateral G and dispatches to audio engine & UI
   */
  updateG(calibratedG) {
    this.rawLateralG = calibratedG;

    // Automotive low-pass filter (alpha = 0.22)
    // Smooths road bumps and engine vibrations while keeping steering response crisp
    this.smoothedLateralG += 0.22 * (calibratedG - this.smoothedLateralG);

    // Clamp to realistic street lateral threshold (±0.40 G)
    this.smoothedLateralG = Math.max(-0.40, Math.min(0.40, this.smoothedLateralG));

    // 1. Direct real-time feed into WebAudio stereo panner
    if (this.engine && this.engine.mixer && this.engine.mixer.updateLateralPan) {
      this.engine.mixer.updateLateralPan(this.smoothedLateralG);
    }

    // 2. Direct feed into OBD manager (so telemetry logging records live Gs)
    if (typeof obd !== 'undefined' && obd) {
      obd.smoothedLateralG = this.smoothedLateralG;
      obd.telemetry.lateralG = this.smoothedLateralG;
    }

    // 3. Dispatch to UI listener
    if (this.onUpdate) {
      this.onUpdate(this.smoothedLateralG, this.getStats());
    }
  }

  /**
   * Calibrates current resting position in the car phone mount to 0.00 G
   */
  calibrateZero() {
    this.zeroBias += this.smoothedLateralG;
    this.smoothedLateralG = 0.0;
    this.updateG(0.0);
    return true;
  }

  /**
   * Request motion sensor permissions (required on iOS 13+ and Android sensor policy)
   * Must be called inside a user gesture (e.g. tap on "PUMP UP THE BASSLINE" or "OBD BLE")
   */
  async requestPermission() {
    // iOS 13+ DeviceMotionEvent.requestPermission
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const state = await DeviceMotionEvent.requestPermission();
        this.permissionState = state;
        if (state === 'granted') {
          this.initDeviceMotion();
          return true;
        }
      } catch (err) {
        console.warn('[MotionSensor] iOS permission request error:', err);
      }
    }

    // Android Generic Sensor permission query
    if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
      try {
        const p = await navigator.permissions.query({ name: 'accelerometer' });
        this.permissionState = p.state;
      } catch (e) {
        // Permissions query not supported for accelerometer
      }
    }

    // Restart listeners
    this.initLinearSensor();
    this.initDeviceMotion();
    return true;
  }

  /**
   * Returns current sensor diagnostics and health
   */
  getStats() {
    return {
      isSupported: this.isSupported,
      isSecureContext: this.isSecureContext,
      isActive: this.isActive,
      permissionState: this.permissionState,
      sensorType: this.sensorType,
      sampleRateHz: this.sampleRateHz,
      eventCount: this.eventCount,
      smoothedG: Number(this.smoothedLateralG.toFixed(2)),
      orientationAngle: this.getOrientationAngle(),
      zeroBias: Number(this.zeroBias.toFixed(3))
    };
  }
}

if (typeof globalThis !== 'undefined') {
  globalThis.TekuMotionSensor = TekuMotionSensor;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TekuMotionSensor };
}
