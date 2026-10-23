// "Family" — families and groups on one booking, as a scrapbook: kraft paper, polaroids that drop in with tape
// (illustrated "photos": the kids at the airport window, the grandparents with their suitcase, the wing above the
// clouds), handwritten captions and doodles drawn in with a marker.
const FA = { title: 0.2, pics: [1.3, 2.7, 4.1], msg: 5.7, sub: 7.4, end: 10.6 };
const FA_POS = [[50, 300, -7], [470, 540, 6], [110, 990, -3]];

window.REEL = {
  name: "family",
  langs: ["en", "it"],
  seconds: 14,
  end: FA.end,
  music: { style: "warm", bpm: 88, key: 7 },
  copy: {
    en: { title: "Travelling as a family?", caps: ["the little ones", "grandma & grandpa", "all of us!"], msg: "Everyone on the same booking.",
          sub: "Infants, children, several travellers:<br>we organise it all.", end: "Families & groups" },
    it: { title: "Viaggi in famiglia?", caps: ["i più piccoli", "i nonni", "tutti insieme!"], msg: "Tutti sulla stessa prenotazione.",
          sub: "Neonati, bambini, più passeggeri:<br>organizziamo tutto noi.", end: "Famiglie e gruppi" },
  },
  cues: [],

  build(stage, L) {
    addCSS(`
      #faBg { position: absolute; inset: 0; background: #c9a77c; }
      #faTex { position: absolute; inset: 0; mix-blend-mode: multiply; opacity: .55; }
      #faTitle { position: absolute; left: 60px; right: 60px; top: 110px; font: 700 118px/1 "Caveat", cursive; color: #3b2414; transform-origin: 0 50%; }
      .fa-pol { position: absolute; width: 560px; height: 680px; background: #fbfaf6; padding: 30px 30px 0; box-shadow: 0 24px 50px rgba(59,36,20,.35); transform-origin: 50% 50%; }
      .fa-pol svg.ph { display: block; width: 500px; height: 500px; background: #ccc; }
      .fa-pol .cap { text-align: center; margin-top: 26px; font: 700 72px/1 "Caveat", cursive; color: #1e3a8a; }
      .fa-tape { position: absolute; left: 200px; top: -30px; width: 170px; height: 60px; background: rgba(255,240,200,.75); box-shadow: 0 2px 4px rgba(0,0,0,.1); }
      #faDoodle { position: absolute; inset: 0; pointer-events: none; }
      #faMsg { position: absolute; left: 0; right: 0; top: 1690px; font: 700 92px/1 "Caveat", cursive; color: #3b2414; text-align: center; white-space: nowrap; }
      #faSub { position: absolute; left: 50px; right: 50px; top: 1690px; padding: 26px 30px; background: #fbfaf6; box-shadow: 0 14px 30px rgba(59,36,20,.3);
        font: 700 46px/1.25 "Manrope", sans-serif; color: #3b2414; text-align: center; transform-origin: 50% 50%; }
      #faEnd { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
      #faEnd .head { font: 700 120px/1 "Caveat", cursive; color: #3b2414; }
      #faEnd .fa-pol { position: relative; width: 640px; height: 660px; margin-top: 60px; }
      #faEnd .fa-pol .logo { width: 580px; height: 440px; background: #fff7ed; display: grid; place-items: center; }
      #faEnd .fa-pol .logo img { width: 500px; }
      #faEnd .fa-pol .cap { font-size: 78px; color: #ea580c; display: flex; align-items: center; justify-content: center; gap: 16px; }
      #faEnd .fa-pol .cap svg { width: 62px; height: 62px; }
      #faEnd .url { margin-top: 60px; font: 800 48px/1 "Manrope", sans-serif; color: #3b2414; }
    `);
    div("", stage).id = "faBg";
    // kraft paper fibres
    const tex = svg("svg", { id: "faTex", width: 1080, height: 1920 }, stage);
    const f = svg("filter", { id: "faFib" }, svg("defs", {}, tex));
    svg("feTurbulence", { type: "fractalNoise", baseFrequency: ".03 .22", numOctaves: 3, seed: 8 }, f);
    svg("feColorMatrix", { values: "0 0 0 0 .45  0 0 0 0 .32  0 0 0 0 .2  0 0 0 -1.4 1.1" }, f);
    svg("rect", { width: 1080, height: 1920, filter: "url(#faFib)" }, tex);
    div("", stage, L.title).id = "faTitle";
    this.pics = FA_POS.map(([x, y, r], i) => {
      const p = div("fa-pol", stage);
      Object.assign(p.style, { left: x + "px", top: y + "px" });
      const ph = svg("svg", { class: "ph", viewBox: "0 0 500 500" }, p);
      [this.kids, this.grandparents, this.wing][i].call(this, ph);
      div("cap", p, L.caps[i]);
      div("fa-tape", p).style.transform = `rotate(${i % 2 ? 4 : -5}deg)`;
      return { p, r, at: FA.pics[i] };
    });
    // marker doodles: an arrow from the title, hearts, an underline under the message
    const d = svg("svg", { id: "faDoodle", width: 1080, height: 1920 }, stage);
    const pen = (path, col = "#ea580c", w = 9) => svg("path", { d: path, fill: "none", stroke: col, "stroke-width": w, "stroke-linecap": "round", "stroke-linejoin": "round", pathLength: 1, "stroke-dasharray": 1, "stroke-dashoffset": 1 }, d);
    this.doodles = [
      [pen("M880 250C960 300 980 360 940 420M940 420L905 392M940 420L962 380"), FA.title + .9],
      [pen("M820 560c-20-30-70-10-50 30l50 50 50-50c20-40-30-60-50-30z", "#dc2626", 8), FA.pics[1] + .6],
      [pen("M940 1280l14 40 42 2-34 26 12 40-34-24-34 24 12-40-34-26 42-2z", "#ca8a04", 7), FA.pics[2] + .6],
      [pen("M120 1800C380 1780 700 1790 960 1770", "#ea580c", 10), FA.msg + .7],
    ];
    div("", stage, `<span>${L.msg}</span>`).id = "faMsg";
    div("", stage, L.sub).id = "faSub";
    const end = div("", stage); end.id = "faEnd";
    const pol = div("fa-pol", end);
    div("logo", pol, `<img src="${LOGO}fulki-travel-tours-horizontal.svg">`);
    div("cap", pol, WA + PHONE);
    div("fa-tape", pol).style.transform = "rotate(-4deg)";
    this.end = [div("head", end, L.end), pol, div("url", end, SITE)];
    end.insertBefore(this.end[0], pol);

    const cues = [[FA.title, "swoosh", .4]];
    for (const at of FA.pics) cues.push([at - .15, "shutter", .8], [at + .12, "thud", .5]);
    for (const [, at] of this.doodles) cues.push([at, "swoosh", .25]);
    cues.push([FA.msg, "pop", .5], [FA.sub, "thud", .5], [FA.end - .2, "whoosh", .6], [FA.end + .3, "shutter", .7], [FA.end + 1, "ding", .4]);
    REEL.cues = cues;
  },

  // the photos: flat illustrations
  kids(s) {
    const g = svg("linearGradient", { id: "faSky1", x1: 0, y1: 0, x2: 0, y2: 1 }, svg("defs", {}, s));
    svg("stop", { offset: 0, "stop-color": "#7cc4ef" }, g); svg("stop", { offset: 1, "stop-color": "#d9f0fb" }, g);
    svg("rect", { width: 500, height: 500, fill: "url(#faSky1)" }, s);
    svg("rect", { y: 330, width: 500, height: 40, fill: "#9aa5ad" }, s);                       // the runway beyond
    const pl = svg("g", { transform: "translate(330 140) rotate(-40) scale(5)" }, s);
    svg("path", { d: PLANE_PATH, fill: "#fff", transform: "translate(-12 -12)" }, pl);
    svg("path", { d: "M0 0H500V500H0ZM30 30V370H235V30ZM265 30V370H470V30Z", fill: "#3f4a54", "fill-rule": "evenodd" }, s);   // window frame
    svg("rect", { y: 370, width: 500, height: 130, fill: "#55606a" }, s);
    // two kids from behind, with backpacks
    for (const [x, h, c] of [[170, 1, "#ea580c"], [320, .82, "#16a34a"]]) {
      svg("rect", { x: x - 60 * h, y: 500 - 210 * h, width: 120 * h, height: 230 * h, rx: 50 * h, fill: "#1f2937" }, s);
      svg("circle", { cx: x, cy: 500 - 250 * h, r: 52 * h, fill: "#3b2414" }, s);
      svg("rect", { x: x - 45 * h, y: 500 - 190 * h, width: 90 * h, height: 120 * h, rx: 22 * h, fill: c }, s);
    }
  },
  grandparents(s) {
    svg("rect", { width: 500, height: 500, fill: "#fde4cf" }, s);
    svg("rect", { y: 380, width: 500, height: 120, fill: "#e8c1a0" }, s);
    for (const x of [40, 250, 460]) svg("rect", { x: x - 70, y: 40, width: 140, height: 110, rx: 10, fill: "#fff", opacity: .45 }, s);  // pictures on the wall
    // grandma (left) and grandpa (right, with a cane), smiling, a suitcase between them
    svg("rect", { x: 70, y: 230, width: 140, height: 270, rx: 60, fill: "#be185d" }, s);
    svg("circle", { cx: 140, cy: 180, r: 56, fill: "#c68e6a" }, s);
    svg("path", { d: "M84 175C84 110 196 110 196 175C190 140 90 140 84 175Z", fill: "#e7e5e4" }, s);
    svg("circle", { cx: 140, cy: 108, r: 26, fill: "#e7e5e4" }, s);
    svg("rect", { x: 300, y: 220, width: 150, height: 280, rx: 60, fill: "#1e3a8a" }, s);
    svg("circle", { cx: 375, cy: 170, r: 58, fill: "#a5714f" }, s);
    for (const x of [322, 428]) svg("ellipse", { cx: x, cy: 160, rx: 14, ry: 26, fill: "#e7e5e4" }, s);  // grey hair at the sides
    svg("path", { d: "M470 300V500M470 300Q470 280 450 282", stroke: "#78350f", "stroke-width": 12, fill: "none", "stroke-linecap": "round" }, s);
    for (const [cx, cy] of [[140, 196], [375, 186]]) svg("path", { d: `M${cx - 20} ${cy}q20 18 40 0`, stroke: "#3b2414", "stroke-width": 5, fill: "none", "stroke-linecap": "round" }, s);
    svg("rect", { x: 205, y: 340, width: 100, height: 140, rx: 14, fill: "#ea580c" }, s);
    svg("path", { d: "M230 340V315H280V340", stroke: "#3b2414", "stroke-width": 8, fill: "none" }, s);
    svg("rect", { x: 205, y: 395, width: 100, height: 12, fill: "#fff", opacity: .6 }, s);
  },
  wing(s) {
    const g = svg("linearGradient", { id: "faSky3", x1: 0, y1: 0, x2: 0, y2: 1 }, svg("defs", {}, s));
    svg("stop", { offset: 0, "stop-color": "#6d28d9" }, g); svg("stop", { offset: .55, "stop-color": "#f472b6" }, g); svg("stop", { offset: 1, "stop-color": "#fdba74" }, g);
    svg("rect", { width: 500, height: 500, fill: "url(#faSky3)" }, s);
    svg("circle", { cx: 360, cy: 300, r: 70, fill: "#fff7ed" }, s);
    for (const [x, y, r] of [[60, 380, 70], [150, 400, 90], [270, 410, 80], [390, 390, 90], [480, 410, 70], [200, 330, 50]])
      svg("circle", { cx: x, cy: y, r, fill: "#fff", opacity: .85 }, s);
    svg("rect", { y: 410, width: 500, height: 90, fill: "#fff", opacity: .85 }, s);
    svg("path", { d: "M-10 250L340 150L360 168L-10 330Z", fill: "#e5e7eb" }, s);              // the wing
    svg("path", { d: "M300 160L340 150L360 168L330 176Z", fill: "#ea580c" }, s);
    svg("path", { d: "M-10 330L360 168L-10 300Z", fill: "#9ca3af" }, s);
  },

  frame(t) {
    place($("faTitle"), { x: (1 - easeOut(prog(t, FA.title, FA.title + .6))) * -60, r: -2, o: prog(t, FA.title, FA.title + .4) * (1 - prog(t, FA.end - .3, FA.end)) });
    const out = easeIn(prog(t, FA.end - .4, FA.end));
    for (const { p, r, at } of this.pics) {
      // a polaroid is flashed white, then dropped onto the page from above, settling with a little wobble
      const k = prog(t, at - .2, at + .1);
      const wob = t > at + .1 ? 3 * Math.sin((t - at) * 14) * Math.exp(-(t - at) * 6) : 0;
      place(p, { y: (1 - easeIn(k)) * -260 + out * 1600, s: .9 * (1.3 - .3 * easeIn(k)), r: r + (1 - k) * 18 + wob, o: t < at - .2 ? 0 : 1 });
      p.querySelector("svg").style.filter = `brightness(${1 + 2 * (1 - prog(t, at, at + .7))})`;
    }
    for (const [p, at] of this.doodles) { p.setAttribute("stroke-dashoffset", 1 - easeInOut(prog(t, at, at + .5))); p.style.opacity = 1 - prog(t, FA.end - .4, FA.end); }
    place($("faMsg"), { y: (1 - easeOut(prog(t, FA.msg, FA.msg + .4))) * 30, s: Math.min(1, 980 / $("faMsg").firstChild.offsetWidth), o: prog(t, FA.msg, FA.msg + .3) * (1 - prog(t, FA.sub - .2, FA.sub)) });
    place($("faSub"), { s: 1.2 - .2 * easeIn(prog(t, FA.sub - .15, FA.sub + .1)), r: 2, o: prog(t, FA.sub - .15, FA.sub) * (1 - prog(t, FA.end - .4, FA.end)) });
    this.end.forEach((e, i) => {
      const a = FA.end + i * .3;
      place(e, { y: (1 - easeOut(prog(t, a, a + .5))) * (i === 1 ? -300 : 40), r: i === 1 ? -3 + (1 - easeOut(prog(t, a, a + .5))) * 14 : 0, o: prog(t, a, a + .3) });
    });
  },
};
