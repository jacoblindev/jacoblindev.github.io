<script setup lang="ts">
import {useData} from 'vitepress'

const {site} = useData()
</script>

<template>
  <div class="not-found-container">
    <div class="blueprint-error">
      <div class="error-code">404</div>
      <div class="error-divider"></div>
      <div class="error-message">
        <h1 class="title">MISSING BLUEPRINT</h1>
        <p class="description">
          The requested sheet could not be located in the archive.
          It may have been moved, deleted, or never existed.
        </p>
        <div class="actions">
          <a :href="site.base" class="action-btn tectonic-cut">
            RETURN TO STUDIO
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.not-found-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 2rem;
  text-align: center;
}

.blueprint-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  max-width: 600px;
  position: relative;
}

.error-code {
  font-family: var(--vp-font-family-mono), monospace;
  font-size: 8rem;
  font-weight: 700;
  line-height: 1;
  color: var(--vp-c-brand-1);
  opacity: 0.3;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9;
  pointer-events: none;
  white-space: nowrap;
}

.error-divider {
  width: 100px;
  height: 2px;
  background-color: var(--vp-c-accent);
  margin: 1rem 0;
  z-index: 1;
}

.error-message {
  z-index: 1;
  /* Use sidebar background color as requested */
  background-color: var(--vp-sidebar-bg-color);
  padding: 2rem;
  /* Chamfer the card itself */
  clip-path: polygon(
      20px 0%, 100% 0%,
      100% calc(100% - 20px), calc(100% - 20px) 100%,
      0% 100%, 0% 20px
  );
}

.title {
  font-family: var(--vp-font-family-mono), monospace;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: var(--vp-c-text-1);
  letter-spacing: 0.1em;
}

.description {
  font-family: var(--vp-font-family-base), sans-serif;
  color: var(--vp-c-text-2);
  margin-bottom: 2rem;
  line-height: 1.6;
}

.action-btn {
  display: inline-block;
  /* Use primary brand color (same as Home primary button) */
  background-color: var(--vp-c-brand-2);
  color: #ffffff;
  padding: 12px 24px;
  font-family: var(--vp-font-family-mono), monospace;
  font-weight: 600;
  text-decoration: none;
  transition: background-color 0.2s;
}

.action-btn:hover {
  background-color: var(--vp-c-brand-1);
}

/* Ensure the chamfer utility works */
.tectonic-cut {
  clip-path: polygon(
      10px 0%, 100% 0%,
      100% calc(100% - 10px), calc(100% - 10px) 100%,
      0% 100%, 0% 10px
  );
}
</style>
