---
title: Revisions
description: How this site is built — the stack, the design and why it looks the way it does, every change that shipped, and what is still wrong with it.
---

# Revisions

How this site is built, and every change made to it. The footer of every page
is a drawing's title block; its `REV` field points here, the way it would point
at the revision table on a drawing.

## Spec {#spec}

- **[VitePress 2](https://vitepress.dev/)** (2.0.0-alpha.20) on **Vue 3.5**,
  extending the default theme. Four custom components, all `<script setup>`:
  `ChamferedCard`, `TitleBlock`, `NotFound` and `Mermaid`.
- **Vanilla CSS** on custom properties. No CSS framework; the palette lives in
  one file, `vars.css`, and everything else — diagrams included — reads from it.
- **Hosted on GitHub Pages**, built by GitHub Actions on Node 24. A pull
  request builds as a check; a merge to `main` builds and deploys, in about a
  minute. Nothing reaches the live site without a green build.
- **Source:** [github.com/jacoblindev/jacoblindev.github.io](https://github.com/jacoblindev/jacoblindev.github.io).
  Posts are drafted in a separate, private repo and arrive here by pull request
  like any other change.

## Design {#design}

The theme is called **Digital Tectonics**: the site is drawn like an
engineering drawing, on the argument that showing the structure — the grid,
the title block — says "planned" before a word is read.

- **Graph-paper background, in CSS only.** Two layers of 1px
  `linear-gradient` lines, a 100px major grid over a 20px minor one, fixed at
  that size at any width. No images. Light mode is paper and ink; dark mode is
  a blueprint — Prussian blue (`#0B1C2C`) with chalk-coloured text.
- **Chamfered corners, never rounded.** Every card and button has its corners
  cut at 45° with `clip-path: polygon(…)`, and VitePress's own rounding is
  forced off with `border-radius: 0 !important`. A `calc(100% - 20px)` cut is
  exactly 45° because it rises as far as it runs — the geometry is the theme.
  The cost: `clip-path` clips borders and box-shadows too, so a bordered card
  is two nested polygons (a 1px border layer, the content 1px inside it), and
  its shadow is a `filter: drop-shadow` on a wrapper, outside the clip.
- **A title block for a footer.** Project, sheet (the page's path), date and
  revision, laid out like the corner of a drawing.
- **The favicon is a point plotted on the grid** — a cyan square on a faint
  3×3 grid in a chamfered tile. A `JL` monogram was tried first and read as a
  software company's app icon; the grid point was the sharpest of four
  letterless candidates at 16px and the one mark that is only this site's.
- **Diagrams are text.** Mermaid blocks render in the browser, themed from the
  same CSS variables, so they follow light and dark mode and stay editable.

## Revision table {#table}

Newest first. One row per change a reader could notice.

<div class="revision-table">

| Rev | Date | Change |
|:---:|---|---|
| **D** | 2026-10-03 | This page. The footer's `REV` now links here and is read from this table at build time, so it cannot drift; its `DATE` is the page's last commit, where it used to show the visitor's today. |
| **C** | 2026-10-03 | Link previews: Open Graph tags from each page's frontmatter, a share card that survives LinkedIn's thumbnail, a favicon, and the name JLNotes. ([#2](https://github.com/jacoblindev/jacoblindev.github.io/pull/2), [#3](https://github.com/jacoblindev/jacoblindev.github.io/pull/3), [#4](https://github.com/jacoblindev/jacoblindev.github.io/pull/4)) |
| **B** | 2026-10-02 | Diagrams: ` ```mermaid ` blocks rendered client-side by a custom component, loaded only on pages that have one, and themed from the palette in both modes. ([af6a00a](https://github.com/jacoblindev/jacoblindev.github.io/commit/af6a00a)) |
| **A** | 2026-10-02 | First issue. The Digital Tectonics theme on VitePress 2 in a fresh repo, English only, one section: Notes. Deployed to GitHub Pages; pull requests build as a check. ([74b2b5e](https://github.com/jacoblindev/jacoblindev.github.io/commit/74b2b5e), [#1](https://github.com/jacoblindev/jacoblindev.github.io/pull/1)) |

</div>

## Known issues {#known-issues}

- **VitePress 2 is still in alpha.** An upgrade can break the theme. Versions
  are locked and bumped on purpose, one at a time.
- **The theme overrides VitePress's defaults with `!important`** to remove
  rounding. A restyle of the default theme can undo it silently; check corners
  after every VitePress bump.
- **The build warns about chunks over 500 kB.** They are Mermaid's own
  lazily loaded pieces, fetched only by a page with a diagram. The warning is
  left on, because raising the limit would also hide real growth in the main
  bundle.
- **No ARIA attributes on the custom components yet.** A gap, not a choice.
- **Not yet checked on a real phone.** Narrow widths were checked in a
  headless browser only.

<style>
/* A date is one token; never break it across lines. */
.revision-table td:nth-child(2) {
  white-space: nowrap;
}
</style>
