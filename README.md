# Game Developer Portfolio — playable hub

An interactive portfolio: a small top-down game you walk around. Each room
holds a section — projects live in arcade cabinets, skills in the forge,
about in the archive, contact in the uplink terminal, resume on a pedestal.

There is a **Recruiter Mode** button pinned top-right that drops the whole
thing into one plain scrolling page, because not every recruiter wants to
play a game to find your email.

## Editing your content

**You only ever need to edit one file: [`js/data.js`](js/data.js).**

It is already filled in with real content: 11 projects, the Mfinity
Infotech role, the AIT degree, and the skill tree. Add or delete entries
in any array freely — the world rebuilds itself, so adding a 12th project
just puts a 12th arcade cabinet in the hall.

The resume PDF lives at `resume/Dipender_Chauhan_CV.pdf`. Replace that
file whenever you update your CV and the pedestal picks it up.

### Things worth reviewing

- **Skill bar percentages are an estimate** derived from the CV. Only you
  know your real proficiency, and recruiters ask about anything near the
  top of a bar. Tune them in the `skills` array.
- **Your phone number is deliberately not published.** It's on the CV,
  which is fine, but a public page gets scraped by spam bots. Add it to
  the `contact` terminal if you'd rather have it visible.
- **No GitHub or Google Play developer link is set** — I left them out
  rather than guess a URL and ship a 404. Add them in `links` when ready.

Links whose URL still contains `⟪ ⟫` render greyed out and unclickable
rather than as broken hrefs, so a half-finished edit can't embarrass you.

## Running it locally

No build step, no npm, no dependencies. Either:

- Double-click `index.html`, or
- Serve the folder (needed only if you add `fetch`-based features later):

```bash
npx serve .
```

## Deploying to GitHub Pages

```bash
git add -A && git commit -m "Update portfolio content" && git push
```

Then in the repo: **Settings → Pages → Source: `main` / root**.
Live within a minute at `https://<username>.github.io/<repo>/`.

## Controls

| Input | Action |
|---|---|
| `W A S D` / arrows | Move |
| `E` / `Enter` / `Space` | Interact |
| `Esc` | Close panel |
| `M` | Map |
| `R` | Recruiter mode |
| `P` | Sound on/off |

Touchscreens get an on-screen joystick and action button automatically.

## Structure

```
index.html          markup + HUD
css/style.css       all styling
js/data.js          ← YOUR CONTENT (the only file to edit)
js/sprites.js       procedural pixel art — no image assets exist
js/world.js         tilemap, rooms, prop placement
js/engine.js        game loop, input, collision, camera, particles, audio
js/ui.js            panels, recruiter mode, boot sequence
js/main.js          wiring
```

Every visual is generated in code at load time, so the whole site is a
handful of text files with nothing to 404 and nothing to optimise.

## Accessibility

- Recruiter Mode exposes 100% of the content without playing the game.
- `prefers-reduced-motion` disables shake, particles, scanlines and
  camera smoothing, and fast-forwards the boot sequence.
- Panels are focus-managed dialogs, closable with `Esc`.
- Sound is off by default and opt-in.
