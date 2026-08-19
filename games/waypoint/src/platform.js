/**
 * platform.js — the CrazyGames adapter, stubbed.
 *
 * Phase 1 and 2 run against this no-op implementation so the game is
 * submittable for Basic Launch without the SDK. Phase 3 replaces the bodies
 * with real SDK calls — read the live docs first, do not guess method names —
 * and no caller changes.
 *
 * The one rule for callers: treat every method as async and assume any ad
 * call may take an arbitrarily long time or never resolve a reward.
 */

import * as storage from './storage.js';

let gameplayActive = false;

export function loadingStart() {
  /* Phase 3: SDK loading start */
}

export function loadingStop() {
  /* Phase 3: SDK loading stop */
}

/** Call when a board becomes interactive. */
export function gameplayStart() {
  if (gameplayActive) return;
  gameplayActive = true;
}

/** Call before any ad, on tab blur, and whenever a modal opens. */
export function gameplayStop() {
  if (!gameplayActive) return;
  gameplayActive = false;
}

export function isGameplayActive() {
  return gameplayActive;
}

export async function requestMidgameAd() {
  return false; // no ad shown
}

/** Resolves true only if the reward was actually earned. */
export async function requestRewardedAd() {
  return false;
}

export function isAudioMuted() {
  return false;
}

export async function saveData(key, value) {
  return storage.set(key, value);
}

export async function loadData(key) {
  return storage.get(key);
}
