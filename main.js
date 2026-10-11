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

  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
