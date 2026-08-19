/**
 * input.js — pointer and keyboard, and the path state they both edit.
 *
 * Mouse and touch are the same code path via Pointer Events. The only subtle
 * part is that a pointer can move several cells between two move events, so
 * we never trust the sampled cell alone: we walk the segment between the last
 * sample and this one, cell by cell, and take the whole move or none of it.
 */

import { isLegalStep } from './solver.js';

/**
 * Grid traversal (Amanatides & Woo). Yields every cell the segment passes
 * through, one axis-step at a time, so consecutive cells are always
 * orthogonally adjacent — a fast flick can never produce a diagonal jump.
 */
function* traverse(ax, ay, bx, by) {
  let x = Math.floor(ax);
  let y = Math.floor(ay);
  const endX = Math.floor(bx);
  const endY = Math.floor(by);
  const dx = bx - ax;
  const dy = by - ay;
  const stepX = Math.sign(dx);
  const stepY = Math.sign(dy);

  let tMaxX = dx === 0 ? Infinity : (stepX > 0 ? x + 1 - ax : ax - x) / Math.abs(dx);
  let tMaxY = dy === 0 ? Infinity : (stepY > 0 ? y + 1 - ay : ay - y) / Math.abs(dy);
  const tDeltaX = dx === 0 ? Infinity : 1 / Math.abs(dx);
  const tDeltaY = dy === 0 ? Infinity : 1 / Math.abs(dy);

  let guard = 0;
  while ((x !== endX || y !== endY) && guard++ < 512) {
    if (tMaxX < tMaxY) {
      x += stepX;
      tMaxX += tDeltaX;
    } else {
      y += stepY;
      tMaxY += tDeltaY;
    }
    yield [x, y];
  }
}

export function createInput(board, { onChange = () => {} } = {}) {
  let level = null;
  let grid = null;
  let path = [];
  let history = [];
  let locked = false;

  let pointerId = null;
  let last = null; // last pointer position, in cell units

  const svg = board.element;

  // -------------------------------------------------------------- path edits

  /**
   * Apply a single cell to the path.
   * @returns {boolean} false if the cell is not a legal thing to do next
   */
  function applyCell(cell) {
    if (cell < 0) return false;
    if (path.length === 0) {
      // A path may only begin at checkpoint 1.
      if (cell !== grid.start) return false;
      path = [cell];
      return true;
    }
    if (cell === path[path.length - 1]) return true; // still in the same cell

    // Anywhere already on the path truncates back to that point. That covers
    // both "step back one" and "drag back to the middle and start again".
    const at = path.indexOf(cell);
    if (at >= 0) {
      path = path.slice(0, at + 1);
      return true;
    }

    if (!isLegalStep(level, path, cell, grid)) return false;
    path = path.concat(cell);
    return true;
  }

  function commit() {
    onChange(path.slice());
  }

  function snapshot() {
    history.push(path.slice());
    if (history.length > 400) history.shift();
  }

  // ---------------------------------------------------------------- pointer

  function localCell(local) {
    if (!local) return -1;
    return board.cellFromLocal(local.x, local.y);
  }

  function onPointerDown(event) {
    if (locked || pointerId !== null) return;
    const local = board.localFromPoint(event.clientX, event.clientY);
    const cell = localCell(local);
    if (cell < 0) return;

    // Only the start checkpoint or a cell already drawn can begin a drag.
    const onPath = path.includes(cell);
    if (!onPath && !(path.length === 0 && cell === grid.start)) return;

    snapshot();
    pointerId = event.pointerId;
    last = local;
    // Capture keeps the drag alive outside the board. Not all pointers can be
    // captured, and failing to is never a reason to drop the gesture.
    try {
      svg.setPointerCapture(event.pointerId);
    } catch {
      /* carry on uncaptured */
    }
    event.preventDefault();
    svg.focus({ preventScroll: true });

    if (applyCell(cell)) commit();
  }

  function onPointerMove(event) {
    if (locked || event.pointerId !== pointerId) return;
    const local = board.localFromPoint(event.clientX, event.clientY);
    if (!local || !last) return;
    event.preventDefault();

    const before = path;
    for (const [x, y] of traverse(last.x, last.y, local.x, local.y)) {
      const inside = x >= 0 && y >= 0 && x < level.width && y < level.height;
      const cell = inside ? y * level.width + x : -1;
      if (cell < 0 || !grid.open[cell] || !applyCell(cell)) {
        // Take the whole move or none of it, so a fast drag across a wall
        // never leaves the line somewhere the player did not aim it.
        path = before;
        return;
      }
    }
    last = local;
    if (path !== before) commit();
  }

  function endDrag(event) {
    if (event.pointerId !== pointerId) return;
    try {
      if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
    } catch {
      /* nothing to release */
    }
    pointerId = null;
    last = null;
    // The path persists exactly as drawn. This is not a one-gesture game.
  }

  // --------------------------------------------------------------- keyboard

  function stepBy(dx, dy) {
    if (path.length === 0) {
      snapshot();
      if (applyCell(grid.start)) commit();
      return;
    }
    const head = path[path.length - 1];
    const x = (head % level.width) + dx;
    const y = Math.floor(head / level.width) + dy;
    if (x < 0 || y < 0 || x >= level.width || y >= level.height) return;
    const cell = y * level.width + x;
    if (!grid.open[cell]) return;
    snapshot();
    if (applyCell(cell)) commit();
    else history.pop(); // nothing happened; do not leave a dead undo step
  }

  function onKeyDown(event) {
    if (locked) return;
    const key = event.key;
    const moves = { ArrowUp: [0, -1], ArrowRight: [1, 0], ArrowDown: [0, 1], ArrowLeft: [-1, 0] };
    if (moves[key]) {
      event.preventDefault();
      stepBy(...moves[key]);
      return;
    }
    if (key === 'Backspace' || key === 'Delete') {
      event.preventDefault();
      retract();
      return;
    }
    if (key === 'r' || key === 'R') {
      event.preventDefault();
      restart();
      return;
    }
    if (key === 'z' || key === 'Z') {
      event.preventDefault();
      undo();
    }
  }

  // ------------------------------------------------------------------- api

  // Every edit below is refused while locked. The board is locked from the
  // moment a solve is detected until the next level is mounted, so nothing —
  // a stray key, a mistimed button press — can rewrite the line that is
  // currently animating.

  function retract() {
    if (locked || path.length === 0) return;
    snapshot();
    path = path.slice(0, -1);
    commit();
  }

  function undo() {
    if (locked || !history.length) return;
    path = history.pop();
    commit();
  }

  function restart() {
    if (locked || path.length === 0) return;
    snapshot();
    path = [];
    commit();
  }

  function setLevel(next) {
    level = next;
    grid = board.grid;
    path = [];
    history = [];
    pointerId = null;
    last = null;
    locked = false;
    commit();
  }

  svg.addEventListener('pointerdown', onPointerDown);
  svg.addEventListener('pointermove', onPointerMove);
  svg.addEventListener('pointerup', endDrag);
  svg.addEventListener('pointercancel', endDrag);
  svg.addEventListener('keydown', onKeyDown);
  // Belt and braces on iOS: never let a drag turn into a page gesture.
  svg.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
  svg.addEventListener('contextmenu', (e) => e.preventDefault());

  return {
    setLevel,
    undo,
    restart,
    retract,
    getPath: () => path.slice(),
    setPath(next) {
      if (locked) return;
      snapshot();
      path = next.slice();
      commit();
    },
    isLocked: () => locked,
    canUndo: () => history.length > 0,
    lock() {
      locked = true;
      pointerId = null;
    },
    unlock() {
      locked = false;
    },
  };
}
