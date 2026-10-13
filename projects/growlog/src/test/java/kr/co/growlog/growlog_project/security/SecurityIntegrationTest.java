package kr.co.growlog.growlog_project.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/*
 * 테스트에서 사용할 HTTP 요청 메서드
 */
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/*
 * 테스트에서는 application.yaml 대신
 * application-test.yaml 설정
 *
 * 현재 프로젝트에서는 H2 테스트 DB 설정이 적용
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityIntegrationTest {

    /*
     * MockMvc는 실제 브라우저 없이
     * GET, POST 등의 HTTP 요청을 만들어 테스트하는 도구
     */
    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("비로그인 사용자가 홈에 접근하면 로그인 페이지로 이동한다.")
    void unautheticatedUserCannotAccessHome() throws Exception {
        /*
         * 로그인 정보를 넣지 않은 상태에서
         * GET /home 요청을 보낸다.
         *
         * 인증 정보를 따로 설정하지 않았기 때문에
         * 이 요청은 비로그인 사용자의 요청으로 처리된다.
         */
        mockMvc.perform(get("/home"))
                /*
                 * Spring Security가 비로그인 사용자를
                 * 로그인 페이지로 이동시키는지 확인
                 *
                 * 리다이렉트 응답은 일반적으로
                 * 3xx 상태 코드를 사용
                 */
                .andExpect(status().is3xxRedirection())

                /*
                 * 최종 이동 주소가 로그인 페이지인지 확인한다.
                 *
                 * 실제 응답 주고사 절대 주소로 반환될 수 있으므로
                 * redirectedUrl("/login") 대신 패턴 검사를 사용한다.
                 */
                .andExpect(redirectedUrl("/login"));
    }

    @Test
    @DisplayName("CSRF 토큰이 없는 목표 등록 요청은 차단된다.")
    @WithMockUser
    void goalCreationWithoutCsrfIsForbidden() throws Exception {

        /*
         * @WithMockUser를 사용했기 때문에
         * 이 테스트 요청은 로그인된 사용자의 요청으로 처리된다.
         *
         * 다만, 프로젝트의 LoginMemberPrincipal이 아닌
         * Spring Security가 제공하는 기본 테스트 사용자다.
         */
        mockMvc.perform(
                /* 목표 등록 주소로 POST 요청을 보낸다. */
                post("/goal/write")
                /*
                 * 목표 등록에 필요한 일부 값을 전달한다.
                 *
                 * 이 테스트에서는 Controller까지 도달하기 전에
                 * CSRF 필더가 요청을 차단해야 하므로
                 * 모든 입력값을 완벽하게 준비할 필요는 없다.
                 */
                .param("goalTitle", "테스트 목표"))
                /*
                 * CSRF 토큰을 넣지 않았기 때문에
                 * Spring Security가 403 Forbidden을 반환해야 한다.
                 */
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("CSRF 토큰이 없는 성장 기록 등록 요청은 차단된다.")
    @WithMockUser
    void recordCreationWithoutCsrfIsForbidden() throws Exception {
        /*
         * 로그인된 테스트 사용자로
         * 성장 기록 등록 주소에 POST 요청을 보낸다.
         *
         * csrf()를 추가하지 않았기 때문에
         * 요청은 Controller에 도달하디 전에 차단되어야 한다.
         */
        mockMvc.perform(post("/record/write")
                    .param("title", "테스트 성장 기록")
                    .param("content", "테스트 내용"))
                /*
                 * CSRF 검증 실패로 403 응답이 발생하는지 확인한다.
                 */
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("CSRF 토큰이 없는 로그아웃 요청은 차단된다.")
    @WithMockUser
    void logoutWithoutCsrfIsForbidden() throws Exception {
        /*
         * 로그인 상태에서 CSRF 토큰 없이
         * POST /logout 요청을 보낸다
         */
        mockMvc.perform(post("/logout"))
                /*
                 * CSRF 토큰이 없기 때문에
                 * 로그아웃 처리도 실행되지 않고 403이 반환되어야 한다.
                 */
                .andExpect(status().isForbidden());
    }
}
