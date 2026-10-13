import api from './axios'
import type { RecordDetail, RecordFormPayload } from '../types/record'

export async function fetchRecordDetail(recordNum: number | string): Promise<RecordDetail> {
  const response = await api.get<RecordDetail>(`/api/records/${recordNum}`)
  return response.data
}

/*
 * 이미지 파일을 함께 보내야 해서 JSON이 아니라 multipart/form-data로
 * 만든다. Content-Type 헤더는 직접 지정하지 않는다 — Axios가 FormData를
 * 감지하면 boundary를 포함한 헤더를 스스로 채우는데, 여기서 값을
 * 강제로 넣으면 boundary가 빠져 서버가 파싱하지 못한다.
 */
function buildRecordFormData(payload: RecordFormPayload): FormData {
  const formData = new FormData()

  if (payload.goalNum !== null) {
    formData.append('goalNum', String(payload.goalNum))
  }
  formData.append('title', payload.title)
  formData.append('content', payload.content)
  formData.append('difficulty', payload.difficulty)

  if (payload.todayLearning) formData.append('todayLearning', payload.todayLearning)
  if (payload.solution) formData.append('solution', payload.solution)
  if (payload.retrospective) formData.append('retrospective', payload.retrospective)
  if (payload.youtubeUrl) formData.append('youtubeUrl', payload.youtubeUrl)

  payload.imageFiles.forEach((file) => formData.append('imageFiles', file))
  payload.deleteMediaNums.forEach((mediaNum) => formData.append('deleteMediaNums', String(mediaNum)))

  return formData
}

export async function createRecord(payload: RecordFormPayload): Promise<RecordDetail> {
  const response = await api.post<RecordDetail>('/api/records', buildRecordFormData(payload))
  return response.data
}

export async function updateRecord(recordNum: number | string, payload: RecordFormPayload): Promise<RecordDetail> {
  const response = await api.put<RecordDetail>(`/api/records/${recordNum}`, buildRecordFormData(payload))
  return response.data
}

export async function deleteRecord(recordNum: number | string): Promise<void> {
  await api.delete(`/api/records/${recordNum}`)
}
