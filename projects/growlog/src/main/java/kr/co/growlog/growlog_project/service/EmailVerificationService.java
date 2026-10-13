package kr.co.growlog.growlog_project.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;

@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private static final String EMAIL_KEY = "verificationEmail";
    private static final String CODE_KEY = "verificationCode";
    private static final String EXPIRES_AT_KEY = "verificationExpiresAt";
    private static final String VERIFIED_KEY = "emailVerified";

    // 인증번호 유효시간: 5분
    private static final long CODE_VALID_TIME = 5 * 60 * 1000L;

    private final SecureRandom secureRandom = new SecureRandom();

    /*
     * spring-boot-starter-mail이 생성한 메일 발송 객체
     */
    private final JavaMailSender mailSender;

    /*
     * application.yml의 spring.mail.username 값
     */
    @Value("${spring.mail.username}")
    private String senderEmail;

    /**
     * 6자리 인증번호 생성
     */
    public String createCode() {
        int code = secureRandom.nextInt(900000) + 100000;

        return String.valueOf(code);
    }

    /**
     * 인증번호 생성 → 세션 저장 → 실제 이메일 발송
     */
    public void sendVerificationCode(
            String email,
            HttpSession session
    ) {
        String code = createCode();

        // 인증번호 관련 정보를 세션에 저장
        session.setAttribute(EMAIL_KEY, email);
        session.setAttribute(CODE_KEY, code);

        session.setAttribute(
                EXPIRES_AT_KEY,
                System.currentTimeMillis() + CODE_VALID_TIME
        );

        // 인증번호를 다시 발급하면 이전 인증 완료 상태를 해제
        session.setAttribute(VERIFIED_KEY, false);

        try {
            sendEmail(email, code);

        } catch (MessagingException e) {
            /*
             * 메일 발송에 실패했다면 세션에 저장했던
             * 인증번호 정보도 제거한다.
             */
            clearVerification(session);

            throw new IllegalStateException(
                    "인증번호 이메일 발송에 실패했습니다.",
                    e
            );
        }
    }

    /**
     * 실제 이메일 발송
     */
    private void sendEmail(
            String receiverEmail,
            String code
    ) throws MessagingException {

        MimeMessage message =
                mailSender.createMimeMessage();

        MimeMessageHelper helper =
                new MimeMessageHelper(
                        message,
                        false,
                        "UTF-8"
                );

        helper.setFrom(senderEmail);
        helper.setTo(receiverEmail);

        helper.setSubject(
                "[GrowLog] 회원가입 이메일 인증번호"
        );

        helper.setText(
                createEmailContent(code),
                true
        );

        mailSender.send(message);
    }

    /**
     * 이메일 본문 작성
     */
    private String createEmailContent(String code) {
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
                            GrowLog 이메일 인증
                        </h1>

                        <p style="
                            margin:0;
                            color:#667068;
                            font-size:15px;
                            line-height:1.7;
                        ">
                            GrowLog 회원가입을 위한 인증번호입니다.<br>
                            아래 인증번호를 회원가입 화면에 입력해주세요.
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

    /**
     * 사용자가 입력한 인증번호 확인
     */
    public boolean verifyCode(
            String email,
            String inputCode,
            HttpSession session
    ) {
        String savedEmail =
                (String) session.getAttribute(EMAIL_KEY);

        String savedCode =
                (String) session.getAttribute(CODE_KEY);

        Long expiresAt =
                (Long) session.getAttribute(EXPIRES_AT_KEY);

        if (
                savedEmail == null ||
                        savedCode == null ||
                        expiresAt == null
        ) {
            return false;
        }

        // 유효시간 만료 확인
        if (System.currentTimeMillis() > expiresAt) {
            clearVerification(session);

            return false;
        }

        boolean verified =
                savedEmail.equals(email)
                        && savedCode.equals(inputCode);

        if (verified) {
            session.setAttribute(VERIFIED_KEY, true);

            /*
             * 인증 성공 후 동일 인증번호를 다시 사용할 수 없도록 제거
             */
            session.removeAttribute(CODE_KEY);
            session.removeAttribute(EXPIRES_AT_KEY);
        }

        return verified;
    }

    /**
     * 회원가입 전에 인증 완료 여부 확인
     */
    public boolean isVerified(
            String email,
            HttpSession session
    ) {
        String verifiedEmail =
                (String) session.getAttribute(EMAIL_KEY);

        Boolean verified =
                (Boolean) session.getAttribute(VERIFIED_KEY);

        return Boolean.TRUE.equals(verified)
                && email.equals(verifiedEmail);
    }

    // 비밀번호 재설정 인증번호를 실제 이메일을 발송
    public void sendPasswordResetCode(String receiverEmail, String code) {
        try {
            sendPasswordResetEmail(receiverEmail, code);
        } catch (MessagingException e) {
            throw new IllegalArgumentException("비밀번호 재설정 인증번호 이메일 발송에 실패했습니다.", e);
        }
    }

    // 비밀번호 재설정용 HTML 이메일을 생성
    private void sendPasswordResetEmail(String receiverEmail, String code) throws MessagingException {
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

    /**
     * 인증 관련 세션 정보 제거
     */
    public void clearVerification(
            HttpSession session
    ) {
        session.removeAttribute(EMAIL_KEY);
        session.removeAttribute(CODE_KEY);
        session.removeAttribute(EXPIRES_AT_KEY);
        session.removeAttribute(VERIFIED_KEY);
    }
}