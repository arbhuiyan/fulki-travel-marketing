// "Neon" — changes and support. A tiled wall at night: neon signs buzz and flicker on one by one with the
// questions people have after booking (baggage, date changes, special requests), then the big orange answer,
// and the Fulki plane and name traced in neon tube with the phone number. Tilt Neon, glow, a wet-floor reflection.
const NE = { signs: [0.6, 1.8, 3.0], off: 4.3, big: 4.7, sub: 6.0, logo: 7.7, end: 8.9 };
const NE_COL = ["#ff4fd8", "#22e4ff", "#ffe14d"];

window.REEL = {
  name: "neon",
  langs: ["en", "it"],
  seconds: 13.5,
  end: NE.end,
  music: { style: "synth", bpm: 98, key: 9 },
  copy: {
    en: { signs: ["Baggage?", "Date change?", "Special requests?"], big: "We handle it.", sub: "even after ticketing", cta: "Call or WhatsApp" },
    it: { signs: ["Bagagli?", "Cambio data?", "Richieste speciali?"], big: "Ci pensiamo noi.", sub: "anche dopo l'emissione", cta: "Chiama o scrivi su WhatsApp" },
  },
  cues: [],

  build(stage, L) {
    addCSS(`
      #neScene { position: absolute; left: 0; top: 0; width: 1080px; height: 1560px; overflow: hidden;
        -webkit-box-reflect: below 0 linear-gradient(transparent 55%, rgba(255,255,255,.35)); }
      #neWall { position: absolute; inset: 0; background-color: #2a161a;
        background-image: linear-gradient(#0b0607 4px, transparent 4px), linear-gradient(90deg, #0b0607 4px, transparent 4px), linear-gradient(90deg, #0b0607 4px, transparent 4px);
        background-size: 120px 60px, 120px 120px, 120px 120px; background-position: 0 0, 0 0, 60px 60px; }
      #neShade { position: absolute; inset: 0; background: radial-gradient(70% 55% at 50% 45%, transparent 0, rgba(0,0,0,.75) 100%); }
      #neFloor { position: absolute; left: 0; right: 0; top: 1560px; bottom: 0; background: linear-gradient(rgba(8,8,12,.45), rgba(10,8,14,.95)); }
      #neFloor::after { content: ""; position: absolute; inset: 0; background: repeating-linear-gradient(90deg, rgba(255,255,255,.03) 0 3px, transparent 3px 40px); }
      .ne { position: absolute; font: 400 120px/1.1 "Tilt Neon", sans-serif; white-space: nowrap; }
      .ne-box { padding: 26px 46px; border: 7px solid currentColor; border-radius: 40px; }
      #neBig { left: 0; right: 0; top: 860px; text-align: center; font-size: 180px; }
      #neSub { left: 0; right: 0; top: 1110px; text-align: center; font-size: 84px; }
      #nePlane { position: absolute; left: 380px; top: 360px; width: 320px; height: 320px; overflow: visible; }
      #neName { left: 0; right: 0; top: 730px; text-align: center; font-size: 220px; letter-spacing: .08em; }
      #neTT { left: 0; right: 0; top: 990px; text-align: center; font-size: 54px; letter-spacing: .4em; padding-left: .4em; }
      #nePhone { left: 0; right: 0; top: 1170px; text-align: center; font-size: 96px; }
      #neCta { left: 0; right: 0; top: 1310px; text-align: center; font-size: 56px; }
      #neUrl { left: 0; right: 0; top: 1410px; text-align: center; font-size: 52px; }
    `);
    const scene = div("", stage); scene.id = "neScene";
    div("", scene).id = "neWall";
    div("", stage).id = "neFloor";
    this.signs = L.signs.map((txt, i) => {
      const e = div("ne ne-box", scene, txt);
      Object.assign(e.style, [{ left: "70px", top: "330px" }, { right: "60px", top: "680px" }, { left: "50px", top: "1030px" }][i]);
      e.style.fontSize = i === 2 ? "96px" : "120px";
      return { e, c: NE_COL[i], at: NE.signs[i], r: [-5, 4, -2][i] };
    });
    this.big = { e: div("ne", scene, `<span>${L.big}</span>`), c: "#ff7a1a", at: NE.big };
    this.big.e.id = "neBig";
    this.sub = { e: div("ne", scene, L.sub), c: "#ffffff", at: NE.sub };
    this.sub.e.id = "neSub";
    // the logo: the plane traced as a tube, the name, and the contacts
    const p = svg("svg", { id: "nePlane", viewBox: "0 0 24 24" }, scene);
    this.planeGlow = svg("path", { d: PLANE_PATH, fill: "none", stroke: "#ff7a1a", "stroke-width": .9, "stroke-linejoin": "round", pathLength: 1, "stroke-dasharray": 1, transform: "rotate(45 12 12)", style: "filter: blur(1.2px)" }, p);
    this.planeTube = svg("path", { d: PLANE_PATH, fill: "none", stroke: "#ffe6cf", "stroke-width": .35, "stroke-linejoin": "round", pathLength: 1, "stroke-dasharray": 1, transform: "rotate(45 12 12)" }, p);
    this.name = { e: div("ne", scene, "FULKI"), c: "#ff7a1a" }; this.name.e.id = "neName";
    this.tt = { e: div("ne", scene, "TRAVEL &amp; TOURS"), c: "#ffffff" }; this.tt.e.id = "neTT";
    this.phone = { e: div("ne", scene, PHONE), c: "#22e4ff" }; this.phone.e.id = "nePhone";
    this.cta = { e: div("ne", scene, `<span>${L.cta}</span>`), c: "#ff4fd8" }; this.cta.e.id = "neCta";
    this.url = { e: div("ne", scene, SITE), c: "#ffffff" }; this.url.e.id = "neUrl";
    div("", scene).id = "neShade";

    const cues = [];
    for (const s of this.signs) cues.push([s.at, "buzz", .7, s.r / 8], [s.at + .05, "impact", .35]);
    cues.push([NE.off, "click", .6], [NE.off + .15, "click", .5], [NE.off + .3, "click", .5]);
    cues.push([NE.big, "buzz", .9, 0], [NE.big + .1, "impact", .7], [NE.sub, "buzz", .5]);
    cues.push([NE.logo - .2, "click", .6], [NE.logo, "riser", .5], [NE.end, "buzz", .8], [NE.end + .1, "impact", .6], [NE.end + .7, "buzz", .4], [NE.end + 1.2, "ding", .35]);
    REEL.cues = cues;
  },

  // a neon tube's level at time t: off, then a few stuttering flickers, then steady with a faint hum
  level(t, on, off = Infinity, seed = 1) {
    if (t < on || t > off) return 0;
    const u = t - on;
    if (u < .5) return hash(Math.floor(u * 30), seed) < .25 + u * 1.4 ? 1 : .1;
    return .94 + .06 * Math.sin(t * 50 + seed);
  },
  glow(e, c, k) {
    e.style.color = k > .5 ? "#fff" : c;
    e.style.opacity = .18 + .82 * k;
    e.style.textShadow = k > .05 ? `0 0 4px #fff, 0 0 12px ${c}, 0 0 28px ${c}, 0 0 60px ${c}, 0 0 110px ${c}` : "none";
    e.style.boxShadow = e.classList.contains("ne-box") && k > .05 ? `0 0 14px ${c}, 0 0 40px ${c}, inset 0 0 14px ${c}` : "none";
    e.style.borderColor = k > .5 ? "#fff" : c;
  },

  frame(t) {
    $("neWall").style.opacity = .55 + .45 * prog(t, 0, .6);
    // the questions: on one by one, off in a quick row before the answer
    this.signs.forEach((s, i) => {
      this.glow(s.e, s.c, this.level(t, s.at, NE.off + i * .15, i + 3));
      s.e.style.transform = `rotate(${s.r}deg)`;
      s.e.style.visibility = t < NE.big + .6 ? "visible" : "hidden";
    });
    const dim = t > NE.logo - .2 ? 0 : 1;
    this.glow(this.big.e, this.big.c, this.level(t, this.big.at, NE.logo - .2, 9) * dim);
    this.big.e.style.visibility = t >= NE.big - .5 && t < NE.logo ? "visible" : "hidden";
    this.big.e.style.transform = `scale(${Math.min(1, 1000 / this.big.e.firstChild.offsetWidth)})`;
    this.glow(this.sub.e, this.sub.c, this.level(t, this.sub.at, NE.logo - .2, 11) * dim);
    this.sub.e.style.visibility = t >= NE.sub - .3 && t < NE.logo ? "visible" : "hidden";
    // the logo: the plane tube draws itself, then the name and the contacts buzz on
    const pd = 1 - easeInOut(prog(t, NE.logo, NE.logo + 1.0));
    this.planeTube.setAttribute("stroke-dashoffset", pd);
    this.planeGlow.setAttribute("stroke-dashoffset", pd);
    $("nePlane").style.opacity = t >= NE.logo ? 1 : 0;
    $("nePlane").style.filter = `drop-shadow(0 0 12px #ff7a1a) drop-shadow(0 0 40px #ff7a1a)`;
    for (const [x, at, seed] of [[this.name, NE.end - .6, 21], [this.tt, NE.end - .3, 22], [this.phone, NE.end, 23], [this.cta, NE.end + .7, 24], [this.url, NE.end + .9, 25]]) {
      this.glow(x.e, x.c, this.level(t, at, Infinity, seed));
      x.e.style.visibility = t >= at - .4 ? "visible" : "hidden";
    }
    this.cta.e.style.transform = `scale(${Math.min(1, 1000 / this.cta.e.firstChild.offsetWidth)})`;
  },
};
