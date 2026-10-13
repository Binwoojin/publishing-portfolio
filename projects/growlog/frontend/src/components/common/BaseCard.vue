<script setup lang="ts">
/*
 * 화면 곳곳(Summary Card, Timeline Item, Goal Card 등)에서 재사용하는
 * 가장 기본 단위. "부드러운 카드"라는 디자인 원칙을 여기 한 곳에만 정의해서
 * 화면마다 box-shadow/radius 값이 흩어지지 않게 한다.
 */
</script>

<template>
  <section class="base-card">
    <slot />
  </section>
</template>

<style scoped>
.base-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  padding: var(--space-6);
}
</style>
