/**
 * rng.js — seeded PRNG. Never use Math.random anywhere in this project:
 * the daily puzzle must be identical for every player, forever.
 */

/** Hash an arbitrary string into a 32-bit seed. */
export function hashSeed(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * mulberry32. Returns a function producing floats in [0, 1).
 * @param {number|string} seed
 */
export function makeRng(seed) {
  let a = (typeof seed === 'string' ? hashSeed(seed) : seed >>> 0) || 1;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  /** Integer in [0, n). */
  next.int = (n) => Math.floor(next() * n);
  /** Uniform pick from an array. */
  next.pick = (arr) => arr[Math.floor(next() * arr.length)];
  /** Fisher-Yates, in place. */
  next.shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      const t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  };
  return next;
}
