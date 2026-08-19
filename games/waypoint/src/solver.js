/**
 * solver.js — solution counting (search) and solution validation (no search).
 *
 * The counter short-circuits at `cap` (default 2): the generator only ever
 * needs to know "is this exactly one solution, or more than one".
 */

import { compile } from './grid.js';

/**
 * Full search. Returns:
 *   count       number of solutions found, capped at `cap`
 *   backtracks  dead ends hit (difficulty proxy, see difficulty.js)
 *   nodes       search nodes expanded
 *   solutions   up to `collect` full paths, in visit order
 *
 * @param {object} level
 * @param {{cap?: number, collect?: number, grid?: object}} [options]
 */
export function analyze(level, options = {}) {
  const cap = options.cap ?? 2;
  const collect = options.collect ?? 0;
  const budget = options.budget ?? Infinity;
  const g = options.grid ?? compile(level);

  const { size, openCount, adj, cpOrdinal, start, end, checkpointCount: K } = g;

  // `aborted` means the counts below are a lower bound, not an answer. Any
  // caller that could ship a level must treat an aborted result as unusable —
  // never as proof of uniqueness.
  const stats = { count: 0, backtracks: 0, nodes: 0, solutions: [], aborted: false };
  if (openCount === 0 || cap <= 0) return stats;

  // Degenerate board: one open cell, which must be the one and only checkpoint.
  if (openCount === 1) {
    if (K === 1 && start === end && g.open[start]) {
      stats.count = 1;
      if (collect > 0) stats.solutions.push([start]);
    }
    return stats;
  }
  // A single checkpoint on a multi-cell board has no defined end; treat as
  // unsolvable rather than throwing — the generator never emits this.
  if (K < 2) return stats;

  const visited = new Uint8Array(size);
  const path = new Int32Array(openCount);

  // Move scratch: 4 slots per depth. Nested frames always use deeper slots.
  const moveBuf = new Int32Array((openCount + 1) * 4);

  // A grid is bipartite, so the path strictly alternates cell colour. That
  // makes the colour balance of the unvisited region an exact, O(1) test:
  // it rejects whole subtrees that connectivity and degree both wave through.
  const colour = new Uint8Array(size);
  const width = g.width;
  let remA = 0;
  let remB = 0;
  for (let c = 0; c < g.openCells.length; c++) {
    const i = g.openCells[c];
    colour[i] = ((i % width) + Math.floor(i / width)) & 1;
    if (colour[i] === 0) remA++;
    else remB++;
  }
  const endColour = colour[end];

  // Flood-fill scratch, generation-stamped so it never needs clearing.
  const seen = new Int32Array(size);
  const queue = new Int32Array(size);
  let stamp = 0;

  function enter(i) {
    visited[i] = 1;
    if (colour[i] === 0) remA--;
    else remB--;
  }

  function leave(i) {
    visited[i] = 0;
    if (colour[i] === 0) remA++;
    else remB++;
  }

  /** Legal continuations from `head` at `depth` cells visited. */
  function legalMoves(head, cpIndex, depth, off) {
    const nbrs = adj[head];
    let m = 0;
    for (let k = 0; k < nbrs.length; k++) {
      const n = nbrs[k];
      if (visited[n]) continue;
      const ord = cpOrdinal[n];
      // Checkpoints must be entered in order.
      if (ord >= 0 && ord !== cpIndex) continue;
      // The final checkpoint may only be entered as the very last cell.
      if (n === end && depth + 1 !== openCount) continue;
      moveBuf[off + m++] = n;
    }
    return m;
  }

  /**
   * Can the remaining cells still form a path from `head` to `end`?
   * Degree pruning, then connectivity of the unvisited region.
   */
  function feasible(head, depth) {
    const remaining = openCount - depth;
    if (remaining === 0) return head === end;

    // Colour parity. The remaining walk covers `remaining + 1` cells starting
    // on the head's colour and alternating, so both the colour counts and the
    // colour the walk must finish on are fully determined.
    const span = remaining + 1;
    const headColour = colour[head];
    const sameNeeded = (span + 1) >> 1;
    const otherNeeded = span >> 1;
    const sameHave = (headColour === 0 ? remA : remB) + 1;
    const otherHave = headColour === 0 ? remB : remA;
    if (sameHave !== sameNeeded || otherHave !== otherNeeded) return false;
    if (endColour !== (span & 1 ? headColour : 1 - headColour)) return false;

    // Degree: in the graph of (unvisited cells + head), every unvisited cell
    // needs two usable links to be passed through; `end` needs only one.
    let headDegree = 0;
    const hn = adj[head];
    for (let k = 0; k < hn.length; k++) if (!visited[hn[k]]) headDegree++;
    if (headDegree === 0) return false;

    const cells = g.openCells;
    for (let c = 0; c < cells.length; c++) {
      const i = cells[c];
      if (visited[i]) continue;
      const nbrs = adj[i];
      const need = i === end ? 1 : 2;
      let d = 0;
      for (let k = 0; k < nbrs.length; k++) {
        const n = nbrs[k];
        if (!visited[n] || n === head) {
          if (++d >= need) break;
        }
      }
      if (d < need) return false;
    }

    // Connectivity: every unvisited cell must be reachable from the head.
    // This subsumes "remaining checkpoints and the end are still reachable".
    stamp++;
    let qh = 0;
    let qt = 0;
    for (let k = 0; k < hn.length; k++) {
      const n = hn[k];
      if (!visited[n] && seen[n] !== stamp) {
        seen[n] = stamp;
        queue[qt++] = n;
      }
    }
    let reached = 0;
    while (qh < qt) {
      const cur = queue[qh++];
      reached++;
      if (reached === remaining) return true;
      const nbrs = adj[cur];
      for (let k = 0; k < nbrs.length; k++) {
        const n = nbrs[k];
        if (!visited[n] && seen[n] !== stamp) {
          seen[n] = stamp;
          queue[qt++] = n;
        }
      }
    }
    return reached === remaining;
  }

  function dfs(head0, cpIndex0, depth0) {
    let head = head0;
    let cpIndex = cpIndex0;
    let depth = depth0;
    // Cells visited by forced moves inside this frame, to undo on the way out.
    const forced = [];

    for (;;) {
      if (++stats.nodes > budget) {
        stats.aborted = true;
        break;
      }

      if (depth === openCount) {
        if (head === end && cpIndex === K) {
          stats.count++;
          if (stats.solutions.length < collect) {
            stats.solutions.push(Array.from(path.subarray(0, depth)));
          }
        }
        break;
      }

      const off = depth * 4;
      const m = legalMoves(head, cpIndex, depth, off);

      if (m === 0) {
        stats.backtracks++;
        break;
      }

      if (m === 1) {
        // Forced move: extend without branching.
        const n = moveBuf[off];
        enter(n);
        path[depth] = n;
        if (!feasible(n, depth + 1)) {
          leave(n);
          stats.backtracks++;
          break;
        }
        forced.push(n);
        if (cpOrdinal[n] === cpIndex) cpIndex++;
        head = n;
        depth++;
        continue;
      }

      for (let k = 0; k < m; k++) {
        const n = moveBuf[off + k];
        enter(n);
        path[depth] = n;
        if (feasible(n, depth + 1)) {
          dfs(n, cpOrdinal[n] === cpIndex ? cpIndex + 1 : cpIndex, depth + 1);
        } else {
          stats.backtracks++;
        }
        leave(n);
        if (stats.count >= cap || stats.aborted) break;
      }
      break;
    }

    for (let k = forced.length - 1; k >= 0; k--) leave(forced[k]);
  }

  if (cpOrdinal[start] !== 0) return stats; // start is not checkpoint 1
  enter(start);
  path[0] = start;
  if (feasible(start, 1)) dfs(start, 1, 1);
  else stats.backtracks++;
  leave(start);

  return stats;
}

/**
 * How many solutions does this level have, counting no further than `cap`?
 * @returns {number} 0, 1, ... up to `cap`
 */
export function countSolutions(level, cap = 2, grid = null) {
  return analyze(level, { cap, grid }).count;
}

/** Convenience: the first solution found, or null. */
export function findSolution(level, grid = null) {
  const r = analyze(level, { cap: 1, collect: 1, grid });
  return r.solutions[0] ?? null;
}

const OK = Object.freeze({ ok: true, reason: null });
const fail = (reason) => ({ ok: false, reason });

/**
 * Validate a completed path against a level. No search — O(path length).
 * Used at runtime on the player's path.
 */
export function checkSolution(level, path, grid = null) {
  const g = grid ?? compile(level);
  if (!Array.isArray(path) && !ArrayBuffer.isView(path)) return fail('path must be an array');
  if (path.length !== g.openCount) return fail('path does not cover every open cell exactly once');
  if (path[0] !== g.start) return fail('path does not start at checkpoint 1');
  if (path[path.length - 1] !== g.end) return fail('path does not end at the last checkpoint');

  const seen = new Uint8Array(g.size);
  let expectedCp = 0;

  for (let i = 0; i < path.length; i++) {
    const cell = path[i];
    if (!Number.isInteger(cell) || cell < 0 || cell >= g.size) return fail(`cell out of range: ${cell}`);
    if (!g.open[cell]) return fail(`path enters a wall at ${cell}`);
    if (seen[cell]) return fail(`path revisits cell ${cell}`);
    seen[cell] = 1;

    const ord = g.cpOrdinal[cell];
    if (ord >= 0) {
      if (ord !== expectedCp) return fail(`checkpoint ${ord + 1} reached out of order`);
      expectedCp++;
    }

    if (i > 0) {
      const prev = path[i - 1];
      const nbrs = g.adj[prev];
      let linked = false;
      for (let k = 0; k < nbrs.length; k++) {
        if (nbrs[k] === cell) {
          linked = true;
          break;
        }
      }
      if (!linked) return fail(`illegal move from ${prev} to ${cell}`);
    }
  }

  if (expectedCp !== g.checkpointCount) return fail('not every checkpoint was visited');
  return OK;
}

/** Boolean form of {@link checkSolution}. */
export function isValidSolution(level, path, grid = null) {
  return checkSolution(level, path, grid).ok;
}

/**
 * Is a partial path a legal prefix? Used by input.js to accept/reject a drag
 * step without re-walking the whole path.
 */
export function isLegalStep(level, path, next, grid = null) {
  const g = grid ?? compile(level);
  if (path.length === 0) return next === g.start;
  const head = path[path.length - 1];
  const nbrs = g.adj[head];
  let linked = false;
  for (let k = 0; k < nbrs.length; k++) if (nbrs[k] === next) linked = true;
  if (!linked) return false;
  if (path.includes(next)) return false;

  const ord = g.cpOrdinal[next];
  if (ord >= 0) {
    let expected = 0;
    for (let i = 0; i < path.length; i++) if (g.cpOrdinal[path[i]] >= 0) expected++;
    if (ord !== expected) return false;
  }
  return true;
}
