// Progressive enhancement only: the page is complete without this file.
(function () {
  var root = document.documentElement;
  root.classList.add("js");

  // Language: the visitor's saved choice, else the first browser language we offer, else Italian.
  var KEY = "fulki.site.lang";
  var LANGS = ["it", "en", "fr", "es", "de"];
  var menu = document.querySelector("[data-lang-menu]");
  var toggle = menu && menu.querySelector(".lang-toggle");
  var list = menu && menu.querySelector(".lang-list");
  var langLabel = menu && menu.querySelector("[data-lang-current]");
  var buttons = document.querySelectorAll("[data-set-lang]");
  function setLang(lang) {
    root.lang = lang;
    if (langLabel) langLabel.textContent = lang.toUpperCase();
    buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.setLang === lang)); });
  }
  function detectLang() {
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    if (LANGS.indexOf(saved) !== -1) return saved;
    var prefs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
    for (var i = 0; i < prefs.length; i++) {
      var code = String(prefs[i] || "").slice(0, 2).toLowerCase();
      if (LANGS.indexOf(code) !== -1) return code;
    }
    return "it";
  }
  setLang(detectLang());

  // Language dropdown: opens from the toggle, closes on choice, Escape or a click elsewhere.
  if (menu) {
    var openMenu = function (open, focusChoice) {
      list.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
      if (open && focusChoice) (list.querySelector('[aria-pressed="true"]') || buttons[0]).focus();
    };
    toggle.addEventListener("click", function () { openMenu(list.hidden, false); });
    toggle.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); openMenu(true, true); }
    });
    list.addEventListener("keydown", function (e) {
      var items = Array.prototype.slice.call(buttons);
      var i = items.indexOf(document.activeElement);
      if (e.key === "ArrowDown") { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
      else if (e.key === "Home") { e.preventDefault(); items[0].focus(); }
      else if (e.key === "End") { e.preventDefault(); items[items.length - 1].focus(); }
    });
    menu.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !list.hidden) { openMenu(false); toggle.focus(); }
    });
    document.addEventListener("click", function (e) { if (!menu.contains(e.target)) openMenu(false); });
    menu.addEventListener("focusout", function (e) { if (e.relatedTarget && !menu.contains(e.relatedTarget)) openMenu(false); });
    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        setLang(b.dataset.setLang);
        try { localStorage.setItem(KEY, b.dataset.setLang); } catch (e) {}
        openMenu(false);
        toggle.focus();
      });
    });
  }

  // Header border once the page scrolls.
  var header = document.querySelector(".site-header");
  function onScroll() { header.classList.toggle("scrolled", window.scrollY > 8); }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Gentle reveal on scroll, staggered within each group.
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var siblings = Array.prototype.filter.call(e.target.parentElement.children, function (c) { return c.classList.contains("reveal"); });
        e.target.style.transitionDelay = Math.min(siblings.indexOf(e.target), 5) * 80 + "ms";
        e.target.classList.add("in");
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("in"); });
  }

  // The hero flight uses SMIL, which CSS can't stop: pause it for reduced motion.
  var route = document.querySelector(".route");
  if (route && window.matchMedia("(prefers-reduced-motion: reduce)").matches && route.pauseAnimations) {
    route.pauseAnimations();
    route.setCurrentTime(3.5);
  }

  // Contact map: cars, buses and bikes drive along Via IV Martiri and stop at the zebra crossing for people.
  var traffic = document.querySelector("[data-traffic]");
  if (traffic) {
    var NS = "http://www.w3.org/2000/svg";
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var rnd = function (a, b) { return a + Math.random() * (b - a); };
    var pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
    var el = function (tag, attrs, parent) {
      var n = document.createElementNS(NS, tag);
      for (var k in attrs) n.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(n);
      return n;
    };

    // A polyline we can walk along by distance; off either end it carries on straight.
    var Line = function (pts) {
      this.p = pts; this.c = [0];
      for (var i = 1; i < pts.length; i++) this.c.push(this.c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      this.len = this.c[this.c.length - 1];
    };
    Line.prototype.at = function (s) {
      var i = 0;
      while (i < this.p.length - 2 && this.c[i + 1] < s) i++;
      var a = this.p[i], b = this.p[i + 1], t = (s - this.c[i]) / (this.c[i + 1] - this.c[i]);
      return { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t, deg: Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI };
    };
    // Shift a polyline d units to the right of its direction of travel (traffic keeps right).
    var offset = function (pts, d) {
      var nrm = function (a, b) { var l = Math.hypot(b[0] - a[0], b[1] - a[1]); return [-(b[1] - a[1]) / l, (b[0] - a[0]) / l]; };
      return pts.map(function (p, i) {
        var n1 = i > 0 ? nrm(pts[i - 1], p) : null, n2 = i < pts.length - 1 ? nrm(p, pts[i + 1]) : null;
        var m = [(n1 || n2)[0] + (n2 || n1)[0], (n1 || n2)[1] + (n2 || n1)[1]], ml = Math.hypot(m[0], m[1]);
        m = [m[0] / ml, m[1] / ml];
        var k = d / (m[0] * (n1 || n2)[0] + m[1] * (n1 || n2)[1]);
        return [p[0] + m[0] * k, p[1] + m[1] * k];
      });
    };

    // Via IV Martiri's centre line (as in the map), extended past both edges; the crossing matches .zebra in the markup.
    var MAIN = [[-140, 1109.4], [300, 1068], [600, 1012], [1040, 925.3]];
    var REV = MAIN.slice().reverse();
    var CX = 580, CY = 1015.7, ANG = -10.57 * Math.PI / 180;
    var U = [Math.cos(ANG), Math.sin(ANG)], N = [-U[1], U[0]];
    var lane = function (pts, d) {
      var line = new Line(offset(pts, d)), best = 0, bestD = Infinity;
      for (var s = 0; s < line.len; s += 1) {
        var q = line.at(s), dd = Math.hypot(q.x - CX, q.y - CY);
        if (dd < bestD) { bestD = dd; best = s; }
      }
      return { line: line, stopAt: best - 18, cross: best, list: [], timer: rnd(0, 2) };
    };
    var lanes = [
      lane(MAIN, 10), lane(REV, 10),             // cars and buses
      lane(MAIN, 19.5), lane(REV, 19.5)          // bikes, along the kerb
    ];
    lanes[2].bikes = lanes[3].bikes = true;

    var layer = el("g", {}, traffic);
    var pedLayer = el("g", {}, traffic);
    var CARS = ["#3b82f6", "#ef4444", "#f8fafc", "#334155", "#10b981", "#facc15", "#94a3b8", "#a855f7"];
    var CLOTHES = ["#ea580c", "#2563eb", "#16a34a", "#db2777", "#0d9488", "#7c3aed", "#ca8a04", "#475569"];

    var makeVehicle = function (kind) {
      var g = el("g", { "class": "vehicle" }, layer), v = { g: g, kind: kind, s: 0, v: 0 };
      if (kind === "bike") {
        v.len = 26; v.max = rnd(32, 42); v.sc = 1.3;
        el("rect", { x: -10, y: -1, width: 20, height: 2, rx: 1, fill: "#1f2937" }, g);
        el("ellipse", { cx: -1, cy: 0, rx: 3.5, ry: 5.5, fill: pick(CLOTHES) }, g);
        el("circle", { cx: 0.5, cy: 0, r: 3, fill: "#3f2a1d" }, g);
      } else if (kind === "bus") {
        v.len = 66; v.max = rnd(60, 70);
        el("rect", { x: -33, y: -10, width: 66, height: 20, rx: 4, fill: "#f97316", stroke: "rgb(0 0 0 / .18)", "stroke-width": 1 }, g);
        el("rect", { x: -28, y: -6, width: 54, height: 12, rx: 2, fill: "#fdba74" }, g);
        el("rect", { x: 26, y: -8.5, width: 5, height: 17, rx: 1.5, fill: "#7c2d12", opacity: .75 }, g);
        el("rect", { x: -33, y: -8, width: 2, height: 4, "class": "brake" }, g);
        el("rect", { x: -33, y: 4, width: 2, height: 4, "class": "brake" }, g);
      } else {
        var c = pick(CARS);
        v.len = 36; v.max = rnd(80, 100);
        el("rect", { x: -18, y: -8, width: 36, height: 16, rx: 5, fill: c, stroke: "rgb(0 0 0 / .18)", "stroke-width": 1 }, g);
        el("rect", { x: 3, y: -6.5, width: 7, height: 13, rx: 2, fill: "#1e293b", opacity: .7 }, g);
        el("rect", { x: -12, y: -6, width: 5, height: 12, rx: 2, fill: "#1e293b", opacity: .55 }, g);
        el("rect", { x: -18, y: -7, width: 2, height: 3.5, "class": "brake" }, g);
        el("rect", { x: -18, y: 3.5, width: 2, height: 3.5, "class": "brake" }, g);
      }
      v.v = v.max;
      return v;
    };

    // Phases: traffic flows ("go"), then cars that can stop do ("stop"), then people cross ("walk").
    var phase = "go", phaseT = 0, goFor = rnd(4, 7), peds = [], pedsReady = false;

    var spawnPeds = function () {
      var n = 1 + Math.floor(Math.random() * 3);
      for (var i = 0; i < n; i++) {
        var dir = Math.random() < 0.5 ? 1 : -1, g = el("g", { opacity: 0 }, pedLayer);
        var feet = el("g", {}, g);
        var f1 = el("ellipse", { rx: 2.4, ry: 1.6, cy: -2.6, fill: "#292524" }, feet);
        var f2 = el("ellipse", { rx: 2.4, ry: 1.6, cy: 2.6, fill: "#292524" }, feet);
        el("ellipse", { rx: 3.6, ry: 6.5, fill: pick(CLOTHES) }, g);
        el("circle", { cx: 0.6, r: 3.6, fill: pick(["#3f2a1d", "#1c1917", "#78350f", "#a8a29e"]) }, g);
        peds.push({ g: g, f1: f1, f2: f2, dir: dir, d: -rnd(30, 40) * dir, lat: (i - (n - 1) / 2) * 7.5 + rnd(-1, 1), speed: rnd(15, 21), delay: rnd(0, 0.7), t: 0, op: 0 });
      }
    };

    var crossingClear = function () {
      return lanes.every(function (L) {
        return L.list.every(function (v) { return v.s + v.len / 2 < L.cross - 12 || v.s - v.len / 2 > L.cross + 12; });
      });
    };

    var advance = function (dt) {
      phaseT += dt;
      if (phase === "go") {
        if (!pedsReady && phaseT > 1) { spawnPeds(); pedsReady = true; }
        if (phaseT > goFor) {
          phase = "stop"; phaseT = 0;
          // Only cars far enough from the line to brake comfortably stop; the rest drive on through.
          lanes.forEach(function (L) {
            L.list.forEach(function (v) { v.halt = L.stopAt - (v.s + v.len / 2) > v.v * v.v / (2 * 140); });
          });
        }
      } else if (phase === "stop") {
        if (phaseT > 1.2 && crossingClear()) { phase = "walk"; phaseT = 0; }
      } else if (phase === "walk") {
        var done = peds.every(function (p) { return p.d * p.dir > 26; });
        if (done && phaseT > 0.6) {
          phase = "go"; phaseT = 0; goFor = rnd(4, 7); pedsReady = false;
          lanes.forEach(function (L) { L.list.forEach(function (v) { v.halt = false; }); });
        }
      }

      lanes.forEach(function (L) {
        L.timer -= dt;
        var last = L.list[L.list.length - 1];
        // Keep the street calm and cheap to draw: at most three cars or buses and one bike at a time.
        var onRoad = 0;
        lanes.forEach(function (M) { if (M.bikes === L.bikes) onRoad += M.list.length; });
        if (L.timer <= 0 && onRoad < (L.bikes ? 1 : 3) && (!last || last.s - last.len / 2 > 60)) {
          var v = makeVehicle(L.bikes ? "bike" : Math.random() < 0.12 ? "bus" : "car");
          v.s = -v.len / 2;
          if (last) v.v = Math.min(v.v, last.v);
          v.halt = phase !== "go";
          L.list.push(v);
          L.timer = L.bikes ? rnd(6, 14) : rnd(2.5, 6);
        }
        for (var i = 0; i < L.list.length; i++) {
          var c = L.list[i], front = c.s + c.len / 2, room = Infinity;
          if (c.halt && front <= L.stopAt + 1) room = L.stopAt - front;
          var lead = L.list[i - 1];
          if (lead) room = Math.min(room, lead.s - lead.len / 2 - front - 8);
          var target = c.max;
          if (room < Infinity) target = Math.min(c.max, Math.sqrt(Math.max(0, 2 * 140 * room)));
          c.v = c.v < target ? Math.min(target, c.v + 60 * dt) : target;
          c.s += Math.min(c.v * dt, Math.max(0, room));
          var braking = target < c.max * 0.9 && room < 140;
          if (braking !== c.braking) { c.braking = braking; c.g.classList.toggle("braking", braking); }
        }
        while (L.list.length && L.list[0].s - L.list[0].len / 2 > L.line.len) L.list.shift().g.remove();
      });

      peds.forEach(function (p) {
        // Once someone steps off the kerb they finish crossing, whatever the phase.
        if (phase === "walk" || p.walking) {
          p.t += dt;
          if (p.t > p.delay) { p.d += p.dir * p.speed * dt; p.walking = true; }
        }
        var past = p.d * p.dir;
        p.op = past > 34 ? Math.max(0, p.op - dt * 2) : Math.min(1, p.op + dt * 2);
      });
      peds = peds.filter(function (p) {
        if (p.d * p.dir > 34 && p.op <= 0) { p.g.remove(); return false; }
        return true;
      });
    };

    var clock = 0;
    var paint = function () {
      lanes.forEach(function (L) {
        L.list.forEach(function (v) {
          if (v.drawnAt === v.s) return;
          v.drawnAt = v.s;
          var q = L.line.at(v.s);
          v.g.setAttribute("transform", "translate(" + q.x.toFixed(1) + " " + q.y.toFixed(1) + ") rotate(" + q.deg.toFixed(1) + ")" + (v.sc ? " scale(" + v.sc + ")" : ""));
        });
      });
      peds.forEach(function (p) {
        var x = CX + U[0] * p.lat + N[0] * p.d, y = CY + U[1] * p.lat + N[1] * p.d;
        var deg = Math.atan2(N[1] * p.dir, N[0] * p.dir) * 180 / Math.PI;
        p.g.setAttribute("transform", "translate(" + x.toFixed(1) + " " + y.toFixed(1) + ") rotate(" + deg.toFixed(1) + ") scale(1.3)");
        p.g.setAttribute("opacity", p.op.toFixed(2));
        var swing = p.walking ? Math.sin(clock * 12 + p.lat) * 3 : 0;
        p.f1.setAttribute("cx", swing.toFixed(1));
        p.f2.setAttribute("cx", (-swing).toFixed(1));
      });
    };

    // Start mid-scene, with traffic already on the road.
    for (var w = 0; w < 160; w++) advance(0.05);
    paint();

    if (!reduced && window.requestAnimationFrame) {
      var visible = true, running = false, prev = 0;
      var frame = function (now) {
        if (!visible) { running = false; return; }
        requestAnimationFrame(frame);
        // 30 frames a second is plenty for a small map and halves the repaints.
        if (prev && now - prev < 30) return;
        var dt = Math.min(0.05, (now - (prev || now)) / 1000);
        prev = now; clock += dt;
        advance(dt); paint();
      };
      var start = function () { if (!running) { running = true; prev = 0; requestAnimationFrame(frame); } };
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
          visible = entries[0].isIntersecting;
          if (visible) start();
        }).observe(traffic.closest("svg"));
      } else {
        start();
      }
    }
  }

  // Logo: the split-flap card flips F, U, L, K, I, then a plane, and settles back on F.
  var flap = document.querySelector("[data-flap]");
  if (flap && flap.animate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var PLANE = '<svg viewBox="-52 -45 104 90"><path fill="currentColor" d="M50 0C50-3.6 46.5-5.6 41-5.6H15L-4-40.5C-5-42.3-6.6-43-8.6-43H-13.4C-15-43-15.9-41.8-15.4-40.3L-6.4-5.6H-31L-39.6-17.4C-40.4-18.5-41.4-19-42.8-19H-46.4C-47.7-19-48.4-18-48-16.8L-44.2-4.2C-44.6-2.8-44.6 2.8-44.2 4.2L-48 16.8C-48.4 18-47.7 19-46.4 19H-42.8C-41.4 19-40.4 18.5-39.6 17.4L-31 5.6H-6.4L-15.4 40.3C-15.9 41.8-15 43-13.4 43H-8.6C-6.6 43-5 42.3-4 40.5L15 5.6H41C46.5 5.6 50 3.6 50 0Z"/></svg>';
    var face = function (q) { return flap.querySelector(q + " .flap-face"); };
    var top = face(".flap-top"), bottom = face(".flap-bottom");
    var leafTop = flap.querySelector(".flap-leaf-top"), leafBottom = flap.querySelector(".flap-leaf-bottom");
    var glyph = function (c) { return c === "plane" ? PLANE : c; };
    var current = "F";
    var flip = function (next, done) {
      // The top half of the current character falls away, revealing the next one; its bottom half drops into place.
      top.innerHTML = glyph(next);
      leafTop.firstChild.innerHTML = glyph(current);
      leafBottom.firstChild.innerHTML = glyph(next);
      leafTop.style.visibility = "visible";
      leafTop.animate([{ transform: "rotateX(0)" }, { transform: "rotateX(-90deg)" }], { duration: 120, easing: "ease-in" }).onfinish = function () {
        leafTop.style.visibility = "hidden";
        leafBottom.style.visibility = "visible";
        leafBottom.animate([{ transform: "rotateX(90deg)" }, { transform: "rotateX(0)" }], { duration: 140, easing: "ease-out" }).onfinish = function () {
          bottom.innerHTML = glyph(next);
          leafBottom.style.visibility = "hidden";
          current = next;
          done();
        };
      };
    };
    var sequence = ["U", "L", "K", "I", "plane", "F"];
    var step = function (i) {
      if (i < sequence.length) flip(sequence[i], function () { setTimeout(function () { step(i + 1); }, i === sequence.length - 2 ? 750 : 500); });
    };
    setTimeout(function () { step(0); }, 700);
  }

  // "Open now" label from the agency's hours, in Italian time whatever the visitor's zone.
  // Mon–Sat 9:00–13:00 and 15:00–19:00; closed on Sunday.
  var status = document.getElementById("open-status");
  var SLOTS = [[540, 780], [900, 1140]];
  var DAYS = {
    it: ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"],
    en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    fr: ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
    es: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
    de: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"]
  };
  // Each phrase takes the time (and, when it isn't tomorrow, the day) to show.
  var STATUS = {
    it: { open: "Aperto · chiude alle {t}", later: "Chiuso · apre alle {t}", tomorrow: "Chiuso · apre domani alle {t}", day: "Chiuso · apre {d} alle {t}" },
    en: { open: "Open · closes at {t}", later: "Closed · opens at {t}", tomorrow: "Closed · opens tomorrow at {t}", day: "Closed · opens {d} at {t}" },
    fr: { open: "Ouvert · ferme à {t}", later: "Fermé · ouvre à {t}", tomorrow: "Fermé · ouvre demain à {t}", day: "Fermé · ouvre {d} à {t}" },
    es: { open: "Abierto · cierra a las {t}", later: "Cerrado · abre a las {t}", tomorrow: "Cerrado · abre mañana a las {t}", day: "Cerrado · abre el {d} a las {t}" },
    de: { open: "Geöffnet · schließt um {t}", later: "Geschlossen · öffnet um {t}", tomorrow: "Geschlossen · öffnet morgen um {t}", day: "Geschlossen · öffnet {d} um {t}" }
  };
  function hhmm(min) { return Math.floor(min / 60) + ":" + ("0" + (min % 60)).slice(-2); }
  function romeNow() {
    var parts = {};
    new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Rome", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
    var day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday);
    return { day: day, min: +parts.hour * 60 + +parts.minute };
  }
  function updateStatus() {
    var now = romeNow();
    var key, time, nextDay = null, open = false;
    var slots = now.day === 0 ? [] : SLOTS;
    for (var i = 0; i < slots.length; i++) {
      if (now.min >= slots[i][0] && now.min < slots[i][1]) {
        open = true;
        key = "open";
        time = slots[i][1];
      }
    }
    if (!open) {
      var later = slots.filter(function (s) { return s[0] > now.min; })[0];
      if (later) {
        key = "later";
        time = later[0];
      } else {
        var next = now.day === 6 ? 1 : (now.day + 1) % 7;
        key = next === (now.day + 1) % 7 ? "tomorrow" : "day";
        nextDay = next;
        time = SLOTS[0][0];
      }
    }
    status.className = "status" + (open ? " open" : "");
    status.innerHTML = LANGS.map(function (l) {
      var text = STATUS[l][key].replace("{t}", hhmm(time)).replace("{d}", nextDay === null ? "" : DAYS[l][nextDay]);
      return '<span data-l="' + l + '">' + text + "</span>";
    }).join("");
    status.hidden = false;
  }
  if (status && window.Intl) {
    try { updateStatus(); setInterval(updateStatus, 60000); } catch (e) {}
  }

  // Privacy policy popup; also opens from a #privacy link.
  var dialog = document.getElementById("privacy");
  if (dialog && dialog.showModal) {
    var openPrivacy = function () { if (!dialog.open) dialog.showModal(); };
    document.querySelectorAll("[data-open-privacy]").forEach(function (a) {
      a.addEventListener("click", function (e) { e.preventDefault(); openPrivacy(); });
    });
    dialog.querySelector("[data-close-privacy]").addEventListener("click", function () { dialog.close(); });
    dialog.addEventListener("click", function (e) { if (e.target === dialog) dialog.close(); });
    if (location.hash === "#privacy") openPrivacy();
  }

  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
