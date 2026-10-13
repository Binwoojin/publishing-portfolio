<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral'
  }>(),
  {
    variant: 'neutral',
  },
)
</script>

<template>
  <span class="base-badge" :class="`variant-${variant}`">
    <slot />
  </span>
</template>

<style scoped>
.base-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px var(--space-3);
  border-radius: 999px;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  line-height: 1.4;
}

.variant-primary {
  background: var(--color-primary-bg);
  color: var(--color-primary-hover);
}

.variant-success {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.variant-warning {
  background: var(--color-warning-bg);
  color: var(--color-warning);
}

.variant-error {
  background: var(--color-error-bg);
  color: var(--color-error);
}

.variant-neutral {
  background: var(--color-bg);
  color: var(--color-text-secondary);
}
</style>
