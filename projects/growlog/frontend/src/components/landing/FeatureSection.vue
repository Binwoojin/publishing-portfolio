<script setup lang="ts">
import { Flame, LayoutDashboard, NotebookPen, NotebookText, Route, Target } from '@lucide/vue'
import { useInViewOnce } from '../../composables/useInViewOnce'

/*
 * 주요 기능 — 동일한 카드 4장을 나열하는 grid 대신, GrowLog의 각 기능을
 * "실제 화면이 어떻게 보이는가"를 곁들인 Product Story row로 보여준다.
 * 4개 row는 내부 구성을 서로 다르게 짜서(공용 프리뷰 템플릿을 억지로
 * 재사용하지 않음) "똑같은 카드 반복"으로 읽히지 않게 했다.
 *
 * Desktop은 텍스트/프리뷰가 row마다 좌우로 번갈아 배치된다(01/03은
 * 텍스트-왼쪽, 02/04는 텍스트-오른쪽 — `.story--reverse`로 시각 순서만
 * 뒤집는다). 마크업 순서는 모든 row에서 항상 "텍스트 먼저"이므로, 좁은
 * 화면에서 column으로 쌓일 때 row-reverse가 꺼지기만 해도 4개 row 모두
 * 자동으로 텍스트 → 프리뷰 순서가 된다 — 읽기 순서가 row마다 뒤섞이지
 * 않는다.
 *
 * Motion Language는 3개 계열로 제한한다:
 *   A. Progress               → Goal row (progress bar가 0에서 채워진다)
 *   B. Accumulation/Connection → Record + Timeline row가 공유
 *      (기록 항목이 추가되듯 나타나거나 / 점과 선이 이어진다)
 *   C. Reveal/Highlight       → Dashboard row (요약 항목이 순서대로
 *      나타난다, count-up은 쓰지 않는다)
 * 4개 row가 서로 완전히 다른 애니메이션 시스템이 되지 않도록, 모든
 * row는 텍스트/프리뷰가 opacity+translateY로 나타나는 공통 베이스를
 * 쓰고, family마다 그 위에 한 가지 요소만 얹는다.
 *
 * 프리뷰에 쓰는 정보는 실제 GrowLog 기능 범위를 넘지 않는다 — Record는
 * 아직 Create/Detail 화면이 없어서 Timeline의 Record 항목 형태까지만
 * 표현하고, 입력 폼처럼 보이는 UI는 만들지 않는다.
 *
 * row마다 useInViewOnce()를 하나씩(총 4개) 쓴다 — 그리드 전체를 한
 * observer로 묶으면 row별로 다른 트리거 시점을 줄 수 없다. 4개 정도는
 * 인스턴스 수가 늘어나는 것 치고 감당 가능한 범위로 판단했다(prefers-
 * reduced-motion이면 애초에 observer 자체가 만들어지지 않는다).
 */
const { target: goalTarget, isVisible: goalVisible, motionEnabled: goalMotion } = useInViewOnce()
const { target: recordTarget, isVisible: recordVisible, motionEnabled: recordMotion } = useInViewOnce()
const {
  target: timelineTarget,
  isVisible: timelineVisible,
  motionEnabled: timelineMotion,
} = useInViewOnce()
const {
  target: dashboardTarget,
  isVisible: dashboardVisible,
  motionEnabled: dashboardMotion,
} = useInViewOnce()
</script>

<template>
  <section class="feature-section">
    <h2 class="feature-section__title">주요 기능</h2>

    <div class="feature-section__rows">
      <!-- 01 목표 관리 — Progress -->
      <div
        :ref="(el) => (goalTarget = el as HTMLElement | null)"
        class="story story--goal"
        :class="{ 'will-reveal': goalMotion, 'is-visible': goalVisible }"
      >
        <div class="story__text">
          <p class="story__number">01</p>
          <h3 class="story__title">
            <Target :size="20" :stroke-width="1.75" />
            목표 관리
          </h3>
          <p class="story__description">이루고 싶은 목표를 정하고, 진행 상황을 스스로 확인합니다.</p>
        </div>

        <div class="story__preview" aria-hidden="true">
          <div class="story__goal-card">
            <div class="story__goal-meta">
              <span class="story__goal-category">커리어</span>
              <span class="story__goal-status">진행 중</span>
            </div>
            <p class="story__goal-title">포트폴리오 완성하기</p>
            <div class="story__goal-track">
              <div class="story__goal-fill" />
            </div>
            <span class="story__goal-percent">72%</span>
          </div>
        </div>
      </div>

      <!-- 02 성장 기록 — Accumulation/Connection -->
      <div
        :ref="(el) => (recordTarget = el as HTMLElement | null)"
        class="story story--record story--reverse"
        :class="{ 'will-reveal': recordMotion, 'is-visible': recordVisible }"
      >
        <div class="story__text">
          <p class="story__number">02</p>
          <h3 class="story__title">
            <NotebookPen :size="20" :stroke-width="1.75" />
            성장 기록
          </h3>
          <p class="story__description">하루의 과정, 생각, 변화를 짧게 남깁니다.</p>
        </div>

        <div class="story__preview" aria-hidden="true">
          <div class="story__record-list">
            <div class="story__record-item">
              <span class="story__record-date">9월 12일</span>
              <p class="story__record-body">포트폴리오 프로젝트 구조를 정리했다.</p>
            </div>
            <div class="story__record-item story__record-item--new">
              <span class="story__record-date">9월 14일</span>
              <p class="story__record-body">배포 환경 설정까지 마쳤다.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 03 성장 타임라인 — Accumulation/Connection (Record와 같은 계열) -->
      <div
        :ref="(el) => (timelineTarget = el as HTMLElement | null)"
        class="story story--timeline"
        :class="{ 'will-reveal': timelineMotion, 'is-visible': timelineVisible }"
      >
        <div class="story__text">
          <p class="story__number">03</p>
          <h3 class="story__title">
            <Route :size="20" :stroke-width="1.75" />
            성장 타임라인
          </h3>
          <p class="story__description">목표와 기록이 시간에 따라 어떻게 이어졌는지 확인합니다.</p>
        </div>

        <div class="story__preview" aria-hidden="true">
          <div class="story__timeline-card">
            <ol class="story__timeline">
              <li class="story__timeline-node story__timeline-node--goal">
                <span class="story__timeline-dot" />
                <span class="story__timeline-label">포트폴리오 완성하기 목표 등록</span>
              </li>
              <li class="story__timeline-node">
                <span class="story__timeline-dot" />
                <span class="story__timeline-label">배포 환경 설정 기록 추가</span>
              </li>
              <li class="story__timeline-node">
                <span class="story__timeline-dot" />
                <span class="story__timeline-label">진행률 72%로 갱신</span>
              </li>
            </ol>
          </div>
        </div>
      </div>

      <!-- 04 성장 대시보드 — Reveal/Highlight -->
      <div
        :ref="(el) => (dashboardTarget = el as HTMLElement | null)"
        class="story story--dashboard story--reverse"
        :class="{ 'will-reveal': dashboardMotion, 'is-visible': dashboardVisible }"
      >
        <div class="story__text">
          <p class="story__number">04</p>
          <h3 class="story__title">
            <LayoutDashboard :size="20" :stroke-width="1.75" />
            성장 대시보드
          </h3>
          <p class="story__description">쌓인 기록과 목표 진행 상황을 한눈에 돌아봅니다.</p>
        </div>

        <div class="story__preview" aria-hidden="true">
          <div class="story__dashboard-card">
            <div class="story__dashboard-stat">
              <p class="story__dashboard-value">12</p>
              <p class="story__dashboard-label">이번 달 기록</p>
            </div>
            <div class="story__dashboard-stat">
              <p class="story__dashboard-value">3</p>
              <p class="story__dashboard-label">진행 중 목표</p>
            </div>
            <div class="story__dashboard-stat story__dashboard-stat--highlight">
              <p class="story__dashboard-value">
                <Flame :size="13" :stroke-width="1.75" />
                7일
              </p>
              <p class="story__dashboard-label">연속 기록</p>
            </div>
            <p class="story__dashboard-recent">
              <NotebookText :size="13" :stroke-width="1.75" />
              최근 활동: 배포 환경 설정 기록 추가
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.feature-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: calc(var(--space-12) * 1.2) var(--space-8);
}

@media (max-width: 1199px) {
  .feature-section {
    padding-left: var(--space-6);
    padding-right: var(--space-6);
  }
}

@media (max-width: 767px) {
  .feature-section {
    padding-left: var(--space-4);
    padding-right: var(--space-4);
  }
}

.feature-section__title {
  margin: 0 0 calc(var(--space-12) * 1.2);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-weight-semibold);
  line-height: 1.35;
  letter-spacing: -0.015em;
  text-align: left;
  word-break: keep-all;
  overflow-wrap: break-word;
  text-wrap: balance;
}

/* 기존 4-card grid의 gap(var(--space-6)=24px)보다 넓되, 늘어져 보이지
   않는 범위(96~144px)로 뒀다 */
.feature-section__rows {
  display: flex;
  flex-direction: column;
  gap: 112px;
}

/*
 * 2-column grid — text 40% / preview 60% 역할 비율을 row 방향과
 * 무관하게 항상 유지한다. 이전엔 `order`만 바꿔서 시각 순서를
 * 뒤집었는데, grid-template-columns 자체는 그대로였기 때문에(항상
 * "좁은 col1 + 넓은 col2"), reverse row(02/04)에서는 물리적으로 왼쪽
 * col1에 온 preview가 좁아지고 오른쪽 col2에 온 text가 넓어져 버렸다
 * (역할과 실제 폭이 뒤바뀜). 지금은 `.story--reverse`에서
 * grid-template-columns 자체를 "넓은 col1 + 좁은 col2"로 다시 정의해서
 * order로 물리적 위치를 옮기더라도 preview는 항상 60%, text는 항상
 * 40%를 쓰게 했다.
 */
.story {
  display: grid;
  grid-template-columns: minmax(260px, 0.4fr) minmax(340px, 0.6fr);
  align-items: center;
  gap: var(--space-8);
}

.story--reverse {
  grid-template-columns: minmax(340px, 0.6fr) minmax(260px, 0.4fr);
}

.story__text {
  order: 1;
  min-width: 0;
  max-width: 420px;
}

.story__preview {
  order: 2;
}

.story--reverse .story__text {
  order: 2;
}

.story--reverse .story__preview {
  order: 1;
}

.story__number {
  margin: 0 0 var(--space-2);
  font-size: 13px;
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.06em;
  color: var(--color-primary);
}

.story__title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0 0 var(--space-3);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  letter-spacing: -0.01em;
  word-break: keep-all;
}

.story__title svg {
  color: var(--color-primary);
  flex-shrink: 0;
}

.story__description {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  line-height: 1.7;
  letter-spacing: -0.003em;
  word-break: keep-all;
  overflow-wrap: break-word;
  text-wrap: pretty;
}

/*
 * Preview 영역의 bounding box(폭/최소 높이/정렬)를 4개 row 전부
 * 동일하게 둔다 — 안의 카드 내용(Goal/Record/Timeline/Dashboard)은
 * 서로 달라도, "Preview가 들어가는 슬롯" 자체는 하나의 시스템처럼
 * 보이게 하기 위함이다.
 */
.story__preview {
  min-width: 0;
  width: 100%;
  min-height: 220px;
  display: flex;
  align-items: center;
}

.story__preview > * {
  width: 100%;
}

/*
 * ===== 01 Goal preview — Progress family =====
 * Color Rhythm: Goal은 Primary Green emphasis — 상단에 Primary Green
 * accent bar를 둬서 "진행 중" 상태를 색으로도 드러낸다(4개 preview가
 * 전부 같은 흰 카드로 보이지 않도록 Green family 안에서 조금씩 다른
 * 강조를 준다).
 */
.story__goal-card {
  padding: var(--space-6);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-top: 3px solid var(--color-primary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
}

.story__goal-meta {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.story__goal-category,
.story__goal-status {
  padding: 2px var(--space-2);
  border-radius: 999px;
  background: var(--color-bg);
  color: var(--color-text-secondary);
  font-size: 11px;
  font-weight: var(--font-weight-medium);
}

.story__goal-status {
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

.story__goal-title {
  margin: 0 0 var(--space-4);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.story__goal-track {
  height: 8px;
  border-radius: 999px;
  background: var(--color-bg);
  overflow: hidden;
}

.story__goal-fill {
  width: 72%;
  height: 100%;
  border-radius: 999px;
  background: var(--color-primary);
  transition: width 0.7s ease;
  transition-delay: 150ms;
}

.story__goal-percent {
  display: block;
  margin-top: var(--space-1);
  text-align: right;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
}

.story--goal.will-reveal .story__goal-fill {
  width: 0%;
}

.story--goal.will-reveal.is-visible .story__goal-fill {
  width: 72%;
}

/*
 * ===== 02 Record preview — Accumulation/Connection family =====
 * record-list 자체는 폭 제한을 두지 않는다 — preview column(60%)을
 * 그대로 채운다. 넓은 column 안에서 카드 2장만 있으면 비어 보이기
 * 쉬워서, 카드 padding/gap을 다른 preview보다 조금 더 넉넉하게 줘서
 * 공간감을 만들었다.
 */
.story__record-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.story__record-item {
  padding: var(--space-6);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
}

/*
 * Color Rhythm: Record는 Warm neutral / Accent emphasis — 날짜를
 * 옅은 Accent 배지로 둬서 "매일 조금씩 쌓인다"는 톤을 Goal의 Primary
 * Green과는 다른 결로 표현한다.
 */
.story__record-date {
  display: inline-block;
  padding: 1px var(--space-2);
  border-radius: 999px;
  background: var(--color-accent);
  color: var(--color-text-primary);
  font-size: 11px;
  font-weight: var(--font-weight-medium);
}

.story__record-body {
  margin: var(--space-1) 0 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

/* 두 번째 항목이 조금 늦게 나타나서 "방금 추가된 기록"처럼 읽힌다 */
.story--record.will-reveal .story__record-item--new {
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.5s ease, transform 0.5s ease;
  transition-delay: 220ms;
}

.story--record.will-reveal.is-visible .story__record-item--new {
  opacity: 1;
  transform: translateY(0);
}

/*
 * ===== 03 Timeline preview — Record와 같은 Accumulation/Connection 계열 =====
 * 다른 세 preview(Goal/Record/Dashboard)는 전부 surface 카드 안에
 * 들어있는데 Timeline만 배경 없이 맨 리스트였다 — 그래서 넓은 preview
 * column 안에서 왼쪽에 붙은 좁은 내용처럼 보였다. 같은 surface 카드로
 * 감싸서 column 전체 폭을 안정적으로 차지하게 했다(line을 억지로
 * 가운데에 두지는 않는다 — 카드 자체가 폭을 채운다).
 */
/* Color Rhythm: Timeline은 Primary + Soft Green — 테두리를 중립 회색 대신 Soft Green으로 */
.story__timeline-card {
  padding: var(--space-6);
  background: var(--color-surface);
  border: 1px solid var(--color-primary-bg);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
}

.story__timeline {
  position: relative;
  margin: 0;
  padding-left: var(--space-6);
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.story__timeline::before {
  content: '';
  position: absolute;
  left: 3px;
  top: 0.4em;
  bottom: 0.4em;
  width: 1px;
  background: var(--color-border);
}

.story__timeline-node {
  position: relative;
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.story__timeline-dot {
  position: absolute;
  left: calc(-1 * var(--space-6));
  top: 0.35em;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-accent);
}

.story__timeline-node--goal .story__timeline-dot {
  background: var(--color-primary);
}

.story--timeline.will-reveal .story__timeline::before {
  transform: scaleY(0);
  transform-origin: top;
  transition: transform 0.6s ease;
}

.story--timeline.will-reveal.is-visible .story__timeline::before {
  transform: scaleY(1);
}

.story--timeline.will-reveal .story__timeline-node {
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.story--timeline.will-reveal.is-visible .story__timeline-node {
  opacity: 1;
  transform: translateY(0);
}

.story--timeline.will-reveal.is-visible .story__timeline-node:nth-child(2) {
  transition-delay: 140ms;
}

.story--timeline.will-reveal.is-visible .story__timeline-node:nth-child(3) {
  transition-delay: 280ms;
}

/* ===== 04 Dashboard preview — Reveal/Highlight family ===== */
.story__dashboard-card {
  padding: var(--space-6);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
}

.story__dashboard-stat {
  padding: var(--space-3) var(--space-2);
  background: var(--color-bg);
  border-radius: var(--radius-sm);
  text-align: center;
}

/* Color Rhythm: Dashboard는 Deep Green highlight — Hero 미니어처의 "연속 기록" 강조와 같은 언어 */
.story__dashboard-stat--highlight {
  background: var(--color-primary-hover);
}

.story__dashboard-stat--highlight .story__dashboard-value {
  color: var(--color-text-inverse);
}

.story__dashboard-stat--highlight .story__dashboard-label {
  color: rgba(255, 255, 255, 0.78);
}

.story__dashboard-value {
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
}

.story__dashboard-label {
  margin: 2px 0 0;
  font-size: 11px;
  color: var(--color-text-secondary);
}

.story__dashboard-recent {
  grid-column: 1 / -1;
  margin: var(--space-1) 0 0;
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: 11px;
  color: var(--color-text-secondary);
}

/* 요약 항목이 순서대로 나타난다 — count-up 없이 opacity/translateY stagger만 */
.story--dashboard.will-reveal .story__dashboard-stat,
.story--dashboard.will-reveal .story__dashboard-recent {
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.story--dashboard.will-reveal.is-visible .story__dashboard-stat,
.story--dashboard.will-reveal.is-visible .story__dashboard-recent {
  opacity: 1;
  transform: translateY(0);
}

.story--dashboard.will-reveal.is-visible .story__dashboard-stat:nth-child(2) {
  transition-delay: 90ms;
}

.story--dashboard.will-reveal.is-visible .story__dashboard-stat:nth-child(3) {
  transition-delay: 180ms;
}

.story--dashboard.will-reveal.is-visible .story__dashboard-recent {
  transition-delay: 270ms;
}

/*
 * 공통 베이스 — 모든 row는 텍스트와 프리뷰가 opacity/translateY로
 * 나타나는 걸 공유한다. family별 추가 동작(진행바 채움/항목 추가/
 * 점+선 연결/순차 강조)은 이 위에 살짝 늦게 얹힌다.
 */
.story.will-reveal .story__text,
.story.will-reveal .story__preview {
  opacity: 0;
  transform: translateY(14px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.story.will-reveal.is-visible .story__text,
.story.will-reveal.is-visible .story__preview {
  opacity: 1;
  transform: translateY(0);
}

.story.will-reveal.is-visible .story__preview {
  transition-delay: 80ms;
}

/*
 * Mobile(767px 이하) — 1-column으로 쌓고, order를 전부 초기화해서
 * desktop에서 `.story--reverse`가 준 순서 반전을 무효화한다. DOM은
 * 애초에 항상 text가 먼저이므로, order만 없애면 4개 row 전부 자동으로
 * text → preview 순서가 된다.
 */
@media (max-width: 767px) {
  .story {
    grid-template-columns: 1fr;
    gap: var(--space-6);
  }

  .story__text,
  .story--reverse .story__text,
  .story__preview,
  .story--reverse .story__preview {
    order: 0;
  }
}
</style>
