<script setup lang="ts">
import { LayoutDashboard, Route, Target } from '@lucide/vue'

/*
 * Dashboard/Timeline/Goal 3개 화면을 오가야 해서 만든 최소 네비게이션.
 * 각 화면 헤더에 링크를 따로따로 두지 않고 여기서 한 번만 관리한다.
 *
 * 아이콘은 필수는 아니었지만, Feature 카드/필터 등 앱 전체에 이미 같은
 * 아이콘(Route=타임라인, Target=목표, LayoutDashboard=대시보드)을 쓰고
 * 있어서 nav에도 매칭시키는 쪽이 텍스트만 있을 때보다 일관돼 보여서
 * 추가했다. 크기를 텍스트와 동일하게 맞춰서 nav가 복잡해 보이지 않게 했다.
 */
</script>

<template>
  <nav class="app-nav" aria-label="주요 화면 이동">
    <RouterLink to="/dashboard" class="app-nav__link">
      <LayoutDashboard :size="15" :stroke-width="1.75" />
      대시보드
    </RouterLink>
    <RouterLink to="/timeline" class="app-nav__link">
      <Route :size="15" :stroke-width="1.75" />
      타임라인
    </RouterLink>
    <RouterLink to="/goals" class="app-nav__link">
      <Target :size="15" :stroke-width="1.75" />
      목표
    </RouterLink>
  </nav>
</template>

<style scoped>
.app-nav {
  display: flex;
  gap: var(--space-4);
}

.app-nav__link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  text-decoration: none;
  white-space: nowrap;
  padding-bottom: var(--space-1);
  border-bottom: 2px solid transparent;
}

.app-nav__link:hover {
  color: var(--color-primary);
}

/* Linear의 "명확한 active state" 원칙만 참고 — pill/배경 없이 얇은 밑줄로 차분하게 */
.app-nav__link.router-link-exact-active {
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
  border-bottom-color: var(--color-primary);
}
</style>
