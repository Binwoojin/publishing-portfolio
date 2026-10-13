package kr.co.growlog.growlog_project.controller;

// 비밀번호 찾기 페이지를 표시
// 사용자는 가입할 때 사용한 이메일을 입력하고
// 인증 번호를 발급받을 수 있다.

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import jakarta.servlet.http.HttpSession;
import kr.co.growlog.growlog_project.service.EmailVerificationService;
import kr.co.growlog.growlog_project.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import org.springframework.beans.factory.annotation.Value;

import java.time.LocalDateTime;

@RequiredArgsConstructor
@Controller
public class PasswordResetController {

    private final MemberService memberService;

    /*
     * 비밀번호 찾기 과정에서 사용할 세션 키
     *
     * 인증번호와 이메일을 세션에 임시로 저장하여
     * 인증 과정이 끝날 때까지 유지한다.
     */

    private static final String RESET_EMAIL_KEY = "PASSWORD_RESET_EMAIL";
    private static final String RESET_CODE_KEY = "PASSWORD_RESET_CODE";
    private static final String RESET_CODE_EXPIRES_AT_KEY = "PASSWORD_RESET_CODE_EXPIRES_AT";
    private static final String RESET_VERIFIED_KEY = "PASSWORD_RESET_VERIFIED";
    private final EmailVerificationService emailVerificationService;
    private final JavaMailSenderImpl mailSender;

    @Value("${spring.mail.username}")
    private String senderEmail;


    // 비밀번호 찾기 페이지 표시
    // 사용자가 로그인 페이지에서 비밀번호 찾기를 누르면
    // "/find-password" 주소로 접근
    @GetMapping("/find-password")
    public String findPasswordPage(HttpSession session, Model model) {
        // 이메일 인증 완료 여부를 확인
        boolean codeVerified = Boolean.TRUE.equals(session.getAttribute(RESET_VERIFIED_KEY));

        // 인증번호가 세션에 존재하면 이메일 발송이 완료된 단계로 판단
        boolean codeSent = session.getAttribute(RESET_CODE_KEY) != null || codeVerified;

        // 사용자가 인증번호를 요청한 이메일도 화면에 표시하거나 hidden값으로 활용할 수 있도록 전달
        String resetEmail = (String) session.getAttribute(RESET_EMAIL_KEY);

        model.addAttribute("codeSent", codeSent);
        model.addAttribute("codeVerified", codeVerified);
        model.addAttribute("resetEmail", resetEmail);

        return "member/find-password";
    }

    // 가입 이메일로 인증번호를 발송
    @PostMapping("/find-password/send-code")
    public String sendVerificationCode(@RequestParam("email") String email,
                                      HttpSession session,
                                      RedirectAttributes redirectAttributes) {
        // 이메일 앞뒤 공백을 제거하여 조회와 발송에 동일한 값을 사용
        String trimmedEmail = email == null
                ? ""
                : email.trim();

        if (trimmedEmail.isBlank()) {
            redirectAttributes.addFlashAttribute("errorMessage", "이메일을 입력해주세요.");

            return "redirect:/find-password";
        }

        // 해당 이메일로 가입된 회원이 존재하는지 확인
        boolean exists = memberService.existsByEmail(trimmedEmail);

        if (!exists) {
            redirectAttributes.addFlashAttribute("errorMessage", "가입된 회원 정보를 찾을 수 없습니다.");

            return "redirect:/find-password";
        }

        // SecureRandom을 사용하는 EmailVerificationService에서
        // 비밀번호 재설정용 6자리 인증번호를 생성
        String verificationCode = emailVerificationService.createCode();

        try {
            // 이메일 발송이 성공한 경우에만 인증정보 세션에 저장
            // 발송 실패 상태에서 인증 단계로 넘어가는 것을 방지
            emailVerificationService.sendPasswordResetCode(trimmedEmail, verificationCode);
            session.setAttribute(RESET_EMAIL_KEY, trimmedEmail);
            session.setAttribute(RESET_CODE_KEY, verificationCode);
            session.setAttribute(RESET_CODE_EXPIRES_AT_KEY, LocalDateTime.now().plusMinutes(5));
            session.setAttribute(RESET_VERIFIED_KEY, false);

            redirectAttributes.addFlashAttribute("successMessage", "입력된 이메일로 인증번호를 발송했습니다.");
        } catch (IllegalArgumentException e) {
            // 이메일 발송에 실패했을 때 이전 인증정보가 남지 않도록 제거
            clearPasswordResetSession(session);

            redirectAttributes.addFlashAttribute("errorMessage", "인증번호 이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.");
        }
        return "redirect:/find-password";
    }

    // 사용자가 입력한 인증번호가 올바른지 확인
    @PostMapping("/find-password/verify-code")
    public String verifyCode(@RequestParam("verificationCode") String verificationCode,
                             HttpSession session,
                             RedirectAttributes redirectAttributes) {

        String savedCode = (String) session.getAttribute(RESET_CODE_KEY);

        LocalDateTime expiresAt = (LocalDateTime) session.getAttribute(RESET_CODE_EXPIRES_AT_KEY);

        // 인증번호가 발급되지 않은 경우
        if (savedCode == null || expiresAt == null) {
            redirectAttributes.addFlashAttribute("errorMessage", "인증번호를 먼저 발급받아주세요.");
            return "redirect:/find-password";
        }


        // 인증번호 유효시간 확인
        if (LocalDateTime.now().isAfter(expiresAt)) {
            clearPasswordResetSession(session);

            redirectAttributes.addFlashAttribute("errorMessage", "인증번호 유호시간이 만료되었습니다. 다시 발급받아주세요.");

            return "redirect:/find-password";
        }

        String inputCode = verificationCode == null
                ? ""
                : verificationCode.trim();

        // 인증번호 불일치
        if (!savedCode.equals(inputCode)) {
            redirectAttributes.addFlashAttribute("errorMessage", "인증번호가 일치하지 않습니다.");

            return "redirect:/find-password";
        }
        // 인증번호가 일치하고 유효시간도 남아 있는 경우에만 인즌 완료 처리
        session.setAttribute(RESET_VERIFIED_KEY, true);

        // 인증에 성공한 번호를 다시 사용할 수 없도록
        // 인증번호와 만료시간은 세션에서 제거한다
        // 이메일과 인증 완료 여부는 비밀번호 변경까지 유지
        session.removeAttribute(RESET_CODE_KEY);
        session.removeAttribute(RESET_CODE_EXPIRES_AT_KEY);

        redirectAttributes.addFlashAttribute("successMessage", "이메일 인증이 완료되었습니다.");

        return "redirect:/find-password";
    }

    // 현재 진행 중인 비밀번호 재설정 정보를 지우고 이메일 입력 단계부터 다시 시작
    @PostMapping("/find-password/restart")
    public String restartPasswordReset(HttpSession session) {
        clearPasswordResetSession(session);

        return "redirect:/find-password";
    }




    // 이메일 인증을 마친 사용자의 비밀번호를 변경
    @PostMapping("/find-password/reset")
    public String resetPassword(@RequestParam("newPassword") String newPassword,
                                @RequestParam("newPasswordConfirm") String newPasswordConfirm,
                                HttpSession session,
                                RedirectAttributes redirectAttributes) {

        Boolean verified = (Boolean) session.getAttribute(RESET_VERIFIED_KEY);
        String email = (String) session.getAttribute(RESET_EMAIL_KEY);

        if (!Boolean.TRUE.equals(verified) || email == null) {
            redirectAttributes.addFlashAttribute("errorMessage", "이메일 인증을 먼저 진행해주세요.");
            return "redirect:/find-password";
        }

        if (newPassword == null || newPassword.isBlank()) {
            redirectAttributes.addFlashAttribute("errorMessage", "새 비밀번호를 입력해주세요.");
            redirectAttributes.addFlashAttribute("codeVerified", true);

            return "redirect:/find-password";
        }

        if (newPassword.length() < 8) {
            redirectAttributes.addFlashAttribute("errorMessage", "새 비밀번호는 8자 이상 입력해주세요.");
            redirectAttributes.addFlashAttribute("codeVerified", true);

            return "redirect:/find-password";
        }

        if (!newPassword.equals(newPasswordConfirm)) {
            redirectAttributes.addFlashAttribute("errorMessage", "새 비밀번호 확인이 일치하지 않습니다.");
            redirectAttributes.addFlashAttribute("codeVerified", true);

            return "redirect:/find-password";
        }

        // 이메일을 기준으로 회원을 조회한 후 비밀번호를 암호화하여 변경
        memberService.resetPasswordByEmail(email, newPassword);
        clearPasswordResetSession(session);
        redirectAttributes.addFlashAttribute("successMessage", "비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.");

        return "redirect:/login";

    }

    // 비밀번호 재설정 과정에서 사용한 세션 정보를 모두 제거
    private void clearPasswordResetSession(HttpSession session) {
        session.removeAttribute(RESET_EMAIL_KEY);
        session.removeAttribute(RESET_CODE_KEY);
        session.removeAttribute(RESET_CODE_EXPIRES_AT_KEY);
        session.removeAttribute(RESET_VERIFIED_KEY);
    }

    // 비밀번호 재설정에 사용할 인증번호를 실제 이메일로 발송
    // 인증번호 생성과 세션 저장은 PasswordResetController에서 처리하고 있으므로
    // 이 메서드는 전달받은 인증번호를 이메일로 보내는 역할만 담당

    // @param receiverEmail 인증번호를 받을 회원 이메일
    // @param code 비밀번호 재설정용 6자리 인증번호
    public void sendPasswordResetCode(String receiverEmail, String code) {
        try {
            sendPasswordResetEmail(receiverEmail, code);
        } catch (Exception e) {
            throw new IllegalArgumentException("비밀번호 재설정 인증번호 이메일 발송에 실패했습니다.", e);
        }
    }

    // 비밀번호 재설정 인증번호 이메일을 발송
    private void sendPasswordResetEmail(String receiverEmail, String code) throws MessagingException{
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");

        helper.setFrom(senderEmail);
        helper.setTo(receiverEmail);
        helper.setSubject("[GrowLog] 비밀번호 재설정 인증번호");
        helper.setText(createPasswordResetEmailContent(code), true);

        mailSender.send(message);
    }

    // 비밀번호 재설정 이메일의 HTML 본문을 생성
    private String createPasswordResetEmailContent(String code) {
            return """
            <div style="
                width:100%;
                padding:40px 0;
                background:#f7faf6;
                font-family:Arial, sans-serif;
            ">
                <div style="
                    width:90%;
                    max-width:520px;
                    margin:0 auto;
                    padding:40px;
                    box-sizing:border-box;
                    background:#ffffff;
                    border:1px solid #e2ebe3;
                    border-radius:20px;
                ">
                    <h1 style="
                        margin:0 0 16px;
                        color:#315538;
                        font-size:26px;
                    ">
                        GrowLog 비밀번호 재설정
                    </h1>

                    <p style="
                        margin:0;
                        color:#667068;
                        font-size:15px;
                        line-height:1.7;
                    ">
                        GrowLog 비밀번호 재설정을 위한 인증번호입니다.<br>
                        아래 인증번호를 비밀번호 찾기 화면에 입력해주세요.
                    </p>

                    <div style="
                        margin:30px 0;
                        padding:22px;
                        background:#eef7ec;
                        border-radius:14px;
                        color:#4f8f5c;
                        font-size:32px;
                        font-weight:bold;
                        text-align:center;
                        letter-spacing:8px;
                    ">
            """ + code + """
                    </div>

                    <p style="
                        margin:0;
                        color:#8a938c;
                        font-size:13px;
                        line-height:1.6;
                    ">
                        인증번호는 5분 동안 유효합니다.<br>
                        본인이 요청하지 않았다면 이 메일을 무시해주세요.
                    </p>
                </div>
            </div>
            """;
        }
    }
