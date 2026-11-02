/**
 * TEKU DRIVE // MUSIC THEORY MODULE
 * Authentic Teku / AcceleRacers harmonic scales and chord progressions
 * Derived from Teku-Ising audio DNA analysis
 */

const TekuTheory = {
  // Musical Scales (intervals in semitones from root)
  SCALES: {
    aeolian:  { name: 'Natural Minor', intervals: [0, 2, 3, 5, 7, 8, 10] },
    dorian:   { name: 'Dorian Minor',  intervals: [0, 2, 3, 5, 7, 9, 10] },
    phrygian: { name: 'Phrygian Dark', intervals: [0, 1, 3, 5, 7, 8, 10] }
  },

  // Preferred Teku Keys (matching 4-cylinder acoustic resonance)
  KEYS: [
    { name: 'D Minor', rootMidi: 38 }, // 73.4 Hz fundamental
    { name: 'A Minor', rootMidi: 33 }, // 55.0 Hz fundamental (Teku-Ising native!)
    { name: 'F Minor', rootMidi: 29 }, // 43.6 Hz sub fundamental
    { name: 'G Minor', rootMidi: 31 }  // 49.0 Hz sub fundamental
  ],

  // 8-Bar Chord Progressions (2 bars per chord)
  PROGRESSIONS: {
    classic_teku: [
      { name: 'i',    degOffset: 0,  label: 'Tonic' },
      { name: '♭VI',  degOffset: 8,  label: 'Submediant' },
      { name: '♭VII', degOffset: 10, label: 'Subtonic' },
      { name: 'v',    degOffset: 7,  label: 'Dominant' }
    ],
    driving_flow: [
      { name: 'i',    degOffset: 0,  label: 'Tonic' },
      { name: '♭VII', degOffset: 10, label: 'Subtonic' },
      { name: 'i',    degOffset: 0,  label: 'Tonic' },
      { name: 'iv',   degOffset: 5,  label: 'Subdominant' }
    ],
    hot_phrygian: [
      { name: 'i',    degOffset: 0,  label: 'Tonic' },
      { name: '♭II',  degOffset: 1,  label: 'Phrygian Neapolitan' },
      { name: 'i',    degOffset: 0,  label: 'Tonic' },
      { name: '♭VII', degOffset: 10, label: 'Subtonic' }
    ]
  },

  midiToFreq(midi) {
    return 440.0 * Math.pow(2.0, (midi - 69.0) / 12.0);
  },

  /** Get scale note for a given degree index */
  getScaleMidi(rootMidi, scaleType, degree, octave = 0) {
    const scale = this.SCALES[scaleType] || this.SCALES.aeolian;
    const len = scale.intervals.length;
    const octOffset = Math.floor(degree / len) + octave;
    const intervalIdx = ((degree % len) + len) % len;
    return rootMidi + (octOffset * 12) + scale.intervals[intervalIdx];
  }
};

if (typeof globalThis !== 'undefined') {
  globalThis.TekuTheory = TekuTheory;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TekuTheory };
}
