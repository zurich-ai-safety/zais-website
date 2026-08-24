/* Zurich AI Safety — minimal progressive enhancement */

(function () {
  "use strict";

  /* ---- Header background once the hero has scrolled past ---------------- */

  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---- Mobile navigation ------------------------------------------------ */

  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("primary-nav");
  if (!toggle || !nav) return;

  var mq = window.matchMedia("(max-width: 900px)");

  function setOpen(open) {
    toggle.setAttribute("aria-expanded", String(open));
    nav.hidden = !open;
    toggle.querySelector(".nav-toggle__label").textContent = open ? "Close" : "Menu";
  }

  /* Small screens start closed; wide screens always show the nav. */
  function sync() {
    if (mq.matches) {
      setOpen(false);
    } else {
      nav.hidden = false;
      toggle.setAttribute("aria-expanded", "false");
    }
  }

  sync();
  mq.addEventListener("change", sync);

  toggle.addEventListener("click", function () {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  nav.addEventListener("click", function (e) {
    if (mq.matches && e.target.closest("a")) setOpen(false);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && mq.matches && toggle.getAttribute("aria-expanded") === "true") {
      setOpen(false);
      toggle.focus();
    }
  });
})();
