/*
 * 서버가 LocalDateTime을 ISO 형식 문자열로 내려주는 걸(TimelineItem.
 * createdAt) 화면 표시용 "M월 D일"로 축약한다. 새 API 필드가 아니라
 * 기존 응답에 이미 있던 값을 처음으로 화면에 노출하는 것뿐이다.
 */
export function formatTimelineDate(createdAt: string): string {
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) {
    return createdAt.slice(0, 10)
  }
  return `${date.getMonth() + 1}월 ${date.getDate()}일`
}
