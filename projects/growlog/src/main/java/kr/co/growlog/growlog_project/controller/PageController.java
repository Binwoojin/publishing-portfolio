package kr.co.growlog.growlog_project.controller;

import kr.co.growlog.growlog_project.dto.AttendanceSummary;
import kr.co.growlog.growlog_project.dto.TimelineItem;
import kr.co.growlog.growlog_project.security.LoginMemberPrincipal;
import kr.co.growlog.growlog_project.service.AttendanceService;
import kr.co.growlog.growlog_project.service.GoalService;
import kr.co.growlog.growlog_project.service.GrowthRecordService;
import kr.co.growlog.growlog_project.service.TimelineService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.YearMonth;
import java.util.List;

/**
 * 별도의 도메인 Controller가 없는 공통 페이지의
 * 화면 요청을 처리하는 Controller
 */
@RequiredArgsConstructor
@Controller
public class PageController {

   // 타임라인에 표시할 목표와 성장 기록을 조회하기 위해 사용
    private final TimelineService timelineService;
    private final GoalService goalService;
    private final GrowthRecordService growthRecordService;
    private final AttendanceService attendanceService;

    /**
     * 로그인 회원의 타임라인 페이지를 표시
     *
     * /timeline은 SecurityConfig에서 authenticated()로 보호되므로
     * 인증되지 않은 사용자는 Controller 실행 전에 로그인 페이지로 이동한다.
     *
     * @param principal Spring Security에 저장된 로그인 회원 정보
     * @param model JSP에 데이터를 전달하기 위한 객체
     * @return 타임라인 JSP 경로
     */
    @GetMapping("/timeline")
    public String timeline(@AuthenticationPrincipal LoginMemberPrincipal principal,
                           @RequestParam(name = "year", required = false) Integer year,
                           @RequestParam(name = "month", required = false) Integer month,
                           Model model) {

        /*
         * Spring Security Principal에서 회원 번호를 가져와
         * 해당 회원의 목표와 성장 기록만 조회한다.
         */
        Long memberNo = principal.getMemberNo();

        YearMonth currentMonth = YearMonth.now();
        YearMonth selectedMonth;

        /*
         * year와 month가 모두 전달된 경우에만
         * 해당 연, 월을 사용한다.
         *
         * 전달되지 않았다면 현재 연, 월을 기본값으로 사용한다.
         */
        try {
            selectedMonth = year != null && month != null
                    ? YearMonth.of(year, month)
                    : currentMonth;
        } catch (RuntimeException e) {
            // 올바르지 않은 연, 월이면 현재 달로 처리한다.
            selectedMonth = currentMonth;
        }

        /*
         * 미래 달은 조회하지 못하도록 현재 달로 제한한다.
         */
        if (selectedMonth.isAfter(currentMonth)) {
            selectedMonth = currentMonth;
        }

        // 목표와 성장 기록이 통합된 타임라인 목록 조회
        List<TimelineItem> timelineItems = timelineService.getTimeline(memberNo, selectedMonth);

        // 선택한 달의 성장 기록 개수
        long monthlyRecordCount = growthRecordService.countRecordByMemberAndMonth(memberNo, selectedMonth);

        // 선택한 달의 등록된 목표 개수를 조회
        long monthlyGoalCount = goalService.countGoalsByMemberAndMonth(memberNo, selectedMonth);

        /*
         * 현재 연속 기록은 선택한 달과 무관하게
         * 오늘을 기준으로 계산한다.
         */
        AttendanceSummary attendanceSummary = attendanceService.getAttendanceSummary(memberNo);
        YearMonth previousMonth = selectedMonth.minusMonths(1);
        YearMonth nextMonth = selectedMonth.plusMonths(1);
        boolean currentMonthSelected = selectedMonth.equals(currentMonth);

        // timeline.jsp에서 반복 출력할 수 있도록 Model에 저장

        model.addAttribute("timelineItems", timelineItems);
        model.addAttribute("monthlyRecordCount", monthlyRecordCount);
        model.addAttribute("monthlyGoalCount", monthlyGoalCount);
        model.addAttribute("currentStreak", attendanceSummary.getCurrentStreak());
        model.addAttribute("selectedMonth", selectedMonth);
        model.addAttribute("previousMonth", previousMonth);
        model.addAttribute("nextMonth", nextMonth);
        model.addAttribute("currentMonthSelected", currentMonthSelected);

        return "timeline";
    }
}
