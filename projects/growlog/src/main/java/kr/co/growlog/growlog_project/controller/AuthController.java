package kr.co.growlog.growlog_project.controller;

import kr.co.growlog.growlog_project.dto.MeResponse;
import kr.co.growlog.growlog_project.security.LoginMemberPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/*
 * Vue SPA 인증 연동을 위한 API 컨트롤러
 *
 * SecurityConfig에서 "/api/me"는 authenticated()로 보호되어 있으므로
 * 이 메서드는 세션 쿠키로 로그인 상태가 확인된 요청에서만 호출된다.
 * 미인증 요청은 Spring Security가 이 메서드까지 오기 전에 401로 차단한다.
 */
@RestController
public class AuthController {

    @GetMapping("/api/me")
    public MeResponse me(@AuthenticationPrincipal LoginMemberPrincipal principal) {
        return new MeResponse(
                principal.getMemberNo(),
                principal.getEmail(),
                principal.getNickname()
        );
    }
}
