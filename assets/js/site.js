/* Zurich AI Safety  -  behaviour for the two carousels.
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
    var perView = 4;

    function pages() { return Math.ceil(slides / perView); }

    function paint() {
      track.style.gridAutoColumns =
        "calc((100% - " + (perView - 1) * GAP + "px) / " + perView + ")";
      track.style.transform = "translateX(calc(" + -page + " * (100% + " + GAP + "px)))";
      if (label) label.textContent = (page + 1) + " / " + pages();
    }

    function fit() {
      var w = window.innerWidth;
      var pv = w < 520 ? 1 : w < 780 ? 2 : w < 1100 ? 3 : 4;
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
    var viewport = document.querySelector(".timeline-viewport");
    var track = document.querySelector(".timeline-track");
    if (!viewport || !track) return;

    var prev = document.querySelector('[data-action="storyPrev"]');
    var next = document.querySelector('[data-action="storyNext"]');

    function step() {
      var first = track.querySelector(".timeline-milestone");
      var width = first ? first.getBoundingClientRect().width + 36 : 340;
      return Math.min(viewport.clientWidth * 0.8, width * 1.4);
    }

    function nudge(dir) {
      viewport.scrollBy({ left: step() * dir, behavior: "smooth" });
    }

    function paintProgress() {
      var max = viewport.scrollWidth - viewport.clientWidth;
      var progress = max > 0 ? viewport.scrollLeft / max : 0;
      track.style.setProperty("--timeline-progress", progress);
      if (prev) prev.disabled = viewport.scrollLeft <= 1;
      if (next) next.disabled = viewport.scrollLeft >= max - 1;
    }

    if (prev) prev.addEventListener("click", function (e) { e.preventDefault(); nudge(-1); });
    if (next) next.addEventListener("click", function (e) { e.preventDefault(); nudge(1); });

    viewport.addEventListener("scroll", paintProgress, { passive: true });
    window.addEventListener("resize", paintProgress);
    paintProgress();
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
    /* Cycles every .gradient on the page through the hero palettes. The
       red set ('D') is registered in the CSS but kept out of this list, so
       the switcher only offers blue and sand. All heroes change together
       and the choice is remembered across page loads. */
    var SETS = ['C', 'A'];
    var NAMES = { C: 'blue', A: 'the original sand' };
    var gradients = document.querySelectorAll('.gradient');
    var toggles = document.querySelectorAll('.set-toggle');
    if (!gradients.length || !toggles.length) return;

    /* The control is currently hidden in the nav. While it is, leave every
       hero on the palette its own markup declares and ignore any set
       remembered from an earlier visit, so pages render as authored. */
    var visible = Array.prototype.some.call(toggles, function (t) {
      return t.offsetParent !== null;
    });
    if (!visible) return;

    var STORAGE_KEY = 'zais-gradient-set';
    var current = SETS.indexOf(gradients[0].dataset.set);
    if (current < 0) current = 0;
    var stored = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    if (SETS.indexOf(stored) >= 0) current = SETS.indexOf(stored);

    function apply() {
      var set = SETS[current];
      var next = SETS[(current + 1) % SETS.length];
      Array.prototype.forEach.call(gradients, function (g) {
        g.dataset.set = set;
        var host = g.closest ? g.closest('section') : null;
        if (host) host.dataset.palette = set;
      });
      Array.prototype.forEach.call(toggles, function (tg) {
        tg.dataset.next = next;
        tg.setAttribute('aria-pressed', String(set !== SETS[0]));
        tg.setAttribute('title', 'Switch to ' + NAMES[next]);
        tg.setAttribute('aria-label', 'Background colour: ' + NAMES[set] +
                        '. Switch to ' + NAMES[next] + '.');
      });
    }
    apply();

    Array.prototype.forEach.call(toggles, function (toggle) {
      toggle.addEventListener('click', function () {
        current = (current + 1) % SETS.length;
        apply();
        try { localStorage.setItem(STORAGE_KEY, SETS[current]); } catch (e) {}
      });
    });
  }

  /* ---- Scroll reveal for section headings + intros -------------------- */
  /* Elements are marked with data-reveal in the HTML. The reveal-pending
     class (which starts them invisible) is only added here, in JS  -  never
     in the HTML or a static CSS class  -  so if JS fails to run or load,
     nothing is ever hidden. Each element reveals once, the first time it
     scrolls into view, then is left alone. */

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
    var els = document.querySelectorAll('[data-reveal]');
    if (!els.length) return;

    // Headings and paragraphs get the word-by-word, scroll-linked reveal;
    // everything else tagged data-reveal (programme rows, drag cards - full
    // composite blocks, not body text) keeps the older single fade + rise.
    var textEls = [];
    var blockEls = [];
    els.forEach(function (el) {
      (/^(H1|H2|H3|P)$/.test(el.tagName) ? textEls : blockEls).push(el);
    });

    if (blockEls.length && 'IntersectionObserver' in window) {
      blockEls.forEach(function (el) { el.classList.add('reveal-pending'); });
      var observer = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('reveal-visible');
          obs.unobserve(entry.target);
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });
      blockEls.forEach(function (el) { observer.observe(el); });
    }

    if (textEls.length) {
      textEls.forEach(wrapWords);
      var ticking = false;
      // Progress is computed per block (not per word position), so the lit
      // boundary can fall mid-line - word 14 of 30 lights up before word 15
      // even when both sit on the same visual line - a true word-by-word
      // reveal in reading order, not a line-by-line snap.
      function paintWords() {
        var revealLine = window.innerHeight * 0.78;
        textEls.forEach(function (block) {
          var spans = block.__wrWords || (block.__wrWords = block.querySelectorAll('.wr-word'));
          if (!spans.length) return;
          var rect = block.getBoundingClientRect();
          var progress = rect.height > 0 ? (revealLine - rect.top) / rect.height : 0;
          if (progress < 0) progress = 0;
          if (progress > 1) progress = 1;
          var litCount = Math.round(progress * spans.length);
          for (var i = 0; i < spans.length; i++) {
            spans[i].classList.toggle('wr-lit', i < litCount);
          }
        });
        ticking = false;
      }
      function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(paintWords);
      }
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
      paintWords();
    }
  }

  /* ---- Drag-to-scroll horizontal row, with a custom "Drag" cursor ------ */
  /* Mouse users drag the row sideways; touchscreens already scroll it
     natively with a swipe. A small circular indicator follows the pointer
     while it's over the row, replacing the native cursor, so dragging is
     the only affordance shown  -  no scrollbar, no arrow buttons. */

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
        if (!overInteractive(e)) cursor.classList.add('is-visible');
        moveCursor(e);
      });
      /* Over a link or button the native pointer is the right affordance,
         so the DRAG bubble steps out of the way. */
      function overInteractive(e) {
        var el = e.target;
        return !!(el && el.closest && el.closest('a, button'));
      }
      row.addEventListener('mousemove', function (e) {
        moveCursor(e);
        if (dragging) return;
        cursor.classList.toggle('is-visible', !overInteractive(e));
      });
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

  /* ---- Current-page underline (nav, all pages) ------------------------ */
  /* Marks whichever top-level link matches the current page with
     data-nav-current, which site.css turns into an underline. Runs once on
     load; dropdown triggers have no href so they are never matched, and
     sub-pages (Get Involved, AI Futures, etc.) simply have no top-level
     link marked, same as the reference. */
  function initNavCurrent() {
    var here = location.pathname.replace(/\/index\.html$/, '');
    if (here.length > 1) here = here.replace(/\/+$/, '');
    if (here === '') here = '/';
    document.querySelectorAll('header nav > a[href], .mobile-nav-links > a[href]').forEach(function (a) {
      var href;
      try { href = new URL(a.getAttribute('href'), location.origin).pathname; }
      catch (e) { return; }
      if (href.length > 1) href = href.replace(/\/+$/, '');
      if (href === here) a.setAttribute('data-nav-current', 'true');
    });
  }

  function initStickyHeader() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    function paint() {
      header.classList.toggle('is-compact', window.scrollY > 24);
    }
    window.addEventListener('scroll', paint, { passive: true });
    paint();
  }

  function initMobileNav() {
    var toggle = document.getElementById("mobile-menu-toggle");
    var closeBtn = document.getElementById("mobile-menu-close");
    var panel = document.getElementById("mobile-nav-panel");
    if (!toggle || !panel) return;

    function open() {
      panel.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      document.body.classList.add("mobile-nav-open");
    }
    function close() {
      panel.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("mobile-nav-open");
    }

    toggle.addEventListener("click", function () {
      if (panel.classList.contains("is-open")) close(); else open();
    });
    if (closeBtn) closeBtn.addEventListener("click", close);
    panel.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", close);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });
  }

  /* ---- Why Zurich stat slider (mobile) ------------------------------- */
  /* Below 760px the stat row turns into a scroll-snap track. This only
     builds the dot indicators and keeps the active one in sync; the
     scrolling itself is pure CSS. No-ops when the markup is absent. */

  function initStatSlider() {
    var track = document.querySelector('[data-stat-slider]');
    var dots = document.querySelector('[data-stat-dots]');
    if (!track || !dots || !track.children.length) return;

    var cards = Array.prototype.slice.call(track.children);

    cards.forEach(function (card, i) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'stat-dot';
      dot.setAttribute('aria-label', 'Show statistic ' + (i + 1) + ' of ' + cards.length);
      dot.addEventListener('click', function () {
        track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: 'smooth' });
      });
      dots.appendChild(dot);
    });

    function paint() {
      var centre = track.scrollLeft + track.clientWidth / 2;
      var best = 0;
      var bestDist = Infinity;
      cards.forEach(function (card, i) {
        var mid = card.offsetLeft - track.offsetLeft + card.offsetWidth / 2;
        var dist = Math.abs(mid - centre);
        if (dist < bestDist) { bestDist = dist; best = i; }
      });
      Array.prototype.forEach.call(dots.children, function (dot, i) {
        dot.setAttribute('data-active', String(i === best));
      });
    }

    track.addEventListener('scroll', paint, { passive: true });
    window.addEventListener('resize', paint);
    paint();
  }

  /* ---- Programme chapters: flyout on mobile -------------------------- */
  /* On wide screens the curriculum is a two-column widget (chapter list
     left, detail right). Below 760px each detail panel is moved directly
     under its own chapter button so tapping a chapter flies its text out
     underneath, accordion style. Panels move back on resize. */

  function initSessionFlyout() {
    var widget = document.querySelector('[data-session-widget]');
    if (!widget) return;
    var detail = widget.querySelector('[data-session-detail]');
    var buttons = Array.prototype.slice.call(
      widget.querySelectorAll('[data-action="selectSession"]')
    );
    if (!detail || !buttons.length) return;

    var panels = Array.prototype.slice.call(
      detail.querySelectorAll('[data-session-detail-panel]')
    );
    if (!panels.length) return;

    var mq = window.matchMedia('(max-width: 760px)');
    var mobile = null;

    function panelFor(id) {
      for (var i = 0; i < panels.length; i++) {
        if (panels[i].getAttribute('data-session-detail-panel') === id) return panels[i];
      }
      return null;
    }

    function toMobile() {
      buttons.forEach(function (btn) {
        var panel = panelFor(btn.getAttribute('data-session'));
        if (!panel) return;
        panel.setAttribute('data-session-flyout', '');
        btn.insertAdjacentElement('afterend', panel);
      });
      detail.style.display = 'none';
      buttons.forEach(function (btn) {
        btn.setAttribute('aria-expanded', btn.getAttribute('data-active') === 'true' ? 'true' : 'false');
      });
    }

    function toDesktop() {
      panels.forEach(function (panel) {
        panel.removeAttribute('data-session-flyout');
        detail.appendChild(panel);
      });
      detail.style.display = '';
      buttons.forEach(function (btn) { btn.removeAttribute('aria-expanded'); });
      /* Never leave the desktop view with everything collapsed. */
      var anyOpen = panels.some(function (p) { return !p.hidden; });
      if (!anyOpen && panels[0]) {
        panels[0].hidden = false;
        buttons.forEach(function (btn) {
          var on = btn.getAttribute('data-session') === panels[0].getAttribute('data-session-detail-panel');
          btn.setAttribute('data-active', String(on));
          btn.setAttribute('aria-selected', String(on));
          var colour = on ? '#DE2C00' : '#020522';
          var title = btn.querySelector('[data-session-title]');
          var num = btn.querySelector('[data-session-num]');
          if (title) title.style.color = colour;
          if (num) num.style.color = colour;
        });
      }
    }

    function sync() {
      if (mq.matches === mobile) return;
      mobile = mq.matches;
      if (mobile) toMobile(); else toDesktop();
    }

    /* On mobile a second tap on the open chapter closes it. The tab
       handler in initSessionTabs has already run by this point, so the
       panel is open and the button active: just collapse both. */
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!mobile) return;
        var panel = panelFor(btn.getAttribute('data-session'));
        if (!panel) return;
        if (btn.getAttribute('data-expanded') === 'true') {
          panel.hidden = true;
          btn.setAttribute('data-active', 'false');
          btn.setAttribute('aria-selected', 'false');
          var title = btn.querySelector('[data-session-title]');
          var num = btn.querySelector('[data-session-num]');
          if (title) title.style.color = '#020522';
          if (num) num.style.color = '#020522';
        }
        buttons.forEach(function (b) {
          var open = b.getAttribute('data-active') === 'true';
          b.setAttribute('data-expanded', String(open));
          b.setAttribute('aria-expanded', String(open));
        });
      });
    });

    if (mq.addEventListener) mq.addEventListener('change', sync);
    else if (mq.addListener) mq.addListener(sync);
    sync();
    buttons.forEach(function (b) {
      b.setAttribute('data-expanded', String(b.getAttribute('data-active') === 'true'));
    });
  }

  function boot() {
    initVoices();
    initStoryTimeline();
    initSessionTabs();
    initSessionFlyout();
    initStatSlider();
    initHeroToggle();
    initScrollReveal();
    initDragScroll();
    initMobileNav();
    initStickyHeader();
    initNavCurrent();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
