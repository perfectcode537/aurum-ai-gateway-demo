/* Aurum demo - a film in eight chapters */
(() => {
  const html = document.documentElement;
  html.classList.add("js");
  document.body.classList.add("is-loading");

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const desktop = () => matchMedia("(min-width: 901px)").matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  if (typeof gsap === "undefined") {
    // libraries failed to load: show the static page
    html.classList.remove("js");
    document.body.classList.remove("is-loading");
    $(".leader")?.remove();
    $("#titleMask").style.display = "none";
    Object.assign($("#titleCopy").style, { opacity: 1, visibility: "visible" });
    $("#titleShade").style.opacity = 1;
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  const burger = $("#burger"), menu = $("#menu"), nav = $("#nav");
  const gl = { progress: 0 };

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (!reduce && typeof Lenis !== "undefined") {
    lenis = new Lenis({ duration: 1.2, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  const scrollTo = target => {
    if (lenis) lenis.scrollTo(target, { duration: 1.6 });
    else (target === 0 ? scrollTo0() : $(target)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }));
  };
  const scrollTo0 = () => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  $$('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
    const id = a.getAttribute("href");
    if (id.length < 2 || !$(id)) return;
    e.preventDefault();
    closeMenu();
    scrollTo(id === "#top" ? 0 : id);
  }));

  /* ---------- split text into words ---------- */
  const splitWords = (el, cls) => {
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) return frag.appendChild(document.createTextNode(part));
          const w = document.createElement("span");
          w.className = cls;
          if (cls === "w") { const i = document.createElement("span"); i.textContent = part; w.appendChild(i); }
          else w.textContent = part;
          frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && !["BR", "IMG", "VIDEO"].includes(n.tagName) && !n.classList.contains("pill")) walk(n);
    });
    walk(el);
  };
  $$(".split").forEach(el => splitWords(el, "w"));
  const manifesto = $("#manifesto");
  splitWords(manifesto, "mw");

  /* ---------- film leader countdown, then the title card ---------- */
  const titleVideo = $(".title__video");
  const leaderNum = $("#leaderNum"), sweep = $(".leader__sweep");
  const intro = gsap.timeline({ paused: true });
  intro
    .to(".leader", { opacity: 0, duration: .5, ease: "power2.in" })
    .from(".title__word", { scale: 1.25, opacity: 0, duration: 2.2, ease: "expo.out" }, "-=.1")
    .from(".title__over, .title__under", { y: 20, opacity: 0, duration: 1.2, stagger: .15, ease: "expo.out" }, "-=1.6")
    .from(".nav", { y: -30, opacity: 0, duration: 1.1, ease: "expo.out" }, "-=1.4")
    .add(() => {
      $(".leader")?.remove();
      document.body.classList.remove("is-loading");
      lenis?.start();
      $(".hud").classList.add("is-on");
    }, "-=1.2");

  function countdown() {
    if (reduce) return intro.progress(1);
    const tl = gsap.timeline({ onComplete: () => intro.play() });
    [3, 2, 1].forEach((n, i) => {
      tl.call(() => { leaderNum.textContent = n; }, null, i * .5)
        .fromTo(sweep, { "--a": "0deg" }, { "--a": "360deg", duration: .5, ease: "none" }, i * .5)
        .fromTo(leaderNum, { scale: 1.15, opacity: .4 }, { scale: 1, opacity: 1, duration: .3, ease: "power2.out" }, i * .5);
    });
  }
  let started = false;
  const go = () => { if (!started) { started = true; countdown(); } };
  if (titleVideo.readyState >= 3) go();
  titleVideo.addEventListener("canplay", go, { once: true });
  setTimeout(go, 1500);

  /* ---------- title: letters open into the full film ---------- */
  const copyLines = $$(".title__head .line>span");
  const titleTl = gsap.timeline({
    scrollTrigger: { trigger: "#title", start: "top top", end: "+=130%", pin: true, scrub: 1, anticipatePin: 1 }
  });
  titleTl
    .to(".title__over, .title__under", { opacity: 0, y: -20, duration: .15 }, 0)
    .to("#titleMask", { scale: 9, duration: .6, ease: "power2.in" }, 0)
    .to("#titleMask", { opacity: 0, duration: .15 }, .45)
    .to(".title__video", { scale: 1.08, duration: .6 }, 0)
    .to("#titleShade", { opacity: 1, duration: .25 }, .5)
    .set("#titleCopy", { visibility: "visible" }, .55)
    .to("#titleCopy", { opacity: 1, duration: .1 }, .55)
    .to(copyLines, { y: 0, stagger: .05, duration: .3, ease: "power3.out" }, .58)
    .from(".title__row, .chips", { y: 40, opacity: 0, stagger: .05, duration: .25 }, .7);

  /* ---------- desktop-only pinned scenes ---------- */
  const mm = gsap.matchMedia();
  const steps = $$(".step"), idx = $$(".steps-index span");

  mm.add("(min-width: 901px)", () => {
    // CH02: coverflow track over the 3D scene
    const track = $("#track");
    const dist = () => track.scrollWidth - innerWidth;
    const cover = () => {
      const mid = innerWidth / 2;
      steps.forEach(st => {
        const r = st.getBoundingClientRect();
        const d = Math.max(-1.4, Math.min(1.4, (r.left + r.width / 2 - mid) / (innerWidth * .5)));
        gsap.set(st, { rotateY: d * -38, z: -Math.abs(d) * 260, opacity: 1 - Math.abs(d) * .35, transformPerspective: 1400 });
      });
    };
    gsap.to(track, {
      x: () => -dist(), ease: "none",
      scrollTrigger: {
        trigger: "#pin", start: "top top", end: () => "+=" + dist() * 1.15, pin: true, scrub: 1, invalidateOnRefresh: true,
        onUpdate: s => {
          gl.progress = s.progress;
          gsap.set("#progressBar", { scaleX: s.progress });
          const a = Math.round(s.progress * (idx.length - 1));
          idx.forEach((el, i) => el.classList.toggle("is-on", i === a));
          cover();
        },
        onRefresh: cover
      }
    });
    cover();

    // CH04: rotating cylinder of feature cards
    const cyl = $("#cyl"), cards = $$(".card", cyl), n = cards.length;
    const place = () => {
      const w = cyl.offsetWidth, R = Math.round((w / 2) / Math.tan(Math.PI / n) + 40);
      cards.forEach((c, i) => { c.style.transform = `rotateY(${i * 360 / n}deg) translateZ(${R}px)`; });
    };
    place();
    addEventListener("resize", place);
    const spin = gsap.fromTo(cyl, { rotateY: 18, rotateX: -6 }, {
      rotateY: -360 + 360 / n, rotateX: -6, ease: "none",
      scrollTrigger: { trigger: "#featPin", start: "top top", end: "+=260%", pin: true, scrub: 1.2 }
    });

    // CH05: horizontal film reel
    const reel = $("#reel");
    const rdist = () => reel.scrollWidth - innerWidth;
    const reelTween = gsap.to(reel, {
      x: () => -rdist(), ease: "none",
      scrollTrigger: { trigger: "#cinemaPin", start: "top top", end: () => "+=" + rdist(), pin: true, scrub: 1, invalidateOnRefresh: true }
    });
    $$(".shot", reel).forEach(sh => {
      const m = $("img, video", sh);
      gsap.fromTo(m, { xPercent: -8 }, { xPercent: 8, ease: "none", scrollTrigger: { trigger: sh, containerAnimation: reelTween, start: "left right", end: "right left", scrub: true } });
    });

    return () => {
      removeEventListener("resize", place);
      [...steps, ...cards].forEach(el => el.removeAttribute("style"));
      spin.kill();
    };
  });

  mm.add("(max-width: 900px)", () => {
    steps.forEach(st => gsap.from(st, { y: 60, opacity: 0, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: st, start: "top 92%" } }));
    ScrollTrigger.create({ trigger: ".platform", start: "top bottom", end: "bottom top", onUpdate: s => { gl.progress = s.progress; } });
  });

  /* ---------- nav + HUD ---------- */
  let lastY = 0;
  const tc = $("#tc");
  const FILM_SECONDS = 150, FPS = 24;
  const pad = n => String(n).padStart(2, "0");
  ScrollTrigger.create({
    start: 0, end: "max",
    onUpdate: self => {
      const y = self.scroll();
      nav.classList.toggle("is-scrolled", y > 40);
      nav.classList.toggle("is-hidden", y > 500 && y > lastY && !menu.classList.contains("is-open"));
      lastY = y;
      const f = Math.floor(self.progress * FILM_SECONDS * FPS);
      tc.textContent = `00:${pad(Math.floor(f / FPS / 60))}:${pad(Math.floor(f / FPS) % 60)}:${pad(f % FPS)}`;
    }
  });
  const chapNum = $("#chapNum"), chapName = $("#chapName");
  const chapters = $$("[data-chapter]").map(sec => ({ sec, data: sec.dataset.chapter.split("|") }));
  let lastChap = "";
  const updateChapter = () => {
    const line = innerHeight * .55;
    let cur = chapters[0];
    chapters.forEach(c => { if (c.sec.getBoundingClientRect().top <= line) cur = c; });
    if (cur.data[0] === lastChap) return;
    lastChap = cur.data[0];
    chapNum.textContent = "CH " + cur.data[0];
    chapName.textContent = cur.data[1];
  };
  ScrollTrigger.create({ start: 0, end: "max", onUpdate: updateChapter });
  $$("[data-chapter]").forEach(sec => {
    if (sec.hasAttribute("data-letterbox")) {
      ScrollTrigger.create({
        trigger: sec, start: "top top", end: "bottom bottom",
        onToggle: s => document.body.classList.toggle("is-letterbox", s.isActive && desktop())
      });
    }
  });

  /* ---------- mobile menu ---------- */
  function closeMenu() {
    if (!menu.classList.contains("is-open")) return;
    menu.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    menu.setAttribute("aria-hidden", "true");
    lenis?.start();
  }
  burger.addEventListener("click", () => {
    if (menu.classList.contains("is-open")) return closeMenu();
    menu.classList.add("is-open");
    burger.setAttribute("aria-expanded", "true");
    menu.setAttribute("aria-hidden", "false");
    lenis?.stop();
    gsap.fromTo("#menu nav a", { y: 70, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: .05, ease: "expo.out", delay: .25 });
  });

  /* ---------- generic reveals ---------- */
  $$(".reveal-up").forEach(el => {
    gsap.to(el, { opacity: 1, y: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 90%" } });
  });
  $$(".split").filter(el => !el.closest("#title")).forEach(el => {
    gsap.from($$(".w>span", el), {
      yPercent: 115, rotate: 5, duration: 1.3, stagger: .045, ease: "expo.out",
      scrollTrigger: { trigger: el, start: "top 86%" }
    });
  });

  /* ---------- parallax + image settle ---------- */
  $$(".parallax").forEach(el => {
    const s = parseFloat(el.dataset.speed || 0);
    gsap.fromTo(el, { yPercent: -s * 100 }, { yPercent: s * 100, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
    const media = $("img, video", el);
    if (media && el.classList.contains("frame")) gsap.to(media, { scale: 1, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
  });
  // frames open like a shutter
  $$(".collage .frame").forEach(f => gsap.from(f, { clipPath: "inset(100% 0 0 0 round 18px)", duration: 1.6, ease: "expo.inOut", scrollTrigger: { trigger: f, start: "top 88%" } }));

  /* ---------- manifesto words + pills ---------- */
  gsap.to($$(".mw", manifesto), {
    color: "#ece8e1", stagger: .1, ease: "none",
    scrollTrigger: { trigger: manifesto, start: "top 80%", end: "bottom 50%", scrub: true }
  });
  $$(".pill", manifesto).forEach(p => gsap.from(p, { width: 0, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: p, start: "top 85%" } }));

  /* ---------- counters ---------- */
  $$("[data-count]").forEach(el => {
    const end = +el.dataset.count, sep = el.hasAttribute("data-sep"), o = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: "top 92%", once: true,
      onEnter: () => gsap.to(o, { v: end, duration: 2, ease: "expo.out", onUpdate: () => { el.textContent = sep ? Math.round(o.v).toLocaleString("en-GB") : Math.round(o.v); } })
    });
  });

  /* ---------- marquees, pushed by scroll velocity ---------- */
  const lines = $$(".marquee__line").map(l => {
    const track = $(".marquee__track", l), row = $(".marquee__row", track);
    track.appendChild(row.cloneNode(true)).setAttribute("aria-hidden", "true");
    return { track, dir: +l.dataset.dir, x: 0 };
  });
  let boost = 0, scrollDir = 1;
  ScrollTrigger.create({ start: 0, end: "max", onUpdate: s => { scrollDir = s.direction; boost = Math.min(Math.abs(s.getVelocity()) / 260, 16); } });
  gsap.ticker.add((t, dt) => {
    const k = dt / 16;
    boost *= .93;
    lines.forEach(l => {
      const w = l.track.scrollWidth / 2;
      if (!w) return;
      l.x -= (.55 + boost) * l.dir * scrollDir * k;
      if (l.x <= -w) l.x += w;
      if (l.x > 0) l.x -= w;
      l.track.style.transform = `translate3d(${l.x}px,0,0)`;
    });
  });

  /* ---------- three.js: requests flow through a golden gateway ---------- */
  (function initGL() {
    const canvas = $("#gl");
    if (typeof THREE === "undefined" || !canvas) return;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" }); }
    catch (e) { return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070707, .045);
    const cam = new THREE.PerspectiveCamera(40, 1, .1, 100);

    const gold = new THREE.Color("#c9ad7a"), warm = new THREE.Color("#e8d8b4"), raw = new THREE.Color("#d0705c"), dim = new THREE.Color("#5f5a52");
    const world = new THREE.Group();
    scene.add(world);

    // gateway: torus rings + a slowly turning icosahedron core
    const ring = new THREE.Group();
    world.add(ring);
    const mat = (c, o) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o });
    const t1 = new THREE.Mesh(new THREE.TorusGeometry(3, .04, 24, 240), mat(gold, .95));
    const t2 = new THREE.Mesh(new THREE.TorusGeometry(3.5, .01, 12, 240), mat(warm, .35));
    const t3 = new THREE.Mesh(new THREE.TorusGeometry(3, .6, 16, 120), mat(gold, .04));
    ring.add(t1, t2, t3);
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.05, 1), new THREE.MeshBasicMaterial({ color: gold, wireframe: true, transparent: true, opacity: .28 }));
    ring.add(core);
    ring.rotation.y = Math.PI / 2;

    // tenant lanes: thin parallel lines
    const laneGeo = new THREE.BufferGeometry();
    const lanePts = [];
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; lanePts.push(-16, Math.sin(a) * 4.6, Math.cos(a) * 4.6, 16, Math.sin(a) * 4.6, Math.cos(a) * 4.6); }
    laneGeo.setAttribute("position", new THREE.Float32BufferAttribute(lanePts, 3));
    world.add(new THREE.LineSegments(laneGeo, new THREE.LineBasicMaterial({ color: gold, transparent: true, opacity: .12 })));

    // particle stream
    const N = desktop() ? 2800 : 1100;
    const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), seed = new Float32Array(N * 4);
    for (let i = 0; i < N; i++) {
      seed[i * 4] = Math.random() * 32 - 16;
      seed[i * 4 + 1] = Math.random() * Math.PI * 2;
      seed[i * 4 + 2] = Math.pow(Math.random(), .7);
      seed[i * 4 + 3] = .4 + Math.random() * 1.2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const dot = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d"); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(.35, "rgba(255,255,255,.55)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
    world.add(new THREE.Points(geo, new THREE.PointsMaterial({ size: .09, map: dot, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })));
    const tmp = new THREE.Color();

    let w = 0, h = 0, visible = false, mx = 0, my = 0;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      if (r.width === w && r.height === h) return;
      w = r.width; h = r.height;
      renderer.setSize(w, h, false);
      cam.aspect = w / h; cam.updateProjectionMatrix();
    };
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: "100px" }).observe(canvas);
    if (fine) addEventListener("pointermove", e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });

    let time = 0;
    gsap.ticker.add((t, dt) => {
      if (!visible) return;
      resize();
      time += reduce ? 0 : dt / 1000;
      const p = gl.progress;
      for (let i = 0; i < N; i++) {
        let x = seed[i * 4] + time * seed[i * 4 + 3] * 1.7;
        x = ((x + 16) % 32 + 32) % 32 - 16;
        const a = seed[i * 4 + 1] + time * .3;
        const squeeze = 1 - Math.exp(-(x * x) / 9) * .6;
        const rad = seed[i * 4 + 2] * 2.7 * squeeze;
        pos[i * 3] = x; pos[i * 3 + 1] = Math.sin(a) * rad; pos[i * 3 + 2] = Math.cos(a) * rad;
        if (x < 0) tmp.copy(i % 7 === 0 ? raw : dim).lerp(warm, Math.max(0, 1 + x / 3) * .6);
        else tmp.copy(gold).lerp(warm, ((i * 13) % 10) / 30);
        col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;
      // camera dollies along the stream and swings around the gateway
      const ang = -.9 + p * 1.8 + mx * .2;
      const dist = w < 700 ? 20 : 13;
      cam.position.set(Math.sin(ang) * dist * .55, 1.4 - my * 1.2 + Math.sin(p * Math.PI) * 1.2, Math.cos(ang) * dist);
      cam.lookAt(0, 0, 0);
      ring.rotation.x = time * .12;
      core.rotation.y = time * .35; core.rotation.x = time * .2;
      t2.rotation.y = time * .5;
      t3.material.opacity = .035 + Math.sin(time * 2) * .015;
      renderer.render(scene, cam);
    });
  })();

  /* ---------- privacy: big word drift + console tilt ---------- */
  gsap.fromTo("#bigword", { xPercent: 0 }, { xPercent: -30, ease: "none", scrollTrigger: { trigger: ".privacy", start: "top bottom", end: "bottom top", scrub: true } });
  gsap.from("#console", { rotateX: 18, rotateY: -14, y: 80, opacity: 0, transformPerspective: 1200, duration: 1.6, ease: "expo.out", scrollTrigger: { trigger: "#console", start: "top 85%" } });

  /* ---------- masking console demo ---------- */
  const demos = [
    {
      inp: "Summarise the referral for [Jane Whitmore], NHS [943 476 5919], who lives at [SW1A 1AA]. NI number [AB 12 34 56 C].",
      mid: "Summarise the referral for {PERSON_1}, NHS {NHS_1}, who lives at {POSTCODE_1}. NI number {NI_1}.",
      out: "Referral summary for [Jane Whitmore] (NHS [943 476 5919]): routine follow-up advised, letter to [SW1A 1AA]."
    },
    {
      inp: "Draft a reply to [Tom Hughes] at [tom.hughes@example.co.uk] about invoice 4471, delivery to [M1 4BT].",
      mid: "Draft a reply to {PERSON_1} at {EMAIL_1} about invoice 4471, delivery to {POSTCODE_1}.",
      out: "Dear [Tom Hughes], thank you for your message about invoice 4471. Delivery to [M1 4BT] is confirmed."
    }
  ];
  const cIn = $("#cIn"), cMid = $("#cMid"), cOut = $("#cOut");
  const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const piiHtml = s => esc(s).replace(/\[(.+?)\]/g, '<span class="pii">$1</span>');
  const maskHtml = s => esc(s).replace(/\{(.+?)\}/g, "<mark>&lt;$1&gt;</mark>");
  const plain = s => s.replace(/[\[\]{}]/g, "");
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  async function type(el, raw, speed = 18) {
    const txt = plain(raw);
    for (let i = 0; i <= txt.length; i += 2) { el.innerHTML = esc(txt.slice(0, i)) + '<span class="caret"></span>'; await sleep(speed); }
    el.innerHTML = piiHtml(raw);
  }
  async function runConsole() {
    for (let k = 0; ; k++) {
      const d = demos[k % demos.length];
      if (reduce) { cIn.innerHTML = piiHtml(d.inp); cMid.innerHTML = maskHtml(d.mid); cOut.innerHTML = piiHtml(d.out); return; }
      cIn.innerHTML = cMid.innerHTML = cOut.innerHTML = "";
      await type(cIn, d.inp);
      await sleep(600);
      cMid.innerHTML = maskHtml(d.mid);
      gsap.fromTo($$("mark", cMid), { opacity: 0, y: 6 }, { opacity: 1, y: 0, stagger: .12, duration: .5, ease: "expo.out" });
      await sleep(1300);
      await type(cOut, d.out, 14);
      await sleep(4200);
    }
  }
  ScrollTrigger.create({ trigger: "#console", start: "top 80%", once: true, onEnter: runConsole });

  /* ---------- NHS Modulus 11 checker ---------- */
  const nhsIn = $("#nhsIn"), nhsOut = $("#nhsOut"), badge = $("#nhsBadge");
  function checkNhs() {
    const d = nhsIn.value.replace(/\D/g, "");
    badge.classList.remove("is-bad");
    if (d.length !== 10) {
      badge.textContent = d.length ? "Too short" : "Enter number";
      badge.classList.toggle("is-bad", d.length > 0);
      nhsOut.textContent = "An NHS number has 10 digits.";
      return;
    }
    let sum = 0;
    const parts = [];
    for (let i = 0; i < 9; i++) { sum += +d[i] * (10 - i); parts.push(`${d[i]}x${10 - i}`); }
    let check = 11 - (sum % 11), note = "";
    if (check === 11) { check = 0; note = " (result 11 means check digit 0)"; }
    if (check === 10) {
      badge.textContent = "Invalid"; badge.classList.add("is-bad");
      nhsOut.textContent = `Sum ${sum}, 11 - (${sum} mod 11) = 10. A result of 10 is never valid, so it is masked as a generic ID.`;
      return;
    }
    const ok = check === +d[9];
    badge.textContent = ok ? "Valid" : "Invalid";
    badge.classList.toggle("is-bad", !ok);
    nhsOut.textContent = `${parts.slice(0, 3).join(" + ")} ... = ${sum}. Check digit ${check}${note}, last digit ${d[9]}.`;
  }
  nhsIn.addEventListener("input", checkNhs);
  checkNhs();

  /* ---------- fail-open / fail-closed switch ---------- */
  const modes = {
    closed: [
      ["Redis down", "Requests refused with a clear 503. Nothing reaches a provider."],
      ["Ledger down", "Requests refused until the ledger is back."],
      ["Masking fails", "Refused. Personal data is never sent.", true],
      ["One zone fails", "Traffic moves to the second London zone automatically."]
    ],
    open: [
      ["Redis down", "Cache skipped, budgets enforced from local counters, request still masked."],
      ["Ledger down", "Spend queued locally and replayed, so figures stay accurate."],
      ["Masking fails", "Still refused. Privacy is never relaxed, in any mode.", true],
      ["One zone fails", "Traffic moves to the second London zone automatically."]
    ]
  };
  const failList = $("#failList"), pill = $(".switch__pill");
  function setMode(m, animate = true) {
    $$(".switch button").forEach(b => { const on = b.dataset.mode === m; b.classList.toggle("is-on", on); b.setAttribute("aria-selected", on); });
    const on = $(".switch button.is-on");
    pill.style.width = on.offsetWidth + "px";
    pill.style.transform = `translateX(${on.offsetLeft - 5}px)`;
    failList.innerHTML = modes[m].map(([k, v, key]) => `<li class="${key ? "is-key" : ""}"><b>${k}</b><span>${v}</span></li>`).join("");
    if (animate) gsap.from($$("li", failList), { opacity: 0, x: 24, stagger: .06, duration: .7, ease: "expo.out" });
  }
  $(".switch").addEventListener("click", e => { const b = e.target.closest("button"); if (b) setMode(b.dataset.mode); });
  setMode("closed", false);
  const currentMode = () => $(".switch button.is-on").dataset.mode;
  addEventListener("resize", () => setMode(currentMode(), false));
  document.fonts?.ready.then(() => setMode(currentMode(), false));

  /* ---------- savings: dashboard tilts into place ---------- */
  gsap.fromTo("#dash", { rotateX: 38, scale: .86, y: 60, opacity: .3 }, {
    rotateX: 0, scale: 1, y: 0, opacity: 1, ease: "none",
    scrollTrigger: { trigger: ".dash-stage", start: "top 95%", end: "top 30%", scrub: 1 }
  });
  (function chart() {
    const days = 30, base = [], act = [];
    let b = 1300;
    for (let i = 0; i < days; i++) {
      b += Math.sin(i * .9) * 90 + (i % 7 === 5 || i % 7 === 6 ? -260 : 60);
      b = Math.max(900, Math.min(2100, b));
      base.push(b);
      act.push(b * (0.78 - Math.min(i, 20) * .011) + Math.cos(i * 1.3) * 40);
    }
    const X = i => i / (days - 1) * 600, Y = v => 240 - v / 2300 * 220;
    const line = arr => arr.map((v, i) => (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(v).toFixed(1)).join(" ");
    const pb = $("#pBase"), pa = $("#pAct"), area = $("#pArea");
    pb.setAttribute("d", line(base));
    pa.setAttribute("d", line(act));
    area.setAttribute("d", line(act) + " L600 240 L0 240 Z");
    const L = pa.getTotalLength();
    pa.style.strokeDasharray = L; pa.style.strokeDashoffset = L;
    ScrollTrigger.create({
      trigger: "#dash", start: "top 70%", once: true,
      onEnter: () => {
        $("#dash").classList.add("is-in");
        gsap.from(pb, { opacity: 0, duration: 1 });
        gsap.to(pa, { strokeDashoffset: 0, duration: 2.2, ease: "power2.inOut" });
        gsap.to(area, { opacity: 1, duration: 1.2, delay: 1.4 });
      }
    });
  })();
  $$(".person").forEach((p, i) => gsap.from(p, { y: 90, opacity: 0, duration: 1.4, delay: i * .08, ease: "expo.out", scrollTrigger: { trigger: p, start: "top 92%" } }));

  /* ---------- roadmap ---------- */
  const tl = $("#timeline"), items = $$("#timeline li");
  ScrollTrigger.create({
    trigger: tl, start: "top 75%", end: "bottom 45%", scrub: true,
    onUpdate: s => {
      const vertical = !matchMedia("(min-width: 1101px)").matches;
      gsap.set("#tlFill", vertical ? { scaleY: s.progress, scaleX: 1 } : { scaleX: s.progress, scaleY: 1 });
      items.forEach((li, i) => li.classList.toggle("is-on", s.progress >= i / (items.length - 1) - .02));
    }
  });
  gsap.from(items, { y: 50, opacity: 0, stagger: .1, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: tl, start: "top 85%" } });

  /* ---------- footer: the word fills with film ---------- */
  gsap.from(".foot__mask span", { yPercent: 40, scale: .9, opacity: 0, ease: "none", scrollTrigger: { trigger: ".foot", start: "top bottom", end: "top 40%", scrub: true } });
  gsap.from(".credits > div", { y: 30, opacity: 0, stagger: .08, duration: 1, ease: "expo.out", scrollTrigger: { trigger: ".credits", start: "top 95%" } });

  /* ---------- lazy videos: load near view, play only when visible ---------- */
  const vio = new IntersectionObserver(entries => entries.forEach(e => {
    const v = e.target;
    if (e.isIntersecting) {
      const s = $("source[data-src]", v);
      if (s) { s.src = s.dataset.src; s.removeAttribute("data-src"); v.load(); }
      if (!reduce) v.play().catch(() => {});
    } else v.pause();
  }), { rootMargin: "300px 300px" });
  $$("video[data-lazy]").forEach(v => vio.observe(v));
  new IntersectionObserver(([e]) => { e.isIntersecting ? titleVideo.play().catch(() => {}) : titleVideo.pause(); }).observe(titleVideo);

  /* ---------- cursor + magnetic buttons ---------- */
  if (fine && !reduce) {
    const cur = $(".cursor");
    const cx = gsap.quickTo(cur, "x", { duration: .35, ease: "power3.out" });
    const cy = gsap.quickTo(cur, "y", { duration: .35, ease: "power3.out" });
    addEventListener("pointermove", e => { cur.style.opacity = 1; cx(e.clientX); cy(e.clientY); });
    document.addEventListener("pointerover", e => cur.classList.toggle("is-hover", !!e.target.closest("a, button, .card, .step, input, select")));
    $$("[data-magnetic]").forEach(b => {
      b.addEventListener("pointermove", e => {
        const r = b.getBoundingClientRect();
        gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * .25, y: (e.clientY - r.top - r.height / 2) * .35, duration: .5, ease: "power3.out" });
      });
      b.addEventListener("pointerleave", () => gsap.to(b, { x: 0, y: 0, duration: .9, ease: "elastic.out(1,.5)" }));
    });
  }

  /* ---------- form ---------- */
  const form = $("#form"), toast = $("#toast");
  const showToast = msg => { toast.textContent = msg; toast.classList.add("is-on"); clearTimeout(showToast.t); showToast.t = setTimeout(() => toast.classList.remove("is-on"), 3800); };
  form.addEventListener("submit", e => {
    e.preventDefault();
    let ok = true;
    $$(".field", form).forEach(f => {
      const bad = !$("input,select", f).checkValidity();
      f.classList.toggle("is-err", bad);
      if (bad) ok = false;
    });
    if (!ok) return showToast("Please fill in every field.");
    showToast("Thank you. This is a demo, so nothing was sent.");
    form.reset();
  });

  addEventListener("load", () => ScrollTrigger.refresh());
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
})();
