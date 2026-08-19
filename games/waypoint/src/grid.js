/**
 * grid.js — cell/index/neighbour utilities.
 *
 * A cell index is `y * width + x`. Everything downstream (solver, generator,
 * renderer) speaks in flat indices; x/y only exist at the edges.
 */

/** Orthogonal steps, in render order: N, E, S, W. */
export const DIRS = Object.freeze([
  Object.freeze([0, -1]),
  Object.freeze([1, 0]),
  Object.freeze([0, 1]),
  Object.freeze([-1, 0]),
]);

/** Largest grid this module's edge keys can address (64x64 = 4096 cells). */
const EDGE_STRIDE = 4096;

export function toIndex(x, y, width) {
  return y * width + x;
}

export function toX(i, width) {
  return i % width;
}

export function toY(i, width) {
  return Math.floor(i / width);
}

export function toXY(i, width) {
  return [i % width, Math.floor(i / width)];
}

/** Orthogonal in-bounds neighbours of `i`, ignoring walls and barriers. */
export function neighbours(i, width, height) {
  const x = i % width;
  const y = Math.floor(i / width);
  const out = [];
  if (y > 0) out.push(i - width);
  if (x < width - 1) out.push(i + 1);
  if (y < height - 1) out.push(i + width);
  if (x > 0) out.push(i - 1);
  return out;
}

export function areAdjacent(a, b, width, height) {
  if (a === b) return false;
  const ax = a % width;
  const ay = Math.floor(a / width);
  const bx = b % width;
  const by = Math.floor(b / width);
  if (ay < 0 || by < 0 || ay >= height || by >= height) return false;
  return Math.abs(ax - bx) + Math.abs(ay - by) === 1;
}

/** Order-independent key for the edge between two cells. */
export function edgeKey(a, b) {
  return a < b ? a * EDGE_STRIDE + b : b * EDGE_STRIDE + a;
}

class LevelError extends Error {
  constructor(message) {
    super(message);
    this.name = 'LevelError';
  }
}

export { LevelError };

function isPositiveInt(n) {
  return Number.isInteger(n) && n > 0;
}

function isCellIndex(n, size) {
  return Number.isInteger(n) && n >= 0 && n < size;
}

const EMPTY_ADJ = new Int32Array(0);

/**
 * Open-cell adjacency for a board, with walls and barrier edges removed.
 * Split out from {@link compile} because the generator needs the graph before
 * it has any checkpoints to put on it.
 */
export function buildAdjacency(width, height, walls = [], barriers = []) {
  const size = width * height;
  const open = new Uint8Array(size).fill(1);
  for (const w of walls) {
    if (!isCellIndex(w, size)) throw new LevelError(`wall index out of range: ${w}`);
    if (!open[w]) throw new LevelError(`duplicate wall: ${w}`);
    open[w] = 0;
  }

  const blockedEdges = new Set();
  for (const edge of barriers) {
    if (!Array.isArray(edge) || edge.length !== 2) {
      throw new LevelError('each barrier must be a pair of cell indices');
    }
    const [a, b] = edge;
    if (!isCellIndex(a, size) || !isCellIndex(b, size)) {
      throw new LevelError(`barrier index out of range: [${a}, ${b}]`);
    }
    if (!areAdjacent(a, b, width, height)) {
      throw new LevelError(`barrier cells are not adjacent: [${a}, ${b}]`);
    }
    blockedEdges.add(edgeKey(a, b));
  }

  const adj = new Array(size);
  const openList = [];
  for (let i = 0; i < size; i++) {
    if (!open[i]) {
      adj[i] = EMPTY_ADJ;
      continue;
    }
    openList.push(i);
    const usable = [];
    for (const n of neighbours(i, width, height)) {
      if (!open[n]) continue;
      if (blockedEdges.has(edgeKey(i, n))) continue;
      usable.push(n);
    }
    adj[i] = Int32Array.from(usable);
  }

  return { size, open, adj, blockedEdges, openCells: Int32Array.from(openList), openCount: openList.length };
}

/** Are all open cells in a single connected component? */
export function isConnected(graph) {
  const { adj, openCells, openCount } = graph;
  if (openCount === 0) return false;
  const seen = new Set();
  const stack = [openCells[0]];
  seen.add(openCells[0]);
  while (stack.length) {
    const cur = stack.pop();
    for (const n of adj[cur]) {
      if (!seen.has(n)) {
        seen.add(n);
        stack.push(n);
      }
    }
  }
  return seen.size === openCount;
}

/**
 * Turn a level object into the flat structures the solver and validator use.
 * Throws LevelError on a structurally malformed level; a level that is merely
 * unsolvable compiles fine and simply yields zero solutions.
 *
 * Returned grid:
 *   open       Uint8Array  1 if the cell is playable
 *   openCells  Int32Array  indices of playable cells, ascending
 *   adj        Int32Array[] playable neighbours per cell (barriers removed)
 *   cpOrdinal  Int32Array  checkpoint number (0-based) per cell, -1 if none
 */
export function compile(level) {
  if (!level || typeof level !== 'object') throw new LevelError('level must be an object');

  const { width, height } = level;
  if (!isPositiveInt(width) || !isPositiveInt(height)) {
    throw new LevelError('width and height must be positive integers');
  }
  const size = width * height;
  if (size > EDGE_STRIDE) throw new LevelError(`grid too large: ${width}x${height}`);

  const walls = level.walls ?? [];
  const barriers = level.barriers ?? [];
  const checkpoints = level.checkpoints ?? [];
  if (!Array.isArray(walls) || !Array.isArray(barriers) || !Array.isArray(checkpoints)) {
    throw new LevelError('walls, barriers and checkpoints must be arrays');
  }

  const graph = buildAdjacency(width, height, walls, barriers);
  const { open, adj, blockedEdges } = graph;

  const cpOrdinal = new Int32Array(size).fill(-1);
  if (checkpoints.length === 0) throw new LevelError('level needs at least one checkpoint');
  for (let k = 0; k < checkpoints.length; k++) {
    const c = checkpoints[k];
    if (!isCellIndex(c, size)) throw new LevelError(`checkpoint index out of range: ${c}`);
    if (!open[c]) throw new LevelError(`checkpoint ${k + 1} sits on a wall: ${c}`);
    if (cpOrdinal[c] !== -1) throw new LevelError(`duplicate checkpoint cell: ${c}`);
    cpOrdinal[c] = k;
  }

  return {
    width,
    height,
    size,
    open,
    openCells: graph.openCells,
    openCount: graph.openCount,
    adj,
    blockedEdges,
    cpOrdinal,
    checkpoints: Int32Array.from(checkpoints),
    checkpointCount: checkpoints.length,
    start: checkpoints[0],
    end: checkpoints[checkpoints.length - 1],
  };
}
