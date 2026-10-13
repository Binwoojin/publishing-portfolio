<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { deleteGoal, fetchCategories, fetchGoals } from '../api/goal.api'
import type { Category, Goal } from '../types/goal'
import { extractErrorMessage } from '../utils/errors'
import AppNav from '../components/common/AppNav.vue'
import BaseButton from '../components/common/BaseButton.vue'
import ConfirmDialog from '../components/common/ConfirmDialog.vue'
import GoalCard from '../components/goal/GoalCard.vue'
import GoalEditModal from '../components/goal/GoalEditModal.vue'
import LoadingSkeleton from '../components/common/LoadingSkeleton.vue'

/*
 * 수정은 이 목록 페이지 위의 모달(GoalEditModal)로, 삭제는 ConfirmDialog로
 * 확인 후 처리한다 — 기존 JSP의 "목록 위에서 모달로 수정" 패턴을 그대로
 * 따랐다.
 */
const router = useRouter()
const goals = ref<Goal[]>([])
const categories = ref<Category[]>([])
const status = ref<'loading' | 'success' | 'error'>('loading')

const editingGoal = ref<Goal | null>(null)

const deletingGoal = ref<Goal | null>(null)
const deleteStatus = ref<'idle' | 'deleting' | 'error'>('idle')
const deleteErrorMessage = ref('')

onMounted(async () => {
  try {
    const [goalList, categoryList] = await Promise.all([fetchGoals(), fetchCategories()])
    goals.value = goalList
    categories.value = categoryList
    status.value = 'success'
  } catch {
    status.value = 'error'
  }
})

function onEdit(goal: Goal) {
  editingGoal.value = goal
}

function onGoalUpdated(updated: Goal) {
  const index = goals.value.findIndex((goal) => goal.goalNum === updated.goalNum)
  if (index !== -1) {
    goals.value[index] = updated
  }
  editingGoal.value = null
}

function onDelete(goal: Goal) {
  deletingGoal.value = goal
  deleteStatus.value = 'idle'
  deleteErrorMessage.value = ''
}

async function onConfirmDelete() {
  if (!deletingGoal.value) return

  deleteStatus.value = 'deleting'
  try {
    await deleteGoal(deletingGoal.value.goalNum)
    goals.value = goals.value.filter((goal) => goal.goalNum !== deletingGoal.value?.goalNum)
    deletingGoal.value = null
  } catch (error) {
    deleteStatus.value = 'error'
    deleteErrorMessage.value = extractErrorMessage(error, '목표를 삭제하지 못했어요. 다시 시도해주세요.')
  }
}
</script>

<template>
  <main class="goal-list">
    <header class="goal-list__header">
      <h1>목표</h1>
      <div class="goal-list__actions">
        <AppNav />
        <BaseButton variant="primary" @click="router.push({ name: 'goal-new' })">목표 추가</BaseButton>
      </div>
    </header>

    <LoadingSkeleton v-if="status === 'loading'" :count="3" />

    <p v-else-if="status === 'error'" class="goal-list__status goal-list__status--error">
      데이터를 불러오지 못했어요. 잠시 후 다시 시도해주세요.
    </p>

    <template v-else>
      <p v-if="goals.length === 0" class="goal-list__status">
        아직 등록한 목표가 없어요. 첫 목표를 등록해보세요.
      </p>

      <ul v-else class="goal-list__grid">
        <li v-for="goal in goals" :key="goal.goalNum">
          <GoalCard :goal="goal" @edit="onEdit" @delete="onDelete" />
        </li>
      </ul>
    </template>

    <GoalEditModal
      :open="editingGoal !== null"
      :goal="editingGoal"
      :categories="categories"
      @close="editingGoal = null"
      @updated="onGoalUpdated"
    />

    <ConfirmDialog
      :open="deletingGoal !== null"
      title="목표 삭제"
      :message="`'${deletingGoal?.goalTitle}' 목표를 삭제할까요? 이 작업은 되돌릴 수 없어요.`"
      :busy="deleteStatus === 'deleting'"
      @confirm="onConfirmDelete"
      @cancel="deletingGoal = null"
    />
    <p v-if="deleteStatus === 'error'" class="goal-list__status goal-list__status--error">
      {{ deleteErrorMessage }}
    </p>
  </main>
</template>

<style scoped>
.goal-list {
  max-width: 720px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.goal-list__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-4);
}

.goal-list__actions {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.goal-list__header h1 {
  font-size: var(--font-size-page-title);
  font-weight: var(--font-weight-bold);
}

.goal-list__status {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.goal-list__status--error {
  color: var(--color-error);
}

.goal-list__grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
</style>
