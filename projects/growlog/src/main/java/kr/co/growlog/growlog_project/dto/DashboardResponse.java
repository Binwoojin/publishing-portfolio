package kr.co.growlog.growlog_project.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

/*
 * Vue Dashboard(GET /api/dashboard)가 사용하는 요약 응답
 *
 * 새 통계를 계산하지 않고, 기존 HomeController.homePage()가 JSP에 넘기던
 * 값들(진행 중 목표 수, 이번 달 기록 수, 연속 출석일, 최근 타임라인)을
 * 그대로 재사용해서 JSON으로만 다시 포장한 것이다.
 */
@Getter
@AllArgsConstructor
public class DashboardResponse {
    private long activeGoalCount;
    private long recordsThisMonth;
    private int streakDays;
    private List<TimelineItem> recentTimeline;
}
