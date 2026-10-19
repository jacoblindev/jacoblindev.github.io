<script setup lang="ts">
// Mermaid component
//
// Renders a ```mermaid fence (rewritten to <Mermaid code="..."> in config.mts)
// in the browser. mermaid is imported on demand, so pages without a diagram
// never download it. Colours are read from the theme's CSS variables at render
// time, so vars.css stays the only place the palette is defined, and the
// diagram re-renders when the appearance toggle flips them.
import {useData} from 'vitepress'
import {nextTick, onBeforeUnmount, onMounted, ref, watch} from 'vue'

const props = defineProps<{ code: string }>()

const {isDark} = useData()
const svg = ref('')
const error = ref('')
const box = ref<HTMLElement | null>(null)
// Which edges have more diagram past them; each one fades out as a scroll cue.
const moreLeft = ref(false)
const moreRight = ref(false)
const source = decodeURIComponent(props.code)

let seq = 0

// The smallest scale a diagram shrinks to on a narrow screen. Labels are 16px
// at natural size, so 0.75 keeps them at 12px; a wider diagram stops shrinking
// there and scrolls sideways inside its box instead.
const MIN_SCALE = 0.75

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

async function render() {
  const fontFamily = cssVar('--vp-font-family-mono')
  // mermaid sizes every node by measuring its label. Measured before the web
  // font arrives, boxes fit the fallback font and the real, wider one gets
  // clipped — so load the font first. A page may never have used it yet, so
  // ask for it explicitly rather than only awaiting document.fonts.ready.
  await Promise.all([
    document.fonts.load(`16px ${fontFamily}`).catch(() => {}),
    document.fonts.ready,
  ])
  const {default: mermaid} = await import('mermaid')
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base',
    // "neo" is mermaid 12's default look, and the only one that applies
    // themeVariables.dropShadow — "classic" ignores it. Its gradient borders
    // are switched off separately below (useGradient).
    look: 'neo',
    darkMode: isDark.value,
    fontFamily,
    themeVariables: {
      background: cssVar('--vp-c-bg'),
      primaryColor: cssVar('--vp-c-bg-soft'),
      primaryTextColor: cssVar('--vp-c-text-1'),
      primaryBorderColor: cssVar('--vp-c-brand-1'),
      secondaryColor: cssVar('--vp-c-bg-alt'),
      tertiaryColor: cssVar('--vp-c-bg'),
      lineColor: cssVar('--vp-c-brand-1'),
      textColor: cssVar('--vp-c-text-1'),
      // ER attribute rows. The base theme defaults them near-white in every
      // mode (#ffffff / #f2f2f2, and rowOdd = primaryColor lightened 75%),
      // unreadable under dark-mode text. mermaid 12 reads row*; the
      // attributeBackground* pair is the older name, still read in places.
      rowOdd: cssVar('--vp-c-bg-soft'),
      rowEven: cssVar('--vp-c-bg-alt'),
      attributeBackgroundColorOdd: cssVar('--vp-c-bg-soft'),
      attributeBackgroundColorEven: cssVar('--vp-c-bg-alt'),
      // Sequence-diagram notes default to sticky-note yellow in every mode.
      noteBkgColor: cssVar('--vp-c-bg-soft'),
      noteTextColor: cssVar('--vp-c-text-1'),
      noteBorderColor: cssVar('--vp-c-brand-1'),
      // autonumber digits default to the inverse of lineColor (orange, from
      // cyan). The circle is filled with the text colour, so the page
      // background reads cleanly on it in both modes.
      sequenceNumberColor: cssVar('--vp-c-bg'),
      useGradient: false,
      // A light lift in the same style as ChamferedCard's shadow, half its
      // size — not mermaid's default (an opaque grey 1px 2px 2px that reads
      // as a halo on the dark palette). Dark mode needs more alpha to show.
      dropShadow: `drop-shadow(0 2px 3px rgba(0, 0, 0, ${isDark.value ? 0.5 : 0.18}))`,
    },
  })
  try {
    // Parse first: render() on invalid input throws *and* leaves mermaid's own
    // "syntax error" SVG appended to <body>. parse() only throws.
    await mermaid.parse(source)
    // Unique id per render: mermaid uses it for a temporary DOM node, and two
    // renders sharing one collide when the theme toggles mid-render.
    const id = `mermaid-${Math.random().toString(36).slice(2)}-${seq++}`
    svg.value = (await mermaid.render(id, source)).svg
    error.value = ''
    await nextTick()
    applyFloor()
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  }
}

// mermaid writes the natural width as an inline max-width on the SVG. A
// min-width in px from it is fixed per diagram, so rotating the phone needs no
// recalculation — only the scroll cue does, which the ResizeObserver handles.
function applyFloor() {
  const el = box.value?.querySelector('svg')
  const natural = parseFloat(el?.style.maxWidth ?? '')
  if (el && natural) el.style.minWidth = `${natural * MIN_SCALE}px`
  updateCue()
}

function updateCue() {
  const el = box.value
  if (!el) return
  moreLeft.value = el.scrollLeft > 1
  moreRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
}

let observer: ResizeObserver | undefined

onMounted(() => {
  render()
  observer = new ResizeObserver(updateCue)
  if (box.value) observer.observe(box.value)
})
onBeforeUnmount(() => observer?.disconnect())
// The .dark class flips before the new variable values apply; wait a tick.
watch(isDark, () => nextTick(render))
</script>

<template>
  <!-- Focusable only when it scrolls, so a keyboard can scroll it too. -->
  <div
    ref="box"
    class="mermaid-diagram"
    :class="{'more-left': moreLeft, 'more-right': moreRight}"
    :tabindex="moreLeft || moreRight ? 0 : undefined"
    @scroll.passive="updateCue"
  >
    <pre v-if="error" class="mermaid-error">Diagram error: {{ error }}</pre>
    <div v-else v-html="svg"></div>
  </div>
</template>

<style scoped>
.mermaid-diagram {
  margin: 16px 0;
  overflow-x: auto;
}

/* mermaid emits width="100%" with an inline max-width of the natural size.
   In a block container that means: natural size, shrinking on narrow screens.
   (A flex container instead collapses it to near-zero — width 100% of a
   shrink-to-fit item.) applyFloor() adds a min-width, so it stops shrinking
   at MIN_SCALE and the box scrolls. */
.mermaid-diagram :deep(svg) {
  display: block;
  margin: 0 auto;
  height: auto;
}

/* Scroll cue: fade the diagram out at an edge that has more past it. A mask
   fades the content itself, so it works in both colour schemes and over the
   drop shadow without knowing the background colour. */
.mermaid-diagram.more-right {
  mask-image: linear-gradient(to right, #000 calc(100% - 48px), transparent);
}
.mermaid-diagram.more-left {
  mask-image: linear-gradient(to left, #000 calc(100% - 48px), transparent);
}
.mermaid-diagram.more-left.more-right {
  mask-image: linear-gradient(to right, transparent, #000 48px, #000 calc(100% - 48px), transparent);
}

/* mermaid measures labels in a detached node, then places them inside .vp-doc,
   whose `p { margin: 1rem 0; line-height: 1.75 }` makes every label taller
   than its box — the last line gets clipped. Undo it to match what mermaid
   measured (no margin, line-height 1.5). */
.mermaid-diagram :deep(foreignObject p) {
  margin: 0;
  line-height: 1.5;
}

.mermaid-error {
  color: var(--vp-c-danger-1);
  font-family: var(--vp-font-family-mono), monospace;
  font-size: 0.85em;
  white-space: pre-wrap;
}
</style>
