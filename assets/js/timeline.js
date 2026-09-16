/* Native timeline navigation and whole-milestone entrances. */
(function () {
  'use strict';
  function initTimeline() {
    var section = document.querySelector('#story');
    if (!section || section.classList.contains('timeline-ready')) return;
    var viewport = section.querySelector('.timeline-viewport');
    var track = section.querySelector('.timeline-track');
    if (!viewport || !track) return;
    var items = Array.from(track.querySelectorAll('.timeline-milestone'));
    var previous = section.querySelector('[data-action="storyPrev"]');
    var next = section.querySelector('[data-action="storyNext"]');
    var mobile = window.matchMedia('(max-width: 760px)');
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    var frame = 0;
    function clamp(value) { return Math.max(0, Math.min(1, value)); }
    function paint() {
      frame = 0;
      var box = viewport.getBoundingClientRect();
      var max = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
      var progress;
      if (mobile.matches) {
        var line = track.getBoundingClientRect();
        // Fill to a reading point 70% down the viewport. The vertical rule
        // starts 18px into the track and finishes at the last copy's bottom.
        progress = clamp((window.innerHeight * 0.7 - line.top - 18) / Math.max(1, line.height - 18));
      } else {
        progress = max ? clamp(viewport.scrollLeft / max) : 1;
      }
      track.style.setProperty('--timeline-progress', String(progress));
      if (previous) previous.disabled = mobile.matches || viewport.scrollLeft <= 1;
      if (next) next.disabled = mobile.matches || viewport.scrollLeft >= max - 1;
      items.forEach(function (item) {
        var copy = item.querySelector('.timeline-copy');
        if (!copy) return;
        if (mobile.matches || reduced.matches) {
          copy.style.removeProperty('--milestone-opacity');
          return;
        }
        var rect = copy.getBoundingClientRect();
        var horizontal = clamp((box.right - rect.left) / Math.min(180, rect.width));
        var vertical = clamp((window.innerHeight * 0.95 - rect.top) / Math.min(160, rect.height));
        copy.style.setProperty('--milestone-opacity', String(0.22 + Math.min(horizontal, vertical) * 0.78));
      });
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(paint); }
    function move(left) {
      viewport.scrollTo({ left: left, behavior: reduced.matches ? 'instant' : 'smooth' });
      schedule();
    }
    function nudge(direction) {
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      var width = items.length ? items[0].getBoundingClientRect().width + gap : 340;
      move(viewport.scrollLeft + direction * Math.min(viewport.clientWidth * 0.8, width * 1.4));
    }
    if (previous) previous.addEventListener('click', function () { nudge(-1); });
    if (next) next.addEventListener('click', function () { nudge(1); });
    viewport.addEventListener('keydown', function (event) {
      if (mobile.matches || event.target !== viewport || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        move(event.key === 'Home' ? 0 : viewport.scrollWidth);
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        nudge(event.key === 'ArrowLeft' ? -1 : 1);
      }
    });
    function mode() {
      viewport.tabIndex = mobile.matches ? -1 : 0;
      // Cancel an in-flight native smooth scroll when the preference changes.
      if (reduced.matches || mobile.matches) {
        viewport.scrollTo({ left: mobile.matches ? 0 : viewport.scrollLeft, behavior: 'instant' });
      }
      paint();
    }
    viewport.setAttribute('role', 'region');
    viewport.setAttribute('aria-label', 'Our history timeline');
    section.classList.add('timeline-ready');
    viewport.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('pageshow', schedule);
    mobile.addEventListener('change', mode);
    reduced.addEventListener('change', mode);
    if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(track);
    if (document.fonts) document.fonts.ready.then(schedule);
    mode();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initTimeline);
  else initTimeline();
})();
