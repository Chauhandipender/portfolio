/**
 * numerals.js — the game's digits, drawn as paths.
 *
 * The core loop contains no words, only numbers, so the "typeface" only ever
 * needs ten glyphs. Drawing them here rather than shipping a font means no
 * network request, no subsetting toolchain, about a kilobyte of source, and
 * numerals that match the line's own stroke language exactly: one weight,
 * geometric construction, round terminals.
 *
 * Glyphs are designed on a 12 x 18 box with the stroke centred, so the drawn
 * extent is inset by half a stroke on every side.
 */

export const GLYPH_W = 12;
export const GLYPH_H = 18;
export const GLYPH_STROKE = 2.5;
const TRACKING = 1.6;

// Geometric monoline digits. Bowls are true circular arcs so the weight stays
// even all the way round; stems and diagonals are straight.
const DIGITS = [
  // 0 — a stadium, so it never reads as a capital O
  'M2.35 6.15A3.65 3.65 0 0 1 9.65 6.15L9.65 11.85A3.65 3.65 0 0 1 2.35 11.85Z',
  // 1
  'M3.3 5.5L6.35 2.4L6.35 15.6',
  // 2
  'M2.4 6.2A3.6 3.6 0 1 1 9.6 6.7L2.5 15.6L9.9 15.6',
  // 3
  'M2.6 4.7A3.4 3.4 0 1 1 6.15 9A3.4 3.4 0 1 1 2.6 13.3',
  // 4
  'M8.5 15.6L8.5 2.6L2.1 11.75L10.5 11.75',
  // 5
  'M9.3 2.6L3.35 2.6L2.95 8.5A3.75 3.75 0 1 1 2.7 14.3',
  // 6 — bowl plus the shoulder that sweeps up out of it
  'M8.9 3.2A7.4 7.4 0 0 0 2.3 10.1M2.3 10.1A3.75 3.75 0 0 1 9.8 10.1A3.75 3.75 0 0 1 2.3 10.1',
  // 7
  'M2.4 2.6L9.8 2.6L4.9 15.6',
  // 8 — two bowls, the lower one a touch larger so it does not look top-heavy
  'M2.65 5.85A3.35 3.35 0 0 1 9.35 5.85A3.35 3.35 0 0 1 2.65 5.85M2.3 12.05A3.7 3.7 0 0 1 9.7 12.05A3.7 3.7 0 0 1 2.3 12.05',
  // 9 — the 6 turned about its centre
  'M3.1 14.8A7.4 7.4 0 0 0 9.7 7.9M9.7 7.9A3.75 3.75 0 0 1 2.2 7.9A3.75 3.75 0 0 1 9.7 7.9',
];

// A colon, so clock times can be set in the same hand as everything else.
// Two zero-length segments, which a round linecap renders as dots.
const COLON = { path: 'M3 6.6L3 6.6M3 12.2L3 12.2', advance: 6 };

function glyph(char) {
  if (char === ':') return COLON;
  const digit = Number(char);
  return Number.isInteger(digit) && digit >= 0 && digit <= 9
    ? { path: DIGITS[digit], advance: GLYPH_W }
    : null;
}

/** Path data for a single digit 0-9. */
export function digitPath(digit) {
  return DIGITS[digit] ?? '';
}

/** Total advance width of a string of digits and colons, in glyph units. */
export function numberWidth(value) {
  const chars = String(value).split('');
  let width = 0;
  chars.forEach((char, i) => {
    width += glyph(char)?.advance ?? 0;
    if (i > 0) width += TRACKING;
  });
  return width;
}

/**
 * Path data for a whole number, laid out left to right on the glyph box.
 * Returns one path string; the caller sets stroke, width and transform.
 */
export function numberPath(value) {
  let out = '';
  let offset = 0;
  String(value)
    .split('')
    .forEach((char, i) => {
      const g = glyph(char);
      if (!g) return;
      if (i > 0) offset += TRACKING;
      // Shift each glyph by rewriting only the absolute x coordinates, which
      // is safe here because every command in the set is M, L, A or Z.
      out += offset === 0 ? g.path : shiftX(g.path, offset);
      offset += g.advance;
    });
  return out;
}

/**
 * A standalone <svg> of a number, for use in HTML. Sized by height; the
 * viewBox does the rest, so it stays crisp at any scale.
 */
export function numberElement(value, className = '') {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  const width = numberWidth(value);
  svg.setAttribute('viewBox', `-1 -1 ${width + 2} ${GLYPH_H + 2}`);
  svg.setAttribute('class', className);
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(NS, 'path');
  path.setAttribute('d', numberPath(value));
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', GLYPH_STROKE);
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(path);
  return svg;
}

/** Translate an M/L/A/Z path along x. */
function shiftX(path, dx) {
  return path.replace(/([MLA])([^MLAZ]*)/g, (_, command, args) => {
    const numbers = args.trim().split(/[\s,]+/).map(Number);
    if (command === 'M' || command === 'L') {
      for (let i = 0; i < numbers.length; i += 2) numbers[i] += dx;
    } else {
      // A rx ry rot large sweep x y
      for (let i = 5; i < numbers.length; i += 7) numbers[i] += dx;
    }
    return command + numbers.join(' ');
  });
}
