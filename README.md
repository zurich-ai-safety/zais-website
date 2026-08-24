# zurich.aisafety.ch

Rebuild of the Zurich AI Safety website, moving off Squarespace. Plain HTML, CSS and a few
lines of JavaScript — no build step, no dependencies, no framework.

**Status:** design prototype. Content is a verbatim port of the live Squarespace site; the
design is new. **Not live yet — the Squarespace site at zurich.aisafety.ch is untouched.**

---

## Running it locally

You need a local web server. Asset paths are root-relative (`/assets/...`), so opening a file
directly with `file://` resolves them against your drive root and **nothing will load** — no
CSS, no images. This is the single most common thing to get stuck on.

Any static server works. From the repo root:

```bash
python -m http.server 4321
```

Then open <http://localhost:4321>. Leave that terminal open — closing it stops the server.

No Python? Any of these do the same job:

```bash
npx serve -l 4321
```

```bash
php -S localhost:4321
```

If you use Claude Code or a similar agent, `.claude/launch.json` is committed, so the agent can
start the server itself rather than shelling out.

### After editing CSS, hard-refresh

Browsers cache `site.css` aggressively and you will chase phantom bugs otherwise.
**Ctrl+Shift+R** (Windows/Linux) or **Cmd+Shift+R** (Mac).

---

## Layout

```
index.html              Home
events/index.html       /events
ai-futures/index.html   /ai-futures
agisf/index.html        /agisf
discussion-group/       /discussion-group
ml-bootcamp/            /ml-bootcamp

assets/css/site.css     The whole design system — tokens first, then components
assets/js/site.js       Sticky-header state + mobile nav toggle. That is all it does.
assets/img/             Hero illustration, 8 paper thumbnails, favicon

docs/original-site-inventory.md   What the Squarespace site contained, captured 2026-08-24
docs/brand-system.md              Brand guidelines as implemented, incl. extracted gradients
```

Pages live in directories so the URLs stay clean (`/events/`, not `/events.html`) on any host.

---

## The design system

Everything lives in CSS custom properties at the top of `assets/css/site.css`. Colour and type
come from the ZAIS Brand Guidelines (2026) — see [docs/brand-system.md](docs/brand-system.md)
for the full mapping, including the gradient stops extracted from the PDF artwork.

**Type:** Inter only, per Fonts p.2. Hierarchy is weight, not family — Light 300 for display,
Regular 400 for body, Semi Bold 600 for UI, Bold 700 for emphasis.

**Colour:** warm sand `#F1EFE8` pages and white cards, deep navy `#010D2C` bands, brand red
`#DE2C00` as the accent on every surface.

**Gradients:** `--grad-main` (`#2F80B1 → #102E60 → #DE2C00 → #FF5C33 → #CFC5B4`) appears as a
3px hairline at every light/dark seam, in the header mark, and in the favicon. Dark bands carry
an "aurora" — five soft radial blobs on `mix-blend-mode: hard-light`, drifting on 34–64s loops,
all disabled under `prefers-reduced-motion`.

**Page rhythm:** a stack of full-bleed bands, one idea each, alternating tone. Every page opens
on a dark hero so the header can sit transparent over it and gain a blurred navy background on
scroll.

There is no dark mode. The guidelines define one palette, and the light/dark band rhythm
already carries the visual variety.

---

## Contributing

### The rules that matter

**1. Don't add a build step.** No npm, no bundler, no framework. Anyone on the team should be
able to open a file, edit it, and refresh. If you think a build step is genuinely needed,
raise it before writing code — it changes who can maintain this.

**2. The header and footer are duplicated across all six pages.** That is the price of no
build step. Change the nav in one file, change it in all six. Grep to be sure:

```bash
grep -rn "ML bootcamp" --include=*.html .
```

**3. Never hardcode a colour, size or font.** Use the tokens. If you find yourself typing a
hex code outside the token blocks at the top of `site.css`, stop — either a token exists or
the design needs a new one.

**4. Light and dark surfaces share one set of component rules.** Dark bands (`.band--deep`,
`.hero`, `.page-hero`, `.site-footer`) re-declare the semantic tokens — `--ink`, `--surface`,
`--accent`, `--rule` — and every component picks the change up automatically.

Do **not** write `.band--deep .my-thing { color: ... }` overrides. If you add a component that
must stay light inside a dark band, re-declare the light tokens on the component itself, the
way `.paper` does.

**5. Content is a verbatim port.** Every sentence matches the old Squarespace site on purpose,
so the two can be compared without confounds. Don't quietly reword. Content fixes are a
separate pass — known stale copy is marked `TODO (content pass)`.

**6. Accessibility bar.** One `<h1>` per page. Alt text on every image. A `<label>` for every
input. WCAG AA contrast, with one documented exception (below). Any animation must be inside a
`prefers-reduced-motion` guard.

**7. Root-relative asset paths** (`/assets/...`), never relative (`../assets/...`).

### The one accessibility exception

Small text set in brand red `#DE2C00` measures **4.08–4.09:1** on the navy and sand
backgrounds — just under the 4.5:1 AA threshold. It passes at 4.70:1 on white. This affects
eyebrows, section numbers and inline links, and it is a deliberate brand decision, not an
oversight. It is the only exception on the site.

If strict AA becomes a requirement, swap `--accent` to `#A81900` on light and `#FF5C33` on
dark — both documented brand shades, a two-line change. See
[docs/brand-system.md](docs/brand-system.md).

### Checking your change

Serve the site, open the console, and paste this. It audits every page for contrast failures
and horizontal overflow, and it is the same check used while building:

```js
(async () => {
  const pages = ['/','/events/','/ai-futures/','/agisf/','/discussion-group/','/ml-bootcamp/'];
  const lum = c => { const m=c.match(/[\d.]+/g).map(Number); const [r,g,b]=m.slice(0,3)
    .map(v=>{v/=255; return v<=.03928? v/12.92 : ((v+.055)/1.055)**2.4;}); return .2126*r+.7152*g+.0722*b; };
  const ratio = (a,b) => { const [x,y]=[lum(a),lum(b)].sort((m,n)=>n-m); return +((x+.05)/(y+.05)).toFixed(2); };
  const f = document.createElement('iframe');
  f.style.cssText='position:fixed;inset:0;width:1400px;height:900px;opacity:0;pointer-events:none;z-index:-9';
  document.body.appendChild(f);
  for (const p of pages) {
    await new Promise(r => { f.onload = r; f.src = p + '?v=' + Date.now(); });
    const d = f.contentDocument, w = f.contentWindow;
    await d.fonts.ready; await new Promise(r=>setTimeout(r,200));
    const bg = el => { let e=el; while (e && e!==d.documentElement) {
      if (e.matches('.paper')) return 'rgb(255,255,255)';
      if (e.matches('.hero,.page-hero,.band--deep,.site-footer,.site-header')) return 'rgb(1,13,44)';
      const b=w.getComputedStyle(e).backgroundColor;
      if (b && !/rgba\(0, 0, 0, 0\)/.test(b) && !/rgba\([^)]+,\s*0?\.\d+\)/.test(b)) return b;
      e=e.parentElement; } return 'rgb(241,239,232)'; };
    const bad = [];
    d.querySelectorAll('p,a,li,h1,h2,h3,h4,span,label,summary,button').forEach(e => {
      if (!e.textContent.trim() || e.closest('.aurora') || e.classList.contains('skip-link')) return;
      if (e.children.length && ![...e.childNodes].some(n=>n.nodeType===3 && n.textContent.trim())) return;
      const cs = w.getComputedStyle(e);
      if (cs.display==='none' || cs.visibility==='hidden') return;
      const px = parseFloat(cs.fontSize), wt = +cs.fontWeight;
      const need = (px>=24 || (px>=18.66 && wt>=700)) ? 3 : 4.5;
      const b = e.closest('.btn') && !/rgba\(0, 0, 0, 0\)/.test(w.getComputedStyle(e.closest('.btn')).backgroundColor)
              ? w.getComputedStyle(e.closest('.btn')).backgroundColor : bg(e);
      const r = ratio(cs.color, b);
      if (r < need) bad.push(`${r}<${need} ${cs.color} "${e.textContent.trim().slice(0,28)}"`);
    });
    const over = [...d.querySelectorAll('body *')].filter(e => {
      const r=e.getBoundingClientRect(), cs=w.getComputedStyle(e);
      return r.width>0 && r.right>d.documentElement.clientWidth+1
             && cs.position!=='absolute' && cs.position!=='fixed'; }).length;
    console.log(p, '| overflow:', over, '| contrast issues:', [...new Set(bad)]);
  }
  f.remove();
})();
```

Expected result: `overflow: 0` on every page, and the only contrast issues reported are
`rgb(222, 44, 0)` at 4.08/4.09 — the documented brand-red exception. **Anything else is a
regression you introduced.**

Also check by hand: 375px wide (mobile nav opens and closes), and that the accordions still
work with the keyboard.

---

## Notes for coding agents

- Read [docs/brand-system.md](docs/brand-system.md) before touching colour or type. The
  gradient values there were extracted from the source PDFs and are not guessable.
- Read [docs/original-site-inventory.md](docs/original-site-inventory.md) before touching
  copy. It records what the Squarespace original said, which is the spec.
- Rules 1–7 above are not stylistic preferences. Rule 4 in particular is load-bearing: adding
  `.band--deep .foo` overrides will break cards that sit inside dark bands.
- There is no test suite. The console snippet above is the regression check — run it and paste
  the result rather than asserting the change is fine.
- The site must work with JavaScript disabled apart from the mobile nav. Accordions are native
  `<details>`; keep them that way.

---

## Before this can go live

1. **The four contact forms do not submit anywhere.** They are marked `action="#"` with a
   `TODO` comment. Squarespace was handling these; we need Formspree, Netlify Forms, a Google
   Form, or a `mailto:` fallback.
2. **Check the hero illustration's licence.** It is a stock editorial collage carried over
   from the Squarespace site.
3. **Stale content**, ported verbatim and marked with `TODO (content pass)` comments:
   `/ml-bootcamp` still says "not offered in Fall 2025" and "spring semester of 2025";
   `/ai-futures` promises a six-part series but lists five sessions.
4. **Dropped from the old site:** `/shop` and `/cart` (orphaned 2022 conference tickets in
   GBP, not linked from anywhere), and an empty Squarespace calendar widget on `/agisf`.
5. **Set up redirects** from the old Squarespace paths. They already match (`/events`,
   `/agisf`, …), but confirm on the host before cutover.
