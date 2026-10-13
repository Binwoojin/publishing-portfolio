/*
 * Signup(POST /api/signup) 및 그 앞단의 이메일 인증(/api/email/**)/닉네임
 * 중복확인(/api/members/check-nickname)이 사용하는 타입. 백엔드
 * JoinRequest/DuplicateCheckResponse/EmailVerificationResponse와 1:1로
 * 대응한다.
 */
export interface SignupPayload {
  email: string
  password: string
  passwordCheck: string
  userName: string
  nickname: string
  emailCode: string
}

export interface DuplicateCheckResult {
  duplicated: boolean
  message: string
}

export interface EmailVerificationResult {
  success: boolean
  message: string
}
