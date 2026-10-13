<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'
import { useInViewOnce } from '../composables/useInViewOnce'
import BaseButton from '../components/common/BaseButton.vue'
import HeroSection from '../components/landing/HeroSection.vue'
import FeatureSection from '../components/landing/FeatureSection.vue'
import GrowthJourney from '../components/landing/GrowthJourney.vue'

/*
 * Landing Page — GrowLog가 어떤 서비스인지 설명하는 진입 화면.
 * 로그인 여부와 무관하게 누구나 볼 수 있다(router meta.public: true).
 * 로그인된 사용자를 강제로 Dashboard로 보내지 않고, CTA 라벨/이동 경로만
 * 로그인 상태에 맞춰 바꾼다.
 *
 * Header/Intro/Final CTA는 로직 없는 마크업이라 별도 컴포넌트로 분리하지
 * 않고 이 파일에 그대로 둔다. Hero/Feature/GrowthJourney만 분리했다.
 *
 * Header/Hero의 CTA 문구(ctaLabel)와 Final CTA의 문구(finalCtaLabel)는
 * 역할이 다르다 — Header/Hero는 "무엇인지 소개하고 바로 이동"이고, Final
 * CTA는 "성장 기록을 시작하라"는 클로징 메시지라 별도 computed로 둔다.
 */
const router = useRouter()
const authStore = useAuthStore()

const ctaLabel = computed(() => (authStore.isAuthenticated ? 'Dashboard로 이동' : '로그인하고 시작하기'))
const finalCtaLabel = computed(() => (authStore.isAuthenticated ? '내 성장 대시보드 보기' : '나의 성장 기록 시작하기'))

function goToCtaTarget() {
  router.push({ name: authStore.isAuthenticated ? 'dashboard' : 'login' })
}

/*
 * "Why GrowLog" — 문제 제기 3개 + GrowLog의 역할을 설명하는 결론 문장을
 * 카드/불릿 리스트가 아니라 번호가 붙은 editorial statement로 보여준다.
 * 번호 색은 --color-accent → --color-primary → --color-primary-hover
 * 순으로 짙어진다(Growth Journey의 노드 색 진행과 같은 언어) — 크기는
 * 카피보다 강해 보이지 않도록 작게 제한한다.
 *
 * 이전엔 문장마다 margin-left(0/48/96px)로 계단처럼 들여썼는데, 그
 * 결과 Desktop(1200px)에서 오른쪽 절반이 통째로 비고 "tab 들여쓰기"
 * 처럼만 보였다. 지금은 각 statement를 2-column editorial row(text|
 * visual, 01/03은 text-left, 02는 order로 좌우를 뒤집어 visual-left)
 * 로 바꿔서 좌우 공간을 실제로 다 쓴다 — text 자체의 들여쓰기는 없고,
 * row 전체의 좌우 배치로만 비대칭을 만든다.
 */
const whyGrowLogPoints = [
  { number: '01', text: '계획은 세웠지만, 시간이 지나면 왜 시작했는지 잊기 쉽습니다.' },
  { number: '02', text: '하루의 변화는 작아서, 기록하지 않으면 그 과정은 금방 사라집니다.' },
  { number: '03', text: '기록이 쌓이면 내가 어떻게 달라졌는지 더 분명하게 볼 수 있습니다.' },
]

/*
 * 문장마다 개별 IntersectionObserver 대상으로 두고, 뷰포트에 들어오면
 * opacity/translateY로 한 번만 나타난다(다시 숨기지 않음/unobserve).
 * Growth Journey와 달리 여기는 rail/connector 선을 쓰지 않으므로 진행률
 * 계산이 필요 없다 — 항목별 상태만 추적하면 된다.
 */
const pointRefs = ref<(Element | null)[]>([])
const revealedPoints = ref<boolean[]>(whyGrowLogPoints.map(() => false))
const whyMotionEnabled = ref(false)

function setPointRef(el: Element | null, index: number) {
  pointRefs.value[index] = el
}

let whyObserver: IntersectionObserver | null = null

onMounted(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReducedMotion) {
    revealedPoints.value = revealedPoints.value.map(() => true)
    return
  }

  whyMotionEnabled.value = true
  whyObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        const index = pointRefs.value.indexOf(entry.target)
        if (index === -1) return
        revealedPoints.value[index] = true
        whyObserver?.unobserve(entry.target)
      })
    },
    { threshold: 0.4, rootMargin: '0px 0px -10% 0px' },
  )
  pointRefs.value.forEach((el) => el && whyObserver?.observe(el))
})

onBeforeUnmount(() => {
  whyObserver?.disconnect()
  whyObserver = null
})

const {
  target: finalCtaTarget,
  isVisible: finalCtaVisible,
  motionEnabled: finalCtaMotion,
} = useInViewOnce()
</script>

<template>
  <div class="landing">
    <header class="landing-header">
      <div class="landing-header__inner">
        <span class="landing-header__logo">GrowLog</span>
        <nav class="landing-header__nav" aria-label="페이지 내 이동">
          <a href="#intro">GrowLog 소개</a>
          <a href="#features">주요 기능</a>
        </nav>
        <BaseButton variant="secondary" @click="goToCtaTarget">
          {{ authStore.isAuthenticated ? 'Dashboard로 이동' : '로그인' }}
        </BaseButton>
      </div>
    </header>

    <div class="hero-band">
      <HeroSection :cta-label="ctaLabel" @cta="goToCtaTarget" />
    </div>

    <div class="intro-band">
      <section id="intro" class="intro">
      <h2 class="intro__title">성장은 눈에 잘 보이지 않습니다.</h2>

      <div class="intro__statements">
        <div
          v-for="(point, index) in whyGrowLogPoints"
          :key="point.number"
          :ref="(el) => setPointRef(el as Element | null, index)"
          class="intro__statement"
          :class="[`intro__statement--${index}`, { 'points--motion': whyMotionEnabled, 'is-visible': revealedPoints[index] }]"
        >
          <div class="intro__statement-copy">
            <span class="intro__statement-number">{{ point.number }}</span>
            <span class="intro__statement-text">{{ point.text }}</span>
          </div>

          <!-- 01 — 흐릿해지는 목표: 처음엔 체크된 목표 하나가 선명했지만, 아래로 갈수록 미확인 상태로 옅어진다 -->
          <div v-if="index === 0" class="intro__visual intro__visual--fade" aria-hidden="true">
            <span class="intro__fade-row intro__fade-row--1">
              <span class="intro__fade-check intro__fade-check--done" />
              <span class="intro__fade-bar" />
            </span>
            <span class="intro__fade-row intro__fade-row--2">
              <span class="intro__fade-check" />
              <span class="intro__fade-bar" />
            </span>
            <span class="intro__fade-row intro__fade-row--3">
              <span class="intro__fade-check" />
              <span class="intro__fade-bar" />
            </span>
          </div>

          <!-- 02 — 기록되지 않은 작은 변화: 연결선 없이 흩어진 옅은 조각들 -->
          <div v-else-if="index === 1" class="intro__visual intro__visual--scatter" aria-hidden="true">
            <span class="intro__scatter-dot intro__scatter-dot--1" />
            <span class="intro__scatter-dot intro__scatter-dot--2" />
            <span class="intro__scatter-dot intro__scatter-dot--3" />
            <span class="intro__scatter-dot intro__scatter-dot--4" />
            <span class="intro__scatter-dot intro__scatter-dot--5" />
            <span class="intro__scatter-bar intro__scatter-bar--1" />
            <span class="intro__scatter-bar intro__scatter-bar--2" />
          </div>

          <!-- 03 — 축적: record surface 3장이 겹쳐 쌓이고, 맨 위가 가장 선명하다 -->
          <div v-else class="intro__visual intro__visual--stack" aria-hidden="true">
            <span class="intro__stack-card intro__stack-card--1" />
            <span class="intro__stack-card intro__stack-card--2" />
            <span class="intro__stack-card intro__stack-card--3" />
          </div>
        </div>
      </div>

      <span class="intro__conclusion-rule" aria-hidden="true" />
      <p class="intro__conclusion">
        GrowLog는 흘려보내기 쉬운 작은 변화들을 기록으로 남기고, 그 안에서
        나의 성장을 발견할 수 있도록 돕습니다.
      </p>
    </section>
    </div>

    <div id="features" class="features-band">
      <FeatureSection />
    </div>

    <div class="journey-band">
      <GrowthJourney />
    </div>

    <div class="final-cta-band">
      <section
        :ref="(el) => (finalCtaTarget = el as HTMLElement | null)"
        class="final-cta"
        :class="{ 'will-reveal': finalCtaMotion, 'is-visible': finalCtaVisible }"
      >
        <h2 class="final-cta__title">당신의 성장은 이미 시작되고 있습니다.</h2>
        <p class="final-cta__text">
          오늘의 목표와 작은 변화를 GrowLog에 기록해보세요. 쌓인 기록은 시간이
          지나 당신의 성장 과정을 보여줍니다.
        </p>
        <BaseButton variant="primary" @click="goToCtaTarget">{{ finalCtaLabel }}</BaseButton>
      </section>
    </div>
  </div>
</template>

<style scoped>
/*
 * Landing 전용 컬러 토큰 — 전역 tokens.css는 건드리지 않는다(Application
 * UI는 계속 Calm하게 유지). `.landing`(실제 DOM 트리 최상위)에 커스텀
 * 프로퍼티로 선언하면 Hero/FeatureSection/GrowthJourney 등 자식
 * 컴포넌트에서도(별도 Vue SFC라도 실제 렌더링된 DOM은 `.landing`의
 * 자손이므로) 그대로 상속되어 쓸 수 있다.
 *
 * --landing-green-deep — 기존 --color-primary-hover(#35694F)보다 한
 * 단계 더 짙은 Green. Final CTA를 Landing의 color climax로 만들 때,
 * 배경 자체를 --color-primary로 쓰면 그 위에 얹는 --color-primary
 * 버튼(BaseButton variant="primary")이 배경과 거의 같은 색이 되어
 * 묻혀버린다. 버튼은 전역 컴포넌트라 여기서 손대지 않고, 대신 배경만
 * 한 단계 더 짙게 둬서 버튼이 뚜렷하게 떠 보이게 한다.
 */
.landing {
  --landing-green-deep: #142c22;
}

/*
 * `.landing`은 원래 `display:flex; flex-direction:column`이었는데,
 * 여기 직접 자식인 `.hero`/`.intro`/`.journey`(GrowthJourney 루트)는
 * 각자 `max-width` + `margin:0 auto`로 스스로 중앙 정렬한다. flex
 * item에 cross-axis auto margin이 있으면(column flex의 cross axis는
 * 가로) stretch 대신 content-fit 크기로 줄어드는 flexbox 스펙 동작
 * 때문에, 이 섹션들이 max-width를 못 채우고 내용 크기만큼만 줄어들어
 * 섹션마다 좌우 기준선이 제각각으로 보였다(Feature/Final CTA는 래퍼
 * div 안에 있어서 영향을 안 받았음). flex를 안 쓰는 일반 block으로
 * 바꾸면 모든 섹션이 표준 block+margin:auto 중앙 정렬을 받는다 — 이
 * 레벨에서 flex가 필요한 이유가 원래 없었다(gap/justify 등 미사용).
 */

/*
 * 상단 네비게이션 바는 페이지 캔버스(Background)와 구분되는 Surface로
 * 둔다. background/border는 full-width, 안쪽 내용만 다른 섹션과 같은
 * container(max-width 1200px + 공통 padding)를 써서 logo/button의
 * 좌우 기준선이 Hero copy/scene과 맞도록 한다.
 */
.landing-header {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.landing-header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-4);
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-4) var(--space-8);
}

@media (max-width: 1199px) {
  .landing-header__inner {
    padding-left: var(--space-6);
    padding-right: var(--space-6);
  }
}

@media (max-width: 767px) {
  .landing-header__inner {
    padding-left: var(--space-4);
    padding-right: var(--space-4);
  }
}

.landing-header__logo {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
}

.landing-header__nav {
  display: flex;
  gap: var(--space-4);
}

.landing-header__nav a {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  text-decoration: none;
}

.landing-header__nav a:hover {
  color: var(--color-primary);
}

/*
 * Section Band — Hero/Why GrowLog/주요 기능/Growth Journey가 전부 같은
 * 배경 위에 이어져서 서로 다른 chapter라는 구분감이 부족했다. 카드로
 * 감싸는 대신(다시 SaaS 템플릿처럼 보이는 걸 피하기 위해) full-bleed
 * background band + 아주 얇은 divider 조합으로만 구분한다. 배경/
 * divider는 이 wrapper가 담당하고, 안쪽 콘텐츠의 max-width/padding은
 * 각 section 자신(.intro/FeatureSection.vue/GrowthJourney.vue)이 그대로
 * 담당한다 — wrapper에는 padding을 주지 않아서 이중으로 넓어지지
 * 않는다.
 *
 * 모든 경계에 기계적으로 같은 처리를 하지 않았다: Hero→Why는 배경
 * 대비(기본 bg → surface white) + 아주 얇은 top divider 하나,
 * Why→기능은 배경 대비만(흰색 surface → 기본 bg, divider 없음),
 * 기능→Journey는 배경은 같아서 top divider 하나로만, Journey→Final
 * CTA는 기존 final-cta-band의 Soft Green 배경 자체로 충분해 별도
 * divider를 추가하지 않았다.
 */
/*
 * Hero 배경의 radial wash — 예전엔 HeroSection.vue의 `.hero::before`가
 * `width:100vw` + `margin-left:-50vw`로 직접 viewport까지 번지는
 * 방식이었는데, scrollbar가 레이아웃 공간을 차지하는 환경에서 `100vw`
 * 가 실제 보이는 폭보다 넓게 계산되어 horizontal overflow를 만들었다
 * (원인 상세는 HeroSection.vue 주석 참고). 다른 section들과 똑같은
 * "배경 전담 full-bleed wrapper" 패턴으로 옮겨서 vw 단위 자체를 아예
 * 쓰지 않게 했다 — 이 div는 평범한 block이라 부모(`.landing`) 폭을
 * 100% 채울 뿐이다. gradient의 중심 X좌표는 Hero 콘텐츠가 아니라 이
 * wrapper(전체 뷰포트 폭) 기준이 되므로, `calc(50% + 340px)`처럼
 * "뷰포트 중앙에서 오른쪽으로 고정 픽셀만큼" 앵커링해서 뷰포트가
 * 넓어져도 Product Scene 근처에서 계속 은은하게 번지게 했다(퍼센트
 * 앵커였다면 뷰포트가 넓어질수록 중심이 실제 콘텐츠 밖으로 밀려난다).
 */
.hero-band {
  background: radial-gradient(ellipse 900px 560px at calc(50% + 340px) 10%, rgba(63, 125, 99, 0.08), transparent 65%);
}

/*
 * Color Rhythm — Landing이 스크롤될수록 색 온도가 아주 조금씩 짙어지는
 * 흐름을 band 배경 자체에 얹는다(새 decorative shape가 아니라 배경
 * gradient 하나). Why GrowLog는 white surface로 시작해 결론 쪽으로
 * 갈수록 --color-primary-bg 쪽으로 미세하게 기울고(01 흐릿함→03 짙은
 * Green으로 가는 story arc와 같은 방향), Growth Journey는 --color-bg
 * 에서 시작해 Final CTA로 이어지기 직전 같은 --color-primary-bg 쪽으로
 * 다시 한번 기운다 — "Soft Green/Accent가 자연스럽게 축적되는 영역".
 * 두 번째 stop을 100%를 넘겨 잡아서(130~140%) 실제로는 각 section
 * 안에서 절반도 못 가서 전환이 끝나고, 눈에 띄는 색 블록이 아니라
 * 아주 미세한 tonal drift로만 느껴지게 했다.
 */
.intro-band {
  background: linear-gradient(180deg, var(--color-surface) 0%, var(--color-surface) 55%, var(--color-primary-bg) 130%);
  border-top: 1px solid var(--color-border);
}

.features-band {
  background: var(--color-bg);
}

.journey-band {
  background: linear-gradient(180deg, var(--color-bg) 0%, var(--color-bg) 40%, var(--color-primary-bg) 140%);
  border-top: 1px solid var(--color-border);
}

.intro {
  max-width: 1200px;
  margin: 0 auto;
  padding: calc(var(--space-12) * 1.2) var(--space-8);
}

@media (max-width: 1199px) {
  .intro {
    padding-left: var(--space-6);
    padding-right: var(--space-6);
  }
}

@media (max-width: 767px) {
  .intro {
    padding-left: var(--space-4);
    padding-right: var(--space-4);
  }
}

/*
 * intro__title / feature-section__title(FeatureSection.vue) /
 * journey__title(GrowthJourney.vue) — Landing의 Section Title은 24px/600을
 * 쓰고 싶지만, 이 값을 --font-size-xl 전역 토큰에 반영하면 Dashboard/
 * Timeline/Goal/Login의 기존 제목 크기까지 함께 바뀐다. Application UI
 * 타이포 계층은 다음 단계에서 별도로 재검토하기로 했으므로, 지금은
 * 전역 토큰을 건드리지 않고 Landing 컴포넌트 스코프 안에서만 로컬 값으로
 * 적용한다.
 *
 * 정렬은 Hero(left)와 같은 left/editorial 톤을 이어받는다 — "중앙 제목 →
 * 콘텐츠"가 섹션마다 반복되지 않도록 하기 위함이다.
 */
.intro__title {
  margin: 0 0 var(--space-8);
  max-width: 640px;
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  line-height: 1.35;
  letter-spacing: -0.015em;
  text-align: left;
  word-break: keep-all;
  overflow-wrap: break-word;
  text-wrap: balance;
}

.intro__statements {
  display: flex;
  flex-direction: column;
  gap: calc(var(--space-12) * 1.2);
}

/*
 * 각 statement를 2-column editorial row(text | visual, 거의 50/50)로
 * 구성해서 1200px 컨테이너의 좌우를 실제로 다 쓴다. 비대칭은 row마다
 * text/visual의 좌우 위치를 바꾸는 것만으로 만든다(order 기반 —
 * Feature Product Story와 같은 패턴) — statement 내부 text 자체는
 * 어느 row든 항상 같은 정렬(들여쓰기 없음)을 쓴다.
 */
.intro__statement {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: center;
  gap: var(--space-8);
  margin: 0;
}

.intro__statement-copy {
  order: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
  max-width: 460px;
}

.intro__visual {
  order: 2;
  justify-self: center;
}

/* 02는 visual-left / text-right로 좌우를 뒤집는다(01/03은 text-left 기본값) */
.intro__statement--1 .intro__statement-copy {
  order: 2;
}

.intro__statement--1 .intro__visual {
  order: 1;
}

.intro__statement-number {
  font-size: 13px;
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.06em;
}

.intro__statement--0 .intro__statement-number {
  color: var(--color-accent);
}

.intro__statement--1 .intro__statement-number {
  color: var(--color-primary);
}

.intro__statement--2 .intro__statement-number {
  color: var(--color-primary-hover);
}

.intro__statement-text {
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
  line-height: 1.6;
  letter-spacing: -0.003em;
  word-break: keep-all;
  overflow-wrap: break-word;
  text-wrap: pretty;
}

/*
 * 문장 옆의 visual — 아이콘/일러스트가 아니라 CSS 도형만으로 각
 * statement의 의미를 보조한다(주인공은 여전히 텍스트). 3개 모두 서로
 * 다른 형태를 쓴다 — 동일한 아이콘/카드 3개 반복이나 또 다른 dot-line
 * timeline이 되지 않도록. 260x140 정도로 둬서 Desktop의 넓은 visual
 * column 안에서도 장식처럼 작게 묻히지 않게 했다.
 */
.intro__visual {
  flex-shrink: 0;
  width: 260px;
  max-width: 100%;
  height: 140px;
}

/*
 * 01 — 흐릿해지는 목표: 첫 줄은 체크된(선명한 Primary Green) 목표,
 * 아래로 갈수록 미확인 상태(빈 체크박스)로 옅어진다 — "처음엔
 * 명확했던 하나의 Goal이 점점 흐려지는" 것이 체크 여부로도 읽히게
 * 했다.
 */
.intro__visual--fade {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 16px;
}

.intro__fade-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.intro__fade-row--2 {
  opacity: 0.55;
}

.intro__fade-row--3 {
  opacity: 0.28;
}

.intro__fade-check {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  border: 1.5px solid var(--color-border);
  border-radius: 4px;
}

.intro__fade-check--done {
  position: relative;
  border-color: var(--color-primary);
  background: var(--color-primary);
}

.intro__fade-check--done::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 1px;
  width: 5px;
  height: 8px;
  border: solid var(--color-text-inverse);
  border-width: 0 1.5px 1.5px 0;
  transform: rotate(45deg);
}

.intro__fade-bar {
  height: 10px;
  border-radius: 4px;
  background: var(--color-border);
}

.intro__fade-row--1 .intro__fade-bar {
  width: 170px;
}

.intro__fade-row--2 .intro__fade-bar {
  width: 140px;
}

.intro__fade-row--3 .intro__fade-bar {
  width: 105px;
}

/* 02 — 기록되지 않은 작은 변화: 연결선 없이 흩어진 옅은 점/조각들(timeline과 구분) */
.intro__visual--scatter {
  position: relative;
}

.intro__scatter-dot {
  position: absolute;
  border-radius: 50%;
  background: var(--color-text-secondary);
}

.intro__scatter-dot--1 {
  top: 10px;
  left: 10px;
  width: 7px;
  height: 7px;
  opacity: 0.35;
}

.intro__scatter-dot--2 {
  top: 46px;
  left: 70px;
  width: 9px;
  height: 9px;
  opacity: 0.22;
}

.intro__scatter-dot--3 {
  top: 90px;
  left: 20px;
  width: 6px;
  height: 6px;
  opacity: 0.4;
}

.intro__scatter-dot--4 {
  top: 18px;
  left: 160px;
  width: 8px;
  height: 8px;
  opacity: 0.2;
}

.intro__scatter-dot--5 {
  top: 96px;
  left: 190px;
  width: 6px;
  height: 6px;
  opacity: 0.3;
}

.intro__scatter-bar {
  position: absolute;
  height: 5px;
  border-radius: 3px;
  background: var(--color-text-secondary);
}

.intro__scatter-bar--1 {
  top: 64px;
  left: 130px;
  width: 26px;
  opacity: 0.18;
}

.intro__scatter-bar--2 {
  top: 24px;
  left: 55px;
  width: 20px;
  opacity: 0.25;
}

/* 03 — 축적: record surface 3장이 살짝 어긋나게 겹쳐 쌓인다(맨 위가 가장 선명) */
.intro__visual--stack {
  position: relative;
}

.intro__stack-card {
  position: absolute;
  left: 0;
  border-radius: var(--radius-md);
}

.intro__stack-card--1 {
  top: 48px;
  width: 210px;
  height: 56px;
  background: var(--color-primary-bg);
}

.intro__stack-card--2 {
  top: 26px;
  left: 14px;
  width: 220px;
  height: 56px;
  background: var(--color-accent);
}

.intro__stack-card--3 {
  position: absolute;
  top: 0;
  left: 28px;
  width: 230px;
  height: 60px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-card);
}

/* "변화가 보임" — 가장 선명한 맨 위 카드에만 작은 Primary Green 표식을 둔다 */
.intro__stack-card--3::after {
  content: '';
  position: absolute;
  top: 10px;
  right: 10px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-primary);
}

@media (max-width: 900px) {
  .intro__statement {
    grid-template-columns: 1fr;
    gap: var(--space-6);
  }

  .intro__statement-copy,
  .intro__statement--1 .intro__statement-copy {
    order: 1;
    max-width: none;
  }

  .intro__visual,
  .intro__statement--1 .intro__visual {
    order: 2;
    justify-self: start;
  }
}

/*
 * Progressive Enhancement — 기본 상태(.points--motion 없음, 즉 JS
 * 비활성/reduced-motion)는 문장이 전부 보이는 "최종 상태"다.
 * `.points--motion`이 붙어야만(JS가 motion을 켤 때만) 문장이 숨어서
 * reveal을 기다리는 상태가 된다. Rail/connector 선은 더 이상 쓰지
 * 않는다(Hero와 마찬가지로 dot/line 모티프를 이 섹션에서도 제거).
 */
.intro__statement.points--motion {
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.45s ease, transform 0.45s ease;
}

.intro__statement.points--motion.is-visible {
  opacity: 1;
  transform: translateY(0);
}

/*
 * Story timing — "01 등장 → visual 변화 → 02 등장 → visual 변화 → 03
 * 등장"처럼 느껴지도록, visual은 문장(row) 자체보다 한 박자 늦게
 * 나타나는 자신만의 opacity transition을 하나 더 얹는다(observer는
 * 여전히 statement 하나당 1개 — 새 관찰자를 추가하지 않는다). 03의
 * stack card 3장은 짧게 stagger돼서 "정돈되는" 느낌을 준다.
 */
.intro__statement.points--motion .intro__visual {
  opacity: 0;
  transition: opacity 0.4s ease;
  transition-delay: 200ms;
}

.intro__statement.points--motion.is-visible .intro__visual {
  opacity: 1;
}

.intro__statement--2.points--motion .intro__stack-card {
  transform: translateY(6px);
  transition: opacity 0.35s ease, transform 0.35s ease;
}

.intro__statement--2.points--motion.is-visible .intro__stack-card {
  transform: translateY(0);
}

.intro__statement--2.points--motion.is-visible .intro__stack-card--1 {
  transition-delay: 220ms;
}

.intro__statement--2.points--motion.is-visible .intro__stack-card--2 {
  transition-delay: 300ms;
}

.intro__statement--2.points--motion.is-visible .intro__stack-card--3 {
  transition-delay: 380ms;
}

/*
 * 결론 — Story의 Resolution. 카드/배경 박스는 여전히 만들지 않는다.
 * 대신 충분한 상단 여백 + 조금 더 강한 weight/색 + 짧은 accent rule
 * 하나로 "그래서 GrowLog가 필요하다"는 지점임을 분명히 한다.
 */
.intro__conclusion-rule {
  display: block;
  width: 40px;
  height: 3px;
  margin: calc(var(--space-12) * 1.3) 0 var(--space-4);
  border-radius: 999px;
  background: var(--color-primary);
}

.intro__conclusion {
  margin: 0;
  max-width: 700px;
  color: var(--color-primary-hover);
  font-size: 20px;
  font-weight: var(--font-weight-semibold);
  line-height: 1.6;
  letter-spacing: -0.005em;
  word-break: keep-all;
  overflow-wrap: break-word;
  text-wrap: pretty;
}

/*
 * Final CTA — Landing의 color climax. 이전엔 Soft Green(--color-
 * primary-bg)만 써서 Growth Journey의 마지막 톤과 강도 차이가 거의
 * 없었다. 지금은 --landing-green-deep(진한 Green) 배경 + inverse
 * text로 바꿔서 페이지에서 가장 강한 색 블록이 되게 했다 — 배경을
 * --color-primary로 바로 쓰지 않은 이유는 그 위에 얹는 CTA 버튼
 * (BaseButton variant="primary")도 같은 --color-primary라서 배경과
 * 버튼이 거의 같은 색으로 묻히기 때문이다. 한 단계 더 짙은 배경 위에서
 * 버튼이 확실히 밝게 떠 보인다(WCAG 검증: 버튼/배경, 텍스트/배경 모두
 * 확인 완료 — 아래 검증 로그 참고). 그라데이션/모티프는 여전히 쓰지
 * 않는다 — 단색 블록 하나로 마무리한다.
 */
.final-cta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  max-width: 1200px;
  margin: 0 auto;
  padding: calc(var(--space-12) * 1.5) var(--space-8);
  text-align: center;
}

.final-cta-band {
  background: var(--landing-green-deep);
}

@media (max-width: 1199px) {
  .final-cta {
    padding-left: var(--space-6);
    padding-right: var(--space-6);
  }
}

@media (max-width: 767px) {
  .final-cta {
    padding-left: var(--space-4);
    padding-right: var(--space-4);
  }
}

.final-cta__title {
  margin: 0;
  color: var(--color-text-inverse);
  font-size: var(--font-size-page-title);
  font-weight: var(--font-weight-bold);
  line-height: 1.3;
  letter-spacing: -0.015em;
  word-break: keep-all;
  overflow-wrap: break-word;
  text-wrap: balance;
}

.final-cta__text {
  margin: 0 0 var(--space-2);
  max-width: 480px;
  color: rgba(255, 255, 255, 0.82);
  line-height: 1.7;
  letter-spacing: -0.003em;
  word-break: keep-all;
  overflow-wrap: break-word;
  text-wrap: pretty;
  font-size: var(--font-size-base);
}

/*
 * Progressive Enhancement — 기본 상태는 전부 보인다. `.will-reveal`이
 * 붙어야만(JS가 motion을 켤 때만) 섹션 전체가 한 번에 숨어서 reveal을
 * 기다린다. 여러 단계로 나눠 stagger하지 않고, 섹션 전체가 한 번의
 * subtle fade-up으로 나타나는 정도면 충분하다(요청사항).
 */
.final-cta.will-reveal {
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.final-cta.will-reveal.is-visible {
  opacity: 1;
  transform: translateY(0);
}
</style>
