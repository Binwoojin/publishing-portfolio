<script setup lang="ts">
const props = defineProps<{
  progress: number
}>()

/* 0~100 밖의 값이 들어와도 막대가 넘치거나 사라지지 않도록 방어한다 */
const clampedProgress = () => Math.min(100, Math.max(0, props.progress))
</script>

<template>
  <div class="goal-progress">
    <div
      class="goal-progress__track"
      role="progressbar"
      :aria-valuenow="progress"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div class="goal-progress__fill" :style="{ width: `${clampedProgress()}%` }" />
    </div>
    <span class="goal-progress__label">{{ progress }}%</span>
  </div>
</template>

<style scoped>
.goal-progress {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.goal-progress__track {
  flex: 1;
  height: 12px;
  border-radius: 999px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  overflow: hidden;
}

/*
 * Progress는 GrowLog Growth의 핵심 시각 요소라 Primary Green을 쓴다.
 * 다른 요소(제목/기간 등)까지 전부 Green으로 강조하지 않고 여기에만
 * 집중해서 쓰는 것으로 "성장" 의미를 진행률 하나에 모은다.
 */
.goal-progress__fill {
  height: 100%;
  border-radius: 999px;
  background: var(--color-primary);
  transition: width 0.2s ease;
}

.goal-progress__label {
  min-width: 38px;
  text-align: right;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
}
</style>
