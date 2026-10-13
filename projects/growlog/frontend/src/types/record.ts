/*
 * Record Detail/Create/Update(REST API: GET/POST/PUT/DELETE /api/records)이
 * 사용하는 타입. 백엔드 GrowthRecordResponse/GrowthRecordRequest와 1:1로
 * 대응한다.
 */
export interface RecordGoalSummary {
  goalNum: number
  goalTitle: string
}

export type MediaType = 'IMAGE' | 'YOUTUBE'

export interface RecordMedia {
  mediaNum: number
  mediaType: MediaType
  mediaUrl: string
  sortOrder: number
}

export type RecordDifficulty = 'EASY' | 'NORMAL' | 'HARD'

export interface RecordDetail {
  recordNum: number
  title: string
  content: string
  todayLearning: string | null
  difficulty: string | null
  solution: string | null
  retrospective: string | null
  createdAt: string
  goal: RecordGoalSummary | null
  mediaList: RecordMedia[]
}

/*
 * 백엔드 GrowthRecordRequest와 동일한 필드만 담는다 — imageFiles는 새로
 * 첨부할 파일, deleteMediaNums는 수정 시 제거할 기존 미디어 번호다
 * (생성 요청에서는 항상 비워 보낸다). multipart/form-data로 보내야 해서
 * 실제 전송은 record.api.ts에서 FormData로 변환한다.
 */
export interface RecordFormPayload {
  goalNum: number | null
  title: string
  content: string
  todayLearning: string
  difficulty: RecordDifficulty
  solution: string
  retrospective: string
  youtubeUrl: string
  imageFiles: File[]
  deleteMediaNums: number[]
}
