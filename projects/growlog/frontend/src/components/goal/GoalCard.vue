<script setup lang="ts">
import { Calendar, Pencil, Trash2 } from '@lucide/vue'
import type { Goal } from '../../types/goal'
import BaseButton from '../common/BaseButton.vue'
import BaseCard from '../common/BaseCard.vue'
import GoalProgress from './GoalProgress.vue'
import GoalStatusBadge from './GoalStatusBadge.vue'

defineProps<{
  goal: Goal
}>()

const emit = defineEmits<{
  edit: [goal: Goal]
  delete: [goal: Goal]
}>()

function formatDateRange(startDate: string | null, endDate: string | null): string {
  if (!startDate && !endDate) return ''
  return `${startDate ?? '?'} ~ ${endDate ?? '?'}`
}
</script>

<template>
  <BaseCard class="goal-card">
    <div class="goal-card__header">
      <span class="goal-card__category">{{ goal.category.categoryIcon }} {{ goal.category.categoryName }}</span>
      <GoalStatusBadge :status="goal.goalStatus" />
    </div>

    <p class="goal-card__title">{{ goal.goalTitle }}</p>
    <p v-if="goal.goalContent" class="goal-card__content">{{ goal.goalContent }}</p>

    <GoalProgress :progress="goal.goalProgress" />

    <p v-if="goal.startDate || goal.endDate" class="goal-card__dates">
      <Calendar :size="13" :stroke-width="1.75" />
      {{ formatDateRange(goal.startDate, goal.endDate) }}
    </p>

    <div class="goal-card__actions">
      <BaseButton variant="secondary" @click="emit('edit', goal)">
        <Pencil :size="14" :stroke-width="1.75" />
        수정
      </BaseButton>
      <BaseButton variant="ghost" @click="emit('delete', goal)">
        <Trash2 :size="14" :stroke-width="1.75" />
        삭제
      </BaseButton>
    </div>
  </BaseCard>
</template>

<style scoped>
.goal-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.goal-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.goal-card__category {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.goal-card__title {
  margin: 0;
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
}

.goal-card__content {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.goal-card__dates {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.goal-card__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-1);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border);
}
</style>
