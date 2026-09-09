# Design system as built

The site is a conversion of the Claude Design canvas export in
`temporary/ZAIS - Website`. **The artboards are the source of truth** — the values below were
read back out of the generated pages, not copied from a spec.

> Two documents in the export disagree with the artboards. `readme.md` describes an earlier
> iteration (concrete grey `#CACACA`, orange `#F24C27`, Geist-only, two weights) and
> `tokens/colors.css` a second one (cream `#F6F2E2`, accent `#DE2C00`). Neither matches what
> the pages actually render. `tokens/borders.css` also references six variables that no
> longer exist (`--zais-orange`, `--zais-bone`, `--zais-concrete-50`, `--zais-concrete-25`,
> `--zais-bone-18`, `--zais-concrete-18`), so those rules would resolve to nothing.
> **Worth reconciling in Claude Design before anyone builds against the token files.**

---

## Palette as rendered

| Hex | Uses | Role |
|---|---|---|
| `#020522` | 245 | Ink — body copy, headings, rules |
| `#FFFFFF` | 228 | White sections, text on accent |
| `#CC3E1F` | 223 | The single accent — eyebrows, links, buttons, tags |
| `#F7F3E7` | 73 | Page background, cream cards |
| `#F1EBDA` | 42 | Dropdown hover, deeper cream |
| `#C7C0B6` | 20 | Hero base under the shader |
| `#E8492A` | 20 | Hero gradient hot stop |
| `#28282E` | 10 | Footer |
| `#0F0B33` | 1 | "Why Zurich" dark band |
| `#FBF8EF` | 1 | "Upcoming" band |

Supporting hero-gradient stops: `#D8D2C8`, `#DB4E2C`, `#C9AC99`, `#D1CBC1`, `#F2A48F`.
Panel and avatar fills: `#FAF9F5`, `#EAE2CE`.

## Type

Three families, all from Google Fonts:

| Family | Weights | Used for |
|---|---|---|
| **Geist** | 300, 400, 500, 600 | Display headings, stat numerals, the wordmark |
| **Inter** | 400, 500, 600 | Body copy, nav, buttons, card titles |
| **JetBrains Mono** | 400, 500 | Eyebrows, dates, tags, counters, footer column heads |

34 distinct font sizes appear across the pages — the artboards size each element directly
rather than working from a scale.

## Signatures

- **1.5px dashed outlines** on buttons, icon badges, footer social pills and the stat strip.
- **Pill buttons** (`border-radius: 100px`); everything else is square.
- **No shadows** except the nav dropdown panel.
- Container is `max-width: 80rem` with `clamp(1.25rem, 4vw, 2.5rem)` gutters, on every section.
- Section rhythm is `clamp(64px, 8vw, 104px)` top and bottom.

## The hero shader

`assets/js/hero-shader.js` is a WebGL mesh gradient — eight colour blobs drifting in place.
It is a direct port of the export's `shader-hero.jsx`: the GLSL and the uniform table are
copied verbatim and only the React wrapper was replaced, so the render is identical.

It degrades safely. The hero section paints its own CSS radial-gradient stack underneath, so
if WebGL is unavailable the canvas is hidden and the static gradient shows through. Motion
stops under `prefers-reduced-motion`, when the tab is hidden, and when the hero scrolls out
of view.

Verified: both shaders compile clean, the program links, no GL errors, and a forced frame
samples `#0c0524` navy top-left → `#ff2600` orange centre → `#fdf9e9` cream bottom-right.

## How the conversion works

`.dc.html` artboards carry Design-Canvas-specific markup. The conversion rewrites only that,
and leaves every inline style untouched — verified: all 2,689 style attributes across the ten
pages are byte-identical to the artboards apart from asset paths.

| Canvas construct | Becomes |
|---|---|
| `<x-dc>`, `<helmet>`, `<script type="text/x-dc">` | stripped |
| `style-hover="…"` | a `[data-hv="hvN"]:hover` rule in `assets/css/hover.css` |
| `<sc-if value hint-placeholder-val>` | resolved against the default |
| `onMouseEnter` / `onClick` | `data-menu` / `data-action`, handled in `site.js` |
| `<x-import ShaderBackground>` | `<canvas class="hero-shader">` |
| `ZAIS%20Foo.dc.html` | the real route |

The hover rules need `!important` because the artboards use inline styles, which would
otherwise beat any class-based rule.

Two behaviours were reimplemented rather than ported:

- **Nav dropdowns** are now pure CSS (`:hover`, `:focus-within`) instead of component state.
  This makes them keyboard-reachable, which the canvas version was not.
- **The two carousels** (homepage "Voices", About timeline) are reimplemented in
  `assets/js/site.js`, matching the original state logic — 1/2/3 slides per view by width for
  Voices, six clamped steps for the timeline.

## Regenerating

The converter lives outside the repo, in the session scratchpad. The generated pages are
committed and are what the site serves — editing them directly is fine and expected. If the
canvas export is updated and you want a fresh conversion, ask for the converter to be re-run
rather than hand-merging.
