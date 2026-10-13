<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>

<!DOCTYPE html>
<html lang="ko">

<head>
    <meta charset="UTF-8">

    <meta name="viewport"
          content="width=device-width, initial-scale=1.0">

    <title>비밀번호 찾기 | GrowLog</title>

    <!-- GrowLog 공통 스타일 -->
    <link rel="stylesheet"
          href="${pageContext.request.contextPath}/css/common.css?v=20260731-1">

    <!-- 비밀번호 찾기 전용 스타일 -->
    <link rel="stylesheet"
          href="${pageContext.request.contextPath}/css/find-password.css">
    <jsp:include page="/WEB-INF/views/common/responsive-styles.jsp" />
</head>

<body>

<jsp:include page="/WEB-INF/views/common/header.jsp"/>

<main class="password_find_page">

    <section class="password_find_card">

        <div class="password_find_icon">
            🔑
        </div>

        <span class="password_find_eyebrow">
            PASSWORD RESET
        </span>

        <h1>비밀번호 찾기</h1>

        <p class="password_find_description">
            GrowLog에 가입할 때 사용한 이메일을 입력하면
            비밀번호 재설정을 위한 인증번호를 보내드려요.
        </p>


        <!-- 서버 처리 결과 메시지 -->
        <c:if test="${not empty errorMessage}">
            <div class="password_find_message error">
                <c:out value="${errorMessage}"/>
            </div>
        </c:if>

        <c:if test="${not empty successMessage}">
            <div class="password_find_message success">
                <c:out value="${successMessage}"/>
            </div>
        </c:if>


        <!-- ========================================
     1단계: 가입 이메일 입력
======================================== -->
        <c:if test="${not codeSent}">

            <form action="${pageContext.request.contextPath}/find-password/send-code"
                  method="post"
                  class="password_find_form">
                <%-- Spring Security CSRF 검증용 토큰 --%>
                <input type="hidden"
                       name="${_csrf.parameterName}"
                       value="${_csrf.token}">

                <div class="password_find_group">

                    <label for="email">
                        가입 이메일
                    </label>

                    <input type="email"
                           id="email"
                           name="email"
                           placeholder="example@email.com"
                           autocomplete="email"
                           required>

                    <span>
                GrowLog 회원가입에 사용한 이메일을 입력해주세요.
            </span>

                </div>

                <button type="submit"
                        class="password_find_submit">
                    인증번호 받기
                </button>

            </form>

        </c:if>

        <!-- ========================================
     2단계: 이메일 인증번호 확인
======================================== -->
        <c:if test="${codeSent and not codeVerified}">

            <div class="password_step_information">

        <span class="password_step_badge">
            이메일 발송 완료
        </span>

                <p>
                    <strong>
                        <c:out value="${resetEmail}"/>
                    </strong>
                    주소로 인증번호를 보냈어요.
                </p>

            </div>

            <form action="${pageContext.request.contextPath}/find-password/verify-code"
                  method="post"
                  class="password_find_form">
                <%-- Spring Security CSRF 검증용 토큰 --%>
                <input type="hidden"
                       name="${_csrf.parameterName}"
                       value="${_csrf.token}">

                <div class="password_find_group">

                    <label for="verificationCode">
                        인증번호
                    </label>

                    <input type="text"
                           id="verificationCode"
                           name="verificationCode"
                           placeholder="6자리 인증번호"
                           maxlength="6"
                           inputmode="numeric"
                           autocomplete="one-time-code"
                           required>

                    <span>
                인증번호는 발급 후 5분 동안 유효해요.
            </span>

                </div>

                <button type="submit"
                        class="password_find_submit">
                    인증번호 확인
                </button>

            </form>

            <!-- 이메일을 잘못 입력했을 때 처음부터 다시 시작 -->
            <form action="${pageContext.request.contextPath}/find-password/restart"
                  method="post"
                  class="password_restart_form">
                <%-- Spring Security CSRF 검증용 토큰 --%>
                <input type="hidden"
                       name="${_csrf.parameterName}"
                       value="${_csrf.token}">

                <button type="submit"
                        class="password_restart_button">
                    다른 이메일로 다시 시도
                </button>

            </form>

        </c:if>

        <!-- ========================================
     3단계: 새 비밀번호 설정
======================================== -->
        <c:if test="${codeVerified}">

            <div class="password_step_information">

        <span class="password_step_badge">
            이메일 인증 완료
        </span>

                <p>
                    새롭게 사용할 비밀번호를 입력해주세요.
                </p>

            </div>

            <form action="${pageContext.request.contextPath}/find-password/reset"
                  method="post"
                  id="passwordResetForm"
                  class="password_find_form">
                <%-- Spring Security CSRF 검증용 토큰 --%>
                <input type="hidden"
                       name="${_csrf.parameterName}"
                       value="${_csrf.token}">

                <div class="password_find_group">

                    <label for="newPassword">
                        새 비밀번호
                    </label>

                    <input type="password"
                           id="newPassword"
                           name="newPassword"
                           minlength="8"
                           maxlength="100"
                           autocomplete="new-password"
                           required>

                    <span>
                8자 이상으로 입력해주세요.
            </span>

                </div>

                <div class="password_find_group password_confirm_group">

                    <label for="newPasswordConfirm">
                        새 비밀번호 확인
                    </label>

                    <input type="password"
                           id="newPasswordConfirm"
                           name="newPasswordConfirm"
                           minlength="8"
                           maxlength="100"
                           autocomplete="new-password"
                           required>

                    <span id="passwordResetMatchMessage">
            </span>

                </div>

                <button type="submit"
                        class="password_find_submit">
                    비밀번호 변경
                </button>

            </form>

        </c:if>


        <div class="password_find_footer">

            <a href="${pageContext.request.contextPath}/login">
                로그인 페이지로 돌아가기
            </a>

        </div>

    </section>

</main>

<%-- 모든 서비스 페이지에서 동일한 공통 Footer를 사용합니다. --%>
<jsp:include page="/WEB-INF/views/common/footer.jsp" />

</body>
</html>
