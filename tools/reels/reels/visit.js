// "Visit" — come and see us. A flat, top-down illustrated town (stylised, not a real map): the camera glides
// in over roads, a river, parks and little cars, a pin drops on the agency, then a circle wipe opens on the
// shopfront with its orange awning and the door swings open. Soft greens and pastels.
const VI = { zoom: [0.3, 3.6], pin: 2.9, wipe: 5.6, door: 6.6, end: 11.2 };
const VI_PIN = [1080, 1200];   // the agency, on the main road

window.REEL = {
  name: "visit",
  langs: ["en", "it"],
  seconds: 15,
  end: VI.end,
  music: { style: "warm", bpm: 96, key: 7 },
  copy: {
    en: { kick: "Rather talk face to face?", road: "VIA 4 MARTIRI", head: "Come and see us.", sub: "In person, by phone<br>or on WhatsApp.", open: "OPEN", welcome: "Welcome" },
    it: { kick: "Preferisci parlare di persona?", road: "VIA 4 MARTIRI", head: "Vieni a trovarci.", sub: "Di persona, al telefono<br>o su WhatsApp.", open: "APERTO", welcome: "Benvenuti" },
  },
  cues: [],

  build(stage, L) {
    addCSS(`
      #viMap { position: absolute; inset: 0; background: #dfead3; }
      #viKick { position: absolute; left: 60px; right: 60px; top: 120px; padding: 34px 40px; border-radius: 34px; background: #fff; color: #1f2d1f;
        font: 800 62px/1.1 "Outfit", sans-serif; letter-spacing: -0.02em; text-align: center; box-shadow: 0 20px 50px rgba(31,45,31,.18); }
      #viShop { position: absolute; inset: 0; background: #cfe3ef; }
      #viHead { position: absolute; left: 70px; right: 70px; top: 120px; font: 800 118px/1 "Outfit", sans-serif; letter-spacing: -0.04em; color: #1f2d1f; }
      #viAddr { position: absolute; left: 70px; right: 70px; top: 270px; display: flex; align-items: center; gap: 18px; font: 800 48px/1.2 "Manrope", sans-serif; color: #2f4a2f; }
      #viAddr svg { width: 56px; height: 56px; flex: none; }
      #viSub { position: absolute; left: 70px; right: 70px; top: 1610px; font: 800 76px/1.08 "Outfit", sans-serif; color: #1f2d1f; letter-spacing: -0.02em; }
      #viEnd { position: absolute; inset: 0; background: #1f3a2b; display: flex; flex-direction: column; align-items: center; justify-content: center; }
      #viEnd .pin { width: 220px; height: 290px; }
      #viEnd img { margin-top: 60px; width: 740px; border-radius: 30px; box-shadow: 0 30px 60px rgba(0,0,0,.3); }
      #viEnd .addr { margin-top: 50px; font: 700 46px/1.3 "Manrope", sans-serif; color: #d9f0d0; text-align: center; }
      #viEnd .pill { margin-top: 60px; display: flex; align-items: center; gap: 22px; background: #ea580c; color: #fff; padding: 30px 54px; border-radius: 999px; font: 800 60px/1 "Manrope", sans-serif; }
      #viEnd .pill svg { width: 62px; height: 62px; }
      #viEnd .url { margin-top: 34px; font: 700 46px/1 "Manrope", sans-serif; color: #a7c9a0; }
    `);
    const map = div("", stage); map.id = "viMap";
    const s = svg("svg", { width: 1080, height: 1920, viewBox: "0 0 1080 1920" }, map);
    const world = svg("g", {}, s);
    this.world = world;
    // the river, running diagonally across town
    svg("path", { d: "M-200 380C400 520 700 300 1200 700S1700 1500 2400 1700", fill: "none", stroke: "#a9d3ea", "stroke-width": 150 }, world);
    svg("path", { d: "M-200 380C400 520 700 300 1200 700S1700 1500 2400 1700", fill: "none", stroke: "#c4e2f2", "stroke-width": 60, "stroke-dasharray": "40 70" }, world);
    // blocks of buildings between the roads, each a few pastel boxes with a darker roof edge
    const H = [250, 720, 1200, 1680, 2150], V = [260, 720, 1440, 1900];
    const cols = ["#f6d7b0", "#e3ecf7", "#f4c9c3", "#fffaf0", "#e8dcf5", "#d7efe0"];
    for (let r = 0; r < H.length - 1; r++) for (let c = 0; c < V.length - 1; c++) {
      const x0 = V[c] + 50, x1 = V[c + 1] - 50, y0 = H[r] + 50, y1 = H[r + 1] - 50;
      if ((r === 1 && c === 0) || (r === 3 && c === 2)) {  // parks: grass and round trees
        svg("rect", { x: x0, y: y0, width: x1 - x0, height: y1 - y0, rx: 30, fill: "#b9dca0" }, world);
        for (let k = 0; k < 9; k++) {
          const tx = x0 + 60 + hash(r, c, k) * (x1 - x0 - 120), ty = y0 + 60 + hash(c, r, k) * (y1 - y0 - 120);
          svg("circle", { cx: tx + 8, cy: ty + 10, r: 42, fill: "#7fb069", opacity: .5 }, world);
          svg("circle", { cx: tx, cy: ty, r: 40, fill: "#6aa84f" }, world);
        }
        continue;
      }
      for (let k = 0; k < 6; k++) {
        const w = (x1 - x0) / 3 - 20, h = (y1 - y0) / 2 - 20, bx = x0 + (k % 3) * ((x1 - x0) / 3) + 10, by = y0 + Math.floor(k / 3) * ((y1 - y0) / 2) + 10;
        if (hash(r, c, k, 3) < .15) continue;
        const col = cols[Math.floor(hash(r, c, k) * cols.length)];
        svg("rect", { x: bx + 10, y: by + 14, width: w, height: h, rx: 14, fill: "#b8c7ad" }, world);
        svg("rect", { x: bx, y: by, width: w, height: h, rx: 14, fill: col, stroke: "#fff", "stroke-width": 4 }, world);
      }
    }
    // roads, with the main road wider and named
    for (const y of H) svg("rect", { x: -300, y: y - (y === 1200 ? 46 : 32), width: 2800, height: y === 1200 ? 92 : 64, fill: "#fbfbf7" }, world);
    for (const x of V) svg("rect", { x: x - 32, y: -300, width: 64, height: 2800, fill: "#fbfbf7" }, world);
    svg("path", { d: "M-300 1200H2500", stroke: "#f2c14e", "stroke-width": 5, "stroke-dasharray": "40 36" }, world);
    svg("text", { x: 620, y: 1214, fill: "#9aa58f", style: 'font: 800 34px "Manrope", sans-serif; letter-spacing: .3em' }, world).textContent = L.road;
    // little cars on the main road and one avenue
    this.cars = [["#ea580c", 1, 0], ["#3b82f6", -1, .3], ["#16a34a", 1, .55], ["#facc15", -1, .8]].map(([c, dir, ph]) => {
      const g = svg("g", {}, world);
      svg("rect", { x: -38, y: -20, width: 76, height: 40, rx: 12, fill: c }, g);
      svg("rect", { x: 4, y: -15, width: 22, height: 30, rx: 6, fill: "#fff", opacity: .7 }, g);
      return { g, dir, ph };
    });
    // the pin, with a pulsing ring under it
    this.ring = svg("circle", { cx: VI_PIN[0], cy: VI_PIN[1], r: 60, fill: "none", stroke: "#ea580c", "stroke-width": 8 }, world);
    this.shadow = svg("ellipse", { cx: VI_PIN[0], cy: VI_PIN[1] + 4, rx: 34, ry: 12, fill: "#000", opacity: .2 }, world);
    this.pin = svg("g", {}, world);
    svg("path", { d: "M0 0C-20 -40 -70 -80 -70 -130A70 70 0 1 1 70 -130C70 -80 20 -40 0 0Z", fill: "#ea580c", stroke: "#fff", "stroke-width": 6 }, this.pin);
    svg("image", { href: LOGO + "fulki-icon-light.svg", x: -46, y: -176, width: 92, height: 92 }, this.pin);
    div("", stage, L.kick).id = "viKick";

    // the shopfront, revealed by a circle wipe
    const shop = div("", stage); shop.id = "viShop";
    const f = svg("svg", { width: 1080, height: 1920, viewBox: "0 0 1080 1920" }, shop);
    svg("rect", { x: 0, y: 1500, width: 1080, height: 420, fill: "#c9c3b8" }, f);               // pavement
    svg("rect", { x: 0, y: 1500, width: 1080, height: 16, fill: "#b5aea2" }, f);
    svg("rect", { x: 60, y: 420, width: 960, height: 1090, fill: "#f3e3c8" }, f);              // facade
    for (let i = 0; i < 6; i++) svg("rect", { x: 60, y: 440 + i * 70, width: 960, height: 4, fill: "#e8d4b2" }, f);
    for (const x of [140, 460, 780]) { svg("rect", { x, y: 470, width: 160, height: 220, rx: 10, fill: "#7fa7c0" }, f); svg("rect", { x: x - 14, y: 690, width: 188, height: 16, fill: "#d9c4a2" }, f); }
    svg("rect", { x: 60, y: 760, width: 960, height: 70, fill: "#1c1917" }, f);                 // sign board
    svg("text", { x: 540, y: 812, "text-anchor": "middle", fill: "#fff", style: 'font: 800 50px "Outfit", sans-serif; letter-spacing: .3em' }, f).textContent = "FULKI TRAVEL";
    // the striped orange awning, scalloped
    let aw = "M40 830H1040V930";
    for (let x = 1040; x > 40; x -= 80) aw += `Q${x - 40} 980 ${x - 80} 930`;
    svg("path", { d: aw + "Z", fill: "#ea580c" }, f);
    for (let x = 80; x < 1040; x += 160) svg("path", { d: `M${x} 830H${x + 80}V930Q${x + 40} 980 ${x} 930Z`, fill: "#fff", opacity: .9 }, f);
    svg("rect", { x: 100, y: 1010, width: 520, height: 490, rx: 8, fill: "#9cc3d9", stroke: "#5b4636", "stroke-width": 14 }, f);   // shop window
    svg("path", { d: "M140 1060L300 1060L180 1460", fill: "#fff", opacity: .25 }, f);
    const poster = svg("g", { transform: "translate(360 1250) rotate(-45) scale(7)" }, f);
    svg("path", { d: PLANE_PATH, fill: "#ea580c", transform: "translate(-12 -12)" }, poster);
    svg("text", { x: 360, y: 1440, "text-anchor": "middle", fill: "#1c1917", style: 'font: 800 34px "Manrope", sans-serif; letter-spacing: .2em' }, f).textContent = "IATA";
    svg("rect", { x: 680, y: 1010, width: 280, height: 490, fill: "#3b2a1e" }, f);              // doorway, dark inside
    svg("rect", { x: 700, y: 1030, width: 240, height: 470, fill: "#fde7c4" }, f);              // warm light inside
    svg("text", { x: 820, y: 1260, "text-anchor": "middle", fill: "#ea580c", style: 'font: 700 54px "Caveat", cursive' }, f).textContent = L.welcome;
    this.door = svg("g", {}, f);
    svg("rect", { x: 700, y: 1030, width: 240, height: 470, fill: "#5b4636" }, this.door);
    svg("rect", { x: 730, y: 1060, width: 180, height: 220, rx: 6, fill: "#9cc3d9" }, this.door);
    svg("circle", { cx: 915, cy: 1290, r: 12, fill: "#e8c872" }, this.door);
    const sign = svg("g", { transform: "translate(820 1130)" }, this.door);
    svg("rect", { x: -70, y: -28, width: 140, height: 56, rx: 8, fill: "#fff" }, sign);
    svg("text", { y: 12, "text-anchor": "middle", fill: "#16a34a", style: 'font: 800 30px "Manrope", sans-serif' }, sign).textContent = L.open;
    for (const x of [40, 1000]) { svg("rect", { x: x - 40, y: 1430, width: 80, height: 70, rx: 8, fill: "#a16207" }, f); svg("circle", { cx: x, cy: 1400, r: 60, fill: "#4d7c0f" }, f); }
    div("", shop, L.head).id = "viHead";
    div("", shop, `<svg viewBox="0 0 24 24" fill="#ea580c"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>${ADDRESS}`).id = "viAddr";
    div("", shop, L.sub).id = "viSub";
    this.shop = shop;

    const end = div("", stage); end.id = "viEnd";
    this.end = [div("pin", end, `<svg viewBox="-75 -210 150 215"><path d="M0 0C-20 -40 -70 -80 -70 -130A70 70 0 1 1 70 -130C70 -80 20 -40 0 0Z" fill="#ea580c"/><circle cy="-130" r="30" fill="#1f3a2b"/></svg>`),
                div("", end, undefined, "img"), div("addr", end, ADDRESS.replace(" · ", "<br>")), div("pill", end, WA + PHONE), div("url", end, SITE)];
    this.end[1].src = LOGO + "fulki-travel-tours-horizontal-reversed.svg";

    REEL.cues = [[0.2, "swoosh", .5], [VI.pin - .25, "pin", .9], [VI.pin + .5, "pop", .4], [VI.wipe, "whoosh", .7],
      [VI.door, "click", .8], [VI.door + .05, "ding", .5], [VI.door + .9, "swoosh", .4], [VI.end - .2, "whoosh", .6], [VI.end + .4, "pin", .7]];
  },

  frame(t) {
    // camera: from a wide view of town, gliding and zooming in on the pin
    const z = easeInOut(prog(t, ...VI.zoom)), zz = easeIn(prog(t, VI.wipe - .6, VI.wipe + .3));
    const sc = lerp(.42, 1.1, z) + zz * 1.4;
    const cx = lerp(1250, VI_PIN[0], z), cy = lerp(1500, VI_PIN[1] - 60, z);
    this.world.setAttribute("transform", `translate(540 ${lerp(1060, 1100, z)}) scale(${sc}) rotate(${(1 - z) * -8}) translate(${-cx} ${-cy})`);
    for (const c of this.cars) {
      const u = ((t * .09 + c.ph) % 1);
      const x = c.dir > 0 ? -300 + u * 2800 : 2500 - u * 2800;
      c.g.setAttribute("transform", `translate(${x} ${1200 + c.dir * 22})${c.dir < 0 ? " scale(-1 1)" : ""}`);
    }
    // the pin drops and bounces; the ring pulses out from it
    const pk = prog(t, VI.pin - .3, VI.pin);
    const bounce = t < VI.pin ? -900 * (1 - easeIn(pk)) : -60 * Math.abs(Math.sin((t - VI.pin) * 9)) * Math.exp(-(t - VI.pin) * 5);
    this.pin.setAttribute("transform", `translate(${VI_PIN[0]} ${VI_PIN[1] + bounce})`);
    this.pin.setAttribute("opacity", t < VI.pin - .3 ? 0 : 1);
    this.shadow.setAttribute("opacity", .2 * pk);
    const ph = ((t - VI.pin) % 1.1) / 1.1;
    this.ring.setAttribute("r", 30 + ph * 110);
    this.ring.setAttribute("opacity", t > VI.pin ? (1 - ph) * .8 : 0);
    place($("viKick"), { y: (1 - backOut(prog(t, .3, .8))) * -60, o: prog(t, .3, .5) * (1 - prog(t, VI.wipe - .4, VI.wipe - .1)) });

    // circle wipe into the shopfront, then the door swings open
    const w = easeInOut(prog(t, VI.wipe, VI.wipe + .6));
    this.shop.style.clipPath = `circle(${w * 1150}px at 540px 960px)`;
    this.shop.style.visibility = w > 0 ? "visible" : "hidden";
    const d = easeOut(prog(t, VI.door, VI.door + .6));
    this.door.setAttribute("transform", `translate(700 0) scale(${1 - d * .82} 1) translate(-700 0)`);
    place($("viHead"), { y: (1 - easeOut(prog(t, VI.wipe + .5, VI.wipe + 1))) * 50, o: prog(t, VI.wipe + .5, VI.wipe + .8) });
    place($("viAddr"), { y: (1 - easeOut(prog(t, VI.wipe + .8, VI.wipe + 1.3))) * 40, o: prog(t, VI.wipe + .8, VI.wipe + 1.1) });
    place($("viSub"), { y: (1 - easeOut(prog(t, VI.door + .9, VI.door + 1.4))) * 40, o: prog(t, VI.door + .9, VI.door + 1.2) });

    const e = easeInOut(prog(t, VI.end - .3, VI.end + .2));
    $("viEnd").style.clipPath = `circle(${e * 1150}px at 540px 960px)`;
    $("viEnd").style.visibility = e > 0 ? "visible" : "hidden";
    this.end.forEach((el, i) => {
      const a = VI.end + .2 + i * .2;
      if (i === 0) place(el, { y: t < VI.end + .4 ? -600 * (1 - easeIn(prog(t, VI.end + .1, VI.end + .4))) : -30 * Math.abs(Math.sin((t - VI.end - .4) * 9)) * Math.exp(-(t - VI.end - .4) * 5), o: prog(t, VI.end + .1, VI.end + .15) });
      else place(el, { y: (1 - easeOut(prog(t, a, a + .45))) * 50, o: prog(t, a, a + .3) });
    });
  },
};
