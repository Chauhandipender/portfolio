/**
 * daily.js — one puzzle per day, identical for every player, forever.
 *
 * The seed is the UTC date, never the local one. If it were local, a player in
 * Auckland and a player in Los Angeles would be on different puzzles for most
 * of the day, and the streak would mean different things to each of them.
 *
 * Nothing about the board is stored: it is regenerated from the date on
 * demand, which is why the RNG had to be seeded and deterministic from day one.
 */

import { makeRng } from './rng.js';
import { generateLevelWithRetry } from './generator.js';
import * as storage from './storage.js';

const KEY = 'daily';

/** YYYY-MM-DD in UTC. */
export function dayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

/** The day before `key`, as a key. */
export function previousDay(key) {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return dayKey(d);
}

/**
 * The daily board. Fixed shape so that "today was hard" is about the puzzle
 * and not about which size the generator happened to pick.
 */
export function dailyLevel(key = dayKey()) {
  const rng = makeRng(`waypoint-daily:${key}`);
  const level = generateLevelWithRetry(
    {
      rng,
      width: 7,
      height: 7,
      tier: 4,
      wallCount: 4,
      barrierCount: 2,
      rules: { requireBacktracking: true },
    },
    400
  );
  if (!level) return null;
  return { ...level, id: `daily-${key}`, daily: true };
}

const EMPTY = { streak: 0, best: 0, lastSolved: null, solvedDays: 0, repaired: false };

export async function readStreak() {
  return (await storage.get(KEY)) ?? { ...EMPTY };
}

/** Has today's puzzle already been solved? */
export async function isSolvedToday(key = dayKey()) {
  const state = await readStreak();
  return state.lastSolved === key;
}

/**
 * Record a solve. Consecutive days extend the streak, a gap restarts it, and
 * solving the same day twice changes nothing.
 *
 * A single missed day is forgiven once per run. Losing a long streak to one
 * busy day is the moment people stop coming back, and the repair costs nothing
 * to anyone who was never going to return anyway. It is spent on use, so the
 * second miss in the same run does end it.
 */
export async function recordDailySolve(key = dayKey()) {
  const state = await readStreak();
  if (state.lastSolved === key) return state;

  const yesterday = previousDay(key);
  const dayBefore = previousDay(yesterday);

  let streak;
  let repaired = state.repaired ?? false;
  if (state.lastSolved === yesterday) {
    streak = state.streak + 1;
  } else if (state.lastSolved === dayBefore && !repaired) {
    streak = state.streak + 1;
    repaired = true; // the one free miss for this run is now spent
  } else {
    streak = 1;
    repaired = false; // a fresh run gets a fresh repair
  }

  const next = {
    streak,
    best: Math.max(state.best ?? 0, streak),
    lastSolved: key,
    solvedDays: (state.solvedDays ?? 0) + 1,
    repaired,
  };
  await storage.set(KEY, next);
  return next;
}

/**
 * A streak is only live if it was kept up to today or yesterday. Read this
 * rather than the stored number when displaying it, otherwise a player who
 * stopped in March comes back in July to a proud "streak: 9".
 */
export function liveStreak(state, key = dayKey()) {
  if (!state?.lastSolved) return 0;
  if (state.lastSolved === key || state.lastSolved === previousDay(key)) return state.streak;
  // Missed exactly one day with the repair still unspent: the run is not dead
  // yet, and showing it is the whole point of having a repair.
  if (!state.repaired && state.lastSolved === previousDay(previousDay(key))) return state.streak;
  return 0;
}

/** Is the streak currently only alive because a repair is still available? */
export function isAtRisk(state, key = dayKey()) {
  if (!state?.lastSolved || state.repaired) return false;
  return state.lastSolved === previousDay(previousDay(key));
}
