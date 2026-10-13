package kr.co.growlog.growlog_project.controller;

import jakarta.servlet.http.HttpSession;
import kr.co.growlog.growlog_project.dto.EmailCodeRequest;
import kr.co.growlog.growlog_project.dto.EmailVerificationResponse;
import kr.co.growlog.growlog_project.dto.EmailVerifyRequest;
import kr.co.growlog.growlog_project.repository.MemberRepository;
import kr.co.growlog.growlog_project.service.EmailVerificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RequiredArgsConstructor
@Slf4j
@RestController
@RequestMapping("/api/email")
public class EmailVerificationController {

    private final EmailVerificationService emailVerificationService;
    private final MemberRepository memberRepository;

    // 인증번호 발급

    @PostMapping("/send-code")
    public EmailVerificationResponse sendCode(
            @RequestBody EmailCodeRequest request,
            HttpSession session
    ) {
        String email = request.getEmail();

        if (email == null || email.isBlank()) {
            return new EmailVerificationResponse(
                    false,
                    "이메일을 입력해주세요."
            );
        }

        if (memberRepository.existsByEmail(email)) {
            return new EmailVerificationResponse(
                    false,
                    "이미 가입된 이메일입니다."
            );
        }

        try {
            emailVerificationService.sendVerificationCode(
                    email,
                    session
            );

            return new EmailVerificationResponse(
                    true,
                    "입력한 이메일로 인증번호를 발송했습니다."
            );

        } catch (Exception e) {
            log.error("이메일 인증번호 발송에 실패했습니다. email={}", email, e);

            return new EmailVerificationResponse(
                    false,
                    "이메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요."
            );
        }
    }

    // 인증번호 확인
    @PostMapping("/verify-code")
    public EmailVerificationResponse verifyCode(@RequestBody EmailVerifyRequest request,
                                                HttpSession session) {
        boolean verified = emailVerificationService.verifyCode(request.getEmail(), request.getEmailCode(), session);

        if (!verified) {
            return new EmailVerificationResponse(false, "인증번호가 일치하지 않거나 만료되었습니다.");
        }

        return new EmailVerificationResponse(true, "이메일 인증이 완료되었습니다.");
    }
}
