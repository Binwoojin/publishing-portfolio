<script setup lang="ts">
import { ref, watch } from 'vue'
import { updateGoal } from '../../api/goal.api'
import type { Category, Goal, GoalStatus } from '../../types/goal'
import { extractErrorMessage } from '../../utils/errors'
import BaseButton from '../common/BaseButton.vue'
import BaseInput from '../common/BaseInput.vue'
import BaseModal from '../common/BaseModal.vue'

/*
 * 기존 JSP가 goal/list 페이지 위에서 모달로 수정하는 방식
 * (goal/list?openGoal=)을 그대로 따라, Vue에서도 목록 페이지에서
 * BaseModal로 수정한다.
 *
 * 생성 폼(GoalFormView)과 달리 진행률/상태 입력이 있다 — GoalService.
 * updateGoal()은 이 두 값을 검증/반영하기 때문이다.
 */
const props = defineProps<{
  open: boolean
  goal: Goal | null
  categories: Category[]
}>()

const emit = defineEmits<{
  close: []
  updated: [goal: Goal]
}>()

const goalTitle = ref('')
const goalContent = ref('')
const categoryNum = ref<number | null>(null)
const startDate = ref('')
const endDate = ref('')
const goalProgress = ref(0)
const goalStatus = ref<GoalStatus>('진행중')

const saveStatus = ref<'idle' | 'saving' | 'error'>('idle')
const errorMessage = ref('')
const titleError = ref('')
const dateError = ref('')

watch(
  () => props.goal,
  (goal) => {
    if (!goal) return
    goalTitle.value = goal.goalTitle
    goalContent.value = goal.goalContent ?? ''
    categoryNum.value = goal.category.categoryNum
    startDate.value = goal.startDate ?? ''
    endDate.value = goal.endDate ?? ''
    goalProgress.value = goal.goalProgress
    goalStatus.value = goal.goalStatus
    saveStatus.value = 'idle'
    errorMessage.value = ''
    titleError.value = ''
    dateError.value = ''
  },
  { immediate: true },
)

/* GoalFormView와 동일한 기준(빈 제목/200자 초과/기간 역전)으로 제출 전 검증한다 */
function validate(): boolean {
  titleError.value = ''
  dateError.value = ''
  let valid = true

  const trimmedTitle = goalTitle.value.trim()
  if (!trimmedTitle) {
    titleError.value = '목표 제목을 입력해주세요.'
    valid = false
  } else if (trimmedTitle.length > 200) {
    titleError.value = '제목은 200자 이내로 입력해주세요.'
    valid = false
  }

  if (startDate.value && endDate.value && endDate.value < startDate.value) {
    dateError.value = '종료일은 시작일보다 빠를 수 없어요.'
    valid = false
  }

  return valid
}

async function onSubmit() {
  if (!props.goal) return
  if (!validate()) return

  if (!categoryNum.value) {
    saveStatus.value = 'error'
    errorMessage.value = '카테고리를 선택해주세요.'
    return
  }

  saveStatus.value = 'saving'
  errorMessage.value = ''

  try {
    const updated = await updateGoal(props.goal.goalNum, {
      goalTitle: goalTitle.value,
      goalContent: goalContent.value,
      categoryNum: categoryNum.value,
      startDate: startDate.value || null,
      endDate: endDate.value || null,
      goalProgress: goalProgress.value,
      goalStatus: goalStatus.value,
    })
    emit('updated', updated)
  } catch (error) {
    saveStatus.value = 'error'
    errorMessage.value = extractErrorMessage(error, '목표를 수정하지 못했어요. 다시 시도해주세요.')
  }
}
</script>

<template>
  <BaseModal :open="open" title="목표 수정" @close="emit('close')">
    <form class="goal-edit" @submit.prevent="onSubmit">
      <BaseInput v-model="goalTitle" label="목표 제목" required :error-message="titleError" />
      <BaseInput v-model="goalContent" label="목표 설명" />

      <label class="goal-edit__field">
        <span class="goal-edit__label">카테고리</span>
        <select v-model.number="categoryNum" class="goal-edit__select" required>
          <option v-for="category in categories" :key="category.categoryNum" :value="category.categoryNum">
            {{ category.categoryIcon }} {{ category.categoryName }}
          </option>
        </select>
      </label>

      <label class="goal-edit__field">
        <span class="goal-edit__label">상태</span>
        <select v-model="goalStatus" class="goal-edit__select">
          <option value="진행중">진행중</option>
          <option value="완료">완료</option>
          <option value="중단">중단</option>
        </select>
      </label>

      <label class="goal-edit__field">
        <span class="goal-edit__label">진행률 ({{ goalProgress }}%)</span>
        <input v-model.number="goalProgress" type="range" min="0" max="100" class="goal-edit__range" />
      </label>

      <div class="goal-edit__dates">
        <BaseInput v-model="startDate" label="시작일" type="date" />
        <BaseInput v-model="endDate" label="종료일" type="date" />
      </div>
      <p v-if="dateError" class="goal-edit__hint goal-edit__hint--error">{{ dateError }}</p>

      <p v-if="saveStatus === 'error'" class="goal-edit__hint goal-edit__hint--error">
        {{ errorMessage }}
      </p>

      <div class="goal-edit__actions">
        <BaseButton type="button" variant="secondary" :disabled="saveStatus === 'saving'" @click="emit('close')">
          취소
        </BaseButton>
        <BaseButton type="submit" :disabled="saveStatus === 'saving'">
          {{ saveStatus === 'saving' ? '저장 중...' : '저장' }}
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>

<style scoped>
.goal-edit {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.goal-edit__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.goal-edit__select {
  padding: var(--space-3);
  font-size: var(--font-size-base);
  font-family: inherit;
  color: var(--color-text-primary);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.goal-edit__range {
  width: 100%;
  accent-color: var(--color-primary);
}

.goal-edit__dates {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.goal-edit__hint {
  margin: 0;
  font-size: var(--font-size-sm);
}

.goal-edit__hint--error {
  color: var(--color-error);
}

.goal-edit__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
}

@media (max-width: 480px) {
  .goal-edit__dates {
    grid-template-columns: 1fr;
  }
}
</style>
