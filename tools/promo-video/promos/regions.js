// The original promo: Asia, Africa and the Middle East. Loaded by promo.html (?promo=regions, the default).
// A promo file sets window.PROMO: its copy per language, its three scenes (departure boards, sky colours,
// artwork), any sun or night sky, the natural soundscape under each scene and its default soundtrack.
window.PROMO = {
  name: "regions",
  langs: ["en", "it"],
  sound: "airport+hijaz",
  sounds: ["monsoon", "savanna", "desert"],  // make_audio.py soundscapes, one per scene
  copy: {
    en: { intro: "Where to <em>next?</em>", kicker: "Fly to", titles: ["Asia", "Africa", "Middle East"], board: "DEPARTURES",
          tag: "The world is waiting.<br><em>Your seat is ready.</em>", sub: "Asia · Africa · Middle East" },
    it: { intro: "Dove si <em>vola?</em>", kicker: "Vola in", titles: ["Asia", "Africa", "Medio Oriente"], board: "PARTENZE",
          tag: "Il mondo ti aspetta.<br><em>Il tuo posto è pronto.</em>", sub: "Asia · Africa · Medio Oriente" },
  },
  // two sets of departures per scene; the board flips to the second set partway through
  scenes: [
    { id: "asia",   sets: [[["DAC", "DHAKA"], ["DEL", "DELHI"], ["BKK", "BANGKOK"]], [["SYL", "SYLHET"], ["CMB", "COLOMBO"], ["MNL", "MANILA"]]] },
    { id: "africa", sets: [[["CAI", "CAIRO"], ["DSS", "DAKAR"], ["NBO", "NAIROBI"]], [["ACC", "ACCRA"], ["LOS", "LAGOS"], ["TUN", "TUNIS"]]] },
    { id: "me",     sets: [[["DXB", "DUBAI"], ["DOH", "DOHA"], ["JED", "JEDDAH"]], [["RUH", "RIYADH"], ["MCT", "MUSCAT"], ["AMM", "AMMAN"]]] },
  ],
  // sky per scene: [top, middle, bottom]
  sky: {
    asia:   ["#312e81", "#be185d", "#fb923c"],
    africa: ["#7c2d12", "#ea580c", "#fcd34d"],
    me:     ["#070b1f", "#3b1d5e", "#f59e0b"],
  },
  // artwork per scene: [draw function, far colour, near colour, accent]
  art: { asia: [asia, "#7e2553", "#2a0f2e", "#fdba74"], africa: [africa, "#b45309", "#1c0a03", "#fed7aa"], me: [middleEast, "#2e1d55", "#070a18", "#fbbf24"] },
  // a big setting sun over Africa (Asia has the Shaheed Minar's red sun in its own artwork); stars over the Middle East
  suns: [{ scene: 1, r: 280, y0: 1250, y1: 1290, color: "#fff7ed" }],
  night: 2,
};

function asia(back, front, accent) {
  el("path", { d: "M-20 1780Q120 1620 300 1690T620 1670T1100 1690V1800H-20Z", fill: back, opacity: .8 }, this.b);
  // Shaheed Minar, Dhaka: the red sun behind five grille columns, the tallest bowing forward
  el("circle", { cx: 470, cy: 1470, r: 165, fill: "#f42a41", transform: "translate(470 1772) scale(1.15) translate(-470 -1772)" }, this.b);
  let m = rect(200, 1748, 540, 24) + rect(222, 1728, 496, 22);
  m += frame(232, 1600, 66, 128, 2) + frame(642, 1600, 66, 128, 2);
  m += frame(316, 1530, 76, 198, 2) + frame(548, 1530, 76, 198, 2);
  m += frame(410, 1440, 120, 288, 3);
  m += "M404 1440L536 1440L552 1336L388 1336Z" + "M422 1428L518 1428L532 1350L408 1350Z";
  for (const f of [.25, .5, .75]) { const xb = 422 + 96 * f, xt = 408 + 124 * f; m += `M${xb - 3} 1428L${xb + 3} 1428L${xt + 3} 1350L${xt - 3} 1350Z`; }
  el("path", { d: m, fill: front, "fill-rule": "evenodd", transform: "translate(470 1772) scale(1.15) translate(-470 -1772)" }, this.f);

  let d = rect(-20, 1770, 1120, 200);
  // pagoda (left)
  const pc = 100; let y = 1770;
  for (let i = 0; i < 5; i++) {
    const w = 210 - i * 32, h = 76 - i * 6;
    d += rect(pc - w * .3, y - h + 20, w * .6, h - 20);
    const ey = y - h + 22;
    d += `M${pc - w / 2 - 22} ${ey - 12}Q${pc - w / 2} ${ey + 4} ${pc - w / 2 + 18} ${ey}L${pc + w / 2 - 18} ${ey}Q${pc + w / 2} ${ey + 4} ${pc + w / 2 + 22} ${ey - 12}L${pc + w * .26} ${ey - 30}L${pc - w * .26} ${ey - 30}Z`;
    y = ey - 30;
  }
  d += rect(pc - 3, y - 80, 6, 82);
  el("path", { d, fill: front }, this.f);

  // Taj Mahal (right): plinth, hall, drum, onion dome, chhatris, four minarets
  const taj = el("g", { transform: "translate(905 1772) scale(.52) translate(-540 -1772)" }, this.f);
  let tj = rect(290, 1712, 500, 60) + "M392 1712V1566L412 1546H668L688 1566V1712Z";
  tj += rect(468, 1520, 144, 30) + onion(540, 1522, 176, 196) + rect(538, 1300, 4, 34);
  for (const x of [428, 652]) tj += rect(x - 22, 1516, 44, 32) + onion(x, 1518, 54, 52) + rect(x - 1.5, 1452, 3, 18);
  for (const x of [318, 762]) tj += minaret(x, 1712, 1450, 26, { balconies: [1640, 1574, 1508], cap: "dome" });
  el("path", { d: tj, fill: front }, taj);
  el("path", { d: "M506 1712V1620Q506 1586 540 1572Q574 1586 574 1620V1712Z", fill: accent, opacity: .55 }, taj);
}

function africa(back, front, accent) {
  // Kilimanjaro and the far savanna
  el("path", { d: "M360 1780L630 1556Q700 1526 770 1532Q830 1526 900 1560L1140 1780Z", fill: back }, this.b);
  el("path", { d: "M630 1556Q700 1526 770 1532Q830 1526 900 1560L880 1576L846 1564L812 1580L770 1566L730 1582L694 1566L654 1580Z", fill: "#fff7ed", opacity: .6 }, this.b);
  el("path", { d: "M-20 1730Q260 1690 540 1716T1100 1708V1800H-20Z", fill: back, opacity: .85 }, this.b);
  // pyramids of Giza, each with a sunlit face
  for (const [x1, x2, ax, ay] of [[0, 210, 105, 1610], [40, 470, 255, 1420], [280, 480, 380, 1590]]) {
    el("path", { d: tri(x1, x2, ax, ay, 1772), fill: front }, this.f);
    el("path", { d: `M${ax} ${ay}L${x2} 1772L${ax + (x2 - ax) * .25} 1772Z`, fill: accent, opacity: .28 }, this.f);
  }
  el("path", { d: rect(-20, 1770, 1120, 200), fill: front }, this.f);
  // acacias: trunk, branches, flat canopy
  for (const [cx, sc] of [[818, 1], [586, .62]]) {
    const g = el("g", { fill: front, transform: `translate(${cx} 1772) scale(${sc}) translate(-818 -1772)` }, this.f);
    el("path", { d: "M806 1772C812 1690 806 1620 822 1540L834 1540C824 1620 832 1690 830 1772Z" +
      "M822 1560C790 1520 752 1490 700 1466L708 1458C760 1478 800 1508 830 1548Z" +
      "M826 1556C850 1510 900 1484 960 1462L964 1472C910 1494 866 1520 834 1560Z" }, g);
    for (const [ex, ey, rx, ry] of [[716, 1452, 80, 28], [800, 1432, 120, 36], [910, 1446, 110, 32], [990, 1464, 70, 22], [850, 1418, 80, 24]])
      el("ellipse", { cx: ex, cy: ey, rx, ry }, g);
  }
  // grass tufts
  let gr = "";
  for (let i = 0; i < 26; i++) { const x = i * 43 + hash(i, 7) * 20, h = 14 + hash(i, 9) * 22; gr += `M${x} 1772L${x + 4} ${1772 - h}L${x + 8} 1772Z`; }
  el("path", { d: gr, fill: front }, this.f);
}

function middleEast(back, front, accent) {
  // dunes and a far skyline
  let sk = "";
  for (let i = 0; i < 18; i++) { const x = 560 + i * 26, h = 40 + hash(i, 3) * 110; sk += rect(x, 1700 - h, 20, h + 60); }
  el("path", { d: sk, fill: back, opacity: .7 }, this.b);
  el("path", { d: "M-20 1720Q220 1620 470 1690T1100 1660V1800H-20Z", fill: back }, this.b);
  let d = "M-20 1772Q300 1740 600 1764T1100 1756V1960H-20Z";
  // mosque: hall, drum, great dome, side domes, two minarets, crescent finial
  d += rect(300, 1616, 340, 160) + rect(372, 1576, 196, 44) + onion(470, 1578, 206, 176);
  for (const x of [334, 606]) d += onion(x, 1618, 62, 52);
  for (const x of [246, 694]) d += minaret(x, 1772, 1340, 30, { balconies: [1560, 1450], cap: "cone" });
  d += rect(468, 1370, 4, 36);
  // Burj Khalifa: stepped setbacks and spire
  let y = 1772;
  [124, 104, 88, 74, 60, 48, 36, 26, 18].forEach((w, i) => {
    const h = 74 - i * 2, off = (i % 3 - 1) * 6;
    d += rect(930 - w / 2 + off, y - h, w, h + 1); y -= h;
  });
  d += tri(926, 936, 931, y - 150, y + 2);
  // palms
  for (const [x, top, lean] of [[70, 1500, 40], [170, 1560, -30]]) {
    d += `M${x - 9} 1772Q${x + lean * .2} ${(1772 + top) / 2} ${x + lean - 4} ${top}L${x + lean + 4} ${top}Q${x + lean * .2 + 12} ${(1772 + top) / 2} ${x + 9} 1772Z`;
    const cx = x + lean, cy = top;
    for (const a of [-170, -140, -105, -70, -35, -8, 20]) {
      const r = a * Math.PI / 180, ex = cx + Math.cos(r) * 130, ey = cy + Math.sin(r) * 60 + 64;
      const mx = cx + Math.cos(r) * 70, my = cy + Math.sin(r) * 70 - 10;
      d += `M${cx} ${cy}Q${mx} ${my - 12} ${ex} ${ey}Q${mx} ${my + 14} ${cx} ${cy + 8}Z`;
    }
  }
  el("path", { d, fill: front }, this.f);
  // lit windows on the mosque
  let w = "";
  for (const x of [330, 380, 540, 590]) w += `M${x} 1700V1660Q${x + 12} 1642 ${x + 24} 1660V1700Z`;
  el("path", { d: w, fill: accent, opacity: .8 }, this.f);
}

