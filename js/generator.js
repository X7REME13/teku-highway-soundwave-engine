/**
 * TEKU DRIVE // GENERATOR MODULE
 * Procedural music generation inspired by the Teku-Ising audio DNA
 * Generates bass riffs, breakbeat drum grooves, and chord cycles
 */

if (typeof TekuRNG === 'undefined' && typeof require !== 'undefined') {
  var { TekuRNG } = require('./rng.js');
}
if (typeof TekuTheory === 'undefined' && typeof require !== 'undefined') {
  var { TekuTheory } = require('./theory.js');
}

class TekuGenerator {
  constructor(rng = null) {
    this.rng = rng || new TekuRNG();
    this.session = null;
    this.generateNewSession();
  }

  generateNewSession(seed = null) {
    if (seed !== null) this.rng.setSeed(seed);

    // Pick Session Key & BPM (calibrated to Teku-Ising ground truth 136.7 BPM)
    const key = this.rng.pick(TekuTheory.KEYS);
    const bpm = this.rng.randInt(132, 138); // Centered around 136.7 native

    // Bassline Riff Generation (16-step patterns with syncopated breathing room)
    const bassA = this.generateBassRiff(0.40); // 40% rests for punchy breathing room
    const bassB = this.generateBassRiff(0.30); // 30% rests for higher tension in phrase B

    // Breakbeat Drum Templates (chopped nu-skool breaks)
    const drumsA = this.generateBreakbeatPattern('main');
    const drumsB = this.generateBreakbeatPattern('variation');

    // Turnaround Fills
    const turnaroundBass = this.generateTurnaroundFill(4);
    const turnaroundClimax = this.generateTurnaroundFill(8);

    this.session = {
      seed: this.rng.seedString,
      key: key,
      baseBpm: bpm,
      scaleType: 'aeolian', // default cool/warm scale
      progression: TekuTheory.PROGRESSIONS.classic_teku,
      bassA: bassA,
      bassB: bassB,
      drumsA: drumsA,
      drumsB: drumsB,
      turnaroundBass: turnaroundBass,
      turnaroundClimax: turnaroundClimax,
      mutationCount: 0
    };

    return this.session;
  }

  /**
   * Generates a 16-step Teku rolling bass riff
   * Uses weighted degrees: Root (0), Subtonic ♭7 (-2/10), 5th (7), Minor 3rd (3), Octave (12)
   */
  generateBassRiff(restProbability = 0.35) {
    const pattern = [];
    const degrees = [0, 0, 0, 10, 12, 7, 3, 5, -2];
    const degreeWeights = [35, 25, 20, 15, 12, 10, 8, 5, 10];

    for (let step = 0; step < 16; step++) {
      // Step 0 (Downbeat) is ALWAYS a solid root note hit
      if (step === 0) {
        pattern.push({ deg: 0, oct: 0, accent: true, slide: false, rest: false });
        continue;
      }

      // Step 8 (Beat 3 syncopation) is highly stable
      if (step === 8) {
        const deg = this.rng.weighted(degrees, degreeWeights);
        pattern.push({ deg: deg, oct: 0, accent: true, slide: this.rng.chance(0.25), rest: false });
        continue;
      }

      // Off-beat rests give the massive sub-bass room to breathe and hit hard
      if (this.rng.chance(restProbability)) {
        pattern.push({ deg: 0, oct: 0, accent: false, slide: false, rest: true });
        continue;
      }

      const deg = this.rng.weighted(degrees, degreeWeights);
      const isAccent = (step % 4 === 2) || (step === 6 || step === 10 || step === 14);
      const hasSlide = isAccent && this.rng.chance(0.35);
      const oct = (deg === 12 || (deg === 0 && this.rng.chance(0.20))) ? 1 : 0;

      pattern.push({
        deg: deg,
        oct: oct,
        accent: isAccent,
        slide: hasSlide,
        rest: false
      });
    }

    return pattern;
  }

  /**
   * Generates procedural breakbeat drum steps (kick, snare, hat, ghost)
   */
  generateBreakbeatPattern(type = 'main') {
    const steps = [];

    // Authentic AcceleRacers Half-Time Breakbeat:
    // Beat 1: Step 0 (Heavy Kick)
    // Beat 2: Step 4 (Ghost kick or syncopated off-beat)
    // Beat 3: Step 8 (Snappy Snare Downbeat - half-time anchor!)
    // Beat 4: Step 12 (Syncopated Breakbeat Kick or Snare ghost)
    for (let i = 0; i < 16; i++) {
      const step = {
        kick: false,
        snare: false,
        ghostSnare: false,
        hat: false,
        openHat: false,
        accent: false
      };

      // Closed Hi-Hats: Swung 16th pattern
      step.hat = true;
      if (i % 2 === 1) step.accent = true;

      // Half-time Snare hits solidly on Step 8 (Beat 3)
      if (i === 8) {
        step.snare = true;
      }

      // Main Kick on Step 0 (Beat 1)
      if (i === 0) {
        step.kick = true;
      }

      // Breakbeat Syncopations
      if (type === 'main') {
        if (i === 6 && this.rng.chance(0.60)) step.kick = true;
        if (i === 10 && this.rng.chance(0.70)) step.kick = true;
        if (i === 12 && this.rng.chance(0.50)) step.ghostSnare = true;
        if (i === 14 && this.rng.chance(0.40)) step.openHat = true;
      } else { // Variation
        if (i === 3 && this.rng.chance(0.50)) step.kick = true;
        if (i === 11 && this.rng.chance(0.65)) step.kick = true;
        if (i === 15 && this.rng.chance(0.60)) step.ghostSnare = true;
        if (i === 6 || i === 14) step.openHat = true;
      }

      steps.push(step);
    }

    return steps;
  }

  /** Generates turnaround fills for bar 4 and bar 8 */
  generateTurnaroundFill(length = 4) {
    const fill = [];
    for (let i = 0; i < length; i++) {
      fill.push({
        deg: this.rng.pick([0, 10, 12, 7, 3]),
        oct: this.rng.chance(0.4) ? 1 : 0,
        accent: true,
        slide: i === length - 1,
        rest: false
      });
    }
    return fill;
  }

  /** 8-Bar Evolutionary Mutation: evolves 1-2 steps to feel like a live DJ working the tune */
  mutateSession() {
    if (!this.session) return;
    this.session.mutationCount++;

    const stepToMutate = this.rng.randInt(1, 15);
    if (stepToMutate !== 0 && stepToMutate !== 8) {
      const isRest = this.rng.chance(0.30);
      this.session.bassA[stepToMutate] = {
        deg: this.rng.pick([0, 10, 12, 7, 3, -2]),
        oct: this.rng.chance(0.25) ? 1 : 0,
        accent: this.rng.chance(0.40),
        slide: this.rng.chance(0.25),
        rest: isRest
      };
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TekuGenerator };
}
