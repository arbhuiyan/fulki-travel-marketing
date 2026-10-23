// The paper dart and how it folds itself into the Fulki plane (PLANE, from flap.js), for the paper-plane promos.
// PaperPlane.shape(m, roll): the plane pointing right, 100 units long, m = 0 paper .. 1 Fulki plane, roll = cos of the barrel roll.
const PaperPlane = (() => {
const NS = "http://www.w3.org/2000/svg";
const clamp = v => Math.max(0, Math.min(1, v));
const ease = v => (v = clamp(v), v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2);
const lerp = (a, b, k) => a + (b - a) * k;
const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const mix = (a, b, k) => { const x = hex(a), y = hex(b); return `rgb(${x.map((v, i) => Math.round(lerp(v, y[i], k))).join(",")})`; };

const PAPER = { pts: [[62, 0], [-42, -40], [-30, 0], [-42, 40]] };   // top view of a paper dart, nose first
const BRAND_KEYS = [[50, 0], [-11, -43], [-44.6, 0], [-11, 43]];      // nose, wingtip, tail, wingtip on PLANE
const N = 60;                                                         // points per side for the morph
function resample(poly, n) {   // n evenly spaced points along an open polyline
  const len = [0];
  for (let i = 1; i < poly.length; i++) len.push(len[i - 1] + Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]));
  const out = [];
  for (let j = 0, i = 1; j < n; j++) {
    const L = len.at(-1) * j / n;
    while (len[i] < L) i++;
    const k = (L - len[i - 1]) / (len[i] - len[i - 1] || 1);
    out.push([lerp(poly[i - 1][0], poly[i][0], k), lerp(poly[i - 1][1], poly[i][1], k)]);
  }
  return out;
}
let MORPH = null;
function buildMorph() {
  const svg = document.createElementNS(NS, "svg"), el = document.createElementNS(NS, "path");
  el.setAttribute("d", PLANE);
  svg.appendChild(el);
  document.body.appendChild(svg);
  const total = el.getTotalLength(), dense = [];
  for (let i = 0; i <= 3000; i++) { const p = el.getPointAtLength(total * i / 3000); dense.push([p.x, p.y]); }
  svg.remove();
  const idx = BRAND_KEYS.map(([x, y]) => dense.reduce((best, p, i) => Math.hypot(p[0] - x, p[1] - y) < Math.hypot(dense[best][0] - x, dense[best][1] - y) ? i : best, 0));
  idx[0] = 0; idx.push(3000);
  const brand = [], paper = [], pp = [...PAPER.pts, PAPER.pts[0]];
  for (let s = 0; s < 4; s++) {
    brand.push(...resample(dense.slice(idx[s], idx[s + 1] + 1), N));
    paper.push(...resample([pp[s], pp[s + 1]], N));
  }
  return { brand, paper };
}

function shape(m, roll) {
  MORPH ??= buildMorph();
  const pts = MORPH.paper.map((p, i) => [lerp(p[0], MORPH.brand[i][0], m), lerp(p[1], MORPH.brand[i][1], m) * roll]);
  const d = "M" + pts.map(p => p.map(v => v.toFixed(2)).join(" ")).join("L") + "Z";
  let g = `<path d="${d}" fill="${mix("#FFFFFF", "#EA580C", ease(m * 1.4))}"/>`;
  if (m < 1) {   // the folds of the paper: a shaded lower wing and the centre crease
    const [n, a, c, b] = PAPER.pts.map(([x, y]) => [x, y * roll]);
    g += `<g opacity="${1 - clamp(m * 1.6)}"><path d="M${n}L${c}L${b}Z" fill="${roll > 0 ? "#D9D5D1" : "#F1EFED"}"/>` +
         `<path d="M${n}L${c}" stroke="#BDB7B1" stroke-width="1.6"/><path d="M${n}L${a}L${c}Z" fill="#FFFFFF" opacity="${roll > 0 ? 0 : .6}"/></g>`;
  }
  return g;
}

return { PAPER, shape };
})();
