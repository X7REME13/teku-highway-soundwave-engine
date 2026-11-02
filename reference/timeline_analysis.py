#!/usr/bin/env python3
import scipy.io.wavfile as wavfile
import numpy as np

WAV_PATH = "/home/x7reme13/.gemini/antigravity-cli/scratch/teku-drive-webaudio/reference/reference.wav"
sr, data = wavfile.read(WAV_PATH)
if data.dtype == np.int16:
    data = data.astype(np.float32) / 32768.0

chunk_sec = 5.0
chunk_samples = int(sr * chunk_sec)
num_chunks = len(data) // chunk_samples

print("TIME SLICE TIMELINE (Every 5s):")
print(f"{'Time':<12} | {'RMS (dBFS)':<10} | {'Peak':<6} | {'Sub/Bass Ratio':<15} | Description")
print("-" * 65)

for i in range(num_chunks):
    start = i * chunk_samples
    end = start + chunk_samples
    chunk = data[start:end]
    rms = np.sqrt(np.mean(chunk**2))
    rms_db = 20 * np.log10(max(1e-6, rms))
    peak = np.max(np.abs(chunk))
    
    # FFT low vs high
    fft_vals = np.abs(np.fft.rfft(chunk))
    freqs = np.fft.rfftfreq(len(chunk), 1.0 / sr)
    bass_e = np.sum(fft_vals[freqs < 300]**2)
    tot_e = np.sum(fft_vals**2)
    ratio = (bass_e / max(1e-6, tot_e)) * 100.0
    
    desc = ""
    if rms_db < -20:
        desc = "Sparse Intro / Ambience"
    elif rms_db > -12 and ratio > 90:
        desc = "HEAVY SUB-BASS DROP / MAIN RIFF"
    elif rms_db > -14:
        desc = "Rhythm Groove / Filtered"
    else:
        desc = "Breakdown / Transition"
        
    print(f"{i*5.0:>4.0f}s - {(i+1)*5.0:>4.0f}s | {rms_db:>6.1f} dBFS | {peak:>5.2f} | {ratio:>5.1f}%          | {desc}")
