/* ZAIS hero background - weight field, continuously updating.
 *
 * A grid of small signed decimals, the kind a trained network is made of. Every
 * value is always moving: each cell eases toward a target, and on arrival picks
 * a new one, so nothing sits frozen. Cells move at different rates, so the
 * field never updates in step.
 *
 * Visibility is driven by the value itself: a weight near zero is almost
 * invisible, and brightness rises with magnitude. So the field thins and
 * thickens on its own as values drift, and what you see standing out are the
 * weights that actually carry signal - which is what makes a trained network
 * do anything.
 *
 * Cells are wider than they are tall, because a weight is about five characters
 * and a square grid would crush them. The left and right halves are mirrored.
 * The result reads as a tensor mid-training rather than as falling code.
 *
 * Settings come from data attributes on the canvas:
 *   data-cell     row height in px             (default 24)
 *   data-colw     column width in px           (default cell * 2.7)
 *   data-colour   value colour                 (default rgba(255,255,255,0.8))
 *   data-fps      repaints per second          (default 16)
 *   data-rate     how fast values drift, 0-1   (default 1)
 *   data-span     magnitude that reaches full  (default 1.5)
 *   data-floor    visibility at zero, 0-1      (default 0.06)
 *   data-gamma    curve on the fade            (default 0.75)
 *   data-radius   lit radius under the cursor  (default 240)
 *   data-glow     lit colour, RGB triplet      (default 255,255,255)
 *   data-intensity lit brightness, 0-1         (default 1)
 *   data-spotlight "off" disables the cursor light entirely (default "on")
 *
 * Repaints are throttled: numbers changing 60 times a second are unreadable
 * flicker, and redrawing several hundred cells that often is wasted work.
 */
(function () {
  "use strict";

  /* Every matching canvas gets its own independent field, so a page can carry
     more than one of these without them sharing state. */
  var nodes = document.querySelectorAll("canvas.hero-binary");
  if (!nodes.length) return;
  Array.prototype.forEach.call(nodes, init);

  function init(canvas) {
  if (!canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  function attr(name, fallback) {
    var v = canvas.getAttribute("data-" + name);
    return v === null || v === "" ? fallback : v;
  }

  var CELL = Math.max(12, parseInt(attr("cell", "24"), 10) || 24);
  var COLW = Math.max(28, parseInt(attr("colw", "0"), 10) || Math.round(CELL * 2.7));
  var COLOUR = attr("colour", "rgba(255,255,255,0.8)");
  var FPS = Math.max(4, parseFloat(attr("fps", "16")));
  var RATE = parseFloat(attr("rate", "1"));
  var SPAN = parseFloat(attr("span", "1.5"));
  var FLOOR = parseFloat(attr("floor", "0.06"));
  var GAMMA = parseFloat(attr("gamma", "0.75"));
  var RADIUS = Math.max(60, parseInt(attr("radius", "240"), 10) || 240);
  var GLOW = attr("glow", "255,255,255");
  var INTENSITY = parseFloat(attr("intensity", "1"));

  var section = canvas.closest("section") || canvas.parentElement;
  var reduce = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;

  var width = 0, height = 0, cols = 0, rows = 0;
  var cells = [];
  var frame = null, running = false, last = 0, lastPaint = 0;
  var pointer = null, aim = null;

  var fine = window.matchMedia
    ? window.matchMedia("(hover: hover) and (pointer: fine)")
    : null;

  /* ---- The value model -------------------------------------------------
   *
   * Weights in a trained layer are roughly normal around zero with heavy
   * tails: a dense mass of small values, a thin scatter of large ones, and a
   * good number that are effectively dead. And they do not jump about - each
   * one drifts under gradient steps, so between frames the last decimal moves
   * and a sign change is an event, not a coincidence.
   *
   * So each cell is an Ornstein-Uhlenbeck walk: a small random step every
   * tick plus a gentle pull back toward zero. That keeps the field's spread
   * stable over time while every individual number moves continuously.
   */

  var SD = 0.28;      /* stationary spread of the field */
  var THETA = 0.010;  /* pull back toward zero, per tick */
  var SIGMA = SD * Math.sqrt(2 * THETA - THETA * THETA);
  var KICK = 0.004;   /* chance per tick of a larger step */
  var DEAD = 0.08;    /* share of cells that stay near zero */

  /* Standard normal, Box-Muller. */
  function gauss() {
    var u = 1 - Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random());
  }

  function makeCell() {
    /* Per-cell scale spreads the magnitudes out, and pace stops the field
     * moving in unison. A slice of cells are sparse ones that sit at 0.00. */
    var dead = Math.random() < DEAD;
    var scale = dead ? 0.10 : 0.55 + Math.random() * 0.9;
    return {
      v: gauss() * SD * scale,
      scale: scale,
      pace: (0.6 + Math.random() * 1.1) * RATE,
    };
  }

  function advance(c) {
    var th = THETA * c.pace;
    var sg = SIGMA * c.scale * Math.sqrt(c.pace);
    c.v += -th * c.v + sg * gauss();
    if (Math.random() < KICK) c.v += gauss() * 0.14 * c.scale;
    if (c.v > SPAN) c.v = SPAN;
    else if (c.v < -SPAN) c.v = -SPAN;
  }

  /* Visibility from magnitude. The curve matters: without it most of the field
   * sits in the flat part of the range and the whole thing reads as uniform
   * haze, because most weights are small. */
  function visibility(v) {
    var n = Math.abs(v) / SPAN;
    if (n > 1) n = 1;
    return FLOOR + (1 - FLOOR) * Math.pow(n, GAMMA);
  }

  function build() {
    /* Columns cover the left half only; the right half is their mirror. */
    cols = Math.ceil(width / 2 / COLW) + 1;
    rows = Math.ceil(height / CELL) + 1;
    cells = new Array(cols * rows);
    for (var i = 0; i < cells.length; i++) cells[i] = makeCell();
  }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
    paint();
  }

  function step() {
    for (var i = 0; i < cells.length; i++) advance(cells[i]);
  }

  function format(v) {
    var s = Math.abs(v).toFixed(2);
    return (v < 0 ? "-" : " ") + s;
  }

  function paint() {
    ctx.clearRect(0, 0, width, height);
    ctx.font =
      Math.round(CELL * 0.58) +
      "px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    var baseFont = ctx.font;
    var px = pointer ? pointer.x : 0;
    var py = pointer ? pointer.y : 0;

    /* Halo first, beneath the values. */
    if (pointer) {
      var halo = ctx.createRadialGradient(px, py, 0, px, py, RADIUS);
      halo.addColorStop(0, "rgba(" + GLOW + ",0.20)");
      halo.addColorStop(0.4, "rgba(" + GLOW + ",0.08)");
      halo.addColorStop(1, "rgba(" + GLOW + ",0)");
      ctx.fillStyle = halo;
      ctx.fillRect(px - RADIUS, py - RADIUS, RADIUS * 2, RADIUS * 2);
    }

    /* One draw per on-screen position, so a mirrored twin lights independently
     * of its partner - the cursor is not mirrored, only the pattern is. */
    function draw(x, y, cell, text) {
      if (x < -COLW || x > width + COLW) return;
      var lit = 0;
      if (pointer) {
        var dx = x - px, dy = y - py;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < RADIUS) lit = (1 - dist / RADIUS) * INTENSITY;
      }
      if (lit > 0.015) {
        ctx.font =
          Math.round(CELL * 0.58 * (1 + lit * 0.22)) +
          "px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
        ctx.fillStyle = "rgba(" + GLOW + "," + Math.min(1, 0.35 + lit) + ")";
        ctx.shadowColor = "rgba(" + GLOW + "," + lit + ")";
        ctx.shadowBlur = lit * 16;
        ctx.globalAlpha = Math.min(1, visibility(cell.v) + lit);
      } else {
        ctx.font = baseFont;
        ctx.fillStyle = COLOUR;
        ctx.shadowBlur = 0;
        ctx.globalAlpha = visibility(cell.v);
      }
      ctx.fillText(text, x, y);
    }

    for (var c = 0; c < cols; c++) {
      for (var r = 0; r < rows; r++) {
        var cell = cells[c * rows + r];
        if (!cell) continue;
        var y = r * CELL + CELL / 2;
        var left = c * COLW + COLW / 2;
        /* Columns past the midpoint belong to the mirrored half, so drawing
         * them would double up on their own twin. */
        if (left > width / 2) continue;
        var right = width - left;
        var text = format(cell.v);
        /* Mirrored pair: one column in from the left, its twin in from the
         * right. The mirror is the whole point of the pattern. Near the centre
         * the two converge, so the twin is dropped once it would collide. */
        draw(left, y, cell, text);
        if (right - left >= COLW) draw(right, y, cell, text);
      }
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  function tick(now) {
    frame = window.requestAnimationFrame(tick);

    /* Ease toward the cursor so the lit patch trails rather than snapping. */
    if (aim) {
      if (!pointer) pointer = { x: aim.x, y: aim.y };
      pointer.x += (aim.x - pointer.x) * 0.18;
      pointer.y += (aim.y - pointer.y) * 0.18;
    }

    var stepDue = now - last >= 1000 / FPS;
    if (stepDue) { last = now; step(); }

    /* Values update at the throttled rate, but while the cursor is over the
     * section the lighting needs to keep up with it, so repaint faster. */
    var paintRate = pointer ? 30 : FPS;
    if (stepDue || now - lastPaint >= 1000 / paintRate) {
      lastPaint = now;
      paint();
    }
  }

  function motionAllowed() { return !reduce || !reduce.matches; }

  function start() {
    if (running || !motionAllowed()) return;
    running = true;
    last = 0;
    frame = window.requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    if (frame) window.cancelAnimationFrame(frame);
    frame = null;
  }

  var SPOTLIGHT = attr("spotlight", "on") !== "off";

  if (SPOTLIGHT && section && (!fine || fine.matches)) {
    section.addEventListener("pointermove", function (event) {
      if (event.pointerType && event.pointerType !== "mouse") return;
      if (!motionAllowed()) return;
      var rect = canvas.getBoundingClientRect();
      aim = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    });
    section.addEventListener("pointerleave", function () {
      aim = null;
      pointer = null;
      paint();
    });
  }

  var resizeTimer = null;
  window.addEventListener("resize", function () {
    if (resizeTimer) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resize, 120);
  });

  if (reduce) {
    var onChange = function () {
      stop();
      if (motionAllowed()) start();
      else paint();
    };
    if (reduce.addEventListener) reduce.addEventListener("change", onChange);
    else if (reduce.addListener) reduce.addListener(onChange);
  }

  if ("IntersectionObserver" in window && section) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) start();
        else stop();
      });
    }).observe(section);
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop();
    else start();
  });

  resize();
  start();
  }
})();
