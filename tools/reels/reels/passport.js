// "Passport" — any route, told with a travel passport: the navy cover swings open and the page fills with
// ink stamps, one per beat, from the cities our clients fly to; then Fulki's own round stamp lands in the middle.
// Navy leather and gold foil, cream security-printed paper, rubber-stamp ink.
const PP_BEAT = 60 / 104;
const PP = { open: [0.9, 1.7], first: 2.0, chips: 6.9, seal: 9.0, close: 10.4, end: 10.9 };
// [city, code, shape, ink, x, y, rotation]: positions on the 820×1140 page
const PP_STAMPS = [
  ["DHAKA", "DAC", "circle", "#1d4ed8", 210, 220, -12],
  ["DAKAR", "DSS", "rect", "#b91c1c", 590, 200, 8],
  ["ACCRA", "ACC", "oval", "#15803d", 600, 470, -6],
  ["LAHORE", "LHE", "oct", "#7c3aed", 220, 520, 10],
  ["NEW YORK", "JFK", "rect", "#0f766e", 300, 800, -4],
  ["CASABLANCA", "CMN", "oval", "#be123c", 560, 760, 14],
  ["DELHI", "DEL", "circle", "#c2410c", 190, 1000, 6],
  ["TORONTO", "YYZ", "oct", "#1e40af", 610, 1010, -10],
];

window.REEL = {
  name: "passport",
  langs: ["en", "it"],
  seconds: 14.5,
  end: PP.end,
  music: { style: "pop", bpm: 104, key: 9 },
  copy: {
    en: { cover: "TRAVEL PASSPORT", title: "Any route.", chips: ["One-way", "Return", "Multi-city"], arrived: "ARRIVAL",
          seal: "FULKI TRAVEL · ARZIGNANO · ITALY · ", line: "Flights worldwide,<br>with a real person by your side." },
    it: { cover: "TRAVEL PASSPORT", title: "Ogni rotta.", chips: ["Solo andata", "Andata e ritorno", "Multi-tratta"], arrived: "ARRIVO",
          seal: "FULKI TRAVEL · ARZIGNANO · ITALIA · ", line: "Voli per tutto il mondo,<br>con una persona vera al tuo fianco." },
  },
  cues: [],

  build(stage, L) {
    addCSS(`
      #ppBg { position: absolute; inset: 0; background: #e9e2d4; background-image: radial-gradient(rgba(0,0,0,.05) 1.5px, transparent 1.5px); background-size: 22px 22px; }
      #ppTitle { position: absolute; left: 0; right: 0; top: 130px; text-align: center; font: 400 150px/1 "DM Serif Display", serif; color: #172554; letter-spacing: -0.01em; }
      #ppBook { position: absolute; left: 130px; top: 420px; width: 820px; height: 1140px; perspective: 2600px; }
      #ppPage { position: absolute; inset: 0; border-radius: 18px 30px 30px 18px; background: #fbf6ea; overflow: hidden;
        box-shadow: 0 40px 80px rgba(23,37,84,.3), inset 18px 0 30px -18px rgba(0,0,0,.25); }
      #ppCover { position: absolute; inset: 0; border-radius: 18px 30px 30px 18px; background: linear-gradient(135deg, #1e3a8a, #172554 60%, #0f1a3d);
        transform-origin: 0 50%; backface-visibility: hidden; box-shadow: 0 40px 80px rgba(23,37,84,.35);
        display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 60px; color: #e8c872; }
      #ppCover .t { font: 400 64px/1 "DM Serif Display", serif; letter-spacing: .14em; }
      #ppCover .b { font: 700 34px/1 "Space Mono", monospace; letter-spacing: .4em; padding-left: .4em; }
      #ppCover svg { width: 300px; height: 300px; }
      #ppChips { position: absolute; left: 60px; right: 60px; top: 1600px; display: flex; justify-content: center; flex-wrap: wrap; gap: 20px; }
      #ppChips span { padding: 22px 36px; border-radius: 999px; background: #172554; color: #fbf6ea; font: 800 46px/1 "Manrope", sans-serif; }
      #ppChips span:nth-child(3) { background: #ea580c; }
      .pp-st text { font-family: "Anton", sans-serif; }
      #ppEnd { position: absolute; inset: 0; background: linear-gradient(160deg, #1e3a8a, #172554 55%, #0b1430); display: flex; flex-direction: column; align-items: center; justify-content: center; }
      #ppEnd img { width: 300px; height: 300px; }
      #ppEnd .line { margin-top: 70px; font: 400 76px/1.12 "DM Serif Display", serif; color: #fbf6ea; text-align: center; padding: 0 80px; }
      #ppEnd .pill { margin-top: 80px; display: flex; align-items: center; gap: 22px; background: #e8c872; color: #172554; padding: 30px 54px; border-radius: 999px; font: 800 60px/1 "Manrope", sans-serif; }
      #ppEnd .pill svg { width: 62px; height: 62px; }
      #ppEnd .url { margin-top: 34px; font: 700 46px/1 "Manrope", sans-serif; color: #e8c872; }
    `);
    div("", stage).id = "ppBg";
    div("", stage, L.title).id = "ppTitle";
    const book = div("", stage); book.id = "ppBook";
    const page = div("", book); page.id = "ppPage";
    const s = svg("svg", { width: 820, height: 1140, viewBox: "0 0 820 1140" }, page);
    // rubber-stamp ink: speckle the stamp with noise so it reads as inked rubber, not a vector
    const defs = svg("defs", {}, s);
    const f = svg("filter", { id: "ppInk", x: "-10%", y: "-10%", width: "120%", height: "120%" }, defs);
    svg("feTurbulence", { type: "fractalNoise", baseFrequency: ".08 .9", numOctaves: 2, seed: 3, result: "n" }, f);
    svg("feColorMatrix", { in: "n", type: "matrix", values: "0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 2.1", result: "m" }, f);
    svg("feComposite", { in: "SourceGraphic", in2: "m", operator: "in", result: "s" }, f);
    svg("feDisplacementMap", { in: "s", in2: "n", scale: 4 }, f);
    // security printing: fine wavy guilloche lines across the page
    for (let i = 0; i < 46; i++) {
      let d = "";
      for (let x = 0; x <= 820; x += 20) d += (x ? "L" : "M") + x + " " + (30 + i * 25 + 10 * Math.sin(x / 60 + i * .5)).toFixed(1);
      svg("path", { d, fill: "none", stroke: i % 2 ? "#c7d2fe" : "#fde68a", "stroke-width": 1.5, opacity: .7 }, s);
    }
    svg("text", { x: 790, y: 1110, "text-anchor": "end", fill: "#a5b4fc", style: 'font: 700 22px "Space Mono", monospace; letter-spacing: .2em' }, s).textContent = "VISAS · VISTI";
    this.stamps = PP_STAMPS.map((st, i) => this.stamp(s, L, ...st, PP.first + i * PP_BEAT * .9));
    // the seal: Fulki's own round stamp, with its text running around the ring
    const seal = svg("g", { class: "pp-st", filter: "url(#ppInk)" }, s);
    svg("circle", { r: 170, fill: "none", stroke: "#ea580c", "stroke-width": 10 }, seal);
    svg("circle", { r: 120, fill: "none", stroke: "#ea580c", "stroke-width": 4 }, seal);
    svg("path", { id: "ppRing", d: "M-145 0a145 145 0 1 1 290 0a145 145 0 1 1 -290 0", fill: "none" }, seal);
    const ring = svg("text", { fill: "#ea580c", style: 'font: 700 26px "Space Mono", monospace; letter-spacing: .12em' }, seal);
    svg("textPath", { href: "#ppRing" }, ring).textContent = L.seal + L.seal.split(" · ")[0];
    const icon = svg("g", { transform: "translate(-60 -60) scale(5)" }, seal);
    svg("path", { d: PLANE_PATH, fill: "#ea580c" }, icon);
    this.seal = seal;

    const cover = div("", book); cover.id = "ppCover";
    cover.innerHTML = `<div class="t">FULKI</div><svg viewBox="-50 -50 100 100" fill="none" stroke="#e8c872" stroke-width="2.2"><circle r="44"/><ellipse rx="18" ry="44"/><path d="M-44 0H44M-38-22H38M-38 22H38M0-44V44"/></svg><div class="b">${L.cover}</div>`;
    const chips = div("", stage); chips.id = "ppChips";
    this.chips = L.chips.map(c => div("", chips, c, "span"));
    const end = div("", stage); end.id = "ppEnd";
    this.end = [div("", end, undefined, "img"), div("line", end, L.line), div("pill", end, WA + PHONE), div("url", end, SITE)];
    this.end[0].src = LOGO + "fulki-icon-round.svg";

    const cues = [[PP.open[0], "flip", .8], [PP.open[0] + .3, "swoosh", .4]];
    for (const st of this.stamps) cues.push([st.at, "stamp", .85, (st.x - 410) / 500]);
    this.chips.forEach((_, i) => cues.push([PP.chips + i * .3, "pop", .5]));
    cues.push([PP.seal - .25, "riser", .5], [PP.seal, "stamp", 1.2, 0], [PP.seal + .02, "impact", .5], [PP.close, "flip", .7], [PP.end + .9, "ding", .45]);
    REEL.cues = cues;
  },

  // one rubber stamp of a city: a shape outline, the city in Anton, its airport code and "arrival"
  stamp(s, L, city, code, shape, ink, x, y, rot, at) {
    const g = svg("g", { class: "pp-st", filter: "url(#ppInk)" }, s);
    const st = { fill: "none", stroke: ink, "stroke-width": 7 };
    const W = Math.max(250, city.length * 34 + 70);
    if (shape === "circle") { svg("circle", { r: 125, ...st }, g); svg("circle", { r: 108, ...st, "stroke-width": 3 }, g); }
    else if (shape === "oval") { svg("ellipse", { rx: W / 2 + 10, ry: 105, ...st }, g); svg("ellipse", { rx: W / 2 - 6, ry: 90, ...st, "stroke-width": 3 }, g); }
    else if (shape === "oct") {
      const r = 128, pts = [...Array(8)].map((_, k) => { const a = Math.PI / 8 + k * Math.PI / 4; return `${(Math.cos(a) * r * 1.12).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`; }).join(" ");
      svg("polygon", { points: pts, ...st }, g);
    } else { svg("rect", { x: -W / 2, y: -95, width: W, height: 190, rx: 14, ...st }, g); svg("rect", { x: -W / 2 + 12, y: -83, width: W - 24, height: 166, rx: 8, ...st, "stroke-width": 3 }, g); }
    const fs = Math.min(64, (shape === "circle" || shape === "oct" ? 200 : W - 50) / (city.length * .52));
    svg("text", { y: fs * .35, "text-anchor": "middle", fill: ink, "font-size": fs }, g).textContent = city;
    svg("text", { y: -48, "text-anchor": "middle", fill: ink, style: 'font: 700 30px "Space Mono", monospace; letter-spacing: .2em' }, g).textContent = code;
    svg("text", { y: 70, "text-anchor": "middle", fill: ink, style: 'font: 700 22px "Space Mono", monospace; letter-spacing: .18em' }, g).textContent = "✈ " + L.arrived;
    return { g, x, y, rot, at };
  },

  frame(t) {
    place($("ppTitle"), { y: (1 - easeOut(prog(t, 0, .6))) * -50, o: prog(t, 0, .4) * (1 - prog(t, PP.close, PP.close + .3)) });
    // the book drops in, the cover swings open on its spine, the camera bumps on every stamp
    let bump = 0;
    for (const st of [...this.stamps, { at: PP.seal }]) if (t >= st.at) bump += Math.exp(-(t - st.at) * 14) * (st.at === PP.seal ? 2 : 1);
    const drop = easeOut(prog(t, 0, .7)), shut = easeInOut(prog(t, PP.close, PP.close + .5));
    place($("ppBook"), { y: (1 - drop) * 300 + bump * 8 - shut * 200, s: 1.08 - shut * .15, r: bump * .4, o: drop * (1 - shut) });
    const ang = easeInOut(prog(t, ...PP.open)) * 180;
    $("ppCover").style.transform = `rotateY(${-ang}deg)`;
    $("ppCover").style.visibility = ang < 90 ? "visible" : "hidden";

    for (const st of this.stamps) {
      const k = prog(t, st.at - .1, st.at);
      st.g.setAttribute("transform", `translate(${st.x} ${st.y}) rotate(${st.rot}) scale(${1.6 - .6 * easeIn(k)})`);
      st.g.setAttribute("opacity", t < st.at - .1 ? 0 : k < 1 ? .4 * k : .88);
    }
    const sk = prog(t, PP.seal - .12, PP.seal);
    this.seal.setAttribute("transform", `translate(410 600) rotate(${-8 + (1 - sk) * 30}) scale(${1.9 - .9 * easeIn(sk)})`);
    this.seal.setAttribute("opacity", t < PP.seal - .12 ? 0 : sk < 1 ? .5 * sk : .95);

    this.chips.forEach((c, i) => { const a = PP.chips + i * .3; place(c, { y: (1 - backOut(prog(t, a, a + .35))) * 60, o: prog(t, a, a + .15) * (1 - prog(t, PP.close, PP.close + .3)) }); });
    $("ppEnd").style.opacity = prog(t, PP.end - .3, PP.end);
    this.end.forEach((e, i) => { const a = PP.end + i * .25; place(e, { y: (1 - easeOut(prog(t, a, a + .45))) * 50, s: i === 0 ? .7 + .3 * backOut(prog(t, a, a + .5)) : 1, o: prog(t, a, a + .3) }); });
  },
};
