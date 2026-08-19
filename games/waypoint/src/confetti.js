/**
 * confetti.js — the solve celebration.
 *
 * A single full-viewport canvas, created on first use and reused after that.
 * Canvas rather than DOM nodes because a hundred rotating rectangles as
 * elements would cost a layout pass per frame; here it is one draw call loop
 * that touches nothing else on the page.
 *
 * The canvas never takes pointer events and sits under the panel's top layer,
 * so it cannot interfere with play. It also outlives the level transition on
 * purpose: the burst carries over the board sliding out beneath it.
 */

/**
 * Every constant here is expressed per 60Hz frame, and `frame()` scales them
 * by how long the frame actually took. The platform requires physics to behave
 * the same across refresh rates, and a per-frame integration runs 2.4x fast on
 * a 144Hz monitor — the burst would be over before the player looked up.
 */
const GRAVITY = 0.42;
const DRAG = 0.994;
const SPIN_DRAG = 0.97;
const LIFE = 135; // 60Hz frames — long enough to arc up and fall back down

const FRAME_MS = 1000 / 60;
// A tab that was hidden, or a stall, hands back an enormous delta. Integrating
// it in one go teleports every particle off screen, so cap the step. The floor
// guarantees the field still ages if a clock ever repeats a timestamp.
const MIN_STEP = 0.2;
const MAX_STEP = 3;

// Two cannons in the bottom corners, angled up and inward so their arcs cross
// over the middle of the screen. Angles are measured with y pointing down, so
// a negative angle fires upward.
const CANNONS = [
  { x: 0.015, y: 1.02, angle: -62 }, // lower left, firing up and to the right
  { x: 0.985, y: 1.02, angle: -118 }, // lower right, firing up and to the left
];
const SPREAD = 26; // degrees either side of the barrel
const PEAK = 0.72; // fraction of the viewport height the highest arc reaches
const SPEED_MIN = 0.72; // muzzle speed varies per particle, in this range
const SPEED_VAR = 0.5;

let canvas = null;
let ctx = null;
let particles = [];
let running = false;
let ratio = 1;
let last = null; // timestamp of the previous frame

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function ensureCanvas() {
  if (canvas) return canvas;
  canvas = document.createElement('canvas');
  canvas.className = 'confetti';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  ctx = canvas.getContext('2d');
  resize();
  addEventListener('resize', resize);
  return canvas;
}

function resize() {
  if (!canvas) return;
  ratio = Math.min(2, devicePixelRatio || 1);
  canvas.width = Math.floor(innerWidth * ratio);
  canvas.height = Math.floor(innerHeight * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

/** The tier's own colours, so the burst belongs to the line just completed. */
function palette() {
  const style = getComputedStyle(document.documentElement);
  const found = ['--line-lit', '--line', '--line-deep', '--ink']
    .map((name) => style.getPropertyValue(name).trim())
    .filter(Boolean);
  // If the tokens ever fail to resolve, `i % 0` would be NaN and every
  // particle would silently render with no fill.
  return found.length ? found : ['#c8452e'];
}

/**
 * Fire both cannons.
 *
 * Muzzle speed is derived from the viewport rather than fixed, so the arcs
 * reach the same fraction of the screen on a phone as on a desktop instead of
 * barely clearing the bottom on one and flying off the top of the other.
 *
 * Silently does nothing under reduced motion — celebration is exactly the kind
 * of movement that setting is asking us not to make.
 */
export function burst(count = 120) {
  if (reducedMotion()) return;
  ensureCanvas();

  const colours = palette();
  // Solve v = sqrt(2·g·h) for the *fastest* particle, so the top of the random
  // range is what just reaches PEAK and everything else falls short of it.
  // Solving for the average instead sends half the confetti off the top.
  const apex = innerHeight * PEAK;
  const muzzle = (Math.sqrt(2 * GRAVITY * apex) / (SPEED_MIN + SPEED_VAR)) * 1.08;
  const perCannon = Math.ceil(count / CANNONS.length);

  for (const cannon of CANNONS) {
    const originX = innerWidth * cannon.x;
    const originY = innerHeight * cannon.y;

    for (let i = 0; i < perCannon; i++) {
      const angle = ((cannon.angle + (Math.random() - 0.5) * 2 * SPREAD) * Math.PI) / 180;
      const speed = muzzle * (SPEED_MIN + Math.random() * SPEED_VAR);
      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        w: 5 + Math.random() * 5,
        h: 8 + Math.random() * 6,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.4,
        colour: colours[i % colours.length],
        life: LIFE + Math.random() * 40,
        age: 0,
      });
    }
  }

  if (!running) {
    running = true;
    last = null;
    requestAnimationFrame(frame);
  }
}

function frame(now) {
  // How many 60Hz frames' worth of time has actually passed.
  const step = last === null ? 1 : Math.min(MAX_STEP, Math.max(MIN_STEP, (now - last) / FRAME_MS));
  last = now;

  // Drag is multiplicative, so it scales as a power of the step rather than a
  // product. Once per frame, not once per particle.
  const drag = DRAG ** step;
  const spinDrag = SPIN_DRAG ** step;
  const gravity = GRAVITY * step;

  ctx.clearRect(0, 0, innerWidth, innerHeight);

  for (const p of particles) {
    p.age += step;
    p.vy += gravity;
    p.vx *= drag;
    p.vy *= drag;
    p.vrot *= spinDrag;
    p.x += p.vx * step;
    p.y += p.vy * step;
    p.rot += p.vrot * step;

    const fade = Math.max(0, 1 - p.age / p.life);
    ctx.globalAlpha = fade < 0.3 ? fade / 0.3 : 1;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    // Squash across the short axis as it spins, so a flat strip reads as a
    // piece of paper tumbling rather than a rectangle sliding.
    ctx.scale(1, Math.abs(Math.cos(p.rot * 1.6)) * 0.7 + 0.3);
    ctx.fillStyle = p.colour;
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  // Cull only what is falling and has left the bottom. Testing height alone
  // would kill every particle on the frame it spawned, since the cannons sit
  // just below the viewport.
  particles = particles.filter((p) => p.age < p.life && !(p.vy > 0 && p.y > innerHeight + 40));

  if (particles.length) {
    requestAnimationFrame(frame);
  } else {
    running = false;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
  }
}

/** Clear immediately — used when the tab is hidden or the game resets. */
export function clear() {
  particles = [];
  if (ctx) ctx.clearRect(0, 0, innerWidth, innerHeight);
}
