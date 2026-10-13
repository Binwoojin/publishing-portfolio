package kr.co.growlog.growlog_project.controller;

import jakarta.servlet.http.HttpSession;
import kr.co.growlog.growlog_project.dto.JoinRequest;
import kr.co.growlog.growlog_project.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/*
 * Vue Signup 화면이 사용하는 API.
 *
 * 새 비즈니스 로직을 추가하지 않는다 — 기존 JSP용 MemberController.join()과
 * 동일하게 MemberService.join()을 그대로 호출한다. 비밀번호 확인 일치,
 * 이메일 인증 완료 여부, 이메일/닉네임 중복 검사는 전부 join() 안의 기존
 * 로직 그대로다. 이메일 인증(발송/확인)과 닉네임 중복확인은 이미
 * EmailVerificationController(/api/email/**)와 MemberController
 * (/api/members/check-nickname)가 JSON API로 노출하고 있어서 재사용하고,
 * 여기서는 최종 가입 처리만 담당한다.
 */
@RequiredArgsConstructor
@RestController
@RequestMapping("/api")
public class MemberApiController {

    private final MemberService memberService;

    @PostMapping("/signup")
    public ResponseEntity<Void> signup(@RequestBody JoinRequest request, HttpSession session) {
        memberService.join(request, session);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    /*
     * join()은 비밀번호 불일치, 이메일 미인증, 이메일/닉네임 중복일 때
     * 전부 IllegalArgumentException을 던진다. 다른 Vue API Controller와
     * 동일한 패턴으로 400 + 메시지로 응답한다.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleInvalid(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }
}
