import { defineStore } from 'pinia'
import { fetchMe, login as loginRequest, logout as logoutRequest } from '../api/auth.api'
import type { LoginCredentials, Me } from '../types/auth'

/*
 * 로그인 회원 정보는 여러 화면(헤더, Dashboard, Router Guard)이 공유해야 하므로
 * Pinia로 관리한다. Modal open/close 같은 화면 전용 상태는 여기 두지 않는다.
 */
export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as Me | null,
    /* 앱 로드 후 GET /api/me를 한 번이라도 시도했는지 여부 (Router Guard가 사용) */
    initialized: false,
    status: 'idle' as 'idle' | 'loading' | 'error',
    error: null as string | null,
  }),

  getters: {
    isAuthenticated: (state) => state.user !== null,
  },

  actions: {
    async login(credentials: LoginCredentials) {
      this.status = 'loading'
      this.error = null
      try {
        await loginRequest(credentials)
        this.user = await fetchMe()
        this.initialized = true
        this.status = 'idle'
      } catch (err) {
        this.user = null
        this.status = 'error'
        this.error = '이메일 또는 비밀번호가 올바르지 않습니다.'
        throw err
      }
    },

    async logout() {
      await logoutRequest()
      this.user = null
    },

    /*
     * 세션 쿠키가 유효한지 서버에 물어봐서 로그인 상태를 복원한다.
     * 앱을 처음 열었을 때(새로고침 포함) Router Guard가 호출한다.
     */
    async fetchCurrentUser() {
      try {
        this.user = await fetchMe()
      } catch {
        this.user = null
      } finally {
        this.initialized = true
      }
    },
  },
})
