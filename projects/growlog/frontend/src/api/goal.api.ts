import api from './axios'
import type { Category, Goal, GoalRequest } from '../types/goal'

export async function fetchGoals(): Promise<Goal[]> {
  const response = await api.get<Goal[]>('/api/goals')
  return response.data
}

export async function fetchCategories(): Promise<Category[]> {
  const response = await api.get<Category[]>('/api/categories')
  return response.data
}

export async function createGoal(request: GoalRequest): Promise<Goal> {
  const response = await api.post<Goal>('/api/goals', request)
  return response.data
}

export async function updateGoal(goalNum: number, request: GoalRequest): Promise<Goal> {
  const response = await api.put<Goal>(`/api/goals/${goalNum}`, request)
  return response.data
}

export async function deleteGoal(goalNum: number): Promise<void> {
  await api.delete(`/api/goals/${goalNum}`)
}
