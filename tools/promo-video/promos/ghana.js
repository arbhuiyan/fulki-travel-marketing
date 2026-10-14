// Ghana: Accra, Kakum and Cape Coast, with departures from Italian airports to Accra (ACC).
// Loaded by promo.html?promo=ghana; renders to assets/video/fulki-promo-ghana-<lang>.mp4.
const GH_CITY = {
  en: { VCE: "VENICE", VRN: "VERONA", MXP: "MILAN", BGY: "BERGAMO", BLQ: "BOLOGNA", FCO: "ROME", TRN: "TURIN", TSF: "TREVISO", PSA: "PISA", NAP: "NAPLES" },
  it: { VCE: "VENEZIA", VRN: "VERONA", MXP: "MILANO", BGY: "BERGAMO", BLQ: "BOLOGNA", FCO: "ROMA", TRN: "TORINO", TSF: "TREVISO", PSA: "PISA", NAP: "NAPOLI" },
};

window.PROMO = {
  name: "ghana",
  langs: ["en", "it"],
  sound: "airport+akan",
  sounds: ["savanna", "forest", "sea"],  // make_audio.py soundscapes: warm wind in Accra, the Kakum rainforest, waves at Cape Coast
  copy: {
    en: { intro: "Next stop:<br><em>Ghana</em>", kicker: "Fly to", titles: ["Accra", "Kakum", "Cape Coast"], board: "DEPARTURES",
          tag: "Akwaaba!<br>Ghana is calling.<br><em>Your seat is ready.</em>", sub: "Accra · Kakum · Cape Coast" },
    it: { intro: "Prossima fermata:<br><em>Ghana</em>", kicker: "Vola a", titles: ["Accra", "Kakum", "Cape Coast"], board: "PARTENZE",
          tag: "Akwaaba!<br>Il Ghana ti chiama.<br><em>Il tuo posto è pronto.</em>", sub: "Accra · Kakum · Cape Coast" },
  },
  // every destination is reached through Accra's airport (ACC); the board lists Italian departure airports
  scenes: lang => {
    const name = GH_CITY[lang] || GH_CITY.en;
    const rows = codes => codes.map(c => [c, name[c]]);
    return [
      { id: "accra",     to: "ACC", sets: [rows(["VRN", "VCE", "BGY"]), rows(["MXP", "BLQ", "FCO"])] },
      { id: "kakum",     to: "ACC", sets: [rows(["VCE", "TSF", "VRN"]), rows(["BGY", "MXP", "TRN"])] },
      { id: "capecoast", to: "ACC", sets: [rows(["VRN", "BLQ", "VCE"]), rows(["FCO", "NAP", "PSA"])] },
    ];
  },
  sky: {
    accra:     ["#123a5a", "#4f9cc9", "#f8d48a"],   // a bright, warm afternoon
    kakum:     ["#0a3d2e", "#2f7d5b", "#d4ebb4"],   // morning mist over the rainforest
    capecoast: ["#3a1030", "#d9572b", "#fcd38a"],   // sunset over the Gulf of Guinea
  },
  art: { accra: [accra, "#2b5e82", "#081a28", "#fcd116"], kakum: [kakum, "#3f8a66", "#06231a", "#b8e0a0"], capecoast: [capeCoast, "#5a2236", "#160810", "#fcd38a"] },
  suns: [{ scene: 2, r: 200, y0: 1490, y1: 1560, color: "#fff1d6" }],
  night: null,
};

function star(cx, cy, R, r) {
  let d = "";
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r : R;
    d += (i ? "L" : "M") + (cx + Math.cos(a) * rad).toFixed(1) + " " + (cy + Math.sin(a) * rad).toFixed(1);
  }
  return d + "Z";
}

function accra(back, front, accent) {
  // the city low behind Independence Square
  let sk = "";
  for (let i = 0; i < 36; i++) { const x = i * 31 - 10, h = 40 + hash(i, 51) * 120; sk += rect(x, 1720 - h, 25, h + 60); }
  el("path", { d: sk, fill: back, opacity: .7 }, this.b);

  el("path", { d: rect(-20, 1770, 1120, 210), fill: front }, this.f);
  // the Black Star Gate: a broad arch on square piers, the black star on top
  let gate = rect(300, 1440, 480, 332) + rect(400, 1560, 280, 212) + rect(280, 1416, 520, 30);
  for (const x of [330, 350, 710, 730]) gate += rect(x, 1480, 8, 250);
  el("path", { d: gate, fill: front, "fill-rule": "evenodd" }, this.f);
  el("path", { d: star(540, 1340, 70, 28), fill: "#0b0b0b", stroke: accent, "stroke-width": 5 }, this.f);
  // the Kwame Nkrumah Mausoleum (right), shaped like an upturned sword, on its plinth
  el("path", { d: rect(830, 1730, 230, 42) + "M865 1730L885 1580L1000 1540L1020 1730Z", fill: front }, this.f);
  el("path", { d: coconutPalm(110, 1772, 1500, 40) + coconutPalm(220, 1772, 1560, -30), fill: front }, this.f);
}

function kakum(back, front, accent) {
  // layers of rainforest canopy fading into the mist
  for (const [y, op, k0] of [[1450, .45, 0], [1540, .75, 7]]) {
    let c = rect(-20, y + 40, 1120, 500);
    for (let i = 0; i < 14; i++) { const x = i * 84 - 20 + hash(i, k0 + 61) * 40, r = 60 + hash(i, k0 + 62) * 40; c += `M${x - r} ${y + 40}a${r} ${r * 0.8} 0 1 1 ${2 * r} 0Z`; }
    el("path", { d: c, fill: back, opacity: op }, this.b);
  }

  // tall trees with buttress roots and broad crowns
  const trees = [[150, 1360], [540, 1300], [920, 1350]];
  let d = rect(-20, 1770, 1120, 210);
  for (const [x, top] of trees) {
    d += `M${x - 60} 1772Q${x - 22} 1740 ${x - 16} 1660L${x - 12} ${top + 60}L${x + 12} ${top + 60}L${x + 16} 1660Q${x + 22} 1740 ${x + 60} 1772Z`;
    for (let k = 0; k < 5; k++) { const cx = x + (k - 2) * 46, cy = top + (k % 2) * 26, r = 70; d += `M${cx - r} ${cy}a${r} ${r * 0.7} 0 1 0 ${2 * r} 0a${r} ${r * 0.7} 0 1 0 ${-2 * r} 0Z`; }
  }
  el("path", { d, fill: front }, this.f);
  // the canopy walkway: rope bridges slung between platforms on the trunks
  let walk = "";
  for (const [x, top] of trees) walk += rect(x - 40, 1480, 80, 10);
  el("path", { d: walk, fill: front }, this.f);
  let ropes = "";
  for (let i = 0; i < trees.length - 1; i++) {
    const x0 = trees[i][0] + 40, x1 = trees[i + 1][0] - 40, mid = (x0 + x1) / 2;
    ropes += `M${x0} 1488Q${mid} 1560 ${x1} 1488`;           // the deck
    ropes += `M${x0} 1450Q${mid} 1522 ${x1} 1450`;           // the handrail
    for (let j = 1; j < 12; j++) {
      const u = j / 12, x = x0 + (x1 - x0) * u, sag = 4 * u * (1 - u) * 36;
      ropes += `M${x} ${1450 + sag * 2}L${x} ${1488 + sag * 2}`;
    }
  }
  el("path", { d: ropes, fill: "none", stroke: front, "stroke-width": 4 }, this.f);
  el("path", { d: ropes.split("M").filter(Boolean).slice(0, 2).map(p => "M" + p).join(""), fill: "none", stroke: accent, "stroke-width": 2, opacity: .35 }, this.f);
}

function capeCoast(back, front, accent) {
  // the Gulf of Guinea at sunset
  el("path", { d: rect(-20, 1550, 1120, 430), fill: back }, this.b);
  let glint = "";
  for (let i = 0; i < 9; i++) { const w = 190 - i * 16, y = 1566 + i * 19; glint += rect(540 - w / 2 + (i % 2) * 14, y, w, 5); }
  el("path", { d: glint, fill: accent, opacity: .7 }, this.b);

  // the beach, painted fishing canoes out on the water with their little flags flying, and palms
  el("path", { d: "M-20 1690Q300 1660 620 1694T1100 1684V1980H-20Z", fill: front }, this.f);
  el("path", { d: "M-20 1686Q300 1656 620 1690T1100 1680", fill: "none", stroke: "#fff7ed", "stroke-width": 4, opacity: .35 }, this.f);
  for (const [x0, len, y0] of [[600, 260, 1640], [380, 220, 1606]]) {
    el("path", { d: `M${x0} ${y0 - 24}Q${x0 + 24} ${y0} ${x0 + 70} ${y0}L${x0 + len - 70} ${y0}Q${x0 + len - 24} ${y0} ${x0 + len} ${y0 - 24}L${x0 + len - 12} ${y0 - 28}Q${x0 + len / 2} ${y0 - 12} ${x0 + 12} ${y0 - 28}Z`
                 + rect(x0 + len / 2 - 2, y0 - 120, 4, 100), fill: front }, this.f);
    const flags = [["#ce1126", 0], ["#fcd116", 1], ["#006b3f", 2]];  // the flag's red, gold and green
    for (const [col, k] of flags) el("path", { d: rect(x0 + len / 2 + 2, y0 - 118 + k * 12, 40, 12), fill: col, opacity: .85 }, this.f);
    for (const [col, off] of [["#ce1126", 8], ["#fcd116", 14]])
      el("path", { d: `M${x0 + 30} ${y0 - off}L${x0 + len - 30} ${y0 - off}`, stroke: col, "stroke-width": 4, opacity: .7 }, this.f);
  }
  el("path", { d: coconutPalm(90, 1700, 1420, 50) + coconutPalm(200, 1700, 1500, -25) + coconutPalm(990, 1700, 1450, -40), fill: front }, this.f);
}
