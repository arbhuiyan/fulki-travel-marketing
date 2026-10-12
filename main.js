// Progressive enhancement only: the page is complete without this file.
(function () {
  var root = document.documentElement;
  root.classList.add("js");

  // Language: Italian by default; remember the visitor's choice when storage is available.
  var KEY = "fulki.site.lang";
  var buttons = document.querySelectorAll("[data-set-lang]");
  function setLang(lang) {
    root.lang = lang;
    buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.setLang === lang)); });
  }
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  if (saved === "it" || saved === "en") setLang(saved);
  else if (!/^it\b/i.test(navigator.language || "it")) setLang("en");
  buttons.forEach(function (b) {
    b.addEventListener("click", function () {
      setLang(b.dataset.setLang);
      try { localStorage.setItem(KEY, b.dataset.setLang); } catch (e) {}
    });
  });

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
    en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
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
    var it, en, open = false;
    var slots = now.day === 0 ? [] : SLOTS;
    for (var i = 0; i < slots.length; i++) {
      if (now.min >= slots[i][0] && now.min < slots[i][1]) {
        open = true;
        it = "Aperto · chiude alle " + hhmm(slots[i][1]);
        en = "Open · closes at " + hhmm(slots[i][1]);
      }
    }
    if (!open) {
      var later = slots.filter(function (s) { return s[0] > now.min; })[0];
      if (later) {
        it = "Chiuso · apre alle " + hhmm(later[0]);
        en = "Closed · opens at " + hhmm(later[0]);
      } else {
        var next = now.day === 6 ? 1 : (now.day + 1) % 7;
        var tomorrow = next === (now.day + 1) % 7;
        it = "Chiuso · apre " + (tomorrow ? "domani" : DAYS.it[next]) + " alle 9:00";
        en = "Closed · opens " + (tomorrow ? "tomorrow" : DAYS.en[next]) + " at 9:00";
      }
    }
    status.className = "status" + (open ? " open" : "");
    status.innerHTML = '<span data-l="it">' + it + '</span><span data-l="en">' + en + "</span>";
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
