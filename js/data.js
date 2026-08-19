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
    role:      "Game Developer — Unity & Cocos Creator",
    tagline:   "Mobile game developer with 10 titles live on Google Play across Unity and Cocos Creator — casual puzzle, physics racing, educational and simulation — reaching a combined 1M+ downloads.",
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
    { label: "LINKEDIN", url: "https://www.linkedin.com/in/dipender-chauhan-7311812aa/" },
    /* If you have a public Google Play developer page, add it here — I left
       it out rather than guess the URL and ship a 404 to a recruiter:
       { label: "GOOGLE PLAY", url: "https://play.google.com/store/apps/dev?id=..." },
       Same for GitHub, once you have public repos worth showing. */
  ],

  /* ── 3. CHARACTER SHEET ────────────────────────────────────────── */
  stats: [
    { k: "CLASS",     v: "Game Developer" },
    { k: "STUDIO",    v: "Mfinity Infotech" },
    { k: "ENGINES",   v: "Cocos Creator · Unity" },
    { k: "LANGUAGES", v: "TypeScript · C# · JavaScript" },
    { k: "SHIPPED",   v: "10 titles on Google Play" },
    { k: "REACH",     v: "1M+ combined downloads" },
    { k: "EDUCATION", v: "B.Tech CS, 2025" },
    { k: "BASE",      v: "Ahmedabad, Gujarat, IN" },
  ],

  about: [
    "I'm a mobile game developer at Mfinity Infotech in Ahmedabad. Ten titles I've worked on are live on Google Play across Unity and Cocos Creator — casual puzzle, physics racing, educational, hidden-object and simulation — reaching a combined 1M+ downloads.",
    "Day to day I build gameplay systems, UI flows, progression and save systems in TypeScript and C#. I lean on data-driven architecture — JSON-configured levels and content, so new scenes and levels can be added without touching gameplay code — and I've built the commercial layer too: IAP, ads SDK integration, level unlocking and save-data management.",
    "The work I enjoy most is the physics. For a Hill Climb Racing-style racer I wrote vehicle movement, acceleration and braking, suspension behaviour, collision detection, procedural terrain interaction and a camera-follow rig, then tuned the whole simulation to stay smooth on low-end Android hardware.",
    "I graduated B.Tech Computer Science from Ahmedabad Institute of Technology in 2025. I'm based in Ahmedabad and open to relocating.",
  ],

  /* ── 4. SKILL TREE ─────────────────────────────────────────────
     ⚠ THE NUMBERS BELOW ARE AN ESTIMATE FROM YOUR CV — REVIEW THEM.
     Only you know your true proficiency, and a recruiter will ask
     about anything sitting near the top of a bar.                   */
  skills: [
    { group: "ENGINES", note: "Shipped counts are from the ten live titles below.", items: [
      { name: "Cocos Creator", level: 90, note: "9 shipped titles" },
      { name: "Unity",         level: 65, note: "1 shipped title" },
    ]},
    { group: "LANGUAGES", items: [
      { name: "TypeScript", level: 88, note: "primary language for Cocos work" },
      { name: "JavaScript", level: 75 },
      { name: "C#",         level: 70, note: "Unity gameplay & UI" },
      { name: "HTML / CSS", level: 55 },
    ]},
    { group: "GAMEPLAY SYSTEMS", items: [
      { name: "Gameplay & UI flow systems",   level: 88 },
      { name: "Progression & save systems",   level: 85 },
      { name: "Data-driven JSON level config",level: 80 },
      { name: "2D physics — vehicles, collision, suspension, terrain", level: 78 },
      { name: "Puzzle logic & path validation", level: 75 },
      { name: "Hint & assist systems",        level: 72 },
    ]},
    { group: "ART & FEEL", items: [
      { name: "Particles & tween animation",  level: 75 },
      { name: "Spine animation",              level: 70 },
      { name: "Materials, textures, shader effects", level: 60 },
    ]},
    { group: "SHIPPING & TOOLS", items: [
      { name: "Git / GitHub",                 level: 85 },
      { name: "Ads SDK & IAP integration",    level: 80 },
      { name: "Low-end device optimisation",  level: 78 },
      { name: "Android Studio",               level: 70 },
      { name: "Jira",                         level: 65 },
    ]},
  ],

  /* ── 5. PROJECTS — one arcade cabinet each ─────────────────────
     Order matters: the first entry becomes the cabinet a player
     reaches first, so the strongest work leads.                     */
  projects: [
    {
      title:  "Jungle Road Turret Shooter",
      role:   "Solo developer · personal project",
      engine: "Unity 6 · C# · URP",
      pitch:  "A truck drives itself down an overgrown jungle highway while you man the rear-facing turret, shooting down the drones and buggies chasing you.",
      bullets: [
        "Every mesh, material and texture in the game is generated in code — there are no imported art assets.",
        "Built a deterministic, idempotent editor tool that rebuilds the whole scene from empty on each run: it creates the project layers, sets the collision matrix, configures lighting and fog, builds the post-processing volume and registers the scene in Build Settings.",
        "Unity 6 with URP and the new Input System; mouse aiming with left-click fire and an instant restart loop.",
        "Shipped as a WebGL build, Brotli-compressed and served with the Content-Encoding headers the player requires.",
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
      pitch:  "A single-line logic puzzle: draw one continuous path that passes through every numbered cell in ascending order and visits every open cell exactly once, without ever crossing itself.",
      bullets: [
        "Wrote a uniqueness solver and gated level generation behind it, so no puzzle ships unless it has exactly one verified solution.",
        "Built the procedural level generator, daily and endless modes, difficulty tiering, and local save/progress storage.",
        "Zero dependencies and no build step — plain ES modules, one webfont and a JSON level pack.",
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
      pitch:  "A one-tap hill-climb racer for young kids with unlockable animal-themed vehicles, physics-based jumps and multiple environment themes — forest, snow, desert and city.",
      bullets: [
        "Built a physics-based 2D vehicle game inspired by Hill Climb Racing: vehicle movement, acceleration, braking, suspension behaviour, collision detection and terrain interaction systems.",
        "Worked with physics materials, rigid bodies and colliders to get vehicle handling feeling right.",
        "Designed procedural terrain interactions and optimised the simulation to stay smooth on low-end devices.",
        "Added particle effects, animations and a camera-follow system to sharpen game feel.",
        "Integrated IAP, advertisement systems, save-data management and level unlocking to support monetisation.",
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
      pitch:  "100+ short, satisfying mini-games — ASMR sensory tasks, sorting, tidy-up and tricky logic puzzles — built as a stress-relief casual brain-teaser.",
      bullets: [
        "Developed the puzzle gameplay systems and interactive mechanics in Unity.",
        "Implemented UI systems, core game logic and performance optimisations.",
        "Handcrafted micro-levels with polished tap and drag interactions, haptic feedback and a calm minimalist visual style.",
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
      play:  { type: "embed", url: "games/emoji-connect/index.html",
               note: "Portrait game — best in a tall window or on a phone." },
      note:  "Built in my own time — the algorithm work here is the part I'd most like to talk through.",
      art: ["#ffcf3d", "#4dff9e"],
    },
    {
      title:  "Prince Princess Wedding Story",
      role:   "Game Developer · Mfinity Infotech",
      engine: "Cocos Creator · TypeScript",
      pitch:  "A large multi-stage wedding-planner and dress-up game following a story flow: proposal, castle repair, styling, then the ceremony.",
      bullets: [
        "The widest range of mini-game systems of any title I've worked on — DIY fashion and tailoring, pony care, hidden object, maze puzzle, archery and cake and jewellery crafting.",
        "Stitched every mini-game type into a single linear narrative flow with consistent progression and state handling.",
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
      pitch:  "A relaxation-focused ASMR skincare simulator with realistic tool interactions — foam cleansers, jelly and peel-off masks, pore-care wand and rollers.",
      bullets: [
        "Built two distinct modes: scripted 'Story Case' routines and a freeform 'Free Play Spa'.",
        "Implemented a scoring and progression system across Technique, Cleanliness and Calm, driving unlockable tools and cosmetic sets.",
      ],
      tags:  ["Cocos Creator", "TypeScript", "Simulation", "Progression systems"],
      links: [{ label: "GOOGLE PLAY", url: "https://play.google.com/store/apps/details?id=com.fabulousfungames.dreamglow.skincare.asmr" }],
      note:  "Published by Fabulous Fun. Built as in-house work-for-hire, so the source isn't publicly shareable.",
      art: ["#ff9ecb", "#c9a4ff"],
    },
    {
      title:  "Hexa Arrow Sort: Tap Puzzle",
      role:   "Game Developer · Mfinity Infotech",
      engine: "Cocos Creator · TypeScript",
      pitch:  "A 3D hexagon-tile logic puzzle where each tile can only move in the direction its arrow points.",
      bullets: [
        "Built the tile movement and collision logic, and the colour-sorting mechanics at the core of the puzzle.",
        "Designed progressively harder layered stack layouts, fully playable offline.",
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
      pitch:  "A hidden-object puzzle across 100+ hand-drawn scenes set at world landmarks, where players hunt down one hidden pigeon per level.",
      bullets: [
        "Implemented the hint system, progressive difficulty curve and multiple unlockable world themes.",
        "Handled 100+ hand-drawn scenes with asset loading kept light enough for low-end devices.",
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
      pitch:  "An educational preschool app for ages 2–5 covering phonics, number tracing and counting, shape and colour sorting, basic maths, jigsaws, colouring and time-telling.",
      bullets: [
        "Built a reward and toy-shop economy to keep young players returning.",
        "Implemented full voice-instruction support so the app works for children who can't read yet.",
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
      pitch:  "A virtual pet-care and dress-up title for kids with multiple mini-activity modules — bath and spa, room and kitchen cleanup, birthday decorating, colouring, makeover and a doctor rescue sequence.",
      bullets: [
        "Built on a modular level structure so new care scenes could be added independently of existing ones.",
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
      pitch:  "A drag-and-drop cooking simulator for young children spanning pizza, burgers, cakes, juices and desserts, built around factory-style step-by-step stages.",
      bullets: [
        "Built simple tap and drag interactions tuned for small hands, fully offline.",
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
      pitch:  "A gentle virtual pet-care game for toddlers aged 2–6 centred on a baby giraffe — dressing, party setup, feeding, bubble bath, bedtime and playground scenes.",
      bullets: [
        "Designed around big touch targets and no-reading-required controls for pre-literate players.",
        "Kept animation pacing calm and positive to suit the target age group.",
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
  { id:"projects", name:"THE ARCADE",  sub:"Projects",   colour:"#00e5ff" },
  { id:"skills",   name:"THE FORGE",   sub:"Skills",     colour:"#ff2e97" },
  { id:"about",    name:"THE ARCHIVE", sub:"About me",   colour:"#ffcf3d" },
  { id:"contact",  name:"THE UPLINK",  sub:"Contact",    colour:"#4dff9e" },
  { id:"resume",   name:"THE PEDESTAL",sub:"Resume",     colour:"#b14aff" },
];
