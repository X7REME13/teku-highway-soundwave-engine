#!/usr/bin/env python3
import os
import subprocess
import numpy as np
import scipy.signal
import scipy.fftpack

AUDIO_PATH = "/home/x7reme13/.gemini/antigravity-cli/scratch/teku-drive-webaudio/reference/Hot Wheels Acceleracers OST - 17 - Teku-Ising (Bonus Track) [L0KCpV5we9k].mp3"
WAV_PATH = "/home/x7reme13/.gemini/antigravity-cli/scratch/teku-drive-webaudio/reference/reference.wav"

def extract_wav():
    if not os.path.exists(WAV_PATH):
        print("Converting MP3 to mono 22050Hz WAV with ffmpeg...")
        subprocess.run([
            "ffmpeg", "-y", "-i", AUDIO_PATH,
            "-ac", "1", "-ar", "22050", WAV_PATH
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print("WAV ready.")

def load_wav(filename):
    # Read raw 16-bit PCM wav using scipy.io.wavfile
    import scipy.io.wavfile as wavfile
    sr, data = wavfile.read(filename)
    if data.dtype == np.int16:
        data = data.astype(np.float32) / 32768.0
    return sr, data

def detect_bpm(data, sr):
    # Compute envelope via Hilbert or onset flux
    hop_length = int(sr * 0.01) # 10ms frame
    frame_length = int(sr * 0.025) # 25ms
    
    # Short-time spectral flux
    f, t, Zxx = scipy.signal.stft(data, fs=sr, nperseg=frame_length, noverlap=frame_length - hop_length)
    mag = np.abs(Zxx)
    
    # Half-wave rectified spectral flux
    flux = np.diff(mag, axis=1)
    flux = np.maximum(0, flux)
    onset_env = np.sum(flux, axis=0)
    
    # Normalize
    onset_env -= np.mean(onset_env)
    
    # Autocorrelation
    corr = np.correlate(onset_env, onset_env, mode='full')
    corr = corr[len(corr)//2:]
    
    # Search range: 70 BPM to 160 BPM
    fps = sr / hop_length
    min_lag = int(fps * 60.0 / 160.0)
    max_lag = int(fps * 60.0 / 70.0)
    
    lag_range = np.arange(min_lag, max_lag)
    corr_range = corr[lag_range]
    
    best_lag = lag_range[np.argmax(corr_range)]
    detected_bpm = (fps * 60.0) / best_lag
    
    # Also check double/half tempo peaks
    top_lags = lag_range[np.argsort(corr_range)[::-1][:5]]
    candidates = [(fps * 60.0) / l for l in top_lags]
    
    return detected_bpm, candidates, onset_env, fps

def spectral_breakdown(data, sr):
    fft_vals = np.abs(np.fft.rfft(data))
    freqs = np.fft.rfftfreq(len(data), 1.0 / sr)
    total_energy = np.sum(fft_vals**2)
    
    bands = {
        "Sub-Bass (20 - 60 Hz)": (20, 60),
        "Punch / Mid-Bass (60 - 250 Hz)": (60, 250),
        "Low-Mids (250 - 500 Hz)": (250, 500),
        "Midrange (500 - 2000 Hz)": (500, 2000),
        "Presence (2000 - 6000 Hz)": (2000, 6000),
        "Brilliance / Treble (6000 - 11000 Hz)": (6000, 11000)
    }
    
    breakdown = {}
    for name, (low, high) in bands.items():
        idx = np.where((freqs >= low) & (freqs < high))[0]
        band_energy = np.sum(fft_vals[idx]**2)
        pct = (band_energy / total_energy) * 100.0
        breakdown[name] = pct
        
    return breakdown

def detect_key(data, sr):
    # Chroma analysis: map frequencies to 12 pitch classes (C, C#, D, D#, E, F, F#, G, G#, A, A#, B)
    # Focus on bass and lower midrange (40 Hz - 800 Hz)
    f, t, Zxx = scipy.signal.stft(data, fs=sr, nperseg=4096, noverlap=2048)
    mag = np.abs(Zxx)
    
    notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    chroma = np.zeros(12)
    
    for i, freq in enumerate(f):
        if 40 <= freq <= 800:
            # MIDI note: 69 + 12 * log2(freq / 440)
            midi = 69 + 12 * np.log2(freq / 440.0)
            pitch_class = int(round(midi)) % 12
            chroma[pitch_class] += np.sum(mag[i, :])
            
    chroma /= np.sum(chroma)
    
    # Template matching for Major and Minor keys
    # Krumhansl-Schmuckler key profiles
    major_profile = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
    minor_profile = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
    
    major_profile /= np.sum(major_profile)
    minor_profile /= np.sum(minor_profile)
    
    best_key = ""
    best_corr = -1
    key_scores = []
    
    for root in range(12):
        # Rotate profiles
        maj_rot = np.roll(major_profile, root)
        min_rot = np.roll(minor_profile, root)
        
        corr_maj = np.corrcoef(chroma, maj_rot)[0, 1]
        corr_min = np.corrcoef(chroma, min_rot)[0, 1]
        
        key_scores.append((f"{notes[root]} Major", corr_maj))
        key_scores.append((f"{notes[root]} Minor", corr_min))
        
    key_scores.sort(key=lambda x: x[1], reverse=True)
    return key_scores[:5], chroma, notes

def main():
    extract_wav()
    sr, data = load_wav(WAV_PATH)
    duration = len(data) / sr
    rms = np.sqrt(np.mean(data**2))
    peak = np.max(np.abs(data))
    
    print("=" * 60)
    print("TEKU-ISING AUDIO DNA EXTRACTION REPORT")
    print("=" * 60)
    print(f"File: Hot Wheels Acceleracers OST - 17 - Teku-Ising")
    print(f"Duration: {duration:.2f} seconds ({int(duration // 60)}m {duration % 60:.1f}s)")
    print(f"Sample Rate: {sr} Hz")
    print(f"RMS Level: {20 * np.log10(rms):.1f} dBFS")
    print(f"Peak Level: {20 * np.log10(peak):.1f} dBFS")
    
    print("\n--- 1. TEMPO & BPM ESTIMATION ---")
    bpm, candidates, onset_env, fps = detect_bpm(data, sr)
    print(f"Primary Detected BPM: {bpm:.1f} BPM")
    print("Top Tempo Candidates:")
    for c in candidates:
        print(f"  - {c:.1f} BPM")
        
    print("\n--- 2. SPECTRAL ENERGY DISTRIBUTION ---")
    breakdown = spectral_breakdown(data, sr)
    for band, pct in breakdown.items():
        bar = "█" * int(pct * 1.5)
        print(f"{band:<38}: {pct:5.2f}% {bar}")
        
    print("\n--- 3. KEY & HARMONIC TONALITY ---")
    top_keys, chroma, notes = detect_key(data, sr)
    print("Top Harmonic Key Candidates:")
    for k, score in top_keys:
        print(f"  - {k:<12} (correlation: {score:.3f})")
        
    print("\nPitch Class Distribution (Chroma):")
    for n, val in zip(notes, chroma):
        bar = "█" * int(val * 150)
        print(f"  {n:<3}: {val*100:4.1f}% {bar}")

    print("\n--- 4. DRUM & TRANSIENT STRUCTURE ---")
    # Peak onsets per second
    peak_indices, _ = scipy.signal.find_peaks(onset_env, distance=int(fps * 0.15), prominence=np.std(onset_env) * 0.8)
    onset_diffs = np.diff(peak_indices) / fps
    print(f"Detected Strong Transients: {len(peak_indices)}")
    print(f"Mean transient interval: {np.mean(onset_diffs):.3f}s")
    print(f"Dominant rhythmic subdivisions: {np.median(onset_diffs):.3f}s")

    print("\n" + "=" * 60)

if __name__ == "__main__":
    main()
