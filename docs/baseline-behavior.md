# Shared design and interaction baseline

The September 2026 baseline preserves the existing page content, section layouts,
palette and dashed buttons. These approved refinements supersede the corresponding
original-artboard behavior in `brand-system.md`.

## Navigation

- Fixed header contracts to 65px, including the border, after 24px of scroll.
  Its compact background is the slightly lighter brand orange `#DF340A`.
- Current-page underlines do not affect text alignment. URL matching includes
  the origin, and nested pages mark their navigation group.
- Desktop dropdowns retain CSS hover/focus behavior. Button triggers support
  keyboard entry, ArrowDown and Escape, with reflected expanded state.
- At 1060px and below, the hamburger opens a cream fullscreen menu. Entrance is
  240ms and exit is 200ms. Focus stays inside and page scrolling stays locked
  through exit; closing restores focus and scroll position. Resizing to desktop
  cleans up the mobile state. Without JavaScript, navigation remains expanded.
  Menu rows, including subitems, fade and slide in with a short stagger on every
  opening; keyboard focus makes an item immediately visible.

## Motion and controls

- Hero heading, copy and CTA fade/slide in with 120ms stagger, overlapping the
  navigation's 35ms stagger. Other homepage text retains the adopted reversible
  word reveal. Interior pages use whole-text fades.
- Reduced motion keeps all text fully readable and removes entrance movement.
  Changing the preference while a page is open is supported.
- Button text uses Inter; labels and person names retain their existing fonts.
  Hover/keyboard focus share colors, with 180ms transitions. Course CTA labels,
  arrows and dashed rings change color together.

## People and publications

- Portraits retain their original proportions: responsive heights on Home and
  square images on About, with matching role/name styling.
- Contact buttons remain beside the person's name, as explicitly accepted.
- Community cards have no hover shadow. Quotes are available on hover/focus;
  only the current carousel page can receive keyboard focus. Without JavaScript,
  the cards remain accessible through native horizontal scrolling.
- All eight publications include actual first-page previews, rendered at 432px
  for 144px desktop display. See [paper-thumbnails.md](paper-thumbnails.md).

## Adopted timeline

The alternating unboxed layout, SVG icons and cumulative progress line remain.
Desktop arrow and keyboard navigation update the line; mobile progress follows
vertical page scrolling. Desktop copies fade in as they enter the viewport.
Mobile and reduced-motion copies stay fully visible. Reduced-motion controls
scroll immediately, including when the preference changes mid-animation.

Course animation experiments and the line-paced word variant are separate choices.

## Implementation

Shared behavior lives in `assets/js/{site,navigation,timeline}.js`; the timeline
module loads only on About. Shared styles use `site.css` with focused navigation,
buttons and motion styles; people, publications and timeline styles load on their
relevant pages. All nine HTML pages contain the shared navigation markup.

There is no build step or runtime package dependency. Browser verification uses
Playwright outside the repository, covering desktop/tablet/mobile, keyboard
navigation, reduced motion, JavaScript disabled, links and assets.
