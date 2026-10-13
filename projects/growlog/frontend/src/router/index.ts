import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'

const routes = [
  {
    path: '/',
    name: 'landing',
    component: () => import('../views/LandingView.vue'),
    meta: { public: true },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { public: true },
  },
  {
    path: '/signup',
    name: 'signup',
    component: () => import('../views/SignupView.vue'),
    meta: { public: true },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../views/DashboardView.vue'),
  },
  {
    path: '/timeline',
    name: 'timeline',
    component: () => import('../views/TimelineView.vue'),
  },
  {
    path: '/goals',
    name: 'goals',
    component: () => import('../views/GoalListView.vue'),
  },
  {
    path: '/goals/new',
    name: 'goal-new',
    component: () => import('../views/GoalFormView.vue'),
  },
  {
    path: '/records/new',
    name: 'record-new',
    component: () => import('../views/RecordCreateView.vue'),
  },
  {
    path: '/record/:recordNum',
    name: 'record-detail',
    component: () => import('../views/RecordDetailView.vue'),
    props: true,
  },
  {
    path: '/records/:recordNum/edit',
    name: 'record-edit',
    component: () => import('../views/RecordEditView.vue'),
    props: true,
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
    meta: { public: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

/*
 * 새로고침 등으로 앱이 처음 로드되면 로그인 여부를 알 수 없으므로
 * 첫 네비게이션에서 한 번 GET /api/me로 세션을 확인한다.
 */
router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  if (!authStore.initialized) {
    await authStore.fetchCurrentUser()
  }

  if (!to.meta.public && !authStore.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if ((to.name === 'login' || to.name === 'signup') && authStore.isAuthenticated) {
    return { name: 'dashboard' }
  }

  return true
})

export default router
