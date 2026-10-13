<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { fetchGoals } from '../api/goal.api'
import { createRecord } from '../api/record.api'
import type { Goal } from '../types/goal'
import type { RecordDifficulty } from '../types/record'
import { extractErrorMessage } from '../utils/errors'
import AppNav from '../components/common/AppNav.vue'
import BaseButton from '../components/common/BaseButton.vue'
import BaseCard from '../components/common/BaseCard.vue'
import BaseInput from '../components/common/BaseInput.vue'

/*
 * 기존 JSP record/write 화면과 GrowthRecordRequest를 그대로 따른다 —
 * 필드 이름/제약(제목 200자, 이미지 최대 5장·5MB·JPG·PNG·WEBP, YouTube
 * 주소 형식)은 전부 백엔드(GrowthRecordService/MediaService/
 * S3FileStorageService)에 이미 있는 값을 그대로 옮긴 것이지 새로 만든
 * 기준이 아니다.
 */
const MAX_IMAGE_COUNT = 5
const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const YOUTUBE_URL_PATTERN = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/

const router = useRouter()

const goals = ref<Goal[]>([])
const goalsStatus = ref<'loading' | 'success' | 'error'>('loading')

const recordType = ref<'FREE' | 'GOAL'>('FREE')
const goalNum = ref<number | null>(null)
const title = ref('')
const content = ref('')
const todayLearning = ref('')
const difficulty = ref<RecordDifficulty>('NORMAL')
const solution = ref('')
const retrospective = ref('')
const youtubeUrl = ref('')

const imageFiles = ref<File[]>([])
const imagePreviews = ref<string[]>([])

const saveStatus = ref<'idle' | 'saving' | 'error'>('idle')
const errorMessage = ref('')
const titleError = ref('')
const goalError = ref('')
const contentError = ref('')
const imageError = ref('')
const youtubeError = ref('')

onMounted(async () => {
  try {
    goals.value = await fetchGoals()
    goalsStatus.value = 'success'
  } catch {
    goalsStatus.value = 'error'
  }
})

function conditionLabel(value: RecordDifficulty): string {
  const labels = {
    FREE: { EASY: '좋은 하루', NORMAL: '보통', HARD: '힘든 하루' },
    GOAL: { EASY: '쉬움', NORMAL: '보통', HARD: '어려움' },
  }
  return labels[recordType.value][value]
}

function clearImagePreviews() {
  imagePreviews.value.forEach((url) => URL.revokeObjectURL(url))
  imagePreviews.value = []
}

function onImageChange(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])

  imageError.value = ''
  if (files.length > MAX_IMAGE_COUNT) {
    imageError.value = `이미지는 최대 ${MAX_IMAGE_COUNT}장까지 등록할 수 있어요.`
    input.value = ''
    return
  }

  const oversized = files.find((file) => file.size > MAX_IMAGE_SIZE)
  if (oversized) {
    imageError.value = '이미지 크기는 5MB를 초과할 수 없어요.'
    input.value = ''
    return
  }

  const invalidType = files.find((file) => !ALLOWED_IMAGE_TYPES.includes(file.type))
  if (invalidType) {
    imageError.value = 'JPG, PNG, WEBP 이미지 파일만 업로드할 수 있어요.'
    input.value = ''
    return
  }

  clearImagePreviews()
  imageFiles.value = files
  imagePreviews.value = files.map((file) => URL.createObjectURL(file))
}

function removeImage(index: number) {
  URL.revokeObjectURL(imagePreviews.value[index])
  imageFiles.value = imageFiles.value.filter((_, i) => i !== index)
  imagePreviews.value = imagePreviews.value.filter((_, i) => i !== index)
}

function validate(): boolean {
  titleError.value = ''
  goalError.value = ''
  contentError.value = ''
  youtubeError.value = ''
  let valid = true

  if (recordType.value === 'GOAL' && !goalNum.value) {
    goalError.value = '연결할 목표를 선택해주세요.'
    valid = false
  }

  const trimmedTitle = title.value.trim()
  if (!trimmedTitle) {
    titleError.value = '기록 제목을 입력해주세요.'
    valid = false
  } else if (trimmedTitle.length > 200) {
    titleError.value = '제목은 200자 이내로 입력해주세요.'
    valid = false
  }

  if (!content.value.trim()) {
    contentError.value = '오늘의 기록 내용을 입력해주세요.'
    valid = false
  }

  if (youtubeUrl.value.trim() && !YOUTUBE_URL_PATTERN.test(youtubeUrl.value.trim())) {
    youtubeError.value = '올바른 YouTube 영상 주소를 입력해주세요.'
    valid = false
  }

  return valid
}

async function onSubmit() {
  if (!validate()) return

  saveStatus.value = 'saving'
  errorMessage.value = ''

  try {
    await createRecord({
      goalNum: recordType.value === 'GOAL' ? goalNum.value : null,
      title: title.value,
      content: content.value,
      todayLearning: todayLearning.value,
      difficulty: difficulty.value,
      solution: solution.value,
      retrospective: retrospective.value,
      youtubeUrl: youtubeUrl.value,
      imageFiles: imageFiles.value,
      deleteMediaNums: [],
    })
    router.push({ name: 'timeline' })
  } catch (error) {
    saveStatus.value = 'error'
    errorMessage.value = extractErrorMessage(error, '기록을 저장하지 못했어요. 다시 시도해주세요.')
  }
}
</script>

<template>
  <main class="record-form">
    <header class="record-form__header">
      <h1>기록 남기기</h1>
      <AppNav />
    </header>

    <BaseCard>
      <!--
        required 속성은 접근성(스크린 리더에 "필수" 정보 전달)을 위해 그대로
        두되, novalidate로 브라우저의 기본 검증 팝업(영어 "Please fill out
        this field")이 우리 검증보다 먼저 제출을 막지 않게 한다 — 그러지
        않으면 validate()가 실행되기도 전에 네이티브 툴팁이 떠서 한글
        에러 메시지가 아예 보이지 않는다.
      -->
      <form class="record-form__fields" novalidate @submit.prevent="onSubmit">
        <fieldset class="record-form__field">
          <legend class="record-form__label">기록 유형</legend>
          <div class="record-form__type-options">
            <label class="record-form__type-option" :class="{ 'is-active': recordType === 'FREE' }">
              <input type="radio" v-model="recordType" value="FREE" />
              🌱 자유 기록
            </label>
            <label class="record-form__type-option" :class="{ 'is-active': recordType === 'GOAL' }">
              <input type="radio" v-model="recordType" value="GOAL" />
              🎯 목표 연결 기록
            </label>
          </div>
        </fieldset>

        <label v-if="recordType === 'GOAL'" class="record-form__field">
          <span class="record-form__label">연결할 목표</span>
          <select v-model.number="goalNum" class="record-form__select" required>
            <option :value="null">목표를 선택해 주세요.</option>
            <option v-for="goal in goals" :key="goal.goalNum" :value="goal.goalNum">
              {{ goal.goalTitle }}
            </option>
          </select>
          <span v-if="goalsStatus === 'error'" class="record-form__hint record-form__hint--error">
            목표 목록을 불러오지 못했어요. 새로고침해주세요.
          </span>
          <span v-if="goalError" class="record-form__hint record-form__hint--error">{{ goalError }}</span>
        </label>

        <BaseInput v-model="title" label="기록 제목" required :error-message="titleError" />

        <label class="record-form__field">
          <span class="record-form__label">오늘의 기록</span>
          <textarea v-model="content" class="record-form__textarea" rows="6" required></textarea>
          <span v-if="contentError" class="record-form__hint record-form__hint--error">{{ contentError }}</span>
        </label>

        <label class="record-form__field">
          <span class="record-form__label">오늘 배운 점</span>
          <textarea v-model="todayLearning" class="record-form__textarea" rows="3"></textarea>
        </label>

        <fieldset class="record-form__field">
          <legend class="record-form__label">{{ recordType === 'GOAL' ? '체감 난이도' : '오늘의 기분' }}</legend>
          <div class="record-form__condition-options">
            <label
              v-for="value in (['EASY', 'NORMAL', 'HARD'] as RecordDifficulty[])"
              :key="value"
              class="record-form__condition-option"
              :class="{ 'is-active': difficulty === value }"
            >
              <input type="radio" v-model="difficulty" :value="value" />
              {{ conditionLabel(value) }}
            </label>
          </div>
        </fieldset>

        <label class="record-form__field">
          <span class="record-form__label">문제 해결 과정</span>
          <textarea v-model="solution" class="record-form__textarea" rows="3"></textarea>
        </label>

        <label class="record-form__field">
          <span class="record-form__label">오늘의 회고</span>
          <textarea v-model="retrospective" class="record-form__textarea" rows="3"></textarea>
        </label>

        <div class="record-form__field">
          <label for="imageFiles" class="record-form__label">사진 추가 <span class="record-form__optional">선택</span></label>
          <input
            id="imageFiles"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            class="record-form__file-input"
            @change="onImageChange"
          />
          <span class="record-form__hint">JPG, PNG, WEBP 형식, 최대 {{ MAX_IMAGE_COUNT }}장, 장당 5MB까지 등록할 수 있어요.</span>
          <span v-if="imageError" class="record-form__hint record-form__hint--error">{{ imageError }}</span>

          <ul v-if="imagePreviews.length > 0" class="record-form__preview-list">
            <li v-for="(url, index) in imagePreviews" :key="url" class="record-form__preview-item">
              <img :src="url" :alt="`새로 추가할 사진 ${index + 1}`" />
              <button type="button" class="record-form__preview-remove" @click="removeImage(index)">제거</button>
            </li>
          </ul>
        </div>

        <BaseInput
          v-model="youtubeUrl"
          label="YouTube 영상 주소"
          type="url"
          :error-message="youtubeError"
        />

        <div class="record-form__actions">
          <BaseButton type="button" variant="secondary" :disabled="saveStatus === 'saving'" @click="router.back()">
            취소
          </BaseButton>
          <BaseButton type="submit" :disabled="saveStatus === 'saving'">
            {{ saveStatus === 'saving' ? '저장 중...' : '기록 저장' }}
          </BaseButton>
        </div>

        <p v-if="saveStatus === 'error'" class="record-form__hint record-form__hint--error">
          {{ errorMessage }}
        </p>
      </form>
    </BaseCard>
  </main>
</template>

<style scoped>
.record-form {
  max-width: 560px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.record-form__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-4);
}

.record-form__header h1 {
  font-size: var(--font-size-page-title);
  font-weight: var(--font-weight-bold);
}

.record-form__fields {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.record-form__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  border: none;
  padding: 0;
  margin: 0;
}

.record-form__label {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.record-form__optional {
  margin-left: var(--space-1);
  font-weight: var(--font-weight-normal);
  color: var(--color-text-secondary);
  opacity: 0.7;
}

.record-form__select,
.record-form__textarea {
  padding: var(--space-3);
  font-size: var(--font-size-base);
  font-family: inherit;
  color: var(--color-text-primary);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  resize: vertical;
}

.record-form__type-options,
.record-form__condition-options {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.record-form__type-option,
.record-form__condition-option {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.record-form__type-option.is-active,
.record-form__condition-option.is-active {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-bg);
}

.record-form__file-input {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.record-form__preview-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: var(--space-2);
}

.record-form__preview-item {
  position: relative;
}

.record-form__preview-item img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

.record-form__preview-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  padding: 2px 8px;
  font-size: 11px;
  border: none;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  cursor: pointer;
}

.record-form__hint {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.record-form__hint--error {
  color: var(--color-error);
}

.record-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
}

@media (max-width: 480px) {
  .record-form__actions {
    flex-direction: column-reverse;
  }
}
</style>
