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
