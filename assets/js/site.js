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

  function shuffleTrack(track) {
    var items = Array.prototype.slice.call(track.children);
    for (var i = items.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = items[i];
      items[i] = items[j];
      items[j] = tmp;
    }
    items.forEach(function (el) { track.appendChild(el); });
  }

  function initVoices() {
    var track = document.querySelector("[data-carousel-track]");
    if (!track) return;

    shuffleTrack(track);

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

  /* ---- About page "Where we come from" horizontal timeline ----------- */
  /* A native horizontally-scrolling strip of milestone cards. The prev/next
     buttons just nudge the scroll position by roughly one card's width;
     dragging, trackpad and touch scrolling all work on their own. */

  function initStoryTimeline() {
    var scroller = document.querySelector("[data-tl-scroll]");
    if (!scroller) return;

    var prev = document.querySelector('[data-action="storyPrev"]');
    var next = document.querySelector('[data-action="storyNext"]');

    function nudge(dir) {
      var amount = Math.min(scroller.clientWidth * 0.8, 340) * dir;
      scroller.scrollBy({ left: amount, behavior: "smooth" });
    }

    if (prev) prev.addEventListener("click", function (e) { e.preventDefault(); nudge(-1); });
    if (next) next.addEventListener("click", function (e) { e.preventDefault(); nudge(1); });
  }

  /* ---- Programme session tabs (list left, detail right) -------------- */
  /* Any button[data-action=selectSession][data-session=N] selects session N:
     its [data-session-title] turns accent-colored (others revert to ink),
     and its sibling [data-session-detail-panel=N] is shown while the rest
     hide. Guarded like the others: no-ops when absent. The first item is
     active in the markup already, so this only needs to run on click. */

  function initSessionTabs() {
    var buttons = document.querySelectorAll('[data-action="selectSession"]');
    if (!buttons.length) return;

    function select(id) {
      buttons.forEach(function (btn) {
        var isActive = btn.getAttribute('data-session') === id;
        btn.setAttribute('data-active', String(isActive));
        btn.setAttribute('aria-selected', String(isActive));
        var color = isActive ? '#DE2C00' : '#020522';
        var title = btn.querySelector('[data-session-title]');
        var num = btn.querySelector('[data-session-num]');
        if (title) title.style.color = color;
        if (num) num.style.color = color;
      });
      document.querySelectorAll('[data-session-detail-panel]').forEach(function (p) {
        p.hidden = p.getAttribute('data-session-detail-panel') !== id;
      });
    }

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () { select(btn.getAttribute('data-session')); });
    });
  }

  /* ---- Hero gradient set toggle (nav, all pages) --------------------- */
  /* One button, now living in the nav next to "Get Involved", controls
     every page's #hero-gradient. The choice is remembered across page
     loads via localStorage so it doesn't reset when you navigate. */

  function initHeroToggle() {
    var gradient = document.getElementById('hero-gradient');
    var toggle = document.getElementById('hero-set-toggle');
    if (!gradient || !toggle) return;

    var STORAGE_KEY = 'zais-gradient-set';
    var stored = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    if (stored === 'A' || stored === 'B') {
      gradient.dataset.set = stored;
      toggle.setAttribute('aria-pressed', String(stored === 'B'));
    }

    toggle.addEventListener('click', function () {
      var isDark = gradient.dataset.set === 'B';
      var next = isDark ? 'A' : 'B';
      gradient.dataset.set = next;
      toggle.setAttribute('aria-pressed', String(!isDark));
      try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
    });
  }

  /* ---- Scroll reveal for section headings + intros -------------------- */
  /* Elements are marked with data-reveal in the HTML. The reveal-pending
     class (which starts them invisible) is only added here, in JS — never
     in the HTML or a static CSS class — so if JS fails to run or load,
     nothing is ever hidden. Each element reveals once, the first time it
     scrolls into view, then is left alone. */

  function initScrollReveal() {
    var els = document.querySelectorAll('[data-reveal]');
    if (!els.length || !('IntersectionObserver' in window)) return;

    els.forEach(function (el) { el.classList.add('reveal-pending'); });

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('reveal-visible');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });

    els.forEach(function (el) { observer.observe(el); });
  }

  function boot() {
    initVoices();
    initStoryTimeline();
    initSessionTabs();
    initHeroToggle();
    initScrollReveal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
