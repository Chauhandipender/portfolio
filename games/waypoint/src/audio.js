/**
 * audio.js — every sound in the game, synthesized. No audio files.
 *
 * The brief is "under the threshold of annoying", which mostly means: quiet,
 * short, and in tune with itself. Notes are snapped to a pentatonic scale so
 * that a rising run of clicks can never land on a sour interval, and the whole
 * mix sits at a low gain with fast decays.
 *
 * The context is created lazily and resumed on the first real gesture, because
 * browsers refuse to start audio before one.
 */

// Semitone offsets of a major pentatonic scale: no minor seconds, no tritone,
// so any two of these sound fine together in any order.
const PENTATONIC = [0, 2, 4, 7, 9];
const ROOT = 220; // A3
const CLICK_GAIN = 0.05;
const SOLVE_GAIN = 0.09;

let context = null;
let master = null;
let enabled = true;
let muted = false; // set by the platform; overrides the player's own toggle

function snap(semitones) {
  const octave = Math.floor(semitones / 12);
  const within = semitones - octave * 12;
  let best = PENTATONIC[0];
  for (const p of PENTATONIC) {
    if (Math.abs(p - within) < Math.abs(best - within)) best = p;
  }
  return octave * 12 + best;
}

const hz = (semitones) => ROOT * 2 ** (semitones / 12);

function ensureContext() {
  if (context) return context;
  const Ctor = globalThis.AudioContext ?? globalThis.webkitAudioContext;
  if (!Ctor) return null;
  try {
    context = new Ctor();
    master = context.createGain();
    master.gain.value = 1;
    master.connect(context.destination);
  } catch {
    context = null; // audio is a luxury; never let it break the game
  }
  return context;
}

function audible() {
  return enabled && !muted && ensureContext() !== null;
}

/**
 * One short tone. `type` shapes the timbre; everything else is envelope.
 */
function tone(frequency, { at = 0, duration = 0.12, gain = CLICK_GAIN, type = 'sine' } = {}) {
  const ctx = context;
  const start = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);

  // Fast attack, exponential decay. A linear release clicks audibly.
  env.gain.setValueAtTime(0.0001, start);
  env.gain.exponentialRampToValueAtTime(gain, start + 0.006);
  env.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(env);
  env.connect(master);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** Call from the first pointer or key event. Safe to call repeatedly. */
export function unlock() {
  const ctx = ensureContext();
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
}

/**
 * A cell was entered. The pitch climbs with how much of the board is drawn —
 * about an octave and a half from empty to full, so the run has somewhere to
 * go without ever getting shrill.
 */
export function step(pathLength, openCount) {
  if (!audible()) return;
  const progress = openCount > 1 ? Math.min(1, (pathLength - 1) / (openCount - 1)) : 0;
  tone(hz(snap(Math.round(progress * 19))), { duration: 0.09, gain: CLICK_GAIN, type: 'triangle' });
}

/** The line was pulled back. Same click, a touch lower and quieter. */
export function retract(pathLength, openCount) {
  if (!audible()) return;
  const progress = openCount > 1 ? Math.min(1, pathLength / (openCount - 1)) : 0;
  tone(hz(snap(Math.round(progress * 19)) - 2), { duration: 0.06, gain: CLICK_GAIN * 0.6, type: 'sine' });
}

/** Solved: a short resolving chord, rolled slightly so it reads as an arrival. */
export function solve() {
  if (!audible()) return;
  const chord = [0, 4, 7, 12, 19]; // root, third, fifth, octave, twelfth
  chord.forEach((semi, i) => {
    tone(hz(semi), {
      at: i * 0.045,
      duration: 0.9 - i * 0.08,
      gain: SOLVE_GAIN / (i + 1.4),
      type: i === 0 ? 'triangle' : 'sine',
    });
  });
}

export function setEnabled(value) {
  enabled = !!value;
}

export function isEnabled() {
  return enabled;
}

/** The platform's mute wins over the in-game toggle (SPEC §9). */
export function setPlatformMuted(value) {
  muted = !!value;
}

/** Silence everything immediately — used before ads and on tab blur. */
export function suspend() {
  if (context && context.state === 'running') context.suspend().catch(() => {});
}

export function resume() {
  if (context && context.state === 'suspended' && enabled && !muted) context.resume().catch(() => {});
}
