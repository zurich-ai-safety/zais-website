/* Zurich AI Safety — behaviour for the two carousels.
 *
 * The nav dropdowns are pure CSS (hover / focus-within), so nothing here
 * touches them. Everything below reproduces the state logic that lived in the
 * Design Canvas <script type="text/x-dc"> blocks.
 */
(function () {
  "use strict";

  /* ---- Homepage "Voices" carousel -------------------------------------- */
  /* Six slides, 1/2/3 per view by width, paged by whole screens. */

  function initVoices() {
    var track = document.querySelector("[data-carousel-track]");
    if (!track) return;

    var slides = track.children.length;
    var label = document.querySelector("[data-slide-label]");
    var prev = document.querySelector('[data-action="prevSlide"]');
    var next = document.querySelector('[data-action="nextSlide"]');
    var GAP = 16;
    var page = 0;
    var perView = 3;

    function pages() { return Math.ceil(slides / perView); }

    function paint() {
      track.style.gridAutoColumns =
        "calc((100% - " + (perView - 1) * GAP + "px) / " + perView + ")";
      track.style.transform = "translateX(calc(" + -page + " * (100% + " + GAP + "px)))";
      if (label) label.textContent = (page + 1) + " / " + pages();
    }

    function fit() {
      var w = window.innerWidth;
      var pv = w < 520 ? 1 : w < 780 ? 2 : 3;
      if (pv !== perView) {
        perView = pv;
        page = Math.min(page, pages() - 1);
      }
      paint();
    }

    function turn(dir) {
      var n = pages();
      page = (page + dir + n) % n;
      paint();
    }

    if (prev) prev.addEventListener("click", function (e) { e.preventDefault(); turn(-1); });
    if (next) next.addEventListener("click", function (e) { e.preventDefault(); turn(1); });
    [prev, next].forEach(function (el, i) {
      if (!el) return;
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); turn(i === 0 ? -1 : 1); }
      });
    });

    window.addEventListener("resize", fit);
    fit();
  }

  /* ---- About page timeline stepper -------------------------------------- */
  /* Six steps. Each step has an "active" and an "inactive" variant in the
     markup; showing a step means unhiding one set and hiding the other. */

  function initTimeline() {
    var cards = document.querySelectorAll("[data-tl-card]");
    if (!cards.length) return;

    var N = 6;
    var counter = document.querySelector("[data-tl-counter]");
    var active = 0;

    function paint() {
      document.querySelectorAll("[data-tl-card]").forEach(function (el) {
        el.hidden = Number(el.getAttribute("data-tl-card")) !== active;
      });
      document.querySelectorAll("[data-tl-off]").forEach(function (el) {
        el.hidden = Number(el.getAttribute("data-tl-off")) === active;
      });
      if (counter) {
        counter.textContent =
          String(active + 1).padStart(2, "0") + " / " + String(N).padStart(2, "0");
      }
    }

    function go(i) {
      active = Math.max(0, Math.min(N - 1, i));
      paint();
    }

    document.querySelectorAll("[data-action]").forEach(function (el) {
      var action = el.getAttribute("data-action");
      var m = /^go(\d)$/.exec(action);
      if (m) {
        el.addEventListener("click", function (e) { e.preventDefault(); go(Number(m[1])); });
      } else if (action === "prev") {
        el.addEventListener("click", function (e) { e.preventDefault(); go(active - 1); });
      } else if (action === "next") {
        el.addEventListener("click", function (e) { e.preventDefault(); go(active + 1); });
      }
    });

    paint();
  }

  function boot() {
    initVoices();
    initTimeline();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
