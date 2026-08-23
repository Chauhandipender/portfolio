/* ═══════════════════════════════════════════════════════════════
   WORLD — the hub level.
   The map is carved from rectangles rather than hand-typed ASCII so
   it can never desync a row and is trivial to re-shape.
   =============================================================== */
window.PF = window.PF || {};

PF.World = (function () {

  const TILE = 16;
  const MW = 60, MH = 38;          // map size in tiles

  /* The playable builds are the centre and the spawn room: a recruiter
     lands facing three games they can press PLAY on, with the shipping
     record board beside them so the scale of the commercial work reads
     before they walk anywhere. The full shipped hall is straight north. */
  const ROOMS = {
    playroom: [22, 14, 18, 12],   // CENTRE + spawn. Playable builds.
    arcade:   [17,  1, 28, 11],   // shipped titles, straight north
    archive:  [ 2, 16, 14, 10],   // west
    forge:    [46, 16, 12, 10],   // east
    uplink:   [24, 29, 14,  6],   // south
  };
  const HALLS = [
    [29, 11,  4, 3],   // playroom → shipped hall (wide)
    [15, 19,  7, 3],   // playroom → archive
    [39, 19,  7, 3],   // playroom → forge
    [29, 25,  4, 4],   // playroom → uplink
  ];

  /* Which room each tile belongs to (for the zone banner) -------- */
  const solid = new Uint8Array(MW * MH).fill(1);
  const region = new Array(MW * MH).fill(null);

  function carve(x, y, w, h, name) {
    for (let j = y; j < y + h; j++)
      for (let i = x; i < x + w; i++)
        if (i >= 0 && j >= 0 && i < MW && j < MH) {
          solid[j * MW + i] = 0;
          region[j * MW + i] = name;
        }
  }
  for (const k in ROOMS) carve(...ROOMS[k], k);
  HALLS.forEach(h => carve(h[0], h[1], h[2], h[3], 'hall'));

  const isSolid = (tx, ty) =>
    tx < 0 || ty < 0 || tx >= MW || ty >= MH || solid[ty * MW + tx] === 1;

  const regionAt = (tx, ty) =>
    (tx < 0 || ty < 0 || tx >= MW || ty >= MH) ? null : region[ty * MW + tx];

  /* A wall tile that borders walkable floor — the only ones drawn. */
  const isFace = (tx, ty) => isSolid(tx, ty) && !isSolid(tx, ty + 1);

  /* ── Interactables ───────────────────────────────────────────── */
  /* px/py are in tiles; converted to world pixels on build.        */
  function buildEntities(data) {
    const E = [];
    const projects = data.projects || [];

    /* A build only counts as playable once it has a real, non-placeholder
       URL — the same test the PLAY button uses, so the world and the panel
       can never disagree about what is playable. */
    const isPlayable = p => !!(p.play && p.play.type && p.play.type !== 'soon'
                               && p.play.url && !/[⟪⟫]/.test(p.play.url));

    /* Cabinets are centred inside whichever room they belong to, so a room
       never ends up lopsided when a project is added or removed. */
    function layout(list, room, rows, maxGap) {
      const n = list.length;
      if (!n) return;
      const per = Math.ceil(n / rows);
      const gap = Math.min(maxGap, (room[2] - 3) / per);
      const rowYs = rows === 1
        ? [room[1] + Math.floor(room[3] / 2) + 1]
        : [room[1] + Math.round(room[3] * 0.32), room[1] + Math.round(room[3] * 0.70)];

      list.forEach((it, i) => {
        const row = Math.min(rows - 1, (i / per) | 0);
        const col = i % per;
        const inRow = Math.min(per, n - row * per);
        const startX = room[0] + (room[2] - gap * inRow) / 2;
        E.push({
          kind: 'cabinet', zone: it.zone, project: it.index,
          label: it.p.title, playable: isPlayable(it.p),
          tx: startX + gap * (col + 0.5), ty: rowYs[row],
          c1: (it.p.art && it.p.art[0]) || '#00e5ff',
          c2: (it.p.art && it.p.art[1]) || '#b14aff',
        });
      });
    }

    /* Playable builds get their own room so a recruiter who just wants to
       press PLAY has one place to go, instead of hunting for the three
       cabinets with a build behind them among a wall of shipped titles. */
    const playable = [], shipped = [];
    projects.forEach((p, index) => {
      const on = isPlayable(p);
      (on ? playable : shipped).push({ p, index, zone: on ? 'playable' : 'projects' });
    });

    layout(shipped,  ROOMS.arcade,   2, 4);
    layout(playable, ROOMS.playroom, 1, 4);

    E.push({ kind: 'forge',    zone: 'skills',  label: 'Skill tree',      tx: 52,   ty: 21 });
    E.push({ kind: 'archive',  zone: 'about',   label: 'Character sheet', tx: 9,    ty: 21 });
    E.push({ kind: 'terminal', zone: 'contact', label: 'Contact uplink',  tx: 31,   ty: 33 });
    E.push({ kind: 'pedestal', zone: 'resume',  label: 'Resume',          tx: 24,   ty: 25 });
    E.push({ kind: 'record',   zone: 'record',  label: 'Track record',    tx: 31,   ty: 25 });

    E.forEach(e => { e.x = e.tx * TILE; e.y = e.ty * TILE; });
    return E;
  }

  /* ── Floor decoration, deterministic so it never shimmers ────── */
  function hash(i, j) {
    let n = (i * 73856093) ^ (j * 19349663);
    n = (n ^ (n >>> 13)) >>> 0;
    return (n % 1000) / 1000;
  }

  /* ── Renderer ────────────────────────────────────────────────── */
  function drawFloor(g, cam, vw, vh, t) {
    const x0 = Math.max(0, ((cam.x) / TILE | 0) - 1);
    const y0 = Math.max(0, ((cam.y) / TILE | 0) - 1);
    const x1 = Math.min(MW, ((cam.x + vw) / TILE | 0) + 2);
    const y1 = Math.min(MH, ((cam.y + vh) / TILE | 0) + 3);

    for (let j = y0; j < y1; j++) {
      for (let i = x0; i < x1; i++) {
        const X = i * TILE - cam.x, Y = j * TILE - cam.y;
        if (isSolid(i, j)) continue;

        const r = hash(i, j);
        const reg = region[j * MW + i];
        const base = reg === 'hall' ? '#150d2e' : '#181040';
        g.fillStyle = base;
        g.fillRect(X, Y, TILE, TILE);

        // panel seams
        g.fillStyle = 'rgba(0,0,0,.35)';
        g.fillRect(X, Y, TILE, 1);
        g.fillRect(X, Y, 1, TILE);

        // scattered lit tiles pulse gently
        if (r > .93) {
          const c = ({ arcade:'#00e5ff', playroom:'#ff6b35', forge:'#ff2e97', archive:'#ffcf3d', uplink:'#4dff9e' })[reg] || '#b14aff';
          g.save();
          g.globalAlpha = .1 + Math.sin(t * 1.6 + i + j) * .05;
          g.fillStyle = c; g.fillRect(X + 2, Y + 2, TILE - 4, TILE - 4);
          g.restore();
        } else if (r > .82) {
          g.fillStyle = 'rgba(255,255,255,.018)';
          g.fillRect(X + 3, Y + 3, TILE - 6, TILE - 6);
        }
      }
    }
  }

  function drawWalls(g, cam, vw, vh, t) {
    const x0 = Math.max(-1, ((cam.x) / TILE | 0) - 1);
    const y0 = Math.max(-1, ((cam.y) / TILE | 0) - 1);
    const x1 = Math.min(MW + 1, ((cam.x + vw) / TILE | 0) + 2);
    const y1 = Math.min(MH + 1, ((cam.y + vh) / TILE | 0) + 3);

    for (let j = y0; j < y1; j++) {
      for (let i = x0; i < x1; i++) {
        if (!isSolid(i, j)) continue;
        const X = i * TILE - cam.x, Y = j * TILE - cam.y;
        const face = !isSolid(i, j + 1);
        const nearFloor = face || !isSolid(i - 1, j) || !isSolid(i + 1, j) || !isSolid(i, j - 1);
        if (!nearFloor) continue;

        g.fillStyle = '#0d0722';
        g.fillRect(X, Y, TILE, TILE);

        if (face) {
          // lit wall face + neon strip at the top edge
          g.fillStyle = '#1a1136';
          g.fillRect(X, Y + 4, TILE, TILE - 4);
          const reg = regionAt(i, j + 1);
          const c = ({ arcade:'#00e5ff', playroom:'#ff6b35', forge:'#ff2e97', archive:'#ffcf3d', uplink:'#4dff9e' })[reg] || '#b14aff';
          g.save();
          g.shadowColor = c; g.shadowBlur = 8;
          g.globalAlpha = .75 + Math.sin(t * 1.1 + i * .4) * .18;
          g.fillStyle = c;
          g.fillRect(X, Y + TILE - 2, TILE, 1);
          g.restore();
        }
      }
    }
  }

  return {
    TILE, MW, MH, ROOMS,
    isSolid, isFace, regionAt, buildEntities, drawFloor, drawWalls,
    spawn: { x: 31 * TILE, y: 22 * TILE },
  };
})();
