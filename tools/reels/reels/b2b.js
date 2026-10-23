// "B2B" — become a Fulki Travel B2B partner. A dark blueprint: agencies, retail points and companies link up to
// the Fulki hub with data flowing along the lines, a wireframe of the booking platform draws itself, a headset
// stands for the team behind it, and the three onboarding steps tick off. Monoline icons, cyan and orange.
const BB = { net: 1.0, plat: 4.8, team: 8.3, steps: 9.9, end: 12.9 };
const BB_HUB = [540, 1010], BB_NODES = [[230, 700], [850, 700], [540, 1400]];
const BB_ICONS = [
  // agency: an office building
  "M-40 50V-40H40V50M-40 50H40M-24-24H-8M8-24H24M-24 0H-8M8 0H24M-24 24H-8M8 24H24",
  // retail point: a shop with an awning
  "M-46-10H46L36-40H-36ZM-40-10V44H40V-10M-12 44V14H12V44M-46-10Q-34 6-23-10Q-11 6 0-10Q11 6 23-10Q34 6 46-10",
  // company: a briefcase
  "M-46-20H46V40H-46ZM-16-20V-34H16V-20M-46 4H46M-6 0V10H6V0",
];

window.REEL = {
  name: "b2b",
  langs: ["en", "it"],
  seconds: 16.5,
  end: BB.end,
  music: { style: "corporate", bpm: 116, key: 9 },
  copy: {
    en: { kick: "FOR AGENCIES & BUSINESSES", title: "Become a<br>B2B partner.", nodes: ["Agencies", "Retail points", "Companies"],
          plat: "Work directly on<br>our platform", from: "FROM", to: "TO", search: "SEARCH", team: "…backed by a team<br>ready to help.",
          steps: ["Send us your business details", "We verify your company (VAT) and agree terms", "We activate your account and your team's"],
          iata: "IATA-accredited agency", cta: "Request partner access" },
    it: { kick: "PER AGENZIE E AZIENDE", title: "Diventa<br>partner B2B.", nodes: ["Agenzie", "Punti vendita", "Aziende"],
          plat: "Lavora direttamente sulla<br>nostra piattaforma", from: "DA", to: "A", search: "CERCA", team: "…con un team<br>pronto ad aiutare.",
          steps: ["Ci contatti con i dati della tua attività", "Verifichiamo l'azienda (P. IVA) e concordiamo le condizioni", "Attiviamo il tuo account e quelli del tuo team"],
          iata: "Agenzia accreditata IATA", cta: "Richiedi l'accesso partner" },
  },
  cues: [],

  build(stage, L) {
    addCSS(`
      #bbBg { position: absolute; inset: 0; background: radial-gradient(80% 60% at 50% 45%, #0f2440 0, #081426 70%, #050c18 100%); }
      #bbGrid { position: absolute; inset: 0; background-image: linear-gradient(rgba(34,211,238,.08) 2px, transparent 2px), linear-gradient(90deg, rgba(34,211,238,.08) 2px, transparent 2px),
        linear-gradient(rgba(34,211,238,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,.035) 1px, transparent 1px);
        background-size: 120px 120px, 120px 120px, 24px 24px, 24px 24px; }
      #bbKick { position: absolute; left: 80px; top: 130px; font: 700 34px/1 "Space Mono", monospace; letter-spacing: .14em; color: #22d3ee; }
      #bbTitle { position: absolute; left: 80px; top: 200px; font: 800 120px/0.98 "Outfit", sans-serif; letter-spacing: -0.04em; color: #f1f5f9; }
      #bbSvg { position: absolute; inset: 0; }
      .bb-lab { position: absolute; transform-origin: 50% 0; font: 700 38px/1 "Space Mono", monospace; color: #e2e8f0; white-space: nowrap; }
      #bbCap { position: absolute; left: 80px; right: 80px; top: 1500px; font: 800 74px/1.05 "Outfit", sans-serif; letter-spacing: -0.03em; color: #f1f5f9; }
      #bbCap2 { position: absolute; left: 80px; right: 80px; top: 1500px; font: 800 74px/1.05 "Outfit", sans-serif; letter-spacing: -0.03em; color: #f1f5f9; }
      .bb-f { position: absolute; font: 700 30px/1 "Space Mono", monospace; color: #22d3ee; }
      .bb-v { position: absolute; font: 700 44px/1 "Space Mono", monospace; color: #f1f5f9; }
      #bbSearch { position: absolute; left: 640px; top: 820px; width: 300px; height: 96px; border-radius: 14px; background: #ea580c; color: #fff;
        font: 700 36px/96px "Space Mono", monospace; text-align: center; letter-spacing: .1em; }
      #bbCursor { position: absolute; left: 0; top: 0; width: 56px; height: 56px; }
      #bbSteps { position: absolute; left: 80px; right: 80px; top: 640px; }
      .bb-s { display: flex; gap: 34px; align-items: flex-start; margin-bottom: 70px; }
      .bb-s svg { flex: none; width: 100px; height: 100px; }
      .bb-s div { font: 700 58px/1.16 "Manrope", sans-serif; color: #e2e8f0; padding-top: 14px; }
      .bb-s b { display: block; font: 700 30px/1 "Space Mono", monospace; color: #22d3ee; margin-bottom: 12px; }
      #bbEnd { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
      #bbEnd .cta { font: 800 92px/1.02 "Outfit", sans-serif; letter-spacing: -0.035em; color: #f1f5f9; text-align: center; padding: 0 70px; }
      #bbEnd .iata { margin-top: 40px; padding: 16px 30px; border: 3px solid #22d3ee; border-radius: 12px; font: 700 34px/1 "Space Mono", monospace; color: #22d3ee; letter-spacing: .06em; }
      #bbEnd img { margin-top: 90px; width: 740px; }
      #bbEnd .pill { margin-top: 70px; display: flex; align-items: center; gap: 22px; background: #ea580c; color: #fff; padding: 30px 54px; border-radius: 999px; font: 800 60px/1 "Manrope", sans-serif; }
      #bbEnd .pill svg { width: 62px; height: 62px; }
      #bbEnd .url { margin-top: 34px; font: 700 44px/1 "Space Mono", monospace; color: #94a3b8; }
    `);
    div("", stage).id = "bbBg";
    div("", stage).id = "bbGrid";
    div("", stage, "").id = "bbKick";
    div("", stage, L.title).id = "bbTitle";
    const s = svg("svg", { id: "bbSvg", width: 1080, height: 1920, viewBox: "0 0 1080 1920" }, stage);
    const line = (d, parent, color = "#22d3ee", w = 4) => svg("path", { d, fill: "none", stroke: color, "stroke-width": w, "stroke-linecap": "round", "stroke-linejoin": "round", pathLength: 1, "stroke-dasharray": 1, "stroke-dashoffset": 1 }, parent);

    // the network: three nodes wired to the hub, packets running along each wire
    this.net = svg("g", {}, s);
    this.wires = BB_NODES.map(([x, y]) => ({ x, y, p: line(`M${x} ${y}L${BB_HUB[0]} ${BB_HUB[1]}`, this.net, "#22d3ee", 3) }));
    this.packets = this.wires.map(() => [0, 1, 2].map(() => svg("circle", { r: 9, fill: "#ea580c" }, this.net)));
    this.nodes = BB_NODES.map(([x, y], i) => {
      const g = svg("g", { transform: `translate(${x} ${y})` }, this.net);
      svg("circle", { r: 110, fill: "#081426" }, g);
      const ring = line("M0 -110A110 110 0 1 1 -0.1 -110", g, "#22d3ee", 4);
      const icon = line(BB_ICONS[i], g, "#f1f5f9", 5);
      const lab = div("bb-lab", stage, L.nodes[i]);
      return { g, ring, icon, lab, x, y };
    });
    this.hub = svg("g", { transform: `translate(${BB_HUB[0]} ${BB_HUB[1]})` }, this.net);
    this.halo = svg("circle", { r: 150, fill: "none", stroke: "#ea580c", "stroke-width": 3 }, this.hub);
    svg("circle", { r: 130, fill: "#ea580c" }, this.hub);
    svg("image", { href: LOGO + "fulki-icon-round.svg", x: -120, y: -120, width: 240, height: 240 }, this.hub);

    // the platform: a wireframe browser window that draws itself, a search form and result rows
    this.plat = svg("g", {}, s);
    this.frameLines = [
      line("M100 560H980V1360H100Z", this.plat, "#22d3ee", 4), line("M100 640H980", this.plat, "#22d3ee", 3),
      line("M130 600h1M160 600h1M190 600h1", this.plat, "#22d3ee", 14),
      line("M140 720H600V830H140Z", this.plat, "#475569", 3), line("M140 870H600V980H140Z", this.plat, "#475569", 3),
    ];
    svg("rect", { x: 260, y: 586, width: 600, height: 30, rx: 15, fill: "#1e293b" }, this.plat);
    this.rows = [0, 1, 2].map(i => {
      const g = svg("g", {}, this.plat);
      svg("rect", { x: 140, y: 1040 + i * 100, width: 800, height: 80, rx: 12, fill: "#10213a", stroke: i ? "#1e3a5f" : "#ea580c", "stroke-width": 3 }, g);
      svg("rect", { x: 170, y: 1066 + i * 100, width: 150 + 60 * i, height: 26, rx: 13, fill: "#334155" }, g);
      svg("rect", { x: 520, y: 1066 + i * 100, width: 120, height: 26, rx: 13, fill: "#334155" }, g);
      svg("rect", { x: 800, y: 1062 + i * 100, width: 110, height: 34, rx: 8, fill: i ? "#334155" : "#ea580c" }, g);
      return g;
    });
    this.platHtml = [div("bb-f", stage, L.from), div("bb-v", stage, ""), div("bb-f", stage, L.to), div("bb-v", stage, "")];
    [[160, 735], [160, 770], [160, 885], [160, 920]].forEach(([x, y], i) => Object.assign(this.platHtml[i].style, { left: x + "px", top: y + "px" }));
    div("", stage, L.search).id = "bbSearch";
    div("", stage, `<svg viewBox="0 0 24 24"><path d="M5 3l14 8-6 1.5L10 19z" fill="#fff" stroke="#081426" stroke-width="1.4" stroke-linejoin="round"/></svg>`).id = "bbCursor";
    div("", stage, L.plat).id = "bbCap";

    // the team: a headset
    this.team = svg("g", { transform: "translate(540 980) scale(1.5)" }, s);
    this.headset = [line("M-150 40V-10A150 150 0 0 1 150 -10V40", this.team, "#f1f5f9", 10), line("M-180 20H-120V140H-180Z", this.team, "#ea580c", 10),
      line("M120 20H180V140H120Z", this.team, "#ea580c", 10), line("M150 140V190Q150 230 100 230H20", this.team, "#f1f5f9", 8)];
    div("", stage, L.team).id = "bbCap2";

    const steps = div("", stage); steps.id = "bbSteps";
    this.steps = L.steps.map((st, i) => {
      const d = div("bb-s", steps, `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="none" stroke="#22d3ee" stroke-width="5"/><path d="M30 52l14 14 28-30" fill="none" stroke="#ea580c" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1"/></svg><div><b>0${i + 1}</b>${st}</div>`);
      return { d, tick: d.querySelector("path") };
    });
    const end = div("", stage); end.id = "bbEnd";
    this.end = [div("cta", end, L.cta), div("iata", end, L.iata), div("", end, undefined, "img"), div("pill", end, WA + PHONE), div("url", end, SITE)];
    this.end[2].src = LOGO + "fulki-travel-tours-horizontal-reversed.svg";
    this.end[2].style.borderRadius = "24px";
    this.L = L;

    const cues = [...typeCues(L.kick, .2, 40, "type", .18)];
    this.nodes.forEach((_, i) => cues.push([BB.net + .2 + i * .25, "pop", .45, (BB_NODES[i][0] - 540) / 600]));
    cues.push([BB.net + 1.1, "impact", .5], [BB.plat - .1, "whoosh", .5]);
    cues.push(...typeCues("VCE", BB.plat + 1.0, 10, "type", .3), ...typeCues("ACC", BB.plat + 1.5, 10, "type", .3), [BB.plat + 2.3, "click", .9], [BB.plat + 2.45, "receive", .4]);
    cues.push([BB.team - .1, "whoosh", .5], [BB.team + .5, "ding", .35]);
    this.steps.forEach((_, i) => cues.push([BB.steps + .3 + i * .55, "tick", .8], [BB.steps + .35 + i * .55, "pop", .35]));
    cues.push([BB.end - .2, "whoosh", .6], [BB.end + .8, "ding", .4]);
    REEL.cues = cues;
  },

  frame(t) {
    const L = this.L, draw = (p, a, b) => p.setAttribute("stroke-dashoffset", 1 - easeInOut(prog(t, a, b)));
    $("bbGrid").style.opacity = prog(t, 0, .8);
    $("bbGrid").style.backgroundPosition = `0 ${-t * 12}px`;
    $("bbKick").textContent = typed(L.kick, t, .2, 40);
    $("bbKick").style.opacity = 1 - prog(t, BB.steps - .4, BB.steps - .1);
    place($("bbTitle"), { y: (1 - easeOut(prog(t, .5, 1))) * 50, o: prog(t, .5, .8) * (1 - prog(t, BB.plat - .3, BB.plat)) });

    // network
    const netOut = prog(t, BB.plat - .3, BB.plat + .1);
    this.net.setAttribute("opacity", 1 - netOut);
    this.net.setAttribute("transform", `translate(540 1010) scale(${1 - netOut * .2}) translate(-540 -1010)`);
    this.nodes.forEach((n, i) => {
      const a = BB.net + .2 + i * .25;
      draw(n.ring, a, a + .5); draw(n.icon, a + .2, a + .8);
      n.g.setAttribute("opacity", prog(t, a, a + .15));
      place(n.lab, { x: n.x - n.lab.offsetWidth / 2, y: n.y + 130, o: prog(t, a + .5, a + .8) * (1 - netOut) });
    });
    this.wires.forEach((w, i) => draw(w.p, BB.net + .7 + i * .15, BB.net + 1.2 + i * .15));
    this.hub.setAttribute("transform", `translate(${BB_HUB[0]} ${BB_HUB[1]}) scale(${backOut(prog(t, BB.net + 1.0, BB.net + 1.4))})`);
    this.halo.setAttribute("r", 140 + 30 * ((t * .8) % 1));
    this.halo.setAttribute("opacity", 1 - (t * .8) % 1);
    this.packets.forEach((ps, i) => ps.forEach((c, k) => {
      const u = ((t - BB.net - 1.3) * .7 + k / 3) % 1, w = this.wires[i], on = t > BB.net + 1.3;
      const back = (i + k) % 2;  // some packets flow out from the hub, some in
      const v = back ? 1 - u : u;
      c.setAttribute("cx", lerp(w.x, BB_HUB[0], v)); c.setAttribute("cy", lerp(w.y, BB_HUB[1], v));
      c.setAttribute("opacity", on ? Math.sin(Math.PI * u) : 0);
    }));

    // platform
    const pOut = prog(t, BB.team - .3, BB.team);
    this.plat.setAttribute("opacity", (t > BB.plat - .1 ? 1 : 0) * (1 - pOut));
    this.frameLines.forEach((p, i) => draw(p, BB.plat + i * .12, BB.plat + .6 + i * .12));
    const pv = (t > BB.plat + .5 ? 1 : 0) * (1 - pOut);
    this.platHtml.forEach(e => e.style.opacity = pv * prog(t, BB.plat + .5, BB.plat + .7));
    this.platHtml[1].textContent = typed("VCE · VENICE".replace("VENICE", L.from === "DA" ? "VENEZIA" : "VENICE"), t, BB.plat + 1.0, 18);
    this.platHtml[3].textContent = typed("ACC · ACCRA", t, BB.plat + 1.5, 18);
    const press = t > BB.plat + 2.3 && t < BB.plat + 2.45;
    place($("bbSearch"), { s: (press ? .94 : 1) * backOut(prog(t, BB.plat + .6, BB.plat + .9)), o: pv });
    const cu = easeInOut(prog(t, BB.plat + 1.7, BB.plat + 2.25));
    place($("bbCursor"), { x: lerp(980, 800, cu), y: lerp(1300, 880, cu), s: press ? .85 : 1, o: pv * prog(t, BB.plat + 1.6, BB.plat + 1.8) });
    this.rows.forEach((r, i) => { const a = BB.plat + 2.5 + i * .15; r.setAttribute("opacity", prog(t, a, a + .2)); r.setAttribute("transform", `translate(${(1 - easeOut(prog(t, a, a + .35))) * 80} 0)`); });
    place($("bbCap"), { y: (1 - easeOut(prog(t, BB.plat + .3, BB.plat + .8))) * 40, o: prog(t, BB.plat + .3, BB.plat + .6) * (1 - pOut) });

    // team
    const tOut = prog(t, BB.steps - .3, BB.steps);
    this.team.setAttribute("opacity", (t > BB.team ? 1 : 0) * (1 - tOut));
    this.headset.forEach((p, i) => draw(p, BB.team + i * .15, BB.team + .6 + i * .15));
    place($("bbCap2"), { y: (1 - easeOut(prog(t, BB.team + .4, BB.team + .9))) * 40, o: prog(t, BB.team + .4, BB.team + .7) * (1 - tOut) });

    // steps
    const sOut = prog(t, BB.end - .3, BB.end);
    this.steps.forEach(({ d, tick }, i) => {
      const a = BB.steps + i * .55;
      place(d, { x: (1 - easeOut(prog(t, a - .1, a + .3))) * 120, o: prog(t, a - .1, a + .2) * (1 - sOut) });
      tick.setAttribute("stroke-dashoffset", 1 - easeOut(prog(t, a + .3, a + .55)));
    });
    this.end.forEach((e, i) => { const a = BB.end + i * .22; place(e, { y: (1 - easeOut(prog(t, a, a + .45))) * 50, o: prog(t, a, a + .3) }); });
  },
};
