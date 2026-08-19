/**
 * endless.js — boards past the end of the pack.
 *
 * Separate from main.js so it can be tested without a DOM. These are shipped
 * levels like any other, and standing rule 1 does not stop applying just
 * because they are made on the player's machine instead of ours.
 *
 * Seeded by level number, so level 734 is the same board for everyone and the
 * same board every time that player reaches it.
 */

import { makeRng } from './rng.js';
import { generateLevelWithRetry } from './generator.js';

/**
 * Board shape for the nth level past the pack.
 *
 * The wall floor is not cosmetic. A 9x9 with only four walls is the worst case
 * the generator has: measured, it needs ~800ms and often fails outright, while
 * the same board with eight walls takes ~19ms. Sparse walls mean a freer board
 * with vastly more candidate paths, so uniqueness gets expensive to pin down.
 * Six percent of cells is the floor, twelve is the cap from SPEC §6.
 */
export function endlessShape(past) {
  const size = past % 3 === 0 ? 8 : 9;
  const cells = size * size;
  const floor = Math.ceil(cells * 0.06);
  const cap = Math.floor(cells * 0.12);
  return {
    width: size,
    height: size,
    // Creep upward, then hold. Walls and barriers are what keep a big board
    // interesting, but too many turn it into a corridor to be traced.
    wallCount: Math.min(cap, floor + Math.floor(past / 60)),
    // Keep cycling the lines past the end of the pack, so the palette carries
    // on marking progress instead of freezing on one colour forever.
    tier: 5 + (Math.floor(past / 40) % 4),
  };
}

/**
 * @param {number} index absolute level index (0-based)
 * @param {number} packLength how many levels the pack holds
 * @returns {object|null} a verified level, or null if generation missed
 */
export function endlessLevel(index, packLength) {
  const past = Math.max(0, index - packLength);
  const shape = endlessShape(past);

  // Each pass adds a wall, up to the cap. More walls constrain the board, and
  // a more constrained board is both quicker to generate and no less
  // interesting to solve — so a miss makes the next attempt strictly easier
  // rather than throwing the same dice again. Still fully deterministic.
  const cap = Math.floor(shape.width * shape.height * 0.12);
  for (let pass = 0; pass < 4; pass++) {
    const rng = makeRng(`waypoint-endless:${index}:${pass}`);
    const level = generateLevelWithRetry(
      {
        rng,
        width: shape.width,
        height: shape.height,
        wallCount: Math.min(cap, shape.wallCount + pass),
        tier: shape.tier,
        barrierCount: 2 + rng.int(4),
        rules: { requireBacktracking: true },
      },
      80
    );
    if (level) return { ...level, id: `endless-${index}` };
  }
  return null;
}
