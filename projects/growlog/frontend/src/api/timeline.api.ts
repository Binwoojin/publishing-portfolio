import api from './axios'
import type { TimelineResponse } from '../types/timeline'

export async function fetchTimeline(year?: number, month?: number): Promise<TimelineResponse> {
  const response = await api.get<TimelineResponse>('/api/timeline', {
    params: year && month ? { year, month } : undefined,
  })
  return response.data
}
