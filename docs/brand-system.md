# Brand system as implemented

Source: `Zais-BrandGuidelines-Colors.pdf` and `Zais-BrandGuidelines-Fonts.pdf` (2026).
Everything below is in `assets/css/site.css` as custom properties.

The gradient stops were extracted from the PDF's vector shading dictionaries, not eyeballed —
they are the exact values in the artwork.

---

## Type

Fonts p.2 only, so **Inter is the only typeface**. Hierarchy comes from weight and size, not
from mixing families.

| Role | Weight | Where |
|---|---|---|
| Display — h1, section headings | **300 Light** | `.display`, `.split__aside h2`, `.lede`, `.subhead` |
| Body | 400 Regular | paragraphs, list copy |
| UI — nav, buttons, labels, card titles, eyebrows | **600 Semi Bold** | `.eyebrow`, `.btn`, `.nav a`, `.paper__title` |
| Emphasis | **700 Bold** | `.callout__label` |

The guidelines showcase Light / Semi Bold / Bold. Regular 400 is added for body copy — Light
at 16–17px is too thin to hold up as running text. Flag it if you'd rather run body at 300.

Geist (Fonts p.1) and JetBrains Mono (p.3) are not used, per your instruction to work from
p.2 only. JetBrains Mono would be the obvious pick if you later want mono treatment on dates,
author lines and paper metadata.

## Primary palette — Colors p.1

| Hex | Token | Role on the site |
|---|---|---|
| `#DE2C00` | `--red-700` | Accent on every surface. Buttons, eyebrows, links, gradient midpoint. |
| `#C3CBD6` | `--blue-300` | Muted text on dark bands. |
| `#E3DFD5` | `--warm-200` | Image placeholder backgrounds. |
| `#FFFFFF` | `--brand-white` | Card and light-band surfaces. |
| `#102E60` | `--blue-700` | Gradient stop; brand mark. |

## Shade ramps — Colors p.2

```
red    #A81900  #DE2C00  #FF5C33  #FF7C5C  #FFC8BA
warm   #857C6D  #B2A894  #CFC5B4  #E3DFD5  #F1EFE8   #FFFFFF
blue   #010D2C  #102E60  #2F80B1  #C3CBD6  #DDE4E8
```

> The last blue swatch is labelled `#857C6D` in the PDF but its RGB reads 221/228/232. That is
> a copy-paste slip in the document — the RGB value (`#DDE4E8`) fits the ramp, so that is what
> is implemented. Worth fixing in the source file.

## Gradients — Colors p.4

Stops at 0 / 20 / 45 / 65 / 100, exactly as the page annotates.

| Token | Stops |
|---|---|
| `--grad-main` | `#2F80B1` → `#102E60` → `#DE2C00` → `#FF5C33` → `#CFC5B4` |
| `--grad-red` | `#A81900` → `#DE2C00` → `#FF5C33` → `#FF7C5C` → `#FFC8BA` |
| `--grad-blue` | `#010D2C` → `#102E60` → `#2F80B1` → `#C3CBD6` → `#DDE4E8` |
| `--grad-warm` | `#857C6D` → `#B2A894` → `#CFC5B4` → `#E3DFD5` → `#F1EFE8` |

`--grad-main` appears as a 3px hairline wherever a dark band meets a light one, in the header
brand mark, and in the favicon. It is the only place the whole palette shows at once, which is
what keeps it feeling like a signature rather than decoration.

`--grad-red` draws the bullet marks in `.bullets`.

## How light and dark surfaces work

One set of component rules serves both. Dark bands re-declare the semantic tokens; `.paper`
re-declares them back to light so cards keep working inside a dark band.

| Token | Light surface | Dark band |
|---|---|---|
| `--bg` | `#F1EFE8` | `#010D2C` |
| `--surface` | `#FFFFFF` | `rgb(195 203 214 / .07)` |
| `--ink` | `#010D2C` | `#F1EFE8` |
| `--ink-muted` | `#414D68` | `#C3CBD6` |
| `--ink-faint` | `#55617C` | `#94A1BA` |
| `--accent` | `#DE2C00` | `#DE2C00` |
| `--rule` | `#D9D4C7` | `rgb(195 203 214 / .2)` |

### The accent and contrast

Brand red `#DE2C00` is the accent on every surface. It measures:

| Background | Ratio | AA small text (4.5:1) |
|---|---|---|
| White `#FFFFFF` — cards, white bands | **4.70** | passes |
| Sand `#F1EFE8` — light bands | **4.09** | just under |
| Navy `#010D2C` — dark bands | **4.08** | just under |

This is the **only** contrast exception anywhere on the site — every other text/background pair
passes AA. It affects small red text: eyebrows, section numbers, `.acc__num`, `.topic__num`,
inline links in body copy, and the required-field asterisks. It is an accepted brand decision,
not an oversight.

Earlier drafts avoided it by using `#A81900` on light and `#FF5C33` on dark, but `#FF5C33`
reads orange rather than the brand red. If strict AA becomes a requirement, those two shades
are the swap — both are documented on Colors p.2, and it is a two-line change in the token
blocks.

## The aurora

The gradient field on dark bands, adapted from genevaaisummit.swiss: a navy base with five
soft radial blobs on `mix-blend-mode: hard-light`, drifting on 34–64s loops. Colours are drawn
from the brand ramps — `#2F80B1`, `#102E60`, `#DE2C00`, `#FF5C33`, `#CFC5B4`.

A fixed scrim over the top holds text contrast steady wherever the blobs happen to drift, so
the band measures the same whether a blob is behind the headline or not. All motion is disabled
under `prefers-reduced-motion`.

## Page rhythm

Adapted from antler.co: the page is a stack of full-bleed bands, one idea each, alternating
tone.

```
hero (deep + aurora) → white → sand → white → deep (+ aurora) → footer (deep)
```

Every page opens on a dark hero, so the header can stay transparent over it and gain a blurred
navy background on scroll. A dark band running straight into the dark footer drops the gradient
hairline between them so the two read as one closing block.
