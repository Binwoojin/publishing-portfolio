<script setup lang="ts">
import { CircleCheck, CircleX, Flag } from '@lucide/vue'
import type { GoalStatus } from '../../types/goal'
import BaseBadge from '../common/BaseBadge.vue'

defineProps<{
  status: GoalStatus
}>()

const variantByStatus: Record<GoalStatus, 'primary' | 'success' | 'neutral'> = {
  진행중: 'primary',
  완료: 'success',
  중단: 'neutral',
}

const iconByStatus: Record<GoalStatus, typeof Flag> = {
  진행중: Flag,
  완료: CircleCheck,
  중단: CircleX,
}
</script>

<template>
  <BaseBadge :variant="variantByStatus[status]">
    <component :is="iconByStatus[status]" :size="12" :stroke-width="1.75" />
    {{ status }}
  </BaseBadge>
</template>
