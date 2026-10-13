package kr.co.growlog.growlog_project.controller;

import kr.co.growlog.growlog_project.dto.DashboardResponse;
import kr.co.growlog.growlog_project.dto.TimelineItem;
import kr.co.growlog.growlog_project.security.LoginMemberPrincipal;
import kr.co.growlog.growlog_project.service.AttendanceService;
import kr.co.growlog.growlog_project.service.GoalService;
import kr.co.growlog.growlog_project.service.GrowthRecordService;
import kr.co.growlog.growlog_project.service.TimelineService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.YearMonth;
import java.util.List;

/*
 * Vue SPA의 Dashboard 화면이 사용하는 API
 *
 * 새 비즈니스 로직을 추가하지 않는다 — HomeController.homePage()가 기존
 * JSP 홈 화면에 넘기던 것과 동일한 Service 메서드를 그대로 호출해서
 * JSON으로만 다시 포장한다.
 */
@RequiredArgsConstructor
@RestController
public class DashboardController {

    private final GoalService goalService;
    private final GrowthRecordService growthRecordService;
    private final AttendanceService attendanceService;
    private final TimelineService timelineService;

    private static final int RECENT_TIMELINE_LIMIT = 3;

    @GetMapping("/api/dashboard")
    public DashboardResponse dashboard(@AuthenticationPrincipal LoginMemberPrincipal principal) {
        Long memberNo = principal.getMemberNo();

        long activeGoalCount = goalService.countThisWeekInProgressGoals(memberNo);
        long recordsThisMonth = growthRecordService.countThisMonthRecords(memberNo);
        int streakDays = attendanceService.getAttendanceSummary(memberNo).getCurrentStreak();

        List<TimelineItem> recentTimeline = timelineService
                .getTimeline(memberNo, YearMonth.now())
                .stream()
                .limit(RECENT_TIMELINE_LIMIT)
                .toList();

        return new DashboardResponse(activeGoalCount, recordsThisMonth, streakDays, recentTimeline);
    }
}
