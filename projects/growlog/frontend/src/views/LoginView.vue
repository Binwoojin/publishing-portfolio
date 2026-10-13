<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'
import BaseButton from '../components/common/BaseButton.vue'
import BaseCard from '../components/common/BaseCard.vue'
import BaseInput from '../components/common/BaseInput.vue'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')

/* Signup 완료 후 이 쿼리와 함께 돌아온다 — 로그인 다시 유도 (join.jsp의 joinSuccessMessage와 같은 역할) */
const justJoined = route.query.joined === '1'

async function onSubmit() {
  try {
    await authStore.login({ email: email.value, password: password.value })
    /*
     * 보호된 화면에 접근하려다 세션이 없어서 로그인으로 튕겨왔다면
     * (Router Guard, 401 인터셉터 모두 ?redirect=원래경로를 붙여서 보낸다)
     * 로그인 후 그 원래 화면으로 돌려보낸다.
     */
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : undefined
    router.push(redirect ?? { name: 'dashboard' })
  } catch {
    /* authStore.error에 메시지가 이미 채워져 있으므로 템플릿에서 그대로 보여준다 */
  }
}
</script>

<template>
  <main class="login">
    <h1 class="login__title">GrowLog</h1>
    <p class="login__subtitle">오늘의 성장을 기록해보세요.</p>

    <BaseCard>
      <form class="login__form" @submit.prevent="onSubmit">
        <p v-if="justJoined" class="login__success">회원가입이 완료되었습니다. 로그인해주세요.</p>

        <BaseInput v-model="email" label="이메일" type="email" autocomplete="email" required />
        <BaseInput v-model="password" label="비밀번호" type="password" autocomplete="current-password" required />

        <BaseButton type="submit" :disabled="authStore.status === 'loading'">
          {{ authStore.status === 'loading' ? '로그인 중...' : '로그인' }}
        </BaseButton>

        <p v-if="authStore.error" class="login__error">{{ authStore.error }}</p>
      </form>
    </BaseCard>

    <p class="login__signup-link">
      아직 계정이 없으신가요?
      <RouterLink to="/signup">회원가입</RouterLink>
    </p>
  </main>
</template>

<style scoped>
.login {
  max-width: 360px;
  margin: var(--space-12) auto;
  padding: 0 var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.login__title {
  font-size: var(--font-size-2xl);
  text-align: center;
}

.login__subtitle {
  margin: 0;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.login__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.login__error {
  margin: 0;
  color: var(--color-error);
  font-size: var(--font-size-sm);
}

.login__success {
  margin: 0;
  color: var(--color-success);
  font-size: var(--font-size-sm);
}

/* Login primary CTA보다 시각적으로 약하게 — 텍스트 링크로만 표현 */
.login__signup-link {
  margin: 0;
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.login__signup-link a {
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
}

.login__signup-link a:hover {
  text-decoration: underline;
}
</style>
