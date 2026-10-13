/*
 * Goal과 GrowthRecord는 서로 다른 도메인이지만 Timeline 화면에서는
 * 같은 카드 형태로 표시해야 한다. 백엔드가 이미 TimelineItem DTO로
 * 통일해서 내려주므로, 프론트에서는 그 값을 그대로 Discriminated Union으로
 * 받아 `type` 필드로 안전하게 분기한다.
 *
 * 예) item.type === 'GOAL' 분기 안에서는 TS가 GoalTimelineItem으로
 * 타입을 좁혀준다 (지금은 두 배리언트의 필드가 동일하지만, 이후 목표에만
 * progress 같은 필드가 추가되면 이 분기 덕분에 안전하게 확장할 수 있다).
 */
export interface GoalTimelineItem {
  type: 'GOAL'
  itemNum: number
  title: string
  content: string
  createdAt: string
  detailUrl: string
}

export interface RecordTimelineItem {
  type: 'RECORD'
  itemNum: number
  title: string
  content: string
  createdAt: string
  detailUrl: string
}

export type TimelineItem = GoalTimelineItem | RecordTimelineItem

export type TimelineFilter = 'ALL' | 'GOAL' | 'RECORD'

export interface TimelineResponse {
  timelineItems: TimelineItem[]
  monthlyRecordCount: number
  monthlyGoalCount: number
  currentStreak: number
  /* "YYYY-MM" 형식 */
  selectedMonth: string
  previousMonth: string
  nextMonth: string
  currentMonthSelected: boolean
}
