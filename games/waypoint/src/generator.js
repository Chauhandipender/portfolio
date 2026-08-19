/**
 * generator.js — solution first, puzzle second.
 *
 * The order matters and is not negotiable: we sample a random Hamiltonian
 * path, then work backwards to the smallest set of checkpoints that pins it
 * down. Placing clues and hoping a solution exists produces unsolvable boards
 * far more often than not.
 */

import { buildAdjacency, isConnected, edgeKey } from './grid.js';
import { analyze } from './solver.js';

// ---------------------------------------------------------------------------
// Step 1 — a random Hamiltonian path (backbite)
// ---------------------------------------------------------------------------

/** Boustrophedon seed: a snake covering every cell of an unwalled grid. */
export function snakePath(width, height) {
  const path = [];
  for (let y = 0; y < height; y++) {
    if (y % 2 === 0) for (let x = 0; x < width; x++) path.push(y * width + x);
    else for (let x = width - 1; x >= 0; x--) path.push(y * width + x);
  }
  return path;
}

function reverseSegment(path, pos, a, b) {
  while (a < b) {
    const t = path[a];
    path[a] = path[b];
    path[b] = t;
    pos[path[a]] = a;
    pos[path[b]] = b;
    a++;
    b--;
  }
}

/**
 * Backbite: pick an endpoint, pick a neighbour of it that lies on the path,
 * reverse the segment between them. The result is always another Hamiltonian
 * path, so this never fails and never needs to backtrack.
 */
export function backbite(path, adj, size, rng, iterations) {
  const n = path.length;
  if (n < 4) return path;
  const pos = new Int32Array(size).fill(-1);
  for (let i = 0; i < n; i++) pos[path[i]] = i;

  for (let it = 0; it < iterations; it++) {
    if (rng() < 0.5) {
      const nbrs = adj[path[n - 1]];
      if (nbrs.length === 0) continue;
      const j = pos[nbrs[rng.int(nbrs.length)]];
      if (j >= n - 2) continue; // the current predecessor: a no-op
      reverseSegment(path, pos, j + 1, n - 1);
    } else {
      const nbrs = adj[path[0]];
      if (nbrs.length === 0) continue;
      const j = pos[nbrs[rng.int(nbrs.length)]];
      if (j <= 1) continue;
      reverseSegment(path, pos, 0, j - 1);
    }
  }
  return path;
}

/**
 * Find any Hamiltonian path on a walled board, to seed backbite with.
 * Randomised DFS with the same connectivity/degree pruning as the solver,
 * except that the far endpoint is free rather than fixed.
 */
function findSeedPath(graph, width, rng, budget) {
  const { adj, openCells, openCount, size } = graph;
  const visited = new Uint8Array(size);
  const path = new Int32Array(openCount);
  const seen = new Int32Array(size);
  const queue = new Int32Array(size);
  let stamp = 0;
  let nodes = 0;

  const colour = new Uint8Array(size);
  let remA = 0;
  let remB = 0;
  for (const i of openCells) {
    colour[i] = ((i % width) + Math.floor(i / width)) & 1;
    if (colour[i] === 0) remA++;
    else remB++;
  }

  const enter = (i) => {
    visited[i] = 1;
    if (colour[i] === 0) remA--;
    else remB--;
  };
  const leave = (i) => {
    visited[i] = 0;
    if (colour[i] === 0) remA++;
    else remB++;
  };

  function feasible(head, depth) {
    const remaining = openCount - depth;
    if (remaining === 0) return true;

    // Same bipartite argument as the solver, minus the fixed endpoint: the
    // remaining walk alternates colour, so its colour counts are determined.
    // This is what makes proving "no Hamiltonian path here" cheap, which is
    // the common case when walls are placed at random.
    const span = remaining + 1;
    const same = (colour[head] === 0 ? remA : remB) + 1;
    const other = colour[head] === 0 ? remB : remA;
    if (same !== (span + 1) >> 1 || other !== span >> 1) return false;

    let loose = 0; // unvisited cells that can be entered but never left
    let headDegree = 0;
    for (const n of adj[head]) if (!visited[n]) headDegree++;
    if (headDegree === 0) return false;

    for (let c = 0; c < openCells.length; c++) {
      const i = openCells[c];
      if (visited[i]) continue;
      let d = 0;
      for (const n of adj[i]) if (!visited[n] || n === head) d++;
      if (d === 0) return false;
      if (d === 1 && ++loose > 1) return false; // only one cell may be the end
    }

    stamp++;
    let qh = 0;
    let qt = 0;
    let reached = 0;
    for (const n of adj[head]) {
      if (!visited[n] && seen[n] !== stamp) {
        seen[n] = stamp;
        queue[qt++] = n;
      }
    }
    while (qh < qt) {
      const cur = queue[qh++];
      reached++;
      for (const n of adj[cur]) {
        if (!visited[n] && seen[n] !== stamp) {
          seen[n] = stamp;
          queue[qt++] = n;
        }
      }
    }
    return reached === remaining;
  }

  /** Onward moves available from `n`, i.e. Warnsdorff's count. */
  function onward(n) {
    let d = 0;
    for (const m of adj[n]) if (!visited[m]) d++;
    return d;
  }

  function walk(head, depth) {
    if (++nodes > budget) return false;
    if (depth === openCount) return true;
    if (!feasible(head, depth)) return false;
    const options = [];
    for (const n of adj[head]) if (!visited[n]) options.push(n);
    // Warnsdorff: step into the most constrained cell first. Shuffling before
    // the sort keeps ties random, so the seed is still varied.
    rng.shuffle(options);
    if (options.length > 1) options.sort((p, q) => onward(p) - onward(q));
    for (const n of options) {
      enter(n);
      path[depth] = n;
      if (walk(n, depth + 1)) return true;
      leave(n);
    }
    return false;
  }

  // Low-degree cells make far better starts than middle-of-the-board ones.
  const starts = rng.shuffle(Array.from(openCells));
  starts.sort((p, q) => adj[p].length - adj[q].length);
  for (let k = 0; k < Math.min(starts.length, 8); k++) {
    for (let c = 0; c < openCells.length; c++) if (visited[openCells[c]]) leave(openCells[c]);
    nodes = 0;
    enter(starts[k]);
    path[0] = starts[k];
    if (walk(starts[k], 1)) return Array.from(path);
    leave(starts[k]);
    if (nodes > budget) return null; // the board is fighting us; new walls
  }
  return null;
}

/**
 * A grid whose open cells two-colour unevenly cannot hold a Hamiltonian path.
 * Cheap enough to run before any search, and it rejects most bad wall sets.
 */
function parityAllows(width, graph) {
  let a = 0;
  let b = 0;
  for (const i of graph.openCells) {
    const x = i % width;
    const y = Math.floor(i / width);
    if ((x + y) % 2 === 0) a++;
    else b++;
  }
  return Math.abs(a - b) <= 1;
}

/** A uniformly-ish sampled Hamiltonian path over the open cells, or null. */
export function randomHamiltonianPath(width, height, walls, rng, opts = {}) {
  const graph = buildAdjacency(width, height, walls, []);
  if (graph.openCount < 4) return null;
  if (!isConnected(graph)) return null;
  if (!parityAllows(width, graph)) return null;

  // A cell with one usable neighbour has to be an endpoint, and a path has
  // only two of those. Free, and it throws out a lot of bad wall sets.
  let deadEnds = 0;
  for (const i of graph.openCells) {
    if (graph.adj[i].length === 0) return null;
    if (graph.adj[i].length === 1 && ++deadEnds > 2) return null;
  }

  // Deliberately stingy. Measured on 9x9: even a 3,000,000-node budget only
  // gets a path out of 36% of colour-balanced wall sets, and a found path
  // costs 50ms at 30,000 nodes against 2ms at 500. Giving up early and
  // redrawing the walls beats persisting, by more than an order of magnitude.
  const seed =
    walls.length === 0 ? snakePath(width, height) : findSeedPath(graph, width, rng, opts.seedBudget ?? 600);
  if (!seed) return null;

  // 14x cells is where mixing saturates: measured on 6x6, median turn count
  // climbs 10 -> 16 -> 19 over 1x/4x/14x and then flattens (21 at 50x, 20 at
  // 200x). Past the knee you are paying for nothing.
  const iterations = opts.iterations ?? Math.max(200, opts.mixing ?? 14 * graph.openCount);
  return backbite(seed, graph.adj, graph.size, rng, iterations);
}

// ---------------------------------------------------------------------------
// Step 2 — walls
// ---------------------------------------------------------------------------

/**
 * Walls, colour-balanced so the board can still hold a Hamiltonian path.
 *
 * A path alternates cell colours, so the two colour classes must end up equal
 * in size (or differ by one). Sampling walls uniformly and rejecting the rest
 * throws away roughly seven attempts in ten on a 9x9; solving for the right
 * split up front costs nothing and throws away none.
 */
export function chooseWalls(width, height, count, rng) {
  if (count <= 0) return [];
  const size = width * height;
  const dark = [];
  const light = [];
  for (let i = 0; i < size; i++) {
    if ((((i % width) + Math.floor(i / width)) & 1) === 0) dark.push(i);
    else light.push(i);
  }

  // Need |(dark - a) - (light - b)| <= 1 with a + b = count.
  const skew = dark.length - light.length;
  let a = (skew + count) >> 1;
  if (((skew + count) & 1) === 1) a += rng.int(2); // two valid splits; pick one
  const b = count - a;
  if (a < 0 || b < 0 || a > dark.length || b > light.length) return [];

  rng.shuffle(dark);
  rng.shuffle(light);
  return dark
    .slice(0, a)
    .concat(light.slice(0, b))
    .sort((x, y) => x - y);
}

// ---------------------------------------------------------------------------
// Barriers — chosen from edges the solution does not use, so the intended
// path always survives while alternatives get cut away.
// ---------------------------------------------------------------------------

export function chooseBarriers(width, height, walls, path, count, rng) {
  if (count <= 0) return [];
  const graph = buildAdjacency(width, height, walls, []);
  const used = new Set();
  for (let i = 1; i < path.length; i++) used.add(edgeKey(path[i - 1], path[i]));

  const degree = new Int32Array(graph.size);
  for (const i of graph.openCells) degree[i] = graph.adj[i].length;

  const candidates = [];
  for (const i of graph.openCells) {
    for (const n of graph.adj[i]) {
      if (n < i) continue;
      if (used.has(edgeKey(i, n))) continue;
      candidates.push([i, n]);
    }
  }
  rng.shuffle(candidates);

  const endpoints = new Set([path[0], path[path.length - 1]]);
  const barriers = [];
  for (const [a, b] of candidates) {
    if (barriers.length >= count) break;
    const floorA = endpoints.has(a) ? 1 : 2;
    const floorB = endpoints.has(b) ? 1 : 2;
    // A barrier that strands a cell on one usable edge makes the board a
    // corridor puzzle rather than a logic puzzle.
    if (degree[a] - 1 < floorA || degree[b] - 1 < floorB) continue;
    degree[a]--;
    degree[b]--;
    barriers.push([a, b]);
  }
  return barriers;
}

// ---------------------------------------------------------------------------
// Step 3 — checkpoint reduction
// ---------------------------------------------------------------------------

function longestGap(indices, n) {
  let best = 0;
  let bestMid = 1;
  for (let k = 1; k < indices.length; k++) {
    const span = indices[k] - indices[k - 1];
    if (span > best) {
      best = span;
      bestMid = indices[k - 1] + (span >> 1);
    }
  }
  return { span: best, mid: bestMid };
}

// Competing solutions to pull out per round. Measured on 9x9: 2 converges
// fastest but needs more checkpoints, 8 costs 75% more time for no better
// board. 3 is the knee.
const RIVALS = 3;

/**
 * Grow the checkpoint set from just {first, last} until the board has exactly
 * one solution.
 *
 * Rather than sampling candidate positions blind, each round asks the solver
 * for actual rival solutions and then picks the checkpoint that kills the most
 * of them. The kill test is exact and costs nothing: a rival survives a new
 * checkpoint `c` only if it visits `c` between the two checkpoints that
 * bracket `c` on the intended path, which is one comparison of positions.
 *
 * @returns {number[]|null} indices into `path`, or null if it stalls
 */
export function reduceCheckpoints(base, path, rng, opts = {}) {
  const rivals = opts.rivals ?? RIVALS;
  // Some boards — big grids with few walls — are pathological to reduce, and
  // grinding on one costs more than the fifty easy boards we could have made
  // instead. Walk away and let the caller draw a fresh board.
  // Swept 8k/20k/50k/120k on 9x9: the curve is nearly flat, so this is not
  // where the long tail lives (that is retry volume). 20k just edges the
  // others on p90 and worst case.
  const budget = opts.reduceBudget ?? 20_000;
  let spent = 0;
  const n = path.length;
  const size = base.width * base.height;
  const chosen = [0, n - 1];
  const isChosen = new Uint8Array(n);
  isChosen[0] = 1;
  isChosen[n - 1] = 1;

  const levelFor = (indices) => ({ ...base, checkpoints: indices.map((i) => path[i]) });

  for (let guard = 0; guard <= n; guard++) {
    const found = analyze(levelFor(chosen), { cap: rivals, collect: rivals, budget: budget - spent });
    spent += found.nodes;
    if (found.aborted) return null; // out of budget; its counts mean nothing
    if (found.count === 0) return null; // the drawn path must be a solution
    if (found.count === 1) return chosen;

    const others = found.solutions.filter((s) => !sameOrder(s, path));
    const positions = others.map((s) => {
      const at = new Int32Array(size).fill(-1);
      for (let i = 0; i < s.length; i++) at[s[i]] = i;
      return at;
    });

    const gap = longestGap(chosen, n);
    let bestIndex = -1;
    let bestKills = -1;
    let bestDistance = Infinity;

    let bracket = 0; // chosen[bracket] is the checkpoint just before index i
    for (let i = 1; i < n - 1; i++) {
      while (bracket + 1 < chosen.length && chosen[bracket + 1] <= i) bracket++;
      if (isChosen[i]) continue;
      const before = path[chosen[bracket]];
      const after = path[chosen[bracket + 1]];
      const cell = path[i];

      let kills = 0;
      for (const at of positions) {
        if (!(at[cell] > at[before] && at[cell] < at[after])) kills++;
      }

      const distance = Math.abs(i - gap.mid);
      if (kills > bestKills || (kills === bestKills && distance < bestDistance)) {
        bestKills = kills;
        bestDistance = distance;
        bestIndex = i;
      }
    }
    if (bestIndex < 0) return null;

    chosen.push(bestIndex);
    chosen.sort((a, b) => a - b);
    isChosen[bestIndex] = 1;
  }

  return null;
}

function sameOrder(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

/**
 * Add checkpoints beyond the minimum, always splitting the longest free
 * stretch. Used by the early tiers, where the point is to make the rule
 * self-evident rather than to make the player search.
 */
export function padCheckpoints(indices, n, target) {
  const chosen = indices.slice();
  const isChosen = new Uint8Array(n);
  for (const i of chosen) isChosen[i] = 1;
  while (chosen.length < target) {
    const gap = longestGap(chosen, n);
    if (gap.span < 2) break;
    if (isChosen[gap.mid]) break;
    chosen.push(gap.mid);
    isChosen[gap.mid] = 1;
    chosen.sort((a, b) => a - b);
  }
  return chosen;
}

// ---------------------------------------------------------------------------
// Step 4 — rejection
// ---------------------------------------------------------------------------

export function countTurns(path, width) {
  let turns = 0;
  for (let i = 1; i < path.length - 1; i++) {
    const a = path[i] - path[i - 1];
    const b = path[i + 1] - path[i];
    if (a !== b) turns++;
  }
  return turns;
}

export const DEFAULT_RULES = Object.freeze({
  maxCheckpointFraction: 0.4, // above this the checkpoints are doing the work
  minTurnsPer10: 3, // fewer and it is a snake, not a puzzle
  requireBacktracking: false, // set for tier 4+: a board solved with no
  // backtracking at all never made the player think
});

/** The §6 step 4 reject list. Returns a reason string, or null to accept. */
export function rejectionReason(level, path, backtracks, rules = DEFAULT_RULES) {
  const r = { ...DEFAULT_RULES, ...rules };
  const openCount = path.length;
  if (level.checkpoints.length > openCount * r.maxCheckpointFraction) return 'too many checkpoints';
  const turns = countTurns(path, level.width);
  if (turns * 10 < openCount * r.minTurnsPer10) return 'too few direction changes';
  if (r.requireBacktracking && backtracks === 0) return 'no backtracking required';
  return null;
}

// ---------------------------------------------------------------------------
// Putting it together
// ---------------------------------------------------------------------------

/**
 * Generate one verified level, or null if this attempt did not pan out.
 * Callers retry; nothing here throws on an ordinary miss.
 *
 * @param {{rng: Function, width: number, height: number, tier?: number,
 *          wallCount?: number, barrierCount?: number, checkpointTarget?: number,
 *          rivals?: number, rules?: object}} opts
 */
export function generateLevel(opts) {
  const { rng, width, height, tier = 1 } = opts;
  const wallCount = opts.wallCount ?? 0;
  const maxWalls = Math.floor(width * height * 0.12);
  const walls = wallCount > 0 ? chooseWalls(width, height, Math.min(wallCount, maxWalls), rng) : [];

  const path = randomHamiltonianPath(width, height, walls, rng, opts);
  if (!path) return null;

  const barriers = chooseBarriers(width, height, walls, path, opts.barrierCount ?? 0, rng);
  const base = { width, height, walls, barriers };

  let indices = reduceCheckpoints(base, path, rng, opts);
  if (!indices) return null;

  if (opts.checkpointTarget && opts.checkpointTarget > indices.length) {
    indices = padCheckpoints(indices, path.length, opts.checkpointTarget);
  }

  const level = { ...base, checkpoints: indices.map((i) => path[i]), solution: path };

  // Standing rule 1: nothing leaves this function unverified.
  const stats = analyze(level, { cap: 2 });
  if (stats.count !== 1) return null;

  const reason = rejectionReason(level, path, stats.backtracks, opts.rules);
  if (reason) return null;

  level.tier = tier;
  level.backtracks = stats.backtracks;
  return level;
}

/** Retry {@link generateLevel} until it lands. Returns null if it never does. */
export function generateLevelWithRetry(opts, attempts = 60) {
  for (let i = 0; i < attempts; i++) {
    const level = generateLevel(opts);
    if (level) return level;
  }
  return null;
}
