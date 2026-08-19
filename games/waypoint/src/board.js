/**
 * board.js — SVG rendering.
 *
 * One board is rebuilt per level; after that only the trail, the visited fills
 * and the markers change, so a drag touches a handful of attributes rather
 * than re-rendering anything.
 *
 * All geometry is in cell units scaled by U, and the viewBox does the rest.
 * That means the board is crisp at any devicePixelRatio and hit-testing is a
 * matrix multiply, not a layout read.
 *
 * Every step of the line is exactly U long, so the drawn length is known
 * without ever calling getTotalLength(). That is what lets the line grow
 * instead of popping: set the dash array to the full length and animate the
 * dash offset down from however much was just added.
 *
 * Draw order matters and is: visited fills, hairline grid, walls, barriers,
 * hint, line casing, line, markers. The grid sits over the visited fill so
 * drawn cells keep their ruling, and under the walls so a wall reads as solid.
 */

import { compile } from './grid.js';
import { numberPath, numberWidth, GLYPH_H } from './numerals.js';

const NS = 'http://www.w3.org/2000/svg';

// Exported because tools/capture.js draws the same line into a canvas when it
// records the trailer. Sharing the constants is what keeps the recording and
// the game from drifting apart — nothing there is allowed to be a copy.
export const U = 100; // internal units per cell
export const STROKE = 0.34 * U; // the line
export const CASING = STROKE + 0.09 * U; // paper-coloured casing beneath it

const MARK_R = 0.29 * U;
const MARK_RING = 0.08 * U;
const TERMINUS_R = MARK_R + 0.055 * U; // outer ring on the first and last stop
const BARRIER_W = 0.1 * U;

const GROW_MS = 170; // SPEC §9: 150-250ms on path extension
const PULSE_MS = 220;
const RUN_MS = 700; // the solve animation, the one place to spend more
const EASE = 'cubic-bezier(0.22, 0.61, 0.36, 1)';

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function el(name, attrs, parent) {
  const node = document.createElementNS(NS, name);
  for (const key in attrs) node.setAttribute(key, attrs[key]);
  if (parent) parent.appendChild(node);
  return node;
}

export const centreX = (cell, w) => ((cell % w) + 0.5) * U;
export const centreY = (cell, w) => (Math.floor(cell / w) + 0.5) * U;

export function createBoard(svg) {
  let level = null;
  let grid = null;
  let visitedRects = [];
  let markers = [];
  let reached = new Set();
  let drawnLength = 0;
  let layers = null;

  function mount(next) {
    level = next;
    grid = compile(level);
    svg.textContent = '';
    svg.classList.remove('solved');
    const w = level.width * U;
    const h = level.height * U;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

    // Blocked cells are hatched rather than filled flat: it reads as "no
    // access" on a technical drawing, and it survives the dark palette, where
    // --wall sits within 1.09:1 of --paper and a flat block disappears.
    const defs = el('defs', {}, svg);
    const hatch = el(
      'pattern',
      { id: 'wall-hatch', width: 14, height: 14, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' },
      defs
    );
    el('rect', { class: 'wall-ground', width: 14, height: 14 }, hatch);
    el('line', { class: 'wall-rule', x1: 0, y1: 0, x2: 0, y2: 14, 'stroke-width': 5 }, hatch);

    // The line is lit along its length rather than flat, which is most of what
    // gives it body against the sheet.
    // userSpaceOnUse, not the default objectBoundingBox. A straight length of
    // line has a zero-height bounding box, which makes a bounding-box gradient
    // degenerate — the line renders black until it happens to turn a corner.
    // Anchoring the gradient to the board instead makes it independent of
    // whatever shape the path currently happens to be.
    const grad = el(
      'linearGradient',
      { id: 'line-grad', gradientUnits: 'userSpaceOnUse', x1: 0, y1: 0, x2: w * 0.85, y2: h },
      defs
    );
    el('stop', { offset: '0%', 'stop-color': 'var(--line-lit)' }, grad);
    el('stop', { offset: '55%', 'stop-color': 'var(--line)' }, grad);
    el('stop', { offset: '100%', 'stop-color': 'var(--line-deep)' }, grad);

    // A wash of the tier's colour into the sheet, strongest at the top.
    const wash = el('radialGradient', { id: 'board-wash', cx: '50%', cy: '0%', r: '115%' }, defs);
    el('stop', { offset: '0%', 'stop-color': 'var(--line)', 'stop-opacity': '0.16' }, wash);
    el('stop', { offset: '60%', 'stop-color': 'var(--line)', 'stop-opacity': '0.05' }, wash);
    el('stop', { offset: '100%', 'stop-color': 'var(--line)', 'stop-opacity': '0' }, wash);

    el('rect', { class: 'board-ground', x: 0, y: 0, width: w, height: h }, svg);
    el('rect', { class: 'board-wash', x: 0, y: 0, width: w, height: h }, svg);

    const fills = el('g', {}, svg);
    const gridLines = el('g', { class: 'grid-lines' }, svg);
    const walls = el('g', {}, svg);
    const barriers = el('g', {}, svg);
    const trailHint = el('path', { class: 'trail-hint', 'stroke-width': STROKE * 0.42 }, svg);
    // A dropped copy of the line, offset downward. Cheaper than an SVG filter,
    // which would re-rasterise on every pointer move.
    const shadow = el('path', { class: 'trail-shadow', 'stroke-width': CASING }, svg);
    const casing = el('path', { class: 'trail-casing', 'stroke-width': CASING }, svg);
    const trail = el('path', { class: 'trail', 'stroke-width': STROKE }, svg);
    // Classed so tools/capture.js can lift the markers out as their own layer
    // and redraw them over the animated line, the way they sit here.
    const marks = el('g', { class: 'marks' }, svg);

    visitedRects = new Array(grid.size).fill(null);
    for (let i = 0; i < grid.size; i++) {
      if (!grid.open[i]) continue;
      const x = (i % level.width) * U;
      const y = Math.floor(i / level.width) * U;
      visitedRects[i] = el('rect', { class: 'cell-visited', x, y, width: U, height: U }, fills);
    }

    // A ruled sheet, not a table of boxes: full-span hairlines plus a firmer
    // border, which is what makes it read as plotting paper.
    for (let x = 1; x < level.width; x++) {
      el('line', { class: 'grid-line', x1: x * U, y1: 0, x2: x * U, y2: h }, gridLines);
    }
    for (let y = 1; y < level.height; y++) {
      el('line', { class: 'grid-line', x1: 0, y1: y * U, x2: w, y2: y * U }, gridLines);
    }
    el('rect', { class: 'grid-frame', x: 0, y: 0, width: w, height: h }, gridLines);

    for (let i = 0; i < grid.size; i++) {
      if (grid.open[i]) continue;
      const x = (i % level.width) * U;
      const y = Math.floor(i / level.width) * U;
      el('rect', { class: 'cell-wall', x, y, width: U, height: U }, walls);
    }

    // Barriers sit on the shared edge with end caps, so they read as a gate
    // across the crossing rather than as a border of one cell.
    for (const [a, b] of level.barriers ?? []) {
      const horizontal = Math.abs(a - b) === 1;
      const lo = Math.min(a, b);
      const x = (lo % level.width) * U;
      const y = Math.floor(lo / level.width) * U;
      const group = el('g', { class: 'barrier' }, barriers);
      if (horizontal) {
        el('line', { 'stroke-width': BARRIER_W, x1: x + U, y1: y + U * 0.16, x2: x + U, y2: y + U * 0.84 }, group);
      } else {
        el('line', { 'stroke-width': BARRIER_W, x1: x + U * 0.16, y1: y + U, x2: x + U * 0.84, y2: y + U }, group);
      }
    }

    // Station markers, drawn last so the line passes behind them. The first
    // and last stop get the double ring a transit map gives a terminus.
    const lastIndex = level.checkpoints.length - 1;
    markers = level.checkpoints.map((cell, k) => {
      const cx = centreX(cell, level.width);
      const cy = centreY(cell, level.width);
      const terminus = k === 0 || k === lastIndex;
      const group = el('g', { class: `mark${terminus ? ' terminus' : ''}` }, marks);
      if (terminus) {
        el('circle', { class: 'mark-outer', cx, cy, r: TERMINUS_R, 'stroke-width': MARK_RING * 0.45 }, group);
      }
      el('circle', { class: 'mark-shadow', cx, cy: cy + 2.5, r: MARK_R }, group);
      const disc = el('circle', { class: 'mark-disc', cx, cy, r: MARK_R, 'stroke-width': MARK_RING }, group);

      // Numerals are drawn, not typeset — see numerals.js.
      const number = k + 1;
      const glyphWidth = numberWidth(number);
      const fitHeight = (U * 0.4) / GLYPH_H;
      const fitWidth = (MARK_R * 1.42) / glyphWidth;
      const scale = Math.min(fitHeight, fitWidth);
      el(
        'path',
        {
          class: 'mark-label',
          d: numberPath(number),
          // Keep the drawn weight constant however far the glyphs are scaled,
          // so a "12" is not visibly lighter than a "3".
          'stroke-width': U * 0.052 / scale,
          transform:
            `translate(${cx - (glyphWidth * scale) / 2} ${cy - (GLYPH_H * scale) / 2}) scale(${scale})`,
        },
        group
      );
      return { cell, group, disc };
    });

    stopDemo();
    reached = new Set();
    drawnLength = 0;
    layers = { trail, casing, trailHint, shadow, marks };
    setPath([], { animate: false });
    setHint([]);
  }

  function pathData(cells) {
    if (!cells.length) return '';
    const x = centreX(cells[0], level.width);
    const y = centreY(cells[0], level.width);
    // A single cell becomes a zero-length segment, which a round linecap
    // renders as a dot the full width of the line. That is the line's own
    // start, not a separate marker that has to be kept in sync with it.
    if (cells.length === 1) return `M${x} ${y}L${x} ${y}`;
    let d = `M${x} ${y}`;
    for (let i = 1; i < cells.length; i++) {
      d += `L${centreX(cells[i], level.width)} ${centreY(cells[i], level.width)}`;
    }
    return d;
  }

  function setPath(cells, options = {}) {
    const { trail, casing, shadow } = layers;
    const length = Math.max(0, (cells.length - 1) * U);
    const d = pathData(cells);

    trail.setAttribute('d', d);
    casing.setAttribute('d', d);
    shadow.setAttribute('d', d);

    for (const node of [trail, casing, shadow]) {
      node.style.strokeDasharray = length > 0 ? String(length) : 'none';
      node.style.strokeDashoffset = '0';
    }

    // Grow into the new cells rather than snapping to them. The casing grows
    // with the line, or it would run ahead of it.
    const added = length - drawnLength;
    if (added > 0 && options.animate !== false && !reducedMotion()) {
      for (const node of [trail, casing, shadow]) {
        node.animate([{ strokeDashoffset: added }, { strokeDashoffset: 0 }], {
          duration: GROW_MS,
          easing: EASE,
        });
      }
    }
    drawnLength = length;

    const on = new Set(cells);
    for (let i = 0; i < visitedRects.length; i++) {
      if (visitedRects[i]) visitedRects[i].classList.toggle('on', on.has(i));
    }

    // Checkpoint activation: pulse the marker the first time it is reached.
    for (const marker of markers) {
      const live = on.has(marker.cell);
      const was = reached.has(marker.cell);
      marker.group.classList.toggle('on', live);
      if (live && !was && options.animate !== false && !reducedMotion()) {
        marker.disc.animate([{ r: MARK_R }, { r: MARK_R * 1.14 }, { r: MARK_R }], {
          duration: PULSE_MS,
          easing: EASE,
        });
      }
      if (live) reached.add(marker.cell);
      else reached.delete(marker.cell);
    }
  }

  /** A faint dotted continuation showing the next few true cells. */
  function setHint(cells) {
    layers.trailHint.setAttribute('d', cells.length > 1 ? pathData(cells) : '');
  }

  /**
   * The signature moment: the completed line redraws itself end to end.
   * Always resolves — a board that never advances because an animation event
   * went missing is worse than one that advances without the flourish.
   */
  function runLine() {
    svg.classList.add('solved');
    if (reducedMotion() || drawnLength === 0) return Promise.resolve();

    const options = { duration: RUN_MS, easing: EASE };
    const frames = [{ strokeDashoffset: drawnLength }, { strokeDashoffset: 0 }];
    layers.casing.animate(frames, options);
    const animation = layers.trail.animate(frames, options);
    return Promise.race([
      animation.finished.catch(() => {}),
      new Promise((resolve) => setTimeout(resolve, RUN_MS + 400)),
    ]);
  }

  // ------------------------------------------------------------------ demo

  let demo = null;

  /**
   * Walk a ghost pointer along `cells`, drawing the line behind it, and loop.
   *
   * This is how a first-time player is shown the rule: on the board, in the
   * board's own language, with no words and nothing covering anything. SPEC
   * §14 rules out a tutorial overlay and §2 explains why — the audience is
   * global and the platform measures how fast players reach gameplay. A
   * demonstration costs neither a click nor a translation.
   */
  function playDemo(cells) {
    stopDemo();
    // layers is null until a board is mounted, and insertBefore would throw.
    if (!layers || reducedMotion() || !cells || cells.length < 2) return;

    const trail = el('path', { class: 'demo-trail', 'stroke-width': STROKE * 0.8 }, null);
    const dot = el('circle', { class: 'demo-pointer', r: U * 0.19 }, null);
    svg.insertBefore(trail, layers.marks);
    svg.insertBefore(dot, layers.marks);

    const STEP_MS = 300;
    const HOLD_MS = 900;
    const span = (cells.length - 1) * STEP_MS;
    let started = 0;
    let loops = 0;
    let raf = 0;

    const at = (i) => [centreX(cells[i], level.width), centreY(cells[i], level.width)];

    function tick(now) {
      if (!started) started = now;
      const elapsed = now - started;

      if (elapsed > span + HOLD_MS) {
        loops++;
        // Three passes is enough to read; after that it is just movement.
        if (loops >= 3) {
          stopDemo();
          return;
        }
        started = now;
        raf = requestAnimationFrame(tick);
        return;
      }

      const t = Math.min(1, elapsed / span);
      const pos = t * (cells.length - 1);
      const i = Math.min(cells.length - 2, Math.floor(pos));
      const frac = pos - i;
      const [ax, ay] = at(i);
      const [bx, by] = at(i + 1);
      const x = ax + (bx - ax) * frac;
      const y = ay + (by - ay) * frac;

      let d = `M${at(0)[0]} ${at(0)[1]}`;
      for (let k = 1; k <= i; k++) d += `L${at(k)[0]} ${at(k)[1]}`;
      d += `L${x} ${y}`;
      trail.setAttribute('d', d);
      dot.setAttribute('cx', x);
      dot.setAttribute('cy', y);
      // Fade the whole thing out over the hold, so the loop does not snap.
      const fade = elapsed > span ? 1 - (elapsed - span) / HOLD_MS : 1;
      trail.setAttribute('opacity', fade);
      dot.setAttribute('opacity', fade);

      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    demo = {
      stop() {
        cancelAnimationFrame(raf);
        trail.remove();
        dot.remove();
      },
    };
  }

  function stopDemo() {
    if (!demo) return;
    demo.stop();
    demo = null;
  }

  function cellFromLocal(cx, cy) {
    const x = Math.floor(cx);
    const y = Math.floor(cy);
    if (x < 0 || y < 0 || x >= level.width || y >= level.height) return -1;
    const cell = y * level.width + x;
    return grid.open[cell] ? cell : -1;
  }

  function localFromPoint(clientX, clientY) {
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const point = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
    return { x: point.x / U, y: point.y / U };
  }

  function cellFromPoint(clientX, clientY) {
    const local = localFromPoint(clientX, clientY);
    return local ? cellFromLocal(local.x, local.y) : -1;
  }

  return {
    element: svg,
    mount,
    setPath,
    setHint,
    runLine,
    playDemo,
    stopDemo,
    cellFromPoint,
    cellFromLocal,
    localFromPoint,
    get grid() {
      return grid;
    },
    get level() {
      return level;
    },
  };
}
