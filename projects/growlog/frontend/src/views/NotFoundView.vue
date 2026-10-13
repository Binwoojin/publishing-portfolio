<script setup lang="ts">
import { useRouter } from 'vue-router'
import BaseButton from '../components/common/BaseButton.vue'
import BaseCard from '../components/common/BaseCard.vue'

const router = useRouter()
</script>

<template>
  <main class="not-found">
    <BaseCard class="not-found__card">
      <p class="not-found__code">404</p>
      <p class="not-found__message">페이지를 찾을 수 없어요.</p>
      <BaseButton variant="secondary" @click="router.push({ name: 'landing' })">
        홈으로 가기
      </BaseButton>
    </BaseCard>
  </main>
</template>

<style scoped>
.not-found {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-8) var(--space-4);
}

.not-found__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  text-align: center;
}

.not-found__code {
  margin: 0;
  font-size: var(--font-size-display);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-secondary);
}

.not-found__message {
  margin: 0;
  color: var(--color-text-secondary);
}
</style>
