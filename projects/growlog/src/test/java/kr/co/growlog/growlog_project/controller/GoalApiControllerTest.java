package kr.co.growlog.growlog_project.controller;

import kr.co.growlog.growlog_project.entity.Category;
import kr.co.growlog.growlog_project.entity.Goal;
import kr.co.growlog.growlog_project.entity.Member;
import kr.co.growlog.growlog_project.security.LoginMemberPrincipal;
import kr.co.growlog.growlog_project.service.GoalService;
import kr.co.growlog.growlog_project.service.MemberService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/*
 * Goal API가 기존 GoalService를 그대로 재사용해서 JSON으로 노출하는지,
 * 검증 실패 시 400으로 응답하는지 확인
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class GoalApiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private MemberService memberService;

    @MockitoBean
    private GoalService goalService;

    private LoginMemberPrincipal principal;
    private Member loginMember;
    private Category category;

    @BeforeEach
    void setUp() {
        loginMember = Member.builder()
                .memberNo(1L)
                .email("testest@example.com")
                .password("encoded-password")
                .nickname("테스트회원")
                .userName("테스트")
                .build();

        principal = new LoginMemberPrincipal(loginMember);
        when(memberService.findById(1L)).thenReturn(loginMember);

        category = Category.builder()
                .categoryNum(10L)
                .categoryName("프로젝트")
                .categoryIcon("📁")
                .categoryColor("#16a06b")
                .build();
    }

    private Goal sampleGoal() {
        return Goal.builder()
                .goalNum(100L)
                .member(loginMember)
                .category(category)
                .goalTitle("Vue 리뉴얼 완성하기")
                .goalContent("2주 안에 마무리")
                .goalProgress(40)
                .goalStatus("진행중")
                .startDate(LocalDate.of(2026, 9, 1))
                .endDate(LocalDate.of(2026, 9, 28))
                .build();
    }

    @Test
    @DisplayName("비로그인 상태로 GET /api/goals를 호출하면 401을 받는다.")
    void listWithoutLoginReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/goals"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("로그인 상태로 목표 목록을 조회하면 기존 GoalService 값을 JSON으로 받는다.")
    void listReturnsGoalsFromExistingService() throws Exception {
        when(goalService.findGoalsByMember(1L)).thenReturn(List.of(sampleGoal()));

        mockMvc.perform(get("/api/goals").with(user(principal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].goalNum").value(100))
                .andExpect(jsonPath("$[0].goalTitle").value("Vue 리뉴얼 완성하기"))
                .andExpect(jsonPath("$[0].goalProgress").value(40))
                .andExpect(jsonPath("$[0].category.categoryName").value("프로젝트"));
    }

    @Test
    @DisplayName("카테고리 목록을 조회할 수 있다.")
    void categoriesReturnsExistingCategories() throws Exception {
        when(goalService.findAllCategories()).thenReturn(List.of(category));

        mockMvc.perform(get("/api/categories").with(user(principal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].categoryName").value("프로젝트"));
    }

    @Test
    @DisplayName("CSRF 토큰 없이 목표를 생성하면 403으로 막힌다.")
    void createWithoutCsrfIsForbidden() throws Exception {
        mockMvc.perform(post("/api/goals")
                        .with(user(principal))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("목표 생성에 성공하면 201과 생성된 목표를 받는다.")
    void createGoalSucceeds() throws Exception {
        when(goalService.saveGoal(eq(1L), any())).thenReturn(sampleGoal());

        mockMvc.perform(post("/api/goals")
                        .with(user(principal))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"goalTitle":"Vue 리뉴얼 완성하기","goalContent":"2주 안에 마무리","categoryNum":10,"startDate":"2026-09-01","endDate":"2026-09-28"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.goalNum").value(100));
    }

    @Test
    @DisplayName("목표 생성 요청이 검증에 실패하면 400과 에러 메시지를 받는다.")
    void createGoalValidationFailureReturns400() throws Exception {
        when(goalService.saveGoal(eq(1L), any()))
                .thenThrow(new IllegalArgumentException("목표 종료일은 시작일보다 빠를 수 없습니다."));

        mockMvc.perform(post("/api/goals")
                        .with(user(principal))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"goalTitle":"t","categoryNum":10,"startDate":"2026-09-28","endDate":"2026-09-01"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("목표 종료일은 시작일보다 빠를 수 없습니다."));
    }

    @Test
    @DisplayName("목표 수정에 성공하면 수정된 목표를 받는다.")
    void updateGoalSucceeds() throws Exception {
        doNothing().when(goalService).updateGoal(eq(100L), eq(1L), any());
        when(goalService.findGoalById(100L, 1L)).thenReturn(sampleGoal());

        mockMvc.perform(put("/api/goals/100")
                        .with(user(principal))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"goalTitle":"Vue 리뉴얼 완성하기","goalContent":"수정","categoryNum":10,"goalProgress":60,"goalStatus":"진행중","startDate":"2026-09-01","endDate":"2026-09-28"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.goalNum").value(100));
    }

    @Test
    @DisplayName("목표 삭제에 성공하면 204를 받는다.")
    void deleteGoalSucceeds() throws Exception {
        doNothing().when(goalService).deleteGoal(100L, 1L);

        mockMvc.perform(delete("/api/goals/100")
                        .with(user(principal))
                        .with(csrf()))
                .andExpect(status().isNoContent());

        verify(goalService).deleteGoal(100L, 1L);
    }

    @Test
    @DisplayName("다른 회원의 목표를 삭제하려 하면 400과 에러 메시지를 받는다.")
    void deleteGoalWithoutPermissionReturns400() throws Exception {
        doThrow(new IllegalArgumentException("목표를 찾을 수 없거나 수정 권한이 없습니다."))
                .when(goalService).deleteGoal(anyLong(), eq(1L));

        mockMvc.perform(delete("/api/goals/999")
                        .with(user(principal))
                        .with(csrf()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("목표를 찾을 수 없거나 수정 권한이 없습니다."));
    }
}
