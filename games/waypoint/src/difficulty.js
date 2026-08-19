/**
 * difficulty.js — a single number per level, used to order the ladder.
 *
 * The dominant term is solver backtracks, on the theory that the search a
 * correct-but-unclever solver has to do is a decent proxy for the search a
 * human has to do. It is log-compressed because backtrack counts span four
 * orders of magnitude and a raw sum would let one board dwarf a whole tier.
 */

import { compile } from './grid.js';
import { analyze } from './solver.js';

export const WEIGHTS = {
  backtracks: 13, // per doubling
  sparsity: 2.2, // open cells per checkpoint
  area: 0.22, // per open cell
  walls: 4,
  barriers: 6,
  longestGap: 0.7, // per cell of the longest unclued stretch
};

/** Cells between consecutive checkpoints, at the widest point. */
export function longestCheckpointGap(level) {
  const { solution, checkpoints } = level;
  if (!solution || !checkpoints) return 0;
  const marks = new Set(checkpoints);
  let best = 0;
  let run = 0;
  for (const cell of solution) {
    if (marks.has(cell)) {
      if (run > best) best = run;
      run = 0;
    } else run++;
  }
  return run > best ? run : best;
}

/**
 * @returns {{score: number, parts: object, backtracks: number, nodes: number}}
 */
export function scoreLevel(level, precomputed = null) {
  const g = compile(level);
  const stats = precomputed ?? analyze(level, { cap: 2, grid: g });

  const gap = longestCheckpointGap(level);
  const parts = {
    backtracks: WEIGHTS.backtracks * Math.log2(1 + stats.backtracks),
    sparsity: WEIGHTS.sparsity * (g.openCount / g.checkpointCount),
    area: WEIGHTS.area * g.openCount,
    walls: level.walls?.length ? WEIGHTS.walls : 0,
    barriers: level.barriers?.length ? WEIGHTS.barriers : 0,
    longestGap: WEIGHTS.longestGap * gap,
  };

  let score = 0;
  for (const v of Object.values(parts)) score += v;

  return { score: Math.round(score), parts, backtracks: stats.backtracks, nodes: stats.nodes, longestGap: gap };
}

/** Just the number. */
export function difficultyOf(level) {
  return scoreLevel(level).score;
}
