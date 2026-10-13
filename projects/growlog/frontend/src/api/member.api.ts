import api from './axios'
import type { DuplicateCheckResult, EmailVerificationResult, SignupPayload } from '../types/member'

export async function signup(payload: SignupPayload): Promise<void> {
  await api.post('/api/signup', payload)
}

export async function checkNicknameDuplicate(nickname: string): Promise<DuplicateCheckResult> {
  const response = await api.get<DuplicateCheckResult>('/api/members/check-nickname', {
    params: { nickname },
  })
  return response.data
}

export async function sendEmailCode(email: string): Promise<EmailVerificationResult> {
  const response = await api.post<EmailVerificationResult>('/api/email/send-code', { email })
  return response.data
}

export async function verifyEmailCode(email: string, emailCode: string): Promise<EmailVerificationResult> {
  const response = await api.post<EmailVerificationResult>('/api/email/verify-code', { email, emailCode })
  return response.data
}
