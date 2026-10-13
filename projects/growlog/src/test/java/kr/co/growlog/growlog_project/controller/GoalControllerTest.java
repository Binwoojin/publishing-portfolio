package kr.co.growlog.growlog_project.controller;


import kr.co.growlog.growlog_project.dto.GoalRequest;
import kr.co.growlog.growlog_project.entity.Category;
import kr.co.growlog.growlog_project.entity.Goal;
import kr.co.growlog.growlog_project.entity.Member;
import kr.co.growlog.growlog_project.security.LoginMemberPrincipal;
import kr.co.growlog.growlog_project.service.GoalService;
import kr.co.growlog.growlog_project.service.MemberService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/*
 * Mockito로 Service의 동작을 설정할 때 사용한다.
 */
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/*
 * 전체 Spring 애플리케이션 환경을 실행한다.
 *
 * SecurityConfig와 Security 관련 Bean도 자동으로 등록되므로
 * HttpSecurity Bean을 찾을 수 없다는 오류가 발생하지 않는다.
 */
@SpringBootTest

/*
 * 실제 웹 서버를 실행하지 않고
 * MockMvc를 사용할 수 있게 한다.
 */
@AutoConfigureMockMvc

/*
 * application-test.yaml 설정을 활성화한다.
 *
 * 실제 운영 DB 대신 H2 메모리 테스트 DB가 사용된다.
 */
@ActiveProfiles("test")
class GoalControllerTest {
    /*
     * 실제 웹 서버를 실행하지 않고
     * HTTP 요청과 응답을 테스트한다.
     */
    @Autowired
    private MockMvc mockMvc;

    /*
     * GoalController가 사용하는 GoalService를 가짜 객체로 등록한다.
     *
     * Controller 테스트에서는 실제 DB 작업을 수행하지 않고
     * Controller가 GoalService를 올바르게 호출하는지 확인한다.
     */
    @MockitoBean
    private GoalService goalService;

    /*
     * GlobalModelAttributeAdvice가 공통 헤더 회원 정보를
     * 조회할 때 MemberService를 사용하기 때문에 필요하다.
     */
    @MockitoBean
    private MemberService memberService;

    /*
     * 각 테스트에서 공통으로 사용할 회원과 Principal이다.
     */
    private Member loginMember;
    private LoginMemberPrincipal principal;

    /*
     * 각 테스트를 실행하기 전에 한 번씩 실행된다.
     *
     * 테스트용 로그인 회원과 Principal을 준비한다.
     */
    @BeforeEach
    void setUp() {
        /*
         * 실제 DB에는 저장하지 않고
         * 테스트에서만 사용할 Member 객체를 만든다.
         */
        loginMember = Member.builder()
                .memberNo(1L)
                .email("testest@example.com")
                .password("encoded-password")
                .nickname("테스트회원")
                .userName("테스트")
                .build();

        /*
         * 실제 프로젝트에서 사용하는 Principal과 같은 형태로 만든다.
         */
        principal = new LoginMemberPrincipal(loginMember);

        /*
         * 공통 헤더 정보를 조회가 발생하면
         * 테스트 회원을 반환하도록 설정한다
         */
        when(memberService.findById(1L))
                .thenReturn(loginMember);
    }

    @Test
    @DisplayName("로그인 회원의 목표 목록을 조회한다.")
    void goalList() throws Exception {
        /*
         * GoalService가 반환할 가짜 목표를 만든다.
         */
        Goal goal = Goal.builder()
                .goalNum(10L)
                .member(loginMember)
                .goalTitle("React 공부하기")
                .goalContent("React 기본 문법 공부")
                .build();

        /*
         * Controller의 목표 목록 조회 결과로 사용할 List를 만든다
         *
         * List.of(goal)은 goal 객체 하나가 들어 있는
         * 읽기 전용 목록을 만든다는 의미다.
         */
        List<Goal> goals = List.of(goal);

        /*
         * Controller가 회원 번호 1번의 목표를 조회하면
         * 위에서 만든 goals 목록을 반환하도록 설정한다.
         */
        when(goalService.findGoalsByMember(1L))
                .thenReturn(goals);

        /*
         * 로그인된 테스트 회원으로
         * GET /goal/list 요청을 보낸다.
         */
        mockMvc.perform(
                get("/goal/list")
                        .with(user(principal))
        )

                /*
                 * 요청이 정상 처리되어 HTTP 200을 밚놘하는지 확인한다.
                 */
                .andExpect(status().isOk())
                /*
                 * Controller가 반환하는 JSP 이름을 확인한다.
                 */
                .andExpect(view().name("goal/list"))
                /*
                 * Model의 goal 속성에 Service가 반환한
                 * 목표 목록이 들어 있는지 확인
                 */
                .andExpect(model().attribute("goal", goals));
    }

    @Test
    @DisplayName("목표 등록 화면에 카테고리 목록을 전달한다.")
    void goalWriteForm() throws Exception {
        /*
         * 목표 등록 화면에서 사용할 가짜 카테고리를 만든다.
         */
        Category category = Category.builder()
                .categoryNum(1L)
                .categoryName("공부")
                .categoryColor("#4CAF50")
                .categoryIcon("book")
                .build();

        List<Category> categories = List.of(category);

        /*
         * Controller가 카테고리 목록을 조회하면
         * 위 목록을 반환하도록 설정한다.
         */
        when(goalService.findAllCategories()).thenReturn(categories);

        /*
         * 로그인 회원으로 목표 등록 화면에 접근한다.
         */
        mockMvc.perform(
                get("/goal/write")
                        .with(user(principal))
        )
                .andExpect(status().isOk())
                .andExpect(view().name("goal/write"))
                /*
                 * 등록 화면에서 사용할 categories가
                 * Model에 전달됐는지 확인한다.
                 */
                .andExpect(model().attribute("categories", categories));
    }

    @Test
    @DisplayName("로그인 회원이 새로운 목표를 등록한다.")
    void saveGoal() throws Exception {
        /*
         * 실제 goal/write.jsp 폼에서 전달하는 것처럼
         * 목표 데이터를 요청 파라미터로 전달한다.
         */
        mockMvc.perform(
                post("/goal/write")
                /*
                 * 프로젝트의 LoginMemberPrincipal을 인증 사용자로 전달한다.
                 */
                        .with(user(principal))
                /*
                 * CSRF가 활성화되어 있으므로
                 * 정상 POST 요청에는 반드시 토큰이 필요하다.
                 */
                        .with(csrf())

                        .param("goalTitle", "Spring Security 공부")
                        .param("goalContent", "CSRF와 인증 테스트")
                        .param("startDate", "2026-07-31")
                        .param("endDate", "2026-08-07")
                        .param("categoryNum", "1")
        )
                /*
                 * 등록 성공 후 목표 목록으로 이동하는지 확인한다.
                 */
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/goal/list"));
                /*
                 * Controller가 GoalService에 전달한 GoalRequest를
                 * 직접 꺼내서 확인하기 위한 ArgumentCaptor다.
                 */
        ArgumentCaptor<GoalRequest> requestCaptor = ArgumentCaptor.forClass(GoalRequest.class);
        /*
         * 회원 번호 1번과 GoalRequest를 이용해
         * saveGoal()이 한 번 호출됐는지 확인한다.
         */
        verify(goalService).saveGoal(eq(1L), requestCaptor.capture());

        /*
         * Controller의 @ModelAttribute가
         * HTTP 요청 값을 GoalRequest에 제대로 저장했는지 확인한다.
         */
        GoalRequest capturedRequest = requestCaptor.getValue();

        assertEquals("Spring Security 공부", capturedRequest.getGoalTitle());
        assertEquals("CSRF와 인증 테스트", capturedRequest.getGoalContent());
        assertEquals(1L, capturedRequest.getCategoryNum());
    }

    @Test
    @DisplayName("본인의 목표 수정 화면을 조회한다.")
    void goalEditPage() throws Exception {
        /*
         * 수정할 목표 번호는 10번으로 가정
         */
        Goal goal = Goal.builder()
                .goalNum(10L)
                .member(loginMember)
                .goalTitle("기존 목표")
                .goalContent("기존 목표 내용")
                .build();

        Category category = Category.builder()
                .categoryNum(1L)
                .categoryName("공부")
                .categoryColor("#4CAF50")
                .categoryIcon("book")
                .build();

        List<Category> categories = List.of(category);

        /*
         * 목표 번호 10번을 회원 번호 1번이 조회하면
         * 가짜 목표를 반환하도록 설정한다.
         *
         * memberNo까지 전달하기 때문에
         * 다른 회원의 목표 접근을 막는 구조도 확인할 수 있다.
         */
        when(goalService.findGoalById(10L, 1L)).thenReturn(goal);
        when(goalService.findAllCategories()).thenReturn(categories);

        mockMvc.perform(
                get("/goal/edit/10")
                        .with(user(principal))
        )
                .andExpect(status().isOk())
                .andExpect(view().name("goal/edit"))
                .andExpect(model().attribute("goal", goal))
                .andExpect(model().attribute("categories", categories));
    }

    @Test
    @DisplayName("로그인 회원이 본인의 목표를 수정한다.")
    void updateGoal() throws Exception {
        mockMvc.perform(
                post("/goal/edit/10")
                        .with(user(principal))
                        .with(csrf())
                /*
                 * 목표 수정 폼에서 전달하는 데이터다.
                 */
                        .param("goalTitle", "수정된 목표")
                        .param("goalContent", "수정된 목표 내용")
                        .param("startDate", "2026-07-31")
                        .param("endDate", "2026-08-10")
                        .param("goalProgress", "50")
                        .param("goalStatus", "진행중")
                        .param("categoryNum", "1")
        )
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/goal/list"));

        /*
         * Service에 전달될 수정 요청을 가져온다.
         */
        ArgumentCaptor<GoalRequest> requestCaptor = ArgumentCaptor.forClass(GoalRequest.class);

        /*
         * 목표 번호, 로그인 회원 번호, 수정 데이터가
         * 올바르게 전달됐는지 확인한다.
         */
        verify(goalService).updateGoal(eq(10L), eq(1L), requestCaptor.capture());

        GoalRequest capturedRequest = requestCaptor.getValue();

        assertEquals("수정된 목표", capturedRequest.getGoalTitle());
        assertEquals(50, capturedRequest.getGoalProgress());
        assertEquals("진행중", capturedRequest.getGoalStatus());
    }

    @Test
    @DisplayName("로그인 회원이 본인의 목표를 삭제한다.")
    void deleteGoal() throws Exception {
        /*
         * POST /goal/delete/10 요청을 보낸다.
         */
        mockMvc.perform(
                post("/goal/delete/10")
                        .with(user(principal))
                        .with(csrf())

        )
                /*
                 * 삭제 완료 후 목표 목록으로 이동하는지 확인한다.
                 */
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/goal/list"));

                /*
                 * 목표 번호 10번과 로그인 회원 번호 1번으로
                 * 삭제 Service가 호출됐는지 확인한다.
                 */
        verify(goalService).deleteGoal(10L, 1L);
    }

    @Test
    @DisplayName("다른 회원의 목표 수정 화면에는 접근할 수 없다.")
    void cannotEditAnotherMembersGoal() throws Exception {
        /*
         * GoalService가 다른 회원의 목표 접근이라고 판단하여 예외를 발생시키는 상황을 만든다.
         */
        when(goalService.findGoalById(10L, 1L)).thenThrow(new IllegalArgumentException("목표를 찾을 수 없거나 수정 권한이 없습니다."));

        mockMvc.perform(get("/goal/edit/10")
                .with(user(principal))
        )
                /*
                 * Controller의 catch 블록이 실행되어
                 * 목표 목록으로 이동해야 한다.
                 */
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/goal/list"))

                /*
                 * RedirectAttributes에 오류 메시지가
                 * 저장됐는지 확인한다.
                 */
                .andExpect(flash().attribute("errorMessage", "목표를 찾을 수 없거나 수정 권한이 없습니다."));
    }
}
