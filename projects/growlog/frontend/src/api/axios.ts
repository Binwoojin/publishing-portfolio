import axios from 'axios'

/*
 * 백엔드(Spring Boot)와 통신할 Axios 인스턴스.
 *
 * withCredentials: true
 *   세션 쿠키(JSESSIONID)를 Cross-Origin 요청에도 실어 보내기 위해 필수.
 *   이게 없으면 로그인에 성공해도 브라우저가 세션 쿠키를 저장/전송하지 않는다.
 *
 * xsrfCookieName / xsrfHeaderName
 *   Spring Security가 CookieCsrfTokenRepository로 내려주는 쿠키 이름(XSRF-TOKEN)과
 *   기대하는 헤더 이름(X-XSRF-TOKEN)을 Axios 기본값과 똑같이 맞춘 것.
 *   두 값이 서버/클라이언트에서 일치하면 Axios가 CSRF 토큰을 자동으로
 *   쿠키에서 읽어 헤더에 넣어 보내주기 때문에 별도 코드가 필요 없다.
 *
 * withXSRFToken: true
 *   Axios 1.6부터는 보안상 "같은 Origin"으로 가는 요청에만 위 쿠키→헤더 자동
 *   변환을 적용하고, Cross-Origin 요청에는 기본적으로 적용하지 않는다.
 *   Vue 개발 서버(5173)와 Spring Boot(8080)는 서로 다른 Origin이므로, 이 옵션을
 *   명시적으로 켜야 로그인/로그아웃 같은 POST 요청에 CSRF 토큰이 실제로 실린다.
 *   (이게 빠지면 Spring Security가 CSRF 토큰 누락으로 403을 반환한다.)
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  withXSRFToken: true,
})

export default api
