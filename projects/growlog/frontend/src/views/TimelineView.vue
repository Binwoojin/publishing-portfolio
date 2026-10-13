<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { LayoutGrid, NotebookText, Target } from '@lucide/vue'
import { fetchTimeline } from '../api/timeline.api'
import type { TimelineFilter, TimelineResponse } from '../types/timeline'
import { formatTimelineDate } from '../utils/date'
import AppNav from '../components/common/AppNav.vue'
import BaseBadge from '../components/common/BaseBadge.vue'
import BaseButton from '../components/common/BaseButton.vue'
import BaseCard from '../components/common/BaseCard.vue'
import LoadingSkeleton from '../components/common/LoadingSkeleton.vue'

/*
 * TimelineItem Discriminated Union 타입으로 목표/기록을 안전하게 분기해서
 * 보여준다. 백엔드 TimelineService.getTimeline()이 이미 두 도메인을 하나로
 * 합쳐 최신순 정렬까지 해서 내려주므로, 프론트에서 별도로
 * normalizeTimeline() 병합 로직을 만들 필요가 없다 — 그대로 렌더링만 한다.
 */
const timeline = ref<TimelineResponse | null>(null)
const status = ref<'loading' | 'success' | 'error'>('loading')
const filter = ref<TimelineFilter>('ALL')

const filteredItems = computed(() => {
  if (!timeline.value) return []
  if (filter.value === 'ALL') return timeline.value.timelineItems
  return timeline.value.timelineItems.filter((item) => item.type === filter.value)
})

onMounted(async () => {
  try {
    timeline.value = await fetchTimeline()
    status.value = 'success'
  } catch {
    status.value = 'error'
  }
})
</script>

<template>
  <main class="timeline">
    <header class="timeline__header">
      <div class="timeline__heading">
        <h1>타임라인</h1>
        <p v-if="timeline" class="timeline__subtitle">
          {{ timeline.selectedMonth }} · 목표 {{ timeline.monthlyGoalCount }}개 · 기록 {{ timeline.monthlyRecordCount }}개
        </p>
      </div>
      <AppNav />
    </header>

    <nav v-if="status === 'success'" class="timeline__filter" aria-label="타임라인 필터">
      <BaseButton :variant="filter === 'ALL' ? 'primary' : 'secondary'" @click="filter = 'ALL'">
        <LayoutGrid :size="14" :stroke-width="1.75" />
        전체
      </BaseButton>
      <BaseButton :variant="filter === 'GOAL' ? 'primary' : 'secondary'" @click="filter = 'GOAL'">
        <Target :size="14" :stroke-width="1.75" />
        목표
      </BaseButton>
      <BaseButton :variant="filter === 'RECORD' ? 'primary' : 'secondary'" @click="filter = 'RECORD'">
        <NotebookText :size="14" :stroke-width="1.75" />
        기록
      </BaseButton>
    </nav>

    <LoadingSkeleton v-if="status === 'loading'" :count="3" />

    <p v-else-if="status === 'error'" class="timeline__status timeline__status--error">
      데이터를 불러오지 못했어요. 잠시 후 다시 시도해주세요.
    </p>

    <template v-else-if="timeline">
      <p v-if="filteredItems.length === 0" class="timeline__status">
        {{
          filter === 'ALL'
            ? '아직 이번 달 기록이 없어요. 오늘의 성장을 기록해보세요.'
            : filter === 'GOAL'
              ? '이번 달 등록한 목표가 없어요.'
              : '이번 달 작성한 성장 기록이 없어요.'
        }}
      </p>

      <ul v-else class="timeline__list">
        <li v-for="item in filteredItems" :key="`${item.type}-${item.itemNum}`" class="timeline__node">
          <RouterLink v-if="item.type === 'RECORD'" :to="item.detailUrl" class="timeline-item-link">
            <BaseCard class="timeline-item timeline-item--clickable">
              <div class="timeline-item__head">
                <BaseBadge variant="success">
                  <NotebookText :size="12" :stroke-width="1.75" />
                  성장 기록
                </BaseBadge>
                <span class="timeline-item__date">{{ formatTimelineDate(item.createdAt) }}</span>
              </div>
              <p class="timeline-item__title">{{ item.title }}</p>
              <p class="timeline-item__meta">{{ item.content }}</p>
            </BaseCard>
          </RouterLink>
          <BaseCard v-else class="timeline-item">
            <div class="timeline-item__head">
              <BaseBadge variant="primary">
                <Target :size="12" :stroke-width="1.75" />
                목표
              </BaseBadge>
              <span class="timeline-item__date">{{ formatTimelineDate(item.createdAt) }}</span>
            </div>
            <p class="timeline-item__title">{{ item.title }}</p>
            <p class="timeline-item__meta">{{ item.content }}</p>
          </BaseCard>
        </li>
      </ul>
    </template>
  </main>
</template>

<style scoped>
.timeline {
  max-width: 640px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.timeline__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-4);
}

.timeline__header h1 {
  font-size: var(--font-size-page-title);
  font-weight: var(--font-weight-bold);
}

.timeline__subtitle {
  margin: var(--space-1) 0 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.timeline__filter {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.timeline__status {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.timeline__status--error {
  color: var(--color-error);
}

/*
 * Timeline은 GrowLog의 핵심 브랜드 화면이라 Dashboard의 rail보다 한 단계
 * 더 또렷하게(점 8px, 선 1.5px) 만들었다. Goal/Record 종류는 여전히
 * rail 색으로 구분하지 않고 중립/Soft Green 톤으로 통일한다 — 종류
 * 구분은 카드 내부의 BaseBadge+아이콘에만 맡기고, rail은 "시간에 따라
 * 기록이 이어진다"는 흐름만 보여준다.
 */
.timeline__list {
  position: relative;
  list-style: none;
  margin: 0;
  padding: 0 0 0 var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.timeline__list::before {
  content: '';
  position: absolute;
  left: 3px;
  top: 12px;
  bottom: 12px;
  width: 1.5px;
  background: var(--color-primary-bg);
}

.timeline__node {
  position: relative;
}

.timeline__node::before {
  content: '';
  position: absolute;
  left: calc(-1 * var(--space-6) + 1px);
  top: 12px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-accent);
  border: 2px solid var(--color-bg);
}

.timeline-item-link {
  display: block;
  text-decoration: none;
  color: inherit;
}

.timeline-item {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

/* 터치 기기에서 hover가 눌어붙지 않도록 포인터가 실제로 있는 환경에서만, 클릭 가능한(기록) 카드에만 적용 */
@media (hover: hover) and (pointer: fine) {
  .timeline-item--clickable:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-elevated);
  }
}

.timeline-item__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.timeline-item__date {
  color: var(--color-text-secondary);
  font-size: 12px;
}

/* Day One — 콘텐츠(제목/본문) 자체가 중심이 되도록 줄간격을 넉넉하게 */
.timeline-item__title {
  margin: var(--space-3) 0 0;
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-lg);
  line-height: 1.5;
}

.timeline-item__meta {
  margin: var(--space-2) 0 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: 1.6;
}
</style>
