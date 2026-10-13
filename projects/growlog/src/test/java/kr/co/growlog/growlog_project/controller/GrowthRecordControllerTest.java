package kr.co.growlog.growlog_project.controller;


import kr.co.growlog.growlog_project.dto.GrowthRecordRequest;
import kr.co.growlog.growlog_project.entity.Goal;
import kr.co.growlog.growlog_project.entity.GrowthRecord;
import kr.co.growlog.growlog_project.dto.MediaResponse;
import kr.co.growlog.growlog_project.entity.Member;
import kr.co.growlog.growlog_project.security.LoginMemberPrincipal;
import kr.co.growlog.growlog_project.service.GoalService;
import kr.co.growlog.growlog_project.service.GrowthRecordService;
import kr.co.growlog.growlog_project.service.MediaService;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;


/*
 * 전체 Spring 환경을 실행한다
 * SecurityConfig도 자동 등록되기 때문에
 * 로그인 인증과 CSRF 필터를 실제 설정대로 테스트할 수 있다.
 */

@SpringBootTest

/*
 * 실제 웹 서버 없이 HTTP 요청을 테스트할 수 있도록
 * MockMvc를 활성화한다.
 */
@AutoConfigureMockMvc

/*
 * application-test.yaml을 사용한다.
 *
 * 실제 운영 DB가 아니라 H2 메모리 DB가 사용된다.
 */
@ActiveProfiles("test")
class GrowthRecordControllerTest {
    /*
     * GET, POST 등의 HTTP 요청을
     * 실제 브라우저 없이 실행하는 테스트 도구다.
     */
    @Autowired
    private MockMvc mockMvc;

    /*
     * GrowthRecordController가 사용하는 Service를
     * Mockito 가짜 객체로 교체한다.
     */
    @MockitoBean
    private GrowthRecordService growthRecordService;

    /*
     * 성장 기록 작성 및 수정 화면에서
     * 회원의 목표 목록을 조회할 때 사용된다.
     */
    @MockitoBean
    private GoalService goalService;

    /*
     * 성장 기록의 이미지와 Youtube 미디어를
     * 조회할 때 사용된다.
     */
    @MockitoBean
    private MediaService mediaService;

    /*
     * GlobalModelAttributeAdvice가 공통 헤더에 표시할
     * 회원 정보를 조회할 때 사용된다.
     */
    @MockitoBean
    private MemberService memberService;

    /*
     * 모든 테스트에서 공통으로 사용할
     * 로그인 회원과 Principal이다.
     */
    private Member loginMember;
    private LoginMemberPrincipal principal;

    /*
     * 각 테스트를 시작하기 전에
     * 테스트용 로그인 회원을 준비한다.
     */
    @BeforeEach
    void setUp() {
        /*
         * DB에 실제로 저장하지 않고
         * 테스트에서만 사용할 회원 객체를 만든다.
         */
        loginMember = Member.builder()
                .memberNo(1L)
                .email("record-test@example.com")
                .password("encorded-password")
                .nickname("기록테스트회원")
                .userName("테스트")
                .build();

        /*
         * 실제 프로젝트 Controller가 요구하는
         * LoginMemberPrincipal을 생성한다.
         */
        principal = new LoginMemberPrincipal(loginMember);

        /*
         * 공통 헤더에서 회원 번호 1번을 조회하면
         * 위에서 만든 테스트 회원을 반환한다,
         */
        when(memberService.findById(1L)).thenReturn(loginMember);
    }

    @Test
    @DisplayName("로그인 회원의 성장 기록 목록을 조회한다.")
    void recordList() throws Exception {

        /*
         * GrowthRecordService가 반환할
         * 테스트용 성장 기록을 만든다.
         */
        GrowthRecord record = GrowthRecord.builder()
                .recordNum(10L)
                .member(loginMember)
                .title("Spring Security 공부")
                .content("CSRF 적용 방법을 공부했다.")
                .build();

        /*
         * 성장 기록 한 개가 들어 있는 목록을 만든다.
         */
        List<GrowthRecord> records = List.of(record);

        /*
         * 회원 번호 1번의 성장 기록을 조회하면
         * 위에서 만든 records를 반환하게 한다.
         */

        when(growthRecordService.findRecordsByMember(1L)).thenReturn(records);

        /*
         * 로그인 회원으로 GET /record/list 요청을 보낸다.
         */
        mockMvc.perform(
                get("/record/list").with(user(principal))
        )
                /*
                 * HTTP 200 응답인지 확인한다.
                 */
                .andExpect(status().isOk())
                /*
                 * record/list JSP를 반환하는지 확인한다.
                 */
                .andExpect(view().name("record/list"))
                /*
                 * Model의 records 속성에 준비한 목록이
                 * 저장됐는지 확인한다.
                 */
                .andExpect(model().attribute("records", records));
    }

    @Test
    @DisplayName("성장 기록 작성 화면에 로그인 회원의 목표 목록을 전달한다.")
    void recordWriteForm() throws Exception {

        /*
         * 성장 기록에 연결할 수 있는 테스트 목표를 만든다.
         */
        Goal goal = Goal.builder()
                .goalNum(20L)
                .member(loginMember)
                .goalTitle("React 공부")
                .goalContent("React 기초 학습")
                .build();

        List<Goal> goals = List.of(goal);

        /*
         * 회원 번호 1번의 목표 목록을 조회하면
         * 테스트 목표 목록을 반환하게 한다.
         */
        when(goalService.findGoalsByMember(1L)).thenReturn(goals);

        mockMvc.perform(
                get("/record/write")
                        .with(user(principal))
                )
                .andExpect(status().isOk())
                .andExpect(view().name("record/write"))

                /*
                 * 작성 화면의 목표 선택 목록이
                 * Model에 전달됐는지 확인한다.
                 */
                .andExpect(model().attribute("goals", goals));
    }

    @Test
    @DisplayName("로그인 회원이 성장 기록을 등록한다.")
    void saveRecord() throws Exception {
        /*
         * multipart/form-data 형식으로
         * 성장 기록 등록 요청을 보낸다.
         */
        mockMvc.perform(
                multipart("/record/write")
                        /*
                         * 프로젝트 전용 로그인 Principal을 설정한다.
                         */
                        .with(user(principal))
                        /*
                         * POST 요청이므로 CSRF 토큰을 포함한다.
                         */
                        .with(csrf())

                /*
                 * GrowthRecordRequest 필드 이름과
                 * 동일한 요청 파라미터를 전달한다.
                 */
                        .param("goalNum", "20")
                        .param("title", "React 컴포넌트 공부")
                        .param("content", "컴포넌트와 Props를 공부했다.")
                        .param("todayLearning", "Props 전달 방법")
                        .param("difficulty", "NORMAL")
                        .param("solution", "공식 문서를 참고했다.")
                        .param("retrospective", "복습이 더 필요하다.")
        )
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/record/list"));
        /*
         * Controller가 Service에 전달한
         * GrowthRecordRequest를 가져오기 위한 도구다.
         */
        ArgumentCaptor<GrowthRecordRequest> requestCaptor = ArgumentCaptor.forClass(GrowthRecordRequest.class);

        /*
         * 회원 번호 1번과 등록 데이터로
         * saveRecord()가 호출됐는지 확인한다.
         */
        verify(growthRecordService).saveRecord(eq(1L), requestCaptor.capture());

        /*
         * 실제로 Service에 전달된 DTO를 가져온다.
         */
        GrowthRecordRequest capturedRequest = requestCaptor.getValue();

        /*
         * HTTP 요청값이 DTO에 정상적으로 바인딩됐는지 확인한다.
         */
        assertEquals("React 컴포넌트 공부", capturedRequest.getTitle());
        assertEquals("컴포넌트와 Props를 공부했다.", capturedRequest.getContent());
        assertEquals(20L, capturedRequest.getGoalNum());
        assertEquals("NORMAL", capturedRequest.getDifficulty());
    }

    @Test
    @DisplayName("본인의 성장 기록 상세 정보를 조회한다.")
    void recordDetail() throws Exception {
        GrowthRecord record = GrowthRecord.builder()
                .recordNum(10L)
                .member(loginMember)
                .title("상세 조회 테스트")
                .content("성장 기록 상세 내용")
                .build();

        /*
         * 이 테스트에서는 첨부 미디어가 없는 상태로 설정한다.
         */
        List<MediaResponse> mediaList = List.of();

        /*
         * 기록 번호와 회원 번호가 모두 일치할 때만
         * 성장 기록을 반환하도록 설정한다.
         */
        when(growthRecordService.findRecordById(10L, 1L)).thenReturn(record);
        when(mediaService.findMediaByGrowthRecord(10L)).thenReturn(mediaList);

        mockMvc.perform(
                get("/record/10")
                        .with(user(principal))
        )
                .andExpect(status().isOk())
                .andExpect(view().name("record/detail"))
                .andExpect(model().attribute("record", record))
                .andExpect(model().attribute("mediaList", mediaList));
    }

    @Test
    @DisplayName("본인의 성장 기록 수정 화면을 조회한다.")
    void recordEditForm() throws Exception {
        GrowthRecord record = GrowthRecord.builder()
                .recordNum(10L)
                .member(loginMember)
                .title("기존 제목")
                .content("기존 내용")
                .build();

        Goal goal = Goal.builder()
                .goalNum(20L)
                .member(loginMember)
                .goalTitle("React 공부")
                .build();

        List<Goal> goals = List.of(goal);
        List<MediaResponse> mediaList = List.of();

        /*
         * 수정 화면에서 호출하는 Servivce 메서드들의
         * 반환값을 각각 준비한다.
         */
        when(growthRecordService.findRecordById(10L, 1L)).thenReturn(record);
        when(mediaService.findMediaByGrowthRecord(10L)).thenReturn(mediaList);
        when(mediaService.countImageMediaByRecord(10L)).thenReturn(0L);
        when(goalService.findGoalsByMember(1L)).thenReturn(goals);

        mockMvc.perform(
                get("/record/10/edit")
                        .with(user(principal))
                )
                .andExpect(status().isOk())
                .andExpect(view().name("record/edit"))
                .andExpect(model().attribute("record", record))
                .andExpect(model().attribute("mediaList", mediaList))
                .andExpect(model().attribute("existingImageCount", 0L))
                .andExpect(model().attribute("goals", goals));
    }

    @Test
    @DisplayName("로그인 회원이 본인의 성장 기록을 수정한다.")
    void updateRecord() throws Exception {
        mockMvc.perform(
                multipart("/record/10/edit")
                        .with(user(principal))
                        .with(csrf())
                        .param("goalNum", "20")
                        .param("title", "수정된 성장 기록")
                        .param("content", "수정된 성장 기록 내용")
                        .param("todayLearning", "수정 과정 학습")
                        .param("difficulty", "HARD")
                        .param("solution", "문서를 다시 확인했다.")
                        .param("retrospective", "다음에는 테스트부터 작성한다.")
                    )
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/record/10"));

        ArgumentCaptor<GrowthRecordRequest> requestCaptor = ArgumentCaptor.forClass(GrowthRecordRequest.class);

        /*
         * 기록 번호 10번, 회원 번호 1번과 수정 DTO가
         * Service에 전달됐는지 확인한다.
         */
        verify(growthRecordService).updateRecord(eq(10L), eq(1L), requestCaptor.capture());

        GrowthRecordRequest capturedRequest = requestCaptor.getValue();

        assertEquals("수정된 성장 기록", capturedRequest.getTitle());
        assertEquals("수정된 성장 기록 내용", capturedRequest.getContent());
        assertEquals("HARD", capturedRequest.getDifficulty());
    }

    @Test
    @DisplayName("로그인 회원이 본인의 성장 기록을 삭제한다.")
    void deleteRecord() throws Exception {

        /*
         * 삭제 요청도 덷이터 변경 요청이므로
         * POST와 CSRF 토큰을 사용한다.
         */
        mockMvc.perform(
                post("/record/10/delete")
                        .with(user(principal))
                        .with(csrf())

                )
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/record/list"));

        /*
         * 기록 번호 10번, 회원 번호 1번이
         * 삭제 Service에 전달됐는지 확인한다.
         */
        verify(growthRecordService).deleteRecord(10L, 1L);
    }
}

