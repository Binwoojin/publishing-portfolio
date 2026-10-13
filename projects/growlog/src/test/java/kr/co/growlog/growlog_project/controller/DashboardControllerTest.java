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
 * Dashboard가 기존 Service를 올바르게 재사용해서 JSON으로 조립하는지
 * 확인하는 테스트
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DashboardControllerTest {

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

        /* GlobalModelAttributeAdvice가 공통 헤더 회원 정보를 조회할 때 사용 */
        when(memberService.findById(1L)).thenReturn(loginMember);
    }

    @Test
    @DisplayName("비로그인 상태로 GET /api/dashboard를 호출하면 401을 받는다.")
    void dashboardWithoutLoginReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/dashboard"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("로그인 상태로 GET /api/dashboard를 호출하면 기존 Service 값을 그대로 조합한 JSON을 받는다.")
    void dashboardReturnsSummaryFromExistingServices() throws Exception {
        when(goalService.countThisWeekInProgressGoals(1L)).thenReturn(3L);
        when(growthRecordService.countThisMonthRecords(1L)).thenReturn(12L);
        when(attendanceService.getAttendanceSummary(1L))
                .thenReturn(new AttendanceSummary(7, true, 10, 5, List.of(1, 2, 5)));

        TimelineItem goalItem = new TimelineItem(
                "GOAL", 100L, "프론트엔드 포트폴리오 완성하기", "설명",
                LocalDateTime.now(), "/goal/list?openGoal=100"
        );
        when(timelineService.getTimeline(eq(1L), any(YearMonth.class)))
                .thenReturn(List.of(goalItem));

        mockMvc.perform(get("/api/dashboard").with(user(principal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activeGoalCount").value(3))
                .andExpect(jsonPath("$.recordsThisMonth").value(12))
                .andExpect(jsonPath("$.streakDays").value(7))
                .andExpect(jsonPath("$.recentTimeline[0].type").value("GOAL"))
                .andExpect(jsonPath("$.recentTimeline[0].title").value("프론트엔드 포트폴리오 완성하기"));
    }
}
