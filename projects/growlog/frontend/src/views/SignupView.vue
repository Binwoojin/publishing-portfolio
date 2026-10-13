<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { checkNicknameDuplicate, sendEmailCode, signup, verifyEmailCode } from '../api/member.api'
import { extractErrorMessage } from '../utils/errors'
import BaseButton from '../components/common/BaseButton.vue'
import BaseCard from '../components/common/BaseCard.vue'
import BaseInput from '../components/common/BaseInput.vue'

/*
 * 기존 JSP record/join.jsp + join.js와 동일한 필드/검증/흐름을 그대로
 * 옮긴다 — 백엔드 MemberService.join()이 비밀번호 확인 일치/이메일 인증
 * 완료/이메일·닉네임 중복만 검증하고 형식(정규식)은 검사하지 않으므로,
 * "임의 정책을 새로 만들지 않는다"는 이번 작업 원칙에 따라 join.js에
 * 이미 있던 정규식을 그대로 재사용한다. 새 정책이 아니라 기존 정책을
 * SPA로 옮긴 것이다.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,20}$/
const USERNAME_PATTERN = /^[가-힣a-zA-Z]{2,20}$/
const NICKNAME_PATTERN = /^[가-힣a-zA-Z0-9]{2,12}$/

const router = useRouter()

const email = ref('')
const emailCode = ref('')
const password = ref('')
const passwordCheck = ref('')
const userName = ref('')
const nickname = ref('')

const emailError = ref('')
const emailCodeError = ref('')
const passwordError = ref('')
const passwordCheckError = ref('')
const userNameError = ref('')
const nicknameError = ref('')

const emailSendStatus = ref<'idle' | 'sending' | 'sent' | 'error'>('idle')
const emailVerifyStatus = ref<'idle' | 'verifying' | 'verified' | 'error'>('idle')
const nicknameCheckStatus = ref<'idle' | 'checking' | 'available' | 'error'>('idle')

const saveStatus = ref<'idle' | 'saving' | 'error'>('idle')
const errorMessage = ref('')

/* 이메일을 다시 수정하면 이전 인증 상태는 더 이상 유효하지 않다 (join.js의 resetEmailVerification과 동일) */
function onEmailInput() {
  if (emailSendStatus.value !== 'idle' || emailVerifyStatus.value !== 'idle') {
    emailSendStatus.value = 'idle'
    emailVerifyStatus.value = 'idle'
    emailCode.value = ''
    emailCodeError.value = ''
  }
}

function onNicknameInput() {
  nicknameCheckStatus.value = 'idle'
}

function validateEmail(): boolean {
  const value = email.value.trim()
  if (!value) {
    emailError.value = '이메일을 입력해주세요.'
    return false
  }
  if (!EMAIL_PATTERN.test(value)) {
    emailError.value = '올바른 이메일 형식으로 입력해주세요.'
    return false
  }
  emailError.value = ''
  return true
}

function validatePassword(): boolean {
  if (!password.value) {
    passwordError.value = '비밀번호를 입력해주세요.'
    return false
  }
  if (!PASSWORD_PATTERN.test(password.value)) {
    passwordError.value = '비밀번호는 영문, 숫자, 특수문자(!@#$%^&*)를 포함하여 8~20자로 입력해주세요.'
    return false
  }
  passwordError.value = ''
  return true
}

function validatePasswordCheck(): boolean {
  if (!passwordCheck.value) {
    passwordCheckError.value = '비밀번호를 다시 입력해주세요.'
    return false
  }
  if (password.value !== passwordCheck.value) {
    passwordCheckError.value = '비밀번호가 일치하지 않습니다.'
    return false
  }
  passwordCheckError.value = ''
  return true
}

function validateUserName(): boolean {
  const value = userName.value.trim()
  if (!value) {
    userNameError.value = '이름을 입력해주세요.'
    return false
  }
  if (!USERNAME_PATTERN.test(value)) {
    userNameError.value = '이름은 한글 또는 영문 2~20자로 입력해주세요.'
    return false
  }
  userNameError.value = ''
  return true
}

function validateNickname(): boolean {
  const value = nickname.value.trim()
  if (!value) {
    nicknameError.value = '닉네임을 입력해주세요.'
    return false
  }
  if (!NICKNAME_PATTERN.test(value)) {
    nicknameError.value = '닉네임은 한글, 영문, 숫자를 사용하여 2~12자로 입력해주세요.'
    return false
  }
  nicknameError.value = ''
  return true
}

async function onSendEmailCode() {
  if (!validateEmail()) return

  emailSendStatus.value = 'sending'
  try {
    const result = await sendEmailCode(email.value.trim())
    if (!result.success) {
      emailSendStatus.value = 'error'
      emailError.value = result.message
      return
    }
    emailSendStatus.value = 'sent'
    emailError.value = ''
  } catch (error) {
    emailSendStatus.value = 'error'
    emailError.value = extractErrorMessage(error, '인증번호 발송 중 오류가 발생했습니다.')
  }
}

async function onVerifyEmailCode() {
  if (emailSendStatus.value !== 'sent' && emailSendStatus.value !== 'error') {
    emailCodeError.value = '먼저 이메일 인증번호를 발송해주세요.'
    return
  }
  const code = emailCode.value.trim()
  if (!code) {
    emailCodeError.value = '인증번호를 입력해주세요.'
    return
  }
  if (!/^\d{6}$/.test(code)) {
    emailCodeError.value = '인증번호 6자리를 숫자로 입력해주세요.'
    return
  }

  emailVerifyStatus.value = 'verifying'
  try {
    const result = await verifyEmailCode(email.value.trim(), code)
    if (!result.success) {
      emailVerifyStatus.value = 'error'
      emailCodeError.value = result.message
      return
    }
    emailVerifyStatus.value = 'verified'
    emailCodeError.value = ''
  } catch (error) {
    emailVerifyStatus.value = 'error'
    emailCodeError.value = extractErrorMessage(error, '인증번호 확인 중 오류가 발생했습니다.')
  }
}

async function onCheckNickname() {
  if (!validateNickname()) return

  nicknameCheckStatus.value = 'checking'
  try {
    const result = await checkNicknameDuplicate(nickname.value.trim())
    if (result.duplicated) {
      nicknameCheckStatus.value = 'error'
      nicknameError.value = result.message
      return
    }
    nicknameCheckStatus.value = 'available'
    nicknameError.value = ''
  } catch (error) {
    nicknameCheckStatus.value = 'error'
    nicknameError.value = extractErrorMessage(error, '닉네임 중복확인 중 오류가 발생했습니다.')
  }
}

async function onSubmit() {
  const validations = [validateEmail(), validatePassword(), validatePasswordCheck(), validateUserName(), validateNickname()]
  if (!validations.every(Boolean)) return

  if (nicknameCheckStatus.value !== 'available') {
    nicknameError.value = '닉네임 중복확인을 진행해주세요.'
    return
  }

  if (emailVerifyStatus.value !== 'verified') {
    emailCodeError.value = '이메일 인증을 완료해주세요.'
    return
  }

  saveStatus.value = 'saving'
  errorMessage.value = ''
  try {
    await signup({
      email: email.value.trim(),
      password: password.value,
      passwordCheck: passwordCheck.value,
      userName: userName.value.trim(),
      nickname: nickname.value.trim(),
      emailCode: emailCode.value.trim(),
    })
    router.push({ name: 'login', query: { joined: '1' } })
  } catch (error) {
    saveStatus.value = 'error'
    errorMessage.value = extractErrorMessage(error, '회원가입에 실패했어요. 다시 시도해주세요.')
  }
}
</script>

<template>
  <main class="signup">
    <h1 class="signup__title">회원가입</h1>
    <p class="signup__subtitle">GrowLog와 함께 성장의 기록을 시작해보세요.</p>

    <BaseCard>
      <form class="signup__form" novalidate @submit.prevent="onSubmit">
        <div class="signup__field">
          <label for="email" class="signup__label">이메일</label>
          <div class="signup__input-row">
            <input
              id="email"
              v-model="email"
              type="email"
              autocomplete="email"
              placeholder="example@email.com"
              class="signup__input"
              :class="{ 'has-error': !!emailError }"
              :readonly="emailVerifyStatus === 'verified'"
              @input="onEmailInput"
            />
            <BaseButton
              type="button"
              variant="secondary"
              class="signup__input-button"
              :disabled="emailSendStatus === 'sending' || emailVerifyStatus === 'verified'"
              @click="onSendEmailCode"
            >
              {{ emailVerifyStatus === 'verified' ? '인증완료' : emailSendStatus === 'sending' ? '발송 중' : emailSendStatus === 'sent' ? '재발송' : '인증번호' }}
            </BaseButton>
          </div>
          <span v-if="emailError" class="signup__hint signup__hint--error">{{ emailError }}</span>
          <span v-else-if="emailSendStatus === 'sent'" class="signup__hint">{{ email }} 주소로 인증번호를 발송했어요.</span>
        </div>

        <div class="signup__field">
          <label for="emailCode" class="signup__label">인증번호</label>
          <div class="signup__input-row">
            <input
              id="emailCode"
              v-model="emailCode"
              type="text"
              inputmode="numeric"
              placeholder="인증번호 입력"
              class="signup__input"
              :class="{ 'has-error': !!emailCodeError }"
              :readonly="emailVerifyStatus === 'verified'"
            />
            <BaseButton
              type="button"
              variant="secondary"
              class="signup__input-button"
              :disabled="emailVerifyStatus === 'verifying' || emailVerifyStatus === 'verified'"
              @click="onVerifyEmailCode"
            >
              {{ emailVerifyStatus === 'verified' ? '인증완료' : emailVerifyStatus === 'verifying' ? '확인 중' : '확인' }}
            </BaseButton>
          </div>
          <span v-if="emailCodeError" class="signup__hint signup__hint--error">{{ emailCodeError }}</span>
          <span v-else-if="emailVerifyStatus === 'verified'" class="signup__hint">이메일 인증이 완료되었어요.</span>
        </div>

        <BaseInput
          v-model="password"
          label="비밀번호"
          type="password"
          autocomplete="new-password"
          required
          :error-message="passwordError"
        />

        <BaseInput
          v-model="passwordCheck"
          label="비밀번호 확인"
          type="password"
          autocomplete="new-password"
          required
          :error-message="passwordCheckError"
        />

        <BaseInput v-model="userName" label="이름" autocomplete="name" required :error-message="userNameError" />

        <div class="signup__field">
          <label for="nickname" class="signup__label">닉네임</label>
          <div class="signup__input-row">
            <input
              id="nickname"
              v-model="nickname"
              type="text"
              placeholder="닉네임을 입력하세요"
              class="signup__input"
              :class="{ 'has-error': !!nicknameError }"
              @input="onNicknameInput"
            />
            <BaseButton
              type="button"
              variant="secondary"
              class="signup__input-button"
              :disabled="nicknameCheckStatus === 'checking'"
              @click="onCheckNickname"
            >
              {{ nicknameCheckStatus === 'checking' ? '확인 중' : nicknameCheckStatus === 'available' ? '확인완료' : '중복확인' }}
            </BaseButton>
          </div>
          <span v-if="nicknameError" class="signup__hint signup__hint--error">{{ nicknameError }}</span>
          <span v-else-if="nicknameCheckStatus === 'available'" class="signup__hint">사용 가능한 닉네임이에요.</span>
        </div>

        <BaseButton type="submit" :disabled="saveStatus === 'saving'">
          {{ saveStatus === 'saving' ? '가입 중...' : '회원가입' }}
        </BaseButton>

        <p v-if="saveStatus === 'error'" class="signup__hint signup__hint--error">{{ errorMessage }}</p>
      </form>
    </BaseCard>

    <p class="signup__login-link">
      이미 계정이 있으신가요?
      <RouterLink to="/login">로그인</RouterLink>
    </p>
  </main>
</template>

<style scoped>
.signup {
  max-width: 400px;
  margin: var(--space-12) auto;
  padding: 0 var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.signup__title {
  font-size: var(--font-size-2xl);
  text-align: center;
}

.signup__subtitle {
  margin: 0;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.signup__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.signup__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.signup__label {
  font-weight: var(--font-weight-medium);
}

.signup__input-row {
  display: flex;
  gap: var(--space-2);
}

.signup__input {
  flex: 1;
  min-width: 0;
  padding: var(--space-3);
  font-size: var(--font-size-base);
  font-family: inherit;
  color: var(--color-text-primary);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  transition: border-color 0.15s;
}

.signup__input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-bg);
}

.signup__input:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}

.signup__input.has-error {
  border-color: var(--color-error);
}

.signup__input-button {
  flex-shrink: 0;
  white-space: nowrap;
}

.signup__hint {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.signup__hint--error {
  color: var(--color-error);
}

.signup__login-link {
  margin: 0;
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.signup__login-link a {
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
}

.signup__login-link a:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .signup__input-row {
    flex-direction: column;
  }
}
</style>
