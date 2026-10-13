<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Flame, NotebookPen, NotebookText, Target } from '@lucide/vue'
import { useAuthStore } from '../stores/auth.store'
import { fetchDashboard } from '../api/dashboard.api'
import type { DashboardSummary } from '../types/dashboard'
import { formatTimelineDate } from '../utils/date'
import AppNav from '../components/common/AppNav.vue'
import BaseBadge from '../components/common/BaseBadge.vue'
import BaseButton from '../components/common/BaseButton.vue'
import BaseCard from '../components/common/BaseCard.vue'
import LoadingSkeleton from '../components/common/LoadingSkeleton.vue'

const authStore = useAuthStore()
const router = useRouter()

const summary = ref<DashboardSummary | null>(null)
const status = ref<'loading' | 'success' | 'error'>('loading')

onMounted(async () => {
  try {
    summary.value = await fetchDashboard()
    status.value = 'success'
  } catch {
    status.value = 'error'
  }
})

async function onLogout() {
  await authStore.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <main class="dashboard">
    <header class="dashboard__header">
      <div>
        <h1 class="dashboard__greeting">
          안녕하세요{{ authStore.user ? `, ${authStore.user.nickname}님` : '' }} 👋
        </h1>
        <p class="dashboard__subtitle">이번 달에도 꾸준히 성장하고 있어요.</p>
      </div>
      <div class="dashboard__actions">
        <AppNav />
        <BaseButton variant="ghost" @click="onLogout">로그아웃</BaseButton>
      </div>
    </header>

    <LoadingSkeleton v-if="status === 'loading'" :count="3" />

    <p v-else-if="status === 'error'" class="dashboard__status dashboard__status--error">
      데이터를 불러오지 못했어요. 잠시 후 다시 시도해주세요.
    </p>

    <template v-else-if="summary">
      <section class="dashboard__summary">
        <BaseCard class="summary-card">
          <p class="summary-card__value">{{ summary.recordsThisMonth }}</p>
          <p class="summary-card__label">이번 달 기록</p>
          <p class="summary-card__hint">꾸준히 기록하고 있어요.</p>
        </BaseCard>
        <BaseCard class="summary-card">
          <p class="summary-card__value">{{ summary.activeGoalCount }}</p>
          <p class="summary-card__label">진행 중인 목표</p>
          <!--
            activeGoalCount는 GoalService.countThisWeekInProgressGoals()를 그대로
            재사용한 값이라 "전체 진행중 목표"가 아니라 "이번 주에 등록한 진행중
            목표"다. 기존 JSP 홈 화면(home.jsp)도 같은 값을 같은 라벨로 보여주면서
            이 부연 문구로 범위를 명시하는 방식을 쓰고 있어서, 그 문구를 그대로
            가져와 통일했다. 집계 로직을 새로 만들지 않고 라벨/문구만 맞춘 것.
          -->
          <p class="summary-card__hint">이번 주 목표를 이어가고 있어요.</p>
        </BaseCard>
        <BaseCard class="summary-card">
          <p class="summary-card__value">
            <Flame :size="20" :stroke-width="1.75" class="summary-card__icon" />
            {{ summary.streakDays }}일
          </p>
          <p class="summary-card__label">연속 기록</p>
        </BaseCard>
      </section>

      <section class="dashboard__quick-actions">
        <BaseButton variant="primary" class="quick-action" @click="router.push({ name: 'goal-new' })">
          <Target :size="16" :stroke-width="1.75" />
          목표 추가
        </BaseButton>
        <BaseButton variant="secondary" class="quick-action" @click="router.push({ name: 'record-new' })">
          <NotebookPen :size="16" :stroke-width="1.75" />
          기록 남기기
        </BaseButton>
      </section>

      <section class="dashboard__timeline">
        <h2 class="dashboard__section-title">최근 타임라인</h2>

        <p v-if="summary.recentTimeline.length === 0" class="dashboard__status">
          아직 이번 달 기록이 없어요. 오늘의 성장을 기록해보세요.
        </p>

        <ul v-if="summary.recentTimeline.length > 0" class="dashboard__timeline-rail">
          <li v-for="item in summary.recentTimeline" :key="`${item.type}-${item.itemNum}`" class="dashboard__timeline-node">
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
      </section>
    </template>
  </main>
</template>

<style scoped>
.dashboard {
  max-width: 720px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.dashboard__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-4);
}

.dashboard__greeting {
  font-size: var(--font-size-page-title);
  font-weight: var(--font-weight-bold);
}

.dashboard__subtitle {
  margin: var(--space-1) 0 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.dashboard__actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: var(--space-4);
}

.dashboard__status {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.dashboard__status--error {
  color: var(--color-error);
}

/* Sunsama 원칙 — 숫자가 가장 먼저 읽히도록 카드 사이 여백을 넉넉하게 */
.dashboard__summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-6);
}

.summary-card {
  text-align: center;
}

/* 숫자가 가장 강하게, label이 그 다음, hint가 가장 약하게 — Sunsama 정보 위계 */
.summary-card__value {
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: var(--font-size-display);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.summary-card__icon {
  color: var(--color-primary);
}

.summary-card__label {
  margin: var(--space-2) 0 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.summary-card__hint {
  margin: var(--space-1) 0 0;
  color: var(--color-text-secondary);
  font-size: 12px;
  opacity: 0.75;
}

.dashboard__quick-actions {
  display: flex;
  gap: var(--space-4);
}

/* Summary Card보다 시각적으로 강해지지 않도록 크기를 작게 유지한다 */
.quick-action {
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-sm);
}

.dashboard__section-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  margin: 0 0 var(--space-4);
}

.dashboard__timeline {
  display: flex;
  flex-direction: column;
}

/*
 * Reflect의 점-선 연결 느낌을 Recent Timeline에도 적용한다. Goal/Record
 * 종류는 rail 색으로 구분하지 않고(중립/Soft Green 톤 통일) 카드 내부
 * BaseBadge로만 구분한다 — 이 rail의 목적은 "종류 구분"이 아니라
 * "시간에 따라 기록이 이어진다"는 흐름을 먼저 보여주는 것이다.
 */
.dashboard__timeline-rail {
  position: relative;
  list-style: none;
  margin: 0;
  padding: 0 0 0 var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.dashboard__timeline-rail::before {
  content: '';
  position: absolute;
  left: 3px;
  top: 10px;
  bottom: 10px;
  width: 1px;
  background: var(--color-primary-bg);
}

.dashboard__timeline-node {
  position: relative;
}

.dashboard__timeline-node::before {
  content: '';
  position: absolute;
  left: calc(-1 * var(--space-4));
  top: 10px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-accent);
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

.timeline-item__title {
  margin: var(--space-2) 0 0;
  font-weight: var(--font-weight-medium);
  line-height: 1.5;
}

.timeline-item__meta {
  margin: var(--space-1) 0 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: 1.6;
}

@media (max-width: 640px) {
  .dashboard__summary {
    grid-template-columns: 1fr;
  }
}
</style>
