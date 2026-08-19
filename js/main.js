/* ═══════════════════════════════════════════════════════════════
   MAIN — wires the engine to the DOM.
   =============================================================== */
(function () {
  const D = PF.DATA, UI = PF.UI, E = PF.Engine, W = PF.World;
  const el = id => document.getElementById(id);
  const visited = new Set();

  /* ── HUD identity ────────────────────────────────────────────── */
  el('hudName').textContent = D.profile.name;
  el('hudRole').textContent = D.profile.role;
  document.title = `${D.profile.name} — ${D.profile.role}`;

  /* ── Quest list ──────────────────────────────────────────────── */
  const questList = el('questList');
  PF.ZONES.forEach(z => {
    const li = document.createElement('li');
    li.id = 'q-' + z.id;
    li.textContent = z.sub;
    questList.appendChild(li);
  });

  function markVisited(id) {
    if (visited.has(id)) return;
    visited.add(id);
    const li = el('q-' + id);
    if (li) li.classList.add('done');
    if (visited.size === PF.ZONES.length) banner('AREA COMPLETE ✦ 100%');
  }

  /* ── Zone banner ─────────────────────────────────────────────── */
  let bannerTimer = 0;
  function banner(text) {
    const b = el('zoneBanner');
    b.textContent = text;
    b.classList.add('show');
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => b.classList.remove('show'), 1900);
  }

  const REGION_NAME = {
    hub: 'THE HUB', arcade: 'THE ARCADE', playroom: 'THE PLAYTEST LAB', forge: 'THE FORGE',
    archive: 'THE ARCHIVE', uplink: 'THE UPLINK',
  };

  /* ── Panel content router ────────────────────────────────────── */
  function openFor(entity) {
    switch (entity.zone) {
      case 'playable':
        markVisited('playable');
        UI.openPanel(entity.label, UI.oneProjectHTML(entity.project) +
          `<p style="margin-top:18px;font-size:13px;opacity:.7">Every cabinet in this room has a real build behind it — press <b>PLAY</b> and it runs right here.</p>`);
        break;
      case 'projects':
        markVisited('projects');
        UI.openPanel(entity.label, UI.oneProjectHTML(entity.project) +
          `<p style="margin-top:18px;font-size:13px;opacity:.7">Shipped commercially, so the source isn't public. The playable builds are in <b>The Playtest Lab</b>, south of this room.</p>`);
        break;
      case 'skills':  markVisited('skills');  UI.openPanel('SKILL TREE',      UI.skillsHTML());  break;
      case 'about':   markVisited('about');   UI.openPanel('CHARACTER SHEET', UI.aboutHTML());   break;
      case 'contact': markVisited('contact'); UI.openPanel('UPLINK',          UI.contactHTML()); break;
      case 'resume':  markVisited('resume');  UI.openPanel('RESUME',          UI.resumeHTML());  break;
    }
    E.setPaused(true);
  }

  function closePanel() {
    UI.closePanel();
    E.setPaused(false);
    E.audio.close();
  }

  document.getElementById('panel').addEventListener('click', e => {
    if (e.target.hasAttribute('data-close')) closePanel();
  });

  /* ── Minimap ─────────────────────────────────────────────────── */
  function openMap() {
    const S = 6, cv = PF.Sprites.makeCanvas(W.MW * S, W.MH * S), g = cv.getContext('2d');
    g.fillStyle = '#0b0619'; g.fillRect(0, 0, cv.width, cv.height);
    const COL = { hub:'#b14aff', arcade:'#00e5ff', playroom:'#ff6b35', forge:'#ff2e97', archive:'#ffcf3d', uplink:'#4dff9e' };
    for (let j = 0; j < W.MH; j++) for (let i = 0; i < W.MW; i++) {
      if (W.isSolid(i, j)) continue;
      const r = W.regionAt(i, j);
      g.fillStyle = r === 'hall' ? '#241852' : (COL[r] || '#241852');
      g.globalAlpha = r === 'hall' ? .55 : .3;
      g.fillRect(i * S, j * S, S, S);
    }
    g.globalAlpha = 1;
    const p = E.player;
    g.fillStyle = '#fff';
    g.fillRect((p.x / W.TILE) * S - 2, (p.y / W.TILE) * S - 2, 5, 5);

    const legend = PF.ZONES.map(z =>
      `<span class="tag" style="border-color:${z.colour};color:${z.colour}">${UI.esc(z.name)} — ${UI.esc(z.sub)}</span>`).join('');

    UI.openPanel('HUB MAP', `
      <img src="${cv.toDataURL()}" alt="Map of the hub" style="width:100%;image-rendering:pixelated;border:1px solid var(--line);border-radius:4px">
      <div class="tags" style="margin-top:14px">${legend}</div>
      <p style="margin-top:12px;font-size:13px">White dot is you. Walk into any glowing object and press <kbd>E</kbd>.</p>`);
    E.setPaused(true);
  }

  /* ── Recruiter mode ──────────────────────────────────────────── */
  let docOpen = false;
  function showDoc() {
    el('docBody').innerHTML = UI.docHTML();
    el('doc').hidden = false;
    document.body.classList.add('doc-open');
    docOpen = true;
    E.setPaused(true);
    window.scrollTo(0, 0);
    UI.animateBars(el('doc'));
    el('btnBackToGame').focus();
  }
  function hideDoc() {
    el('doc').hidden = true;
    document.body.classList.remove('doc-open');
    docOpen = false;
    if (!UI.isPanelOpen()) E.setPaused(false);
  }

  el('btnRecruiter').addEventListener('click', showDoc);
  el('btnBackToGame').addEventListener('click', () => {
    hideDoc();
    if (el('game').hidden) safeLaunch();   // arrived here via "Skip" on boot
  });
  el('btnMap').addEventListener('click', openMap);

  /* ── Audio toggle ────────────────────────────────────────────── */
  const btnAudio = el('btnAudio');
  btnAudio.addEventListener('click', () => {
    const on = !E.audio.enabled;
    E.audio.toggle(on);
    btnAudio.textContent = on ? '♪ ON' : '♪ OFF';
    btnAudio.setAttribute('aria-pressed', String(on));
  });

  /* ── Keyboard shortcuts ──────────────────────────────────────── */
  window.addEventListener('keydown', e => {
    if (e.code === 'Escape') {
      if (playerOpen) { closePlayer(); return; }
      if (UI.isPanelOpen()) { closePanel(); return; }
      if (docOpen) { hideDoc(); return; }
    }
    if (playerOpen || docOpen || UI.isPanelOpen()) return;
    if (e.code === 'KeyM') { e.preventDefault(); openMap(); }
    if (e.code === 'KeyP') { e.preventDefault(); btnAudio.click(); }
    if (e.code === 'KeyR') { e.preventDefault(); showDoc(); }
  });

  /* ── Playable build player ───────────────────────────────────────
     Runs a real build in an iframe over the game. Some hosts send
     X-Frame-Options / frame-ancestors and simply refuse to be framed,
     and that is not detectable cross-origin — so OPEN IN TAB is always
     offered rather than leaving a recruiter staring at a black box. */
  let playerOpen = false, hintTimer = 0;

  function openPlayer(url, title) {
    el('playerTitle').textContent = title || 'Playable build';
    el('playerTab').href = url;
    const hint = el('playerHint'), notice = el('playerNotice'), frame = el('playerFrame');

    /* A build that ships inside this repo is loaded with a relative URL. Over
       file:// those builds cannot start: their loaders fetch a manifest, and
       fetch() from a file:// page is an opaque origin that every browser
       blocks. Say so plainly instead of showing a dead black rectangle with
       the reason buried in the console. */
    const isLocalBuild = !/^https?:\/\//i.test(url);
    if (isLocalBuild && location.protocol === 'file:') {
      frame.removeAttribute('src');
      frame.hidden = true;
      hint.hidden = true;
      notice.hidden = false;
      notice.innerHTML =
        '<div class="nbox">' +
        '<h3>THIS BUILD NEEDS A WEB SERVER</h3>' +
        '<p>You opened the portfolio straight from a folder, so the page is running ' +
        'on <code>file://</code>. Games bundled in this repo load their assets with ' +
        '<code>fetch()</code>, which every browser blocks on <code>file://</code>. ' +
        'Nothing is broken — it just needs to be served over http.</p>' +
        '<p>Double-click <code>serve.cmd</code> in the portfolio folder, then use the ' +
        'address it opens:</p>' +
        '<span class="cmd">serve.cmd &nbsp;→&nbsp; http://localhost:8080</span>' +
        '<p style="opacity:.7;font-size:13px">On the deployed site this never happens — ' +
        'GitHub Pages serves over https, so every build plays normally.</p>' +
        '</div>';
      el('player').hidden = false;
      playerOpen = true;
      E.setPaused(true);
      el('playerClose').focus();
      return;
    }

    notice.hidden = true;
    frame.hidden = false;
    hint.hidden = false;
    hint.classList.remove('warn');
    hint.innerHTML = 'Loading build…';
    frame.src = url;
    el('player').hidden = false;
    playerOpen = true;
    E.setPaused(true);
    el('playerClose').focus();

    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => {
      hint.classList.add('warn');
      hint.innerHTML = 'Still blank? This host may block embedding — ' +
        `<a href="${UI.esc(url)}" target="_blank" rel="noopener">open it in a new tab ↗</a>`;
    }, 6000);
  }

  function closePlayer() {
    // Blank the frame so the build stops running and its audio stops.
    el('playerFrame').src = 'about:blank';
    el('player').hidden = true;
    playerOpen = false;
    clearTimeout(hintTimer);
    if (!UI.isPanelOpen() && !docOpen) E.setPaused(false);
  }

  // Play buttons live inside panel and recruiter mode, so delegate.
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-play]');
    if (!b) return;
    e.preventDefault();
    openPlayer(b.getAttribute('data-play'), b.getAttribute('data-title'));
  });

  el('playerClose').addEventListener('click', closePlayer);
  el('playerFull').addEventListener('click', () => {
    const s = el('playerStage');
    if (document.fullscreenElement) document.exitFullscreen();
    else if (s.requestFullscreen) s.requestFullscreen();
  });

  /* ── Launch ──────────────────────────────────────────────────── */

  /* If anything in here throws, the START button would just sit there
     doing nothing with no explanation. Surface the failure and offer the
     plain-text version, so the content is never unreachable. */
  function safeLaunch() {
    try {
      launchGame();
    } catch (err) {
      el('boot').hidden = false;
      el('game').hidden = true;
      el('bootStart').hidden = true;
      el('bootLog').insertAdjacentHTML('beforeend',
        `<div style="color:#ff2e97;margin-top:14px">&gt; game failed to start: ${UI.esc(err && err.message || err)}</div>
         <div style="color:#9d93c4">&gt; opening the plain version instead…</div>`);
      setTimeout(showDoc, 900);
      throw err;                      // still report it to the console
    }
  }

  function launchGame() {
    document.body.classList.remove('is-booting');
    el('boot').hidden = true;
    el('game').hidden = false;

    if (matchMedia('(hover: none) and (pointer: coarse)').matches) el('touch').hidden = false;

    E.init(el('stage'), D, {
      interact: openFor,
      near(entity) {
        const p = el('prompt');
        if (!entity) { p.hidden = true; return; }
        el('promptText').textContent = entity.label;
        p.hidden = false;
      },
      region(r) {
        const z = PF.ZONES.find(z => ({ arcade:'projects', playroom:'playable', forge:'skills', archive:'about', uplink:'contact' })[r] === z.id);
        banner(REGION_NAME[r] || r);
        if (z) markVisited(z.id);
      },
    });
    E.start();
    banner('THE HUB');
    setTimeout(() => el('helpHint').classList.add('fade'), 9000);
  }

  el('bootSkip').addEventListener('click', () => {
    el('boot').hidden = true;
    document.body.classList.remove('is-booting');
    showDoc();
  });

  UI.runBoot(safeLaunch);
})();
