// Bangladesh: Dhaka, Sylhet and Cox's Bazar, with departures from Italian airports.
// Loaded by promo.html?promo=bangladesh; renders to assets/video/fulki-promo-bangladesh-<lang>.mp4.
const BD_CITY = {
  en: { VCE: "VENICE", VRN: "VERONA", MXP: "MILAN", BGY: "BERGAMO", BLQ: "BOLOGNA", FCO: "ROME", TSF: "TREVISO", NAP: "NAPLES", TRN: "TURIN" },
  it: { VCE: "VENEZIA", VRN: "VERONA", MXP: "MILANO", BGY: "BERGAMO", BLQ: "BOLOGNA", FCO: "ROMA", TSF: "TREVISO", NAP: "NAPOLI", TRN: "TORINO" },
};

window.PROMO = {
  name: "bangladesh",
  langs: ["en", "it", "bn"],
  sound: "airport+alaap",
  sounds: ["monsoon", "tea", "sea"],  // make_audio.py soundscapes: Dhaka rain, Sylhet tea gardens, Cox's Bazar waves
  copy: {
    en: { intro: "Next stop:<br><em>Bangladesh</em>", kicker: "Fly to", titles: ["Dhaka", "Sylhet", "Cox's Bazar"], board: "DEPARTURES",
          tag: "Bangladesh is calling.<br><em>Your seat is ready.</em>", sub: "Dhaka · Sylhet · Cox's Bazar" },
    it: { intro: "Prossima fermata:<br><em>Bangladesh</em>", kicker: "Vola a", titles: ["Dhaka", "Sylhet", "Cox's Bazar"], board: "PARTENZE",
          tag: "Il Bangladesh ti chiama.<br><em>Il tuo posto è pronto.</em>", sub: "Dhaka · Sylhet · Cox's Bazar" },
    bn: { intro: "পরবর্তী গন্তব্য:<br><em>বাংলাদেশ</em>", kicker: "গন্তব্য", titles: ["ঢাকা", "সিলেট", "কক্সবাজার"], board: "প্রস্থান",
          tag: "বাংলাদেশ ডাকছে।<br><em>আপনার সিট প্রস্তুত।</em>", sub: "ঢাকা · সিলেট · কক্সবাজার" },
  },
  // the board lists Italian departure airports for each destination; it flips to a second set partway through
  scenes: lang => {
    const name = BD_CITY[lang] || BD_CITY.en;
    const rows = codes => codes.map(c => [c, name[c]]);
    return [
      { id: "dhaka",  to: "DAC", sets: [rows(["VCE", "VRN", "MXP"]), rows(["BGY", "BLQ", "FCO"])] },
      { id: "sylhet", to: "ZYL", sets: [rows(["VCE", "MXP", "FCO"]), rows(["VRN", "TSF", "BLQ"])] },
      { id: "coxs",   to: "CXB", sets: [rows(["VCE", "VRN", "MXP"]), rows(["FCO", "NAP", "TRN"])] },
    ];
  },
  sky: {
    dhaka:  ["#022c22", "#0b5d45", "#e8a33d"],   // the flag's green at dawn, warming at the horizon
    sylhet: ["#0b3a53", "#2f7a6a", "#f3d891"],   // misty morning over the tea hills
    coxs:   ["#3b0a2a", "#be123c", "#fdba74"],   // sunset over the Bay of Bengal
  },
  art: { dhaka: [dhaka, "#0f4a3a", "#03140f", "#f4b860"], sylhet: [sylhet, "#3f7f6c", "#0a2a20", "#6fbf8a"], coxs: [coxsBazar, "#4a1838", "#14060f", "#fdba74"] },
  suns: [
    { scene: 1, r: 120, y0: 1330, y1: 1270, color: "#fef9c3" },  // the morning sun rising over Sylhet
    { scene: 2, r: 230, y0: 1470, y1: 1540, color: "#fff1d6" },  // the sun setting into the sea at Cox's Bazar
  ],
  night: null,
};

const circlePath = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;

function shaheedMinar(parent, cx, sc, color) {
  // the Shaheed Minar: five open grille columns on a stepped plinth, the tallest bowing forward
  let m = rect(200, 1748, 540, 24) + rect(222, 1728, 496, 22);
  m += frame(232, 1600, 66, 128, 2) + frame(642, 1600, 66, 128, 2);
  m += frame(316, 1530, 76, 198, 2) + frame(548, 1530, 76, 198, 2);
  m += frame(410, 1440, 120, 288, 3);
  m += "M404 1440L536 1440L552 1336L388 1336Z" + "M422 1428L518 1428L532 1350L408 1350Z";
  for (const f of [.25, .5, .75]) { const xb = 422 + 96 * f, xt = 408 + 124 * f; m += `M${xb - 3} 1428L${xb + 3} 1428L${xt + 3} 1350L${xt - 3} 1350Z`; }
  el("path", { d: m, fill: color, "fill-rule": "evenodd", transform: `translate(${cx} 1772) scale(${sc}) translate(-470 -1772)` }, parent);
}

function coconutPalm(cx, base, top, lean) {
  let d = `M${cx - 9} ${base}Q${cx + lean * .2} ${(base + top) / 2} ${cx + lean - 4} ${top}L${cx + lean + 4} ${top}Q${cx + lean * .2 + 12} ${(base + top) / 2} ${cx + 9} ${base}Z`;
  const x = cx + lean, y = top;
  for (const a of [-170, -140, -105, -70, -35, -8, 20]) {
    const r = a * Math.PI / 180, ex = x + Math.cos(r) * 130, ey = y + Math.sin(r) * 60 + 64;
    const mx = x + Math.cos(r) * 70, my = y + Math.sin(r) * 70 - 10;
    d += `M${x} ${y}Q${mx} ${my - 12} ${ex} ${ey}Q${mx} ${my + 14} ${x} ${y + 8}Z`;
  }
  return d;
}

function dhaka(back, front, accent) {
  // the flag's red sun rising behind the city, a far skyline under it
  el("circle", { cx: 540, cy: 1450, r: 205, fill: "#f42a41" }, this.b);
  let sk = "";
  for (let i = 0; i < 40; i++) { const x = i * 28 - 10, h = 50 + hash(i, 21) * 150; sk += rect(x, 1720 - h, 22, h + 60); }
  el("path", { d: sk, fill: back, opacity: .75 }, this.b);

  el("path", { d: rect(-20, 1770, 1120, 200), fill: front }, this.f);
  // the National Martyrs' Memorial (Jatiyo Smriti Soudho), Savar: nested triangular walls, the inner ones tallest
  const mem = el("g", {}, this.f);
  el("path", { d: rect(250, 1740, 580, 32), fill: front }, mem);
  for (const [apex, half] of [[1540, 250], [1440, 190], [1330, 130], [1190, 70]]) {
    el("path", { d: tri(540 - half, 540 + half, 540, apex, 1742), fill: front }, mem);
    el("path", { d: `M${540 - half} 1742L540 ${apex}L${540 + half} 1742`, fill: "none", stroke: accent, "stroke-width": 4, opacity: .45 }, mem);
  }
  // the Shaheed Minar (left) and the National Parliament (right)
  shaheedMinar(this.f, 150, 0.52, front);
  let par = rect(800, 1500, 230, 272) + circlePath(915, 1585, 40) + "M865 1720L915 1650L965 1720Z" + rect(830, 1530, 14, 90) + rect(986, 1530, 14, 90);
  par += rect(740, 1610, 70, 162) + circlePath(775, 1660, 18);
  el("path", { d: par, fill: front, "fill-rule": "evenodd" }, this.f);
  el("path", { d: rect(1030, 1580, 70, 192), fill: front }, this.f);
}

function sylhet(back, front, accent) {
  // misty far hills
  el("path", { d: "M-20 1560Q160 1440 360 1520T760 1480T1100 1500V1800H-20Z", fill: back, opacity: .55 }, this.b);
  el("path", { d: "M-20 1620Q240 1540 480 1600T1100 1570V1800H-20Z", fill: back, opacity: .85 }, this.b);

  // the near tea hill, combed with rows of bushes that follow its curve
  const hill = "M-20 1640Q200 1560 460 1610T1100 1600V1980H-20Z";
  el("path", { d: hill, fill: front }, this.f);
  const clipId = "tea-hill-clip";
  const cp = el("clipPath", { id: clipId }, this.f);
  el("path", { d: hill }, cp);
  const rows = el("g", { "clip-path": `url(#${clipId})` }, this.f);
  for (let i = 0; i < 9; i++) {
    const dy = 24 + i * 24;
    el("path", { d: `M-20 ${1640 + dy}Q200 ${1560 + dy} 460 ${1610 + dy}T1100 ${1600 + dy}`, fill: "none", stroke: accent,
                 "stroke-width": 10, "stroke-linecap": "round", "stroke-dasharray": "30 12", opacity: .42 - i * .02 }, rows);
  }
  // tall shade trees standing over the tea
  let tr = "";
  for (const [x, h, w] of [[150, 190, 80], [420, 230, 95], [780, 200, 85], [990, 170, 70]]) {
    const base = 1620 + hash(x, 3) * 20;
    tr += `M${x - 4} ${base}L${x - 2} ${base - h}L${x + 2} ${base - h}L${x + 4} ${base}Z`;
    for (let k = 0; k < 4; k++) {
      const cx = x + (k - 1.5) * w * 0.45, cy = base - h - 4 + (k % 2) * 10, rx = w * 0.42, ry = 14;
      tr += `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;
    }
  }
  el("path", { d: tr, fill: front }, this.f);
  // the river below, and a country boat (nouka) with its square sail
  el("path", { d: "M-20 1752Q540 1736 1100 1752V1980H-20Z", fill: back, opacity: .9 }, this.f);
  el("path", { d: "M-20 1760Q540 1746 1100 1760", fill: "none", stroke: accent, "stroke-width": 3, opacity: .5 }, this.f);
  const boat = "M600 1758Q700 1800 820 1758L812 1750Q700 1782 608 1750Z" + rect(707, 1600, 5, 160)
             + "M650 1612Q712 1600 772 1612L766 1726Q712 1716 656 1726Z";
  el("path", { d: boat, fill: front }, this.f);
}

function coxsBazar(back, front, accent) {
  // the Bay of Bengal, the setting sun's path across it, a fishing sampan out on the water
  el("path", { d: rect(-20, 1540, 1120, 440), fill: back }, this.b);
  let glint = "";
  for (let i = 0; i < 9; i++) { const w = 200 - i * 16, y = 1556 + i * 20; glint += rect(540 - w / 2 + (i % 2) * 14, y, w, 5); }
  el("path", { d: glint, fill: accent, opacity: .7 }, this.b);
  el("path", { d: "M-20 1600Q300 1592 600 1604T1100 1598", fill: "none", stroke: accent, "stroke-width": 3, opacity: .35 }, this.b);
  el("path", { d: "M720 1600Q790 1632 900 1630Q960 1628 1000 1584L990 1582Q950 1612 900 1614Q800 1616 730 1590Z" + rect(852, 1520, 4, 96),
               fill: front }, this.b);

  // the long beach in the foreground, a line of foam at its edge, coconut palms leaning out
  el("path", { d: "M-20 1700Q300 1664 600 1700T1100 1690V1980H-20Z", fill: front }, this.f);
  el("path", { d: "M-20 1696Q300 1660 600 1696T1100 1686", fill: "none", stroke: "#fff7ed", "stroke-width": 4, opacity: .35 }, this.f);
  let palms = coconutPalm(80, 1720, 1430, 50) + coconutPalm(200, 1710, 1520, -20) + coconutPalm(990, 1700, 1460, -45);
  el("path", { d: palms, fill: front }, this.f);
}
