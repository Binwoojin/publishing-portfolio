package kr.co.growlog.growlog_project.controller;

import kr.co.growlog.growlog_project.entity.Member;
import kr.co.growlog.growlog_project.security.LoginMemberPrincipal;
import kr.co.growlog.growlog_project.service.MemberService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/*
 * Vue SPA(다른 Origin)가 세션 쿠키 기반으로 로그인 상태를 유지할 수 있는지
 * 아래 3가지 관점에서 확인한다.
 *
 * 1. 미인증 요청은 /login으로 리다이렉트되지 않고 401을 받는가 (SPA가 JSON으로 처리 가능한가)
 * 2. 인증된 요청은 GET /api/me로 로그인 회원 정보를 받을 수 있는가
 * 3. CORS preflight(OPTIONS)가 Vue 개발 서버 Origin을 허용하는가
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    /*
     * GlobalModelAttributeAdvice가 공통 헤더 회원 정보를
     * 조회할 때 MemberService를 사용하기 때문에 필요하다.
     * (GoalControllerTest와 동일한 패턴)
     */
    @MockitoBean
    private MemberService memberService;

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
    @DisplayName("비로그인 상태로 GET /api/me를 호출하면 401을 받는다 (로그인 페이지로 리다이렉트되지 않는다).")
    void meWithoutLoginReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("로그인 상태로 GET /api/me를 호출하면 로그인 회원 정보를 JSON으로 받는다.")
    void meWithLoginReturnsCurrentMember() throws Exception {
        mockMvc.perform(get("/api/me").with(user(principal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.memberNo").value(1))
                .andExpect(jsonPath("$.email").value("testest@example.com"))
                .andExpect(jsonPath("$.nickname").value("테스트회원"));
    }

    @Test
    @DisplayName("로그인 응답에는 Vue(Axios)가 읽을 수 있도록 XSRF-TOKEN 쿠키가 내려간다.")
    void loginResponseExposesCsrfCookie() throws Exception {
        mockMvc.perform(get("/api/me").with(user(principal)))
                .andExpect(cookie().exists("XSRF-TOKEN"));
    }

    @Test
    @DisplayName("Vue 개발 서버 Origin에서 온 CORS preflight 요청은 인증 없이도 허용된다.")
    void corsPreflightFromViteDevServerIsAllowed() throws Exception {
        mockMvc.perform(options("/api/me")
                        .header(HttpHeaders.ORIGIN, "http://localhost:5173")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:5173"))
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS, "true"));
    }

    @Test
    @DisplayName("허용되지 않은 Origin에서 온 CORS 요청에는 Allow-Origin 헤더가 내려가지 않는다.")
    void corsRequestFromUnknownOriginIsRejected() throws Exception {
        mockMvc.perform(options("/api/me")
                        .header(HttpHeaders.ORIGIN, "http://evil.example.com")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
                .andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
    }
}
