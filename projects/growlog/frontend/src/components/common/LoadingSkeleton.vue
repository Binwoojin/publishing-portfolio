<script setup lang="ts">
withDefaults(
  defineProps<{
    count?: number
  }>(),
  {
    count: 3,
  },
)
</script>

<template>
  <div class="skeleton-list">
    <div v-for="n in count" :key="n" class="skeleton-card">
      <div class="skeleton-line skeleton-line--badge" />
      <div class="skeleton-line skeleton-line--title" />
      <div class="skeleton-line skeleton-line--meta" />
    </div>
  </div>
</template>

<style scoped>
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.skeleton-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.skeleton-line {
  border-radius: var(--radius-sm);
  background: linear-gradient(
    90deg,
    var(--color-bg) 25%,
    var(--color-border) 37%,
    var(--color-bg) 63%
  );
  background-size: 400% 100%;
  animation: skeleton-shimmer 1.4s ease infinite;
}

.skeleton-line--badge {
  width: 64px;
  height: 20px;
  border-radius: 999px;
}

.skeleton-line--title {
  width: 60%;
  height: 16px;
  margin-top: var(--space-1);
}

.skeleton-line--meta {
  width: 85%;
  height: 13px;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-line {
    animation: none;
  }
}
</style>
