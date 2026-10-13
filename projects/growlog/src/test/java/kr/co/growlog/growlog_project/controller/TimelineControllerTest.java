package kr.co.growlog.growlog_project.controller;

import kr.co.growlog.growlog_project.dto.AttendanceSummary;
import kr.co.growlog.growlog_project.dto.TimelineItem;
import kr.co.growlog.growlog_project.entity.Member;
import kr.co.growlog.growlog_project.security.LoginMemberPrincipal;
import kr.co.growlog.growlog_project.service.AttendanceService;
import kr.co.growlog.growlog_project.service.GoalService;
import kr.co.growlog.growlog_project.service.GrowthRecordService;
import kr.co.growlog.growlog_project.service.MemberService;
import kr.co.growlog.growlog_project.service.TimelineService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/*
 * Timeline API가 기존 JSP(PageController.timeline())와 동일한 월 선택
 * 로직/Service를 재사용해서 JSON으로 조립하는지 확인
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TimelineControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private MemberService memberService;

    @MockitoBean
    private GoalService goalService;

    @MockitoBean
    private GrowthRecordService growthRecordService;

    @MockitoBean
    private AttendanceService attendanceService;

    @MockitoBean
    private TimelineService timelineService;

    private LoginMemberPrincipal principal;

    @BeforeEach
    void setUp() {
        Member loginMember = Member.builder()
                .memberNo(1L)
                .email("testest@example.com")
                .password("encoded-password")
                .nickname("테스트회원")
                .userName("테스트")
                .build();

        principal = new LoginMemberPrincipal(loginMember);
        when(memberService.findById(1L)).thenReturn(loginMember);
    }

    @Test
    @DisplayName("비로그인 상태로 GET /api/timeline을 호출하면 401을 받는다.")
    void timelineWithoutLoginReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/timeline"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("year/month 없이 호출하면 이번 달 기준으로 조회한다.")
    void timelineDefaultsToCurrentMonth() throws Exception {
        YearMonth currentMonth = YearMonth.now();

        TimelineItem recordItem = new TimelineItem(
                "RECORD", 5L, "Vue Composition API 학습", "오늘 컴포넌트 구조를 정리했다.",
                LocalDateTime.now(), "/record/5"
        );
        when(timelineService.getTimeline(eq(1L), eq(currentMonth)))
                .thenReturn(List.of(recordItem));
        when(growthRecordService.countRecordByMemberAndMonth(eq(1L), eq(currentMonth))).thenReturn(4L);
        when(goalService.countGoalsByMemberAndMonth(eq(1L), eq(currentMonth))).thenReturn(2L);
        when(attendanceService.getAttendanceSummary(1L))
                .thenReturn(new AttendanceSummary(3, true, 5, 4, List.of(1, 2, 3)));

        mockMvc.perform(get("/api/timeline").with(user(principal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.selectedMonth").value(currentMonth.toString()))
                .andExpect(jsonPath("$.currentMonthSelected").value(true))
                .andExpect(jsonPath("$.monthlyRecordCount").value(4))
                .andExpect(jsonPath("$.monthlyGoalCount").value(2))
                .andExpect(jsonPath("$.currentStreak").value(3))
                .andExpect(jsonPath("$.timelineItems[0].type").value("RECORD"))
                .andExpect(jsonPath("$.timelineItems[0].title").value("Vue Composition API 학습"));
    }

    @Test
    @DisplayName("미래 달을 요청하면 이번 달로 보정된다.")
    void timelineClampsFutureMonthToCurrentMonth() throws Exception {
        YearMonth currentMonth = YearMonth.now();
        YearMonth future = currentMonth.plusMonths(3);

        when(timelineService.getTimeline(eq(1L), any(YearMonth.class))).thenReturn(List.of());
        when(growthRecordService.countRecordByMemberAndMonth(eq(1L), any(YearMonth.class))).thenReturn(0L);
        when(goalService.countGoalsByMemberAndMonth(eq(1L), any(YearMonth.class))).thenReturn(0L);
        when(attendanceService.getAttendanceSummary(1L))
                .thenReturn(new AttendanceSummary(0, false, 0, 0, List.of()));

        mockMvc.perform(get("/api/timeline")
                        .param("year", String.valueOf(future.getYear()))
                        .param("month", String.valueOf(future.getMonthValue()))
                        .with(user(principal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.selectedMonth").value(currentMonth.toString()));
    }
}
