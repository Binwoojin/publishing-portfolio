<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<!DOCTYPE html>
<html>
<head>
    <%-- JavaScript POST 요청에서 사용할 CSRF 토큰과 헤더 이름 --%>
    <meta name="_csrf" content="${_csrf.token}">
    <meta name="_csrf_header" content="${_csrf.headerName}">
    <meta charset="UTF-8">
    <%-- [반응형 필수] 모바일 브라우저가 실제 기기 폭을 기준으로 렌더링하도록 합니다. --%>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>회원가입 | GrowLog</title>
    <!-- Common CSS -->
    <link rel="stylesheet"
          href="${pageContext.request.contextPath}/css/common.css?v=20260731-1">

    <!-- Join CSS -->
    <link rel="stylesheet"
          href="${pageContext.request.contextPath}/css/join.css">
    <jsp:include page="/WEB-INF/views/common/responsive-styles.jsp" />
</head>
<body class="join_page">

<!-- ================= Header ================= -->
<header class="main_header">

    <a href="${pageContext.request.contextPath}/home"
       class="header_logo">

        <img
                src="${pageContext.request.contextPath}/images/full_logo.png"
                alt="GrowLog 로고">

    </a>

</header>


<!-- ================= Main ================= -->
<main class="join_main">

    <section class="join_container">

        <!-- 제목 -->
        <div class="join_title">

            <h1>회원가입</h1>

            <p>
                GrowLog와 함께 성장의 기록을 시작해보세요.
            </p>

        </div>

        <c:if test="${not empty joinErrorMessage}">
            <p class="server_message error">
                    ${joinErrorMessage}
            </p>
        </c:if>


        <!-- 회원가입 폼 -->
        <form
                class="join_form"
                action="${pageContext.request.contextPath}/join"
                method="post">
            <%-- Spring Security CSRF 검증용 토큰 --%>
            <input type="hidden"
                   name="${_csrf.parameterName}"
                   value="${_csrf.token}">


            <!-- 이메일 -->
            <div class="form_group">

                <label for="email">이메일</label>

                <div class="input_box">

                    <input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="example@email.com">

                    <!-- 이메일 인증번호 발송 -->
                    <button
                            type="button"
                            id="emailSendBtn">
                        인증번호
                    </button>

                </div>

                <span class="form_message"></span>
            </div>

            <!-- 이메일 인증 -->
            <div class="form_group">

                <label for="emailCode">
                    인증번호
                </label>

                <div class="input_box">

                    <input
                            type="text"
                            id="emailCode"
                            name="emailCode"
                            placeholder="인증번호 입력">

                    <!-- 이메일 인증번호 확인 -->
                    <button
                            type="button"
                            id="emailCodeCheckBtn">
                        확인
                    </button>

                </div>

                <span class="form_message"></span>
            </div>

            <!-- 비밀번호 -->
            <div class="form_group">

                <label for="password">비밀번호</label>

                <input
                        type="password"
                        id="password"
                        name="password"
                        placeholder="비밀번호를 입력하세요">

                <span class="form_message"></span>
            </div>

            <!-- 비밀번호 확인 -->
            <div class="form_group">

                <label for="passwordCheck">
                    비밀번호 확인
                </label>

                <input
                        type="password"
                        id="passwordCheck"
                        name="passwordCheck"
                        placeholder="비밀번호를 다시 입력하세요">

                <span class="form_message"></span>
            </div>

            <!-- 이름 -->
            <div class="form_group">

                <label for="username">이름</label>

                <input
                        type="text"
                        id="username"
                        name="userName"
                        placeholder="이름을 입력하세요">

                <span class="form_message"></span>

            </div>

            <!-- 닉네임 -->
            <div class="form_group">

                <label for="nickname">닉네임</label>

                <div class="input_box">

                    <input
                            type="text"
                            id="nickname"
                            name="nickname"
                            placeholder="닉네임을 입력하세요">

                    <!-- 닉네임 중복확인 -->
                    <button
                            type="button"
                            id="nicknameCheckBtn">
                        중복확인
                    </button>

                </div>

                <span class="form_message"></span>

            </div>



            <!-- 가입 버튼 -->
            <div class="join_button_box">

                <button type="submit" class="join_btn">
                    회원가입
                </button>

            </div>

            <!-- 로그인 이동 -->
            <div class="login_link">

                <span>이미 계정이 있으신가요?</span>

                <a href="${pageContext.request.contextPath}/login">
                    로그인
                </a>

            </div>

        </form>

    </section>

</main>


<%-- 회원가입 전용 임시 Footer 대신 전체 서비스 공통 Footer를 사용합니다. --%>
<jsp:include page="/WEB-INF/views/common/footer.jsp" />


<!-- JS -->
<script>
    const contextPath = "${pageContext.request.contextPath}";
</script>

<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<script src="${pageContext.request.contextPath}/js/common.js"></script>
<script src="${pageContext.request.contextPath}/js/join.js"></script>

</body>
</html>
