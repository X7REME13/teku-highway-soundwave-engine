# TEKU-DRIVE // Reactive WebAudio Music Engine 🏎️⚡

Generative Breakbeat & Roland TB-303 Acid Synthesizer driven by live vehicular telemetry and OBD-II logs. Built with the **Web Audio API**.

Inspired by *Hot Wheels: AcceleRacers (Teku Team / Shirako Takamoto - Bassline)* and *TidalCycles*.

---

## 🚀 How to Run the Web App

To launch the local web server:

```bash
cd /home/x7reme13/.gemini/antigravity-cli/scratch/teku-drive-webaudio
python3 -m http.server 8080
```

Then open your browser at:
👉 **`http://localhost:8080`** (or access via your phone's browser using your machine's local IP, e.g. `http://192.168.1.X:8080`).

---

## 🎛️ Features Included

1. **Procedural TB-303 Acid Engine:**
   * Pure Web Audio oscillators (Sawtooth/Square).
   * 24dB resonant low-pass ladder filter with dynamic cutoff & Q factor mapped to **Engine RPM** and **Throttle %**.
   * Nonlinear waveshaping distortion for gritty saturation.

2. **Algorithmic Teku Breakbeat Sequencer:**
   * Synthesized 909 punchy kicks, snappy noise snares, and fast 16th rolling hi-hats.
   * Dynamic Tempo (BPM) scaling smoothly from **122 BPM (idle)** to **145 BPM (high speed)**.
   * Snare rolls and double kicks trigger automatically when punching the throttle (>60%).

3. **Sensor & Telemetry Dynamics:**
   * **Cornering G-Force Panning:** Cornering left/right pans the synth and drums across the stereo field.
   * **Replay My Car Run:** Pre-loaded with your exact telemetry run (`1,657 RPM` cruising $\rightarrow$ `3,004 RPM` pull $\rightarrow$ deceleration $\rightarrow$ `750 RPM` idle stop).
   * **Simulate Full Pull:** Instant test button running a 0-60 km/h acceleration run.

4. **Real-time Neon Frequency Visualizer:**
   * Canvas-based audio spectrum analyser in AcceleRacers cyan & magenta.

---

## 🔮 Roadmap / Next Steps

* [x] Pure Web Audio synthesis engine & step sequencer
* [x] Interactive telemetry dashboard & sliders
* [x] Real-time replay of your OBD-II CSV log
* [ ] Web Bluetooth API integration (`navigator.bluetooth`) for wireless BLE ELM327 adapters
* [ ] DeviceMotionEvent listener for real phone accelerometer/gyroscope integration
