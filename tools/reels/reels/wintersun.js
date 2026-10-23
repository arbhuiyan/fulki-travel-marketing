// "Winter sun" — a retro risograph travel poster. A grey snowy opening ("Winter again?"), then a striped sun
// rises over layered waves, the palette warms up, sunny destinations stamp in one by one and a plane tows the
// Fulki banner across the sky. Limited ink palette, paper grain, halftone dots, slightly misregistered print.
const WS = { sun: 1.7, head: 2.6, dest: 4.6, each: 0.85, plane: 9.6, end: 11.8 };
const INK = { paper: "#f3e9d2", coral: "#ff6b4a", teal: "#0e7c7b", navy: "#1b2a4a", mustard: "#f2b134" };

function wsMix(a, b, k) {
  const h = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const A = h(a), B = h(b);
  return "rgb(" + A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(",") + ")";
}

window.REEL = {
  name: "wintersun",
  langs: ["en", "it"],
  seconds: 15,
  end: WS.end,
  music: { style: "tropical", bpm: 102, key: 2 },
  crf: 28,  // the moving paper grain is costly to encode; it hides the extra compression
  copy: {
    en: { cold: "Winter<br>again?", head: "Fly to<br>the sun.", dests: ["Canary Islands", "Egypt", "Maldives", "Zanzibar", "Caribbean", "Thailand"],
          banner: "FULKI TRAVEL", line: "Your winter escape<br>starts here." },
    it: { cold: "Ancora<br>inverno?", head: "Vola verso<br>il sole.", dests: ["Canarie", "Egitto", "Maldive", "Zanzibar", "Caraibi", "Thailandia"],
          banner: "FULKI TRAVEL", line: "La tua fuga d'inverno<br>parte da qui." },
  },
  cues: [],

  build(stage, L) {
    addCSS(`
      #wsSvg { position: absolute; inset: 0; }
      .ws-t { position: absolute; left: 80px; right: 80px; font: 400 168px/0.95 "DM Serif Display", serif; letter-spacing: -0.02em; }
      #wsCold { top: 300px; color: #3b4a5c; }
      #wsHead { top: 210px; }
      #wsHead .a, #wsHead .b { position: absolute; left: 0; top: 0; }
      #wsHead .a { color: ${INK.teal}; mix-blend-mode: multiply; }
      #wsHead .b { color: ${INK.coral}; mix-blend-mode: multiply; }
      #wsDest { position: absolute; left: 0; right: 0; top: 640px; height: 200px; }
      .ws-d { position: absolute; left: 80px; display: inline-flex; align-items: center; gap: 24px; padding: 20px 40px 24px; background: ${INK.navy}; color: ${INK.paper};
        font: 400 92px/1 "DM Serif Display", serif; border-radius: 6px; box-shadow: 10px 10px 0 ${INK.mustard}; white-space: nowrap; }
      .ws-d svg { width: 70px; height: 70px; transform: rotate(45deg); }
      #wsEnd { position: absolute; inset: 0; background: ${INK.paper}; display: flex; flex-direction: column; align-items: center; justify-content: center; }
      #wsEnd .sun { width: 260px; height: 260px; border-radius: 50%; background: repeating-linear-gradient(${INK.coral} 0 30px, transparent 30px 40px); }
      #wsEnd .line { margin-top: 60px; font: 400 92px/1.02 "DM Serif Display", serif; color: ${INK.navy}; text-align: center; }
      #wsEnd img { margin-top: 80px; width: 640px; }
      #wsEnd .pill { margin-top: 70px; display: flex; align-items: center; gap: 22px; background: ${INK.teal}; color: ${INK.paper}; padding: 30px 54px; border-radius: 999px;
        font: 800 60px/1 "Manrope", sans-serif; box-shadow: 10px 10px 0 ${INK.coral}; }
      #wsEnd .pill svg { width: 62px; height: 62px; }
      #wsEnd .url { margin-top: 40px; font: 800 46px/1 "Manrope", sans-serif; color: ${INK.navy}; }
      #wsGrain { position: absolute; left: -40px; top: -40px; width: 1160px; height: 2000px; pointer-events: none; mix-blend-mode: multiply; opacity: .5; }
    `);
    const s = svg("svg", { id: "wsSvg", width: 1080, height: 1920, viewBox: "0 0 1080 1920" }, stage);
    const defs = svg("defs", {}, s);
    const sky = svg("linearGradient", { id: "wsSky", x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    this.sky = [0, .6, 1].map(o => svg("stop", { offset: o }, sky));
    // the sun's stripes: a mask that cuts ever-thicker gaps through its lower half
    const m = svg("mask", { id: "wsSunMask" }, defs);
    svg("circle", { cx: 0, cy: 0, r: 340, fill: "#fff" }, m);
    for (let i = 0; i < 6; i++) svg("rect", { x: -400, y: 30 + i * 50, width: 800, height: 10 + i * 6, fill: "#000" }, m);
    const dots = svg("pattern", { id: "wsDots", width: 18, height: 18, patternUnits: "userSpaceOnUse", patternTransform: "rotate(30)" }, defs);
    svg("circle", { cx: 9, cy: 9, r: 4.5, fill: INK.mustard }, dots);

    svg("rect", { width: 1080, height: 1920, fill: "url(#wsSky)" }, s);
    this.rays = svg("g", {}, s);
    for (let i = 0; i < 18; i++) {
      const a = i * Math.PI * 2 / 18, b = a + Math.PI / 30;
      svg("path", { d: `M0 0L${Math.cos(a) * 1600} ${Math.sin(a) * 1600}L${Math.cos(b) * 1600} ${Math.sin(b) * 1600}Z`, fill: INK.mustard, opacity: .28 }, this.rays);
    }
    this.sun = svg("g", {}, s);
    svg("circle", { r: 360, fill: "url(#wsDots)", opacity: .7 }, this.sun);
    svg("circle", { r: 340, fill: INK.coral, mask: "url(#wsSunMask)" }, this.sun);
    // the sea: four wave bands, each drifting at its own speed
    this.waves = [[1330, INK.teal, .9], [1430, INK.navy, .75], [1560, INK.teal, 1], [1700, INK.navy, 1]].map(([y, c, o], i) => {
      let d = `M-200 ${y}`;
      for (let x = -200; x <= 1400; x += 40) d += `L${x} ${(y + 18 * Math.sin(x / 70 + i)).toFixed(1)}`;
      return svg("path", { d: d + "V1920H-200Z", fill: c, opacity: o }, s);
    });
    // a palm in the foreground, leaning in from the right
    let palm = "M1010 1920Q980 1600 860 1300L880 1296Q1010 1590 1050 1920Z";
    for (const a of [-160, -125, -90, -55, -20, 10, 35]) {
      const r = a * Math.PI / 180, x = 870, y = 1298, ex = x + Math.cos(r) * 260, ey = y + Math.sin(r) * 120 + 120;
      palm += `M${x} ${y}Q${x + Math.cos(r) * 140} ${y + Math.sin(r) * 150 - 20} ${ex} ${ey}Q${x + Math.cos(r) * 140} ${y + Math.sin(r) * 150 + 20} ${x} ${y + 14}Z`;
    }
    this.palm = svg("path", { d: palm, fill: INK.navy }, s);
    // a plane towing the banner
    this.plane = svg("g", {}, s);
    svg("path", { d: "M30 0L110 0", stroke: INK.navy, "stroke-width": 3 }, this.plane);
    const ban = svg("g", { transform: "translate(110 -44)" }, this.plane);
    this.banner = svg("path", { fill: INK.paper, stroke: INK.navy, "stroke-width": 4 }, ban);
    svg("text", { x: 250, y: 64, "text-anchor": "middle", fill: INK.coral, style: 'font: 400 58px "DM Serif Display", serif' }, ban).textContent = L.banner;
    const pl = svg("g", { transform: "rotate(-135) scale(4)" }, this.plane);
    svg("path", { d: PLANE_PATH, fill: INK.navy, transform: "translate(-12 -12)" }, pl);
    // snow for the cold opening
    this.snow = svg("g", {}, s);
    this.flakes = [...Array(90)].map((_, i) => svg("circle", { r: 3 + hash(i, 1) * 7, fill: "#fff", opacity: .9 }, this.snow));

    div("ws-t", stage, L.cold).id = "wsCold";
    const head = div("ws-t", stage); head.id = "wsHead";
    div("a", head, L.head); div("b", head, L.head);
    const dest = div("", stage); dest.id = "wsDest";
    this.dests = L.dests.map(d => div("ws-d", dest, PLANE(INK.mustard) + d));
    // paper grain over everything
    const g = svg("svg", { id: "wsGrain", viewBox: "0 0 1160 2000" }, stage);
    const f = svg("filter", { id: "wsNoise" }, svg("defs", {}, g));
    svg("feTurbulence", { type: "fractalNoise", baseFrequency: .9, numOctaves: 2, seed: 4 }, f);
    svg("feColorMatrix", { values: "0 0 0 0 .55  0 0 0 0 .45  0 0 0 0 .35  0 0 0 -1.6 1.15" }, f);
    svg("rect", { width: 1160, height: 2000, filter: "url(#wsNoise)" }, g);
    this.grain = g;
    const end = div("", stage); end.id = "wsEnd";
    this.end = [div("sun", end), div("line", end, L.line), div("", end, undefined, "img"), div("pill", end, WA + PHONE), div("url", end, SITE)];
    this.end[2].src = LOGO + "fulki-travel-tours-horizontal.svg";
    stage.appendChild(g);

    const cues = [[WS.sun - .6, "riser", .7], [WS.sun + .1, "impact", .6], [WS.head, "swoosh", .6]];
    L.dests.forEach((_, i) => cues.push([WS.dest + i * WS.each, "stamp", .55], [WS.dest + i * WS.each - .08, "whoosh", .3]));
    cues.push([WS.plane, "whoosh", .5], [WS.end - .2, "swoosh", .7], [WS.end + 1.2, "ding", .4]);
    REEL.cues = cues;
  },

  frame(t) {
    // the palette warms from winter grey to poster colours as the sun comes up
    const warm = easeInOut(prog(t, WS.sun - .4, WS.sun + .8));
    const cold = ["#7d8fa3", "#b8c4d1", "#e4e9ee"], hot = ["#ffd9a8", INK.paper, "#ffe2b8"];
    this.sky.forEach((st, i) => st.setAttribute("stop-color", wsMix(cold[i], hot[i], warm)));
    const rise = easeOut(prog(t, WS.sun - .6, WS.sun + 1.2));
    this.sun.setAttribute("transform", `translate(540 ${1760 - rise * 560})`);
    this.rays.setAttribute("transform", `translate(540 ${1760 - rise * 560}) rotate(${t * 6})`);
    this.rays.setAttribute("opacity", warm);
    this.waves.forEach((w, i) => w.setAttribute("transform", `translate(${Math.sin(t * (.6 + i * .2) + i) * 60 - 40} ${Math.sin(t * 1.3 + i) * 6})`));
    this.palm.setAttribute("transform", `translate(${(1 - easeOut(prog(t, WS.sun, WS.sun + .8))) * 500} 0) rotate(${Math.sin(t * 1.4) * 1.2} 1010 1920)`);
    // snow falls, then melts away as it warms
    this.snow.setAttribute("opacity", 1 - warm);
    this.flakes.forEach((f, i) => {
      const y = ((hash(i, 2) * 1920 + t * (90 + hash(i, 3) * 120)) % 2000) - 40;
      f.setAttribute("cx", (hash(i, 4) * 1080 + Math.sin(t * 1.5 + i) * 30).toFixed(1));
      f.setAttribute("cy", y.toFixed(1));
    });
    place($("wsCold"), { y: (1 - easeOut(prog(t, .1, .7))) * 60, o: prog(t, .1, .5) * (1 - prog(t, WS.sun - .3, WS.sun)) });
    // the headline prints in two inks that slide into (almost) register
    const h = prog(t, WS.head, WS.head + .6), mis = 26 * (1 - easeOut(h)) + 5;
    const hd = $("wsHead").children;
    place(hd[0], { x: -mis, y: -mis * .4, o: h > 0 ? 1 : 0 });
    place(hd[1], { x: mis * .6, y: mis * .3, o: h > 0 ? 1 : 0 });
    $("wsHead").style.opacity = prog(t, WS.head, WS.head + .2) * (1 - prog(t, WS.end - .3, WS.end));
    // destinations: each label stamps in, holds, and flies out to the left as the next arrives
    this.dests.forEach((d, i) => {
      const a = WS.dest + i * WS.each, b = a + WS.each, last = i === this.dests.length - 1;
      const k = prog(t, a - .08, a + .12), out = last ? prog(t, WS.end - .4, WS.end) : easeIn(prog(t, b - .1, b + .15));
      place(d, { x: -out * 1100, s: 1.25 - .25 * easeOut(k), r: -3 + (i % 2) * 5, o: t < a - .08 ? 0 : 1 });
    });
    // the banner plane crosses right to left, the banner rippling behind it
    const px = lerp(1200, -800, prog(t, WS.plane, WS.plane + 3.2));
    this.plane.setAttribute("transform", `translate(${px} ${1030 + Math.sin(t * 2) * 10})`);
    this.plane.setAttribute("opacity", t >= WS.plane ? 1 : 0);
    let d = "";
    for (let x = 0; x <= 500; x += 25) d += (x ? "L" : "M") + x + " " + (6 * Math.sin(x / 50 - t * 10)).toFixed(1);
    for (let x = 500; x >= 0; x -= 25) d += "L" + x + " " + (88 + 6 * Math.sin(x / 50 - t * 10)).toFixed(1);
    this.banner.setAttribute("d", d + "Z");
    // a slightly jittered grain, like film
    this.grain.style.transform = `translate(${Math.floor(hash(Math.floor(t * 12), 1) * 40) - 20}px, ${Math.floor(hash(Math.floor(t * 12), 2) * 40) - 20}px)`;
    $("wsEnd").style.transform = `translateY(${(1 - easeOut(prog(t, WS.end - .3, WS.end))) * 1920}px)`;
    this.end.forEach((e, i) => { const a = WS.end + .1 + i * .2; place(e, { y: (1 - easeOut(prog(t, a, a + .45))) * 50, r: i === 0 ? (1 - easeOut(prog(t, a, a + .8))) * -90 : 0, o: prog(t, a, a + .3) }); });
  },
};
