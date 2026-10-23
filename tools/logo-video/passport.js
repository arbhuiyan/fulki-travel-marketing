// The passport visa page that closes the paper-plane promos: security print, a page number and an ink stamp from
// each city, plus the rubber stamp that inks the Fulki plane in. Needs flap.js (PLANE) and the Outfit font.
const Passport = (() => {
const W = 1080, H = 1920;
function rng(seed) {   // mulberry32
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let x = Math.imul(seed ^ seed >>> 15, 1 | seed);
                 x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; };
}
const OLD = [   // shape, centre, rotation, size, ink, lines
  ["circle", 190, 270, -12, 118, "#1D4ED8", ["VENEZIA", "ITALIA", "14 MAR 2026"]],
  ["rect", 850, 235, 8, [280, 150], "#15803D", ["DAKAR", "SÉNÉGAL", "ARRIVÉE · 02 AVR 2026"]],
  ["circle", 125, 830, 14, 100, "#B91C1C", ["ACCRA", "GHANA", "19 APR 2026"]],
  ["rect", 958, 880, -9, [230, 140], "#6D28D9", ["DUBAI", "U.A.E.", "ARRIVAL · 07 MAY 2026"]],
  ["circle", 225, 1735, -8, 112, "#047857", ["DHAKA", "BANGLADESH", "21 JUN 2026"]],
  ["rect", 830, 1740, 6, [290, 160], "#1E3A8A", ["BANGKOK", "THAILAND", "ARRIVAL · 15 JUL 2026"]],
];

// draws the page into a 1080x1920 <svg>; stamp i is the group #old<i>, centred on its own origin, hidden until shown
function build(svg) {
  const r = rng(9);
  let h = `<defs>
    <filter id="ink" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 2" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in"/></filter>
    <filter id="ink2" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="8" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.95" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in"/></filter>
    <linearGradient id="fold" x1="0" x2="1"><stop offset="0" stop-color="#8A7556" stop-opacity=".28"/><stop offset="1" stop-color="#8A7556" stop-opacity="0"/></linearGradient></defs>`;
  // security print: fine wavy lines across the page
  for (let i = 0; i < 64; i++) {
    const y0 = i * 31, ph = i * 0.7;
    let d = "";
    for (let x = 0; x <= W; x += 12) d += `${x ? "L" : "M"}${x} ${(y0 + 9 * Math.sin(x / 70 + ph) + 5 * Math.sin(x / 23 - ph)).toFixed(1)}`;
    h += `<path d="${d}" fill="none" stroke="${i % 2 ? "#BFD2C9" : "#E2C6BD"}" stroke-width="1.4" opacity=".55"/>`;
  }
  h += `<rect width="70" height="${H}" fill="url(#fold)"/>`;
  h += `<text x="540" y="78" text-anchor="middle" font-family="Outfit" font-weight="600" font-size="24" letter-spacing="12" fill="#A39580">VISAS</text>`;
  h += `<text x="540" y="1890" text-anchor="middle" font-family="Outfit" font-weight="600" font-size="24" fill="#A39580">07</text>`;
  OLD.forEach(([shape, x, y, rot, size, ink, [a, b, c]], i) => {
    let g = "";
    if (shape === "circle") {
      const rr = size, tr = rr - 32;
      g += `<circle r="${rr}" fill="none" stroke="${ink}" stroke-width="6"/><circle r="${rr - 14}" fill="none" stroke="${ink}" stroke-width="2.5"/>`;
      g += `<path id="arcT${i}" d="M${-tr} 0A${tr} ${tr} 0 0 1 ${tr} 0" fill="none"/><path id="arcB${i}" d="M${-tr - 20} 0A${tr + 20} ${tr + 20} 0 0 0 ${tr + 20} 0" fill="none"/>`;
      g += `<text font-family="Outfit" font-weight="800" font-size="${rr * 0.26}" letter-spacing="4" fill="${ink}"><textPath href="#arcT${i}" startOffset="50%" text-anchor="middle">${a}</textPath></text>`;
      g += `<text font-family="Outfit" font-weight="700" font-size="${rr * 0.17}" letter-spacing="3" fill="${ink}"><textPath href="#arcB${i}" startOffset="50%" text-anchor="middle">${b}</textPath></text>`;
      g += `<text y="${rr * 0.16}" text-anchor="middle" font-family="Outfit" font-weight="700" font-size="${rr * 0.15}" fill="${ink}">${c}</text>`;
      g += `<path transform="translate(0 ${-rr * 0.2}) scale(${rr / 260})" d="${PLANE}" fill="${ink}"/>`;
    } else {
      const [w, hh] = size;
      g += `<rect x="${-w / 2}" y="${-hh / 2}" width="${w}" height="${hh}" rx="14" fill="none" stroke="${ink}" stroke-width="6"/>`;
      g += `<rect x="${-w / 2 + 11}" y="${-hh / 2 + 11}" width="${w - 22}" height="${hh - 22}" rx="7" fill="none" stroke="${ink}" stroke-width="2.5"/>`;
      g += `<text y="${-hh * 0.08}" text-anchor="middle" font-family="Outfit" font-weight="800" font-size="${hh * 0.27}" letter-spacing="4" fill="${ink}">${a}</text>`;
      g += `<text y="${hh * 0.15}" text-anchor="middle" font-family="Outfit" font-weight="700" font-size="${hh * 0.13}" letter-spacing="3" fill="${ink}">${b}</text>`;
      g += `<text y="${hh * 0.33}" text-anchor="middle" font-family="Outfit" font-weight="600" font-size="${hh * 0.11}" fill="${ink}">${c}</text>`;
    }
    h += `<g id="old${i}" data-x="${x}" data-y="${y}" data-rot="${rot}" opacity="0"><g filter="url(#ink)" opacity="${0.78 + 0.15 * r()}">${g}</g></g>`;
  });
  svg.innerHTML = h;
}

// a rubber stamp seen from the side, its rubber face resting at (x, y)
function stamper(x, y, squash) {
  const sq = 1 - squash;
  return `<g transform="translate(${x} ${y}) scale(${1.5 * (1 + squash * 0.3)} ${1.5 * sq})">` +
    `<rect x="-92" y="-16" width="184" height="16" rx="3" fill="#1C1917"/><rect x="-92" y="-5" width="184" height="5" fill="#C2410C"/>` +
    `<rect x="-100" y="-50" width="200" height="36" rx="8" fill="#292524"/><rect x="-100" y="-50" width="200" height="8" rx="4" fill="#57534E"/>` +
    `<path d="M-38 -50L-22 -78H22L38 -50Z" fill="#78350F"/><rect x="-20" y="-188" width="40" height="112" fill="#A16207"/>` +
    `<rect x="-20" y="-188" width="11" height="112" fill="#CA8A04" opacity=".6"/>` +
    `<path d="M-20 -186Q-30 -200 -26 -206H26Q30 -200 20 -186Z" fill="#92400E"/>` +
    `<ellipse cx="0" cy="-238" rx="58" ry="44" fill="#92400E"/><ellipse cx="-16" cy="-254" rx="24" ry="14" fill="#CA8A04" opacity=".45"/></g>`;
}

// stamp i landing on the page: k = 0 (not yet) .. 1 (down)
function show(i, k) {
  const o = OLD[i], el = document.getElementById("old" + i), e = 1 - Math.pow(1 - Math.max(0, Math.min(1, k)), 3);
  el.setAttribute("opacity", k > 0 ? 1 : 0);
  el.setAttribute("transform", `translate(${o[1]} ${o[2]}) rotate(${o[3]}) scale(${1 + 0.25 * (1 - e)})`);
}

return { OLD, build, stamper, show };
})();
