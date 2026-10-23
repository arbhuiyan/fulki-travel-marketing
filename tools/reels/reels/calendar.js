// "Calendar" — book early for the holidays. A wall calendar on a red wall: its pages tear off month by month,
// stopping at Christmas, Ramadan & Eid and the summer holidays, each marked with a hand-drawn circle or a sticky
// note; then "Seats fill up fast. Book early." Bold red, paper white, Anton headers and a handwritten note.
// Months run from November 2026 to August 2027 (real calendars, built with Date).
const CAL_MONTHS = [[2026, 10], [2026, 11], [2027, 0], [2027, 1], [2027, 2], [2027, 3], [2027, 4], [2027, 5], [2027, 6], [2027, 7]];
// when each page is torn off (page i leaves at CAL_TEAR[i])
const CAL_TEAR = [0.9, 3.4, 3.7, 4.0, 6.5, 6.75, 7.0, 7.25, 7.5];
const CAL_STOPS = [{ page: 1, at: 0.9, day: 25 }, { page: 4, at: 4.0, day: null }, { page: 9, at: 7.5, day: 15 }];
const CAL = { msg: 9.8, end: 12.0 };

window.REEL = {
  name: "calendar",
  langs: ["en", "it"],
  seconds: 15,
  end: CAL.end,
  music: { style: "pop", bpm: 118, key: 2 },
  copy: {
    en: { months: ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"],
          days: ["M", "T", "W", "T", "F", "S", "S"],
          heads: ["Home for Christmas?", "Eid with the family?", "Summer holidays?"],
          notes: ["Christmas &<br>New Year", "Ramadan<br>& Eid", "Summer<br>break!"],
          msg: ["Seats fill up fast.", "Book early."], line: "Tell us your dates today." },
    it: { months: ["GENNAIO", "FEBBRAIO", "MARZO", "APRILE", "MAGGIO", "GIUGNO", "LUGLIO", "AGOSTO", "SETTEMBRE", "OTTOBRE", "NOVEMBRE", "DICEMBRE"],
          days: ["L", "M", "M", "G", "V", "S", "D"],
          heads: ["A casa per Natale?", "L'Eid in famiglia?", "Vacanze d'estate?"],
          notes: ["Natale &<br>Capodanno", "Ramadan<br>& Eid", "Ferragosto!"],
          msg: ["I posti finiscono presto.", "Prenota in anticipo."], line: "Dicci le tue date oggi." },
  },
  cues: [],

  build(stage, L) {
    addCSS(`
      #calBg { position: absolute; inset: 0; background: #b91c1c; background-image: repeating-linear-gradient(90deg, rgba(0,0,0,.05) 0 2px, transparent 2px 60px); }
      #calHead { position: absolute; left: 70px; right: 70px; top: 150px; height: 260px; }
      .cal-h { position: absolute; left: 0; right: 0; top: 0; font: 400 128px/0.98 "Anton", sans-serif; color: #fff; text-transform: uppercase; }
      #calBook { position: absolute; left: 110px; top: 520px; width: 860px; height: 1060px; perspective: 2400px; }
      .cal-p { position: absolute; left: 0; top: 40px; width: 860px; height: 1020px; background: #fffdf8; border-radius: 10px 10px 18px 18px; transform-origin: 50% 0;
        box-shadow: 0 2px 0 #e7e0d4, 0 4px 0 #ddd5c7, 0 6px 0 #d3cab9, 0 30px 60px rgba(0,0,0,.14); overflow: hidden; }
      .cal-p header { background: #0c0a09; color: #fff; padding: 70px 56px 34px; display: flex; justify-content: space-between; align-items: baseline; }
      .cal-p header b { font: 400 110px/1 "Anton", sans-serif; letter-spacing: .01em; }
      .cal-p header span { font: 400 64px/1 "Anton", sans-serif; color: #f87171; }
      .cal-g { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px 0; padding: 30px 40px; text-align: center; }
      .cal-g i { font: 800 34px/2 "Manrope", sans-serif; font-style: normal; color: #a8a29e; }
      .cal-g u { position: relative; font: 700 52px/116px "Manrope", sans-serif; text-decoration: none; color: #1c1917; }
      .cal-g u.we { color: #dc2626; }
      .cal-ring { position: absolute; left: -10px; top: 6px; width: 135px; height: 110px; overflow: visible; }
      #calRings { position: absolute; left: 70px; right: 70px; top: 0; height: 90px; display: flex; justify-content: space-between; z-index: 50; }
      #calRings i { width: 26px; height: 90px; border-radius: 13px; background: linear-gradient(90deg, #57534e, #d6d3d1 45%, #44403c); box-shadow: 0 6px 10px rgba(0,0,0,.4); }
      .cal-note { position: absolute; z-index: 60; width: 420px; padding: 40px 34px; background: #fde047; color: #1c1917; font: 700 88px/0.95 "Caveat", cursive;
        box-shadow: 0 20px 40px rgba(0,0,0,.3); }
      .cal-note::before { content: ""; position: absolute; left: 130px; top: -22px; width: 120px; height: 44px; background: rgba(255,255,255,.55); transform: rotate(-4deg); }
      #calMsg { position: absolute; left: 70px; right: 70px; top: 640px; }
      #calMsg div { font: 400 150px/0.98 "Anton", sans-serif; color: #fff; text-transform: uppercase; }
      #calMsg div:nth-child(2) { color: #fde047; }
      #calEnd { position: absolute; inset: 0; background: #0c0a09; display: flex; flex-direction: column; align-items: center; justify-content: center; }
      #calEnd img { width: 780px; }
      #calEnd .line { margin-top: 80px; font: 700 84px/1 "Caveat", cursive; color: #fde047; }
      #calEnd .pill { margin-top: 60px; display: flex; align-items: center; gap: 22px; background: #dc2626; color: #fff; padding: 30px 54px; border-radius: 999px; font: 800 60px/1 "Manrope", sans-serif; }
      #calEnd .pill svg { width: 62px; height: 62px; }
      #calEnd .url { margin-top: 34px; font: 700 46px/1 "Manrope", sans-serif; color: #d6d3d1; }
    `);
    div("", stage).id = "calBg";
    const head = div("", stage); head.id = "calHead";
    this.heads = L.heads.map(h => div("cal-h", head, h));
    const book = div("", stage); book.id = "calBook";
    // pages: the first month on top
    this.pages = CAL_MONTHS.map(([y, m], i) => {
      const p = div("cal-p", book);
      p.style.zIndex = 40 - i;
      p.innerHTML = `<header><b>${L.months[m]}</b><span>${y}</span></header>`;
      const g = div("cal-g", p);
      for (const d of L.days) div("", g, d, "i");
      const first = (new Date(y, m, 1).getDay() + 6) % 7, count = new Date(y, m + 1, 0).getDate();
      for (let k = 0; k < first; k++) div("", g, "", "u");
      const cells = {};
      for (let d = 1; d <= count; d++) cells[d] = div((first + d - 1) % 7 >= 5 ? "we" : "", g, String(d), "u");
      return { p, cells };
    });
    const rings = div("", book); rings.id = "calRings";
    for (let i = 0; i < 9; i++) div("", rings, undefined, "i");
    // the stops: a marker circle around the day (if any) and a sticky note
    this.stops = CAL_STOPS.map((s, i) => {
      let ring = null;
      if (s.day) {
        const c = this.pages[s.page].cells[s.day];
        const sv = svg("svg", { class: "cal-ring", viewBox: "0 0 135 110" }, c);
        ring = svg("path", { d: "M100 14C60 0 8 18 10 58C12 98 80 108 116 82C140 62 128 18 82 10", fill: "none", stroke: "#dc2626", "stroke-width": 7, "stroke-linecap": "round", pathLength: 1, "stroke-dasharray": 1 }, sv);
      }
      const note = div("cal-note", book, L.notes[i]);
      Object.assign(note.style, [{ left: "-40px", top: "720px" }, { left: "440px", top: "600px" }, { left: "-40px", top: "760px" }][i]);
      return { ...s, ring, note, end: i < 2 ? CAL_TEAR[CAL_STOPS[i + 1].page - 1] - 2 * 0.25 : CAL.msg };
    });
    const msg = div("", stage); msg.id = "calMsg";
    this.msg = L.msg.map(m => div("", msg, m));
    const end = div("", stage); end.id = "calEnd";
    this.end = [div("", end, undefined, "img"), div("line", end, L.line), div("pill", end, WA + PHONE), div("url", end, SITE)];
    this.end[0].src = LOGO + "fulki-travel-tours-horizontal-reversed.svg";

    const cues = [[0.1, "thud", .6]];
    for (const a of CAL_TEAR) cues.push([a, "tear", .6, .2]);
    for (const s of this.stops) cues.push([s.at + .45, "swoosh", .4], [s.at + .7, "pop", .5]);
    cues.push([CAL.msg, "whoosh", .7], [CAL.msg + .1, "impact", .6], [CAL.msg + .6, "impact", .6], [CAL.end - .2, "whoosh", .7], [CAL.end + 1, "ding", .4]);
    REEL.cues = cues;
  },

  frame(t) {
    place($("calBook"), { y: (1 - easeOut(prog(t, 0, .5))) * -1400 - easeIn(prog(t, CAL.msg - .3, CAL.msg + .3)) * 1500, r: (1 - easeOut(prog(t, 0, .6))) * -4 });
    // each page tears off: it swings up on its top edge, then flies off and away
    this.pages.forEach(({ p }, i) => {
      const a = CAL_TEAR[i];
      if (a === undefined) return;
      const k = prog(t, a, a + .45);
      p.style.visibility = k >= 1 ? "hidden" : "visible";
      p.style.transform = `translate(${easeIn(k) * (i % 2 ? -500 : 500)}px, ${-easeIn(k) * 900}px) rotateX(${easeOut(k) * 70}deg) rotate(${easeIn(k) * (i % 2 ? -25 : 25)}deg)`;
    });
    this.stops.forEach((s, i) => {
      const a = s.at + .45;
      if (s.ring) s.ring.setAttribute("stroke-dashoffset", 1 - easeInOut(prog(t, a, a + .4)));
      const out = prog(t, s.end - .15, s.end + .05);
      place(s.note, { s: .5 + .5 * backOut(prog(t, a + .25, a + .55)), r: (i % 2 ? 5 : -6) + (1 - prog(t, a + .25, a + .55)) * 20, o: prog(t, a + .25, a + .35) * (1 - out) });
      place(this.heads[i], { y: (1 - easeOut(prog(t, s.at + .2, s.at + .6))) * 60, o: prog(t, s.at + .2, s.at + .45) * (1 - prog(t, s.end - .15, s.end + .05)) });
    });
    this.msg.forEach((m, i) => { const a = CAL.msg + i * .5; place(m, { x: (1 - easeOut(prog(t, a, a + .35))) * 300, o: prog(t, a, a + .15) * (1 - prog(t, CAL.end - .3, CAL.end)) }); });
    $("calEnd").style.transform = `translateY(${(1 - easeOut(prog(t, CAL.end - .25, CAL.end))) * 1920}px)`;
    this.end.forEach((e, i) => { const a = CAL.end + .1 + i * .25; place(e, { y: (1 - easeOut(prog(t, a, a + .45))) * 50, r: i === 1 ? -3 : 0, o: prog(t, a, a + .3) }); });
  },
};
