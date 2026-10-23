// Helpers shared by every reel (tools/reels/reels/*.js). A reel is a pure function of time:
// REEL.build(stage, copy, lang) makes its elements once, REEL.frame(t) sets them for t seconds.
const PHONE = "+39 0444 022494";
const SITE = "fulkitravels.com";
const ADDRESS = "Via 4 Martiri, 44 · Arzignano (VI)";
const LOGO = "../../assets/logo/";

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const prog = (t, a, b) => clamp((t - a) / (b - a));       // 0 before a, 1 after b
const lerp = (a, b, k) => a + (b - a) * k;
const easeOut = x => 1 - Math.pow(1 - x, 3);
const easeIn = x => x * x * x;
const easeInOut = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const backOut = (x, c = 1.7) => 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
const elastic = x => x <= 0 ? 0 : x >= 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - .75) * 2 * Math.PI / 3) + 1;
// in-and-out window: rises over `fade` after a, falls over `fade` before b
const win = (t, a, b, fade = .25) => prog(t, a, a + fade) * (1 - prog(t, b - fade, b));
const hash = (...n) => { let h = 2166136261; for (const v of n) { h ^= (v * 2654435761) >>> 0; h = Math.imul(h, 16777619) >>> 0; } return (h >>> 0) / 4294967296; };
const $ = id => document.getElementById(id);

function addCSS(css) { const s = document.createElement("style"); s.textContent = css; document.head.appendChild(s); }

// an HTML element with class names cls, appended to parent: div("a b", parent, "inner html", "span")
function div(cls, parent, html, tag = "div") {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  if (parent) parent.appendChild(e);
  return e;
}
const NS = "http://www.w3.org/2000/svg";
function svg(tag, attrs, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
// set transform and opacity in one go: place(e, {x, y, s, r, o})
function place(e, { x = 0, y = 0, s = 1, sx, sy, r = 0, o = 1 } = {}) {
  e.style.transform = `translate(${x}px, ${y}px) rotate(${r}deg) scale(${sx ?? s}, ${sy ?? s})`;
  e.style.opacity = o;
}
// the first n characters of a string, for typing effects (HTML-safe if the string has no tags)
const typed = (str, t, a, cps) => str.slice(0, Math.max(0, Math.floor((t - a) * cps)));
// a cue per typed character, for the soundtrack
const typeCues = (str, a, cps, name = "type", gain = .35) => [...str].map((ch, i) => ch === " " ? null : [a + i / cps, name, gain]).filter(Boolean);

const WA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z"/></svg>';
const PLANE_PATH = "M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z";
const PLANE = (fill = "currentColor") => `<svg viewBox="0 0 24 24"><path fill="${fill}" d="${PLANE_PATH}"/></svg>`;
