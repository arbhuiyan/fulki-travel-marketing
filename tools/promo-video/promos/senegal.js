// Senegal: Dakar, Touba and Saint-Louis, with departures from Italian airports to Dakar (DSS).
// Loaded by promo.html?promo=senegal; renders to assets/video/fulki-promo-senegal-<lang>.mp4.
const SN_CITY = {
  en: { VCE: "VENICE", VRN: "VERONA", MXP: "MILAN", BGY: "BERGAMO", BLQ: "BOLOGNA", FCO: "ROME", TRN: "TURIN", PSA: "PISA", GOA: "GENOA", NAP: "NAPLES" },
  it: { VCE: "VENEZIA", VRN: "VERONA", MXP: "MILANO", BGY: "BERGAMO", BLQ: "BOLOGNA", FCO: "ROMA", TRN: "TORINO", PSA: "PISA", GOA: "GENOVA", NAP: "NAPOLI" },
  fr: { VCE: "VENISE", VRN: "VERONE", MXP: "MILAN", BGY: "BERGAME", BLQ: "BOLOGNE", FCO: "ROME", TRN: "TURIN", PSA: "PISE", GOA: "GENES", NAP: "NAPLES" },
};

window.PROMO = {
  name: "senegal",
  langs: ["en", "it", "fr"],
  sound: "airport+sahel",
  sounds: ["sea", "savanna", "river"],  // make_audio.py soundscapes: Atlantic waves, Sahel wind, the river at Saint-Louis
  copy: {
    en: { intro: "Next stop:<br><em>Senegal</em>", kicker: "Fly to", titles: ["Dakar", "Touba", "Saint-Louis"], board: "DEPARTURES",
          tag: "Senegal is calling.<br><em>Your seat is ready.</em>", sub: "Dakar · Touba · Saint-Louis" },
    it: { intro: "Prossima fermata:<br><em>Senegal</em>", kicker: "Vola a", titles: ["Dakar", "Touba", "Saint-Louis"], board: "PARTENZE",
          tag: "Il Senegal ti chiama.<br><em>Il tuo posto è pronto.</em>", sub: "Dakar · Touba · Saint-Louis" },
    fr: { intro: "Prochaine escale&nbsp;:<br><em>Sénégal</em>", kicker: "Cap sur", titles: ["Dakar", "Touba", "Saint-Louis"], board: "DÉPARTS",
          tag: "Le Sénégal vous appelle.<br><em>Votre place est prête.</em>", sub: "Dakar · Touba · Saint-Louis" },
  },
  // every destination is reached through Dakar's airport (DSS); the board lists Italian departure airports
  scenes: lang => {
    const name = SN_CITY[lang] || SN_CITY.en;
    const rows = codes => codes.map(c => [c, name[c]]);
    return [
      { id: "dakar",      to: "DSS", sets: [rows(["VCE", "VRN", "MXP"]), rows(["BGY", "BLQ", "FCO"])] },
      { id: "touba",      to: "DSS", sets: [rows(["BGY", "MXP", "TRN"]), rows(["VCE", "PSA", "GOA"])] },
      { id: "saintlouis", to: "DSS", sets: [rows(["VRN", "VCE", "BLQ"]), rows(["FCO", "NAP", "TRN"])] },
    ];
  },
  sky: {
    dakar:      ["#0b3b5c", "#2a7fb0", "#f6c56b"],   // late afternoon over the Atlantic
    touba:      ["#5a2a0a", "#d9822b", "#fde68a"],   // golden hour over the Sahel
    saintlouis: ["#1f1747", "#a8406a", "#f8a65c"],   // dusk on the Senegal River
  },
  art: { dakar: [dakar, "#1d4f73", "#06182a", "#fde7b0"], touba: [touba, "#b8682a", "#2a1206", "#fde68a"], saintlouis: [saintLouis, "#4a2450", "#120818", "#fbbf6a"] },
  suns: [
    { scene: 1, r: 210, y0: 1360, y1: 1400, color: "#fff4d6" },  // low golden sun behind the Great Mosque of Touba
    { scene: 2, r: 150, y0: 1500, y1: 1580, color: "#ffe6c4" },  // setting behind the Faidherbe Bridge
  ],
  night: null,
};

function dakar(back, front, accent) {
  // the Atlantic, and the Mamelles hill with its lighthouse
  el("path", { d: rect(-20, 1590, 1120, 390), fill: back }, this.b);
  let glint = "";
  for (let i = 0; i < 14; i++) glint += rect(80 + hash(i, 31) * 900, 1610 + hash(i, 32) * 130, 40 + hash(i, 33) * 70, 4);
  el("path", { d: glint, fill: accent, opacity: .45 }, this.b);
  el("path", { d: "M640 1600Q760 1450 880 1510Q960 1460 1100 1540V1600Z" + rect(842, 1392, 22, 92) + rect(836, 1376, 34, 18) + tri(836, 870, 853, 1350, 1376),
               fill: front, opacity: .9 }, this.b);
  el("circle", { cx: 853, cy: 1385, r: 16, fill: accent, opacity: .8 }, this.b);

  // the cliff above the ocean and the Mosquée de la Divinité, with its dome and two minarets
  el("path", { d: "M-20 1688L600 1688Q660 1700 690 1772L1100 1772V1980H-20Z", fill: front }, this.f);
  let m = rect(240, 1560, 280, 130) + rect(318, 1520, 124, 42) + onion(380, 1522, 150, 130) + rect(378, 1330, 4, 66);
  for (const x of [222, 538]) m += minaret(x, 1690, 1300, 30, { balconies: [1560, 1440], cap: "dome" });
  el("path", { d: m, fill: front }, this.f);
  let win = "";
  for (const x of [262, 300, 432, 470]) win += `M${x} 1660V1612Q${x + 14} 1592 ${x + 28} 1612V1660Z`;
  el("path", { d: win, fill: accent, opacity: .6 }, this.f);
  el("path", { d: coconutPalm(70, 1700, 1460, 40) + coconutPalm(640, 1700, 1500, 30), fill: front }, this.f);
}

function touba(back, front, accent) {
  // the flat Sahel to the horizon, a few distant acacias
  el("path", { d: "M-20 1700Q300 1676 600 1694T1100 1684V1800H-20Z", fill: back }, this.b);
  for (const [x, s] of [[110, 0.5], [900, 0.6], [1010, 0.4]]) {
    const g = el("g", { fill: back, transform: `translate(${x} 1700) scale(${s}) translate(-818 -1772)` }, this.b);
    el("path", { d: "M806 1772C812 1690 806 1620 822 1540L834 1540C824 1620 832 1690 830 1772Z" }, g);
    el("ellipse", { cx: 820, cy: 1500, rx: 150, ry: 34 }, g);
  }

  // the Great Mosque of Touba: a long arcaded hall, domes, four minarets and the tall Lamp Fall minaret
  el("path", { d: rect(-20, 1770, 1120, 210), fill: front }, this.f);
  let m = rect(270, 1610, 540, 162);
  for (const x of [410, 670]) m += rect(x - 50, 1580, 100, 32) + onion(x, 1582, 112, 96) + rect(x - 2, 1440, 4, 50);
  for (const [x, top] of [[300, 1360], [780, 1360], [220, 1450], [860, 1450]]) m += minaret(x, 1772, top, 26, { balconies: [top + 110, top + 220], cap: "dome" });
  // Lamp Fall: three tapering tiers with balconies, a small dome and finial
  m += rect(510, 1430, 60, 342) + rect(500, 1420, 80, 14) + rect(516, 1270, 48, 152) + rect(508, 1260, 64, 12)
     + rect(522, 1150, 36, 112) + rect(516, 1140, 48, 12) + onion(540, 1142, 44, 52) + rect(538, 1060, 4, 34);
  el("path", { d: m, fill: front }, this.f);
  let arches = "";
  for (let i = 0; i < 9; i++) { const x = 296 + i * 56; arches += `M${x} 1740V1680Q${x + 16} 1656 ${x + 32} 1680V1740Z`; }
  el("path", { d: arches, fill: accent, opacity: .5 }, this.f);
}

function saintLouis(back, front, accent) {
  // the Senegal River, the old town on the far bank and the Faidherbe Bridge's iron arches
  el("path", { d: rect(-20, 1630, 1120, 350), fill: back }, this.b);
  let glint = "";
  for (let i = 0; i < 8; i++) { const w = 150 - i * 14, y = 1648 + i * 18; glint += rect(540 - w / 2 + (i % 2) * 12, y, w, 5); }
  el("path", { d: glint, fill: accent, opacity: .6 }, this.b);
  let town = "";
  for (let i = 0; i < 30; i++) { const x = i * 37 - 10, h = 20 + hash(i, 41) * 40; town += rect(x, 1612 - h, 30, h + 20); }
  el("path", { d: town, fill: front, opacity: .55 }, this.b);
  let bridge = rect(-20, 1618, 1120, 12);
  let truss = "";
  for (let k = 0; k < 5; k++) {
    const x0 = -40 + k * 270;
    bridge += rect(x0 - 8, 1618, 16, 42);
    truss += `M${x0} 1620Q${x0 + 135} 1490 ${x0 + 270} 1620`;
    for (let j = 1; j < 10; j++) {
      const u = j / 10, x = x0 + 270 * u, y = (1 - u) * (1 - u) * 1620 + 2 * (1 - u) * u * 1490 + u * u * 1620;
      truss += `M${x} ${y}L${x} 1620`;
    }
  }
  el("path", { d: bridge, fill: front }, this.b);
  el("path", { d: truss, fill: "none", stroke: front, "stroke-width": 6 }, this.b);

  // the near bank with a baobab, and painted pirogues drawn up on the water
  el("path", { d: "M-20 1730Q220 1704 430 1742Q470 1760 480 1980H-20Z", fill: front }, this.f);
  let bao = "M112 1736C100 1650 120 1570 132 1520L200 1520C212 1570 230 1650 216 1736Z";
  for (const [x2, y2, w] of [[80, 1440, 16], [130, 1420, 14], [170, 1400, 16], [230, 1430, 14], [270, 1460, 12]]) {
    bao += `M${150 + (x2 - 150) * 0.2 - w} 1530Q${(150 + x2) / 2} ${(1530 + y2) / 2 - 10} ${x2 - w / 2} ${y2}L${x2 + w / 2} ${y2}Q${(150 + x2) / 2 + w} ${(1530 + y2) / 2} ${150 + (x2 - 150) * 0.2 + w} 1530Z`;
    bao += `M${x2 - 40} ${y2}a40 16 0 1 0 80 0a40 16 0 1 0 -80 0Z`;
  }
  el("path", { d: bao, fill: front }, this.f);
  for (const [x0, len, y0] of [[520, 380, 1770], [640, 300, 1830]]) {
    const hull = `M${x0} ${y0 - 22}Q${x0 + 20} ${y0} ${x0 + 60} ${y0}L${x0 + len - 60} ${y0}Q${x0 + len - 20} ${y0} ${x0 + len} ${y0 - 22}L${x0 + len - 10} ${y0 - 26}Q${x0 + len / 2} ${y0 - 10} ${x0 + 10} ${y0 - 26}Z`;
    el("path", { d: hull, fill: front }, this.f);
    for (const [col, off] of [["#16a34a", 8], ["#facc15", 14]])  // painted bands, in the flag's green and yellow
      el("path", { d: `M${x0 + 30} ${y0 - off}L${x0 + len - 30} ${y0 - off}`, stroke: col, "stroke-width": 4, opacity: .75 }, this.f);
  }
}
