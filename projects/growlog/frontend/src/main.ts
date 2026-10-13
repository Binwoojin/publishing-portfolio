import { createApp } from 'vue'
import { createPinia } from 'pinia'
/*
 * Pretendard(static, 가변 폰트 아님)를 self-host로 로드한다(CDN 의존
 * 없음). tokens.css의 --font-sans가 이 웹폰트('Pretendard')를 우선
 * 참조하고, 로드 전/실패 시에는 기존 system font fallback으로 자연스럽게
 * 대체된다.
 */
import 'pretendard/dist/web/static/pretendard.css'
import './style.css'
import App from './App.vue'
import router from './router'
import './api/interceptors'

createApp(App).use(createPinia()).use(router).mount('#app')
