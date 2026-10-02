<script setup lang="ts">
// ChamferedCard component
</script>

<template>
  <div class="chamfered-wrapper">
    <div class="chamfered-border">
      <div class="chamfered-content">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chamfered-wrapper {
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3));
}

.chamfered-border {
  background-color: var(--vp-c-border);
  padding: 1px;
  clip-path: polygon(20px 0%, 100% 0%, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0% 100%, 0% 20px);
}

.chamfered-content {
  background-color: var(--vp-c-brand-2);
  padding: 20px;
  height: 100%;
  clip-path: polygon(19px 0%, 100% 0%, 100% calc(100% - 19px), calc(100% - 19px) 100%, 0% 100%, 0% 19px);
}
</style>
