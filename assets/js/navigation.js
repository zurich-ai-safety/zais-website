/* Progressive enhancement: CSS keeps every destination available without JS. */
(function () {
  'use strict';
  var header = document.querySelector('.site-header');
  if (!header) return;
  var panel = header.querySelector('.navigation-panel');
  var toggle = header.querySelector('.menu-toggle');
  var close = header.querySelector('.menu-close');
  var brand = header.querySelector('.header-brand');
  var mobileControls = header.querySelector('.header-mobile-controls');
  var mobile = window.matchMedia('(max-width: 1060px)');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var opened = false;
  var closing = false;
  var closeTimer = 0;
  var closeRestoreFocus = true;
  var scrollY = 0;
  var savedBodyStyle = null;
  var inertElements = [];
  document.documentElement.classList.add('nav-enhanced');

  // Animate each menu row, including nested links, on every mobile opening.
  panel.querySelectorAll('.site-navigation > a, .nav-trigger, [data-dropdown] a, .header-actions > *').forEach(function (item, index) {
    item.setAttribute('data-menu-entrance', '');
    item.style.setProperty('--menu-item-delay', Math.min(index * 35, 280) + 'ms');
  });

  function pathFor(url) {
    return url.pathname.replace(/\/index\.html$/, '/').replace(/\/+$/, '') || '/';
  }
  function markCurrent() {
    var here = new URL(window.location.href);
    header.querySelectorAll('[data-nav-current], [aria-current]').forEach(function (el) {
      el.removeAttribute('data-nav-current');
      el.removeAttribute('aria-current');
    });
    header.querySelectorAll('.site-navigation a[href], .header-actions a[href]').forEach(function (link) {
      var url = new URL(link.href, here);
      if (url.origin !== here.origin || pathFor(url) !== pathFor(here) || (url.hash && url.hash !== here.hash)) return;
      link.setAttribute('aria-current', url.hash ? 'location' : 'page');
      if (link.closest('.site-navigation')) link.setAttribute('data-nav-current', '');
      var group = link.closest('[data-menu]');
      if (group) {
        var trigger = group.querySelector('.nav-trigger');
        trigger.setAttribute('data-nav-current', '');
        trigger.setAttribute('aria-current', 'true');
      }
    });
  }
  markCurrent();
  window.addEventListener('hashchange', markCurrent);


  function paintHeader() {
    if (!opened) header.classList.toggle('is-compact', window.scrollY > 24);
  }
  window.addEventListener('scroll', paintHeader, { passive: true });
  paintHeader();

  function cancelClose() {
    clearTimeout(closeTimer);
    closeTimer = 0;
    closing = false;
    panel.classList.remove('is-closing');
    panel.style.removeProperty('--menu-close-opacity');
    panel.style.removeProperty('--menu-close-transform');
  }
  function finishClose(restoreFocus) {
    if (!opened) return;
    cancelClose();
    opened = false;
    toggle.setAttribute('aria-expanded', 'false');
    panel.classList.remove('is-open');
    panel.removeAttribute('role');
    panel.removeAttribute('aria-modal');
    panel.removeAttribute('aria-label');
    inertElements.forEach(function (el) { el.inert = false; });
    inertElements = [];
    if (savedBodyStyle === null) document.body.removeAttribute('style');
    else document.body.setAttribute('style', savedBodyStyle);
    window.scrollTo({ top: scrollY, behavior: 'instant' });
    if (restoreFocus !== false) (mobile.matches ? toggle : brand).focus({ preventScroll: true });
    paintHeader();
  }
  function setMenu(open, restoreFocus, immediate) {
    if (open) {
      if (!mobile.matches) return;
      if (opened) {
        // A renewed open cancels the old completion without releasing the
        // scroll lock or moving focus back behind the dialog.
        if (closing) { cancelClose(); close.focus(); }
        return;
      }
      opened = true;
      toggle.setAttribute('aria-expanded', 'true');
      panel.classList.add('is-open');
      scrollY = window.scrollY;
      savedBodyStyle = document.body.getAttribute('style');
      document.body.style.position = 'fixed';
      document.body.style.top = -scrollY + 'px';
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-modal', 'true');
      panel.setAttribute('aria-label', 'Main menu');
      Array.from(document.body.children).concat([brand, mobileControls || toggle]).forEach(function (el) {
        if (el === header || ['SCRIPT', 'STYLE', 'LINK'].includes(el.tagName) || el.inert) return;
        el.inert = true;
        inertElements.push(el);
      });
      close.focus();
    } else {
      if (!opened) return;
      // Native navigation, layout changes and reduced motion never wait.
      if (immediate || !mobile.matches || reduced.matches || restoreFocus === false) {
        finishClose(restoreFocus);
        return;
      }
      if (closing) return;
      closing = true;
      closeRestoreFocus = restoreFocus;
      var current = getComputedStyle(panel);
      panel.style.setProperty('--menu-close-opacity', current.opacity);
      panel.style.setProperty('--menu-close-transform', current.transform);
      panel.classList.add('is-closing');
      // Keep dialog focus and background inert until it has visibly left.
      // The timeout also handles a cancelled/missing animationend event.
      closeTimer = setTimeout(function () { finishClose(closeRestoreFocus); }, 260);
    }
  }
  panel.addEventListener('animationend', function (event) {
    if (event.target === panel && event.animationName === 'menu-exit' && closing) finishClose(closeRestoreFocus);
  });
  reduced.addEventListener('change', function () {
    if (reduced.matches && closing) finishClose(closeRestoreFocus);
  });
  toggle.addEventListener('click', function () { setMenu(true); });
  close.addEventListener('click', function () { setMenu(false); });
  panel.addEventListener('click', function (event) {
    if (event.target.closest('a[href]') && opened) setMenu(false, false);
  });
  document.addEventListener('keydown', function (event) {
    if (!opened) return;
    if (event.key === 'Escape') { event.preventDefault(); setMenu(false); }
    if (event.key !== 'Tab') return;
    var focusable = Array.from(panel.querySelectorAll('a[href], button:not([disabled]), [tabindex="0"]')).filter(function (el) { return el.getClientRects().length; });
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  /* Hover/focus-within still controls desktop panels; JS reflects its state
     for assistive technology and adds Escape dismissal and arrow entry. */
  header.querySelectorAll('[data-menu]').forEach(function (menu) {
    var trigger = menu.querySelector('.nav-trigger');
    var dropdown = menu.querySelector('[data-dropdown]');
    function sync() {
      trigger.setAttribute('aria-expanded', String(mobile.matches || (!menu.hasAttribute('data-dismissed') && menu.matches(':hover, :focus-within'))));
    }
    ['mouseenter', 'focusin'].forEach(function (name) {
      menu.addEventListener(name, function () { menu.removeAttribute('data-dismissed'); sync(); });
    });
    menu.addEventListener('mouseleave', sync);
    menu.addEventListener('focusout', function () { requestAnimationFrame(sync); });
    trigger.addEventListener('click', function () { menu.removeAttribute('data-dismissed'); sync(); });
    menu.addEventListener('keydown', function (event) {
      if (opened) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        trigger.focus();
        menu.setAttribute('data-dismissed', '');
        sync();
      } else if (event.key === 'ArrowDown' && event.target === trigger) {
        event.preventDefault();
        menu.removeAttribute('data-dismissed');
        dropdown.querySelector('a').focus();
        sync();
      }
    });
    mobile.addEventListener('change', sync);
    sync();
  });
  mobile.addEventListener('change', function () { if (opened) setMenu(false, true, true); paintHeader(); });
})();
