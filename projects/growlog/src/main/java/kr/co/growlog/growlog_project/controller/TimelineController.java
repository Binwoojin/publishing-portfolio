package kr.co.growlog.growlog_project.controller;

import kr.co.growlog.growlog_project.dto.AttendanceSummary;
import kr.co.growlog.growlog_project.dto.TimelineItem;
import kr.co.growlog.growlog_project.dto.TimelineResponse;
import kr.co.growlog.growlog_project.security.LoginMemberPrincipal;
import kr.co.growlog.growlog_project.service.AttendanceService;
import kr.co.growlog.growlog_project.service.GoalService;
import kr.co.growlog.growlog_project.service.GrowthRecordService;
import kr.co.growlog.growlog_project.service.TimelineService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.YearMonth;
import java.util.List;

/*
 * Vue SPA의 Timeline 화면이 사용하는 API
 *
 * 새 비즈니스 로직을 추가하지 않는다 — 기존 JSP용 PageController.timeline()과
 * 동일한 월 선택/보정 로직과 Service 호출을 그대로 재사용해서 JSON으로만
 * 다시 포장한다.
 */
@RequiredArgsConstructor
@RestController
public class TimelineController {

    private final TimelineService timelineService;
    private final GoalService goalService;
    private final GrowthRecordService growthRecordService;
    private final AttendanceService attendanceService;

    @GetMapping("/api/timeline")
    public TimelineResponse timeline(
            @AuthenticationPrincipal LoginMemberPrincipal principal,
            @RequestParam(name = "year", required = false) Integer year,
            @RequestParam(name = "month", required = false) Integer month) {

        Long memberNo = principal.getMemberNo();

        YearMonth currentMonth = YearMonth.now();
        YearMonth selectedMonth;

        /*
         * year와 month가 모두 전달된 경우에만 해당 연, 월을 사용하고,
         * 그렇지 않거나 올바르지 않은 값이면 현재 연, 월로 처리한다.
         * (PageController.timeline()과 동일한 보정 로직)
         */
        try {
            selectedMonth = year != null && month != null
                    ? YearMonth.of(year, month)
                    : currentMonth;
        } catch (RuntimeException e) {
            selectedMonth = currentMonth;
        }

        /* 미래 달은 조회하지 못하도록 현재 달로 제한한다. */
        if (selectedMonth.isAfter(currentMonth)) {
            selectedMonth = currentMonth;
        }

        List<TimelineItem> timelineItems = timelineService.getTimeline(memberNo, selectedMonth);
        long monthlyRecordCount = growthRecordService.countRecordByMemberAndMonth(memberNo, selectedMonth);
        long monthlyGoalCount = goalService.countGoalsByMemberAndMonth(memberNo, selectedMonth);
        AttendanceSummary attendanceSummary = attendanceService.getAttendanceSummary(memberNo);

        YearMonth previousMonth = selectedMonth.minusMonths(1);
        YearMonth nextMonth = selectedMonth.plusMonths(1);
        boolean currentMonthSelected = selectedMonth.equals(currentMonth);

        return new TimelineResponse(
                timelineItems,
                monthlyRecordCount,
                monthlyGoalCount,
                attendanceSummary.getCurrentStreak(),
                selectedMonth.toString(),
                previousMonth.toString(),
                nextMonth.toString(),
                currentMonthSelected
        );
    }
}
