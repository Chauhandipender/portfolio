/**
 * sitelock.js — refuse to run on a domain that stole the build.
 *
 * Required by the platform's technical requirements. The hostname rule below
 * is adapted from the check CrazyGames publish at
 * docs.crazygames.com/resources/html5/sitelock/ — read that page before
 * changing anything here, and do not invent domains.
 *
 * The governing principle in every ambiguous case is FAIL OPEN. Sitelock is
 * anti-theft, not security: a pirate who slips through costs us a copy of a
 * free game, while a false block costs a real player the whole game and looks
 * like we shipped something broken. Whenever we cannot tell, we let them play.
 */

/**
 * Hosts that ALSO legitimately serve this build: the author's own portfolio.
 *
 * ── ADD YOUR PORTFOLIO DOMAIN HERE BEFORE YOU DEPLOY ──
 *   e.g.  const PORTFOLIO_HOSTS = ['dipender.github.io'];
 * Leave it empty and the live site will show "Available only on CrazyGames"
 * instead of the game — the sitelock only allows localhost and crazygames.*.
 *
 * This is the portfolio's copy of the build. The copy you submit to
 * CrazyGames is separate and keeps its sitelock exactly as published.
 */
const PORTFOLIO_HOSTS = [];

/** Somewhere the game is expected to run during development. */
function isDevelopmentHost(hostname) {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname === '::1' ||
    hostname.endsWith('.localhost')
  );
}

/**
 * A real CrazyGames host.
 *
 * They serve from `crazygames.com` and from per-country variants — plain TLDs
 * like `crazygames.fr`, and two-part ones like `crazygames.co.kr` and
 * `crazygames.com.br` — each with any subdomain in front (`www.`, `de.`,
 * `games.`).
 *
 * Their own published check accepts "crazygames" anywhere in the last three
 * labels, which also accepts `crazygames.example.com` — a host any thief can
 * create. We require it to be the registrable domain instead: followed either
 * by a single label, or by `co`/`com` and then one more. Every domain on their
 * published list passes; that one bypass does not.
 */
export function isCrazyGamesHost(hostname) {
  const parts = String(hostname).toLowerCase().split('.');
  const at = parts.lastIndexOf('crazygames');
  if (at === -1) return false;
  const after = parts.length - at - 1;
  if (after === 1) return true; // crazygames.com, crazygames.fr
  if (after === 2) return parts[at + 1] === 'co' || parts[at + 1] === 'com';
  return false;
}

/** May the game run on this hostname? Empty means an opaque origin: allow. */
export function isAllowedHost(hostname) {
  if (!hostname) return true;
  return isDevelopmentHost(hostname) || isCrazyGamesHost(hostname)
      || PORTFOLIO_HOSTS.includes(String(hostname).toLowerCase());
}

/** Hostname out of a URL string, or '' if it is not one we can read. */
function hostOf(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

/**
 * Decide from an already-gathered snapshot of the environment, so the decision
 * is a pure function and can be tested without a DOM.
 *
 * When the game is embedded — which is how the platform serves it — our own
 * hostname is the file host, not the site the player is on, so the embedder is
 * what has to be checked. `document.referrer` is the only cross-origin-safe
 * way to see it, and it is empty often enough (referrer policies strip it)
 * that an empty one has to mean allow.
 */
export function isAllowedContext({ hostname = '', embedded = false, referrer = '' } = {}) {
  // Where the files are served from settles it first. A build running off
  // localhost or off no origin at all is a developer or an app webview, not a
  // copy sitting on someone else's site, and it stays playable no matter who
  // framed it — otherwise testing the game in any local iframe blanks it.
  if (!hostname || isDevelopmentHost(hostname)) return true;
  if (!embedded) return isAllowedHost(hostname);
  if (!referrer) return true; // stripped referrer: unknowable, so allow
  return isAllowedHost(hostOf(referrer));
}

/** Are we inside an iframe? A cross-origin parent throws, which is itself a yes. */
function isEmbedded() {
  try {
    return window.top !== window.self;
  } catch {
    return true;
  }
}

/**
 * The notice, in the game's own language: paper, ink, sentence case. No link —
 * SPEC §13 forbids external links, and a stolen copy is not the place to start
 * making exceptions.
 */
function renderNotice() {
  document.body.textContent = '';
  const notice = document.createElement('p');
  notice.className = 'sitelock';
  notice.textContent = 'Available only on CrazyGames';
  document.body.append(notice);
}

/**
 * @returns {boolean} true if the game may run
 */
export function enforce() {
  const allowed = isAllowedContext({
    hostname: location.hostname,
    embedded: isEmbedded(),
    referrer: document.referrer,
  });
  if (!allowed) renderNotice();
  return allowed;
}
