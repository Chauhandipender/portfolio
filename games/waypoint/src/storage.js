/**
 * storage.js — the only place the game touches persistence.
 *
 * The interface is async even though localStorage is not, so the CrazyGames
 * cloud-save backend can be dropped in during Phase 3 without any caller
 * changing. localStorage throws in some embedded contexts (Safari private
 * mode, sandboxed iframes); when it does we degrade to memory and say nothing.
 * Losing progress is bad. Crashing on load is worse.
 */

const PREFIX = 'waypoint:';

const memory = new Map();
let backend = null;
let probed = false;

function detectBackend() {
  // Probe once. Without the flag a missing localStorage would throw on every
  // single read and write, which is a silly amount of exception handling for a
  // question whose answer never changes.
  if (probed) return backend;
  probed = true;
  try {
    const probe = `${PREFIX}probe`;
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    backend = localStorage;
  } catch {
    backend = null; // memory only
  }
  return backend;
}

export async function get(key) {
  const store = detectBackend();
  if (!store) return memory.has(key) ? memory.get(key) : undefined;
  try {
    const raw = store.getItem(PREFIX + key);
    return raw === null ? undefined : JSON.parse(raw);
  } catch {
    return memory.has(key) ? memory.get(key) : undefined;
  }
}

export async function set(key, value) {
  memory.set(key, value);
  const store = detectBackend();
  if (!store) return;
  try {
    store.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Quota, private mode, or a disappearing backend. Memory already has it.
  }
}

export async function remove(key) {
  memory.delete(key);
  const store = detectBackend();
  if (!store) return;
  try {
    store.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}

/** Read-modify-write a key, for counters and record tables. */
export async function update(key, fn, fallback) {
  const current = (await get(key)) ?? fallback;
  const next = fn(current);
  await set(key, next);
  return next;
}
