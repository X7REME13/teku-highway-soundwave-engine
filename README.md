# TEKU-DRIVE // Reactive WebAudio Music Engine 🏎️⚡

Generative Breakbeat & Sub-Bass Sound System driven by live vehicular telemetry and OBD-II logs. Built with the **Web Audio API**.

Inspired by *Hot Wheels: AcceleRacers (Teku Team / Shirako Takamoto - Bassline / Teku-Ising)*.

---

## 🎧 Philosophy: Pure Music, Zero Fake Engine Noise

The car (Renault Clio Mio 1.2 16V D4F) already produces its own authentic acoustic presence. This project does **not** synthesize fake exhaust rumbles, engine clatter, or radiator fan whine. 

Instead, it acts as **Shirako Takamoto's onboard sound system**: continuous, reactive electronic music that evolves seamlessly with your driving dynamics using smooth mathematical gradients rather than abrupt binary layer switches.

### Audio DNA Reference Analysis
Extracted from *Hot Wheels AcceleRacers OST - Teku-Ising (Bonus Track)*:
* **Measured Tempo:** 136.7 BPM (rock-solid, dark half-time breakbeat swing)
* **Spectral Balance:** **94.26%** of spectral energy sits below 250 Hz (Sub-Bass: 49.16%, Mid-Bass: 45.10%)
* **Arrangement:** Driving, syncopated rolling sub-bassline riff, half-time breakbeat punch, industrial minor stabs on aggressive throttle, and zero high-register arcade clutter.

---

## 🚀 How to Run the Web App

Launch a local web server:

```bash
cd /home/x7reme13/.gemini/antigravity-cli/scratch/teku-drive-webaudio
python3 -m http.server 8085
```

Open your browser at:
👉 **`http://localhost:8085`** (or access via local Wi-Fi: `http://<YOUR-IP>:8085`).

---

## 🎛️ Architecture & Feature Highlights

1. **Deterministic Session Seeds (`js/rng.js` & `js/generator.js`):**
   * Every drive generates a unique procedural track (scale mode, root key, 16-step bassline riff, drum syncopations) based on a session seed (e.g. `TEKU-8392`).
   * Reroll anytime with the **REROLL SEED** button.

2. **0 km/h Stopped State (Red Light / Pit):**
   * When stopped, all drum clatter and synth stabs fade out completely.
   * Only the deep, hypnotic rolling sub-bassline riff loops cleanly.

3. **100% Continuous Telemetry Gradients (`js/telemetry_mapper.js`):**
   * Zero binary threshold step-switches. All layer volumes and filter cutoffs follow smooth power-law curves ($t^{1.25} - t^{1.4}$):
     * **Kick & Hat Swell:** Emerges smoothly from 0 to 25 km/h.
     * **Full Breakbeat:** Blends in between 15 and 55 km/h.
     * **Drum Low-Pass Filter:** Sweeps continuously from 320 Hz to 14,000 Hz based on road speed.
     * **Industrial Stabs:** Swells continuously between 35 and 90 km/h.

4. **Dynamic Driving Reactions:**
   * **Throttle Punch Drop:** Rapid throttle stabs ($\Delta\text{TPS} > 90\%/\text{s}$) trigger a 1.2s pitch riser and an 808 sub impact drop on Step 0.
   * **Gear Shifts:** Trigger vinyl scratch stingers on high-RPM upshifts.
   * **Coolant Temp Saturation:** Engine temperature smoothly drives asymmetric tube overdrive (2.2x clean saturation $\rightarrow$ 5.5x warm analog tube bite).
   * **Cornering G-Force:** Dynamic stereo auto-panning for drum hats, stabs, and FX, while sub-bass remains strictly locked in mono center.

---

## 🧪 Automated Verification Suite

Run the headless verification suite anytime:

```bash
node verify_music_engine.js
```

Covers 7 automated unit tests:
1. Zero legacy engine noise methods in codebase.
2. Deterministic session seed generation.
3. 0 km/h stopped state behavior (bassline only, thermal overdrive).
4. Continuous gradient curves across speed points.
5. Kick sidechain ducking pump on bass bus.
6. Lateral G auto-panning (mono bass safety).
7. 128-step lookahead scheduler & 8-bar evolutionary mutation.
