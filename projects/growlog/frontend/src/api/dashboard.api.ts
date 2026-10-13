import api from './axios'
import type { DashboardSummary } from '../types/dashboard'

export async function fetchDashboard(): Promise<DashboardSummary> {
  const response = await api.get<DashboardSummary>('/api/dashboard')
  return response.data
}
