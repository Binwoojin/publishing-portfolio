export interface Category {
  categoryNum: number
  categoryName: string
  categoryIcon: string
  categoryColor: string
}

export type GoalStatus = '진행중' | '완료' | '중단'

export interface Goal {
  goalNum: number
  goalTitle: string
  goalContent: string
  goalProgress: number
  goalStatus: GoalStatus
  startDate: string | null
  endDate: string | null
  createdAt: string
  category: Category
}

/* POST(생성)에서는 goalProgress/goalStatus를 보내지 않아도 된다 —
 * 백엔드 GoalService.saveGoal()이 항상 0%/"진행중"으로 시작하기 때문이다.
 * PUT(수정)에서는 둘 다 필수다. */
export interface GoalRequest {
  goalTitle: string
  goalContent: string
  categoryNum: number
  startDate?: string | null
  endDate?: string | null
  goalProgress?: number
  goalStatus?: GoalStatus
}
