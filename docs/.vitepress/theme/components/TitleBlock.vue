<script setup lang="ts">
import {useData, useRoute} from 'vitepress'
import {computed} from 'vue'

const {site, page, frontmatter} = useData()
const route = useRoute()

const lastUpdated = computed(() => {
  if (page.value.lastUpdated) {
    return new Date(page.value.lastUpdated).toLocaleDateString()
  }
  return new Date().toLocaleDateString()
})

const currentYear = new Date().getFullYear()

const isDoc = computed(() => frontmatter.value.layout !== 'home')
</script>

<template>
  <footer class="title-block" :class="{ 'tectonic-cut': isDoc, 'doc-mode': isDoc }">
    <div class="tb-container">
      <!-- Row 1: Project Info -->
      <div class="tb-section project">
        <span class="tb-label">PROJECT</span>
        <span class="tb-value">{{ site.title }}</span>
      </div>

      <!-- Row 2: Sheet Info -->
      <div class="tb-section sheet">
        <span class="tb-label">SHEET / PATH</span>
        <span class="tb-value path">{{ route.path }}</span>
      </div>

      <!-- Row 3: Metadata -->
      <div class="tb-section meta">
        <div class="tb-sub">
          <span class="tb-label">DATE</span>
          <span class="tb-value">{{ lastUpdated }}</span>
        </div>
        <div class="tb-sub">
          <span class="tb-label">REV</span>
          <span class="tb-value">v1.0</span>
        </div>
        <div class="tb-sub">
          <span class="tb-label">COPYRIGHT</span>
          <span class="tb-value">© {{ currentYear }}</span>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.title-block {
  background-color: var(--vp-c-bg-alt);
  font-family: var(--vp-font-family-mono), monospace;
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
}

/* Doc Mode Overrides: Chamfered Box Style */
.title-block.doc-mode {
  border: none;
  margin-top: 3rem;
  margin-bottom: 2rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.05));
}

.tb-container {
  max-width: var(--vp-layout-max-width);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  border-left: none;
  border-right: none;
}

.title-block.doc-mode .tb-container {
  border-left: none;
  border-right: none;
  max-width: none;
}

.tb-section {
  padding: 1rem;
  border-bottom: 1px solid var(--vp-c-border);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.tb-section:last-child {
  border-bottom: none;
}

.tb-label {
  font-size: 0.65rem;
  text-transform: uppercase;
  opacity: 0.6;
  letter-spacing: 0.05em;
}

.tb-value {
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.path {
  word-break: break-all;
}

.meta {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
}

.tb-sub {
  display: flex;
  flex-direction: column;
}

/* Desktop Layout: Horizontal Strip */
@media (min-width: 768px) {
  .tb-container {
    grid-template-columns: 2fr 3fr 2fr;
  }

  .tb-section {
    border-bottom: none;
    border-right: 1px solid var(--vp-c-border);
  }

  .tb-section:last-child {
    border-right: none;
  }
}
</style>
