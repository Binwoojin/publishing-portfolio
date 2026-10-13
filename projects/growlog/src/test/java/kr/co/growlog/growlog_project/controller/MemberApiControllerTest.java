package kr.co.growlog.growlog_project.controller;

import kr.co.growlog.growlog_project.dto.JoinRequest;
import kr.co.growlog.growlog_project.service.MemberService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/*
 * Signup API가 기존 MemberService.join()을 그대로 재사용해서 호출하는지,
 * join()이 던지는 검증 실패(비밀번호 불일치/이메일 미인증/이메일·닉네임
 * 중복)를 400 + 메시지로 응답하는지 확인한다. GoalApiControllerTest와
 * 동일한 패턴 — Service는 Mock 처리하고 Controller의 라우팅/응답만 검증한다.
 *
 * @DirtiesContext: .with(csrf())는 실제 SecurityFilterChain의 CsrfFilter가
 * 들고 있는 CsrfTokenRepository를 리플렉션으로 테스트용 Repository로 바꿔치기하고
 * 되돌리지 않는다. 이 클래스는 AuthControllerTest와 Mock 구성이 동일해서 같은
 * ApplicationContext(따라서 같은 CsrfFilter 싱글턴)를 공유하므로, 그 상태 오염이
 * 이후 실행되는 AuthControllerTest로 새어나가 XSRF-TOKEN 쿠키 검증을 깨뜨렸다.
 * 클래스 종료 후 컨텍스트를 버려서 다른 테스트가 오염된 싱글턴을 재사용하지 않게 한다.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class MemberApiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private MemberService memberService;

    private static final String VALID_SIGNUP_BODY = """
            {"email":"newuser@example.com","password":"Passw0rd!","passwordCheck":"Passw0rd!","userName":"홍길동","nickname":"길동이","emailCode":"123456"}
            """;

    @Test
    @DisplayName("CSRF 토큰 없이 회원가입을 요청하면 403으로 막힌다.")
    void signupWithoutCsrfIsForbidden() throws Exception {
        mockMvc.perform(post("/api/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_SIGNUP_BODY))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("정상 회원가입 요청은 기존 MemberService.join()을 호출하고 201을 받는다.")
    void signupSucceeds() throws Exception {
        doNothing().when(memberService).join(any(), any());

        mockMvc.perform(post("/api/signup")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_SIGNUP_BODY))
                .andExpect(status().isCreated());

        ArgumentCaptor<JoinRequest> requestCaptor = ArgumentCaptor.forClass(JoinRequest.class);
        verify(memberService).join(requestCaptor.capture(), any());

        JoinRequest captured = requestCaptor.getValue();
        assertEquals("newuser@example.com", captured.getEmail());
        assertEquals("홍길동", captured.getUserName());
        assertEquals("길동이", captured.getNickname());
        assertEquals("123456", captured.getEmailCode());
    }

    @Test
    @DisplayName("이메일 인증을 완료하지 않으면 400과 에러 메시지를 받는다.")
    void signupWithoutEmailVerificationReturns400() throws Exception {
        doThrow(new IllegalArgumentException("이메일 인증을 완료해주세요."))
                .when(memberService).join(any(), any());

        mockMvc.perform(post("/api/signup")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_SIGNUP_BODY))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("이메일 인증을 완료해주세요."));
    }

    @Test
    @DisplayName("이미 가입된 이메일이면 400과 에러 메시지를 받는다.")
    void signupWithDuplicateEmailReturns400() throws Exception {
        doThrow(new IllegalArgumentException("이미 가입된 이메일입니다."))
                .when(memberService).join(any(), any());

        mockMvc.perform(post("/api/signup")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_SIGNUP_BODY))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("이미 가입된 이메일입니다."));
    }

    @Test
    @DisplayName("이미 사용 중인 닉네임이면 400과 에러 메시지를 받는다.")
    void signupWithDuplicateNicknameReturns400() throws Exception {
        doThrow(new IllegalArgumentException("이미 사용 중인 닉네임입니다."))
                .when(memberService).join(any(), any());

        mockMvc.perform(post("/api/signup")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_SIGNUP_BODY))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("이미 사용 중인 닉네임입니다."));
    }

    @Test
    @DisplayName("비밀번호와 비밀번호 확인이 다르면 400과 에러 메시지를 받는다.")
    void signupWithPasswordMismatchReturns400() throws Exception {
        doThrow(new IllegalArgumentException("비밀번호가 일치하지 않습니다."))
                .when(memberService).join(any(), any());

        mockMvc.perform(post("/api/signup")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"newuser@example.com","password":"Passw0rd!","passwordCheck":"Different1!","userName":"홍길동","nickname":"길동이","emailCode":"123456"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("비밀번호가 일치하지 않습니다."));
    }
}
