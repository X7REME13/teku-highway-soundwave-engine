# TEKU // HIGHWAY SOUNDWAVE ENGINE 🏎️⚡🔊

[![GitHub Pages](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-00f0ff?style=for-the-badge&logo=github)](https://x7reme13.github.io/teku-highway-soundwave-engine/)
[![Web Audio API](https://img.shields.io/badge/Audio-Web%20Audio%20API-ff7700?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![License: MIT](https://img.shields.io/badge/License-MIT-ff0077?style=for-the-badge)](LICENSE)

> *"Yo, let's pump up the bassline!"* — Shirako Takamoto (*Hot Wheels: AcceleRacers*)

**TEKU // HIGHWAY SOUNDWAVE ENGINE** is a procedural, reactive electronic music engine built from scratch with the **Web Audio API**. It is designed to act as an onboard cockpit sound system driven dynamically by vehicular telemetry (OBD-II data: RPM, ground speed, throttle velocity, lateral cornering G-force, and coolant temperature).

Experience the live in-browser cockpit here:  
👉 **[https://x7reme13.github.io/teku-highway-soundwave-engine/](https://x7reme13.github.io/teku-highway-soundwave-engine/)**

---

## 🎧 Design Philosophy: Pure Music, Zero Fake Engine Noise

Real cars (such as our testbed Renault Clio Mio 1.2 16V D4F) already produce their own mechanical exhaust rumbles and induction tones. Synthesizing artificial engine noises over car speakers sounds gimmicky and clashes with the vehicle's natural acoustics.

This engine adopts the **AcceleRacers Teku philosophy**: the car is a mobile high-fidelity sound stage. The music is **100% pure generative electronic music** that breathes, morphs, filters, and accelerates in tandem with how you drive—using **continuous mathematical gradients** rather than abrupt on/off state triggers.

---

## 🔬 Acoustic DNA & Ground Truth

The engine's acoustic architecture is calibrated directly against *Hot Wheels AcceleRacers OST - Teku-Ising (Bonus Track)*:
* **Tempo:** 136 BPM (rock-solid half-time breakbeat & tech-trance swing).
* **Low-End Energy Dominance:** **94.26%** of spectral energy sits strictly below 250 Hz (Sub-Bass: 49.16%, Mid-Bass: 45.10%).
* **"La Patada de Entrada" (Intro Bass-Kick Punch):** Extracted via 20ms FFT analysis—every quarter-note beat fires a hard 3-stage pitch-swept impact ($225\text{ Hz} \rightarrow 102\text{ Hz} \rightarrow 50\text{ Hz}$ in 80ms) before holding a warm, sustained sub-bass plateau.
* **Spatial Depth:** High frequencies and vocal-range arpeggios are processed through a band-limited **Dotted-16th Stereo Echo Delay** ($1.8\text{ kHz}$ bandpass) to avoid dry "chiptune" acoustics while keeping sub-bass strictly in mono center.

---

## 🎛️ Architecture & Synthesis Modules

```
                        ┌────────────────────────────────────────┐
                        │      VEHICLE TELEMETRY / OBD-II        │
                        │  RPM / Speed / TPS / LatG / Temp (ECT) │
                        └───────────────────┬────────────────────┘
                                            │
                                            ▼
                        ┌────────────────────────────────────────┐
                        │        TEKU TELEMETRY MAPPER           │
                        │    Continuous Gradients (0.0 - 1.0)    │
                        └───────┬────────────────────────┬───────┘
                                │                        │
            ┌───────────────────┴───────┐        ┌───────┴───────────────────┐
            │   TEKU ARRANGER & CLOCK   │        │     AUDIO BUS AUTOMATION  │
            │  16-Bar Macro Trance Cycle│        │  Dynamic LPF & Saturation │
            └───────────┬───────────────┘        └───────────────┬───────────┘
                        │                                        │
        ┌───────────────┼───────────────┬────────────────────────┤
        ▼               ▼               ▼                        ▼
┌──────────────┐┌──────────────┐┌──────────────┐        ┌────────────────┐
│   SUB-BASS   ││  BREAKBEATS  ││ UPPER MADNESS│        │  TRANCE BRIDGE │
│ 42-82Hz Pure ││ Kick / Snare ││Tech-TranceArp│        │5-Voice Minor-9 │
│Sine+Tri Hold ││ 32nd Ratchet ││Acid Screamer │        │  Supersaw Pad  │
└───────┬──────┘└───────┬──────┘└───────┬──────┘        └────────┬───────┘
        │               │               │                        │
        ▼               ▼               ▼                        ▼
┌──────────────┐┌──────────────┐┌──────────────┐        ┌────────────────┐
│  subBassBus  ││   drumBus    ││  tranceBus   │        │    stabBus     │
│ +2.6dB Boost ││  LPF Sweep   ││Dotted-16th Dly│       │ Stereo Auto-Pan│
└───────┬──────┘└───────┬──────┘└───────┬──────┘        └────────┬───────┘
        │               │               │                        │
        └───────────────┼───────────────┴────────────────────────┘
                        │
                        ▼
        ┌────────────────────────────────┐
        │       TEKU MASTER BUS          │
        │ DynamicsCompressor (35ms Atk)  │
        │ 30-Band ISO 1/3-Octave Analyser│
        └────────────────────────────────┘
```

### 1. The Sub-Bass Core (`js/instruments.js` & `js/mixer.js`)
* **Parallel Dual-Path Routing:** Splits sub frequencies ($42\text{ Hz} - 82\text{ Hz}$) to a dedicated clean `subBassBus` with flat Butterworth filtering and sustained ADSR plateaus, while mid-frequency growl ($85\text{ Hz} - 650\text{ Hz}$) routes through cascaded 24dB/oct lowpass filters.
* **Intro Kick Transient ("La Patada"):** Fast exponential pitch-sweep oscillator locks physical punch into every quarter-note downbeat.
* **0 km/h Standstill Mode:** At stops, traffic lights, or pit stops, drums and synths fade away completely—leaving only the raw, hypnotic sub-bassline riff running.

### 2. High-Register "Locura Arriba" (`js/instruments.js`)
* **Tech-Trance & Acid Screamer Arp:** 3-voice detuned hypersaws in octaves $+2$ and $+3$ with high-Q resonant filter sweeps (`Q = 6.2`) and screaming octave-doubled accents.
* **Dotted-16th Feedback Delay:** Creates wide Y2K Tech-Trance atmosphere without cluttering the driving rhythm.
* **32nd-Note Hi-Hat Ratchets:** Fast double-32nd metallic sizzles ($9.5\text{ kHz}$ highpass) burst across turnaround bars during high-speed driving.

### 3. Anti-Fatigue 16-Bar Trance Macro-Structure (`js/arranger.js`)
Continuous driving music can cause ear fatigue if mid-bass grit and aggressive drums never stop. The engine resolves this with a 16-bar macro-cycle:
* **Bars 1–8 (Teku Groove / Upper Madness):** Deep rolling sub-bass, breakbeat syncopation, and progressive arpeggio swells.
* **Bars 9–12 (Trance Bridge / *El Puente*):** The breather section. Ducks mid-bass saw distortion and breakbeat snares, introducing a lush **5-voice Detuned Minor-9th Supersaw Pad** over long 2-beat pure sub-bass waves. (Also triggers automatically on high-speed throttle lift-off coasting).
* **Bars 13–14 (Trance Build-Up):** Accelerating snare roll (8th notes $\rightarrow$ 16th notes), opening filter cutoff, and pitch risers.
* **Bars 15–16 (Apex Climax Drop):** Fires an 808 Sub-Boom impact + crash on Bar 15 Beat 1 with full breakbeat, maximum screamers, and chord stabs.

### 4. 30-Band ISO 1/3-Octave Spectrum Equalizer (`js/ui.js`)
* Real-time VFD/LED spectrum visualizer matching professional ISO frequency centers from **$25\text{ Hz}$ to $20\text{ kHz}$** (4096-point FFT).
* 18 segmented LED cells per band with ballistically tuned floating peak-hold caps.
* 3 acoustic color zones: **Cyan** (Sub-Bass $25 - 125\text{ Hz}$), **Amber** (Mid-Grit $160\text{ Hz} - 2\text{ kHz}$), and **Magenta** (Breaks & Air $2.5\text{ kHz} - 20\text{ kHz}$).

---

## 🚗 Telemetry Mapping Parameters

| Parameter | Sensor Input | Musical Response |
| :--- | :--- | :--- |
| **BASS** | Engine state | Always 100% active; foundation tone locked to key root. |
| **DRUMS (Kick/Hat)** | Speed ($4 - 20\text{ km/h}$) | Smooth power-law swell ($t^{1.35}$) as vehicle rolls out. |
| **BREAKBEAT (Snare)** | Speed ($18 - 48\text{ km/h}$) | Full breakbeat rhythm & ghost snare syncopations blend in. |
| **DRUM CUTOFF** | Speed ($0 - 85\text{ km/h}$) | Continuous lowpass filter sweep from $320\text{ Hz}$ up to $14,000\text{ Hz}$. |
| **UPPER MADNESS** | Speed ($>22\text{ km/h}$) + RPM ($>1950$) | High-octave Tech-Trance arpeggios, acid screamers & 32nd-note hat ratchets. |
| **TRANCE BRIDGE** | Coasting ($>24\text{ km/h}$, $\text{TPS} < 19\%$) | Softens mid grit, opens lush Supersaw Pad and echoing arps. |
| **TUBE SATURATION** | Coolant Temp ($40^\circ\text{C} - 105^\circ\text{C}$) | Asymmetric transfer curve ($2.2\times$ clean warmth $\rightarrow 5.5\times$ hot analog overdrive). |
| **AUTO-PAN** | Lateral G-Force ($\pm 0.35\text{ G}$) | Sweeps hats, stabs & FX into the turn; **sub-bass remains centered mono**. |
| **THROTTLE STAB** | Pedal Attack rate ($>90\%/\text{s}$) | Triggers 1.2s tension riser leading into an 808 sub impact drop on Step 0. |
| **GEAR SHIFT** | RPM drop under low throttle | Fires Shirako DJ turntable vinyl scratch stingers (*baby scratch*, *chirp*, *tear*). |

---

## 🕹️ Controls & Testing in Cockpit

1. **Start Audio Engine:** Boots AudioContext and lookahead clock.
2. **Replay Clio CSV Run (75s):** Autonomous realistic simulation of a 75-second driving route through city stoplights, roundabout cornering, highway sprints, high-temp saturation, and coasting.
3. **Test Trance Bridge (Puente):** Jumps straight to Bar 9/16 to audition the atmospheric breakdown, snare build-up, and drop release.
4. **Test Chill Gear-Shift @ 2.4k:** Tests upshift RPM drop and vinyl scratch stinger.
5. **Test Throttle Stomp:** Tests high-$\Delta\text{TPS}$ pedal attack, 808 drop, and riser.
6. **Reroll Seed:** Generates a new harmonic session (Key, BPM, scale mode, bassline archetype).

---

## 💻 Local Development Setup

No build tools or heavy node dependencies required; pure modern vanilla ES6 modules:

```bash
# Clone the repository
git clone git@github.com:X7REME13/teku-highway-soundwave-engine.git
cd teku-highway-soundwave-engine

# Start any static web server
python3 -m http.server 8085
```

Navigate to: `http://localhost:8085/`

### Running the Headless Verification Suite

```bash
node verify_music_engine.js
```

Covers 7 automated unit tests:
* ✓ Zero engine noise simulation artifacts.
* ✓ Deterministic session seed generation & mutations.
* ✓ 0 km/h standstill behavior (pure sub-bass riff, 0% clatter).
* ✓ Continuous mathematical gradient curves.
* ✓ Sub-bass kick sidechain ducking.
* ✓ Lateral G auto-panning (mono sub protection).
* ✓ Lookahead sequencer stability across multi-bar cycles.

---

## 📜 Credits & License

* Inspired by **Hot Wheels: AcceleRacers** (Mattel / Mainframe Entertainment) & **Shirako Takamoto's *Bassline***.
* Vehicle OBD telemetry profiles based on the **Renault Clio Mio 1.2 16V (D4F)**.
* Licensed under the [MIT License](LICENSE).
