<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

/*
 * GrowLog의 대표 Visual Identity 섹션 — "기록 → 연결 → 축적 → 성장"을
 * 위에서 아래로 읽히는 Vertical Journey로 보여준다(Desktop 포함 전
 * 구간 동일 구조). 이전엔 Desktop에서 4단계가 가로로 나란히 배치돼
 * 있어서 "스크롤에 따라 순차 진입"이라는 신호 자체가 없었고(4개 노드가
 * 뷰포트 진입 시점이 사실상 동일), 그래서 섹션 전체 스크롤 진행률을
 * 계산해 4단계에 매핑하는 우회 로직이 필요했다. Vertical 구조에서는
 * 각 노드가 실제로 서로 다른 시점에 뷰포트에 들어오므로, 그 우회가
 * 필요 없다 — 노드마다 IntersectionObserver로 각자의 진입을 직접
 * 관찰하고(rAF scroll 리스너/진행률 계산 전부 제거), 뷰포트에
 * 들어오면 그 노드만 활성화하고 즉시 unobserve한다(monotonic — 이미
 * 활성화된 단계는 다시 비활성화하지 않는다).
 *
 * 연결선(rail)은 노드마다 개별 segment로 정확히 잇는 대신(문장이 몇
 * 줄로 줄바꿈될지 미리 알 수 없어 노드 중심 좌표를 CSS만으로 정확히
 * 계산할 수 없음), 활성화된 노드 수에 비례해 scaleY로 자라는 단일
 * 연속선 하나로 단순화했다 — "line이 아래로 성장한다"는 인터랙션은
 * 동일하게 유지된다.
 *
 * 01→04로 갈수록 노드 dot이 아주 조금씩 커지고(32→38px), 색이
 * --color-primary-bg → --color-accent → --color-primary → --color-
 * primary-hover 순으로 짙어진다 — "작은 기록이 점점 쌓여 성장한다"는
 * 걸 은유한다(이전 라운드와 동일한 언어를 유지).
 *
 * dot은 폭이 고정된 `.journey__marker`(38px, 가장 큰 dot 기준) 안에
 * 중앙 정렬로 담는다 — dot 자체의 지름이 단계마다 달라도(32~38px)
 * "슬롯" 폭은 항상 같아서, 그다음에 오는 text body의 시작 X좌표가 01
 * ~04 전부 정확히 동일하다(이전엔 dot을 곧바로 flex item으로 써서
 * dot이 커질수록 body가 밀리는 문제가 있었다). step별 text body
 * 오프셋도 전부 제거했다 — editorial variation보다 4단계 모두 같은
 * 수직 grid(같은 dot 기준선/같은 label·description 시작 X좌표/같은
 * dot→text gap)를 쓰는 정확한 정렬이 이 섹션에서는 더 중요하다.
 */
const steps = [
  { label: '방향을 정합니다', description: '지금 이루고 싶은 목표를 정합니다.' },
  { label: '오늘을 남깁니다', description: '작은 행동과 생각도 기록으로 남깁니다.' },
  { label: '시간이 쌓입니다', description: '기록들이 하루, 일주일, 한 달의 흐름으로 이어집니다.' },
  { label: '변화를 발견합니다', description: '쌓인 기록 속에서 내가 얼마나 달라졌는지 확인합니다.' },
]

const nodeRefs = ref<(Element | null)[]>([])
const activatedSteps = ref<boolean[]>(steps.map(() => false))
const journeyMotionEnabled = ref(false)
const activatedCount = computed(() => activatedSteps.value.filter(Boolean).length)
const railFraction = computed(() => activatedCount.value / steps.length)

function setNodeRef(el: Element | null, index: number) {
  nodeRefs.value[index] = el
}

let observer: IntersectionObserver | null = null

onMounted(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReducedMotion) {
    activatedSteps.value = activatedSteps.value.map(() => true)
    return
  }

  journeyMotionEnabled.value = true
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        const index = nodeRefs.value.indexOf(entry.target)
        if (index === -1) return
        activatedSteps.value[index] = true
        observer?.unobserve(entry.target)
      })
    },
    { threshold: 0.35, rootMargin: '0px 0px -20% 0px' },
  )
  nodeRefs.value.forEach((el) => el && observer?.observe(el))
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})
</script>

<template>
  <section class="journey">
    <h2 class="journey__title">작은 기록이 성장으로 이어지는 과정</h2>

    <ol
      class="journey__rail"
      :class="{ 'journey--motion': journeyMotionEnabled }"
      :style="{ '--rail-fraction': railFraction }"
    >
      <li
        v-for="(step, index) in steps"
        :key="step.label"
        :ref="(el) => setNodeRef(el as Element | null, index)"
        class="journey__node"
        :class="[`journey__node--${index}`, { 'is-active': activatedSteps[index] }]"
      >
        <span class="journey__marker" aria-hidden="true">
          <span class="journey__dot">{{ index + 1 }}</span>
        </span>
        <div class="journey__body">
          <p class="journey__label">{{ step.label }}</p>
          <p class="journey__description">{{ step.description }}</p>
        </div>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.journey {
  max-width: 1200px;
  margin: 0 auto;
  padding: calc(var(--space-12) * 1.2) var(--space-8);
}

@media (max-width: 1199px) {
  .journey {
    padding-left: var(--space-6);
    padding-right: var(--space-6);
  }
}

@media (max-width: 767px) {
  .journey {
    padding-left: var(--space-4);
    padding-right: var(--space-4);
  }
}

/*
 * Landing에서 성장의 전체 과정을 보여주는 유일한 섹션이라 제목은
 * 명확한 center로 둔다(다른 섹션의 left/editorial 톤과는 의도적으로
 * 다르게).
 */
.journey__title {
  margin: 0 auto var(--space-8);
  max-width: 640px;
  text-align: center;
  font-size: var(--font-size-section-title);
  font-weight: var(--font-weight-semibold);
  line-height: 1.35;
  letter-spacing: -0.015em;
  word-break: keep-all;
  overflow-wrap: break-word;
  text-wrap: balance;
}

/*
 * Rail은 640px로 좁혀 중앙에 두고, 위→아래로 읽히는 하나의 editorial
 * column으로 만든다. line은 dot들의 대략적인 중심(38px 최대 dot의
 * 절반=19px)에 맞춘 고정 left 좌표를 쓴다.
 */
.journey__rail {
  position: relative;
  list-style: none;
  margin: 0 auto;
  padding: 0;
  max-width: 640px;
  display: flex;
  flex-direction: column;
  gap: 56px;
}

/*
 * rail 자체를 단색이 아니라 노드와 같은 light→accent→primary→deep
 * progression을 담은 gradient로 둬서 "짙어지는 흐름"이 line에서도
 * 느껴지게 한다 — scaleY 애니메이션/observer 로직은 그대로다.
 */
.journey__rail::before {
  content: '';
  position: absolute;
  top: 6px;
  bottom: 6px;
  left: 19px;
  width: 2px;
  background: linear-gradient(
    180deg,
    var(--color-primary-bg) 0%,
    var(--color-accent) 38%,
    var(--color-primary) 68%,
    var(--color-primary-hover) 100%
  );
}

.journey--motion .journey__rail::before {
  transform: scaleY(var(--rail-fraction, 1));
  transform-origin: top;
  transition: transform 0.5s ease;
}

.journey__node {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
}

/*
 * 고정 폭 슬롯(가장 큰 dot 기준 38px) — dot 지름이 01~04마다 달라도
 * 이 슬롯 폭은 항상 같아서, line 기준선과 body 시작 X좌표가 단계마다
 * 절대 어긋나지 않는다.
 */
.journey__marker {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.journey__dot {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
}

/* 노드 크기(32→38px)와 색(연함→짙음)이 단계마다 아주 조금씩 진행된다 */
.journey__node--0 .journey__dot {
  width: 32px;
  height: 32px;
  background: var(--color-primary-bg);
  color: var(--color-text-primary);
}

.journey__node--1 .journey__dot {
  width: 34px;
  height: 34px;
  background: var(--color-accent);
  color: var(--color-text-primary);
}

.journey__node--2 .journey__dot {
  width: 36px;
  height: 36px;
  background: var(--color-primary);
  color: var(--color-text-inverse);
}

.journey__node--3 .journey__dot {
  width: 38px;
  height: 38px;
  background: var(--color-primary-hover);
  color: var(--color-text-inverse);
}

.journey__body {
  flex: 1;
  min-width: 0;
  padding-top: 6px;
}

.journey__label {
  margin: 0;
  font-weight: var(--font-weight-medium);
  transition: color 0.4s ease;
  word-break: keep-all;
}

/*
 * 마지막 단계("변화를 발견합니다")는 Journey의 도착 지점이라는 느낌을
 * 주기 위해 라벨만 살짝 더 강조한다 — 별도 카드/배경 없이 굵기와 색만
 * primary로 올린다.
 */
.journey__node--3 .journey__label {
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.journey__description {
  margin: var(--space-1) 0 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: 1.55;
  letter-spacing: -0.003em;
  word-break: keep-all;
  overflow-wrap: break-word;
  text-wrap: pretty;
}

/*
 * Progressive Enhancement — 기본 상태(.journey--motion 없음)는 이미 위
 * 색/크기 값 그대로 "전부 활성화된 최종 모습"이다. `.journey--motion`이
 * 붙어야만(JS가 motion을 켤 때만) line이 접히고 dot이 흐려진 대기
 * 상태로 시작해서, `.is-active`가 붙을 때마다(뷰포트 진입) 원래 모습
 * 으로 펼쳐진다.
 */
.journey--motion .journey__dot {
  opacity: 0.5;
  transform: scale(0.85);
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.journey--motion .journey__node.is-active .journey__dot {
  opacity: 1;
  transform: scale(1);
}

.journey--motion .journey__label {
  color: var(--color-text-secondary);
}

.journey--motion .journey__node.is-active .journey__label {
  color: var(--color-text-primary);
}

/* 마지막 단계는 motion 활성화 상태에서도 계속 primary 톤을 유지한다 */
.journey--motion .journey__node--3.is-active .journey__label {
  color: var(--color-primary);
}
</style>
