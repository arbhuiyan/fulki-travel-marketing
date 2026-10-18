// Split-flap card drawing shared by the logo video and the promo: the card from fulki-f-flap-black-orange.svg.
// Card geometry in the logo's own units (fulki-f-flap-*.svg: card 317.44 x 389.12)
const FW = 317.44, FH = 389.12, RX = 28.57, SPLIT = FH * 0.012;
const TOP = ["#2A2725", "#F97316"], BOT = ["#232120", "#EA580C"];        // card, orange glyph
const WTOP = ["#2A2725", "#F5F5F4"], WBOT = ["#232120", "#D6D3D1"];      // card, white glyph
const PLANE = "M50 0C50 -3.6 46.5 -5.6 41 -5.6H15L-4 -40.5C-5 -42.3 -6.6 -43 -8.6 -43H-13.4C-15 -43 -15.9 -41.8 -15.4 -40.3L-6.4 -5.6H-31L-39.6 -17.4C-40.4 -18.5 -41.4 -19 -42.8 -19H-46.4C-47.7 -19 -48.4 -18 -48 -16.8L-44.2 -4.2C-44.6 -2.8 -44.6 2.8 -44.2 4.2L-48 16.8C-48.4 18 -47.7 19 -46.4 19H-42.8C-41.4 19 -40.4 18.5 -39.6 17.4L-31 5.6H-6.4L-15.4 40.3C-15.9 41.8 -15 43 -13.4 43H-8.6C-6.6 43 -5 42.3 -4 40.5L15 5.6H41C46.5 5.6 50 3.6 50 0Z";
const FULKI = "M4.11 0V-43.03H13.71V0ZM11.46 -16.85V-25.11H32.97V-16.85ZM11.46 -34.77V-43.03H33.95V-34.77ZM61.08 0.67Q55.79 0.67 51.74 -1.6Q47.68 -3.87 45.39 -7.85Q43.09 -11.83 43.09 -16.91V-43.03H52.69V-16.4Q52.69 -13.81 53.8 -11.93Q54.91 -10.05 56.82 -9.05Q58.73 -8.05 61.08 -8.05Q63.48 -8.05 65.32 -9.05Q67.16 -10.05 68.23 -11.91Q69.3 -13.77 69.3 -16.33V-43.03H78.93V-16.85Q78.93 -11.77 76.66 -7.82Q74.39 -3.87 70.38 -1.6Q66.37 0.67 61.08 0.67ZM90.17 0V-43.03H99.77V0ZM97.55 0V-8.38H118.85V0ZM154.08 0 136.62 -22.43 153.5 -43.03H165.32L146.31 -20.66V-24.53L165.96 0ZM128.02 0V-43.03H137.62V0ZM173.55 0V-43.03H183.15V0Z";

// The F from flap_f() in build_logos.py: centred (no signature) and raised (with FULKI + plane under it)
function fRects(sig) {
  let gw, gh, gx, gy;
  if (sig) { gw = FW * 0.4; gh = FH * 0.48; gx = (FW - gw) / 2 + FW * 0.02; gy = FH * 0.12; }
  else { gw = FW * 0.5; gh = FH * 0.64; gx = (FW - gw) / 2 + FW * 0.02; gy = (FH - gh) / 2; }
  const t = gw * 0.34;
  return `<rect x="${gx}" y="${gy}" width="${t}" height="${gh}"/><rect x="${gx}" y="${gy}" width="${gw}" height="${t * 0.88}"/>` +
         `<rect x="${gx}" y="${gy + gh * 0.37}" width="${gw * 0.82}" height="${t * 0.8}"/>`;
}

// One face of a card: " ", a character, "^" (plane), "F" (logo F) or "LOGO" (F with FULKI + plane under it).
// Faces are orange; pass { ch, white: true } for a white character.
function face(f, bottom) {
  const ch = f.ch ?? f;
  const [card, glyph] = f.white ? (bottom ? WBOT : WTOP) : (bottom ? BOT : TOP);
  let g = "";
  if (ch === "LOGO") {
    g = `<g fill="${glyph}">${fRects(true)}</g>` +
        `<path fill="${BOT[1]}" transform="translate(34.95 334.64)" d="${FULKI}"/>` +
        `<path fill="${BOT[1]}" transform="translate(259.9 313.13) scale(0.4518)" d="${PLANE}"/>`;
  } else if (ch === "F" && !f.white) {
    g = `<g fill="${glyph}">${fRects(false)}</g>`;
  } else if (ch === "^") {
    g = `<path fill="${glyph}" transform="translate(${FW / 2} ${FH / 2}) scale(1.75)" d="${PLANE}"/>`;
  } else if (ch.trim()) {
    g = `<text x="${FW / 2}" y="${FH / 2 + 84}" text-anchor="middle" font-family="Outfit" font-weight="700" font-size="236" fill="${glyph}">${ch}</text>`;
  }
  const shadow = bottom ? `<rect x="0" y="${FH / 2}" width="${FW}" height="${FH * 0.07}" fill="url(#sh)"/>` : "";
  return `<rect width="${FW}" height="${FH}" rx="${RX}" fill="${card}"/>${g}${shadow}`;
}

function halfSvg(f, bottom, w, h) {
  const top = bottom ? -(h / 2 + h * SPLIT / FH) : 0;
  return `<svg viewBox="0 0 ${FW} ${FH}" width="${w}" height="${h}" style="top:${top}px">` +
    `<defs><linearGradient id="sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.35"/>` +
    `<stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient></defs>${face(f, bottom)}</svg>`;
}

// A split-flap card at (x, y, w) going from face a to face b, p in [0, 1] (null = resting on a)
function card(x, y, w, a, b, p, opacity = 1) {
  const h = w * FH / FW, s = h * SPLIT / FH, hh = h / 2 - s;
  const top = f => `<div class="half" style="top:0;height:${hh}px">${halfSvg(f, false, w, h)}</div>`;
  const bot = f => `<div class="half" style="top:${h / 2 + s}px;height:${hh}px">${halfSvg(f, true, w, h)}</div>`;
  let html;
  if (p === null) {
    html = top(a) + bot(a);
  } else {
    // falling flap accelerates like a real one, then the lower flap lands with a small bounce
    const e = Math.min(1, Math.pow(p, 1.7) * 1.04);
    html = top(b) + bot(a);
    if (e < 0.5) {
      const ang = -e * 180;
      html += `<div class="flap" style="top:0;height:${hh}px;transform-origin:50% ${h / 2}px;transform:rotateX(${ang}deg)">` +
              `${halfSvg(a, false, w, h)}<div class="shade" style="opacity:${e * 0.9}"></div></div>` +
              `<div class="shade" style="top:${h / 2 + s}px;height:${hh}px;inset:auto 0 0 0;opacity:${e * 0.5}"></div>`;
    } else {
      const ang = (1 - e) * 180;
      html += `<div class="flap" style="top:${h / 2 + s}px;height:${hh}px;transform-origin:50% ${-s}px;transform:rotateX(${ang}deg)">` +
              `${halfSvg(b, true, w, h)}<div class="shade" style="opacity:${(1 - e) * 0.9}"></div></div>`;
    }
  }
  // hinge and the pins either side of it
  const pw = w * 0.035, ph = h * 0.07;
  html += `<div style="position:absolute;left:0;top:${h / 2 - s}px;width:${w}px;height:${2 * s}px;background:#000"></div>`;
  for (const px of [-pw * 0.4, w - pw * 0.6])
    html += `<div style="position:absolute;left:${px}px;top:${h / 2 - ph / 2}px;width:${pw}px;height:${ph}px;border-radius:${pw * 0.3}px;background:#2A2725;opacity:.9"></div>`;
  // the drop shadow is costly to render, so small board cells go without
  const shadow = w > 120 ? `filter:drop-shadow(0 ${w * 0.03}px ${w * 0.05}px rgba(0,0,0,.6))` : "";
  return `<div class="cell" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;opacity:${opacity};${shadow}">${html}</div>`;
}
