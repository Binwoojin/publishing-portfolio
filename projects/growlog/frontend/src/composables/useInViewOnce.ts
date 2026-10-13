import { onBeforeUnmount, onMounted, ref } from 'vue'

/*
 * "뷰포트에 한 번 들어오면 reveal되고 다시 숨기지 않는다"는 단일 패턴만
 * 담당하는 최소 composable. Why GrowLog/Growth Journey처럼 여러 타깃을
 * 독립적으로 관찰해야 하는 경우는 이 composable을 쓰지 않고 해당
 * 컴포넌트에서 직접 IntersectionObserver를 구성한다 — 억지로 여기에
 * 맞추면 범용 motion 프레임워크처럼 커지기 때문에, 지금 필요한
 * "섹션 진입 시 1회 reveal" 범위 밖으로는 확장하지 않는다.
 *
 * Progressive Enhancement: 이 composable은 절대로 콘텐츠를 "숨기지"
 * 않는다 — `motionEnabled`가 true일 때만 소비 컴포넌트가 스스로
 * `.will-reveal` 같은 클래스를 붙여서 애니메이션 준비 상태로 만들고,
 * 그 기본 CSS는 항상 "완전히 보이는 상태"다. prefers-reduced-motion이면
 * `motionEnabled`가 계속 false로 남아 그 클래스가 붙지 않으므로 관찰자
 * 없이 최종 상태 그대로 보인다.
 */
export function useInViewOnce(options?: IntersectionObserverInit) {
  const target = ref<HTMLElement | null>(null)
  const isVisible = ref(false)
  const motionEnabled = ref(false)

  let observer: IntersectionObserver | null = null

  onMounted(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion || !target.value) {
      isVisible.value = true
      return
    }

    motionEnabled.value = true

    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          isVisible.value = true
          observer?.disconnect()
          observer = null
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -10% 0px', ...options },
    )
    observer.observe(target.value)
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })

  return { target, isVisible, motionEnabled }
}
