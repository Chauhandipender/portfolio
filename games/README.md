# Playable builds

Anything dropped in here is served as a normal static file and can be
played *inside* the portfolio, in the arcade cabinet player.

```
games/
  emoji-connect/
    index.html      <- must be named index.html
    ...build files
```

Then point the project at it in `js/data.js`:

```js
play: { type: "embed", url: "games/emoji-connect/index.html" }
```

## The three `play` types

| type | when to use | what the recruiter gets |
|---|---|---|
| `embed` | build is here in `games/`, or on a host that allows framing | plays inside the portfolio, plus an OPEN IN TAB button |
| `link`  | host blocks embedding (`X-Frame-Options` / `frame-ancestors`) | a PLAY NOW button that opens a new tab |
| `soon`  | not hosted yet | an honest "coming soon" line — never a dead link |

Optional `note:` adds one line under the button, e.g. `"Desktop only"`.

## Exporting from Cocos Creator

Build with platform **Web Mobile** (or Web Desktop), then copy the
contents of `build/web-mobile/` into `games/<name>/`. It's plain static
files and works as-is.

## Exporting from Unity (WebGL)

**Turn compression off**, or the build will not load from GitHub Pages:

- Player Settings → Publishing Settings → **Compression Format: Disabled**
- or keep Brotli/Gzip and tick **Decompression Fallback**

GitHub Pages cannot set the `Content-Encoding` header that compressed
Unity builds require, so a default Brotli build 404s or hangs on a blank
loading bar. Netlify *can* set it, so a build that works on Netlify can
still break on Pages.

Also watch size: GitHub blocks single files over 100 MB and warns above
50 MB. A typical Unity WebGL build is 15–40 MB — fine, but check
`.data`/`.wasm` before committing.

## Size

Everything here is committed to the repo, so keep builds lean. If a build
is very large, host it on Netlify and use `type: "embed"` with the full
URL instead of committing it.

## `_selftest/`

A 300-byte page that renders "embed self-test: OK". Point any project at
`games/_selftest/index.html` to confirm the embedded player works on a
new host before troubleshooting a real build. Safe to delete.

## Two things that bite on deploy

**1. Waypoint has a sitelock.** `games/waypoint/src/sitelock.js` ships
with CrazyGames' anti-theft check, which allows only `localhost` and
`crazygames.*`. Left alone it would work in local testing and then show
"Available only on CrazyGames" the moment the site went live.

The portfolio's copy adds a same-origin rule: if the page that framed or
linked to the build is served from the same host as the build itself,
it plays. That covers the portfolio on any domain with no configuration,
so it cannot rot when the domain changes. Hot-linking the files from a
different site is still blocked, and the copy submitted to CrazyGames is
untouched.

`PORTFOLIO_HOSTS` at the top of that file is still there if you ever want
to name a host explicitly (e.g. so the game also runs when someone types
its URL directly, with no referrer at all).

**2. ES-module games need a server.** Waypoint uses `import`/`export`,
which browsers refuse to load over `file://`. The portfolio itself works
fine double-clicked, but an embedded ES-module game will only run over
http (local server, GitHub Pages, Netlify). Not a problem once deployed.

## If you re-export a build

Re-copying a build over `games/<name>/` overwrites any tweaks made to it.
Two that are currently applied and worth re-applying:

- `games/emoji-connect/index.html` — `<title>` changed from the default
  "Cocos Creator | Emoji_Match" to "Emoji Connect Puzzle".
- `games/waypoint/src/sitelock.js` — same-origin rule (see above).
