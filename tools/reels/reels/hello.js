// "Hello" — kinetic poster typography. Five greetings slam in on colour blocks, one per language we speak,
// then the line "We speak your language" and the contacts. Swiss-poster look: Anton, flat colour, hard wipes.
const HELLO_BEAT = 60 / 124;
const HELLOS = [
  // [greeting, language name, background, text colour]
  ["CIAO!", "Italiano", "#ea580c", "#0c0a09"],
  ["HELLO!", "English", "#0c0a09", "#f5efe6"],
  ["¡HOLA!", "Español", "#0f766e", "#f5efe6"],
  ["নমস্কার", "বাংলা", "#fbbf24", "#0c0a09"],
  ["नमस्ते", "हिन्दी", "#f5efe6", "#ea580c"],
];
const H_START = 0.25, H_EACH = 2 * HELLO_BEAT;            // a greeting every two beats
const H_LINES = H_START + HELLOS.length * H_EACH;          // the big line starts after the last greeting
const H_SUB = H_LINES + 6 * HELLO_BEAT;
const H_END = H_SUB + 5 * HELLO_BEAT;                      // the end card

window.REEL = {
  name: "hello",
  langs: ["en", "it"],
  seconds: 14.5,
  end: H_END,
  music: { style: "pop", bpm: 124, key: 0 },
  copy: {
    en: { lines: ["WE SPEAK", "YOUR", "LANGUAGE."], sub: "In person, in 5 languages", cta: "Call or message us" },
    it: { lines: ["PARLIAMO", "LA TUA", "LINGUA."], sub: "Di persona, in 5 lingue", cta: "Chiamaci o scrivici" },
  },
  cues: [],

  build(stage, L) {
    addCSS(`
      .h-scr { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; }
      .h-word { font: 400 300px/1 "Anton", "Noto Sans Bengali", "Noto Sans Devanagari", sans-serif; letter-spacing: -0.01em; white-space: nowrap; }
      .h-scr:nth-child(4) .h-word, .h-scr:nth-child(5) .h-word { font-weight: 700; font-size: 230px; line-height: 1.4; }
      .h-tag { position: absolute; left: 72px; bottom: 120px; font: 800 44px/1 "Manrope", "Noto Sans Bengali", "Noto Sans Devanagari", sans-serif; letter-spacing: .14em; text-transform: uppercase; }
      .h-num { position: absolute; right: 72px; top: 110px; font: 400 64px/1 "Anton", sans-serif; }
      .h-ghost { position: absolute; font: 700 520px/1 "Anton", "Noto Sans Bengali", "Noto Sans Devanagari", sans-serif; opacity: .08; white-space: nowrap; left: -40px; top: 1180px; }
      #hLines { background: #f5efe6; color: #0c0a09; align-items: flex-start; padding: 0 72px; }
      #hLines .h-l { font: 400 250px/0.92 "Anton", sans-serif; text-transform: uppercase; white-space: nowrap; transform-origin: left bottom; }
      #hLines .h-l:last-of-type { color: #ea580c; }
      #hBar { height: 26px; width: 936px; background: #0c0a09; margin-top: 44px; transform-origin: left center; }
      #hSub { margin-top: 40px; font: 800 54px/1.15 "Manrope", sans-serif; }
      #hChips { display: flex; flex-wrap: wrap; gap: 18px; margin-top: 44px; }
      #hChips span { padding: 16px 30px; border-radius: 999px; border: 5px solid #0c0a09; font: 800 40px/1 "Manrope", "Noto Sans Bengali", "Noto Sans Devanagari", sans-serif; }
      #hEnd { background: #ea580c; color: #0c0a09; }
      #hEnd img { width: 860px; }
      #hEnd .cta { margin-top: 90px; font: 400 96px/1 "Anton", sans-serif; text-transform: uppercase; color: #fff; }
      #hEnd .pill { margin-top: 40px; display: flex; align-items: center; gap: 22px; background: #0c0a09; color: #f5efe6; padding: 30px 52px; border-radius: 999px; font: 800 62px/1 "Manrope", sans-serif; }
      #hEnd .pill svg { width: 64px; height: 64px; color: #ea580c; }
      #hEnd .url { margin-top: 36px; font: 800 48px/1 "Manrope", sans-serif; color: #0c0a09; }
    `);
    this.scr = HELLOS.map(([word, name, bg, fg], i) => {
      const s = div("h-scr", stage);
      s.style.background = bg; s.style.color = fg;
      div("h-ghost", s, word);
      div("h-num", s, String(i + 1).padStart(2, "0") + "/05");
      const w = div("h-word", s, word);
      const tag = div("h-tag", s, name);
      return { s, w, tag, at: H_START + i * H_EACH };
    });
    const lines = div("h-scr", stage); lines.id = "hLines";
    this.lines = L.lines.map(l => div("h-l", lines, l));
    div("", lines).id = "hBar";
    div("", lines, L.sub).id = "hSub";
    const chips = div("", lines); chips.id = "hChips";
    this.chips = HELLOS.map(h => div("", chips, h[1], "span"));
    this.linesEl = lines;
    const end = div("h-scr", stage); end.id = "hEnd";
    this.endParts = [div("", end, undefined, "img"), div("cta", end, L.cta), div("pill", end, WA + PHONE), div("url", end, SITE)];
    this.endParts[0].src = LOGO + "fulki-travel-tours-mono-black.svg";
    this.endEl = end;

    this.cues = [];
    for (const s of this.scr) this.cues.push([s.at, "whoosh", .7], [s.at + .12, "impact", .6]);
    this.lines.forEach((_, i) => this.cues.push([H_LINES + i * HELLO_BEAT, "impact", .7]));
    this.cues.push([H_LINES - .15, "whoosh", .8], [H_SUB, "swoosh", .6]);
    this.chips.forEach((_, i) => this.cues.push([H_SUB + .5 + i * .12, "pop", .45]));
    this.cues.push([H_END - .2, "whoosh", .9], [H_END + .9, "ding", .5]);
    REEL.cues = this.cues;
  },

  frame(t) {
    // greetings: each block wipes up over the last, the word slams in and drifts
    for (const { s, w, tag, at } of this.scr) {
      const k = easeOut(prog(t, at - .12, at + .06));
      s.style.transform = `translateY(${(1 - k) * 1920}px)`;
      s.style.visibility = t < at - .12 || t > H_LINES + .2 ? "hidden" : "visible";
      const hit = prog(t, at, at + .3);
      const fit = Math.min(1, 980 / (w.scrollWidth || 1));
      place(w, { s: fit * (1.35 - .35 * backOut(hit)) * (1 + .03 * (t - at)), r: (1 - hit) * -6, o: prog(t, at, at + .05) });
      place(tag, { x: (1 - easeOut(prog(t, at + .15, at + .45))) * -60, o: prog(t, at + .15, at + .35) });
    }
    // the big line: one word per beat, then the bar, the subline and the language chips
    const lin = easeOut(prog(t, H_LINES - .15, H_LINES + .05));
    this.linesEl.style.transform = `translateY(${(1 - lin) * 1920}px)`;
    this.linesEl.style.visibility = t < H_LINES - .15 ? "hidden" : "visible";
    this.lines.forEach((l, i) => {
      const a = H_LINES + i * HELLO_BEAT, k = prog(t, a, a + .22);
      place(l, { y: (1 - easeOut(k)) * 120, sx: Math.min(1, 936 / l.scrollWidth), sy: (0.6 + .4 * backOut(k)) * Math.min(1, 936 / l.scrollWidth), o: prog(t, a, a + .06) });
    });
    $("hBar").style.transform = `scaleX(${easeInOut(prog(t, H_SUB - .3, H_SUB + .1))})`;
    place($("hSub"), { y: (1 - easeOut(prog(t, H_SUB, H_SUB + .35))) * 40, o: prog(t, H_SUB, H_SUB + .25) });
    this.chips.forEach((c, i) => { const a = H_SUB + .5 + i * .12; place(c, { s: .6 + .4 * backOut(prog(t, a, a + .3)), o: prog(t, a, a + .1) }); });
    // end card
    const e = easeOut(prog(t, H_END - .2, H_END + .1));
    this.endEl.style.transform = `translateY(${(1 - e) * 1920}px)`;
    this.endEl.style.visibility = t < H_END - .2 ? "hidden" : "visible";
    this.endParts.forEach((p, i) => {
      const a = H_END + .1 + i * .25;
      place(p, { y: (1 - easeOut(prog(t, a, a + .4))) * 50, s: i === 2 ? 1 + .03 * Math.sin(Math.max(0, t - a - .4) * 5) : 1, o: prog(t, a, a + .3) });
    });
  },
};
