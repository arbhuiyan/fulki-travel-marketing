// "Chat" — a booking told as a phone conversation: a customer asks for a flight, a person at Fulki compares
// the airlines and replies. Soft peach gradient, a phone in the middle, typing dots and message bubbles.
const CH_MSGS = [
  // [who, start, end]: the customer types from start and sends at end; the agent shows typing dots from start
  ["me", 1.0, 2.9],
  ["fk", 3.2, 4.1],
  ["fk", 4.5, 5.8],
  ["me", 6.9, 7.9],
  ["fk", 8.2, 9.1],
];
const CH_OUT = 10.2, CH_END = 12.8;

window.REEL = {
  name: "chat",
  langs: ["en", "it"],
  seconds: 16,
  end: CH_END,
  music: { style: "lofi", bpm: 84, key: 5 },
  copy: {
    en: { kicker: "Booking a flight?", online: "online", input: "Message", typing: "typing…",
          msgs: ["Hi! Flights from Venice to Dhaka in December? 2 adults and a baby",
                 "Hi! Of course, I'm comparing the airlines for you now",
                 "Found 3 good options. Shall I send them here, or would you rather come by the office?",
                 "Send them here, thanks!",
                 "Done! If anything changes later, just write to us here."],
          head: ["Book on WhatsApp.", "A real person replies."], cta: "Message us" },
    it: { kicker: "Devi prenotare un volo?", online: "online", input: "Messaggio", typing: "sta scrivendo…",
          msgs: ["Ciao! Voli da Venezia a Dhaka a dicembre? 2 adulti e un neonato",
                 "Ciao! Certo, confronto subito le compagnie per te",
                 "Ho trovato 3 buone opzioni. Te le mando qui o preferisci passare in agenzia?",
                 "Mandale qui, grazie!",
                 "Fatto! Per qualsiasi cambio, scrivici pure qui."],
          head: ["Prenota su WhatsApp.", "Ti risponde una persona vera."], cta: "Scrivici" },
  },
  cues: [],

  build(stage, L) {
    addCSS(`
      #chBg { position: absolute; inset: 0; background: radial-gradient(120% 80% at 20% 10%, #ffe4cc 0, #fdf2e9 45%, #f6e7da 100%); }
      .ch-blob { position: absolute; border-radius: 50%; filter: blur(60px); }
      #chKick { position: absolute; left: 0; right: 0; top: 120px; text-align: center; font: 800 64px/1.1 "Outfit", sans-serif; color: #1c1917; letter-spacing: -0.02em; }
      #chPhone { position: absolute; left: 150px; top: 270px; width: 780px; height: 1560px; border-radius: 96px; background: #111;
        padding: 22px; box-shadow: 0 60px 120px rgba(120,53,15,.35), inset 0 0 0 4px #333; transform-origin: 50% 40%; }
      #chScreen { position: relative; width: 100%; height: 100%; border-radius: 76px; overflow: hidden; background: #f4ede4;
        background-image: radial-gradient(rgba(234,88,12,.07) 2px, transparent 2px); background-size: 34px 34px; display: flex; flex-direction: column; }
      #chTop { display: flex; align-items: center; gap: 22px; padding: 70px 34px 26px; background: #fff; box-shadow: 0 2px 0 rgba(0,0,0,.05); }
      #chTop img { width: 84px; height: 84px; border-radius: 50%; }
      #chTop b { display: block; font: 800 40px/1.1 "Manrope", sans-serif; color: #1c1917; }
      #chTop small { font: 600 28px/1.2 "Manrope", sans-serif; color: #16a34a; }
      #chList { flex: 1; display: flex; flex-direction: column; justify-content: flex-end; gap: 18px; padding: 24px 28px; overflow: hidden; }
      .ch-m { max-width: 82%; padding: 22px 28px; border-radius: 34px; font: 600 45px/1.3 "Manrope", sans-serif; color: #1c1917; box-shadow: 0 3px 0 rgba(0,0,0,.06); overflow: hidden; flex-shrink: 0; }
      .ch-m.me { align-self: flex-end; background: #ffd9b8; border-bottom-right-radius: 10px; transform-origin: 100% 100%; }
      .ch-m.fk { align-self: flex-start; background: #fff; border-bottom-left-radius: 10px; transform-origin: 0 100%; }
      .ch-m.dots { padding: 26px 30px; display: flex; gap: 12px; }
      .ch-m.dots i { width: 18px; height: 18px; border-radius: 50%; background: #a8a29e; }
      #chBar { display: flex; align-items: center; gap: 18px; padding: 20px 26px 50px; }
      #chInput { flex: 1; min-height: 88px; background: #fff; border-radius: 44px; padding: 22px 32px; font: 600 34px/1.3 "Manrope", sans-serif; color: #1c1917; }
      #chInput.ph { color: #a8a29e; }
      #chSend { width: 88px; height: 88px; border-radius: 50%; background: #ea580c; display: grid; place-items: center; }
      #chSend svg { width: 46px; height: 46px; transform: rotate(45deg); }
      #chHead { position: absolute; left: 70px; right: 70px; top: 300px; font: 800 104px/1.02 "Outfit", sans-serif; letter-spacing: -0.035em; color: #1c1917; }
      #chHead div:last-child { color: #ea580c; }
      #chEnd { position: absolute; left: 0; right: 0; top: 1020px; display: flex; flex-direction: column; align-items: center; }
      #chEnd img { width: 780px; }
      #chEnd .pill { margin-top: 70px; display: flex; align-items: center; gap: 22px; background: #ea580c; color: #fff; padding: 30px 54px; border-radius: 999px; font: 800 60px/1 "Manrope", sans-serif; box-shadow: 0 24px 60px rgba(234,88,12,.35); }
      #chEnd .pill svg { width: 62px; height: 62px; }
      #chEnd .url { margin-top: 34px; font: 700 46px/1 "Manrope", sans-serif; color: #44403c; }
    `);
    div("", stage).id = "chBg";
    for (const [x, y, r, c] of [[-120, 1300, 520, "#fdba74"], [760, -120, 460, "#fecaca"], [700, 1500, 380, "#fde68a"]]) {
      const b = div("ch-blob", stage); Object.assign(b.style, { left: x + "px", top: y + "px", width: r + "px", height: r + "px", background: c, opacity: .55 });
    }
    div("", stage, L.kicker).id = "chKick";
    const phone = div("", stage); phone.id = "chPhone";
    const scr = div("", phone); scr.id = "chScreen";
    const top = div("", scr); top.id = "chTop";
    div("", top, undefined, "img").src = LOGO + "fulki-icon-round.svg";
    div("", top, `<b>Fulki Travel</b><small>● ${L.online}</small>`);
    const list = div("", scr); list.id = "chList";
    const bar = div("", scr); bar.id = "chBar";
    div("", bar).id = "chInput";
    div("", bar, PLANE("#fff")).id = "chSend";
    this.msgs = CH_MSGS.map(([who, a, b], i) => {
      const m = div("ch-m " + who, list, L.msgs[i]);
      const dots = who === "fk" ? div("ch-m fk dots", list, "<i></i><i></i><i></i>") : null;
      if (dots) list.insertBefore(dots, m);
      return { who, a, b, m, dots };
    });
    const head = div("", stage); head.id = "chHead";
    this.head = L.head.map(h => div("", head, h));
    const end = div("", stage); end.id = "chEnd";
    this.end = [div("", end, undefined, "img"), div("pill", end, WA + PHONE), div("url", end, SITE)];
    this.end[0].src = LOGO + "fulki-travel-tours-horizontal.svg";
    this.L = L;

    const cues = [[0.2, "swoosh", .5]];
    for (const x of this.msgs) {
      if (x.who === "me") cues.push(...typeCues(L.msgs[this.msgs.indexOf(x)], x.a, this.cps(x), "type", .25), [x.b, "send", .6]);
      else cues.push([x.b, "receive", .55]);
    }
    cues.push([CH_OUT, "whoosh", .7], [CH_END + .1, "pop", .5], [CH_END + .5, "ding", .45]);
    REEL.cues = cues;
  },

  // the customer types the whole message in the time before sending
  cps(x) { return this.L.msgs[this.msgs.indexOf(x)].length / (x.b - x.a - .25); },

  frame(t) {
    place($("chKick"), { y: (1 - easeOut(prog(t, 0, .6))) * -40, o: prog(t, 0, .4) * (1 - prog(t, CH_OUT - .2, CH_OUT + .1)) });
    // the phone rises in, then at CH_OUT shrinks down and tilts away under the headline
    const pin = easeOut(prog(t, 0, .8)), pout = easeInOut(prog(t, CH_OUT, CH_OUT + .7));
    place($("chPhone"), { y: (1 - pin) * 900 + pout * 760, s: 1 - pout * .42, r: pout * 8, o: 1 - prog(t, CH_END - .3, CH_END) });

    let typing = "";
    for (const x of this.msgs) {
      const open = easeOut(prog(t, x.b, x.b + .25));
      x.m.style.display = t < x.b ? "none" : "";
      x.m.style.maxHeight = x.m.scrollHeight * open + "px";  // scrollHeight is the full height even while clipped
      x.m.style.transform = `scale(${.7 + .3 * backOut(prog(t, x.b, x.b + .3))})`;
      x.m.style.opacity = prog(t, x.b, x.b + .12);
      if (x.dots) {
        const on = t >= x.a && t < x.b;
        x.dots.style.display = on ? "" : "none";
        x.dots.querySelectorAll("i").forEach((d, k) => d.style.transform = `translateY(${-8 * Math.max(0, Math.sin(t * 9 - k * .9))}px)`);
      }
      if (x.who === "me" && t >= x.a && t < x.b) typing = typed(this.L.msgs[this.msgs.indexOf(x)], t, x.a, this.cps(x));
    }
    const inp = $("chInput");
    inp.textContent = typing || this.L.input;
    inp.className = typing ? "" : "ph";
    const top = this.msgs.find(x => x.dots && t >= x.a && t < x.b);
    $("chTop").querySelector("small").textContent = "● " + (top ? this.L.typing : this.L.online);

    this.head.forEach((h, i) => { const a = CH_OUT + .3 + i * .35; place(h, { y: (1 - easeOut(prog(t, a, a + .5))) * 60, o: prog(t, a, a + .3) }); });
    this.end.forEach((e, i) => {
      const a = CH_END + i * .25;
      place(e, { y: (1 - easeOut(prog(t, a, a + .45))) * 50, s: i === 1 ? .9 + .1 * backOut(prog(t, a, a + .4)) : 1, o: prog(t, a, a + .3) });
    });
  },
};
