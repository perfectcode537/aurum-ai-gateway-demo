/* Aurum demo - motion and interactions */
(() => {
  const html = document.documentElement;
  html.classList.add("js");
  document.body.classList.add("is-loading");

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isDesktop = () => matchMedia("(min-width: 901px)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGsap = typeof gsap !== "undefined";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  if (!hasGsap) {
    // libraries failed to load: show everything statically
    html.classList.remove("js");
    document.body.classList.remove("is-loading");
    $(".loader")?.remove();
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (!reduce && typeof Lenis !== "undefined") {
    lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  const scrollTo = target => {
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4 });
    else $(target)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  };
  $$('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
    const id = a.getAttribute("href");
    if (id.length < 2 || !$(id)) return;
    e.preventDefault();
    closeMenu();
    scrollTo(id === "#top" ? 0 : id);
  }));

  /* ---------- split text into words ---------- */
  const splitWords = (el, cls = "w") => {
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const w = document.createElement("span");
            w.className = cls;
            if (cls === "w") { const i = document.createElement("span"); i.textContent = part; w.appendChild(i); }
            else w.textContent = part;
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== "BR") walk(n);
      });
    };
    walk(el);
  };
  $$(".split").forEach(el => splitWords(el));
  const manifesto = $("#manifesto");
  splitWords(manifesto, "mw");

  /* ---------- preloader + intro ---------- */
  const heroVideo = $(".hero__video");
  const num = $("#loadNum");
  const counter = { v: 0 };
  const intro = gsap.timeline({ paused: true });
  intro
    .to(".loader__inner", { y: -30, opacity: 0, duration: .6, ease: "power3.in" })
    .to(".loader", { clipPath: "inset(0 0 100% 0)", duration: 1.1, ease: "expo.inOut" }, "-=.15")
    .from(".hero__video", { scale: 1.35, duration: 2.4, ease: "expo.out" }, "-=.8")
    .to(".hero__title .line>span", { y: 0, duration: 1.3, stagger: .12, ease: "expo.out" }, "-=2")
    .to(".hero .reveal-up", { opacity: 1, y: 0, duration: 1.1, stagger: .08, ease: "expo.out" }, "-=1.1")
    .from(".nav", { y: -30, opacity: 0, duration: 1, ease: "expo.out" }, "-=1.2")
    .add(() => {
      $(".loader")?.remove();
      document.body.classList.remove("is-loading");
      lenis?.start();
    }, "-=1");

  const finishLoad = () => {
    gsap.to(counter, {
      v: 100, duration: reduce ? .01 : 1.1, ease: "power2.inOut",
      onUpdate: () => { num.textContent = Math.round(counter.v); },
      onComplete: () => intro.play()
    });
    gsap.to(".loader__bar i", { scaleX: 1, duration: reduce ? .01 : 1.1, ease: "power2.inOut" });
  };
  let started = false;
  const go = () => { if (!started) { started = true; finishLoad(); } };
  if (heroVideo.readyState >= 3) go();
  heroVideo.addEventListener("canplay", go, { once: true });
  setTimeout(go, 1800); // never wait long for the video
  gsap.to(counter, { v: 60, duration: 1.2, ease: "power1.out", onUpdate: () => { if (!started) num.textContent = Math.round(counter.v); } });

  /* ---------- nav behaviour ---------- */
  const burger = $("#burger"), menu = $("#menu");
  const gl = { progress: 0 };
  const nav = $("#nav");
  let lastY = 0;
  ScrollTrigger.create({
    start: 0, end: "max",
    onUpdate: self => {
      const y = self.scroll();
      nav.classList.toggle("is-scrolled", y > 40);
      nav.classList.toggle("is-hidden", y > 400 && y > lastY && !menu.classList.contains("is-open"));
      lastY = y;
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
    const open = !menu.classList.contains("is-open");
    if (!open) return closeMenu();
    menu.classList.add("is-open");
    burger.setAttribute("aria-expanded", "true");
    menu.setAttribute("aria-hidden", "false");
    lenis?.stop();
    gsap.fromTo("#menu nav a", { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: .9, stagger: .06, ease: "expo.out", delay: .2 });
  });

  /* ---------- hero scroll: video shrinks into a framed card ---------- */
  if (!reduce) {
    gsap.to("#heroMedia", {
      clipPath: "inset(6% 4% 6% 4% round 28px)", ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
    });
    gsap.to(".hero__content", { yPercent: -18, opacity: .2, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  }

  /* ---------- generic reveals ---------- */
  $$(".reveal-up").filter(el => !el.closest(".hero")).forEach(el => {
    gsap.to(el, { opacity: 1, y: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%" } });
  });
  $$(".split").forEach(el => {
    gsap.from($$(".w>span", el), {
      yPercent: 110, rotate: 4, duration: 1.2, stagger: .05, ease: "expo.out",
      scrollTrigger: { trigger: el, start: "top 85%" }
    });
  });

  /* ---------- parallax ---------- */
  $$(".parallax").forEach(el => {
    const s = parseFloat(el.dataset.speed || 0);
    gsap.fromTo(el, { yPercent: -s * 100 }, { yPercent: s * 100, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
    const img = $("img", el);
    if (img && el.classList.contains("frame")) gsap.to(img, { scale: 1, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
  });

  /* ---------- manifesto word light-up ---------- */
  gsap.to($$(".mw", manifesto), {
    color: "#f3eee4", stagger: .1, ease: "none",
    scrollTrigger: { trigger: manifesto, start: "top 78%", end: "bottom 45%", scrub: true }
  });

  /* ---------- counters ---------- */
  const fmt = (v, sep) => sep ? Math.round(v).toLocaleString("en-GB") : Math.round(v);
  $$("[data-count]").forEach(el => {
    const end = +el.dataset.count, sep = el.hasAttribute("data-sep"), o = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: "top 90%", once: true,
      onEnter: () => gsap.to(o, { v: end, duration: 2, ease: "expo.out", onUpdate: () => { el.textContent = fmt(o.v, sep); } })
    });
  });

  /* ---------- marquee driven by scroll velocity ---------- */
  const mq = $("#marquee");
  let mx = 0, mdir = 1, mspeed = 0;
  gsap.ticker.add((t, dt) => {
    const w = mq.scrollWidth / 2;
    mx -= (0.6 + mspeed) * mdir * (dt / 16);
    mspeed *= 0.94;
    if (mx <= -w) mx += w;
    if (mx > 0) mx -= w;
    mq.style.transform = `translate3d(${mx}px,0,0)`;
  });
  ScrollTrigger.create({ start: 0, end: "max", onUpdate: s => { mdir = s.direction; mspeed = Math.min(Math.abs(s.getVelocity()) / 300, 14); } });

  /* ---------- platform: pinned horizontal track ---------- */
  const track = $("#track");
  let platformST = null;
  const mm = gsap.matchMedia();
  mm.add("(min-width: 901px)", () => {
    const dist = () => track.scrollWidth - innerWidth;
    const tw = gsap.to(track, {
      x: () => -dist(), ease: "none",
      scrollTrigger: {
        trigger: "#pin", start: "top top", end: () => "+=" + dist(), pin: true, scrub: 1, invalidateOnRefresh: true,
        onUpdate: s => { gl.progress = s.progress; gsap.set("#progressBar", { scaleX: s.progress }); }
      }
    });
    platformST = tw.scrollTrigger;
    return () => { platformST = null; };
  });
  mm.add("(max-width: 900px)", () => {
    $$(".step").forEach(st => gsap.from(st, { y: 60, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: st, start: "top 90%" } }));
    ScrollTrigger.create({ trigger: ".platform", start: "top bottom", end: "bottom top", onUpdate: s => { gl.progress = s.progress; } });
  });

  /* ---------- three.js: requests flowing through a golden gateway ---------- */
  (function initGL() {
    const canvas = $("#gl");
    if (typeof THREE === "undefined" || !canvas) return;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" }); }
    catch (e) { return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(42, 1, .1, 100);
    cam.position.set(0, 0, 14);

    const gold = new THREE.Color("#d4b46a"), warm = new THREE.Color("#f0dca6"), raw = new THREE.Color("#e2836f"), dim = new THREE.Color("#6d675c");

    // the gateway ring
    const ringGroup = new THREE.Group();
    scene.add(ringGroup);
    const torus = new THREE.Mesh(new THREE.TorusGeometry(3, .045, 24, 220), new THREE.MeshBasicMaterial({ color: gold, transparent: true, opacity: .95 }));
    ringGroup.add(torus);
    const torus2 = new THREE.Mesh(new THREE.TorusGeometry(3.45, .012, 12, 220), new THREE.MeshBasicMaterial({ color: warm, transparent: true, opacity: .35 }));
    ringGroup.add(torus2);
    const halo = new THREE.Mesh(new THREE.TorusGeometry(3, .55, 16, 120), new THREE.MeshBasicMaterial({ color: gold, transparent: true, opacity: .05 }));
    ringGroup.add(halo);
    ringGroup.rotation.y = .9;

    // particle stream
    const N = isDesktop() ? 2600 : 1100;
    const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), seed = new Float32Array(N * 4);
    for (let i = 0; i < N; i++) {
      seed[i * 4] = Math.random() * 30 - 15;             // x along the stream
      seed[i * 4 + 1] = Math.random() * Math.PI * 2;     // angle
      seed[i * 4 + 2] = Math.pow(Math.random(), .7);     // radius factor
      seed[i * 4 + 3] = .4 + Math.random() * 1.2;        // speed
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const dot = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d"); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(.35, "rgba(255,255,255,.6)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: .09, map: dot, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    scene.add(pts);
    const tmp = new THREE.Color();

    let w = 0, h = 0, visible = false, mouseX = 0, mouseY = 0;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      if (r.width === w && r.height === h) return;
      w = r.width; h = r.height;
      renderer.setSize(w, h, false);
      cam.aspect = w / h; cam.updateProjectionMatrix();
      cam.position.z = w < 700 ? 22 : 14;
    };
    new ResizeObserver(resize).observe(canvas);
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: "100px" }).observe(canvas);
    if (fine) addEventListener("pointermove", e => { mouseX = e.clientX / innerWidth - .5; mouseY = e.clientY / innerHeight - .5; });

    let time = 0;
    gsap.ticker.add((t, dt) => {
      if (!visible) return;
      resize();
      time += reduce ? 0 : dt / 1000;
      const p = gl.progress;
      for (let i = 0; i < N; i++) {
        let x = seed[i * 4] + time * seed[i * 4 + 3] * 1.6;
        x = ((x + 15) % 30 + 30) % 30 - 15;
        const a = seed[i * 4 + 1] + time * .3;
        // stream narrows through the ring, then opens out
        const squeeze = 1 - Math.exp(-(x * x) / 10) * .55;
        const rad = seed[i * 4 + 2] * 2.6 * squeeze;
        pos[i * 3] = x;
        pos[i * 3 + 1] = Math.sin(a) * rad;
        pos[i * 3 + 2] = Math.cos(a) * rad;
        // left of the ring: raw (some red "personal data"), right: clean gold
        if (x < 0) tmp.copy(i % 7 === 0 ? raw : dim).lerp(warm, Math.max(0, 1 + x / 3) * .6);
        else tmp.copy(gold).lerp(warm, Math.random() * .3);
        col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;
      // camera moves through the scene with scroll progress
      scene.rotation.y = -.55 + p * 1.1 + mouseX * .15;
      scene.rotation.x = .12 + mouseY * .1;
      ringGroup.rotation.z = time * .15;
      torus2.rotation.x = time * .4;
      halo.material.opacity = .04 + Math.sin(time * 2) * .02;
      renderer.render(scene, cam);
    });
  })();

  /* ---------- privacy console demo ---------- */
  const steps = [
    {
      inp: 'Summarise the referral for [Jane Whitmore], NHS [943 476 5919], who lives at [SW1A 1AA]. NI number [QQ 12 34 56 C].',
      mid: 'Summarise the referral for {PERSON_1}, NHS {NHS_1}, who lives at {POSTCODE_1}. NI number {NI_1}.',
      out: 'Referral summary for [Jane Whitmore] (NHS [943 476 5919]): routine follow-up advised, letter to [SW1A 1AA].'
    },
    {
      inp: 'Draft a reply to [Tom Hughes] at [tom.hughes@example.co.uk] about invoice 4471, delivery to [M1 4BT].',
      mid: 'Draft a reply to {PERSON_1} at {EMAIL_1} about invoice 4471, delivery to {POSTCODE_1}.',
      out: 'Dear [Tom Hughes], thank you for your message about invoice 4471. Delivery to [M1 4BT] is confirmed.'
    }
  ];
  const cIn = $("#cIn"), cMid = $("#cMid"), cOut = $("#cOut");
  const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const renderIn = s => esc(s).replace(/\[(.+?)\]/g, '<span class="pii">$1</span>');
  const renderMid = s => esc(s).replace(/\{(.+?)\}/g, "<mark>&lt;$1&gt;</mark>");
  const renderOut = s => esc(s).replace(/\[(.+?)\]/g, "<span class=\"pii\">$1</span>");
  const plain = s => s.replace(/[\[\]{}]/g, "");
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  async function type(el, raw, render, speed = 18) {
    const txt = plain(raw);
    for (let i = 0; i <= txt.length; i += 2) {
      el.innerHTML = esc(txt.slice(0, i)) + '<span class="caret"></span>';
      await sleep(speed);
    }
    el.innerHTML = render(raw);
  }
  let consoleRunning = false;
  async function runConsole() {
    if (consoleRunning) return;
    consoleRunning = true;
    let k = 0;
    while (true) {
      const s = steps[k % steps.length];
      cIn.innerHTML = cMid.innerHTML = cOut.innerHTML = "";
      if (reduce) { cIn.innerHTML = renderIn(s.inp); cMid.innerHTML = renderMid(s.mid); cOut.innerHTML = renderOut(s.out); return; }
      await type(cIn, s.inp, renderIn);
      await sleep(600);
      cMid.innerHTML = renderMid(s.mid);
      gsap.fromTo($$("mark", cMid), { opacity: 0, y: 6 }, { opacity: 1, y: 0, stagger: .12, duration: .5, ease: "expo.out" });
      await sleep(1300);
      await type(cOut, s.out, renderOut, 14);
      await sleep(4200);
      k++;
    }
  }
  ScrollTrigger.create({ trigger: ".console", start: "top 80%", once: true, onEnter: runConsole });

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
    let check = 11 - (sum % 11);
    let note;
    if (check === 11) { check = 0; note = "result 11 means check digit 0"; }
    if (check === 10) {
      badge.textContent = "Invalid"; badge.classList.add("is-bad");
      nhsOut.textContent = `Sum ${sum}, 11 - (${sum} mod 11) = 10. A result of 10 is never valid, so it is masked as a generic ID.`;
      return;
    }
    const ok = check === +d[9];
    badge.textContent = ok ? "Valid" : "Invalid";
    badge.classList.toggle("is-bad", !ok);
    nhsOut.textContent = `${parts.slice(0, 3).join(" + ")} ... = ${sum}. Check digit ${check}${note ? " (" + note + ")" : ""}, last digit ${d[9]}.`;
  }
  nhsIn.addEventListener("input", checkNhs);
  checkNhs();

  /* ---------- 3D tilt + glow on cards ---------- */
  if (fine && !reduce) {
    $$("[data-tilt]").forEach(card => {
      card.addEventListener("pointermove", e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", x * 100 + "%");
        card.style.setProperty("--my", y * 100 + "%");
        gsap.to(card, { rotateY: (x - .5) * 10, rotateX: (.5 - y) * 10, duration: .6, ease: "power3.out", transformPerspective: 1000 });
      });
      card.addEventListener("pointerleave", () => gsap.to(card, { rotateY: 0, rotateX: 0, duration: 1, ease: "elastic.out(1,.6)" }));
    });
  }
  $$(".card").forEach((c, i) => gsap.from(c, { y: 80, opacity: 0, duration: 1.3, ease: "expo.out", delay: (i % 2) * .1, scrollTrigger: { trigger: c, start: "top 92%" } }));

  /* ---------- magnetic buttons + cursor ---------- */
  if (fine && !reduce) {
    const cur = $(".cursor");
    const cx = gsap.quickTo(cur, "x", { duration: .35, ease: "power3.out" });
    const cy = gsap.quickTo(cur, "y", { duration: .35, ease: "power3.out" });
    addEventListener("pointermove", e => { cur.style.opacity = 1; cx(e.clientX); cy(e.clientY); });
    $$("a, button, [data-tilt], input, select").forEach(el => {
      el.addEventListener("pointerenter", () => cur.classList.add("is-hover"));
      el.addEventListener("pointerleave", () => cur.classList.remove("is-hover"));
    });
    $$("[data-magnetic]").forEach(b => {
      b.addEventListener("pointermove", e => {
        const r = b.getBoundingClientRect();
        gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * .25, y: (e.clientY - r.top - r.height / 2) * .35, duration: .5, ease: "power3.out" });
      });
      b.addEventListener("pointerleave", () => gsap.to(b, { x: 0, y: 0, duration: .9, ease: "elastic.out(1,.5)" }));
    });
  }

  /* ---------- film frame opens up ---------- */
  if (!reduce) {
    mm.add("(min-width: 601px)", () => {
      gsap.fromTo("#filmFrame", { clipPath: "inset(12% 8% 12% 8% round 28px)" }, {
        clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none",
        scrollTrigger: { trigger: "#filmFrame", start: "top 85%", end: "top top", scrub: true }
      });
    });
    gsap.from(".film__copy", { y: 80, opacity: 0, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: "#filmFrame", start: "top 30%" } });
  }

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
  const failList = $("#failList"), sw = $(".switch"), pill = $(".switch__pill");
  function setMode(m, animate = true) {
    $$(".switch button").forEach(b => { const on = b.dataset.mode === m; b.classList.toggle("is-on", on); b.setAttribute("aria-selected", on); });
    const on = $(".switch button.is-on");
    pill.style.width = on.offsetWidth + "px";
    pill.style.transform = `translateX(${on.offsetLeft - 5}px)`;
    failList.innerHTML = modes[m].map(([k, v, key]) => `<li class="${key ? "is-key" : ""}"><b>${k}</b><span>${v}</span></li>`).join("");
    if (animate) gsap.from($$("li", failList), { opacity: 0, x: 24, stagger: .06, duration: .7, ease: "expo.out" });
  }
  sw.addEventListener("click", e => { const b = e.target.closest("button"); if (b) setMode(b.dataset.mode); });
  setMode("closed", false);
  addEventListener("resize", () => setMode($(".switch button.is-on").dataset.mode, false));
  document.fonts?.ready.then(() => setMode($(".switch button.is-on").dataset.mode, false));

  /* ---------- savings chart ---------- */
  (function chart() {
    const days = 30, base = [], act = [];
    let b = 1300;
    for (let i = 0; i < days; i++) {
      b += Math.sin(i * .9) * 90 + (i % 7 === 5 || i % 7 === 6 ? -260 : 60);
      b = Math.max(900, Math.min(2100, b));
      base.push(b);
      act.push(b * (0.78 - Math.min(i, 20) * .011) + Math.cos(i * 1.3) * 40);
    }
    const max = 2300, X = i => i / (days - 1) * 600, Y = v => 240 - v / max * 220;
    const line = arr => arr.map((v, i) => (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(v).toFixed(1)).join(" ");
    const pb = $("#pBase"), pa = $("#pAct"), area = $("#pArea");
    pb.setAttribute("d", line(base));
    pa.setAttribute("d", line(act));
    area.setAttribute("d", line(act) + " L600 240 L0 240 Z");
    [pb, pa].forEach(p => { const L = p.getTotalLength(); p.style.strokeDasharray = p === pb ? "5 5" : L; if (p === pa) p.style.strokeDashoffset = L; });
    ScrollTrigger.create({
      trigger: ".dash", start: "top 75%", once: true,
      onEnter: () => {
        $(".dash").classList.add("is-in");
        gsap.from(pb, { opacity: 0, duration: 1 });
        gsap.to(pa, { strokeDashoffset: 0, duration: 2.2, ease: "power2.inOut" });
        gsap.to(area, { opacity: 1, duration: 1.2, delay: 1.4 });
      }
    });
  })();

  /* ---------- roadmap timeline ---------- */
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

  /* ---------- lazy videos (play only when visible) ---------- */
  const vio = new IntersectionObserver(entries => entries.forEach(e => {
    const v = e.target;
    if (e.isIntersecting) {
      const s = $("source[data-src]", v);
      if (s) { s.src = s.dataset.src; s.removeAttribute("data-src"); v.load(); }
      if (!reduce) v.play().catch(() => {});
    } else v.pause();
  }), { rootMargin: "200px" });
  $$("video[data-lazy]").forEach(v => vio.observe(v));
  new IntersectionObserver(([e]) => { e.isIntersecting ? heroVideo.play().catch(() => {}) : heroVideo.pause(); }).observe(heroVideo);

  /* ---------- form ---------- */
  const form = $("#form"), toast = $("#toast");
  const showToast = msg => { toast.textContent = msg; toast.classList.add("is-on"); clearTimeout(showToast.t); showToast.t = setTimeout(() => toast.classList.remove("is-on"), 3800); };
  form.addEventListener("submit", e => {
    e.preventDefault();
    let ok = true;
    $$(".field", form).forEach(f => {
      const el = $("input,select", f);
      const bad = !el.checkValidity();
      f.classList.toggle("is-err", bad);
      if (bad) ok = false;
    });
    if (!ok) { showToast("Please fill in every field."); return; }
    showToast("Thank you. This is a demo, so nothing was sent.");
    form.reset();
  });

  /* ---------- refresh after images/fonts settle ---------- */
  addEventListener("load", () => ScrollTrigger.refresh());
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
})();
