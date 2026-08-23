/* ═══════════════════════════════════════════════════════════════
   ENGINE — loop, input, camera, collision, entities, particles, audio.
   Fixed-timestep update with an interpolated render so movement stays
   identical on a 60 Hz laptop and a 165 Hz gaming monitor.
   =============================================================== */
window.PF = window.PF || {};

PF.Engine = (function () {

  const W = PF.World, TILE = W.TILE;
  const VH = 232;                       // virtual render height (px)
  const STEP = 1 / 60;                  // fixed update step

  let cv, g, vw = 480, vh = VH;
  let player, entities, sprites, cam = { x: 0, y: 0 };
  let keys = Object.create(null), stick = { x: 0, y: 0 };
  let particles = [], shake = 0, t = 0, acc = 0, last = 0, raf = 0;
  let paused = false, nearest = null, curRegion = null;
  let reduceMotion = false;

  const on = {};                        // event callbacks, set by main.js

  /* ── AUDIO — tiny WebAudio blip synth, silent until enabled ──── */
  const Audio_ = {
    ctx: null, enabled: false,
    init() { if (!this.ctx) { const C = window.AudioContext || window.webkitAudioContext; if (C) this.ctx = new C(); } },
    blip(freq, dur, type, vol) {
      if (!this.enabled || !this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const o = this.ctx.createOscillator(), gn = this.ctx.createGain(), n = this.ctx.currentTime;
      o.type = type || 'square'; o.frequency.setValueAtTime(freq, n);
      gn.gain.setValueAtTime(0, n);
      gn.gain.linearRampToValueAtTime(vol == null ? .05 : vol, n + .01);
      gn.gain.exponentialRampToValueAtTime(.0001, n + (dur || .09));
      o.connect(gn); gn.connect(this.ctx.destination);
      o.start(n); o.stop(n + (dur || .09) + .02);
    },
    step() { this.blip(90 + Math.random() * 30, .045, 'triangle', .028); },
    open() { this.blip(520, .07); setTimeout(() => this.blip(780, .1), 60); },
    close() { this.blip(320, .08, 'sine', .04); },
    toggle(v) { this.init(); this.enabled = v; if (v) this.blip(660, .08); },
  };

  /* ── SETUP ───────────────────────────────────────────────────── */
  function init(canvas, data, callbacks) {
    cv = canvas; g = cv.getContext('2d', { alpha: false });
    Object.assign(on, callbacks || {});
    reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    sprites = PF.Sprites.buildPlayer();
    entities = W.buildEntities(data);

    player = {
      x: W.spawn.x, y: W.spawn.y, px: W.spawn.x, py: W.spawn.y,
      vx: 0, vy: 0, dir: 'down', frame: 0, anim: 0, moving: false,
    };
    cam.x = player.x - vw / 2; cam.y = player.y - vh / 2;

    resize();
    window.addEventListener('resize', resize);
    bindInput();
    return { player, entities };
  }

  /* The backbuffer aspect must match the element's aspect or the whole
     world stretches. Portrait drives off width (and zooms in, so the
     character stays readable on a phone); landscape drives off height.

     Everything below is guarded against a zero-sized canvas: a hidden or
     not-yet-laid-out element reports 0, and 0/0 is NaN, which used to
     poison vw -> the camera -> createRadialGradient, killing the render
     with "provided double value is non-finite". */
  function resize() {
    const fin = (n, fb) => (Number.isFinite(n) && n > 0) ? n : fb;
    const dw = fin(cv.clientWidth,  fin(window.innerWidth,  960));
    const dh = fin(cv.clientHeight, fin(window.innerHeight, 540));
    const a  = fin(dw / dh, 16 / 9);

    if (a < 1) {                              // portrait
      vw = 200;
      vh = Math.min(620, Math.round(vw / a));
    } else {                                  // landscape / desktop
      vh = VH;
      vw = Math.min(1040, Math.max(320, Math.round(vh * a)));
    }
    vw = fin(vw, 412); vh = fin(vh, VH);
    cv.width = vw; cv.height = vh;
    g.imageSmoothingEnabled = false;
  }

  /* ── INPUT ───────────────────────────────────────────────────── */
  const MOVE_KEYS = {
    KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
  };

  function bindInput() {
    window.addEventListener('keydown', e => {
      if (MOVE_KEYS[e.code]) { keys[MOVE_KEYS[e.code]] = true; if (!paused) e.preventDefault(); }
      if (e.code === 'KeyE' || e.code === 'Enter' || e.code === 'Space') {
        if (!paused && nearest) { e.preventDefault(); interact(); }
      }
      if (on.key) on.key(e);
    });
    window.addEventListener('keyup', e => { if (MOVE_KEYS[e.code]) keys[MOVE_KEYS[e.code]] = false; });
    window.addEventListener('blur', () => { keys = Object.create(null); stick.x = stick.y = 0; });

    /* virtual joystick */
    const el = document.getElementById('stick'), nub = document.getElementById('stickNub');
    if (el) {
      let id = null, cx = 0, cy = 0;
      const start = e => {
        const tch = e.changedTouches ? e.changedTouches[0] : e;
        id = tch.identifier != null ? tch.identifier : 'mouse';
        const r = el.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2;
        move(e);
      };
      const move = e => {
        if (id === null) return;
        const list = e.changedTouches ? Array.from(e.changedTouches) : [e];
        const tch = list.find(p => (p.identifier != null ? p.identifier : 'mouse') === id);
        if (!tch) return;
        e.preventDefault();
        let dx = tch.clientX - cx, dy = tch.clientY - cy;
        const d = Math.hypot(dx, dy) || 1, max = 44;
        const k = Math.min(1, d / max);
        stick.x = (dx / d) * k; stick.y = (dy / d) * k;
        nub.style.transform = `translate(${stick.x * max}px, ${stick.y * max}px)`;
      };
      const end = () => { id = null; stick.x = stick.y = 0; nub.style.transform = ''; };
      el.addEventListener('touchstart', start, { passive: false });
      el.addEventListener('touchmove', move, { passive: false });
      el.addEventListener('touchend', end); el.addEventListener('touchcancel', end);
      el.addEventListener('mousedown', start); window.addEventListener('mousemove', move); window.addEventListener('mouseup', end);
    }
    const act = document.getElementById('touchAct');
    if (act) act.addEventListener('click', () => { if (!paused && nearest) interact(); });
  }

  function interact() {
    Audio_.open();
    burst(nearest.x, nearest.y - 12, nearest.c1 || '#00e5ff', 16);
    shake = reduceMotion ? 0 : 3;
    if (on.interact) on.interact(nearest);
  }

  /* ── COLLISION ───────────────────────────────────────────────── */
  const HW = 5, HH = 4, FOOT = 5;      // half-width / half-height of the foot box

  function blocked(x, y) {
    const l = x - HW, r = x + HW, tp = y - HH + FOOT, bt = y + HH;
    for (let j = Math.floor(tp / TILE); j <= Math.floor(bt / TILE); j++)
      for (let i = Math.floor(l / TILE); i <= Math.floor(r / TILE); i++)
        if (W.isSolid(i, j)) return true;
    return false;
  }

  /* ── UPDATE ──────────────────────────────────────────────────── */
  const SPEED = 82;                     // px / second

  function update(dt) {
    let ix = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    let iy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
    if (Math.abs(stick.x) > .18 || Math.abs(stick.y) > .18) { ix = stick.x; iy = stick.y; }

    const mag = Math.hypot(ix, iy);
    if (mag > 1) { ix /= mag; iy /= mag; }

    player.px = player.x; player.py = player.y;
    player.moving = mag > .08;

    if (player.moving) {
      if (Math.abs(ix) > Math.abs(iy)) player.dir = ix > 0 ? 'right' : 'left';
      else player.dir = iy > 0 ? 'down' : 'up';

      const nx = player.x + ix * SPEED * dt;
      const ny = player.y + iy * SPEED * dt;
      if (!blocked(nx, player.y)) player.x = nx;
      if (!blocked(player.x, ny)) player.y = ny;

      player.anim += dt * (mag * 9);
      const f = Math.floor(player.anim) % 4;
      if (f !== player.frame && (f === 1 || f === 3)) Audio_.step();
      player.frame = f;

      if (!reduceMotion && Math.random() < .16)
        particles.push({ x: player.x + (Math.random() * 8 - 4), y: player.y + 2, vx: -ix * 6, vy: -iy * 6 - 4, life: .5, max: .5, c: '#4a3a7a', s: 1 });
    } else {
      player.frame = 0; player.anim = 0;
    }

    /* camera */
    const tx = player.x - vw / 2, ty = player.y - vh / 2 - 8;
    const k = reduceMotion ? 1 : 1 - Math.pow(.0015, dt);
    cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k;
    cam.x = Math.max(-24, Math.min(W.MW * TILE - vw + 24, cam.x));
    cam.y = Math.max(-24, Math.min(W.MH * TILE - vh + 24, cam.y));

    /* Nearest interactable.
       Deliberately generous and squashed vertically: the player almost
       always approaches a prop from below, and a tight circle left you
       standing between two cabinets able to reach neither. */
    const REACH = 46;
    let best = null, bd = REACH * REACH;
    for (const e of entities) {
      const dx = e.x - player.x;
      const dy = ((e.y - 10) - player.y) * 1.35;
      const d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = e; }
    }
    if (best !== nearest) { nearest = best; if (on.near) on.near(nearest); }

    /* region / zone banner */
    const reg = W.regionAt(Math.floor(player.x / TILE), Math.floor(player.y / TILE));
    if (reg && reg !== 'hall' && reg !== curRegion) { curRegion = reg; if (on.region) on.region(reg); }

    /* particles */
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 14 * dt; p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    if (shake > 0) shake = Math.max(0, shake - dt * 14);
  }

  function burst(x, y, colour, n) {
    if (reduceMotion) return;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.284, s = 14 + Math.random() * 34;
      particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 10, life: .55 + Math.random() * .35, max: .9, c: colour, s: 1 + (Math.random() * 2 | 0) });
    }
  }

  /* ── RENDER ──────────────────────────────────────────────────── */
  function render(alpha) {
    const sx = shake > 0 ? (Math.random() * 2 - 1) * shake : 0;
    const sy = shake > 0 ? (Math.random() * 2 - 1) * shake : 0;
    const c = { x: Math.round(cam.x + sx), y: Math.round(cam.y + sy) };

    g.fillStyle = '#07040f'; g.fillRect(0, 0, vw, vh);
    W.drawFloor(g, c, vw, vh, t);

    /* depth-sorted pass: entities + player share one y-sorted list */
    const px = Math.round(player.px + (player.x - player.px) * alpha);
    const py = Math.round(player.py + (player.y - player.py) * alpha);

    const drawList = entities.map(e => ({ y: e.y, e }));
    drawList.push({ y: py, p: true });
    drawList.sort((a, b) => a.y - b.y);

    for (const item of drawList) {
      if (item.p) { drawPlayer(px - c.x, py - c.y); continue; }
      const e = item.e, X = Math.round(e.x - c.x), Y = Math.round(e.y - c.y);
      if (X < -60 || X > vw + 60 || Y < -60 || Y > vh + 60) continue;
      const act = e === nearest;
      switch (e.kind) {
        case 'cabinet':  PF.Sprites.cabinet(g, X, Y, e.c1, e.c2, t, act); break;
        case 'forge':    PF.Sprites.forge(g, X, Y, t, act); break;
        case 'archive':  PF.Sprites.archive(g, X, Y, t, act); break;
        case 'terminal': PF.Sprites.terminal(g, X, Y, t, act); break;
        case 'pedestal': PF.Sprites.pedestal(g, X, Y, t, act); break;
        case 'record':   PF.Sprites.record(g, X, Y, t, act); break;
      }
      if (e.playable) PF.Sprites.playableTag(g, X + 13, Y - 26, t);
      if (act) {
        g.save();
        g.globalAlpha = .55 + Math.sin(t * 6) * .3;
        g.fillStyle = '#fff';
        g.fillRect(X - 1, Y - 40 - Math.sin(t * 4) * 2, 2, 5);      // hover marker
        g.restore();
      }
    }

    W.drawWalls(g, c, vw, vh, t);

    for (const p of particles) {                                     // particles on top
      g.globalAlpha = Math.max(0, p.life / p.max);
      g.fillStyle = p.c;
      g.fillRect(Math.round(p.x - c.x), Math.round(p.y - c.y), p.s, p.s);
    }
    g.globalAlpha = 1;

    /* Soft radial light around the player. Without this the character is a
       dark smudge on a dark floor — in the arcade especially, it vanished
       between the cabinets. */
    const lx = px - c.x, ly = py - c.y;
    const R = 104;
    const rg = g.createRadialGradient(lx, ly - 6, 3, lx, ly - 6, R);
    rg.addColorStop(0, 'rgba(150,120,255,.30)');
    rg.addColorStop(.45, 'rgba(110,80,210,.11)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg; g.fillRect(lx - R, ly - 6 - R, R * 2, R * 2);
  }

  function drawPlayer(X, Y) {
    const set = sprites[player.dir] || sprites.down;
    const img = set[player.moving ? player.frame : 0];
    const bob = player.moving ? 0 : (Math.sin(t * 2.4) > .6 ? 1 : 0);
    g.save();
    g.globalAlpha = .45; g.fillStyle = '#000';
    g.beginPath(); g.ellipse(X, Y + 1, 6, 2.5, 0, 0, 6.284); g.fill();
    g.restore();
    // faint rim so the sprite separates from a same-value floor tile
    g.save();
    g.shadowColor = 'rgba(0,229,255,.85)'; g.shadowBlur = 6;
    g.drawImage(img, X - sprites.w / 2, Y - sprites.h + bob);
    g.restore();
    g.drawImage(img, X - sprites.w / 2, Y - sprites.h + bob);
  }

  /* ── LOOP ────────────────────────────────────────────────────── */
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!last) last = now;
    let dt = Math.min(.25, (now - last) / 1000);
    last = now;
    if (!paused) { acc += dt; t += dt; }
    while (acc >= STEP) { update(STEP); acc -= STEP; }
    render(paused ? 1 : acc / STEP);
  }

  function start() {
    render(1);                          // paint frame 0 now, don't wait for rAF
    if (!raf) { last = 0; raf = requestAnimationFrame(frame); }
  }
  function stop() { cancelAnimationFrame(raf); raf = 0; }
  function setPaused(v) { paused = v; if (v) keys = Object.create(null); }
  function getNearest() { return nearest; }

  /* Drive one deterministic frame — used by the smoke test. */
  function step(dt) { t += dt; update(dt); render(1); }

  return { init, start, stop, step, setPaused, getNearest, burst, audio: Audio_,
           get player() { return player; }, get reduceMotion() { return reduceMotion; } };
})();
