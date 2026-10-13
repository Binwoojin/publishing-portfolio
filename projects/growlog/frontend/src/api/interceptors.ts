import api from './axios'
import router from '../router'
import { useAuthStore } from '../stores/auth.store'

/*
 * 세션이 도중에 끊기면(서버 재시작, 세션 만료, 쿠키 삭제 등) 보호된 화면에
 * 있던 사용자를 자동으로 로그인 화면으로 돌려보낸다.
 *
 * "로그인 여부 확인"용 GET /api/me 401은 이 인터셉터가 아니라
 * authStore.fetchCurrentUser()가 자체적으로 조용히 처리한다. Landing(/)처럼
 * 로그인 없이도 볼 수 있는 화면에서도 fetchCurrentUser()가 호출되므로,
 * 요청 URL이 /api/me면 여기서는 아무 것도 하지 않고 그대로 넘긴다 — 그러지
 * 않으면 비로그인 사용자가 공개 페이지에 들어올 때마다 401 한 번에 곧바로
 * /login으로 튕겨나가게 된다. 여기서는 "이미 인증된 화면에서 다른 API를
 * 호출하다가 갑자기 401을 받은" 경우만 대응한다.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isIdentityCheck = typeof error.config?.url === 'string' && error.config.url.includes('/api/me')

    if (error.response?.status === 401 && !isIdentityCheck) {
      const authStore = useAuthStore()
      /*
       * router.currentRoute는 첫 네비게이션이 완료되기 전(START_LOCATION)에는
       * 실제 요청 경로가 아니라 내부 placeholder('/')를 가리킨다. 항상 실제
       * 브라우저 URL(window.location)을 기준으로 redirect 대상을 계산한다.
       */
      const currentPath = window.location.pathname + window.location.search

      if (window.location.pathname !== '/login') {
        authStore.user = null
        router.push({ name: 'login', query: { redirect: currentPath } })
      }
    }

    return Promise.reject(error)
  },
)
