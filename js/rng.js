/**
 * TEKU DRIVE // RNG MODULE
 * Deterministic seeded PRNG using Mulberry32
 * Enables reproducible session seeds (e.g. "TEKU-4F2A")
 */

class TekuRNG {
  constructor(seed = null) {
    this.setSeed(seed || Math.floor(Math.random() * 0xFFFFFFFF));
  }

  setSeed(seed) {
    if (typeof seed === 'string') {
      // 32-bit FNV-1a hash of string
      let h = 0x811c9dc5;
      for (let i = 0; i < seed.length; i++) {
        h ^= seed.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
      }
      this.seed = h >>> 0;
      this.seedString = seed;
    } else {
      this.seed = (seed >>> 0) || 1337;
      this.seedString = 'TEKU-' + this.seed.toString(16).toUpperCase().padStart(4, '0').slice(-4);
    }
    this._state = this.seed;
  }

  /** Mulberry32 PRNG core */
  random() {
    let t = (this._state += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  randFloat(min, max) {
    return min + this.random() * (max - min);
  }

  randInt(min, max) {
    return Math.floor(this.randFloat(min, max + 1));
  }

  pick(arr) {
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(this.random() * arr.length)];
  }

  chance(prob) {
    return this.random() < prob;
  }

  weighted(items, weights) {
    let total = 0;
    for (let i = 0; i < weights.length; i++) total += weights[i];
    let r = this.random() * total;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i];
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TekuRNG };
}
