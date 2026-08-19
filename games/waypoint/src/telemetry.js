/**
 * telemetry.js — where players stall, kept entirely on their own machine.
 *
 * Records, per level: how many times it was started, how many times it was
 * solved, total time spent, and how many sessions ended on it. The ratio of
 * starts to solves is the churn curve; the abandon count is where the ladder
 * is too steep.
 *
 * Deliberately local. SPEC §13 forbids external network requests, so nothing
 * here is sent anywhere — this exists so the numbers are being collected when
 * there is somewhere to send them (the platform's own analytics, Phase 3), and
 * so a build can be checked on a real device in the meantime.
 *
 *   JSON.parse(localStorage['waypoint:funnel'])
 *
 * Writes are batched: a solve is worth a write, a keystroke is not.
 */

import * as storage from './storage.js';

const KEY = 'funnel';
const FLUSH_MS = 4000;

let table = null;
let dirty = false;
let timer = 0;
let current = null; // { index, id, startedAt }

async function load() {
  if (!table) table = (await storage.get(KEY)) ?? {};
  return table;
}

function row(index) {
  const key = String(index);
  table[key] ??= { starts: 0, solves: 0, abandons: 0, ms: 0 };
  return table[key];
}

function schedule() {
  dirty = true;
  if (timer) return;
  timer = setTimeout(() => {
    timer = 0;
    flush();
  }, FLUSH_MS);
}

export async function flush() {
  if (!dirty || !table) return;
  dirty = false;
  await storage.set(KEY, table);
}

/** A board became interactive. */
export async function levelStarted(index, id) {
  await load();
  // Re-mounting the same level (leaving the daily, say) is not a new attempt.
  if (current?.index !== index) row(index).starts++;
  current = { index, id, startedAt: Date.now() };
  schedule();
}

/** A board was completed. */
export async function levelSolved(index, ms) {
  await load();
  const entry = row(index);
  entry.solves++;
  entry.ms += ms;
  current = null;
  schedule();
  await flush(); // a solve is worth writing through immediately
}

/**
 * The player stopped playing while a board was unsolved. Called on tab hide
 * and on pagehide, which between them cover closing, navigating and
 * backgrounding on mobile.
 */
export function sessionEnded() {
  if (!current || !table) return;
  const entry = row(current.index);
  entry.abandons++;
  entry.ms += Date.now() - current.startedAt;
  current = null;
  dirty = true;
  // No await: the page may be going away, and storage.set is synchronous
  // underneath. Anything that does not land here is one data point.
  storage.set(KEY, table);
}

/** Everything recorded so far, for inspection. */
export async function report() {
  const data = await load();
  const rows = Object.entries(data)
    .map(([index, r]) => ({
      level: Number(index) + 1,
      ...r,
      completion: r.starts ? r.solves / r.starts : 0,
      avgSeconds: r.solves ? Math.round(r.ms / r.solves / 1000) : 0,
    }))
    .sort((a, b) => a.level - b.level);
  return rows;
}

export async function reset() {
  table = {};
  current = null;
  await storage.set(KEY, table);
}
