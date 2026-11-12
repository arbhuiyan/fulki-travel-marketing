'use strict';
/* Fulki Travel & Tours: 60-second promo, "Your Next Departure".
   Everything is drawn on one canvas as a pure function of time: render(t).
   ?w=1920&h=1080 → 16:9, ?w=1080&h=1920 → 9:16. */

const cv = document.getElementById('c');
const X = cv.getContext('2d');
const Q = new URLSearchParams(location.search);
const W = +(Q.get('w') || 1920), H = +(Q.get('h') || 1080);
cv.width = W; cv.height = H;
const LAND = W >= H;
const CX = W / 2;
const DUR = 60;

const C = {
  orange: '#EA580C', orange2: '#F97316', night: '#0C0A09', white: '#FAFAF9',
  light: '#D6D3D1', grey: '#A8A29E', dim: '#57534E',
  tileT: '#25211F', tileB: '#1C1917', panel: '#120F0E', edge: '#2B2623',
};

/* ---------- helpers ---------- */
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const eo = x => 1 - Math.pow(1 - x, 3);
const eback = x => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const fade = (t, a, b, c, d) => Math.min(eo(seg(t, a, b)), 1 - eio(seg(t, c, d)));
function hash(n) {
  n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3); n ^= n >>> 4;
  n = Math.imul(n, 0x27d4eb2d); n ^= n >>> 15; return (n >>> 0) / 4294967296;
}
function rr(x, y, w, h, r) { X.beginPath(); X.roundRect(x, y, w, h, r); }
function alpha(a, fn) { if (a <= 0.001) return; X.save(); X.globalAlpha *= a; fn(); X.restore(); }

function txt(s, x, y, o = {}) {
  const { size = 48, weight = 600, font = 'Outfit', color = C.white, align = 'center', ls = 0 } = o;
  X.font = `${weight} ${size}px ${font}`; X.fillStyle = color; X.textAlign = align;
  X.textBaseline = 'alphabetic'; X.letterSpacing = ls + 'px';
  // letter-spacing adds a trailing gap; shift centred text back by half of it
  X.fillText(s, align === 'center' ? x + ls / 2 : x, y);
  X.letterSpacing = '0px';
}
/* a centred line made of styled parts, optionally led by an icon */
function richLine(parts, cx, y, icon, iconSize, gapK = 0.55) {
  let w = 0; const ws = [];
  for (const p of parts) {
    X.font = `${p.weight || 500} ${p.size}px ${p.font || 'Manrope'}`;
    X.letterSpacing = (p.ls || 0) + 'px';
    const m = X.measureText(p.text).width; ws.push(m); w += m;
  }
  X.letterSpacing = '0px';
  const iw = icon ? iconSize * (1 + gapK) : 0;
  let x = cx - (w + iw) / 2;
  if (icon) { icon(x + iconSize / 2, y - parts[0].size * 0.36, iconSize, C.orange); x += iw; }
  parts.forEach((p, i) => { txt(p.text, x, y, { ...p, font: p.font || 'Manrope', weight: p.weight || 500, align: 'left' }); x += ws[i]; });
}

/* ---------- brand shapes ---------- */
const F_PATH = new Path2D('M15.18 0V-170.16H58.08V0ZM49.08 -63.54V-99.72H133.44V-63.54ZM49.08 -133.98V-170.16H137.16V-133.98Z');
const PLANE = new Path2D('M50 0C50 -3.6 46.5 -5.6 41 -5.6H15L-4 -40.5C-5 -42.3 -6.6 -43 -8.6 -43H-13.4C-15 -43 -15.9 -41.8 -15.4 -40.3L-6.4 -5.6H-31L-39.6 -17.4C-40.4 -18.5 -41.4 -19 -42.8 -19H-46.4C-47.7 -19 -48.4 -18 -48 -16.8L-44.2 -4.2C-44.6 -2.8 -44.6 2.8 -44.2 4.2L-48 16.8C-48.4 18 -47.7 19 -46.4 19H-42.8C-41.4 19 -40.4 18.5 -39.6 17.4L-31 5.6H-6.4L-15.4 40.3C-15.9 41.8 -15 43 -13.4 43H-8.6C-6.6 43 -5 42.3 -4 40.5L15 5.6H41C46.5 5.6 50 3.6 50 0Z');
function drawF(cx, cy, size, color) {
  const k = size / 170.16;
  X.save(); X.translate(cx - 76.17 * k, cy + 85.08 * k); X.scale(k, k);
  X.fillStyle = color; X.fill(F_PATH); X.restore();
}
function drawPlane(x, y, k, rot, color) {
  X.save(); X.translate(x, y); X.rotate(rot); X.scale(k, k);
  X.fillStyle = color; X.fill(PLANE); X.restore();
}
const LOGO = {}; // filled from the reversed lockup SVG in init()

/* ---------- icons (line style) ---------- */
function stroke(S, c) { X.strokeStyle = c; X.lineWidth = S * 0.075; X.lineCap = 'round'; X.lineJoin = 'round'; }
const ICON = {
  bars(cx, cy, S, c) {
    const w = S * 0.2, g = S * 0.1, base = cy + S * 0.4, hs = [0.72, 0.42, 0.95];
    hs.forEach((h, i) => {
      const x = cx - S * 0.4 + i * (w + g), hh = h * S * 0.8;
      rr(x, base - hh, w, hh, S * 0.04);
      if (i === 1) { X.fillStyle = c; X.fill(); } else { stroke(S, C.light); X.stroke(); }
    });
    stroke(S, c); X.beginPath(); // little "best price" tick above the low bar
    const mx = cx - S * 0.4 + w + g + w / 2, my = base - 0.42 * S * 0.8 - S * 0.2;
    X.moveTo(mx - S * 0.1, my); X.lineTo(mx - S * 0.02, my + S * 0.08); X.lineTo(mx + S * 0.12, my - S * 0.08); X.stroke();
  },
  ticket(cx, cy, S, c) {
    X.save(); X.translate(cx, cy); X.rotate(-0.2);
    const w = S * 0.95, h = S * 0.58;
    stroke(S, C.light); rr(-w / 2, -h / 2, w, h, S * 0.08); X.stroke();
    X.setLineDash([S * 0.05, S * 0.06]); X.beginPath(); X.moveTo(w * 0.18, -h / 2 + S * 0.06); X.lineTo(w * 0.18, h / 2 - S * 0.06); X.stroke(); X.setLineDash([]);
    stroke(S, c); X.beginPath(); X.moveTo(-w * 0.3, 0); X.lineTo(-w * 0.14, h * 0.2); X.lineTo(w * 0.04, -h * 0.22); X.stroke();
    X.restore();
  },
  person(cx, cy, S, c) {
    stroke(S, C.light);
    X.beginPath(); X.arc(cx - S * 0.12, cy - S * 0.08, S * 0.16, 0, Math.PI * 2); X.stroke();
    X.beginPath(); X.arc(cx - S * 0.12, cy + S * 0.46, S * 0.3, Math.PI * 1.08, Math.PI * 1.92); X.stroke();
    X.fillStyle = c; rr(cx + S * 0.06, cy - S * 0.5, S * 0.44, S * 0.3, S * 0.08); X.fill();
    X.beginPath(); X.moveTo(cx + S * 0.12, cy - S * 0.22); X.lineTo(cx + S * 0.1, cy - S * 0.1); X.lineTo(cx + S * 0.22, cy - S * 0.22); X.fill();
    X.fillStyle = C.night;
    for (let i = 0; i < 3; i++) { X.beginPath(); X.arc(cx + S * (0.17 + i * 0.11), cy - S * 0.35, S * 0.03, 0, 7); X.fill(); }
  },
  office(cx, cy, S, c) {
    stroke(S, C.light); rr(cx - S * 0.3, cy - S * 0.42, S * 0.6, S * 0.84, S * 0.04); X.stroke();
    X.fillStyle = c;
    for (let r = 0; r < 3; r++) for (let k = 0; k < 2; k++) X.fillRect(cx - S * 0.18 + k * S * 0.24, cy - S * 0.3 + r * S * 0.19, S * 0.12, S * 0.1);
    X.fillRect(cx - S * 0.07, cy + S * 0.24, S * 0.14, S * 0.18);
    X.beginPath(); X.moveTo(cx - S * 0.45, cy + S * 0.42); X.lineTo(cx + S * 0.45, cy + S * 0.42); X.stroke();
  },
  phone(cx, cy, S, c) {
    stroke(S, C.light); rr(cx - S * 0.24, cy - S * 0.44, S * 0.48, S * 0.88, S * 0.09); X.stroke();
    X.beginPath(); X.moveTo(cx - S * 0.06, cy - S * 0.33); X.lineTo(cx + S * 0.06, cy - S * 0.33); X.stroke();
    X.fillStyle = c; X.beginPath(); X.arc(cx, cy + S * 0.3, S * 0.05, 0, 7); X.fill();
    stroke(S, c);
    for (const r of [0.14, 0.26]) { X.beginPath(); X.arc(cx + S * 0.24, cy - S * 0.28, S * r, -Math.PI * 0.42, Math.PI * 0.05); X.stroke(); }
  },
  chat(cx, cy, S, c) {
    stroke(S, C.light);
    X.beginPath(); X.roundRect(cx - S * 0.45, cy - S * 0.36, S * 0.9, S * 0.6, S * 0.18); X.stroke();
    X.beginPath(); X.moveTo(cx - S * 0.26, cy + S * 0.24); X.lineTo(cx - S * 0.34, cy + S * 0.44); X.lineTo(cx - S * 0.06, cy + S * 0.24); X.stroke();
    X.fillStyle = c;
    for (let i = -1; i <= 1; i++) { X.beginPath(); X.arc(cx + i * S * 0.2, cy - S * 0.06, S * 0.06, 0, 7); X.fill(); }
  },
  pin(cx, cy, S, c) {
    stroke(S, c); X.beginPath();
    X.arc(cx, cy - S * 0.12, S * 0.3, Math.PI * 0.8, Math.PI * 2.2); X.lineTo(cx, cy + S * 0.46); X.closePath(); X.stroke();
    X.beginPath(); X.arc(cx, cy - S * 0.12, S * 0.1, 0, 7); X.fillStyle = c; X.fill();
  },
  globe(cx, cy, S, c) {
    stroke(S, c); X.beginPath(); X.arc(cx, cy, S * 0.42, 0, 7); X.stroke();
    X.beginPath(); X.ellipse(cx, cy, S * 0.18, S * 0.42, 0, 0, 7); X.stroke();
    X.beginPath(); X.moveTo(cx - S * 0.42, cy); X.lineTo(cx + S * 0.42, cy); X.stroke();
  },
  insta(cx, cy, S, c) {
    stroke(S, c); rr(cx - S * 0.4, cy - S * 0.4, S * 0.8, S * 0.8, S * 0.24); X.stroke();
    X.beginPath(); X.arc(cx, cy, S * 0.18, 0, 7); X.stroke();
    X.fillStyle = c; X.beginPath(); X.arc(cx + S * 0.22, cy - S * 0.22, S * 0.05, 0, 7); X.fill();
  },
};

/* ---------- split-flap engine ---------- */
const CHARS = 'ABCDEFGHIJKLMNOPRSTUVWXYZ0123456789';
const FD = 0.055;                 // seconds per flap fall
const BOARDS = [];
const EXTRA_CLICKS = [];          // [time, size, x] for cards that flip as one piece

function glyph(ch, color, x, y, w, h) {
  if (ch === ' ') return;
  if (ch === 'Ƒ') { drawF(x + w / 2, y + h / 2, h * 0.56, color); return; }
  const fs = h * 0.62;
  X.fillStyle = color; X.font = `600 ${fs}px Outfit`; X.textAlign = 'center';
  X.textBaseline = 'alphabetic'; X.letterSpacing = '0px';
  X.fillText(ch, x + w / 2, y + h / 2 + fs * 0.355);
}
function half(x, y, w, h, content, top, sy, shade) {
  const m = y + h / 2, r = Math.min(w, h) * 0.08;
  X.save();
  if (sy !== 1) { X.translate(0, m); X.scale(1, Math.max(sy, 0.0001)); X.translate(0, -m); }
  X.beginPath(); top ? X.rect(x - 1, y - 1, w + 2, h / 2 + 1) : X.rect(x - 1, m, w + 2, h / 2 + 1); X.clip();
  rr(x, y, w, h, r); X.fillStyle = top ? C.tileT : C.tileB; X.fill();
  if (content) content(x, y, w, h);
  if (shade > 0) { rr(x, y, w, h, r); X.fillStyle = `rgba(0,0,0,${shade})`; X.fill(); }
  X.restore();
}
/* A → B; p in [0,1]. The top flap falls over the hinge, then the bottom flap lands. */
function flapTile(x, y, w, h, A, B, p) {
  if (!B || p <= 0) { half(x, y, w, h, A, true, 1, 0); half(x, y, w, h, A, false, 1, 0); }
  else if (p >= 1) { half(x, y, w, h, B, true, 1, 0); half(x, y, w, h, B, false, 1, 0); }
  else {
    half(x, y, w, h, B, true, 1, 0.25 * (1 - p));
    half(x, y, w, h, A, false, 1, 0.3 * p);
    const c = Math.cos(p * Math.PI);
    if (p < 0.5) half(x, y, w, h, A, true, c, p * 0.8);
    else half(x, y, w, h, B, false, -c, (1 - p) * 0.8);
  }
  X.fillStyle = 'rgba(0,0,0,0.9)';
  const lw = Math.max(2, h * 0.022);
  X.fillRect(x, y + h / 2 - lw / 2, w, lw);
}

function Board(cols, rows, cw, ch, gap) {
  const b = { id: BOARDS.length + 1, cols, rows, cw, ch, gap, w: cols * cw + (cols - 1) * gap, h: rows * ch + (rows - 1) * gap, tr: Array.from({ length: rows }, () => []), x: 0 };
  BOARDS.push(b); return b;
}
function cellsOf(spec, cols, align) {
  const segs = typeof spec === 'string' ? [[spec, C.white]] : spec;
  let arr = [];
  for (const [s, col] of segs) for (const ch of s) arr.push({ ch, color: col });
  arr = arr.slice(0, cols);
  const pad = cols - arr.length, left = align === 'center' ? Math.floor(pad / 2) : align === 'right' ? pad : 0;
  const blank = () => ({ ch: ' ', color: C.white });
  return [...Array.from({ length: left }, blank), ...arr, ...Array.from({ length: pad - left }, blank)];
}
function flip(b, t, lines, o = {}) {
  for (let r = 0; r < b.rows; r++) b.tr[r].push({
    t, cells: cellsOf(lines[r] ?? '', b.cols, o.align || 'left'), spinAll: !!o.spinAll,
    min: o.min ?? 3, vary: o.vary ?? 7, stagger: o.stagger ?? 0.03, rowStagger: o.rowStagger ?? 0.07,
  });
}
function cellPlan(b, r, c, k) {
  const tr = b.tr[r][k];
  const prev = k > 0 ? b.tr[r][k - 1].cells[c] : { ch: ' ', color: C.white };
  const to = tr.cells[c];
  const seed = b.id * 7919 + r * 131 + c * 17 + k * 1009;
  const same = prev.ch === to.ch && prev.color === to.color;
  const n = (same && !tr.spinAll) ? -1 : tr.min + Math.floor(hash(seed) * tr.vary);
  const start = tr.t + c * tr.stagger + r * tr.rowStagger + hash(seed + 3) * 0.04;
  return { prev, to, n, start, seed };
}
function seqChar(pl, i) {
  if (i <= 0) return pl.prev;
  if (i > pl.n) return pl.to;
  return { ch: CHARS[Math.floor(hash(pl.seed + 11 * i) * CHARS.length)], color: pl.to.ch === ' ' ? pl.prev.color : pl.to.color };
}
function cellState(b, r, c, t) {
  const trs = b.tr[r]; let k = -1;
  for (let i = 0; i < trs.length; i++) if (trs[i].t <= t) k = i;
  if (k < 0) return { A: { ch: ' ', color: C.white }, p: 0 };
  const pl = cellPlan(b, r, c, k);
  if (pl.n < 0) return { A: pl.to, p: 0 };
  const l = t - pl.start;
  if (l < 0) return { A: pl.prev, p: 0 };
  const i = Math.floor(l / FD);
  if (i > pl.n) return { A: pl.to, p: 0 };
  return { A: seqChar(pl, i), B: seqChar(pl, i + 1), p: (l - i * FD) / FD };
}
const gfn = cell => (x, y, w, h) => glyph(cell.ch, cell.color, x, y, w, h);
function drawBoard(b, t, ox, oy, o = {}) {
  b.x = ox;
  if (o.panel !== false) {
    const p = b.cw * 0.32;
    rr(ox - p, oy - p, b.w + 2 * p, b.h + 2 * p, p * 0.8);
    X.fillStyle = C.panel; X.fill(); X.strokeStyle = C.edge; X.lineWidth = 2; X.stroke();
  }
  for (let r = 0; r < b.rows; r++) for (let c = 0; c < b.cols; c++) {
    const st = cellState(b, r, c, t);
    flapTile(ox + c * (b.cw + b.gap), oy + r * (b.ch + b.gap), b.cw, b.ch, gfn(st.A), st.B ? gfn(st.B) : null, st.p);
  }
}
function boardDims(cols, totalW, gap) { const cw = (totalW - (cols - 1) * gap) / cols; return [cw, cw * 1.38]; }

/* ---------- layouts & timeline data ---------- */
const S1 = {}, S2 = {}, S3 = {}, S4 = {}, S5 = {}, S6 = {};

function initLayouts() {
  /* Scene 1: departures board, "TAKE A JOURNEY WITH US" */
  {
    const cols = LAND ? 18 : 12, rows = LAND ? 4 : 5, gap = LAND ? 8 : 7;
    const [cw, ch] = boardDims(cols, LAND ? 1480 : 940, gap);
    const b = S1.b = Board(cols, rows, cw, ch, gap);
    const hh = S1.hh = ch * 0.66;
    const total = hh + 40 + b.h + 40 + 40;
    S1.x = CX - b.w / 2;
    S1.y = (H - total) / 2 + hh + 40;
    S1.hy = S1.y - 40 - hh - b.cw * 0.32;
    S1.ft = { x: S1.x - b.cw * 0.32, y: S1.hy, w: hh * 0.8, h: hh };
    const msg = LAND ? ['', 'TAKE A JOURNEY', [['WITH US', C.orange]], '']
                     : ['', 'TAKE A', 'JOURNEY', [['WITH US', C.orange]], ''];
    flip(b, 5.2, msg, { align: 'center', spinAll: true, min: 5, vary: 10, stagger: 0.035, rowStagger: 0.06 });
    flip(b, 11.2, [], { min: 2, vary: 4, stagger: 0.02, rowStagger: 0.03 });
    const clk = S1.clk = Board(5, 1, hh * 0.64, hh, 4);
    S1.clkX = S1.x + b.w + b.cw * 0.32 - clk.w;
    flip(clk, -3, ['09:45']);
    flip(clk, 8.2, ['10:30'], { min: 2, vary: 5, stagger: 0.07 });
  }
  /* Scene 2 + 3a: destinations, then ARRIVALS / DHAKA */
  {
    const hch = LAND ? 54 : 62, hcw = hch / 1.38;
    const hdr = S2.hdr = Board(10, 1, hcw, hch, 4);
    const cols = LAND ? 18 : 12, rows = LAND ? 1 : 2, gap = LAND ? 7 : 7;
    const [cw, ch] = boardDims(cols, LAND ? 1300 : 900, gap);
    const d = S2.d = Board(cols, rows, cw, ch, gap);
    S2.hy = LAND ? 96 : 330;
    S2.dy = S2.hy + hch + 34;
    S2.box = LAND ? { x: CX - 500, y: S2.dy + d.h + 40, k: 1 } : { x: CX - 500, y: 700, k: 1 };
    S2.capY = LAND ? 1012 : 1480;
    const dests = [['PARIS', 'CDG', '10:30', 12.0], ['DUBAI', 'DXB', '12:05', 14.8], ['NEW YORK', 'JFK', '14:20', 17.4], ['TOKYO', 'HND', '16:40', 19.8]];
    S2.dests = dests;
    flip(hdr, 12.0, ['DEPARTURES'], { spinAll: true, min: 4, vary: 6, align: 'center' });
    dests.forEach(([city, code, time, t], i) => {
      const lines = LAND ? [[[city.padEnd(9), C.white], [code + ' ', C.grey], [time, C.orange]]]
                         : [[[city, C.white]], [[code.padEnd(7), C.grey], [time, C.orange]]];
      flip(d, t + 0.1, lines, i === 0 ? { spinAll: true, min: 4, vary: 8 } : { min: 3, vary: 6, stagger: 0.025 });
    });
    flip(hdr, 22.2, [[['ARRIVALS', C.orange]]], { align: 'center', min: 3, vary: 6 });
    flip(d, 22.3, LAND ? [[['DHAKA  ', C.white], ['DAC ', C.grey], ['ON TIME', C.orange]]]
                       : [[['DHAKA', C.white]], [['DAC  ', C.grey], ['ON TIME', C.orange]]], { min: 3, vary: 6, stagger: 0.025 });
    // globe
    S3.g = LAND ? { cx: CX, cy: S2.box.y + 320, r: 290 } : { cx: CX, cy: 1060, r: 400 };
    // figures
    S3.ground = LAND ? 930 : 1520;
    S3.fh = LAND ? 270 : 330;
    S3.R = LAND ? 360 : 440;
  }
  /* Scene 4: why Fulki */
  {
    const cols = LAND ? 24 : 12, rows = LAND ? 1 : 2, gap = 6;
    const tw = LAND ? 1380 : 820;
    const [cw, ch] = boardDims(cols, tw, gap);
    const icon = LAND ? 104 : 118, ig = LAND ? 40 : 34;
    const x0 = CX - (icon + ig + tw) / 2;
    const L1 = LAND
      ? [[[['WE COMPARE ', C.white], ['AIRLINES', C.orange]]], [[['WE BOOK THE ', C.white], ['RIGHT FLIGHT', C.orange]]], [[['WE STAY ', C.white], ['WITH YOU', C.orange]]]]
      : [[[['WE COMPARE', C.white]], [['AIRLINES', C.orange]]], [[['WE BOOK THE', C.white]], [['RIGHT FLIGHT', C.orange]]], [[['WE STAY', C.white]], [['WITH YOU', C.orange]]]];
    const ys = LAND ? [300, 450, 600] : [540, 800, 1060];
    const times = [34.4, 36.8, 39.2];
    const icons = [ICON.bars, ICON.ticket, ICON.person];
    S4.items = L1.map((lines, i) => {
      const b = Board(cols, rows, cw, ch, gap);
      flip(b, times[i], lines, { min: 3, vary: 6, stagger: 0.028 });
      return { b, t: times[i], icon: icons[i], ix: x0 + icon / 2, iy: ys[i], isz: icon, bx: x0 + icon + ig, by: ys[i] - b.h / 2 };
    });
    S4.hy = LAND ? 190 : 370;
  }
  /* Scene 5: how to reach us + B2B */
  {
    const labels = ['In the office', 'By phone', 'On WhatsApp'];
    const details = ['Via 4 Martiri, 44 · Arzignano', '+39 0444 022494', 'Send us your dates'];
    const icons = [ICON.office, ICON.phone, ICON.chat];
    const tin = [44.3, 44.6, 44.9], tout = [51.1, 51.25, 51.4];
    S5.cards = labels.map((label, i) => {
      const r = LAND ? { w: 470, h: 300 } : { w: 860, h: 220 };
      if (LAND) { r.x = CX - (3 * 470 + 2 * 50) / 2 + i * 520; r.y = 150; }
      else { r.x = CX - 430; r.y = 250 + i * 252; }
      const content = (x, y, w, h) => {
        if (LAND) {
          icons[i](x + w / 2, y + h * 0.3, h * 0.28, C.orange);
          txt(label, x + w / 2, y + h * 0.7, { size: 46, weight: 600 });
          txt(details[i], x + w / 2, y + h * 0.86, { size: 26, weight: 500, font: 'Manrope', color: C.grey });
        } else {
          icons[i](x + h * 0.52, y + h / 2, h * 0.4, C.orange);
          txt(label, x + h * 1.0, y + h * 0.44, { size: 54, weight: 600, align: 'left' });
          txt(details[i], x + h * 1.0, y + h * 0.75, { size: 32, weight: 500, font: 'Manrope', color: C.grey, align: 'left' });
        }
      };
      EXTRA_CLICKS.push([tin[i] + 0.42, 400, (r.x + r.w / 2) / W], [tout[i] + 0.38, 400, (r.x + r.w / 2) / W]);
      return { ...r, content, tin: tin[i], tout: tout[i] };
    });
    const cols = LAND ? 20 : 12, rows = LAND ? 1 : 2;
    const [cw, ch] = boardDims(cols, LAND ? 1240 : 900, 6);
    const b = S5.b2b = Board(cols, rows, cw, ch, 6);
    S5.by = LAND ? 590 : 1120;
    flip(b, 47.3, LAND ? [[['B2B', C.orange], [' PARTNERS WELCOME', C.white]]] : [[['B2B', C.orange], [' PARTNERS', C.white]], 'WELCOME'], { align: 'center', min: 3, vary: 6 });
    flip(b, 51.1, [], { min: 1, vary: 3, stagger: 0.015 });
  }
  /* Scene 6: logo + contact */
  {
    S6.k = LAND ? 0.95 : 1.06;
    S6.ox = CX - 455 * S6.k;
    S6.oy = (LAND ? 110 : 420) - 75 * S6.k;
    S6.cy = LAND ? 650 : 1060;
  }
}

/* ---------- background ---------- */
function background(t) {
  X.fillStyle = C.night; X.fillRect(0, 0, W, H);
  const g = X.createRadialGradient(CX, H * 0.48, 0, CX, H * 0.48, Math.max(W, H) * 0.65);
  g.addColorStop(0, 'rgba(234,88,12,0.075)'); g.addColorStop(1, 'rgba(234,88,12,0)');
  X.fillStyle = g; X.fillRect(0, 0, W, H);
}

/* ---------- FLIP 0: the F card and the plane ---------- */
function bez(p0, p1, p2, p3, u) {
  const v = 1 - u;
  return [v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0],
          v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1]];
}
const fTile = (x, y, w, h) => drawF(x + w / 2, y + h / 2, h * 0.56, C.orange);
function scene0(t) {
  if (t >= 5.0) return;
  const bw = LAND ? 330 : 380, bh = bw * 1.25;
  const bx = CX - bw / 2, by = H / 2 - bh / 2;
  const m = eio(seg(t, 3.9, 4.95)), ft = S1.ft;
  const x = lerp(bx, ft.x, m), y = lerp(by, ft.y, m), w = lerp(bw, ft.w, m), h = lerp(bh, ft.h, m);
  const a = eo(seg(t, 0.15, 0.6)), sc = lerp(0.9, 1, a);
  // glow behind the card
  alpha(a * (1 - m), () => {
    const g = X.createRadialGradient(CX, H / 2, 0, CX, H / 2, bh);
    g.addColorStop(0, 'rgba(234,88,12,0.22)'); g.addColorStop(1, 'rgba(234,88,12,0)');
    X.fillStyle = g; X.fillRect(0, 0, W, H);
  });
  alpha(a, () => {
    X.translate(x + w / 2, y + h / 2); X.scale(sc, sc); X.translate(-(x + w / 2), -(y + h / 2));
    flapTile(x, y, w, h, null, fTile, eio(seg(t, 0.8, 1.25)));
  });
  // plane leaves from the F's middle arm, drawing a contrail
  if (t > 1.5 && t < 4.4) {
    const k = bh * 0.56 / 170.16;
    const p0 = [CX + 62 * k, H / 2 + 3.45 * k];
    const p1 = [p0[0] + W * 0.22, p0[1] + 10], p2 = [W * 0.78, H * (LAND ? 0.42 : 0.36)], p3 = [W + 260, H * (LAND ? -0.05 : 0.08)];
    const u = Math.pow(seg(t, 1.5, 3.9), 1.55);
    const ta = 1 - seg(t, 3.4, 4.3);
    const N = 70, u0 = Math.max(0, u - 0.62);
    let prev = bez(p0, p1, p2, p3, u0);
    for (let i = 1; i <= N; i++) {
      const uu = lerp(u0, u, i / N), pt = bez(p0, p1, p2, p3, uu), f = i / N;
      X.strokeStyle = `rgba(234,88,12,${0.85 * f * f * ta})`; X.lineWidth = lerp(2, 9, f);
      X.lineCap = 'round'; X.beginPath(); X.moveTo(prev[0], prev[1]); X.lineTo(pt[0], pt[1]); X.stroke();
      prev = pt;
    }
    if (u < 1) {
      const p = bez(p0, p1, p2, p3, u), q = bez(p0, p1, p2, p3, Math.min(1, u + 0.01));
      const ks = (LAND ? 1.05 : 1.2) * (0.35 + 0.65 * eo(seg(t, 1.5, 1.85)));
      drawPlane(p[0], p[1], ks, Math.atan2(q[1] - p[1], q[0] - p[0]), C.orange);
    }
  }
}

/* ---------- FLIP 1: TAKE A JOURNEY WITH US ---------- */
function scene1(t) {
  const a = Math.min(eo(seg(t, 4.3, 4.95)), 1 - seg(t, 11.85, 12.3));
  alpha(a, () => {
    const b = S1.b, hh = S1.hh, ft = S1.ft;
    drawBoard(b, t, S1.x, S1.y);
    txt('DEPARTURES', ft.x + ft.w + hh * 0.42, S1.hy + hh / 2 + hh * 0.48 * 0.36, { size: hh * 0.48, ls: hh * 0.14, align: 'left', color: C.light });
    drawBoard(S1.clk, t, S1.clkX, S1.hy, { panel: false });
    const fy = S1.y + b.h + b.cw * 0.32 + 62;
    const on = t > 6.9 ? (Math.sin((t - 6.9) * Math.PI * 2 * 1.1) > -0.2 ? 1 : 0.25) : 0.3;
    const fs = LAND ? 30 : 32;
    X.fillStyle = C.orange; X.globalAlpha *= on; X.beginPath(); X.arc(S1.x - b.cw * 0.32 + 12, fy - fs * 0.36, 10, 0, 7); X.fill(); X.globalAlpha /= on;
    txt('BOARDING', S1.x - b.cw * 0.32 + 38, fy, { size: fs, ls: 7, align: 'left', color: C.orange });
    txt('GATE F1', S1.x + b.w + b.cw * 0.32 - 7, fy, { size: fs, ls: 7, align: 'right', color: C.grey });
    if (t >= 5.0) flapTile(ft.x, ft.y, ft.w, ft.h, fTile, null, 0);
  });
}

/* ---------- FLIP 2: see the world (skylines) ---------- */
const SKY = {
  paris(c) {
    const P = new Path2D();
    // Eiffel tower
    P.moveTo(350, 560); P.quadraticCurveTo(440, 340, 482, 170); P.lineTo(494, 92);
    P.moveTo(650, 560); P.quadraticCurveTo(560, 340, 518, 170); P.lineTo(506, 92);
    P.moveTo(392, 560); P.quadraticCurveTo(500, 400, 608, 560);
    P.moveTo(392, 432); P.lineTo(608, 432); P.moveTo(400, 448); P.lineTo(600, 448);
    P.moveTo(452, 300); P.lineTo(548, 300);
    P.moveTo(474, 196); P.lineTo(526, 196);
    P.moveTo(420, 432); P.lineTo(462, 300); P.moveTo(440, 432); P.lineTo(458, 330);
    P.moveTo(580, 432); P.lineTo(538, 300); P.moveTo(560, 432); P.lineTo(542, 330);
    P.moveTo(462, 300); P.lineTo(530, 196); P.moveTo(538, 300); P.lineTo(470, 196);
    P.rect(490, 76, 20, 18); P.moveTo(500, 76); P.lineTo(500, 28);
    // Paris rooftops
    const roofs = (x0, dir) => { let x = x0; for (const [w, h] of [[70, 92], [60, 120], [80, 80], [64, 106], [56, 70]]) { const nx = x + dir * w; P.moveTo(x, 560); P.lineTo(x, 560 - h + 18); P.lineTo(x + dir * 10, 560 - h); P.lineTo(nx - dir * 10, 560 - h); P.lineTo(nx, 560 - h + 18); P.lineTo(nx, 560); x = nx + dir * 6; } };
    roofs(10, 1); roofs(990, -1);
    return { P, sun: [800, 170, 48, false] };
  },
  dubai() {
    const P = new Path2D();
    const steps = [[60, 560], [60, 462], [46, 462], [46, 362], [33, 362], [33, 268], [22, 268], [22, 182], [13, 182], [13, 112], [4, 112], [3, 14]];
    const cx = 520; P.moveTo(cx - steps[0][0], 560);
    for (const [w, y] of steps) P.lineTo(cx - w, y);
    for (let i = steps.length - 1; i >= 0; i--) P.lineTo(cx + steps[i][0], steps[i][1]);
    P.moveTo(cx - 20, 462); P.lineTo(cx - 20, 560); P.moveTo(cx + 20, 362); P.lineTo(cx + 20, 560);
    for (const [x, w, h] of [[120, 64, 300], [210, 54, 230], [300, 70, 180], [640, 70, 260], [730, 50, 200]]) { P.rect(x, 560 - h, w, h); P.moveTo(x + w / 2, 560 - h); P.lineTo(x + w / 2, 560 - h - 30); }
    // sail hotel
    P.moveTo(900, 560); P.lineTo(900, 290); P.quadraticCurveTo(820, 400, 836, 560); P.moveTo(900, 290); P.lineTo(906, 250);
    // dunes
    P.moveTo(0, 590); P.quadraticCurveTo(160, 560, 320, 588); P.quadraticCurveTo(470, 610, 640, 584); P.quadraticCurveTo(820, 560, 1000, 592);
    return { P, sun: [240, 560, 120, true] };
  },
  ny() {
    const P = new Path2D();
    const e = [[50, 560], [50, 262], [36, 262], [36, 202], [22, 202], [22, 152], [10, 152], [10, 112], [2, 112], [2, 46]];
    const cx = 420; P.moveTo(cx - 50, 560);
    for (const [w, y] of e) P.lineTo(cx - w, y);
    for (let i = e.length - 1; i >= 0; i--) P.lineTo(cx + e[i][0], e[i][1]);
    for (const [x, w, h] of [[10, 70, 230], [90, 60, 310], [160, 84, 180], [254, 96, 250], [480, 70, 200], [662, 60, 150]]) P.rect(x, 560 - h, w, h);
    // spire-topped tower
    P.moveTo(560, 560); P.lineTo(560, 250); P.lineTo(610, 250); P.lineTo(610, 560);
    P.moveTo(560, 250); P.quadraticCurveTo(585, 200, 610, 250); P.moveTo(570, 232); P.quadraticCurveTo(585, 196, 600, 232); P.moveTo(585, 210); P.lineTo(585, 150);
    // statue on its pedestal
    P.moveTo(780, 560); P.lineTo(792, 480); P.lineTo(868, 480); P.lineTo(880, 560);
    P.moveTo(800, 480); P.lineTo(820, 352); P.lineTo(840, 352); P.lineTo(860, 480);
    P.moveTo(842, 348); P.arc(830, 338, 12, 0, Math.PI * 2);
    for (const a of [-2.2, -1.85, -1.57, -1.29, -0.94]) { P.moveTo(830 + Math.cos(a) * 13, 338 + Math.sin(a) * 13); P.lineTo(830 + Math.cos(a) * 26, 338 + Math.sin(a) * 26); }
    P.moveTo(840, 362); P.lineTo(862, 272); P.moveTo(822, 380); P.lineTo(806, 404); P.rect(796, 400, 14, 22);
    // water
    P.moveTo(700, 590); P.quadraticCurveTo(760, 580, 820, 590); P.quadraticCurveTo(880, 600, 960, 588);
    return { P, sun: [740, 150, 44, false], torch: [863, 258] };
  },
  tokyo() {
    const P = new Path2D();
    P.moveTo(40, 560); P.lineTo(370, 214); P.quadraticCurveTo(400, 196, 430, 204); P.quadraticCurveTo(460, 196, 490, 214); P.lineTo(820, 560);
    P.moveTo(318, 270); P.lineTo(350, 300); P.lineTo(380, 268); P.lineTo(410, 306); P.lineTo(440, 266); P.lineTo(470, 300); P.lineTo(500, 262); P.lineTo(540, 270);
    for (const [x, w, h] of [[20, 50, 70], [80, 40, 100], [130, 60, 60], [880, 50, 90], [940, 46, 130]]) P.rect(x, 560 - h, w, h);
    // tower
    P.moveTo(170, 560); P.lineTo(200, 300); P.lineTo(230, 560); P.moveTo(186, 420); P.lineTo(214, 420); P.moveTo(200, 300); P.lineTo(200, 250);
    return { P, sun: [760, 160, 66, false], torii: true };
  },
};
function drawSkyline(name, t0, t, box) {
  const a = fade(t, t0 + 0.05, t0 + 0.5, t0 + (name === 'tokyo' ? 2.0 : 2.45), t0 + (name === 'tokyo' ? 2.4 : 2.75));
  if (a <= 0) return;
  const d = SKY[name](), rev = eio(seg(t, t0 + 0.05, t0 + 1.0)), drift = (t - t0) * 6;
  alpha(a, () => {
    X.save(); X.translate(box.x, box.y); X.scale(box.k, box.k);
    // warm wash
    const g = X.createRadialGradient(500, 420, 0, 500, 420, 560);
    g.addColorStop(0, 'rgba(234,88,12,0.16)'); g.addColorStop(1, 'rgba(234,88,12,0)');
    X.fillStyle = g; X.fillRect(-200, -100, 1400, 800);
    X.beginPath(); X.rect(-20 - drift, -40, (1040) * rev + 20, 700); X.clip();
    X.translate(-drift, 0);
    // sun / moon
    const [sx, sy, sr, halfDisc] = d.sun;
    X.fillStyle = C.orange;
    X.beginPath(); halfDisc ? X.arc(sx, sy, sr, Math.PI, 0) : X.arc(sx, sy, sr, 0, Math.PI * 2);
    if (name === 'tokyo' || halfDisc) X.fill(); else { X.strokeStyle = C.orange; X.lineWidth = 4; X.stroke(); }
    X.strokeStyle = 'rgba(250,250,249,0.88)'; X.lineWidth = 3.2; X.lineCap = 'round'; X.lineJoin = 'round';
    X.stroke(d.P);
    if (d.torch) { X.fillStyle = C.orange; X.beginPath(); X.ellipse(d.torch[0], d.torch[1], 7, 12, 0.25, 0, 7); X.fill(); }
    if (d.torii) {
      X.fillStyle = C.orange;
      X.fillRect(724, 352, 18, 208); X.fillRect(838, 352, 18, 208);
      X.fillRect(702, 384, 176, 14);
      X.beginPath(); X.moveTo(680, 334); X.quadraticCurveTo(790, 352, 900, 334); X.lineTo(896, 350); X.quadraticCurveTo(790, 366, 684, 350); X.closePath(); X.fill();
      X.fillRect(782, 352, 16, 32);
    }
    // ground
    const lg = X.createLinearGradient(0, 0, 1000, 0);
    lg.addColorStop(0, 'rgba(234,88,12,0)'); lg.addColorStop(0.5, 'rgba(234,88,12,0.9)'); lg.addColorStop(1, 'rgba(234,88,12,0)');
    X.strokeStyle = lg; X.lineWidth = 3; X.beginPath(); X.moveTo(-60, 560); X.lineTo(1060, 560); X.stroke();
    X.restore();
  });
}
function scene2(t) {
  if (t < 11.8 || t > 27.6) return;
  const a = Math.min(eo(seg(t, 11.9, 12.4)), 1 - eio(seg(t, 26.8, 27.4)));
  const names = ['paris', 'dubai', 'ny', 'tokyo'];
  S2.dests.forEach((d, i) => drawSkyline(names[i], d[3], t, S2.box));
  alpha(a, () => {
    drawBoard(S2.hdr, t, CX - S2.hdr.w / 2, S2.hy, { panel: false });
    drawBoard(S2.d, t, CX - S2.d.w / 2, S2.dy);
  });
  const ca = fade(t, 12.7, 13.3, 21.7, 22.2);
  alpha(ca, () => txt('See the world.', CX, S2.capY + (1 - ca) * 16, { size: LAND ? 70 : 96, weight: 700 }));
}

/* ---------- FLIP 3a: arrivals globe ---------- */
const DEG = Math.PI / 180;
function proj(lat, lon, l0, p0, r, cx, cy, lift = 0) {
  const f = lat * DEG, l = (lon - l0) * DEG, f0 = p0 * DEG;
  const x = Math.cos(f) * Math.sin(l);
  const y = Math.cos(f0) * Math.sin(f) - Math.sin(f0) * Math.cos(f) * Math.cos(l);
  const z = Math.sin(f0) * Math.sin(f) + Math.cos(f0) * Math.cos(f) * Math.cos(l);
  const k = r * (1 + lift);
  return { x: cx + k * x, y: cy - k * y, z };
}
const ITA = [45.53, 11.33], DAC = [23.81, 90.41];
function gc(a, b, u) {
  const v = ([la, lo]) => [Math.cos(la * DEG) * Math.cos(lo * DEG), Math.cos(la * DEG) * Math.sin(lo * DEG), Math.sin(la * DEG)];
  const A = v(a), B = v(b);
  const om = Math.acos(A[0] * B[0] + A[1] * B[1] + A[2] * B[2]);
  const s1 = Math.sin((1 - u) * om) / Math.sin(om), s2 = Math.sin(u * om) / Math.sin(om);
  const p = [s1 * A[0] + s2 * B[0], s1 * A[1] + s2 * B[1], s1 * A[2] + s2 * B[2]];
  return [Math.asin(p[2]) / DEG, Math.atan2(p[1], p[0]) / DEG];
}
function scene3a(t) {
  const a = fade(t, 22.6, 23.4, 26.9, 27.6);
  if (a <= 0) return;
  const { cx, cy, r } = S3.g, l0 = 34 + (t - 22.6) * 3.2, p0 = 28;
  alpha(a, () => {
    const sc = lerp(0.94, 1, eo(seg(t, 22.6, 23.6)));
    X.translate(cx, cy); X.scale(sc, sc); X.translate(-cx, -cy);
    const g = X.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r);
    g.addColorStop(0, '#221d1a'); g.addColorStop(1, '#0f0d0c');
    X.fillStyle = g; X.beginPath(); X.arc(cx, cy, r, 0, 7); X.fill();
    const halo = X.createRadialGradient(cx, cy, r * 0.95, cx, cy, r * 1.25);
    halo.addColorStop(0, 'rgba(234,88,12,0.25)'); halo.addColorStop(1, 'rgba(234,88,12,0)');
    X.fillStyle = halo; X.beginPath(); X.arc(cx, cy, r * 1.25, 0, 7); X.fill();
    X.strokeStyle = 'rgba(214,211,209,0.16)'; X.lineWidth = 1.6;
    const line = pts => { X.beginPath(); let on = false; for (const p of pts) { if (p.z > 0) { on ? X.lineTo(p.x, p.y) : X.moveTo(p.x, p.y); on = true; } else on = false; } X.stroke(); };
    for (let lo = -180; lo < 180; lo += 20) { const pts = []; for (let la = -90; la <= 90; la += 5) pts.push(proj(la, lo, l0, p0, r, cx, cy)); line(pts); }
    for (let la = -60; la <= 75; la += 15) { const pts = []; for (let lo = -180; lo <= 180; lo += 5) pts.push(proj(la, lo, l0, p0, r, cx, cy)); line(pts); }
    X.strokeStyle = 'rgba(234,88,12,0.55)'; X.lineWidth = 2.5; X.beginPath(); X.arc(cx, cy, r, 0, 7); X.stroke();
    // flight path
    const pi = proj(...ITA, l0, p0, r, cx, cy), pd = proj(...DAC, l0, p0, r, cx, cy);
    const u = eio(seg(t, 24.0, 26.2));
    const N = 80, pts = [];
    for (let i = 0; i <= N; i++) { const uu = u * i / N; pts.push(proj(...gc(ITA, DAC, uu), l0, p0, r, cx, cy, 0.22 * Math.sin(Math.PI * uu))); }
    X.save(); X.shadowColor = 'rgba(234,88,12,0.8)'; X.shadowBlur = 14;
    X.strokeStyle = C.orange; X.lineWidth = LAND ? 4 : 5; X.lineCap = 'round';
    X.beginPath(); pts.forEach((p, i) => i ? X.lineTo(p.x, p.y) : X.moveTo(p.x, p.y)); X.stroke(); X.restore();
    // dots + labels
    const lab = (p, s, dx, al) => txt(s, p.x + dx, p.y - 22, { size: LAND ? 26 : 32, ls: 5, align: al, color: C.light });
    X.fillStyle = C.white; X.beginPath(); X.arc(pi.x, pi.y, LAND ? 8 : 10, 0, 7); X.fill();
    alpha(eo(seg(t, 23.4, 24.0)), () => lab(pi, 'ITALY', -14, 'right'));
    if (u > 0.02 && u < 1) {
      const p = pts[pts.length - 1], q = pts[pts.length - 2];
      drawPlane(p.x, p.y, LAND ? 0.45 : 0.55, Math.atan2(p.y - q.y, p.x - q.x), C.white);
    }
    const arr = seg(t, 26.2, 27.6);
    if (t > 26.2) {
      for (let k = 0; k < 2; k++) {
        const ph = ((t - 26.2) * 1.2 + k * 0.5) % 1;
        X.strokeStyle = `rgba(234,88,12,${(1 - ph) * 0.8})`; X.lineWidth = 3;
        X.beginPath(); X.arc(pd.x, pd.y, 10 + ph * 46, 0, 7); X.stroke();
      }
    }
    X.fillStyle = arr > 0 ? C.orange : C.light; X.beginPath(); X.arc(pd.x, pd.y, LAND ? 9 : 11, 0, 7); X.fill();
    alpha(eo(seg(t, 26.1, 26.6)), () => lab(pd, 'DHAKA', 14, 'left'));
  });
}

/* ---------- FLIP 3b: meet your loved ones ---------- */
function person(x, g, h, o) {
  const { dir = 1, walk = 0, phase = 0, hug = 0, raise = 0, hop = 0, handle = null } = o;
  const bob = -Math.abs(Math.sin(phase)) * h * 0.018 * walk - hop;
  const y = g + bob;
  const lean = dir * hug * h * 0.035;
  X.fillStyle = C.night; X.strokeStyle = C.night; X.lineCap = 'round'; X.lineJoin = 'round';
  // legs
  X.lineWidth = h * 0.085;
  for (const s of [-1, 1]) {
    const a = s * Math.sin(phase) * 0.38 * walk;
    const hx = x + s * h * 0.045, hy = y - h * 0.47;
    X.beginPath(); X.moveTo(hx, hy); X.lineTo(hx + Math.sin(a) * h * 0.44 * dir, hy + Math.cos(a) * h * 0.44); X.stroke();
  }
  // torso + head
  rr(x - h * 0.12 + lean * 0.5, y - h * 0.81, h * 0.24, h * 0.38, h * 0.09); X.fill();
  X.beginPath(); X.arc(x + lean * 1.4, y - h * 0.9, h * 0.078, 0, 7); X.fill();
  X.fillRect(x - h * 0.03 + lean, y - h * 0.84, h * 0.06, h * 0.06);
  // arms
  X.lineWidth = h * 0.062;
  for (const s of [-1, 1]) {
    const sx = x + s * h * 0.09 + lean * 0.6, sy = y - h * 0.75;
    const sw = -s * Math.sin(phase) * 0.45 * walk;
    let ex = sx + Math.sin(sw) * h * 0.34 * dir, ey = sy + Math.cos(sw) * h * 0.34;
    if (handle && s === -dir) { ex = handle[0]; ey = handle[1]; }
    const hx = x + dir * h * (s === dir ? 0.3 : 0.26), hy = sy + h * (s === dir ? 0.06 : 0.0);
    ex = lerp(ex, hx, hug); ey = lerp(ey, hy, hug);
    const rx = sx + s * h * 0.06, ry = sy - h * 0.3;
    ex = lerp(ex, rx, raise); ey = lerp(ey, ry, raise);
    X.beginPath(); X.moveTo(sx, sy); X.lineTo(ex, ey); X.stroke();
  }
}
function heart(x, y, s) {
  X.beginPath(); X.moveTo(x, y + s * 0.35);
  X.bezierCurveTo(x - s * 0.9, y - s * 0.25, x - s * 0.45, y - s * 0.85, x, y - s * 0.38);
  X.bezierCurveTo(x + s * 0.45, y - s * 0.85, x + s * 0.9, y - s * 0.25, x, y + s * 0.35);
  X.fill();
}
function scene3b(t) {
  if (t < 27.0 || t > 34.2) return;
  const out = 1 - eio(seg(t, 33.4, 34.0));
  const g = S3.ground, h = S3.fh, R = S3.R, mx = CX;
  alpha(out, () => {
    // rising sun
    const rise = eo(seg(t, 27.1, 28.5));
    X.save(); X.beginPath(); X.rect(0, 0, W, g); X.clip();
    const sy = g + R * 0.9 * (1 - rise);
    const sg = X.createRadialGradient(mx, sy, 0, mx, sy, R * 1.6);
    sg.addColorStop(0, 'rgba(249,115,22,0.35)'); sg.addColorStop(1, 'rgba(234,88,12,0)');
    X.fillStyle = sg; X.fillRect(0, 0, W, g);
    const dg = X.createRadialGradient(mx, sy - R * 0.2, R * 0.1, mx, sy, R);
    dg.addColorStop(0, '#FB8A3C'); dg.addColorStop(1, C.orange);
    X.fillStyle = dg; X.beginPath(); X.arc(mx, sy, R, 0, 7); X.fill();
    X.restore();
    const lg = X.createLinearGradient(0, 0, W, 0);
    lg.addColorStop(0, 'rgba(234,88,12,0)'); lg.addColorStop(0.5, 'rgba(234,88,12,0.95)'); lg.addColorStop(1, 'rgba(234,88,12,0)');
    X.strokeStyle = lg; X.lineWidth = 3; X.beginPath(); X.moveTo(0, g + 2); X.lineTo(W, g + 2); X.stroke();

    // walkers
    const hug = eo(seg(t, 30.15, 30.75));
    const tw = eo(seg(t, 27.5, 30.2));
    const tStart = mx - Math.max(W * 0.5, R) - 80, tEnd = mx - h * 0.2;
    const tx = lerp(tStart, tEnd, tw) + hug * h * 0.065;
    const tphase = (lerp(tStart, tEnd, tw) - tStart) / (h * 0.42) * Math.PI;
    const twalk = 1 - seg(t, 29.9, 30.2);
    const fw = eo(seg(t, 28.6, 30.2));
    const fStart = mx + Math.max(W * 0.5, R) + 40, fEnd = mx + h * 0.2;
    const fx = lerp(fStart, fEnd, fw) - hug * h * 0.065;
    const fphase = (fStart - lerp(fStart, fEnd, fw)) / (h * 0.42) * Math.PI;
    const fwalk = 1 - seg(t, 29.9, 30.2);
    // suitcase: pulled behind, left where the traveller stops
    const scx = lerp(tStart, tEnd, tw) - h * 0.34;
    const sw = h * 0.2, sh = h * 0.34;
    X.fillStyle = C.night; rr(scx - sw / 2, g - sh - h * 0.03, sw, sh, h * 0.03); X.fill();
    X.strokeStyle = C.night; X.lineWidth = h * 0.02;
    const hTop = [scx + h * 0.05, g - sh - h * 0.2];
    X.beginPath(); X.moveTo(scx + h * 0.05, g - sh - h * 0.03); X.lineTo(hTop[0], hTop[1]); X.stroke();
    const holding = hug < 0.05;
    person(tx, g, h, { dir: 1, walk: twalk, phase: tphase, hug, handle: holding ? hTop : null });
    // child runs beside the waiting parent
    const cxp = fx + h * 0.36 + (1 - fw) * h * 0.25;
    const hop = t > 30.2 ? Math.abs(Math.sin((t - 30.2) * 7)) * h * 0.06 * (1 - seg(t, 31.6, 32.2)) : 0;
    person(cxp, g, h * 0.56, { dir: -1, walk: fwalk, phase: fphase * 1.3, raise: eo(seg(t, 30.2, 30.6)), hop });
    person(fx, g, h * 0.97, { dir: -1, walk: fwalk, phase: fphase + 1, hug });
    // heart
    const hp = seg(t, 30.8, 31.3);
    if (hp > 0) { X.fillStyle = C.white; heart(mx, g - h * 1.32 - hp * 12, h * 0.13 * eback(hp)); }

    // words
    const ha = eo(seg(t, 27.9, 28.6));
    alpha(ha, () => {
      const dy = (1 - ha) * 20;
      if (LAND) txt('Meet your loved ones.', CX, 200 + dy, { size: 94, weight: 700 });
      else { txt('Meet your', CX, 330 + dy, { size: 118, weight: 700 }); txt('loved ones.', CX, 460 + dy, { size: 118, weight: 700, color: C.orange }); }
    });
    const subs = ['Eid at home.', 'A wedding.', 'A first meeting with a grandchild.'];
    const st = [29.4, 30.5, 31.6];
    if (LAND) {
      X.font = '500 40px Manrope';
      const sep = '   ·   ';
      const ws = subs.map(s => X.measureText(s).width), sepw = X.measureText(sep).width;
      let x = CX - (ws.reduce((a, b) => a + b, 0) + 2 * sepw) / 2;
      subs.forEach((s, i) => {
        const a = eo(seg(t, st[i], st[i] + 0.6));
        alpha(a, () => { txt(s, x, 290 + (1 - a) * 10, { size: 40, weight: 500, font: 'Manrope', color: C.light, align: 'left' }); if (i > 0) txt(sep, x - sepw, 290, { size: 40, font: 'Manrope', color: C.orange, align: 'left' }); });
        x += ws[i] + sepw;
      });
    } else {
      subs.forEach((s, i) => {
        const a = eo(seg(t, st[i], st[i] + 0.6));
        alpha(a, () => txt(s, CX, 590 + i * 66 + (1 - a) * 10, { size: 46, weight: 500, font: 'Manrope', color: C.light }));
      });
    }
  });
}

/* ---------- FLIP 4: why Fulki ---------- */
function scene4(t) {
  if (t < 33.9 || t > 44.1) return;
  const a = Math.min(eo(seg(t, 34.0, 34.4)), 1 - eio(seg(t, 43.5, 44.0)));
  alpha(a, () => {
    txt('WHY FULKI', CX, S4.hy, { size: LAND ? 32 : 38, ls: 12, color: C.orange });
    for (const it of S4.items) {
      const ia = eback(seg(t, it.t - 0.3, it.t + 0.25));
      const s = it.isz;
      alpha(clamp(seg(t, it.t - 0.3, it.t)), () => {
        X.save(); X.translate(it.ix, it.iy); X.scale(ia, ia); X.translate(-it.ix, -it.iy);
        rr(it.ix - s / 2, it.iy - s / 2, s, s, s * 0.22); X.fillStyle = C.panel; X.fill();
        X.strokeStyle = C.edge; X.lineWidth = 2; X.stroke();
        it.icon(it.ix, it.iy, s * 0.56, C.orange);
        X.restore();
      });
      drawBoard(it.b, t, it.bx, it.by, { panel: false });
    }
    const ca = eo(seg(t, 41.4, 42.0));
    alpha(ca, () => {
      const dy = (1 - ca) * 18;
      if (LAND) {
        txt('A real person by your side.', CX, 800 + dy, { size: 78, weight: 700 });
        txt('Before, during and after your trip.', CX, 875 + dy, { size: 40, weight: 500, font: 'Manrope', color: C.light });
      } else {
        txt('A real person', CX, 1330 + dy, { size: 100, weight: 700 });
        txt('by your side.', CX, 1440 + dy, { size: 100, weight: 700, color: C.orange });
        txt('Before, during and', CX, 1545 + dy, { size: 46, weight: 500, font: 'Manrope', color: C.light });
        txt('after your trip.', CX, 1605 + dy, { size: 46, weight: 500, font: 'Manrope', color: C.light });
      }
    });
  });
}

/* ---------- FLIP 5: reach us + B2B ---------- */
function scene5(t) {
  if (t < 44.0 || t > 52.4) return;
  const a = 1 - eio(seg(t, 51.8, 52.3));
  alpha(a, () => {
    for (const c of S5.cards) {
      if (t < c.tin) { alpha(eo(seg(t, c.tin - 0.3, c.tin)), () => flapTile(c.x, c.y, c.w, c.h, null, null, 0)); continue; }
      if (t < c.tout) flapTile(c.x, c.y, c.w, c.h, null, c.content, eio(seg(t, c.tin, c.tin + 0.45)));
      else flapTile(c.x, c.y, c.w, c.h, c.content, null, eio(seg(t, c.tout, c.tout + 0.4)));
    }
    const b = S5.b2b;
    alpha(eo(seg(t, 46.9, 47.3)), () => drawBoard(b, t, CX - b.w / 2, S5.by));
    const sa = Math.min(eo(seg(t, 48.4, 49.0)), 1 - seg(t, 51.0, 51.4));
    alpha(sa, () => {
      const y0 = S5.by + b.h + b.cw * 0.32 + (LAND ? 90 : 110);
      if (LAND) txt("Agencies & businesses: let's work together.", CX, y0, { size: 44, weight: 500, font: 'Manrope', color: C.light });
      else { txt('Agencies & businesses:', CX, y0, { size: 46, weight: 500, font: 'Manrope', color: C.light }); txt("let's work together.", CX, y0 + 64, { size: 46, weight: 500, font: 'Manrope', color: C.light }); }
    });
  });
}

/* ---------- FLIP 6: logo landing + contact ---------- */
function scene6(t) {
  if (t < 52.2) return;
  const { k, ox, oy } = S6;
  X.save(); X.translate(ox, oy); X.scale(k, k);
  const u = eo(seg(t, 52.3, 54.3));
  const startX = -ox / k - 140;
  const px = lerp(startX, 780, u);
  const cg = X.createLinearGradient(80, 0, 740, 0);
  cg.addColorStop(0, 'rgba(234,88,12,0)'); cg.addColorStop(0.55, 'rgba(234,88,12,0.75)'); cg.addColorStop(1, '#EA580C');
  X.save(); X.beginPath(); X.rect(0, 300, Math.max(0, px - 40), 120); X.clip(); X.fillStyle = cg; X.fill(LOGO.trail); X.restore();
  drawPlane(px, 358.16, 1, 0, C.orange);
  const a1 = eo(seg(t, 53.5, 54.5));
  alpha(a1, () => { X.translate(80, 250.16 + (1 - a1) * 26); X.fillStyle = C.white; X.fill(LOGO.word); });
  const a2 = eo(seg(t, 54.2, 55.0));
  alpha(a2, () => { X.translate(80, 497.56 + (1 - a2) * 16); X.fillStyle = C.light; X.fill(LOGO.tag); });
  X.restore();

  const lines = LAND ? [
    { icon: ICON.pin, parts: [{ text: 'Via 4 Martiri, 44 · 36071 Arzignano (VI), Italy', size: 36, color: C.light }] },
    { icon: ICON.chat, parts: [{ text: 'WhatsApp & phone   ', size: 34, color: C.light }, { text: '+39 0444 022494', size: 62, weight: 700, font: 'Outfit', color: C.orange }] },
    { icon: ICON.globe, parts: [{ text: 'fulkitravels.com', size: 36, weight: 600, color: C.white }, { text: '   ·   ', size: 36, color: C.orange }, { text: '@fulki.travel', size: 36, weight: 600, color: C.white }] },
  ] : [
    { icon: ICON.pin, parts: [{ text: 'Via 4 Martiri, 44 · Arzignano (VI)', size: 38, color: C.light }] },
    { icon: null, parts: [{ text: 'WhatsApp & phone', size: 36, color: C.light }] },
    { icon: ICON.chat, parts: [{ text: '+39 0444 022494', size: 80, weight: 700, font: 'Outfit', color: C.orange }] },
    { icon: ICON.globe, parts: [{ text: 'fulkitravels.com', size: 40, weight: 600, color: C.white }] },
    { icon: ICON.insta, parts: [{ text: '@fulki.travel', size: 40, weight: 600, color: C.white }] },
  ];
  const gapY = LAND ? [0, 100, 196] : [0, 110, 210, 330, 410];
  const da = eo(seg(t, 54.8, 55.4));
  alpha(da, () => {
    const dl = LAND ? 160 : 180;
    X.strokeStyle = C.orange; X.lineWidth = 3; X.beginPath();
    X.moveTo(CX - dl * da / 2, S6.cy - (LAND ? 70 : 90)); X.lineTo(CX + dl * da / 2, S6.cy - (LAND ? 70 : 90)); X.stroke();
  });
  lines.forEach((ln, i) => {
    const la = eo(seg(t, 55.0 + i * 0.25, 55.6 + i * 0.25));
    alpha(la, () => richLine(ln.parts, CX, S6.cy + gapY[i] + (1 - la) * 14, ln.icon, ln.parts[0].size * (ln.parts.length > 1 && ln.parts[1].size > 50 ? 1.3 : 1.15)));
  });
}

/* ---------- master ---------- */
function render(t) {
  X.setTransform(1, 0, 0, 1, 0, 0); X.globalAlpha = 1;
  background(t);
  scene1(t);
  scene0(t);
  scene2(t);
  scene3a(t);
  scene3b(t);
  scene4(t);
  scene5(t);
  scene6(t);
}

function getClicks() {
  const out = [];
  for (const b of BOARDS) for (let r = 0; r < b.rows; r++) for (let k = 0; k < b.tr[r].length; k++) for (let c = 0; c < b.cols; c++) {
    const pl = cellPlan(b, r, c, k);
    if (pl.n < 0) continue;
    const xn = (b.x + c * (b.cw + b.gap) + b.cw / 2) / W;
    for (let i = 0; i <= pl.n; i++) { const tt = pl.start + (i + 1) * FD; if (tt >= 0 && tt < DUR) out.push([+tt.toFixed(4), +b.ch.toFixed(1), +clamp(xn).toFixed(3)]); }
  }
  out.push([1.25, 600, 0.5], ...EXTRA_CLICKS);
  return out.sort((a, b) => a[0] - b[0]);
}

async function init() {
  const svg = await (await fetch('../assets/logo/fulki-travel-tours-reversed.svg')).text();
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  for (const p of doc.querySelectorAll('path')) {
    const f = p.getAttribute('fill'), d = new Path2D(p.getAttribute('d'));
    if (f === '#FFFFFF') LOGO.word = d; else if (f === '#D6D3D1') LOGO.tag = d; else if (f && f.startsWith('url')) LOGO.trail = d; else LOGO.plane = d;
  }
  await Promise.all(['600 40px Outfit', '700 40px Outfit', '500 40px Manrope', '600 40px Manrope'].map(f => document.fonts.load(f)));
  await document.fonts.ready;
  initLayouts();
  // run once so boards learn their x positions (for stereo panning of clicks)
  for (const t of [6, 13, 23, 35, 38, 40, 48]) render(t);
  render(+(Q.get('t') || 0));
}
window.render = render;
window.getClicks = getClicks;
window.ready = init();

// live preview when opened directly: ?play=1
if (Q.get('play')) window.ready.then(() => { const t0 = performance.now(); const loop = () => { render(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; loop(); });
