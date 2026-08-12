/* ═══════════════════════════════════════════════════════════════
   SPRITES — every visual is generated in code at load time.
   No image files, no asset pipeline, nothing to 404 on a slow hotel
   wifi during a recruiter's coffee break.
   =============================================================== */
window.PF = window.PF || {};

PF.Sprites = (function () {

  const PAL = {
    o: '#120a24',  // outline
    h: '#3b2166',  // hair
    s: '#f2c9a4',  // skin
    e: '#00e5ff',  // eyes / visor
    j: '#16cfe8',  // jacket
    p: '#2c2456',  // trousers
    b: '#171130',  // boots
  };

  /* 12 × 16 character, authored as pixel strings ------------------ */
  const CHAR = {
    down: [
      '............',
      '...oooooo...',
      '..ohhhhhho..',
      '..ohhhhhho..',
      '..osssssso..',
      '..osesseso..',
      '..osssssso..',
      '...oooooo...',
      '.ojjjjjjjjo.',
      'osjjjjjjjjso',
      'osjjjjjjjjso',
      '.ojjjjjjjjo.',
      '..oppppppo..',
      '..oppppppo..',
      '..obo..obo..',
      '..ooo..ooo..',
    ],
    up: [
      '............',
      '...oooooo...',
      '..ohhhhhho..',
      '..ohhhhhho..',
      '..ohhhhhho..',
      '..ohhhhhho..',
      '..osssssso..',
      '...oooooo...',
      '.ojjjjjjjjo.',
      'osjjjjjjjjso',
      'osjjjjjjjjso',
      '.ojjjjjjjjo.',
      '..oppppppo..',
      '..oppppppo..',
      '..obo..obo..',
      '..ooo..ooo..',
    ],
    side: [
      '............',
      '...oooooo...',
      '..ohhhhhho..',
      '..ohhhhhho..',
      '..osssssso..',
      '..osssesso..',
      '..osssssso..',
      '...oooooo...',
      '..ojjjjjjo..',
      '..ojjjjjjso.',
      '..ojjjjjjso.',
      '..ojjjjjjo..',
      '..opppppo...',
      '..opppppo...',
      '..obbbbbo...',
      '..ooooooo...',
    ],
  };

  const W = 12, H = 16, LEG_ROW = 12;

  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    return c;
  }

  /* Render one character frame. legPhase shifts each foot to fake a
     walk cycle, so 3 authored poses cover all 4 frames × 4 headings. */
  function charFrame(rows, legPhase, flip) {
    const c = makeCanvas(W, H), g = c.getContext('2d');
    const lift = [0, -1, 0, 1][legPhase & 3];
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const ch = rows[y][x];
        if (ch === '.' || !PAL[ch]) continue;
        let dy = 0;
        if (y >= LEG_ROW) dy = (x < W / 2) ? lift : -lift;
        g.fillStyle = PAL[ch];
        g.fillRect(x, y + dy, 1, 1);
      }
    }
    if (!flip) return c;
    const f = makeCanvas(W, H), fg = f.getContext('2d');
    fg.translate(W, 0); fg.scale(-1, 1);
    fg.drawImage(c, 0, 0);
    return f;
  }

  function buildPlayer() {
    const mk = (rows, flip) => [0, 1, 2, 3].map(p => charFrame(rows, p, flip));
    return {
      down:  mk(CHAR.down,  false),
      up:    mk(CHAR.up,    false),
      right: mk(CHAR.side,  false),
      left:  mk(CHAR.side,  true),
      w: W, h: H,
    };
  }

  /* ── PROPS ─────────────────────────────────────────────────────
     Drawn as vector-ish rects in virtual pixel space so colours stay
     data-driven (a project's `art` pair tints its own cabinet).     */

  function glow(g, x, y, w, h, colour, blur) {
    g.save();
    g.shadowColor = colour; g.shadowBlur = blur || 10;
    g.fillStyle = colour; g.fillRect(x, y, w, h);
    g.restore();
  }

  /* Arcade cabinet — 20 wide × 30 tall, origin = bottom-centre. */
  function cabinet(g, x, y, c1, c2, t, active) {
    const w = 20, h = 30, L = x - w / 2, T = y - h;
    g.fillStyle = 'rgba(0,0,0,.42)';
    g.beginPath(); g.ellipse(x, y, 11, 4, 0, 0, 6.284); g.fill();

    g.fillStyle = '#1a1136'; g.fillRect(L, T, w, h);            // body
    g.fillStyle = '#241852'; g.fillRect(L, T, w, 4);            // marquee shelf
    g.strokeStyle = '#0d0722'; g.lineWidth = 1;
    g.strokeRect(L + .5, T + .5, w - 1, h - 1);

    glow(g, L + 2, T + 1, w - 4, 3, c1, active ? 14 : 6);       // marquee light

    const flick = active ? 1 : .68 + Math.sin(t * 3 + x) * .06;  // screen
    g.save(); g.globalAlpha = flick;
    const gr = g.createLinearGradient(0, T + 6, 0, T + 18);
    gr.addColorStop(0, c1); gr.addColorStop(1, c2);
    g.fillStyle = gr; g.fillRect(L + 3, T + 6, w - 6, 12);
    g.restore();

    g.fillStyle = 'rgba(0,0,0,.35)';                             // scanlines
    for (let i = 0; i < 12; i += 2) g.fillRect(L + 3, T + 6 + i, w - 6, 1);

    g.fillStyle = '#0e0824'; g.fillRect(L + 2, T + 20, w - 4, 5); // control deck
    glow(g, L + 5, T + 21, 2, 2, c2, 6);
    glow(g, L + 9, T + 21, 2, 2, c1, 6);
    glow(g, L + 13, T + 21, 2, 2, c2, 6);

    if (active) {                                                // attract halo
      g.save(); g.globalAlpha = .18 + Math.sin(t * 5) * .07;
      g.fillStyle = c1; g.fillRect(L - 4, T - 4, w + 8, h + 8);
      g.restore();
    }
  }

  /* Forge — skills. Anvil + drifting embers. */
  function forge(g, x, y, t, active) {
    g.fillStyle = 'rgba(0,0,0,.42)';
    g.beginPath(); g.ellipse(x, y, 16, 5, 0, 0, 6.284); g.fill();
    g.fillStyle = '#1a1136'; g.fillRect(x - 14, y - 10, 28, 10);
    g.fillStyle = '#241852'; g.fillRect(x - 10, y - 22, 20, 12);
    glow(g, x - 7, y - 19, 14, 7, '#ff2e97', active ? 22 : 12);
    g.fillStyle = '#0e0824'; g.fillRect(x - 12, y - 24, 24, 3);
    for (let i = 0; i < 7; i++) {                                 // embers
      const p = (t * 26 + i * 61) % 60;
      g.globalAlpha = Math.max(0, 1 - p / 60) * (active ? 1 : .55);
      g.fillStyle = i % 2 ? '#ffcf3d' : '#ff2e97';
      g.fillRect(x - 6 + Math.sin(p * .18 + i) * 7, y - 24 - p, 1, 2);
    }
    g.globalAlpha = 1;
  }

  /* Archive — about. Floating monolith of data slates. */
  function archive(g, x, y, t, active) {
    g.fillStyle = 'rgba(0,0,0,.42)';
    g.beginPath(); g.ellipse(x, y, 13, 4, 0, 0, 6.284); g.fill();
    for (let i = 0; i < 4; i++) {
      const off = Math.sin(t * 1.3 + i * 1.4) * 1.6;
      const w = 22 - i * 3, T = y - 10 - i * 8 + off;
      g.fillStyle = '#1a1136'; g.fillRect(x - w / 2, T, w, 7);
      g.strokeStyle = '#0d0722'; g.strokeRect(x - w / 2 + .5, T + .5, w - 1, 6);
      glow(g, x - w / 2 + 2, T + 2, w - 4, 1, '#ffcf3d', active ? 12 : 5);
    }
  }

  /* Uplink — contact. Terminal with a blinking cursor. */
  function terminal(g, x, y, t, active) {
    g.fillStyle = 'rgba(0,0,0,.42)';
    g.beginPath(); g.ellipse(x, y, 13, 4, 0, 0, 6.284); g.fill();
    g.fillStyle = '#1a1136'; g.fillRect(x - 13, y - 8, 26, 8);
    g.fillStyle = '#241852'; g.fillRect(x - 11, y - 26, 22, 18);
    g.fillStyle = '#06120e'; g.fillRect(x - 9, y - 24, 18, 14);
    g.fillStyle = '#4dff9e';
    for (let i = 0; i < 4; i++) {
      const len = 3 + ((i * 7 + Math.floor(t * 2)) % 10);
      g.globalAlpha = .55; g.fillRect(x - 8, y - 22 + i * 3, len, 1);
    }
    g.globalAlpha = (Math.sin(t * 6) > 0 ? 1 : .15) * (active ? 1 : .6);
    g.fillRect(x - 8, y - 10, 3, 1);
    g.globalAlpha = 1;
    if (active) glow(g, x - 11, y - 27, 22, 1, '#4dff9e', 16);
  }

  /* Pedestal — resume. Rotating holographic sheet. */
  function pedestal(g, x, y, t, active) {
    g.fillStyle = 'rgba(0,0,0,.42)';
    g.beginPath(); g.ellipse(x, y, 12, 4, 0, 0, 6.284); g.fill();
    g.fillStyle = '#1a1136'; g.fillRect(x - 10, y - 7, 20, 7);
    g.fillStyle = '#241852'; g.fillRect(x - 7, y - 10, 14, 3);
    const sw = Math.abs(Math.cos(t * 1.1)) * 11 + 2;              // spinning page
    g.save();
    g.globalAlpha = .5 + Math.sin(t * 2) * .12;
    g.fillStyle = '#b14aff';
    g.shadowColor = '#b14aff'; g.shadowBlur = active ? 20 : 10;
    g.fillRect(x - sw / 2, y - 30, sw, 17);
    g.restore();
    g.globalAlpha = .8; g.fillStyle = '#e8e4ff';
    for (let i = 0; i < 5; i++) g.fillRect(x - sw / 2 + 1, y - 28 + i * 3, Math.max(1, sw - 3), 1);
    g.globalAlpha = 1;
    for (let i = 0; i < 3; i++) {                                 // rising motes
      const p = (t * 18 + i * 40) % 40;
      g.globalAlpha = Math.max(0, 1 - p / 40) * .8;
      g.fillStyle = '#b14aff';
      g.fillRect(x - 5 + Math.sin(p * .2 + i * 2) * 6, y - 8 - p, 1, 1);
    }
    g.globalAlpha = 1;
  }

  /* Small generated cover art for the project cards in the panel. */
  function cover(seedStr, c1, c2) {
    const c = makeCanvas(56, 39), g = c.getContext('2d');
    let s = 0; for (let i = 0; i < seedStr.length; i++) s = (s * 31 + seedStr.charCodeAt(i)) >>> 0;
    const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);

    const sky = g.createLinearGradient(0, 0, 0, 39);
    sky.addColorStop(0, '#0b0619'); sky.addColorStop(1, c2);
    g.fillStyle = sky; g.fillRect(0, 0, 56, 39);

    g.globalAlpha = .9; g.fillStyle = '#fff';                      // stars
    for (let i = 0; i < 26; i++) g.fillRect((rnd() * 56) | 0, (rnd() * 20) | 0, 1, 1);
    g.globalAlpha = 1;

    g.fillStyle = c1;                                              // sun
    g.beginPath(); g.arc(28, 22, 9, 0, 6.284); g.fill();
    g.fillStyle = sky; for (let i = 0; i < 4; i++) g.fillRect(19, 18 + i * 3, 18, 1);

    g.fillStyle = '#0b0619';                                       // skyline
    let x = 0;
    while (x < 56) { const w = 3 + ((rnd() * 7) | 0), h = 4 + ((rnd() * 13) | 0); g.fillRect(x, 26 - h, w, h + 3); x += w + 1; }

    g.fillStyle = c1; g.globalAlpha = .55;                         // grid floor
    for (let i = 0; i < 5; i++) g.fillRect(0, 29 + i * 2 + i, 56, 1);
    for (let i = -6; i < 14; i++) { g.beginPath(); g.moveTo(28, 29); g.lineTo(28 + i * 9, 39); g.strokeStyle = c1; g.lineWidth = 1; g.stroke(); }
    g.globalAlpha = 1;
    return c;
  }

  return { makeCanvas, buildPlayer, cabinet, forge, archive, terminal, pedestal, cover, glow, PAL };
})();
