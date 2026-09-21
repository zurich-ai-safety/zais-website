# zurich.aisafety.ch

Rebuild of the Zurich AI Safety website, moving off Squarespace. Plain HTML, CSS and a little
JavaScript — no build step, no dependencies, no framework.

**Status:** design prototype. **Not live — the Squarespace site at zurich.aisafety.ch is
untouched.**

The pages are a conversion of the Claude Design canvas export in `temporary/ZAIS - Website`.
Content and layout come from the artboards verbatim; see
[docs/brand-system.md](docs/brand-system.md) for exactly what the conversion changed.
Approved interaction and consistency refinements are documented in
[docs/baseline-behavior.md](docs/baseline-behavior.md).

---

## Running it locally

You need a local web server. Asset paths are root-relative (`/assets/...`), so opening a file
directly with `file://` resolves them against your drive root and **nothing will load** — no
CSS, no images. This is the single most common thing to get stuck on.

From the repo root:

```bash
python -m http.server 4321
```

Then open <http://localhost:4321>. Leave that terminal open — closing it stops the server.

No Python? Either of these does the same job:

```bash
npx serve -l 4321
```

```bash
php -S localhost:4321
```

If you use Claude Code or a similar agent, `.claude/launch.json` is committed, so the agent can
start the server itself.

### After editing CSS, hard-refresh

Browsers cache `site.css` aggressively and you will chase phantom bugs otherwise.
**Ctrl+Shift+R** (Windows/Linux) or **Cmd+Shift+R** (Mac).

---

## Pages

| Route | Artboard |
|---|---|
| `/` | ZAIS Home Page |
| `/about/` | ZAIS About |
| `/get-involved/` | ZAIS Get Involved |
| `/research/` | ZAIS Research |
| `/swiss-ai-safety-days/` | ZAIS Swiss AI Safety Days |
| `/events/` | ZAIS Luma Calendar |
| `/ai-safety-fundamentals/` | ZAIS AI Safety Fundamentals |
| `/ai-futures/` | ZAIS AI Futures Discussions |

```
assets/css/site.css     Base, disclosure, breakpoints, hero gradient, reduced motion
assets/css/hover.css    Generated from the artboards' style-hover attributes
assets/css/navigation.css, buttons.css, motion.css   Shared interaction styles
assets/css/people.css, publications.css, timeline.css   Page-specific refinements
assets/js/site.js       Community carousel, reveals, theme toggle and session tabs
assets/js/navigation.js Sticky header, dropdown keyboard access and mobile menu
assets/js/timeline.js   About timeline progress, controls and entrances
assets/img/             21 images copied out of the export
assets/img/gradient/    10 pre-rendered hero gradient frames (5 light + 5 dark), see docs/brand-system.md

docs/brand-system.md            The design system as built, and what the conversion changed
docs/original-site-inventory.md What the old Squarespace site contained (historical record)
temporary/ZAIS - Website/       The Claude Design export. Git-ignored; not served.
```

---

## Contributing

**1. The markup is machine-generated and keeps its inline styles.** That is deliberate — it is
what makes the pages pixel-identical to the artboards. Don't "tidy" the inline styles into
classes without agreeing it first; you will lose the guarantee that the site matches the
design.

**2. Don't add a build step.** No npm, no bundler, no framework.

**3. Header and footer are duplicated across all nine pages.** Change the nav in one, change it
in all nine. Search to be sure:

```bash
rg -l "Open Meetups" -g index.html
```

**4. Colour and type live in the markup, not in tokens.** The export ships a `tokens/` folder,
but its values disagree with the artboards — see the warning at the top of
[docs/brand-system.md](docs/brand-system.md). Take values from the rendered pages.

**5. Nav dropdowns use CSS** (`:hover` / `:focus-within`) with semantic button triggers.
`navigation.js` adds ArrowDown/Escape handling and expanded-state announcements;
it also manages the fullscreen mobile menu. Keep the expanded no-JS mobile fallback.

**6. Hover rules need `!important`.** Inline styles beat class rules, so `hover.css` cannot
work without it. Add new hover states there, in the same form.

**7. Any animation goes inside a `prefers-reduced-motion` guard.**

### Checking your change

Serve the site, open the console, and paste this. It checks every page for horizontal
overflow and broken links or images:

```js
(async () => {
  const pages = ['/','/about/','/get-involved/','/research/','/swiss-ai-safety-days/','/events/',
                 '/ai-safety-fundamentals/','/ai-futures/'];
  const f = document.createElement('iframe');
  f.style.cssText='position:fixed;inset:0;height:900px;opacity:0;pointer-events:none;z-index:-9;border:0';
  document.body.appendChild(f);
  const urls = new Set();
  for (const w of [1440, 768, 375]) {
    f.style.width = w + 'px';
    for (const p of pages) {
      await new Promise(r => { f.onload = r; f.src = p + '?v=' + Date.now(); });
      const d = f.contentDocument, win = f.contentWindow;
      await d.fonts.ready; await new Promise(r => setTimeout(r, 120));
      const sw = d.documentElement.scrollWidth, cw = d.documentElement.clientWidth;
      if (sw > cw + 1) console.warn(`OVERFLOW ${p} @${w}px  ${sw} > ${cw}`);
      if (w === 1440) {
        d.querySelectorAll('a[href^="/"]').forEach(a => urls.add(a.getAttribute('href')));
        d.querySelectorAll('img[src]').forEach(i => urls.add(i.getAttribute('src')));
        [...d.querySelectorAll('*')].forEach(e => {
          const m = win.getComputedStyle(e).backgroundImage.match(/url\("([^"]+)"\)/);
          if (m && !m[1].startsWith('data:')) urls.add(new URL(m[1]).pathname);
        });
      }
    }
  }
  f.remove();
  const bad = (await Promise.all([...urls].map(async u =>
    ({u, s: (await fetch(u, {cache:'no-store'})).status})))).filter(r => r.s !== 200);
  console.log(bad.length ? bad : `all ${urls.size} links and assets OK`);
})();
```

Expected: no `OVERFLOW` warnings, and `all N links and assets OK`.

---

## Notes for coding agents

- Read [docs/brand-system.md](docs/brand-system.md) first. It records which parts of the export
  contradict each other and which one wins.
- The artboards in `temporary/ZAIS - Website/*.dc.html` are the spec. If you change a page,
  you are diverging from the design — say so explicitly rather than doing it silently.
- There is no test suite. The console snippet above is the regression check — run it and paste
  the result rather than asserting the change is fine.
- The site works with JavaScript disabled apart from the two carousels and the hero animation.
  Keep it that way.

---

## Before this can go live

1. **Turn off the editorial notes.** The artboards carry `TO CONFIRM` / `TO WRITE` annotations
   addressed to the ZAIS team — 16 of them across eight pages. They are reproduced faithfully because
   they are part of the design, but they must not ship. Add `class="hide-editorial-notes"` to
   `<body>` on every page, or delete the `.editorial-note` blocks.
2. **The content is placeholder in places.** The notes themselves say so — dates for the next
   AISF intake and AI Futures series, and the three bracketed paragraphs of the ZAIS story on
   `/about/` (the ZAIS story and timeline milestones have since been replaced with real content).
3. **Two nav destinations don't exist.** "Open Meetups" and "Themed Events" appear in the
   Programmes dropdown and the footer on all ten pages, pointing at `#`. The footer LinkedIn
   link is also `#`.
4. ~~Images are 27.6 MB.~~ **Done** — compressed to 2.6 MB (90% smaller). Each image is
   resized to roughly twice its rendered size and re-encoded as progressive JPEG at q82. No
   image in the set used transparency, so the two PNGs became JPEGs. Full-resolution originals
   remain in the git-ignored export. One loose end: the four team portraits exist twice under
   different names (`Lukas_Fluri.jpg` and `team-lukas-fluri.jpg`, etc.) because the Home and
   About artboards reference different copies — about 220 KB of duplication, worth deduping if
   anyone touches those pages.
5. **Two Airtable forms are linked** from `/swiss-ai-safety-days/`. Confirm they are the
   intended live forms. Note there is no contact form anywhere else on the site — the old
   Squarespace pages had four, and the design replaces them with email and WhatsApp links.
6. **The Luma calendar is not embedded yet** — `/events/` carries a note saying to add the live
   widget at build time.
7. **Set up redirects** from the old Squarespace paths. `/events` and `/ai-futures` carry
   over unchanged; `/agisf` now lives at `/ai-safety-fundamentals/`. `/ml-bootcamp` and
   `/discussion-group` (old Paper Reading Group) have no destination anymore — both pages were
   removed from this rebuild on 2026-09-15. Needs a decision: redirect that old traffic
   somewhere relevant (e.g. `/ai-safety-fundamentals/` or the homepage) or let them 404.
