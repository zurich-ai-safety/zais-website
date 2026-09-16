/* Shared page interactions. Navigation and timeline have their own modules. */
(function () {
  "use strict";

  /* ---- Homepage "Voices" carousel -------------------------------------- */
  /* One, two or three cards per view, paged by whole screens. */

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

    var cards = Array.from(track.children);
    var slides = cards.length;
    var viewport = track.parentElement;
    viewport.classList.add('voices-viewport');
    // The rail transform owns paging. Prevent focus/fragment scrolling from
    // adding an independent native offset to its clipped viewport.
    viewport.scrollLeft = 0;
    viewport.addEventListener('scroll', function () {
      if (viewport.scrollLeft) viewport.scrollLeft = 0;
    }, { passive: true });
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
      cards.forEach(function (card, index) {
        var visible = index >= page * perView && index < (page + 1) * perView;
        if (!visible && card.contains(document.activeElement)) {
          (next || prev).focus({ preventScroll: true });
        }
        card.inert = !visible;
        if (visible) card.removeAttribute('aria-hidden');
        else card.setAttribute('aria-hidden', 'true');
      });
      viewport.scrollLeft = 0;
    }

    function fit() {
      var w = window.innerWidth;
      var pv = w < 520 ? 1 : w < 780 ? 2 : 3;
      if (pv !== perView) {
        // Preserve the focused card, or the first card the reader was viewing.
        var focused = cards.findIndex(function (card) { return card.contains(document.activeElement); });
        var first = focused >= 0 ? focused : page * perView;
        perView = pv;
        page = Math.min(Math.floor(first / perView), pages() - 1);
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
    var toggles = document.querySelectorAll('.set-toggle');
    if (!gradient || !toggles.length) return;

    var STORAGE_KEY = 'zais-gradient-set';
    var stored = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    if (stored === 'A' || stored === 'B') {
      gradient.dataset.set = stored;
    }

    function sync() {
      var isDark = gradient.dataset.set === 'B';
      toggles.forEach(function (t) { t.setAttribute('aria-pressed', String(isDark)); });
    }
    sync();

    toggles.forEach(function (toggle) {
      toggle.addEventListener('click', function () {
        var isDark = gradient.dataset.set === 'B';
        var next = isDark ? 'A' : 'B';
        gradient.dataset.set = next;
        sync();
        try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
      });
    });
  }

  /* ---- Scroll reveal for section headings + intros -------------------- */
  /* Elements are marked with data-reveal in the HTML. The reveal-pending
     class (which starts them invisible) is only added here, in JS — never
     in the HTML or a static CSS class — so if JS fails to run or load,
     nothing is ever hidden. Blocks fade once; homepage text follows scroll
     position in both directions. */

  /* Splits an element's text into one <span class="wr-word"> per word,
     walking the DOM (not innerHTML) so any nested tag - e.g. the inline
     link inside the FAQ paragraph on the Themed Events page - is kept
     intact and just has its own text words wrapped in turn. */
  function wrapWords(el) {
    function walk(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        var parts = node.textContent.split(/(\s+)/);
        var frag = document.createDocumentFragment();
        parts.forEach(function (part) {
          if (part === '') return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(part));
          } else {
            var span = document.createElement('span');
            span.className = 'wr-word';
            span.textContent = part;
            frag.appendChild(span);
          }
        });
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        Array.prototype.slice.call(node.childNodes).forEach(walk);
      }
    }
    Array.prototype.slice.call(el.childNodes).forEach(walk);
  }

  function initScrollReveal() {
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    var hero = document.querySelector('section[data-screen-label*="Hero"]');
    var entrance = hero ? Array.from(hero.querySelectorAll('h1, h2, p, a[data-hv="hv3"]')) : [];
    var headerItems = Array.from(document.querySelectorAll('header .header-brand, header .site-navigation > a, header .nav-trigger, header .header-actions > *, header .header-mobile-controls > *'));
    function enter(el, delay) {
      if (reduced.matches) return;
      el.style.setProperty('--entrance-delay', delay + 'ms');
      el.classList.add('entrance-item');
      el.addEventListener('animationend', function () { el.classList.remove('entrance-item'); }, { once: true });
    }
    headerItems.forEach(function (el, i) { enter(el, Math.min(i * 35, 210)); });
    entrance.forEach(function (el, i) { enter(el, 120 + i * 120); });
    var homepage = window.location.pathname === '/' || window.location.pathname === '/index.html';
    var els = Array.from(document.querySelectorAll('[data-reveal]')).filter(function (el) {
      return !el.closest('section[data-screen-label*="Hero"], .timeline-copy') &&
        !el.parentElement.closest('[data-reveal]');
    });
    var textEls = [];
    var blockEls = [];
    els.forEach(function (el) {
      (homepage && /^(H1|H2|H3|P)$/.test(el.tagName) ? textEls : blockEls).push(el);
    });

    var fadeClass = homepage ? 'reveal-pending' : 'section-fade-pending';
    var visibleClass = homepage ? 'reveal-visible' : 'section-fade-visible';
    var observer;
    if (!reduced.matches && blockEls.length && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add(visibleClass);
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });
      blockEls.forEach(function (el) {
        el.classList.add(fadeClass);
        observer.observe(el);
      });
    }
    function showFades() {
      if (observer) observer.disconnect();
      blockEls.forEach(function (el) { el.classList.remove(fadeClass); });
    }

    // Keep the adopted per-word thresholds and 400ms opacity easing.
    textEls.forEach(function (el) {
      wrapWords(el);
      el.__wrWords = el.querySelectorAll('.wr-word');
    });
    var frame = 0;
    function paintWords() {
      frame = 0;
      if (reduced.matches) return;
      var revealLine = window.innerHeight * 0.78;
      textEls.forEach(function (block) {
        var spans = block.__wrWords;
        var rect = block.getBoundingClientRect();
        var progress = rect.height > 0 ? (revealLine - rect.top) / rect.height : 0;
        var litCount = Math.round(Math.max(0, Math.min(1, progress)) * spans.length);
        for (var i = 0; i < spans.length; i++) spans[i].classList.toggle('wr-lit', i < litCount);
      });
    }
    function schedule() {
      if (!frame && !reduced.matches) frame = requestAnimationFrame(paintWords);
    }
    function preferenceChanged() {
      if (reduced.matches) {
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        showFades();
        entrance.concat(headerItems).forEach(function (el) { el.classList.remove('entrance-item'); });
      } else paintWords();
      textEls.forEach(function (block) {
        block.classList.toggle('word-reveal-active', !reduced.matches && !block.__wrFocused);
      });
    }
    preferenceChanged();
    reduced.addEventListener('change', preferenceChanged);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('pageshow', schedule);
    if (document.fonts) document.fonts.ready.then(schedule);
    document.addEventListener('focusin', function (event) {
      textEls.forEach(function (block) {
        if (!block.contains(event.target)) return;
        block.__wrFocused = true;
        block.classList.remove('word-reveal-active');
      });
      blockEls.forEach(function (block) {
        if (!block.contains(event.target)) return;
        block.classList.remove(fadeClass);
        if (observer) observer.unobserve(block);
      });
    });
  }

  /* ---- Drag-to-scroll horizontal row, with a custom "Drag" cursor ------ */
  /* Mouse users drag the row sideways; touchscreens already scroll it
     natively with a swipe. A small circular indicator follows the pointer
     while it's over the row, replacing the native cursor, so dragging is
     the only affordance shown — no scrollbar, no arrow buttons. */

  function initDragScroll() {
    var rows = document.querySelectorAll('[data-drag-scroll]');
    if (!rows.length) return;

    rows.forEach(function (row) {
      var cursor = document.createElement('div');
      cursor.className = 'drag-cursor';
      cursor.textContent = 'DRAG';
      document.body.appendChild(cursor);

      var dragging = false;
      var moved = false;
      var startX = 0;
      var startScroll = 0;

      function moveCursor(e) {
        cursor.style.transform = 'translate3d(' + (e.clientX - 32) + 'px,' + (e.clientY - 32) + 'px,0)';
      }

      row.addEventListener('mouseenter', function (e) {
        cursor.classList.add('is-visible');
        moveCursor(e);
      });
      row.addEventListener('mousemove', moveCursor);
      row.addEventListener('mouseleave', function () {
        cursor.classList.remove('is-visible');
        dragging = false;
        row.classList.remove('is-dragging');
      });

      row.addEventListener('mousedown', function (e) {
        dragging = true;
        moved = false;
        startX = e.clientX;
        startScroll = row.scrollLeft;
        row.classList.add('is-dragging');
      });

      window.addEventListener('mousemove', function (e) {
        if (!dragging) return;
        var dx = e.clientX - startX;
        if (Math.abs(dx) > 4) moved = true;
        row.scrollLeft = startScroll - dx;
      });

      window.addEventListener('mouseup', function () {
        if (!dragging) return;
        dragging = false;
        row.classList.remove('is-dragging');
      });

      /* Suppress the click a drag gesture would otherwise fire on
         whatever's underneath the pointer (e.g. a "Learn more" link). */
      row.addEventListener('click', function (e) {
        if (moved) {
          e.preventDefault();
          e.stopPropagation();
          moved = false;
        }
      }, true);
    });
  }

  function boot() {
    initVoices();
    initSessionTabs();
    initHeroToggle();
    initScrollReveal();
    initDragScroll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
