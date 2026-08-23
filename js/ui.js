/* ═══════════════════════════════════════════════════════════════
   UI — panels, recruiter mode, boot sequence.
   All content is escaped; unfilled ⟪placeholders⟫ render as inert
   text rather than dead links, so a half-finished site never ships
   a broken href to a recruiter.
   =============================================================== */
window.PF = window.PF || {};

PF.UI = (function () {

  const D = PF.DATA;
  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const isPlaceholder = s => /[⟪⟫]/.test(String(s || ''));

  /* A link only becomes clickable once it's a real URL. */
  function link(l) {
    if (!l || !l.url || isPlaceholder(l.url))
      return `<a aria-disabled="true" title="Add this URL in js/data.js" style="opacity:.45;cursor:not-allowed">${esc(l ? l.label : '')} —</a>`;
    return `<a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.label)} ↗</a>`;
  }

  const list = (arr, cls) => (arr && arr.length)
    ? `<ul class="${cls || ''}">${arr.map(b => `<li>${esc(b)}</li>`).join('')}</ul>` : '';


  /* ── PLAYABLE BUILD BUTTON ───────────────────────────────────────
     type "embed" -> plays inside the page in an iframe
     type "link"  -> host blocks framing, so open a new tab instead
     type "soon"  -> not hosted yet; say so honestly, don't fake a link */
  function playHTML(p) {
    const g = p.play;
    if (!g) return '';
    if (g.type === 'soon')
      return `<p class="playnote">▸ Playable build coming soon${g.note ? ' — ' + esc(g.note) : ''}.</p>`;
    if (!g.url || isPlaceholder(g.url)) return '';
    const note = g.note ? `<p class="playnote">${esc(g.note)}</p>` : '';
    if (g.type === 'link')
      return `<a class="playbtn" href="${esc(g.url)}" target="_blank" rel="noopener noreferrer">▶ PLAY NOW ↗</a>${note}`;
    return `<button class="playbtn" type="button" data-play="${esc(g.url)}" data-title="${esc(p.title)}">▶ PLAY IN BROWSER</button>${note}`;
  }

  /* ── PROJECT CARD ────────────────────────────────────────────── */
  function projectCard(p, i) {
    const art = PF.Sprites.cover(p.title + i, (p.art && p.art[0]) || '#00e5ff', (p.art && p.art[1]) || '#b14aff');
    // Only join the meta fields that actually exist — no dangling " · ".
    const meta = [p.role, p.engine, p.year].filter(Boolean).map(esc).join(' · ');
    return `
      <article class="card">
        <div class="card__top">
          <img class="card__art" src="${art.toDataURL()}" alt="" width="112" height="78">
          <div class="card__meta">
            <h3 class="card__title">${esc(p.title)}</h3>
            <div class="card__role">${meta}</div>
            <p class="card__pitch">${esc(p.pitch)}</p>
            ${list(p.bullets, 'card__bullets')}
            <div class="tags">${(p.tags || []).map(tg => `<span class="tag">${esc(tg)}</span>`).join('')}</div>
            ${playHTML(p)}
            <div class="links">${(p.links || []).map(link).join('')}</div>
            ${p.note ? `<p style="margin:11px 0 0;font-size:12px;opacity:.62">${esc(p.note)}</p>` : ''}
          </div>
        </div>
      </article>`;
  }

  const projectsHTML = () => `<div class="cards">${(D.projects || []).map(projectCard).join('')}</div>`;
  const oneProjectHTML = i => `<div class="cards">${projectCard(D.projects[i], i)}</div>`;

  /* ── SKILLS ──────────────────────────────────────────────────── */
  function skillsHTML() {
    return (D.skills || []).map(gp => `
      <h3>${esc(gp.group)}</h3>
      ${gp.note ? `<p style="font-size:12.5px;opacity:.7;margin:-4px 0 12px">${esc(gp.note)}</p>` : ''}
      ${gp.items.map(s => `
        <div class="skill">
          <div class="skill__row">
            <span class="skill__name">${esc(s.name)}${s.note ? ` <span style="opacity:.55;font-size:11px">— ${esc(s.note)}</span>` : ''}</span>
            <span class="skill__lvl">${'█'.repeat(Math.round(s.level / 20)).padEnd(5, '░')}</span>
          </div>
          <div class="skill__bar"><i data-w="${Math.max(0, Math.min(100, s.level))}"></i></div>
        </div>`).join('')}
    `).join('');
  }

  /* ── ABOUT ───────────────────────────────────────────────────── */
  function aboutHTML() {
    return `
      <div class="stats">${(D.stats || []).map(s =>
        `<div class="stat"><div class="stat__k">${esc(s.k)}</div><div class="stat__v">${esc(s.v)}</div></div>`).join('')}</div>
      ${(D.about || []).map(p => `<p>${esc(p)}</p>`).join('')}
      <h3>FIND ME</h3>
      <div class="links">${(D.links || []).map(link).join('')}</div>`;
  }

  /* ── CONTACT ─────────────────────────────────────────────────── */
  function contactHTML() {
    const p = D.profile, mail = isPlaceholder(p.email)
      ? `<span style="opacity:.5">${esc(p.email)}</span>`
      : `<a href="mailto:${esc(p.email)}">${esc(p.email)}</a>`;
    return `
      <div class="term">
        <div><span class="c">$</span> uplink --open</div>
        <div><span class="k">email   </span> ${mail}</div>
        <div><span class="k">location</span> ${esc(p.location)}</div>
        <div><span class="k">status  </span> ${esc(p.available)}</div>
        <div><span class="k">mobility</span> ${esc(p.relocate)}</div>
        <div><span class="c">$</span> links --list</div>
      </div>
      <div class="links" style="margin-top:16px">${(D.links || []).map(link).join('')}</div>
      <p style="margin-top:18px;font-size:13px">Fastest reply is by email. I read every message.</p>`;
  }

  /* ── RESUME PEDESTAL ─────────────────────────────────────────── */
  function resumeHTML() {
    const u = D.profile.resumeUrl;
    const p = D.profile;
    const body = (!u || isPlaceholder(u))
      ? `<p>Resume available on request — email me and I'll send it straight over.</p>
         <div class="links">${link({ label: 'EMAIL ME', url: isPlaceholder(p.email) ? p.email : 'mailto:' + p.email })}</div>`
      : `<p>The full resume, in PDF.</p>
         <div class="links">
           <a href="${esc(u)}" target="_blank" rel="noopener">OPEN RESUME ↗</a>
           <a href="${esc(u)}" download>DOWNLOAD PDF ↓</a>
         </div>`;
    return body + `
      <p style="margin-top:18px;font-size:13px;opacity:.75">
        In a hurry? <b>Recruiter Mode</b> (top right) is the whole portfolio as one
        plain scrolling page — no game required.
      </p>`;
  }


  /* ── SHIPPING RECORD ─────────────────────────────────────────────
     The aggregate view of the commercial work. Sits beside spawn so the
     scale reads before a recruiter forms an impression from ten kids'
     game titles. Counts are derived, never hard-coded, so they cannot
     drift out of date when a project is added or removed. */
  function recordHTML() {
    const shipped = (D.projects || []).filter(p => !/personal/i.test(p.role || ''));
    const engines = {};
    shipped.forEach(p => { const e = String(p.engine).split('·')[0].trim(); engines[e] = (engines[e] || 0) + 1; });
    const engineLine = Object.keys(engines).map(k => `${esc(k)} ×${engines[k]}`).join(' · ');

    const stat = (k, v) => `<div class="stat"><div class="stat__k">${esc(k)}</div><div class="stat__v">${esc(v)}</div></div>`;

    return `
      <div class="stats">
        ${stat('TITLES SHIPPED', shipped.length + ' on Google Play')}
        ${stat('COMBINED REACH', '1M+ downloads')}
        ${stat('ENGINES', engineLine)}
        ${stat('PLATFORM', 'Android, offline-first')}
      </div>
      <h3>WHAT SHIPPING THAT MANY TAUGHT ME</h3>
      <p>Every title below went out to a real audience on a real schedule, which
      means each one carried the parts that are easy to skip on a prototype:
      progression and save systems, IAP and ads integration, level unlocking,
      and performance work to keep it smooth on low-end Android.</p>
      <p>The architecture is what made that pace possible. Levels and content are
      driven by JSON configuration rather than hard-coded scenes, so new stages
      and activities could be added without touching gameplay code.</p>
      <h3>SYSTEMS BUILT ACROSS THESE TITLES</h3>
      <div class="tags">
        ${['2D vehicle physics — suspension, collision, terrain',
           'Data-driven JSON level loading',
           'Progression & save systems',
           'IAP & ads SDK integration',
           'Hint & assist systems',
           'Path validation & puzzle logic',
           'Modular mini-game architecture',
           'Spine, particles & tween animation',
           'Low-end device optimisation',
           'Voice-instruction & no-read UX',
          ].map(t => `<span class="tag">${esc(t)}</span>`).join('')}
      </div>
      <p style="margin-top:16px;font-size:13px;opacity:.75">
        All ${shipped.length} titles are in <b>The Arcade</b>, straight north of here.
        They are children's and casual games — that was the studio's market, not the
        limit of the engineering.
      </p>`;
  }
  /* ── RECRUITER MODE (the full plain-text version) ────────────── */
  function docHTML() {
    const p = D.profile;
    const block = (arr) => (arr || []).map(x => `
      <article class="card" style="margin-bottom:14px">
        <div class="card__top">
          <div class="card__meta">
            <h3 class="card__title">${esc(x.title)}</h3>
            <div class="card__role">${esc(x.org)} · ${esc(x.when)}</div>
            ${list(x.bullets, 'card__bullets')}
          </div>
        </div>
      </article>`).join('');

    return `
      <h1>${esc(p.name)}</h1>
      <div class="doc__lede">${esc(p.role)} · ${esc(p.location)}</div>
      <p>${esc(p.tagline)}</p>
      <div class="doc__contact links">
        ${link({ label: 'EMAIL', url: isPlaceholder(p.email) ? p.email : 'mailto:' + p.email })}
        ${(D.links || []).map(link).join('')}
        <a href="${esc(p.resumeUrl)}" target="_blank" rel="noopener">RESUME PDF ↗</a>
      </div>

      <h2>ABOUT</h2>
      ${(D.about || []).map(x => `<p>${esc(x)}</p>`).join('')}
      <div class="stats">${(D.stats || []).map(s =>
        `<div class="stat"><div class="stat__k">${esc(s.k)}</div><div class="stat__v">${esc(s.v)}</div></div>`).join('')}</div>

      ${(D.experience || []).length ? `<h2>EXPERIENCE</h2>${block(D.experience)}` : ''}

      <h2>PROJECTS</h2>
      ${projectsHTML()}

      <h2>SKILLS</h2>
      ${skillsHTML()}

      ${(D.education || []).length ? `<h2>EDUCATION</h2>${block(D.education)}` : ''}

      <p style="margin-top:44px;font-size:12.5px;opacity:.6">
        This page is the plain version of an interactive portfolio — the game
        is one click away with the button below.
      </p>`;
  }

  /* ── PANEL PLUMBING ──────────────────────────────────────────── */
  const el = id => document.getElementById(id);
  let lastFocus = null;

  /* Fill the skill bars. rAF gives the nice grow-in animation, but rAF is
     suspended in background tabs — without the timeout fallback a panel
     opened while the tab is hidden would render its bars permanently
     empty, which reads as "broken", not "animating". */
  function animateBars(root) {
    const apply = () => root.querySelectorAll('.skill__bar i')
      .forEach(b => { if (!b.style.width) b.style.width = b.dataset.w + '%'; });
    requestAnimationFrame(() => requestAnimationFrame(apply));
    setTimeout(apply, 120);
  }

  function openPanel(title, html) {
    lastFocus = document.activeElement;
    el('panelTitle').textContent = title;
    el('panelBody').innerHTML = html;
    el('panel').hidden = false;
    el('panelBody').scrollTop = 0;
    el('panelBody').focus();
    animateBars(el('panelBody'));
  }

  function closePanel() {
    el('panel').hidden = true;
    el('panelBody').innerHTML = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  const isPanelOpen = () => !el('panel').hidden;

  /* ── BOOT SEQUENCE ───────────────────────────────────────────── */
  function runBoot(done) {
    const logo =
`  ___  ___  ___ _____ ___ ___  _    ___ ___
 | _ \\/ _ \\| _ \\_   _| __/ _ \\| |  |_ _/ _ \\
 |  _/ (_) |   / | | | _| (_) | |__ | | (_) |
 |_|  \\___/|_|_\\ |_| |_| \\___/|____|___\\___/`;
    document.querySelector('.boot__logo').textContent = logo;

    const lines = D.bootLines || [];
    const log = el('bootLog'), bar = el('bootBar'), start = el('bootStart');
    const fast = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let i = 0;

    (function next() {
      if (i >= lines.length) {
        bar.style.width = '100%';
        start.hidden = false;
        start.focus();
        return;
      }
      log.insertAdjacentHTML('beforeend', `<div>&gt; ${lines[i]}</div>`);
      log.scrollTop = log.scrollHeight;
      i++;
      bar.style.width = (i / lines.length * 100) + '%';
      setTimeout(next, fast ? 40 : 150 + Math.random() * 160);
    })();

    start.addEventListener('click', done);
  }

  return {
    esc, isPlaceholder, link,
    projectsHTML, oneProjectHTML, skillsHTML, aboutHTML, contactHTML, resumeHTML, recordHTML, docHTML,
    openPanel, closePanel, isPanelOpen, runBoot, animateBars,
  };
})();
