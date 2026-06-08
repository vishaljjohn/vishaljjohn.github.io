/* Vishal John — shared site behavior: tasteful scroll reveal */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) return; // leave content fully visible

  // Elements worth revealing on scroll
  var selectors = [
    ".main-content > h2",
    ".main-content > h3",
    ".main-content > p",
    ".project-item",
    ".publication-item",
    ".pub-section-label",
    "figure",
    ".character-card",
    ".flipbook",
    ".book-hero",
    ".spotify-section",
    ".contact-form",
    ".vibe-card",
    ".image-section",
    ".cv-actions"
  ];

  function init() {
    var nodes = [];
    selectors.forEach(function (sel) {
      Array.prototype.forEach.call(document.querySelectorAll(sel), function (el) {
        if (nodes.indexOf(el) === -1) nodes.push(el);
      });
    });
    if (!nodes.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -8% 0px" });

    nodes.forEach(function (el, i) {
      el.classList.add("reveal");
      // small stagger for grouped items
      el.style.transitionDelay = (Math.min(i % 6, 5) * 50) + "ms";
      io.observe(el);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
