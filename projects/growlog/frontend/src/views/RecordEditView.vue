<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { fetchGoals } from '../api/goal.api'
import { fetchRecordDetail, updateRecord } from '../api/record.api'
import type { Goal } from '../types/goal'
import type { RecordDifficulty, RecordMedia } from '../types/record'
import { extractErrorMessage } from '../utils/errors'
import AppNav from '../components/common/AppNav.vue'
import BaseButton from '../components/common/BaseButton.vue'
import BaseCard from '../components/common/BaseCard.vue'
import BaseInput from '../components/common/BaseInput.vue'

/*
 * 기존 JSP record/{id}/edit 화면과 동일한 제약을 따른다. 수정에서는
 * 기존 이미지/YouTube를 "새 값으로 덮어쓰기"하지 않는다 — 백엔드
 * updateRecord()가 항상 "기존 미디어 중 선택 삭제 + 새 파일/URL 추가"로
 * 동작하기 때문에(GrowthRecordService.updateRecord), YouTube 주소
 * 입력칸도 기존 값을 미리 채우지 않고 항상 "새로 추가할 영상"용으로
 * 비워 둔다 — 기존 값을 그대로 다시 제출하면 중복 등록된다.
 */
const MAX_IMAGE_COUNT = 5
const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const YOUTUBE_URL_PATTERN = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/

const props = defineProps<{ recordNum: string }>()
const router = useRouter()

const loadStatus = ref<'loading' | 'success' | 'not-found' | 'error'>('loading')
const goals = ref<Goal[]>([])
const goalsStatus = ref<'loading' | 'success' | 'error'>('loading')
const existingMedia = ref<RecordMedia[]>([])
const deleteMediaNums = ref<number[]>([])

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

const existingImageCount = computed(
  () => existingMedia.value.filter((media) => media.mediaType === 'IMAGE').length,
)
const deletedImageCount = computed(
  () =>
    existingMedia.value.filter(
      (media) => media.mediaType === 'IMAGE' && deleteMediaNums.value.includes(media.mediaNum),
    ).length,
)
const retainedImageCount = computed(() => existingImageCount.value - deletedImageCount.value)

onMounted(async () => {
  try {
    const [record, goalList] = await Promise.all([fetchRecordDetail(props.recordNum), fetchGoals()])
    goals.value = goalList
    goalsStatus.value = 'success'

    recordType.value = record.goal ? 'GOAL' : 'FREE'
    goalNum.value = record.goal?.goalNum ?? null
    title.value = record.title
    content.value = record.content
    todayLearning.value = record.todayLearning ?? ''
    difficulty.value = (record.difficulty as RecordDifficulty) || 'NORMAL'
    solution.value = record.solution ?? ''
    retrospective.value = record.retrospective ?? ''
    existingMedia.value = record.mediaList

    loadStatus.value = 'success'
  } catch (error: unknown) {
    const isKnownInvalid =
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      (error as { response?: { status?: number } }).response?.status === 400
    loadStatus.value = isKnownInvalid ? 'not-found' : 'error'
  }
})

function conditionLabel(value: RecordDifficulty): string {
  const labels = {
    FREE: { EASY: '좋은 하루', NORMAL: '보통', HARD: '힘든 하루' },
    GOAL: { EASY: '쉬움', NORMAL: '보통', HARD: '어려움' },
  }
  return labels[recordType.value][value]
}

function toggleDeleteMedia(mediaNum: number) {
  deleteMediaNums.value = deleteMediaNums.value.includes(mediaNum)
    ? deleteMediaNums.value.filter((num) => num !== mediaNum)
    : [...deleteMediaNums.value, mediaNum]
}

function clearImagePreviews() {
  imagePreviews.value.forEach((url) => URL.revokeObjectURL(url))
  imagePreviews.value = []
}

function onImageChange(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])

  imageError.value = ''
  if (retainedImageCount.value + files.length > MAX_IMAGE_COUNT) {
    imageError.value = `유지할 기존 사진과 새 사진은 최대 ${MAX_IMAGE_COUNT}장까지 등록할 수 있어요.`
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
    const updated = await updateRecord(props.recordNum, {
      goalNum: recordType.value === 'GOAL' ? goalNum.value : null,
      title: title.value,
      content: content.value,
      todayLearning: todayLearning.value,
      difficulty: difficulty.value,
      solution: solution.value,
      retrospective: retrospective.value,
      youtubeUrl: youtubeUrl.value,
      imageFiles: imageFiles.value,
      deleteMediaNums: deleteMediaNums.value,
    })
    router.push({ name: 'record-detail', params: { recordNum: updated.recordNum } })
  } catch (error) {
    saveStatus.value = 'error'
    errorMessage.value = extractErrorMessage(error, '기록을 수정하지 못했어요. 다시 시도해주세요.')
  }
}
</script>

<template>
  <main class="record-form">
    <header class="record-form__header">
      <h1>기록 수정</h1>
      <AppNav />
    </header>

    <BaseCard v-if="loadStatus === 'loading'" class="record-form__status">
      <p>불러오는 중...</p>
    </BaseCard>

    <BaseCard v-else-if="loadStatus === 'not-found'" class="record-form__status">
      <p>기록을 찾을 수 없어요. 삭제되었거나 접근 권한이 없는 기록일 수 있어요.</p>
      <BaseButton variant="secondary" @click="router.back()">뒤로가기</BaseButton>
    </BaseCard>

    <BaseCard v-else-if="loadStatus === 'error'" class="record-form__status">
      <p>기록을 불러오지 못했어요. 잠시 후 다시 시도해주세요.</p>
      <BaseButton variant="secondary" @click="router.back()">뒤로가기</BaseButton>
    </BaseCard>

    <BaseCard v-else>
      <!-- novalidate 이유는 RecordCreateView.vue와 동일 — 네이티브 검증 팝업이 한글 에러 메시지보다 먼저 뜨는 것을 막는다 -->
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

        <div v-if="existingMedia.length > 0" class="record-form__field">
          <span class="record-form__label">현재 첨부</span>
          <ul class="record-form__existing-media-list">
            <li
              v-for="media in existingMedia"
              :key="media.mediaNum"
              class="record-form__existing-media-item"
              :class="{ 'is-pending-delete': deleteMediaNums.includes(media.mediaNum) }"
            >
              <img v-if="media.mediaType === 'IMAGE'" :src="media.mediaUrl" alt="기존 첨부 사진" />
              <div v-else class="record-form__existing-youtube">
                <iframe :src="media.mediaUrl" title="기존 YouTube 영상" frameborder="0" allowfullscreen></iframe>
              </div>
              <label class="record-form__delete-toggle">
                <input
                  type="checkbox"
                  :checked="deleteMediaNums.includes(media.mediaNum)"
                  @change="toggleDeleteMedia(media.mediaNum)"
                />
                {{ deleteMediaNums.includes(media.mediaNum) ? '삭제 취소' : '삭제' }}
              </label>
            </li>
          </ul>
        </div>

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
          <span class="record-form__hint">{{ retainedImageCount }}장 유지 예정 · 기존 사진을 포함해 최대 {{ MAX_IMAGE_COUNT }}장까지 등록할 수 있어요.</span>
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
          label="YouTube 영상 주소 추가"
          type="url"
          :error-message="youtubeError"
        />

        <div class="record-form__actions">
          <BaseButton type="button" variant="secondary" :disabled="saveStatus === 'saving'" @click="router.back()">
            취소
          </BaseButton>
          <BaseButton type="submit" :disabled="saveStatus === 'saving'">
            {{ saveStatus === 'saving' ? '저장 중...' : '수정 완료' }}
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

.record-form__status {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-4);
  color: var(--color-text-secondary);
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

.record-form__existing-media-list,
.record-form__preview-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: var(--space-2);
}

.record-form__existing-media-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.record-form__existing-media-item img,
.record-form__existing-youtube {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

.record-form__existing-youtube iframe {
  width: 100%;
  height: 100%;
  border-radius: var(--radius-sm);
}

.record-form__existing-media-item.is-pending-delete {
  opacity: 0.5;
}

.record-form__delete-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--color-error);
  cursor: pointer;
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
