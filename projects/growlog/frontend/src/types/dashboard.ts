import type { TimelineItem } from './timeline'

export interface DashboardSummary {
  activeGoalCount: number
  recordsThisMonth: number
  streakDays: number
  recentTimeline: TimelineItem[]
}
