import { isAxiosError } from 'axios'

/*
 * 백엔드 GoalApiController 등의 @ExceptionHandler(IllegalArgumentException)가
 * { "message": "..." } 형태로 400을 내려주므로, 그 메시지를 그대로 꺼내서
 * 화면에 보여준다. 서버 메시지를 못 읽는 경우(네트워크 오류 등)에는
 * 호출한 쪽에서 넘긴 fallback 문구를 사용한다.
 */
export function extractErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error) && typeof error.response?.data?.message === 'string') {
    return error.response.data.message
  }
  return fallback
}
