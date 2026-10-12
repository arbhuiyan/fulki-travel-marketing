// Progressive enhancement only: the page is complete without this file.
(function () {
  var root = document.documentElement;
  root.classList.add("js");

  // Language: the visitor's saved choice, else the first browser language we offer, else Italian.
  var KEY = "fulki.site.lang";
  var LANGS = ["it", "en", "fr", "es", "de", "bn"];
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

  // The contact map's cars use SMIL too: stop them for reduced motion.
  var streetmap = document.querySelector(".streetmap");
  if (streetmap && window.matchMedia("(prefers-reduced-motion: reduce)").matches && streetmap.pauseAnimations) {
    streetmap.pauseAnimations();
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
    de: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
    bn: ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"]
  };
  // Each phrase takes the time (and, when it isn't tomorrow, the day) to show.
  var STATUS = {
    it: { open: "Aperto · chiude alle {t}", later: "Chiuso · apre alle {t}", tomorrow: "Chiuso · apre domani alle {t}", day: "Chiuso · apre {d} alle {t}" },
    en: { open: "Open · closes at {t}", later: "Closed · opens at {t}", tomorrow: "Closed · opens tomorrow at {t}", day: "Closed · opens {d} at {t}" },
    fr: { open: "Ouvert · ferme à {t}", later: "Fermé · ouvre à {t}", tomorrow: "Fermé · ouvre demain à {t}", day: "Fermé · ouvre {d} à {t}" },
    es: { open: "Abierto · cierra a las {t}", later: "Cerrado · abre a las {t}", tomorrow: "Cerrado · abre mañana a las {t}", day: "Cerrado · abre el {d} a las {t}" },
    de: { open: "Geöffnet · schließt um {t}", later: "Geschlossen · öffnet um {t}", tomorrow: "Geschlossen · öffnet morgen um {t}", day: "Geschlossen · öffnet {d} um {t}" },
    bn: { open: "এখন খোলা · {t}-এ বন্ধ হবে", later: "এখন বন্ধ · {t}-এ খুলবে", tomorrow: "এখন বন্ধ · কাল {t}-এ খুলবে", day: "এখন বন্ধ · {d} {t}-এ খুলবে" }
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
