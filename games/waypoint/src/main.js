/**
 * main.js — bootstrap, level progression, and the glue between board, input,
 * audio and storage.
 *
 * There is no menu, no splash and no start button: the first board is mounted
 * as soon as the pack arrives, and the player is in gameplay with zero clicks.
 * The panel exists, but it is opt-in and nothing routes through it.
 */

import { createBoard } from './board.js';
import { createInput } from './input.js';
import { checkSolution } from './solver.js';
import { endlessLevel } from './endless.js';
import { numberElement } from './numerals.js';
import * as storage from './storage.js';
import * as platform from './platform.js';
import * as audio from './audio.js';
import * as daily from './daily.js';
import * as confetti from './confetti.js';
import * as telemetry from './telemetry.js';
import * as sitelock from './sitelock.js';

const LINES = [null, 'clay', 'cobalt', 'ochre', 'moss', 'plum', 'teal', 'bronze', 'indigo'];
const MAX_TIER = LINES.length - 1;

const ADVANCE_DELAY = 900; // SPEC §8: auto-advance, no button to press
const TRANSITION = 180;
const HINT_CELLS = 3;
const THEMES = ['system', 'light', 'dark'];

const ui = {
  board: document.getElementById('board'),
  lineName: document.getElementById('line-name'),
  levelNumber: document.getElementById('level-number'),
  undo: document.getElementById('undo'),
  restart: document.getElementById('restart'),
  hint: document.getElementById('hint'),
  progress: document.getElementById('progress'),
  progressFill: document.getElementById('progress-fill'),
  openPanel: document.getElementById('open-panel'),
  panel: document.getElementById('panel'),
  panelClose: document.getElementById('panel-close'),
  dailyPlay: document.getElementById('daily-play'),
  dailyNote: document.getElementById('daily-note'),
  stats: document.getElementById('stats'),
  themeToggle: document.getElementById('theme-toggle'),
  audioToggle: document.getElementById('audio-toggle'),
  announce: document.getElementById('announce'),
};

const board = createBoard(ui.board);
let input = null;

let pack = [];
let index = 0; // position on the ladder
let mode = 'ladder'; // or 'daily'
let level = null;
let startedAt = 0;
let solving = false;
let lastPathLength = 0;
let theme = 'system';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const say = (text) => {
  ui.announce.textContent = text;
};

// ------------------------------------------------------------ endless mode

const upcoming = new Map(); // index -> level, generated while the player plays

/**
 * Boards past the end of the pack are generated *ahead* of the player: a 9x9
 * can take a few hundred milliseconds in the worst case, which is fine during
 * a solve and very much not fine between two levels.
 */
const makeEndless = (i) => endlessLevel(i, pack.length);

function levelFor(i) {
  if (i < pack.length) return pack[i];
  if (upcoming.has(i)) return upcoming.get(i);
  return makeEndless(i) ?? pack[pack.length - 1];
}

/** Build the next board during the current one, when the browser is idle. */
function prepare(i) {
  if (i < pack.length || upcoming.has(i)) return;
  const build = () => {
    if (upcoming.has(i)) return;
    const next = makeEndless(i);
    if (next) {
      upcoming.set(i, next);
      for (const key of upcoming.keys()) if (key < i) upcoming.delete(key);
    }
  };
  if (typeof requestIdleCallback === 'function') requestIdleCallback(build, { timeout: 2000 });
  else setTimeout(build, 200);
}

// ------------------------------------------------------------- progression

let shownTier = 0;

function mount(next, { announce = true } = {}) {
  level = next;
  const tier = Math.min(MAX_TIER, Math.max(1, level.tier ?? 5));

  // The tier drives the whole palette from CSS; main.js only says which tier.
  document.documentElement.setAttribute('data-tier', String(tier));
  // A new line opening is the game's only real milestone, and until now it
  // slipped past between two boards. Mark it.
  if (shownTier && tier !== shownTier && !level.daily) markNewLine();
  if (!level.daily) shownTier = tier;
  ui.lineName.textContent = level.daily ? 'daily' : LINES[tier];

  ui.levelNumber.textContent = '';
  if (level.daily) {
    ui.levelNumber.textContent = 'today';
  } else {
    // The drawn numerals carry no text, so the readable version rides along
    // hidden beside them rather than as a label a screen reader may skip.
    const label = document.createElement('span');
    label.className = 'visually-hidden';
    label.textContent = `Level ${index + 1}`;
    ui.levelNumber.append(label, numberElement(index + 1, 'numeral'));
  }

  board.mount(level);
  if (!input) input = createInput(board, { onChange });
  input.setLevel(level);

  lastPathLength = 0;
  startedAt = performance.now();
  solving = false;
  platform.gameplayStart();
  if (!level.daily) telemetry.levelStarted(index, level.id);
  if (announce) {
    say(level.daily ? 'Daily puzzle.' : `Level ${index + 1}, ${LINES[tier]} line.`);
  }
  if (mode === 'ladder') prepare(index + 1);
}

/**
 * The rule under the bar: cells drawn over cells to draw.
 *
 * It measures coverage, not correctness — a wrong route still fills it, and
 * then empties again as the player backs out. That is the honest reading: the
 * puzzle is to cover every cell, so coverage is exactly what is left to do.
 */
function setProgress(drawn, total) {
  const fraction = total > 0 ? drawn / total : 0;
  ui.progressFill.style.width = `${(fraction * 100).toFixed(2)}%`;
  ui.progressFill.classList.toggle('full', drawn > 0 && drawn === total);
  ui.progress.setAttribute('aria-valuenow', String(Math.round(fraction * 100)));
  // A bare percentage is not what a player wants read out mid-solve; the two
  // counts are, and they are what the board is actually about.
  ui.progress.setAttribute('aria-valuetext', `${drawn} of ${total} cells drawn`);
}

function onChange(path) {
  if (path.length) dismissDemo();
  board.setPath(path);
  board.setHint([]);
  ui.undo.disabled = !input.canUndo();
  ui.restart.disabled = path.length === 0;

  const openCount = board.grid.openCount;
  setProgress(path.length, openCount);
  if (path.length > lastPathLength) audio.step(path.length, openCount);
  else if (path.length < lastPathLength) audio.retract(path.length, openCount);
  lastPathLength = path.length;

  if (!solving && path.length === openCount) checkForSolve(path);
}

async function checkForSolve(path) {
  if (!checkSolution(level, path, board.grid).ok) return;
  solving = true;
  input.lock();
  platform.gameplayStop();
  audio.solve();
  confetti.burst();

  const elapsed = Math.round(performance.now() - startedAt);
  if (mode === 'daily') {
    await daily.recordDailySolve();
    await refreshDailyBadge();
    say('Daily puzzle solved.');
  } else {
    await recordSolve(level, elapsed);
    await telemetry.levelSolved(index, elapsed);
    say('Solved.');
  }

  await board.runLine();
  await wait(Math.max(0, ADVANCE_DELAY - 700));

  if (mode === 'daily') await leaveDaily();
  else await advance();
}

async function advance() {
  await slide(() => {
    index += 1;
    mount(levelFor(index));
  });
  await storage.set('progress', { index });
}

/** Old board out, new board in. No fade to white. */
async function slide(swap) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    swap();
    return;
  }
  ui.board.classList.add('leaving');
  await wait(TRANSITION);
  ui.board.classList.remove('leaving');
  ui.board.classList.add('entering');
  swap();
  void ui.board.getBoundingClientRect(); // reflow, so it animates in from the offset
  ui.board.classList.remove('entering');
}

async function recordSolve(lvl, ms) {
  await storage.update(
    'records',
    (records) => {
      const id = lvl.id ?? `level-${index}`;
      const previous = records[id];
      records[id] = { done: true, best: previous?.best ? Math.min(previous.best, ms) : ms };
      return records;
    },
    {}
  );
}

// -------------------------------------------------------- first-play demo

let demoRunning = false;

/**
 * Shown once, ever, to a player with no saved progress: a ghost pointer walks
 * the first few cells of level 1 so the rule is visible rather than described.
 * It never blocks input and disappears the instant the player does anything.
 */
async function maybeShowDemo() {
  if ((await storage.get('seenDemo')) || index !== 0 || !level?.solution) return;
  demoRunning = true;
  board.playDemo(level.solution.slice(0, 5));
}

function dismissDemo() {
  if (!demoRunning) return;
  demoRunning = false;
  board.stopDemo();
  storage.set('seenDemo', true);
}

// ------------------------------------------------- milestones and the badge

/** A brief moment when a new line opens. Nothing blocking, nothing to dismiss. */
function markNewLine() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.body.classList.remove('new-line');
  void document.body.offsetWidth; // restart the animation if two land together
  document.body.classList.add('new-line');
  setTimeout(() => document.body.classList.remove('new-line'), 1400);
}

/**
 * A dot on the panel button while today's puzzle is unplayed.
 *
 * The daily is the strongest reason to come back and it was sitting behind an
 * unlabelled icon, which meant most players would never learn it existed.
 */
async function refreshDailyBadge() {
  const solved = await daily.isSolvedToday();
  ui.openPanel.classList.toggle('has-news', !solved);
  ui.openPanel.setAttribute(
    'aria-label',
    solved ? 'Daily puzzle and stats' : 'Daily puzzle and stats — today’s puzzle is unplayed'
  );
}

// ------------------------------------------------------------ daily puzzle

async function enterDaily() {
  const todays = daily.dailyLevel();
  if (!todays) {
    ui.dailyNote.textContent = 'Today’s puzzle could not be built. Try again shortly.';
    return;
  }
  closePanel();
  mode = 'daily';
  await slide(() => mount(todays));
}

async function leaveDaily() {
  mode = 'ladder';
  await slide(() => mount(levelFor(index)));
}

// ------------------------------------------------------------------- hint

/**
 * The single entry point for hints. Unlimited for now, on purpose: metering
 * them before the game is on the portal would cost players nothing but
 * patience, since there is no rewarded ad yet to earn more with.
 *
 * Phase 3 puts the gate here — an allowance, and the rewarded ad offered when
 * it runs out. Every caller already goes through this one function, so that is
 * the only change it will take.
 */
export async function requestHint() {
  if (solving || !level?.solution) return;

  const path = input.getPath();
  const head = path.length ? path[path.length - 1] : null;
  const from = head === null ? 0 : level.solution.indexOf(head);
  if (from < 0) return;

  const reveal = level.solution.slice(from, from + HINT_CELLS + 1);
  if (reveal.length < 2) return;

  board.setHint(reveal);
  say('Hint shown.');
  await storage.update('hints', (n) => n + 1, 0);
}

// ------------------------------------------------------- theme and audio

function applyTheme(next) {
  theme = THEMES.includes(next) ? next : 'system';
  if (theme === 'system') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', theme);
  ui.themeToggle.textContent = `Theme: ${theme}`;
}

async function cycleTheme() {
  applyTheme(THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length]);
  await storage.set('theme', theme);
}

function applyAudio(on) {
  audio.setEnabled(on);
  ui.audioToggle.textContent = `Sound: ${on ? 'on' : 'off'}`;
  ui.audioToggle.setAttribute('aria-pressed', String(on));
}

async function toggleAudio() {
  const on = !audio.isEnabled();
  applyAudio(on);
  await storage.set('audio', on);
}

// ------------------------------------------------------------------ panel

async function openPanel() {
  await refreshPanel();
  platform.gameplayStop(); // SPEC §11: gameplay stops when a modal opens
  if (typeof ui.panel.showModal === 'function') ui.panel.showModal();
  else ui.panel.setAttribute('open', '');
}

function closePanel() {
  if (ui.panel.open) ui.panel.close();
}

/** m:ss, so the value is digits and a colon and can be set in our own hand. */
function formatTime(ms) {
  if (!ms) return null;
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/**
 * The daily status line. Set as tracked caps with the streak in the game's own
 * numerals, so it reads as a status on an instrument rather than as a sentence
 * in a dialog box.
 */
function setNote(solvedToday, streak) {
  // Segments joined by a middot. A number never stands on its own — it always
  // follows the word that says what it counts.
  const segments = solvedToday
    ? [['Solved today'], ['Streak', streak]]
    : streak > 0
      ? [['Streak', streak], ['Play today']]
      : [['New puzzle every day']];

  ui.dailyNote.textContent = '';
  segments.forEach(([text, count], i) => {
    if (i > 0) {
      const dot = document.createElement('span');
      dot.className = 'note-dot';
      dot.textContent = '·';
      ui.dailyNote.append(dot);
    }
    const word = document.createElement('span');
    word.textContent = text;
    ui.dailyNote.append(word);
    if (count !== undefined) {
      const reader = document.createElement('span');
      reader.className = 'visually-hidden';
      reader.textContent = ` ${count}`;
      ui.dailyNote.append(reader, numberElement(count, 'numeral numeral-note'));
    }
  });
}

async function refreshPanel() {
  const records = (await storage.get('records')) ?? {};
  const hints = (await storage.get('hints')) ?? 0;
  const streakState = await daily.readStreak();
  const streak = daily.liveStreak(streakState);
  const solvedToday = await daily.isSolvedToday();

  const times = Object.values(records)
    .map((r) => r.best)
    .filter(Boolean);
  const rows = [
    ['Levels solved', String(Object.keys(records).length)],
    ['Current level', String(index + 1)],
    ['Best solve', formatTime(times.length ? Math.min(...times) : 0)],
    ['Daily streak', String(streak)],
    ['Longest streak', String(streakState.best ?? 0)],
    ['Hints used', String(hints)],
  ];
  ui.stats.innerHTML = '';
  for (const [term, value] of rows) {
    const dt = document.createElement('dt');
    dt.textContent = term;
    const dd = document.createElement('dd');
    if (value === null) {
      dd.textContent = '—';
    } else {
      // Values are set in the game's own numerals, so the panel reads as part
      // of the same object as the board rather than as a browser dialog.
      const label = document.createElement('span');
      label.className = 'visually-hidden';
      label.textContent = value;
      dd.append(label, numberElement(value, 'numeral numeral-stat'));
    }
    ui.stats.append(dt, dd);
  }

  setNote(solvedToday, streak);
}

// -------------------------------------------------------------- wiring

ui.undo.addEventListener('click', () => {
  input?.undo();
  ui.board.focus({ preventScroll: true });
});
ui.restart.addEventListener('click', () => {
  input?.restart();
  ui.board.focus({ preventScroll: true });
});
ui.hint.addEventListener('click', () => {
  requestHint();
  ui.board.focus({ preventScroll: true });
});

ui.openPanel.addEventListener('click', openPanel);
ui.panelClose.addEventListener('click', closePanel);
ui.dailyPlay.addEventListener('click', enterDaily);
ui.themeToggle.addEventListener('click', cycleTheme);
ui.audioToggle.addEventListener('click', toggleAudio);
ui.panel.addEventListener('close', () => {
  if (!solving) platform.gameplayStart();
  ui.board.focus({ preventScroll: true });
});

// Browsers will not start audio until the player has actually done something.
const firstGesture = () => {
  audio.unlock();
  dismissDemo();
  window.removeEventListener('pointerdown', firstGesture);
  window.removeEventListener('keydown', firstGesture);
};
window.addEventListener('pointerdown', firstGesture);
window.addEventListener('keydown', firstGesture);

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    platform.gameplayStop();
    audio.suspend();
    confetti.clear();
    telemetry.sessionEnded(); // a celebration nobody saw should not be waiting on return
  } else {
    if (!solving && !ui.panel.open) platform.gameplayStart();
    audio.resume();
  }
});
window.addEventListener('blur', () => platform.gameplayStop());
// pagehide covers closing and navigating away, including on iOS where
// visibilitychange is not reliably delivered before the page is frozen.
window.addEventListener('pagehide', () => {
  telemetry.sessionEnded();
  platform.gameplayStop();
});

// ----------------------------------------------------------------- start up

async function boot() {
  // First thing, before a single request or a frame of game: a stolen copy
  // should not fetch the pack, let alone play.
  if (!sitelock.enforce()) return;

  platform.loadingStart();

  applyTheme((await storage.get('theme')) ?? 'system');
  const soundOn = (await storage.get('audio')) ?? true;
  applyAudio(soundOn);
  audio.setPlatformMuted(platform.isAudioMuted());

  try {
    const response = await fetch('./data/levels.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    pack = data.levels ?? data;
  } catch (err) {
    // Never show a dead screen: fall back to generated boards.
    console.error('Could not load the level pack, generating instead:', err);
    pack = [];
  }
  platform.loadingStop();

  const progress = (await storage.get('progress')) ?? { index: 0 };
  index = Math.max(0, progress.index | 0);
  mount(levelFor(index), { announce: false });
  ui.board.focus({ preventScroll: true });
  await refreshDailyBadge();
  await maybeShowDemo();
}

boot();
