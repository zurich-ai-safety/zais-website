/* Splits [data-text-roll] text into two stacked layers of per-letter spans and
   sets each letter's transition-delay, staggered outwards from the centre of
   the word. The animation itself lives in assets/css/text-roll.css.
   Progressive enhancement: without this file the plain word still renders. */
(function () {
  "use strict";

  var STAGGER = 0.035;   // seconds between neighbouring letters
  var NBSP = " ";   // an inline-block plain space would collapse

  function layer(text, cls) {
    var wrap = document.createElement("span");
    wrap.className = "tr-layer " + cls;
    var n = text.length;
    for (var i = 0; i < n; i++) {
      var ch = document.createElement("span");
      ch.textContent = text[i] === " " ? NBSP : text[i];
      // centre stagger: letters at the middle move first
      ch.style.setProperty("--d", (STAGGER * Math.abs(i - (n - 1) / 2)).toFixed(3) + "s");
      wrap.appendChild(ch);
    }
    return wrap;
  }

  function init(el) {
    var text = (el.textContent || "").trim();
    if (!text) return;
    el.setAttribute("aria-label", text);
    el.textContent = "";
    var top = layer(text, "tr-layer--top");
    var bot = layer(text, "tr-layer--bot");
    top.setAttribute("aria-hidden", "true");
    bot.setAttribute("aria-hidden", "true");
    el.appendChild(top);
    el.appendChild(bot);
  }

  function boot() {
    Array.prototype.forEach.call(
      document.querySelectorAll("[data-text-roll]"), init);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
