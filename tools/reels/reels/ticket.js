// "Ticket" — how it works in three steps, told on a paper boarding pass: it prints out of a slot, the trip is
// typed in, the route options cycle while we compare, a CONFIRMED stamp lands and the stub tears off.
// Dark desk under a spotlight, cream paper, Space Mono.
const TK = { print: [0.9, 2.5], s1: 2.7, s2: 5.3, s3: 7.9, stamp: 8.5, tear: 9.4, away: 10.7, end: 11.4 };

window.REEL = {
  name: "ticket",
  langs: ["en", "it"],
  seconds: 15,
  end: TK.end,
  music: { style: "corporate", bpm: 108, key: 5 },
  copy: {
    en: { title: "3 steps.<br>No surprises.", pass: "BOARDING PASS", from: "VCE", fromCity: "VENICE", to: "DAC", toCity: "DHAKA",
          labels: ["DATE", "PASSENGERS", "ROUTE", "STATUS"], date: "12 DEC", pax: "2 ADULTS + 1 INFANT",
          routes: ["VCE · IST · DAC", "VCE · DOH · DAC", "VCE · DXB · DAC"], comparing: "COMPARING…", ok: "CONFIRMED",
          steps: ["Tell us about your trip", "We compare the airlines", "You fly. We stay reachable."],
          line: "Before, during and after your trip." },
    it: { title: "3 passi.<br>Nessuna sorpresa.", pass: "CARTA D'IMBARCO", from: "VCE", fromCity: "VENEZIA", to: "DAC", toCity: "DHAKA",
          labels: ["DATA", "PASSEGGERI", "ROTTA", "STATO"], date: "12 DIC", pax: "2 ADULTI + 1 NEONATO",
          routes: ["VCE · IST · DAC", "VCE · DOH · DAC", "VCE · DXB · DAC"], comparing: "CONFRONTO…", ok: "CONFERMATO",
          steps: ["Raccontaci il viaggio", "Confrontiamo le compagnie", "Tu voli. Noi restiamo raggiungibili."],
          line: "Prima, durante e dopo il viaggio." },
  },
  cues: [],

  build(stage, L) {
    addCSS(`
      #tkBg { position: absolute; inset: 0; background: radial-gradient(70% 45% at 50% 42%, #2b2f3a 0, #14161c 60%, #0b0c10 100%); }
      #tkTitle { position: absolute; left: 80px; top: 110px; font: 700 92px/1.08 "Space Mono", monospace; color: #f5efe6; letter-spacing: -0.02em; }
      #tkSlot { position: absolute; left: 50px; right: 50px; top: 330px; height: 56px; border-radius: 18px; background: linear-gradient(#3a3f4b, #1f232b);
        box-shadow: 0 20px 40px rgba(0,0,0,.5); z-index: 3; }
      #tkSlot::after { content: ""; position: absolute; left: 60px; right: 60px; bottom: 10px; height: 10px; border-radius: 5px; background: #07080a; }
      #tkFeed { position: absolute; left: 0; right: 0; top: 376px; bottom: 0; overflow: hidden; }
      #tkPass { position: absolute; left: 110px; width: 860px; top: 0; height: 1060px; }
      .tk-paper { position: absolute; left: 0; right: 0; background: #fbf7ef; color: #1c1917; font-family: "Space Mono", monospace;
        box-shadow: 0 30px 60px rgba(0,0,0,.45); }
      #tkMain { top: 0; height: 760px; border-radius: 0 0 26px 26px; padding: 0 56px; }
      #tkStub { top: 760px; height: 300px; border-radius: 26px; padding: 40px 56px; border-top: 6px dashed #d6cfc2; }
      #tkHead { margin: 0 -56px; padding: 30px 56px; background: #ea580c; color: #fff; display: flex; justify-content: space-between; align-items: center; font: 700 34px/1 "Space Mono", monospace; letter-spacing: .08em; }
      #tkHead img { height: 54px; }
      #tkCodes { display: flex; align-items: center; justify-content: space-between; margin-top: 46px; font: 700 150px/1 "Space Mono", monospace; letter-spacing: -0.04em; }
      #tkCodes svg { width: 110px; height: 110px; transform: rotate(45deg); }
      #tkCities { display: flex; justify-content: space-between; font: 400 34px/1 "Space Mono", monospace; color: #78716c; margin-top: 12px; }
      #tkFields { display: grid; grid-template-columns: 1fr 1.6fr; gap: 34px 30px; margin-top: 54px; }
      .tk-f small { display: block; font: 400 26px/1 "Space Mono", monospace; color: #a8a29e; letter-spacing: .12em; }
      .tk-f b { display: block; margin-top: 10px; font: 700 40px/1.15 "Space Mono", monospace; min-height: 46px; white-space: nowrap; }
      .tk-f.wide { grid-column: span 2; }
      #tkBars { display: flex; gap: 0; height: 150px; align-items: stretch; }
      #tkBars i { display: block; background: #1c1917; }
      #tkStubTxt { display: flex; justify-content: space-between; margin-top: 22px; font: 700 30px/1 "Space Mono", monospace; letter-spacing: .1em; color: #57534e; }
      #tkStamp { position: absolute; left: 250px; top: 600px; padding: 16px 30px; border: 10px solid #dc2626; border-radius: 22px; color: #dc2626;
        font: 700 66px/1 "Space Mono", monospace; letter-spacing: .06em; mix-blend-mode: multiply; }
      #tkCap { position: absolute; left: 80px; right: 80px; top: 1510px; z-index: 4; }
      .tk-c { position: absolute; left: 0; right: 0; display: flex; gap: 30px; align-items: baseline; color: #f5efe6; }
      .tk-c b { font: 700 120px/1 "Space Mono", monospace; color: #ea580c; }
      .tk-c span { font: 800 64px/1.08 "Outfit", sans-serif; letter-spacing: -0.02em; }
      #tkEnd { position: absolute; inset: 0; background: #0c0a09; display: flex; flex-direction: column; align-items: center; justify-content: center; }
      #tkEnd img { width: 760px; }
      #tkEnd .line { margin-top: 80px; font: 700 50px/1.25 "Space Mono", monospace; color: #f5efe6; text-align: center; padding: 0 80px; }
      #tkEnd .pill { margin-top: 70px; display: flex; align-items: center; gap: 22px; background: #ea580c; color: #fff; padding: 30px 54px; border-radius: 999px; font: 800 60px/1 "Manrope", sans-serif; }
      #tkEnd .pill svg { width: 62px; height: 62px; }
      #tkEnd .url { margin-top: 34px; font: 700 46px/1 "Space Mono", monospace; color: #d6d3d1; }
    `);
    div("", stage).id = "tkBg";
    div("", stage, "").id = "tkTitle";
    div("", stage).id = "tkSlot";
    const feed = div("", stage); feed.id = "tkFeed";
    const pass = div("", feed); pass.id = "tkPass";
    const main = div("tk-paper", pass); main.id = "tkMain";
    div("", main, `<span>${L.pass}</span><img src="${LOGO}fulki-icon-orange.svg">`).id = "tkHead";
    div("", main, `<span>${L.from}</span>${PLANE("#ea580c")}<span>${L.to}</span>`).id = "tkCodes";
    div("", main, `<span>${L.fromCity}</span><span>${L.toCity}</span>`).id = "tkCities";
    const f = div("", main); f.id = "tkFields";
    this.fields = L.labels.map((lab, i) => { const d = div("tk-f" + (i > 0 ? " wide" : ""), f, `<small>${lab}</small><b></b>`); return d.querySelector("b"); });
    // date and passengers sit side by side: make the first row two columns
    this.fields[1].parentNode.className = "tk-f";
    const stub = div("tk-paper", pass); stub.id = "tkStub";
    const bars = div("", stub); bars.id = "tkBars";
    for (let i = 0; i < 64; i++) { const b = div("", bars, undefined, "i"); b.style.width = (hash(i, 7) < .5 ? 4 : hash(i, 8) < .5 ? 8 : 12) + "px"; b.style.marginRight = (hash(i, 9) < .5 ? 4 : 8) + "px"; }
    div("", stub, `<span>FULKI TRAVEL</span><span>${SITE.toUpperCase()}</span>`).id = "tkStubTxt";
    div("", main, L.ok).id = "tkStamp";
    const cap = div("", stage); cap.id = "tkCap";
    this.caps = L.steps.map((s, i) => div("tk-c", cap, `<b>${i + 1}</b><span>${s}</span>`));
    const end = div("", stage); end.id = "tkEnd";
    this.end = [div("", end, undefined, "img"), div("line", end, L.line), div("pill", end, WA + PHONE), div("url", end, SITE)];
    this.end[0].src = LOGO + "fulki-travel-tours-horizontal-reversed.svg";
    this.L = L;
    // what each field types, and when
    this.typing = [[0, L.date, TK.s1 + .3], [1, L.pax, TK.s1 + .9]];

    const cues = [...typeCues(L.title.replace("<br>", " "), .1, 30, "type", .2), [TK.print[0], "print", .8]];
    for (const [, s, a] of this.typing) cues.push(...typeCues(s, a, 22, "type", .3));
    for (const a of [TK.s1, TK.s2, TK.s3]) cues.push([a - .1, "swoosh", .5]);
    for (let i = 0; i < 9; i++) cues.push([TK.s2 + .2 + i * .22, "tick", .5]);
    cues.push([TK.s2 + 2.2, "ding", .5], [TK.stamp, "stamp", 1], [TK.tear, "tear", .9], [TK.away, "whoosh", .8], [TK.end + .9, "ding", .4]);
    REEL.cues = cues;
  },

  frame(t) {
    const L = this.L;
    $("tkTitle").innerHTML = typed(L.title.replace("<br>", "\n"), t, .1, 30).replace("\n", "<br>");
    $("tkTitle").style.opacity = 1 - prog(t, TK.away - .2, TK.away + .2);
    $("tkSlot").style.opacity = 1 - prog(t, TK.away, TK.away + .3);
    // printing: the pass feeds down out of the slot in small jerky steps
    const p = prog(t, ...TK.print), steps = Math.floor(p * 24) / 24;
    const out = easeIn(prog(t, TK.away, TK.away + .6));
    place($("tkPass"), { y: -1060 + steps * 1060 * .97 + (p >= 1 ? 1060 * .03 : 0) - out * 300, s: 1 - out * .1, o: 1 - out });

    // step 1: the date and passengers are typed in
    for (const [i, s, a] of this.typing) this.fields[i].textContent = typed(s, t, a, 22) + (t > a && t < a + s.length / 22 + .3 && Math.floor(t * 4) % 2 ? "▌" : "");
    // step 2: the route options cycle, then settle; status reads "comparing" until the stamp
    const r = this.fields[2];
    if (t < TK.s2) r.textContent = "";
    else if (t < TK.s2 + 2.2) r.textContent = L.routes[Math.floor((t - TK.s2) / .22) % L.routes.length];
    else r.textContent = L.routes[0];
    r.style.color = t >= TK.s2 + 2.2 ? "#ea580c" : "";
    const st = this.fields[3];
    st.textContent = t < TK.s2 ? "" : t < TK.stamp ? (Math.floor(t * 3) % 2 ? L.comparing : "") : L.ok;
    st.style.color = t >= TK.stamp ? "#16a34a" : "#a8a29e";
    // step 3: the stamp slams down, then the stub tears off and falls away
    const sk = prog(t, TK.stamp - .12, TK.stamp);
    place($("tkStamp"), { s: 2.2 - 1.2 * easeIn(sk) + (t > TK.stamp ? .04 * Math.exp(-(t - TK.stamp) * 12) : 0), r: -14, o: t < TK.stamp - .12 ? 0 : .3 + .6 * sk });
    const tk = easeIn(prog(t, TK.tear, TK.tear + .8));
    place($("tkStub"), { x: tk * 180, y: tk * 900, r: tk * 24, o: 1 });

    // captions: one per step, slide in from the right and out to the left
    const at = [TK.s1, TK.s2, TK.s3, TK.away];
    this.caps.forEach((c, i) => {
      const a = at[i], b = at[i + 1];
      place(c, { x: (1 - easeOut(prog(t, a, a + .4))) * 160 - easeIn(prog(t, b - .3, b)) * 160, o: prog(t, a, a + .3) * (1 - prog(t, b - .3, b)) });
    });
    $("tkEnd").style.opacity = prog(t, TK.end - .3, TK.end);
    this.end.forEach((e, i) => { const a = TK.end + i * .25; place(e, { y: (1 - easeOut(prog(t, a, a + .45))) * 50, o: prog(t, a, a + .3) }); });
  },
};
