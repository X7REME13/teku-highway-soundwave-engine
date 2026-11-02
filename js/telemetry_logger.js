/**
 * TEKU DRIVE // IN-CAR TELEMETRY & DIAGNOSTIC LOGGER
 * Captures high-frequency driving session telemetry and raw OBD-II ELM327
 * communication events for in-car field testing and audio performance analysis.
 *
 * Formats:
 * - CSV: Standard RFC 4180 format for Excel, Google Sheets, Python pandas, MegaLogViewer.
 * - JSON: Comprehensive diagnostic bundle including ECU handshake, AT commands, and events.
 */

class TekuTelemetryLogger {
  constructor(engine = null) {
    this.engine = engine;
    this.maxRecords = 20000; // ~33 mins at 10Hz or ~66 mins at 5Hz
    this.records = [];
    this.events = [];
    this.isRecording = true;
    this.startTime = Date.now();
    this.lastSampleTime = 0;
    this.minSampleIntervalMs = 70; // Max ~14 Hz sampling rate
    this._lastUiRecord = 0;

    this.onUpdate = null; // Callback for UI stats binding

    this.metadata = {
      app: 'Teku Drive // Highway Soundwave Engine v2.0',
      vehicle: 'Renault Clio Mio 1.2 16V (D4F 728 / SIM32 ECU)',
      dongle: 'ELM327 BLE OBD-II (KWP2000 Fast Init / CAN)',
      activeProtocol: 'Auto-Detect',
      sessionSeed: 'TEKU-1337',
      deviceUserAgent: (typeof navigator !== 'undefined') ? navigator.userAgent : 'Node.js'
    };
  }

  /**
   * Estimates manual gear for Clio Mio 1.2 D4F (5-speed gearbox)
   */
  estimateGear(spd, rpm) {
    if (spd <= 0 && rpm <= 850) return 'P';
    if (spd < 18) return '1';
    if (spd < 34) return '2';
    if (spd < 48) return '3';
    if (spd < 58) return '4';
    return '5';
  }

  /**
   * Records a timestamped vehicle telemetry sample
   */
  recordTelemetry(data = {}) {
    if (!this.isRecording) return;

    const now = Date.now();
    // Enforce minimum sampling interval to avoid redundant duplicate entries
    if (now - this.lastSampleTime < this.minSampleIntervalMs) return;
    this.lastSampleTime = now;

    const spd = Math.round(data.speed || 0);
    const rpm = Math.round(data.rpm || 0);
    const tps = Math.round(data.throttle !== undefined ? data.throttle : 0);
    const latG = Number(Number(data.lateralG || 0).toFixed(3));
    const coolant = Math.round(data.coolantTemp !== undefined ? data.coolantTemp : (data.temp !== undefined ? data.temp : 88));
    const latency = Math.round(data.pidLatencyMs || 0);

    const gear = data.gear || this.estimateGear(spd, rpm);

    // Audio Engine State
    let audioMode = data.audioMode;
    let bpm = data.bpm;
    let energy = data.energy;
    let drumCutoff = data.drumCutoff;
    let tubeDrive = data.tubeDrive;

    if (this.engine) {
      if (!bpm) bpm = Math.round(this.engine.bpm || 136);
      if (this.engine.telemetryState) {
        const st = this.engine.telemetryState;
        if (energy === undefined) energy = Number(st.energy.toFixed(2));
        if (drumCutoff === undefined) drumCutoff = Math.round(st.gradients.drumCutoff || 1200);
        if (tubeDrive === undefined && st.gradients) {
          tubeDrive = Number((2.2 + (st.gradients.thermal || 0) * 3.3).toFixed(2));
        }
      }
      if (!audioMode) {
        if (!this.engine.isRunning) {
          audioMode = 'STOPPED';
        } else if (spd > 54 || rpm > 2800) {
          audioMode = 'PEAK_LEGAL';
        } else if (spd > 36) {
          audioMode = 'BOULEVARD';
        } else if (spd > 16) {
          audioMode = 'CITY';
        } else if (spd > 4) {
          audioMode = 'ROLLING';
        } else {
          audioMode = 'IDLE';
        }
      }
    } else {
      if (!bpm) bpm = 136;
      if (energy === undefined) energy = 0.0;
      if (drumCutoff === undefined) drumCutoff = 1200;
      if (tubeDrive === undefined) tubeDrive = 2.2;
      if (!audioMode) audioMode = spd > 0 ? 'DRIVING' : 'IDLE';
    }

    if (data.activeProtocol) {
      this.metadata.activeProtocol = data.activeProtocol;
    }
    if (this.engine?.generator?.session?.seed) {
      this.metadata.sessionSeed = this.engine.generator.session.seed;
    }

    const elapsedSec = Number(((now - this.startTime) / 1000).toFixed(2));

    const sample = {
      timestamp: new Date(now).toISOString(),
      elapsedSec,
      speed: spd,
      rpm,
      throttle: tps,
      lateralG: latG,
      coolantTemp: coolant,
      gear,
      audioMode,
      bpm: Math.round(bpm),
      energy: Number(Number(energy || 0).toFixed(2)),
      drumCutoff: Math.round(drumCutoff || 1200),
      tubeDrive: Number(Number(tubeDrive || 2.2).toFixed(2)),
      pidLatencyMs: latency
    };

    this.records.push(sample);

    // Circular FIFO buffer
    if (this.records.length > this.maxRecords) {
      this.records.shift();
    }

    if (this.onUpdate) {
      this.onUpdate(this.getStats(), sample);
    }
  }

  /**
   * Records a diagnostic or BLE communication event
   * (e.g. 'BLE_STATUS', 'OBD_TX', 'OBD_RX', 'OBD_TIMEOUT', 'OBD_ERR')
   */
  recordEvent(type, message, details = null) {
    const now = Date.now();
    const elapsedSec = Number(((now - this.startTime) / 1000).toFixed(2));

    const event = {
      timestamp: new Date(now).toISOString(),
      elapsedSec,
      type: String(type).toUpperCase(),
      message: String(message),
      details: details ? String(details) : null
    };

    this.events.push(event);

    if (this.events.length > 5000) {
      this.events.shift();
    }

    if (this.onUpdate) {
      this.onUpdate(this.getStats(), null);
    }
  }

  /**
   * Returns live session statistics
   */
  getStats() {
    const elapsedTotal = Math.max(0, (Date.now() - this.startTime) / 1000);
    const mins = Math.floor(elapsedTotal / 60).toString().padStart(2, '0');
    const secs = Math.floor(elapsedTotal % 60).toString().padStart(2, '0');

    let maxSpeed = 0;
    let maxRpm = 0;
    let maxG = 0;

    for (let i = 0; i < this.records.length; i++) {
      const r = this.records[i];
      if (r.speed > maxSpeed) maxSpeed = r.speed;
      if (r.rpm > maxRpm) maxRpm = r.rpm;
      const absG = Math.abs(r.lateralG);
      if (absG > maxG) maxG = absG;
    }

    return {
      count: this.records.length,
      eventCount: this.events.length,
      durationSec: Number(elapsedTotal.toFixed(1)),
      durationFormatted: `${mins}:${secs}`,
      isRecording: this.isRecording,
      maxSpeed,
      maxRpm,
      maxLateralG: Number(maxG.toFixed(3))
    };
  }

  /**
   * Resets all buffers and restarts timer
   */
  clear() {
    this.records = [];
    this.events = [];
    this.startTime = Date.now();
    this.lastSampleTime = 0;
    if (this.onUpdate) {
      this.onUpdate(this.getStats(), null);
    }
  }

  /**
   * Converts recorded telemetry into RFC 4180 compliant CSV string
   */
  toCSV() {
    const headers = [
      'timestamp_iso',
      'elapsed_sec',
      'speed_kmh',
      'rpm',
      'tps_pct',
      'lateral_g',
      'coolant_temp_c',
      'gear',
      'audio_mode',
      'bpm',
      'energy',
      'drum_cutoff_hz',
      'tube_drive',
      'pid_latency_ms'
    ];

    const lines = [headers.join(',')];

    for (let i = 0; i < this.records.length; i++) {
      const r = this.records[i];
      const row = [
        r.timestamp,
        r.elapsedSec,
        r.speed,
        r.rpm,
        r.throttle,
        r.lateralG,
        r.coolantTemp,
        `"${r.gear}"`,
        `"${r.audioMode}"`,
        r.bpm,
        r.energy,
        r.drumCutoff,
        r.tubeDrive,
        r.pidLatencyMs
      ];
      lines.push(row.join(','));
    }

    return lines.join('\r\n') + '\r\n';
  }

  /**
   * Converts session into structured JSON diagnostic package
   */
  toJSON(pretty = true) {
    const stats = this.getStats();
    const payload = {
      exportTimestamp: new Date().toISOString(),
      metadata: this.metadata,
      summary: {
        totalSamples: this.records.length,
        totalEvents: this.events.length,
        durationSec: stats.durationSec,
        durationFormatted: stats.durationFormatted,
        maxSpeedKmh: stats.maxSpeed,
        maxRpm: stats.maxRpm,
        maxLateralG: stats.maxLateralG
      },
      diagnosticEvents: this.events,
      telemetry: this.records
    };

    return pretty ? JSON.stringify(payload, null, 2) : JSON.stringify(payload);
  }

  /**
   * Triggers browser download for CSV file
   */
  downloadCSV(customFilename = null) {
    // If no records exist, take an instantaneous snapshot so file isn't empty
    if (this.records.length === 0) {
      this.recordTelemetry({ speed: 0, rpm: 750, throttle: 13, lateralG: 0, coolantTemp: 88 });
    }

    const csvData = this.toCSV();
    const filename = customFilename || `teku_drive_telemetry_${this._formatFileDate()}.csv`;
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    this._triggerBlobDownload(blob, filename);
    return filename;
  }

  /**
   * Triggers browser download for JSON diagnostic package
   */
  downloadJSON(customFilename = null) {
    const jsonData = this.toJSON(true);
    const filename = customFilename || `teku_drive_diagnostics_${this._formatFileDate()}.json`;
    const blob = new Blob([jsonData], { type: 'application/json;charset=utf-8;' });
    this._triggerBlobDownload(blob, filename);
    return filename;
  }

  _formatFileDate() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  }

  _triggerBlobDownload(blob, filename) {
    if (typeof document === 'undefined') return;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1200);
  }
}

if (typeof globalThis !== 'undefined') {
  globalThis.TekuTelemetryLogger = TekuTelemetryLogger;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TekuTelemetryLogger };
}
