import api from './axios'
import type { LoginCredentials, Me } from '../types/auth'

/*
 * Spring Security의 formLogin은 email/password를
 * application/x-www-form-urlencoded 로 받고, 성공/실패 모두 302로 응답한다
 * (성공 → /home, 실패 → /login?error).
 *
 * SPA 입장에서 이 리다이렉트 응답 자체는 의미가 없으므로 validateStatus로
 * 에러 취급하지 않고 항상 통과시킨 뒤, 실제 로그인 여부는 이어서 호출하는
 * fetchMe()로 판단한다.
 */
export async function login(credentials: LoginCredentials): Promise<void> {
  const body = new URLSearchParams()
  body.set('email', credentials.email)
  body.set('password', credentials.password)

  await api.post('/login', body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    validateStatus: () => true,
  })
}

export async function logout(): Promise<void> {
  await api.post('/logout', null, { validateStatus: () => true })
}

export async function fetchMe(): Promise<Me> {
  const response = await api.get<Me>('/api/me')
  return response.data
}
