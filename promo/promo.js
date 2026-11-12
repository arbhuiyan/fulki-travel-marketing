'use strict';
/* Fulki Travel & Tours: 60-second promo, "Window Seat".
   One airplane window on a warm paper background. The shade lifts, the world goes by,
   and the best view turns out to be the people waiting at home.
   Everything is a pure function of time: render(t).
   ?w=1920&h=1080 → 16:9, ?w=1080&h=1920 → 9:16. */

const cv = document.getElementById('c');
const X = cv.getContext('2d');
const Q = new URLSearchParams(location.search);
const W = +(Q.get('w') || 1920), H = +(Q.get('h') || 1080);
cv.width = W; cv.height = H;
const LAND = W >= H;
const CX = W / 2;
const DUR = 60;

const C = { cream: '#FFF7ED', paper: '#FFFFFF', ink: '#171717', orange: '#EA580C', muted: '#57534E', soft: '#A8A29E', line: '#EBE3D8', tint: '#FFEDD5' };

/* ---------- helpers ---------- */
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const eo = x => 1 - Math.pow(1 - x, 3);
const eback = x => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
function hash(n) {
  n = Math.floor(n) | 0;
  n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3); n ^= n >>> 4;
  n = Math.imul(n, 0x27d4eb2d); n ^= n >>> 15; return (n >>> 0) / 4294967296;
}
function rr(x, y, w, h, r) { X.beginPath(); X.roundRect(x, y, w, h, r); }
function alpha(a, fn) { if (a <= 0.001) return; X.save(); X.globalAlpha *= a; fn(); X.restore(); }
function vgrad(y0, y1, stops) { const g = X.createLinearGradient(0, y0, 0, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; }
function glow(x, y, r, rgb, a = 1) {
  const g = X.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
  X.fillStyle = g; X.beginPath(); X.arc(x, y, r, 0, 7); X.fill();
}
function txt(s, x, y, o = {}) {
  const { size = 48, weight = 600, font = 'Outfit', color = C.ink, align = 'center', ls = 0 } = o;
  X.font = `${weight} ${size}px ${font}`; X.fillStyle = color; X.textAlign = align;
  X.textBaseline = 'alphabetic'; X.letterSpacing = ls + 'px';
  X.fillText(s, align === 'center' ? x + ls / 2 : x, y);
  X.letterSpacing = '0px';
}
function measure(s, size, weight = 600, font = 'Outfit') { X.font = `${weight} ${size}px ${font}`; X.letterSpacing = '0px'; return X.measureText(s).width; }
function richLine(parts, cx, y, icon, iconSize) {
  let w = 0; const ws = parts.map(p => { const m = measure(p.text, p.size, p.weight || 500, p.font || 'Manrope'); w += m; return m; });
  const iw = icon ? iconSize * 1.55 : 0;
  let x = cx - (w + iw) / 2;
  if (icon) { icon(x + iconSize / 2, y - parts[0].size * 0.36, iconSize, C.orange, C.orange); x += iw; }
  parts.forEach((p, i) => { txt(p.text, x, y, { ...p, font: p.font || 'Manrope', weight: p.weight || 500, align: 'left' }); x += ws[i]; });
}

/* ---------- brand ---------- */
const PLANE = new Path2D('M50 0C50 -3.6 46.5 -5.6 41 -5.6H15L-4 -40.5C-5 -42.3 -6.6 -43 -8.6 -43H-13.4C-15 -43 -15.9 -41.8 -15.4 -40.3L-6.4 -5.6H-31L-39.6 -17.4C-40.4 -18.5 -41.4 -19 -42.8 -19H-46.4C-47.7 -19 -48.4 -18 -48 -16.8L-44.2 -4.2C-44.6 -2.8 -44.6 2.8 -44.2 4.2L-48 16.8C-48.4 18 -47.7 19 -46.4 19H-42.8C-41.4 19 -40.4 18.5 -39.6 17.4L-31 5.6H-6.4L-15.4 40.3C-15.9 41.8 -15 43 -13.4 43H-8.6C-6.6 43 -5 42.3 -4 40.5L15 5.6H41C46.5 5.6 50 3.6 50 0Z');
function drawPlane(x, y, k, rot, color) { X.save(); X.translate(x, y); X.rotate(rot); X.scale(k, k); X.fillStyle = color; X.fill(PLANE); X.restore(); }
const LOGO = {};   // primary lockup paths
const IMG = {};    // horizontal logo + round icon

/* ---------- icons ---------- */
function stroke(S, c) { X.strokeStyle = c; X.lineWidth = S * 0.075; X.lineCap = 'round'; X.lineJoin = 'round'; }
const ICON = {
  office(cx, cy, S, c, c2) {
    stroke(S, c2); rr(cx - S * 0.3, cy - S * 0.42, S * 0.6, S * 0.84, S * 0.04); X.stroke();
    X.fillStyle = c;
    for (let r = 0; r < 3; r++) for (let k = 0; k < 2; k++) X.fillRect(cx - S * 0.18 + k * S * 0.24, cy - S * 0.3 + r * S * 0.19, S * 0.12, S * 0.1);
    X.fillRect(cx - S * 0.07, cy + S * 0.24, S * 0.14, S * 0.18);
    X.beginPath(); X.moveTo(cx - S * 0.45, cy + S * 0.42); X.lineTo(cx + S * 0.45, cy + S * 0.42); X.stroke();
  },
  phone(cx, cy, S, c, c2) {
    stroke(S, c2); rr(cx - S * 0.24, cy - S * 0.44, S * 0.48, S * 0.88, S * 0.09); X.stroke();
    X.beginPath(); X.moveTo(cx - S * 0.06, cy - S * 0.33); X.lineTo(cx + S * 0.06, cy - S * 0.33); X.stroke();
    X.fillStyle = c; X.beginPath(); X.arc(cx, cy + S * 0.3, S * 0.05, 0, 7); X.fill();
    stroke(S, c);
    for (const r of [0.14, 0.26]) { X.beginPath(); X.arc(cx + S * 0.24, cy - S * 0.28, S * r, -Math.PI * 0.42, Math.PI * 0.05); X.stroke(); }
  },
  chat(cx, cy, S, c, c2) {
    stroke(S, c2);
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

/* ---------- geometry ---------- */
const WIN = LAND ? { x: 150, y: 125, w: 600, h: 830, r: 250, ft: 44 } : { x: 190, y: 200, w: 700, h: 960, r: 290, ft: 50 };
const VW = WIN.w - 2 * WIN.ft, VH = WIN.h - 2 * WIN.ft;          // the view through the glass
const TX = LAND ? 880 : CX, TW = LAND ? 920 : 980;               // text column
const TY = LAND ? 500 : 1370;

/* ---------- timeline ---------- */
const T = {
  shade: [2.4, 4.4],
  vistas: [10, 14, 18, 22],        // cloud-pass transitions between views
  zoom: [27.3, 29.7],
  card: [33.6, 34.5],              // window becomes a chat card
  msgs: [
    { who: 'u', t: 34.9, text: 'Salam! I need to be home for Eid.' },
    { who: 'f', t: 37.0, text: 'Of course! Let me compare the airlines for you.' },
    { who: 'f', t: 39.6, text: 'Found it. Best fare, right dates. Shall I book?' },
    { who: 'u', t: 41.3, text: 'Yes please!' },
    { who: 'f', t: 43.2, text: "Done. We're here before, during and after your trip." },
  ],
  contact: 46.0, rows: [46.4, 46.9, 47.4], b2b: 48.6,
  final: 52.2,
};

/* ---------- procedural landscape bits (all in view coordinates 0..VW, 0..VH) ---------- */
function fbm(x, seed, mode) {
  let s = 0, a = 0.5, f = 1, tot = 0;
  for (let i = 0; i < 4; i++) {
    const v = Math.sin(x * f + hash(seed * 131 + i * 17) * 6.283);
    s += a * (mode === 1 ? 1 - Math.abs(v) : mode === 2 ? Math.abs(v) : 0.5 + 0.5 * v);
    tot += a; a *= 0.5; f *= 2.07;
  }
  return s / tot;
}
function ridge(baseY, amp, freq, seed, scroll, fill, mode, dy = 0) {
  X.beginPath(); X.moveTo(-2, VH + 2);
  for (let x = -2; x <= VW + 6; x += 5) X.lineTo(x, baseY + dy - amp * fbm((x + scroll) * freq, seed, mode));
  X.lineTo(VW + 2, VH + 2); X.closePath(); X.fillStyle = fill; X.fill();
}
function cloud(x, y, s, color) {
  X.fillStyle = color; X.beginPath();
  for (const [dx, dy, r] of [[-0.9, 0.05, 0.42], [-0.35, -0.28, 0.55], [0.3, -0.42, 0.62], [0.92, -0.06, 0.48]]) { X.moveTo(x + dx * s + r * s, y + dy * s); X.arc(x + dx * s, y + dy * s, r * s, 0, 7); }
  X.roundRect(x - 1.32 * s, y, 2.72 * s, 0.46 * s, 0.23 * s); X.fill();
}
function skyline(baseY, slot, seed, scroll, color, hmin, hmax, win) {
  const k0 = Math.floor(scroll / slot) - 1;
  for (let k = k0; k < k0 + VW / slot + 3; k++) {
    const x = k * slot - scroll, r = hash(seed * 977 + k * 31);
    const bw = slot * (0.62 + 0.33 * hash(seed + k * 7)), bh = hmin + (hmax - hmin) * r * r;
    X.fillStyle = color; X.fillRect(x, baseY - bh, bw, bh + 2);
    if (hash(seed + k * 13) > 0.7) X.fillRect(x + bw / 2 - 1.5, baseY - bh - 18, 3, 18);
    if (win) {
      X.fillStyle = win;
      for (let j = 0; baseY - bh + 8 + j * 11 < baseY - 8; j++) for (let i = 0; 5 + i * 9 < bw - 6; i++)
        if (hash(seed + k * 101 + j * 7 + i * 3) > 0.55) X.fillRect(x + 5 + i * 9, baseY - bh + 8 + j * 11, 4, 5);
    }
  }
}
function sky(stops, yEnd = VH) { X.fillStyle = vgrad(0, yEnd, stops); X.fillRect(0, 0, VW, VH); }

/* View 0: sunrise above the clouds */
function vDawn(t) {
  sky([[0, '#6FA9DE'], [0.5, '#F6CFA6'], [0.8, '#FDB877']]);
  const sx = VW * 0.34, sy = VH * 0.565;
  glow(sx, sy, VW * 0.7, '255,214,150', 0.75);
  X.fillStyle = '#FFF6DC'; X.beginPath(); X.arc(sx, sy, 34, 0, 7); X.fill();
  const sc = t * 34;
  ridge(VH * 0.64, 42, 0.012, 11, sc * 0.3, '#F7CBA4', 2);
  ridge(VH * 0.72, 56, 0.009, 12, sc * 0.6, '#FBDFC8', 2);
  ridge(VH * 0.83, 72, 0.007, 13, sc * 1.0, '#FFF1E4', 2);
  ridge(VH * 0.97, 64, 0.006, 14, sc * 1.7, '#FFFFFF', 2);
}
/* View 1: snow peaks */
function vPeaks(t) {
  sky([[0, '#4E9BE2'], [0.75, '#CFE7F9']]);
  X.fillStyle = '#FFFFFF'; X.beginPath(); X.arc(VW * 0.72, VH * 0.16, 22, 0, 7); X.fill(); glow(VW * 0.72, VH * 0.16, 120, '255,255,255', 0.5);
  const sc = (t - 10) * 40 + 300;
  cloud(VW * 0.3 - (t - 10) * 14, VH * 0.2, 46, 'rgba(255,255,255,0.9)');
  ridge(VH * 0.70, 300, 0.0042, 21, sc * 0.12, '#FFFFFF', 1);
  ridge(VH * 0.70, 300, 0.0042, 21, sc * 0.12, '#B9D0E8', 1, 34);
  ridge(VH * 0.80, 260, 0.0050, 22, sc * 0.25, '#F4F8FC', 1);
  ridge(VH * 0.80, 260, 0.0050, 22, sc * 0.25, '#86A8CF', 1, 26);
  ridge(VH * 0.90, 210, 0.0060, 23, sc * 0.5, '#557BA8', 1);
  ridge(VH * 1.00, 170, 0.0075, 24, sc * 0.9, '#35557D', 1);
  ridge(VH * 1.10, 150, 0.0090, 25, sc * 1.5, '#223B5B', 1);
}
/* View 2: golden desert city */
function vDesert(t) {
  sky([[0, '#F29A3A'], [0.45, '#FAC583'], [0.72, '#FEE3C0']]);
  const sx = VW * 0.3, sy = VH * 0.47;
  glow(sx, sy, VW * 0.75, '255,236,190', 0.9);
  X.fillStyle = '#FFF4D8'; X.beginPath(); X.arc(sx, sy, 62, 0, 7); X.fill();
  const sc = (t - 14) * 44 + 500;
  const by = VH * 0.675;
  skyline(by, 30, 41, sc * 0.35, '#C97B40', 22, 130, null);
  const tx = VW * 0.95 - (sc - 500) * 0.35;      // the needle tower drifts through
  X.fillStyle = '#B9682F'; X.beginPath();
  X.moveTo(tx - 20, by); X.lineTo(tx - 15, by - 150); X.lineTo(tx - 10, by - 150); X.lineTo(tx - 7, by - 250); X.lineTo(tx - 3, by - 250); X.lineTo(tx - 1, by - 345);
  X.lineTo(tx + 1, by - 345); X.lineTo(tx + 3, by - 250); X.lineTo(tx + 7, by - 250); X.lineTo(tx + 10, by - 150); X.lineTo(tx + 15, by - 150); X.lineTo(tx + 20, by); X.fill();
  skyline(by + 6, 44, 42, sc * 0.5, '#A85A28', 30, 170, 'rgba(255,226,170,0.55)');
  ridge(VH * 0.74, 54, 0.006, 43, sc * 0.7, '#E6A05A', 0);
  ridge(VH * 0.84, 70, 0.005, 44, sc * 1.0, '#D17D38', 0);
  ridge(VH * 0.97, 86, 0.004, 45, sc * 1.6, '#A95B22', 0);
}
/* View 3: a skyline after dark */
function vNight(t) {
  sky([[0, '#060A22'], [0.55, '#182153'], [0.82, '#4B3572']]);
  for (let i = 0; i < 70; i++) {
    const a = 0.35 + 0.65 * Math.abs(Math.sin(t * 1.7 + hash(i * 5 + 1) * 9));
    X.fillStyle = `rgba(255,255,255,${a})`;
    X.beginPath(); X.arc(hash(i * 3 + 7) * VW, hash(i * 11 + 2) * VH * 0.6, 0.8 + hash(i) * 1.5, 0, 7); X.fill();
  }
  const mx = VW * 0.7, my = VH * 0.17;
  glow(mx, my, 110, '255,240,200', 0.25);
  X.save(); X.beginPath(); X.arc(mx, my, 30, 0, 7); X.clip();
  X.fillStyle = '#FDF1CC'; X.fillRect(mx - 40, my - 40, 80, 80);
  X.fillStyle = '#0D1436'; X.beginPath(); X.arc(mx - 14, my - 8, 28, 0, 7); X.fill(); X.restore();
  const sc = (t - 18) * 46 + 900, by = VH * 0.80;
  skyline(by, 34, 51, sc * 0.4, '#131B49', 40, 190, 'rgba(255,214,130,0.35)');
  skyline(by + 4, 56, 52, sc * 0.8, '#090E2A', 60, 300, '#FFD27A');
  X.fillStyle = '#0A1030'; X.fillRect(0, by + 4, VW, VH);
  for (let i = 0; i < 46; i++) {       // lights on the water
    const x = ((hash(i * 9 + 4) * (VW + 200) - sc * 0.8) % (VW + 200) + VW + 200) % (VW + 200) - 100;
    const y = by + 14 + hash(i * 7 + 3) * (VH - by - 20);
    X.fillStyle = `rgba(255,210,122,${0.15 + 0.35 * Math.abs(Math.sin(t * 2 + i))})`;
    X.fillRect(x, y, 10 + hash(i) * 26, 2.5);
  }
}

/* View 4: coming home, a green river delta at morning; we zoom into one lit window */
const HZ = VH * 0.40;
const dY = d => HZ + Math.pow(d, 1.3) * (VH - HZ);
const HERO = { x0: VW * 0.70, d: 0.60 };
function house(x, y, s, hero, t, alt) {
  X.fillStyle = 'rgba(40,70,30,0.22)'; X.beginPath(); X.ellipse(x, y + s * 0.02, s * 0.95, s * 0.12, 0, 0, 7); X.fill();
  X.fillStyle = '#F6E6CB'; X.fillRect(x - s * 0.62, y - s * 0.72, s * 1.24, s * 0.72);
  X.fillStyle = hero ? '#B8432A' : (alt ? '#8FA3AD' : '#C2573A');
  X.beginPath(); X.moveTo(x - s * 0.8, y - s * 0.68); X.lineTo(x - s * 0.5, y - s * 1.14); X.lineTo(x + s * 0.5, y - s * 1.14); X.lineTo(x + s * 0.8, y - s * 0.68); X.closePath(); X.fill();
  X.fillStyle = '#7A3B1D'; X.fillRect(x - s * 0.42, y - s * 0.5, s * 0.26, s * 0.5);
  const wx = x + s * 0.06, wy = y - s * 0.5, ws = s * 0.4, wh = s * 0.3;
  if (hero) glow(wx + ws / 2, wy + wh / 2, s * 1.1, '255,170,70', 0.55 + 0.1 * Math.sin(t * 3));
  X.fillStyle = hero ? '#FFB24A' : '#6B8794'; X.fillRect(wx, wy, ws, wh);
}
function palm(x, y, s) {
  X.strokeStyle = '#7A5230'; X.lineWidth = s * 0.075; X.lineCap = 'round';
  const tx = x + s * 0.12, ty = y - s;
  X.beginPath(); X.moveTo(x, y); X.quadraticCurveTo(x - s * 0.06, y - s * 0.5, tx, ty); X.stroke();
  X.strokeStyle = '#2E7D3A'; X.lineWidth = s * 0.07;
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * (0.02 + i / 6 * 0.96), l = s * 0.5;
    const ex = tx + Math.cos(a) * l, ey = ty + Math.sin(a) * l * 0.55 + s * 0.2;
    X.beginPath(); X.moveTo(tx, ty); X.quadraticCurveTo(tx + Math.cos(a) * l * 0.7, ty + Math.sin(a) * l * 0.9, ex, ey); X.stroke();
  }
}
function tree(x, y, s) {
  X.strokeStyle = '#6B4A2B'; X.lineWidth = s * 0.09; X.beginPath(); X.moveTo(x, y); X.lineTo(x, y - s * 0.5); X.stroke();
  X.fillStyle = '#3B8A45'; X.beginPath(); X.arc(x, y - s * 0.68, s * 0.36, 0, 7); X.fill();
  X.fillStyle = '#5BAA5E'; X.beginPath(); X.arc(x - s * 0.1, y - s * 0.76, s * 0.2, 0, 7); X.fill();
}
function vHome(t) {
  const sc = 150 * (1 - eo(seg(t, 21.6, 27.0)));
  const hs = 20 + 74 * HERO.d, hwx = HERO.x0 + hs * 0.26, hwy = dY(HERO.d) - hs * 0.35;   // the lit window
  const zk = eio(seg(t, T.zoom[0], T.zoom[1])), z = Math.pow(18, zk) * lerp(1, 1.1, eo(seg(t, 22, 27)));
  X.save();
  X.translate(lerp(hwx, VW / 2, zk), lerp(hwy, VH / 2, zk)); X.scale(z, z); X.translate(-hwx, -hwy);
  X.fillStyle = vgrad(0, HZ, [[0, '#8CCAF0'], [1, '#FFF0D0']]); X.fillRect(-VW, -VH, VW * 3, VH + HZ);
  glow(VW * 0.24, HZ - 64, 190, '255,240,200', 0.9);
  X.fillStyle = '#FFF9E6'; X.beginPath(); X.arc(VW * 0.24, HZ - 64, 30, 0, 7); X.fill();
  cloud(VW * 0.74 + sc * 0.1, HZ - 150, 40, 'rgba(255,255,255,0.92)');
  cloud(VW * 0.1 + sc * 0.06, HZ - 230, 28, 'rgba(255,255,255,0.8)');
  ridge(HZ + 6, 52, 0.007, 31, -sc * 0.06 + 40, '#B5D6AE', 0);
  X.fillStyle = vgrad(HZ, VH, [[0, '#B1DA94'], [1, '#58A050']]); X.fillRect(-VW, HZ, VW * 3, VH);
  // fields: mustard yellow and greens
  const cols = ['#F3D34E', '#8BC56A', '#4C9446', '#F3D34E', '#79BA5E', '#E9C63F'];
  for (let i = 0; i < 16; i++) {
    const d = 0.06 + 0.94 * hash(i * 13 + 5), rx = (50 + 130 * hash(i * 7 + 1)) * (0.25 + d);
    X.fillStyle = cols[i % cols.length]; X.globalAlpha = 0.85;
    X.beginPath(); X.ellipse(hash(i * 29 + 3) * (VW + 200) - 100 + sc * d, dY(d), rx, rx * 0.17, 0, 0, 7); X.fill();
  }
  X.globalAlpha = 1;
  // river
  const Lp = [], Rp = [];
  const rcx = d => VW * (0.56 - 0.40 * d) + Math.sin(d * 6.5 + 1) * VW * 0.11 + sc * d;
  for (let i = 0; i <= 40; i++) { const d = i / 40, y = dY(d), hw = 3 + d * d * 150; Lp.push([rcx(d) - hw, y]); Rp.push([rcx(d) + hw, y]); }
  X.beginPath(); Lp.forEach(([x, y], i) => i ? X.lineTo(x, y) : X.moveTo(x, y)); Rp.reverse().forEach(([x, y]) => X.lineTo(x, y)); X.closePath();
  X.fillStyle = vgrad(HZ, VH, [[0, '#E4F4F8'], [1, '#9FD3EA']]); X.fill();
  // boat
  { const d = 0.78, bx = rcx(d) - 10 + Math.sin(t) * 3, by = dY(d);
    X.fillStyle = '#5A381C'; X.beginPath(); X.moveTo(bx - 34, by - 6); X.quadraticCurveTo(bx, by + 14, bx + 34, by - 6); X.quadraticCurveTo(bx, by + 2, bx - 34, by - 6); X.fill();
    X.fillRect(bx - 1.5, by - 30, 3, 28); X.fillStyle = '#FFF7ED'; X.beginPath(); X.moveTo(bx + 2, by - 30); X.lineTo(bx + 20, by - 8); X.lineTo(bx + 2, by - 8); X.fill(); }
  // trees and houses, far to near
  const objs = [];
  for (let i = 0; i < 26; i++) { const d = 0.1 + 0.86 * hash(i * 17 + 9); objs.push({ d, x: hash(i * 23 + 4) * (VW + 160) - 80, kind: hash(i * 5 + 2) > 0.45 ? 'palm' : 'tree' }); }
  [[0.16, 0.3], [0.9, 0.36], [0.5, 0.2], [0.08, 0.74]].forEach(([x, d], i) => objs.push({ d, x: VW * x, kind: 'house', alt: i % 2 }));
  objs.push({ d: HERO.d, x: HERO.x0, kind: 'hero' }, { d: HERO.d + 0.01, x: HERO.x0 - 62, kind: 'palm' }, { d: HERO.d - 0.01, x: HERO.x0 + 70, kind: 'tree' });
  objs.sort((a, b) => a.d - b.d);
  for (const o of objs) {
    const x = o.x + sc * o.d, y = dY(o.d);
    if (o.kind !== 'hero' && o.kind !== 'house' && Math.abs(x - rcx(o.d)) < 12 + o.d * o.d * 150) continue;
    if (o.kind === 'palm') palm(x, y, 26 + 120 * o.d); else if (o.kind === 'tree') tree(x, y, 22 + 90 * o.d);
    else house(x, y, 20 + 74 * o.d, o.kind === 'hero', t, o.alt);
  }
  X.restore();
  alpha(seg(t, T.zoom[1] - 0.7, T.zoom[1] - 0.1), () => { X.fillStyle = '#FFB24A'; X.fillRect(0, 0, VW, VH); });
}

/* View 5: inside that window */
function person(x, g, h, o) {
  const { dir = 1, walk = 0, phase = 0, hug = 0, raise = 0, hop = 0, handle = null, dress = false, color = '#3A1A08' } = o;
  const y = g - Math.abs(Math.sin(phase)) * h * 0.018 * walk - hop, lean = dir * hug * h * 0.035;
  X.fillStyle = color; X.strokeStyle = color; X.lineCap = 'round'; X.lineJoin = 'round';
  if (dress) {
    X.beginPath(); X.moveTo(x - h * 0.11, y - h * 0.5); X.lineTo(x + h * 0.11, y - h * 0.5); X.lineTo(x + h * 0.17, y); X.lineTo(x - h * 0.17, y); X.closePath(); X.fill();
    X.beginPath(); X.moveTo(x - dir * h * 0.06, y - h * 0.86); X.quadraticCurveTo(x - dir * h * 0.2, y - h * 0.7, x - dir * h * 0.16, y - h * 0.4); X.lineTo(x - dir * h * 0.05, y - h * 0.5); X.fill();
  } else {
    X.lineWidth = h * 0.085;
    for (const s of [-1, 1]) {
      const a = s * Math.sin(phase) * 0.38 * walk, hx = x + s * h * 0.045, hy = y - h * 0.47;
      X.beginPath(); X.moveTo(hx, hy); X.lineTo(hx + Math.sin(a) * h * 0.44 * dir, hy + Math.cos(a) * h * 0.44); X.stroke();
    }
  }
  rr(x - h * 0.12 + lean * 0.5, y - h * 0.81, h * 0.24, h * 0.38, h * 0.09); X.fill();
  X.beginPath(); X.arc(x + lean * 1.4, y - h * 0.9, h * 0.078, 0, 7); X.fill();
  X.fillRect(x - h * 0.03 + lean, y - h * 0.84, h * 0.06, h * 0.06);
  X.lineWidth = h * 0.062;
  for (const s of [-1, 1]) {
    const sx = x + s * h * 0.09 + lean * 0.6, sy = y - h * 0.75, sw = -s * Math.sin(phase) * 0.45 * walk;
    let ex = sx + Math.sin(sw) * h * 0.34 * dir, ey = sy + Math.cos(sw) * h * 0.34;
    if (handle && s === -dir) { ex = handle[0]; ey = handle[1]; }
    ex = lerp(ex, x + dir * h * (s === dir ? 0.3 : 0.26), hug); ey = lerp(ey, sy + h * (s === dir ? 0.06 : 0), hug);
    ex = lerp(ex, sx + s * h * 0.07, raise); ey = lerp(ey, sy - h * 0.3, raise);
    X.beginPath(); X.moveTo(sx, sy); X.lineTo(ex, ey); X.stroke();
  }
}
function vReunion(t) {
  const g = VH * 0.84, h = VH * 0.36;
  X.fillStyle = vgrad(0, VH, [[0, '#F7A552'], [1, '#EC7524']]); X.fillRect(0, 0, VW, VH);
  glow(VW * 0.56, VH * 0.26, VW * 0.9, '255,236,180', 0.85);
  // door the traveller came through
  X.fillStyle = '#FFF3D4'; X.fillRect(VW * 0.07, g - h * 1.22, VW * 0.24, h * 1.22);
  X.fillStyle = '#B1511A'; X.fillRect(0, g, VW, VH - g);
  X.fillStyle = 'rgba(255,243,212,0.3)'; X.beginPath(); X.moveTo(VW * 0.07, g); X.lineTo(VW * 0.31, g); X.lineTo(VW * 0.62, VH); X.lineTo(-VW * 0.1, VH); X.fill();
  // lamp
  const lx = VW * 0.56;
  X.strokeStyle = '#3A1A08'; X.lineWidth = 3; X.beginPath(); X.moveTo(lx, 0); X.lineTo(lx, VH * 0.15); X.stroke();
  X.fillStyle = '#3A1A08'; X.beginPath(); X.moveTo(lx - 14, VH * 0.15); X.lineTo(lx + 14, VH * 0.15); X.lineTo(lx + 34, VH * 0.2); X.lineTo(lx - 34, VH * 0.2); X.fill();
  X.fillStyle = '#FFF6DC'; X.beginPath(); X.ellipse(lx, VH * 0.2, 30, 7, 0, 0, 7); X.fill();
  // people
  const mx = VW * 0.57;
  const hug = eo(seg(t, 31.5, 32.1));
  const tw = eo(seg(t, 29.9, 31.6)), tS = VW * 0.17, tE = mx - h * 0.2;
  const tx0 = lerp(tS, tE, tw), tx = tx0 + hug * h * 0.065;
  const walk = 1 - seg(t, 31.3, 31.6);
  const stopX = VW * 0.26, scx = Math.min(tx0 - h * 0.34, stopX), holding = tx0 - h * 0.34 < stopX;
  const sw = h * 0.2, sh = h * 0.34;
  X.fillStyle = '#3A1A08'; rr(scx - sw / 2, g - sh - h * 0.03, sw, sh, h * 0.03); X.fill();
  X.strokeStyle = '#3A1A08'; X.lineWidth = h * 0.02;
  const hTop = [scx + h * 0.05, g - sh - h * 0.2];
  X.beginPath(); X.moveTo(scx + h * 0.05, g - sh); X.lineTo(hTop[0], hTop[1]); X.stroke();
  person(mx + h * 0.2 - hug * h * 0.065, g, h * 0.93, { dir: -1, hug: Math.max(hug, 0.35 * eo(seg(t, 30.6, 31.4))), dress: true });
  person(tx, g, h, { dir: 1, walk, phase: (tx0 - tS) / (h * 0.42) * Math.PI, hug, handle: holding ? hTop : null });
  const cw = eo(seg(t, 31.0, 32.4)), cS = VW * 1.15, cE = mx + h * 0.52, cx = lerp(cS, cE, cw);
  const hop = t > 32.4 ? Math.abs(Math.sin((t - 32.4) * 7)) * h * 0.05 * (1 - seg(t, 33.2, 33.8)) : 0;
  person(cx, g, h * 0.52, { dir: -1, walk: 1 - seg(t, 32.2, 32.4), phase: (cS - cx) / (h * 0.2) * Math.PI, raise: eo(seg(t, 32.2, 32.6)), hop });
}

/* The wing with its orange winglet stays in frame for the whole flight */
function wing(t, night) {
  const bob = Math.sin(t * 0.9) * 4 + Math.sin(t * 2.3) * 1.5;
  X.save(); X.translate(0, bob + VH * 0.07);
  const p = (x, y) => [VW * x, VH * y];
  const shape = () => { X.beginPath(); X.moveTo(...p(0.30, 0.655)); X.lineTo(...p(1.06, 0.75)); X.lineTo(...p(1.06, 1.06)); X.lineTo(...p(0.29, 0.685)); X.closePath(); };
  shape(); const g = X.createLinearGradient(VW * 0.3, VH * 0.65, VW * 0.8, VH * 1.0); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#CBD0D8'); X.fillStyle = g; X.fill();
  X.strokeStyle = 'rgba(120,130,145,0.5)'; X.lineWidth = 2; X.beginPath(); X.moveTo(...p(0.52, 0.775)); X.lineTo(...p(1.06, 0.93)); X.stroke();
  X.beginPath(); X.moveTo(...p(0.34, 0.661)); X.lineTo(...p(0.272, 0.535)); X.lineTo(...p(0.238, 0.541)); X.lineTo(...p(0.29, 0.686)); X.closePath(); X.fillStyle = C.orange; X.fill();
  if (night > 0) {
    shape(); X.fillStyle = `rgba(10,14,44,${0.62 * night})`; X.fill();
    if (Math.sin(t * 5) > 0.55) glow(VW * 0.255, VH * 0.54, 26, '255,90,60', night);
  }
  X.restore();
}

function view(t) {
  const V = T.vistas, f = 0.3;
  if (t < V[0] + f) vDawn(t);
  if (t > V[0] - f && t < V[1] + f) alpha(seg(t, V[0] - f, V[0] + f), () => vPeaks(t));
  if (t > V[1] - f && t < V[2] + f) alpha(seg(t, V[1] - f, V[1] + f), () => vDesert(t));
  if (t > V[2] - f && t < V[3] + f) alpha(seg(t, V[2] - f, V[2] + f), () => vNight(t));
  if (t > V[3] - f && t < T.zoom[1] + 0.4) alpha(seg(t, V[3] - f, V[3] + f), () => vHome(t));
  if (t > T.zoom[1] - 0.25) alpha(seg(t, T.zoom[1] - 0.25, T.zoom[1] + 0.35), () => {
    const z = lerp(1.25, 1, eo(seg(t, T.zoom[1] - 0.25, T.zoom[1] + 1.2)));
    X.translate(VW / 2, VH / 2); X.scale(z, z); X.translate(-VW / 2, -VH / 2); vReunion(t);
  });
  // flying through cloud between views
  for (const tc of V) {
    const k = 1 - Math.abs(t - tc) / 0.75;
    if (k <= 0) continue;
    alpha(Math.min(1, k * 1.5), () => {
      for (let i = 0; i < 7; i++) {
        const x = VW * 1.6 - ((t - tc + 0.75) / 1.5) * VW * 2.6 + hash(i * 3 + tc) * VW * 1.2 - VW * 0.3;
        cloud(x, VH * (0.1 + i * 0.14), 120 + hash(i + tc) * 90, 'rgba(255,255,255,0.93)');
      }
      X.fillStyle = `rgba(255,255,255,${0.55 * k})`; X.fillRect(0, 0, VW, VH);
    });
  }
  const wa = 1 - seg(t, 26.6, 27.4);
  if (wa > 0) { const night = Math.min(seg(t, V[2] - f, V[2] + f), 1 - seg(t, V[3] - f, V[3] + f)); X.save(); X.translate((1 - wa) * VW * 0.5, (1 - wa) * VH * 0.25); wing(t, night); X.restore(); }
}

/* ---------- the window (and the card it turns into) ---------- */
function windowFrame(t) {
  const k = eio(seg(t, T.card[0], T.card[1]));
  const out = 1 - eio(seg(t, T.final - 0.5, T.final + 0.1));
  if (out <= 0) return;
  const ap = eo(seg(t, 0.1, 0.9));
  const sc = lerp(0.94, 1, ap) * lerp(0.92, 1, out);
  X.save(); X.globalAlpha = ap * out;
  X.translate(WIN.x + WIN.w / 2, WIN.y + WIN.h / 2); X.scale(sc, sc); X.translate(-(WIN.x + WIN.w / 2), -(WIN.y + WIN.h / 2));
  const R = lerp(WIN.r, 56, k);
  X.save(); X.shadowColor = 'rgba(154,84,30,0.22)'; X.shadowBlur = 70; X.shadowOffsetY = 26;
  rr(WIN.x, WIN.y, WIN.w, WIN.h, R); X.fillStyle = C.paper; X.fill(); X.restore();
  rr(WIN.x, WIN.y, WIN.w, WIN.h, R); X.strokeStyle = '#F1E7DA'; X.lineWidth = 2; X.stroke();
  if (k < 1) alpha(1 - k, () => {
    const vx = WIN.x + WIN.ft, vy = WIN.y + WIN.ft, vr = WIN.r - WIN.ft;
    rr(vx - 12, vy - 12, VW + 24, VH + 24, vr + 12); X.fillStyle = '#F4EEE6'; X.fill();
    X.save(); rr(vx, vy, VW, VH, vr); X.clip(); X.translate(vx, vy);
    view(t);
    // shade
    const sk = eio(seg(t, T.shade[0], T.shade[1]));
    if (sk < 1) {
      const sb = VH * (1 - sk);
      X.fillStyle = '#EFE8DE'; X.fillRect(0, 0, VW, sb);
      X.strokeStyle = '#E3DACD'; X.lineWidth = 2;
      for (let y = sb - 16; y > 0; y -= 16) { X.beginPath(); X.moveTo(0, y); X.lineTo(VW, y); X.stroke(); }
      X.fillStyle = '#DDD3C5'; X.fillRect(0, sb - 26, VW, 26);
      rr(VW / 2 - 46, sb - 20, 92, 13, 6.5); X.fillStyle = '#C9BDAC'; X.fill();
      X.fillStyle = vgrad(sb, sb + 40, [[0, 'rgba(60,30,10,0.25)'], [1, 'rgba(60,30,10,0)']]); X.fillRect(0, sb, VW, 40);
    }
    // glass
    X.fillStyle = vgrad(0, 70, [[0, 'rgba(40,20,5,0.22)'], [1, 'rgba(40,20,5,0)']]); X.fillRect(0, 0, VW, 70);
    X.fillStyle = 'rgba(255,255,255,0.07)'; X.beginPath(); X.moveTo(VW * 0.1, 0); X.lineTo(VW * 0.36, 0); X.lineTo(VW * 0.0, VH * 0.7); X.lineTo(0, VH * 0.35); X.fill();
    X.restore();
    rr(vx, vy, VW, VH, vr); X.strokeStyle = 'rgba(120,90,60,0.25)'; X.lineWidth = 3; X.stroke();
  });
  if (k > 0) { X.save(); rr(WIN.x, WIN.y, WIN.w, WIN.h, R); X.clip(); chatCard(t, k); contactCard(t); X.restore(); }
  X.restore();
}

/* ---------- chat ---------- */
const wrapCache = {};
function wrap(text, size, maxW) {
  const key = text + size + maxW; if (wrapCache[key]) return wrapCache[key];
  const words = text.split(' '), lines = []; let cur = '';
  for (const w of words) { const nx = cur ? cur + ' ' + w : w; if (measure(nx, size, 500, 'Manrope') > maxW && cur) { lines.push(cur); cur = w; } else cur = nx; }
  lines.push(cur);
  const width = Math.max(...lines.map(l => measure(l, size, 500, 'Manrope')));
  return wrapCache[key] = { lines, width };
}
function cardHeader(title, sub, y0) {
  const ax = WIN.x + 76, ay = y0 + 66;
  X.drawImage(IMG.round, ax - 40, ay - 40, 80, 80);
  txt(title, ax + 58, ay - 2, { size: LAND ? 34 : 38, align: 'left' });
  X.fillStyle = '#22A559'; X.beginPath(); X.arc(ax + 66, ay + 26, 6, 0, 7); X.fill();
  txt(sub, ax + 82, ay + 34, { size: LAND ? 23 : 26, weight: 500, font: 'Manrope', color: C.muted, align: 'left' });
  X.strokeStyle = C.line; X.lineWidth = 2; X.beginPath(); X.moveTo(WIN.x, y0 + 132); X.lineTo(WIN.x + WIN.w, y0 + 132); X.stroke();
}
function chatCard(t, k) {
  const a = Math.min(k, 1 - seg(t, T.contact - 0.5, T.contact - 0.1));
  if (a <= 0) return;
  alpha(a, () => {
    cardHeader('Fulki Travel', 'online · a real person', WIN.y);
    const fs = LAND ? 31 : 36, lh = fs * 1.36, padX = 26, padY = 18, maxW = WIN.w * 0.72, gap = 18;
    const top = WIN.y + 156, area = WIN.h - 156 - 26;
    const items = [];
    let total = 0;
    for (const m of T.msgs) {
      const w = wrap(m.text, fs, maxW), full = w.lines.length * lh + 2 * padY;
      let h = 0, typing = 0, show = 0;
      if (m.who === 'f' && t >= m.t - 1.0 && t < m.t) { typing = eo(seg(t, m.t - 1.0, m.t - 0.75)); h = 62 * typing; }
      else if (t >= m.t) { show = seg(t, m.t, m.t + 0.32); h = lerp(m.who === 'f' ? 62 : 0, full, eo(seg(t, m.t, m.t + 0.25))); }
      if (h > 0) { items.push({ m, w, full, h, typing, show, y: total }); total += h + gap; }
    }
    const off = Math.max(0, total - area);
    X.save(); X.beginPath(); X.rect(WIN.x, WIN.y + 134, WIN.w, WIN.h - 134); X.clip();
    for (const it of items) {
      const left = it.m.who === 'f', y = top + it.y - off;
      if (it.typing) {
        const bw = 96, x = WIN.x + 26;
        alpha(it.typing, () => {
          rr(x, y, bw, 60, 28); X.fillStyle = '#F4EEE6'; X.fill();
          for (let i = 0; i < 3; i++) { X.fillStyle = C.soft; X.beginPath(); X.arc(x + 28 + i * 20, y + 30 - Math.max(0, Math.sin(t * 9 - i * 0.9)) * 7, 5.5, 0, 7); X.fill(); }
        });
        continue;
      }
      const bw = it.w.width + 2 * padX, x = left ? WIN.x + 26 : WIN.x + WIN.w - 26 - bw;
      const s = eback(it.show), ox = left ? x : x + bw, oy = y + it.full;
      X.save(); X.globalAlpha *= Math.min(1, it.show * 3);
      X.translate(ox, oy); X.scale(s, s); X.translate(-ox, -oy);
      X.beginPath(); X.roundRect(x, y, bw, it.full, left ? [28, 28, 28, 8] : [28, 28, 8, 28]);
      X.fillStyle = left ? '#F4EEE6' : C.orange; X.fill();
      it.w.lines.forEach((l, i) => txt(l, x + padX, y + padY + fs * 0.92 + i * lh, { size: fs, weight: 500, font: 'Manrope', color: left ? C.ink : '#FFFFFF', align: 'left' }));
      X.restore();
    }
    X.restore();
  });
}

/* ---------- ways to reach us ---------- */
function contactCard(t) {
  const a = seg(t, T.contact - 0.1, T.contact + 0.3);
  if (a <= 0) return;
  alpha(a, () => {
    cardHeader('Fulki Travel', 'Arzignano (VI), Italy', WIN.y);
    const rows = [
      [ICON.office, 'In the office', 'Via 4 Martiri, 44 · Arzignano'],
      [ICON.phone, 'By phone', '+39 0444 022494'],
      [ICON.chat, 'On WhatsApp', '+39 0444 022494'],
    ];
    const y0 = WIN.y + 150, rh = (WIN.h - 150 - (LAND ? 150 : 170)) / 3;
    rows.forEach(([icon, label, detail], i) => {
      const p = seg(t, T.rows[i], T.rows[i] + 0.4), cy = y0 + rh * (i + 0.5), cx = WIN.x + 86;
      alpha(Math.min(1, p * 2.5), () => {
        const s = eback(p);
        X.save(); X.translate(cx, cy); X.scale(s, s); X.translate(-cx, -cy);
        X.fillStyle = C.tint; X.beginPath(); X.arc(cx, cy, 46, 0, 7); X.fill();
        icon(cx, cy, 50, C.orange, C.ink); X.restore();
        const dx = (1 - eo(p)) * 24;
        txt(label, cx + 72 + dx, cy - 4, { size: LAND ? 36 : 42, align: 'left' });
        txt(detail, cx + 72 + dx, cy + (LAND ? 32 : 38), { size: LAND ? 25 : 29, weight: 500, font: 'Manrope', color: C.muted, align: 'left' });
      });
    });
    const bp = seg(t, T.b2b, T.b2b + 0.45);
    alpha(Math.min(1, bp * 2), () => {
      const bh = LAND ? 96 : 110, bx = WIN.x + 30, by = WIN.y + WIN.h - bh - 30 + (1 - eo(bp)) * 30, bw = WIN.w - 60;
      rr(bx, by, bw, bh, 30); X.fillStyle = C.ink; X.fill();
      txt('B2B partners welcome', bx + bw / 2, by + bh * 0.46, { size: LAND ? 30 : 34, color: '#FFFFFF' });
      txt('for agencies & businesses', bx + bw / 2, by + bh * 0.8, { size: LAND ? 22 : 25, weight: 500, font: 'Manrope', color: '#FDBA74' });
    });
  });
}

/* ---------- words beside (or under) the window ---------- */
const HEADS = [
  { a: 0.5, b: 2.5, lines: [['Take your seat.', C.ink]] },
  { a: 2.9, b: 9.7, lines: [['Take a journey', C.ink], ['with us.', C.orange]] },
  { a: 10.1, b: 21.7, lines: [['See the', C.ink], ['world.', C.orange]], subs: [[10.6, 13.8, 'Snow peaks at sunrise.'], [14.3, 17.8, 'Golden cities.'], [18.3, 21.6, 'Skylines after dark.']] },
  { a: 22.2, b: 26.7, lines: [['But the best view', C.ink], ["isn't a place.", C.ink]] },
  { a: 27.1, b: 33.5, lines: [['Meet your', C.ink], ['loved ones.', C.orange]], subs: [[30.0, 33.4, 'The people counting the days until you land.']] },
  { a: 34.3, b: 45.6, lines: [['A real person', C.ink], ['by your side.', C.orange]], subs: [[35.2, 45.5, 'Before, during and after your trip.']] },
  { a: 46.1, b: 51.7, lines: [['Talk to us,', C.ink], ['your way.', C.orange]], subs: [[46.8, 51.6, 'Flights worldwide, booked in person.']] },
];
function headlines(t) {
  const align = LAND ? 'left' : 'center';
  for (const h of HEADS) {
    if (t < h.a || t > h.b) continue;
    let size = LAND ? 112 : 120;
    const mw = Math.max(...h.lines.map(l => measure(l[0], size, 700)));
    if (mw > TW) size *= TW / mw;
    const out = eio(seg(t, h.b - 0.45, h.b));
    h.lines.forEach(([s, col], i) => {
      const p = eo(seg(t, h.a + i * 0.14, h.a + i * 0.14 + 0.65)), y = TY + i * size * 1.1;
      X.save(); X.beginPath(); X.rect(0, y - size * 1.05, W, size * 1.4); X.clip();
      X.globalAlpha = Math.min(1, p * 1.5) * (1 - out);
      txt(s, TX, y + (1 - p) * size * 0.9 - out * 24, { size, weight: 700, color: col, align });
      X.restore();
    });
    const sy = TY + (h.lines.length - 1) * size * 1.1 + (LAND ? 84 : 96);
    for (const [a, b, s] of h.subs || []) {
      const sa = Math.min(eo(seg(t, a, a + 0.5)), 1 - seg(t, b - 0.35, b)) * (1 - out);
      const ss = LAND ? 40 : 44, w = wrap(s, ss, TW);
      alpha(sa, () => w.lines.forEach((l, i) => txt(l, TX, sy + i * ss * 1.4 + (1 - sa) * 10, { size: ss, weight: 500, font: 'Manrope', color: C.muted, align })));
    }
  }
  // small logo stays on screen until the sign-off
  const la = Math.min(eo(seg(t, 0.6, 1.4)), 1 - seg(t, T.final - 0.5, T.final));
  alpha(la, () => {
    const lw = LAND ? 250 : 330, lh = lw * 276 / 795;
    X.drawImage(IMG.horiz, LAND ? TX - lw * 0.075 : CX - lw / 2, LAND ? 140 : 52, lw, lh);
  });
}

/* ---------- sign-off ---------- */
function finale(t) {
  if (t < T.final) return;
  const k = LAND ? 0.95 : 1.06, ox = CX - 455 * k, oy = (LAND ? 110 : 430) - 75 * k;
  X.save(); X.translate(ox, oy); X.scale(k, k);
  const u = eio(seg(t, T.final + 0.3, T.final + 2.3));
  const px = lerp(40, 780, u);
  const cg = X.createLinearGradient(80, 0, 740, 0);
  cg.addColorStop(0, 'rgba(234,88,12,0)'); cg.addColorStop(0.55, 'rgba(234,88,12,0.75)'); cg.addColorStop(1, '#EA580C');
  X.save(); X.beginPath(); X.rect(0, 300, Math.max(0, px - 40), 120); X.clip(); X.fillStyle = cg; X.fill(LOGO.trail); X.restore();
  // the wordmark and tagline are uncovered as the plane passes
  X.save(); X.beginPath(); X.rect(0, 40, px + 55, 290); X.clip(); X.translate(80, 250.16); X.fillStyle = C.ink; X.fill(LOGO.word); X.restore();
  const px2 = lerp(40, 880, eio(seg(t, T.final + 0.9, T.final + 2.8)));
  X.save(); X.beginPath(); X.rect(0, 420, px2, 140); X.clip(); X.translate(80, 497.56); X.fillStyle = C.ink; X.fill(LOGO.tag); X.restore();
  alpha(seg(t, T.final + 0.2, T.final + 0.5), () => drawPlane(px, 358.16, 1, 0, C.orange));
  X.restore();

  const cy = LAND ? 660 : 1080, t0 = T.final + 2.9;
  const lines = LAND ? [
    { icon: ICON.pin, parts: [{ text: 'Via 4 Martiri, 44 · 36071 Arzignano (VI), Italy', size: 36, color: C.muted }] },
    { icon: ICON.chat, parts: [{ text: 'WhatsApp & phone   ', size: 34, color: C.muted }, { text: '+39 0444 022494', size: 64, weight: 700, font: 'Outfit', color: C.orange }] },
    { icon: ICON.globe, parts: [{ text: 'fulkitravels.com', size: 36, weight: 600, color: C.ink }, { text: '   ·   ', size: 36, color: C.orange }, { text: '@fulki.travel', size: 36, weight: 600, color: C.ink }] },
  ] : [
    { icon: ICON.pin, parts: [{ text: 'Via 4 Martiri, 44 · Arzignano (VI)', size: 38, color: C.muted }] },
    { icon: null, parts: [{ text: 'WhatsApp & phone', size: 36, color: C.muted }] },
    { icon: ICON.chat, parts: [{ text: '+39 0444 022494', size: 82, weight: 700, font: 'Outfit', color: C.orange }] },
    { icon: ICON.globe, parts: [{ text: 'fulkitravels.com', size: 40, weight: 600, color: C.ink }] },
    { icon: ICON.insta, parts: [{ text: '@fulki.travel', size: 40, weight: 600, color: C.ink }] },
  ];
  const ys = LAND ? [0, 104, 200] : [0, 110, 212, 334, 414];
  lines.forEach((ln, i) => {
    const la = eo(seg(t, t0 + i * 0.22, t0 + 0.6 + i * 0.22));
    alpha(la, () => richLine(ln.parts, CX, cy + ys[i] + (1 - la) * 16, ln.icon, ln.parts[0].size * (ln.parts[0].size > 60 ? 0.9 : 1.15)));
  });
}

/* ---------- background ---------- */
function background(t) {
  X.fillStyle = C.cream; X.fillRect(0, 0, W, H);
  glow(LAND ? W * 0.24 : CX, LAND ? H * 0.5 : H * 0.36, Math.max(W, H) * 0.55, '255,221,186', 0.55);
  for (let i = 0; i < 6; i++) {            // slow paper clouds
    const s = 50 + hash(i * 7 + 2) * 70, span = W + 600;
    const x = ((hash(i * 13 + 5) * span + t * (8 + i * 3)) % span) - 300;
    cloud(x, H * (0.08 + 0.86 * hash(i * 3 + 9)), s, `rgba(255,255,255,${0.75 - 0.45 * seg(t, T.final - 0.5, T.final + 0.5)})`);
  }
}

/* ---------- master ---------- */
function render(t) {
  X.setTransform(1, 0, 0, 1, 0, 0); X.globalAlpha = 1;
  background(t);
  windowFrame(t);
  headlines(t);
  finale(t);
}

function getEvents() {
  const e = [['shade', T.shade[0]], ['ding', 1.0]];
  T.vistas.forEach(v => e.push(['cloud', v]));
  e.push(['zoom', T.zoom[0]], ['morph', T.card[0]]);
  for (const m of T.msgs) { if (m.who === 'u') e.push(['send', m.t]); else e.push(['typing', m.t - 1.0], ['recv', m.t]); }
  T.rows.forEach(r => e.push(['pop', r])); e.push(['pop', T.b2b]);
  e.push(['land', T.final + 0.3], ['bell', T.final + 2.4]);
  return e;
}

function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); }
async function init() {
  const svg = await (await fetch('../assets/logo/fulki-travel-tours-primary.svg')).text();
  const paths = [...new DOMParser().parseFromString(svg, 'image/svg+xml').querySelectorAll('path')].map(p => new Path2D(p.getAttribute('d')));
  [LOGO.word, LOGO.trail, LOGO.plane, LOGO.tag] = paths;
  IMG.horiz = await loadImg('../assets/logo/fulki-travel-tours-horizontal.svg');
  IMG.round = await loadImg('../assets/logo/fulki-icon-round.svg');
  await Promise.all(['600 40px Outfit', '700 40px Outfit', '500 40px Manrope', '600 40px Manrope'].map(f => document.fonts.load(f)));
  await document.fonts.ready;
  render(+(Q.get('t') || 0));
}
window.render = render;
window.getEvents = getEvents;
window.ready = init();
if (Q.get('play')) window.ready.then(() => { const t0 = performance.now(); const loop = () => { render(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; loop(); });
