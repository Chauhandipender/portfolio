/* ═══════════════════════════════════════════════════════════════
   WORLD — the hub level.
   The map is carved from rectangles rather than hand-typed ASCII so
   it can never desync a row and is trivial to re-shape.
   =============================================================== */
window.PF = window.PF || {};

PF.World = (function () {

  const TILE = 16;
  const MW = 60, MH = 38;          // map size in tiles

  /* Rooms & corridors, in tiles: [x, y, w, h] ------------------- */
  const ROOMS = {
    hub:     [24, 15, 13,  8],
    arcade:  [41,  8, 18, 22],   // big hall — it holds one cabinet per shipped title
    forge:   [22,  2, 16, 10],
    archive: [ 2, 12, 16, 14],
    uplink:  [22, 26, 16, 10],
  };
  const HALLS = [
    [37, 18,  4, 3],   // hub → arcade
    [29, 12,  3, 3],   // hub → forge
    [18, 18,  6, 3],   // hub → archive
    [29, 23,  3, 3],   // hub → uplink
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

    /* One arcade cabinet per project. The grid is derived from the room
       rect rather than hard-coded, so adding or removing a project just
       re-flows the hall instead of pushing a cabinet through a wall. */
    const R = ROOMS.arcade;
    const n = projects.length;
    const rows = n <= 4 ? 1 : 2;
    const perRow = Math.ceil(n / rows);
    const colGap = (R[2] - 3) / perRow;
    const rowY = rows === 1 ? [R[1] + 8] : [R[1] + 5, R[1] + 14];

    projects.forEach((p, i) => {
      const row = Math.min(rows - 1, (i / perRow) | 0);
      const col = i % perRow;
      E.push({
        kind: 'cabinet', zone: 'projects', project: i,
        label: p.title,
        playable: !!(p.play && p.play.type && p.play.type !== 'soon'),
        tx: R[0] + 1.5 + colGap * (col + 0.5),
        ty: rowY[row],
        c1: (p.art && p.art[0]) || '#00e5ff',
        c2: (p.art && p.art[1]) || '#b14aff',
      });
    });

    E.push({ kind: 'forge',    zone: 'skills',  label: 'Skill tree',   tx: 30, ty: 7  });
    E.push({ kind: 'archive',  zone: 'about',   label: 'Character sheet', tx: 10, ty: 19 });
    E.push({ kind: 'terminal', zone: 'contact', label: 'Contact uplink', tx: 30, ty: 31 });
    E.push({ kind: 'pedestal', zone: 'resume',  label: 'Resume',       tx: 30.5, ty: 18 });

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
          const c = ({ arcade:'#00e5ff', forge:'#ff2e97', archive:'#ffcf3d', uplink:'#4dff9e' })[reg] || '#b14aff';
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
          const c = ({ arcade:'#00e5ff', forge:'#ff2e97', archive:'#ffcf3d', uplink:'#4dff9e' })[reg] || '#b14aff';
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
    spawn: { x: 30 * TILE, y: 20 * TILE },
  };
})();
