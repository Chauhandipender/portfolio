/* ═══════════════════════════════════════════════════════════════════════
   ██  THIS IS THE ONLY FILE YOU NEED TO EDIT  ██

   Everything the site shows comes from here. Change wording, reorder
   projects, add or delete entries — the world re-flows itself (add a
   project and a new arcade cabinet appears in the hall).
   ═══════════════════════════════════════════════════════════════════════ */

window.PF = window.PF || {};

PF.DATA = {

  /* ── 1. WHO YOU ARE ────────────────────────────────────────────── */
  profile: {
    name:      "DIPENDER CHAUHAN",
    handle:    "",
    role:      "Game Developer — Unity 6 & Cocos Creator",
    tagline:   "Eleven titles shipped to Google Play across Cocos Creator and Unity, reaching 1M+ downloads — plus a set of Unity 6 projects you can play right here in the browser: two shooters, a rail shooter with hand-written shaders, and a puzzle game with a solver behind it.",
    location:  "Ahmedabad, Gujarat, India",
    relocate:  "Open to relocation",
    available: "Open to new opportunities",
    email:     "dipender0901@gmail.com",
    resumeUrl: "resume/Dipender_Chauhan_CV.pdf",

    /* Your phone number is on your CV but deliberately NOT published here —
       a public page gets scraped by spam bots in a way a emailed PDF does
       not. Recruiters who want it get it from the CV on the pedestal.
       If you'd rather show it, add it to the `contact` terminal below. */
  },

  /* ── 2. LINKS ──────────────────────────────────────────────────── */
  links: [
    { label: "LINKEDIN", url: "https://www.linkedin.com/in/dipender-chauhan/" },
    /* If you have a public Google Play developer page, add it here — I left
       it out rather than guess the URL and ship a 404 to a recruiter:
       { label: "GOOGLE PLAY", url: "https://play.google.com/store/apps/dev?id=..." },
       Same for GitHub, once you have public repos worth showing. */
  ],

  /* ── 3. CHARACTER SHEET ────────────────────────────────────────── */
  stats: [
    { k: "CLASS",     v: "Game Developer" },
    { k: "STUDIO",    v: "Mfinity Infotech" },
    { k: "ENGINES",   v: "Unity 6 · Cocos Creator" },
    { k: "LANGUAGES", v: "C# · TypeScript · HLSL" },
    { k: "SHIPPED",   v: "11 titles on Google Play" },
    { k: "REACH",     v: "1M+ combined downloads" },
    { k: "PLAYABLE",  v: "5 builds, in this browser" },
    { k: "EDUCATION", v: "B.Tech CS, 2025" },
    { k: "BASE",      v: "Ahmedabad, Gujarat, IN" },
  ],

  about: [
    "I'm a game developer in Ahmedabad. At Mfinity Infotech I've shipped eleven titles to Google Play across Cocos Creator and Unity — casual puzzle, physics racing, educational and simulation — reaching a combined 1M+ downloads. Alongside that I build 3D games in Unity 6, and those are the ones you can play in this room.",
    "The commercial work is where I learned to ship: progression and save systems, IAP and ads integration, JSON-driven level architecture so designers could add content without touching gameplay code, and the performance discipline to keep all of it smooth on low-end Android hardware.",
    "The personal work is where I go deeper. Across three Unity 6 projects I've written first-person weapon handling with live spread and recoil, enemy AI on a wave director, NavMesh pathfinding, destructible vehicles using Voronoi fracturing, and seven URP shaders by hand — including height fog and volumetric light shafts resolved together in a single half-resolution raymarch.",
    "One habit runs through all of it: I generate rather than import. In two of those projects there is not a single imported model, texture, audio clip or material — the terrain, the weapons, the enemies, the UI and every sound effect are produced in C# at runtime.",
    "B.Tech Computer Science from Ahmedabad Institute of Technology, 2025. Based in Ahmedabad, open to relocating, and looking for roles where I can keep pushing on gameplay and graphics systems.",
  ],

  /* ── 4. SKILL TREE ─────────────────────────────────────────────
     ⚠ THE NUMBERS BELOW ARE MY ESTIMATE, from your CV and from reading
     the four Unity/HTML5 projects. REVIEW THEM BEFORE ANYONE ELSE DOES.
     Only you know your true proficiency, and a recruiter will ask
     about anything sitting near the top of a bar.                   */
  skills: [
    { group: "ENGINES", note: "Counts are from the shipped titles and playable builds in this portfolio.", items: [
      { name: "Cocos Creator", level: 90, note: "9 shipped titles" },
      { name: "Unity",         level: 85, note: "3 solo projects on Unity 6, + 2 shipped titles" },
    ]},
    { group: "LANGUAGES", items: [
      { name: "C#",              level: 85, note: "Unity gameplay, systems and tooling" },
      { name: "TypeScript",      level: 88, note: "9 shipped Cocos titles" },
      { name: "JavaScript",      level: 78 },
      { name: "HLSL / ShaderLab",level: 62, note: "7 hand-written URP shaders" },
    ]},
    { group: "GRAPHICS & RENDERING", note: "Mostly from the Unity 6 work you can play in this room.", items: [
      { name: "Procedural mesh, texture & audio generation", level: 85, note: "whole scenes built in C# at runtime" },
      { name: "URP shader authoring",           level: 65 },
      { name: "Post-processing & game feel",    level: 75 },
      { name: "Volumetric lighting & raymarching", level: 55, note: "height fog + light shafts in one half-res pass" },
    ]},
    { group: "GAMEPLAY SYSTEMS", items: [
      { name: "Progression & save systems",     level: 85 },
      { name: "Data-driven JSON level config",  level: 80 },
      { name: "FPS weapon handling — spread, recoil, ADS", level: 78 },
      { name: "2D physics — vehicles, suspension, terrain", level: 78 },
      { name: "Enemy AI, wave direction & telegraphs", level: 75 },
      { name: "Puzzle logic, solvers & path validation", level: 75 },
      { name: "NavMesh pathfinding",            level: 70 },
    ]},
    { group: "SHIPPING & TOOLS", items: [
      { name: "Git / GitHub",                   level: 85 },
      { name: "Ads SDK & IAP integration",      level: 80 },
      { name: "WebGL build & deployment",       level: 78 },
      { name: "Low-end device optimisation",    level: 78 },
      { name: "Editor tooling & scene generators", level: 72 },
      { name: "Spine, particles & tween animation", level: 72 },
      { name: "Android Studio",                 level: 70 },
      { name: "Jira",                           level: 65 },
    ]},
  ],

  /* ── 5. PROJECTS — one arcade cabinet each ─────────────────────
     Order matters: the first entry becomes the cabinet a player
     reaches first, so the strongest work leads.                     */
  projects: [
    {
      title:  "Snowfield — FPP Zombie Shooter",
      role:   "Solo developer · personal project",
      engine: "Unity 6 · C# · URP",
      pitch:  "First-person zombie survival in a snowy conifer forest at dawn. Two weapons, endless waves, no menus — you load in and start shooting.",
      bullets: [
        "Built two weapons that genuinely feel different: a 600 RPM full-auto rifle with a 30-round magazine, and a pump shotgun throwing 9 pellets a shell that reloads shell by shell.",
        "Aiming down sights zooms in, tightens the spread cone, steadies the weapon and slows you down — and the crosshair gap tracks the live spread value, so you can read your own accuracy while you shoot.",
        "Wave spawner with a 25-zombie concurrent cap, NavMesh pathfinding, and a minimap plotting every active enemy.",
        "Generated the entire scene in C# at runtime — terrain, conifers, sky, snowfall, both weapons, the zombies, the UI and every single sound effect. There is not one imported model, texture, audio clip, prefab or material in the project.",
        "Spent the polish budget on game feel: weapon sway, muzzle flash, pooled tracers, impact effects, hitmarkers and a damage vignette.",
      ],
      tags:  ["Unity 6", "C#", "URP", "FPS", "NavMesh", "Procedural generation"],
      links: [],
      play:  { type: "embed", url: "https://zombie-shooter-fpp.netlify.app/",
               note: "Unity WebGL, ~15 MB — click the window to capture the mouse. WASD move, mouse aim, right click to aim down sights, 1/2 swap weapons." },
      note:  "Personal project — playable in the browser above.",
      art: ["#9fe8ff", "#33607a"],
    },
    {
      title:  "Rail Gunner",
      role:   "Solo developer · personal project",
      engine: "Unity 6 · C# · URP · hand-written shaders",
      pitch:  "A first-person rail shooter. You man a pintle-mounted machine gun on the rear balcony of the last carriage of a moving train, sweeping a dawn forest while vehicles chase you down the service roads and drones come in from above.",
      bullets: [
        "Nine enemy archetypes driven by a wave director, where every attack is only reachable through a completed telegraph — so the pressure can scale hard without ever feeling cheap.",
        "Destructible vehicles built on Voronoi fracturing computed at editor time, so wrecks come apart into real debris at runtime without paying the fracture cost mid-fight.",
        "Wrote seven URP shaders by hand for the dawn-forest look, including height fog and volumetric light shafts resolved together in a single half-resolution raymarch, with a Henyey-Greenstein phase function so looking into the low sun scatters warm.",
        "Streaming world on a rolling 27-chunk window, with Poisson-disc vegetation scatter and a global wind system driving everything that moves.",
        "Treated mouse and gamepad as genuinely separate aiming models rather than mapping one onto the other — a mouse reports pixels moved since the last frame, a stick reports displacement, and pretending otherwise makes one of them feel wrong.",
      ],
      tags:  ["Unity 6", "C#", "URP", "Custom shaders", "Volumetric lighting", "Voronoi destruction", "Wave director AI"],
      links: [],
      play:  { type: "embed", url: "https://rail-gunner.netlify.app/",
               note: "Unity WebGL, ~27 MB — the largest build here, give it a moment. Silent for now: audio is a later phase." },
      note:  "Personal project, and a deliberate vertical slice: the track, gunnery, enemy AI, destruction and lighting are in; audio and menus are the next phase.",
      art: ["#ffb36b", "#2e5d5a"],
    },
    {
      title:  "Jungle Road Turret Shooter",
      role:   "Solo developer · personal project",
      engine: "Unity 6 · C# · URP",
      pitch:  "A truck barrels down an overgrown jungle highway and you're strapped into the turret on the back, facing backwards, holding off the drones and buggies hunting you down.",
      bullets: [
        "Built the whole thing around one tense idea: the truck drives itself, so the only job left is aiming, tracking and surviving whatever is closing in behind you.",
        "Two enemy types that force constant re-prioritising — quick aerial drones and heavier ground buggies coming at different speeds and heights.",
        "Mouse-aimed turret, left click to fire, and an instant restart on death, so a mistake costs you seconds instead of momentum.",
        "Made every mesh, material and texture procedurally instead of importing art, which keeps the browser download small enough that people actually wait for it.",
        "Unity 6 with URP and the new Input System, shipped as a WebGL build you can play in a tab.",
      ],
      tags:  ["Unity 6", "C#", "URP", "WebGL", "Procedural generation"],
      links: [],
      play:  { type: "embed", url: "https://jungle-turret.netlify.app/",
               note: "Unity WebGL, ~13 MB — give it a moment to load. Mouse aims, left click fires." },
      note:  "Personal project — playable in the browser above.",
      art: ["#4dff9e", "#1f8a4c"],
    },
    {
      title:  "Waypoint",
      role:   "Solo developer · personal project",
      engine: "HTML5 · JavaScript",
      pitch:  "A one-line logic puzzle. Draw a single unbroken path that touches every numbered cell in order and fills every square on the board — without ever crossing your own line.",
      bullets: [
        "Designed the ruleset and the difficulty curve, then built a generator that turns out fresh boards endlessly.",
        "Every board is proved to have exactly one solution before the player ever sees it, so there is never a 'wait, my answer worked too' moment.",
        "Built a daily puzzle and an endless mode, with progress that survives closing the tab.",
        "No engine and no dependencies — plain JavaScript, so it loads instantly even on a phone on bad wifi.",
      ],
      tags:  ["HTML5", "JavaScript", "Puzzle", "Solver", "Procedural generation"],
      links: [],
      play:  { type: "embed", url: "games/waypoint/index.html" },
      note:  "Personal project, built for the CrazyGames web portal.",
      art: ["#ffcf3d", "#b14aff"],
    },
    {
      title:  "Cute Animal Car Racing Game",
      role:   "Game Developer · Mfinity Infotech",
      engine: "Cocos Creator · TypeScript",
      pitch:  "A physics-based 2D vehicle game in the Hill Climb Racing mould, wrapped in a one-tap racer for young players with unlockable animal vehicles across forest, snow, desert and city.",
      bullets: [
        "Wrote the vehicle simulation end to end: movement, acceleration, braking, suspension behaviour, collision detection and terrain interaction.",
        "Tuned handling through physics materials, rigid bodies and colliders until the weight and bounce felt right.",
        "Designed procedural terrain interactions and profiled the simulation until it held frame rate on low-end Android.",
        "Built the full commercial layer — IAP, ads SDK, save-data management and level unlocking.",
        "Added particle effects and a camera-follow rig to sharpen game feel.",
      ],
      tags:  ["Cocos Creator", "TypeScript", "2D Physics", "IAP & Ads", "Offline"],
      links: [{ label: "GOOGLE PLAY", url: "https://play.google.com/store/apps/details?id=com.funworld.cutecarracinggame" }],
      note:  "Published by Fun World Games. Built as in-house work-for-hire, so the source isn't publicly shareable.",
      art: ["#4dff9e", "#ffcf3d"],
    },
    {
      title:  "Tricky Puzzle: Antistress Game",
      role:   "Game Developer · Mfinity Infotech",
      engine: "Unity · C#",
      pitch:  "A shell architecture hosting 100+ self-contained mini-games — ASMR tasks, sorting, tidy-up and logic puzzles — presented as a single stress-relief app.",
      bullets: [
        "Built the gameplay systems and interaction layer that 100+ discrete micro-levels plug into, so new ones could be added without reworking the shell.",
        "Implemented the UI systems, core game logic and the performance optimisations needed to keep that many scenes loading fast.",
        "Handled tap and drag interaction with haptic feedback across every mini-game type.",
      ],
      tags:  ["Unity", "C#", "Casual Puzzle", "Haptics", "100+ levels"],
      links: [{ label: "GOOGLE PLAY", url: "https://play.google.com/store/apps/details?id=com.fabulousfun.trickyantistresspuzzle" }],
      note:  "Published by Fabulous Fun. Built as in-house work-for-hire, so the source isn't publicly shareable.",
      art: ["#00e5ff", "#b14aff"],
    },
    {
      title:  "Emoji Connect Puzzle Game",
      role:   "Personal project",
      engine: "Cocos Creator · TypeScript",
      pitch:  "A connect-the-pairs puzzle where players link matching emoji through valid paths while avoiding invalid connections.",
      bullets: [
        "Implemented path validation algorithms, matching logic, level progression and game state management.",
        "Designed a dynamic hint system that identifies unsolved paths and gives context-aware assistance rather than just revealing the answer.",
      ],
      tags:  ["Cocos Creator", "TypeScript", "Algorithms", "Personal project"],
      links: [],
      play:  { type: "embed", url: "https://emoji-match-09.netlify.app/",
               note: "Portrait game — best in a tall window or on a phone." },
      note:  "Built in my own time — the algorithm work here is the part I'd most like to talk through.",
      art: ["#ffcf3d", "#4dff9e"],
    },
    {
      title:  "Prince Princess Wedding Story",
      role:   "Game Developer · Mfinity Infotech",
      engine: "Cocos Creator · TypeScript",
      pitch:  "The widest system range of anything I've shipped: DIY tailoring, pet care, hidden object, maze, archery and crafting mini-games, all sequenced into one linear story.",
      bullets: [
        "Integrated six distinct mini-game types — each with its own rules, input model and win condition — behind one consistent progression and state layer.",
        "Sequenced the whole thing as a narrative flow (proposal → castle repair → styling → ceremony) where each stage gates the next.",
        "The scale here is the point: it is effectively six small games sharing one save system and one UI language.",
      ],
      tags:  ["Cocos Creator", "TypeScript", "Narrative flow", "Mini-game systems"],
      links: [{ label: "GOOGLE PLAY", url: "https://play.google.com/store/apps/details?id=com.fabulousfun.princeprincesswedding" }],
      note:  "Published by Fabulous Fun. Built as in-house work-for-hire, so the source isn't publicly shareable.",
      art: ["#ffcf3d", "#ff2e97"],
    },
    {
      title:  "Dream Glow: Skincare ASMR",
      role:   "Game Developer · Mfinity Infotech",
      engine: "Cocos Creator · TypeScript",
      pitch:  "A simulation with a three-axis scoring model driving progression and unlocks, presented as a relaxing ASMR skincare routine.",
      bullets: [
        "Designed and built the scoring system — Technique, Cleanliness and Calm — and wired it to tool and cosmetic unlocks.",
        "Built two separate modes on one core: scripted 'Story Case' routines and a freeform 'Free Play Spa'.",
        "Implemented the tool interaction model — foam cleansers, jelly and peel-off masks, pore wand, rollers — each with its own response.",
      ],
      tags:  ["Cocos Creator", "TypeScript", "Simulation", "Progression systems"],
      links: [{ label: "GOOGLE PLAY", url: "https://play.google.com/store/apps/details?id=com.fabulousfungames.dreamglow.skincare.asmr" }],
      note:  "Published by Fabulous Fun. Built as in-house work-for-hire, so the source isn't publicly shareable.",
      art: ["#ff9ecb", "#c9a4ff"],
    },
    {
      title:  "Dream Hair Salon",
      role:   "Game Developer · Mfinity Infotech",
      engine: "Unity · C#",
      pitch:  "A hair-salon makeover sim: clients arrive, and you take each one through a wash, cut, colour and style, then finish with makeup, nails and an outfit.",
      bullets: [
        "Built the multi-stage client flow — wash, cut, colour, style, then the makeup, nail and dress-up finishers — as ordered stages sharing one state model, so a client can't reach styling before the cut is done.",
        "Implemented the tool interaction model: each implement has its own drag behaviour, target areas and completion condition, rather than one generic tap handler behind different icons.",
        "Wired level progression to unlockable tools, colours and outfits, so the styling options widen as the player advances.",
        "Shipped with ads integration on the same offline-first, low-end Android footing as the rest of the catalogue.",
      ],
      tags:  ["Unity", "C#", "Simulation", "Multi-stage flow", "Progression"],
      links: [{ label: "GOOGLE PLAY", url: "https://play.google.com/store/apps/details?id=com.funworldgames.dreamhairsalon" }],
      note:  "Published by Fun World Games. Built as in-house work-for-hire, so the source isn't publicly shareable.",
      art: ["#ff6bb5", "#3d2a6b"],
    },
    {
      title:  "Hexa Arrow Sort: Tap Puzzle",
      role:   "Game Developer · Mfinity Infotech",
      engine: "Cocos Creator · TypeScript",
      pitch:  "A constraint-based tile puzzle: every hexagon may only move along the direction its arrow points, which turns a simple board into a dependency problem.",
      bullets: [
        "Built the tile movement and collision resolution that makes directional constraints work on a hex grid.",
        "Implemented the colour-sorting rules and layered stack logic that generate the difficulty curve.",
        "Runs fully offline with no server round-trips.",
      ],
      tags:  ["Cocos Creator", "TypeScript", "Logic puzzle", "Offline"],
      links: [{ label: "GOOGLE PLAY", url: "https://play.google.com/store/apps/details?id=com.funworld.hexaarrowslidepuzzle" }],
      note:  "Published by Fun World Games. Built as in-house work-for-hire, so the source isn't publicly shareable.",
      art: ["#00e5ff", "#ff2e97"],
    },
    {
      title:  "Find The Pigeon Hidden Game",
      role:   "Game Developer · Mfinity Infotech",
      engine: "Cocos Creator · TypeScript",
      pitch:  "A hidden-object game across 100+ hand-drawn scenes, where the engineering problem is asset streaming and a hint system that helps without solving.",
      bullets: [
        "Built the hint system, the progressive difficulty curve and the unlock logic for multiple world themes.",
        "Managed 100+ large hand-drawn scenes with loading kept light enough for low-end devices.",
      ],
      tags:  ["Cocos Creator", "TypeScript", "Hidden object", "100+ scenes"],
      links: [{ label: "GOOGLE PLAY", url: "https://play.google.com/store/apps/details?id=com.fabulousfun.findthepigeon.hiddenobject" }],
      note:  "Published by Fabulous Fun. Built as in-house work-for-hire, so the source isn't publicly shareable.",
      art: ["#4dffe0", "#4da8ff"],
    },
    {
      title:  "PlaySchool Pro: ABC 123",
      role:   "Game Developer · Mfinity Infotech",
      engine: "Cocos Creator · TypeScript",
      pitch:  "An education platform with a reward economy and full voice guidance, covering phonics, number tracing, shapes, maths, jigsaws and time-telling for ages 2–5.",
      bullets: [
        "Built a reward and shop economy spanning every learning module, so progress in one carries into the others.",
        "Implemented full voice-instruction support so the entire app is operable by players who cannot read.",
        "Integrated eight-plus distinct activity types behind one progression system.",
      ],
      tags:  ["Cocos Creator", "TypeScript", "Educational", "Reward economy", "Voice UI"],
      links: [{ label: "GOOGLE PLAY", url: "https://play.google.com/store/apps/details?id=com.fabulousfun.playschoolpro" }],
      note:  "Published by Fabulous Fun. Built as in-house work-for-hire, so the source isn't publicly shareable.",
      art: ["#4da8ff", "#4dff9e"],
    },
    {
      title:  "Unicorn Love & Care",
      role:   "Game Developer · Mfinity Infotech",
      engine: "Cocos Creator · TypeScript",
      pitch:  "A modular care-sim: bath, room and kitchen cleanup, party decorating, colouring, makeover and a doctor sequence, each an independent module.",
      bullets: [
        "Built on a modular level architecture where each care scene is self-contained, so new activities drop in without touching existing ones.",
        "That structure is what let the title keep expanding after launch without regression risk.",
      ],
      tags:  ["Cocos Creator", "TypeScript", "Virtual pet", "Modular architecture"],
      links: [{ label: "GOOGLE PLAY", url: "https://play.google.com/store/apps/details?id=com.funworldgames.unicornloveandcare" }],
      note:  "Published by Fun World Games. Built as in-house work-for-hire, so the source isn't publicly shareable.",
      art: ["#ff8cc6", "#b14aff"],
    },
    {
      title:  "Kids Cooking Factory Game",
      role:   "Game Developer · Mfinity Infotech",
      engine: "Cocos Creator · TypeScript",
      pitch:  "A stage-based cooking simulator: each recipe is a step-by-step state machine driving factory-style production across pizza, burgers, cakes, juices and desserts.",
      bullets: [
        "Built the recipe state machine so every dish shares one pipeline and new recipes are data, not code.",
        "Tuned drag-and-drop interaction and hit targets for small children, fully offline.",
        "Earned a 'Teacher Approved' listing on Google Play.",
      ],
      tags:  ["Cocos Creator", "TypeScript", "Educational", "Teacher Approved"],
      links: [{ label: "GOOGLE PLAY", url: "https://play.google.com/store/apps/details?id=com.fabulousfun.cookingfactory.satisgame" }],
      note:  "Published by Fabulous Fun. Built as in-house work-for-hire, so the source isn't publicly shareable.",
      art: ["#ff9f3d", "#ffcf3d"],
    },
    {
      title:  "Little Giraffe My Pet Friend",
      role:   "Game Developer · Mfinity Infotech",
      engine: "Cocos Creator · TypeScript",
      pitch:  "A toddler care-sim built under hard accessibility constraints: no reading, oversized touch targets and deliberately unhurried pacing, for ages 2–6.",
      bullets: [
        "Designed the entire interaction model around players who cannot read and have imprecise touch input — every affordance is visual and forgiving.",
        "Built dressing, feeding, bath, bedtime, party and playground scenes on a shared activity framework.",
      ],
      tags:  ["Cocos Creator", "TypeScript", "Toddler UX", "Accessibility"],
      links: [{ label: "GOOGLE PLAY", url: "https://play.google.com/store/apps/details?id=com.fabulousfun.littlegiraffemypetfriend" }],
      note:  "Published by Fabulous Fun. Built as in-house work-for-hire, so the source isn't publicly shareable.",
      art: ["#ffd93d", "#ff9f3d"],
    },
  ],

  /* ── 6. EXPERIENCE / EDUCATION ─────────────────────────────────── */
  experience: [
    {
      title: "Game Developer",
      org:   "Mfinity Infotech · Ahmedabad, Gujarat",
      when:  "Jan 2025 — Present",
      bullets: [
        "Developed and shipped multiple mobile games using Cocos Creator and Unity for Android.",
        "Designed and implemented gameplay systems, UI flows, animations, progression mechanics and save systems in TypeScript and C#.",
        "Built data-driven game architectures using JSON-based configuration for dynamic level loading and content management.",
        "Worked with Spine animations, particle systems, tween animations, materials, textures and shader effects to raise visual quality.",
        "Developed physics-based gameplay including vehicle movement, collision handling, suspension systems and terrain generation for a Hill Climb Racing-style prototype.",
      ],
    },
  ],

  education: [
    {
      title: "B.Tech, Computer Science",
      org:   "Ahmedabad Institute of Technology · Ahmedabad, Gujarat",
      when:  "July 2021 — May 2025",
      bullets: [
        "Coursework: Data Structures, Algorithms, Database Management Systems, Computer Systems.",
        "CGPA: 7.5 / 10",
      ],
    },
  ],

  /* ── 7. BOOT SEQUENCE FLAVOUR TEXT ─────────────────────────────── */
  bootLines: [
    "initialising render pipeline .............. <b>OK</b>",
    "loading tileset  'hub_neon.atlas' ......... <b>OK</b>",
    "compiling shaders (crt, bloom, glow) ...... <b>OK</b>",
    "mounting 11 cabinets in arcade hall ....... <b>OK</b>",
    "spawning player 'dipender' ................ <b>OK</b>",
    "audio subsystem ........................... <i>MUTED</i>",
    "world ready.",
  ],
};

/* ── 8. ZONE NAMES ─────────────────────────────────────────────── */
PF.ZONES = [
  { id:"playable", name:"THE PLAYTEST LAB", sub:"Play my games", colour:"#ff6b35" },
  { id:"projects", name:"THE ARCADE",       sub:"Shipped titles", colour:"#00e5ff" },
  { id:"skills",   name:"THE FORGE",        sub:"Skills",        colour:"#ff2e97" },
  { id:"about",    name:"THE ARCHIVE",      sub:"About me",      colour:"#ffcf3d" },
  { id:"contact",  name:"THE UPLINK",       sub:"Contact",       colour:"#4dff9e" },
  { id:"resume",   name:"THE PEDESTAL",     sub:"Resume",        colour:"#b14aff" },
];
