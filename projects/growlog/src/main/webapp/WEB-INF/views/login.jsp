<%@ page language="java"
         contentType="text/html; charset=UTF-8"
         pageEncoding="UTF-8" %>

<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">

    <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
    >

    <title>GrowLog 로그인</title>

    <link
            rel="stylesheet"
            href="${pageContext.request.contextPath}/css/common.css?v=20260731-1"
    >

    <link
            rel="stylesheet"
            href="${pageContext.request.contextPath}/css/login.css"
    >
    <jsp:include page="/WEB-INF/views/common/responsive-styles.jsp" />
</head>

<body class="login_page">

<main class="login_container">

    <!-- 왼쪽 소개 영역 -->
    <section class="login_intro">

        <a
                href="${pageContext.request.contextPath}/home"
                class="brand"
        >
            <img
                    src="${pageContext.request.contextPath}/images/full_logo.png"
                    alt="GrowLog"
                    class="brand_logo"
            >
        </a>

        <div class="intro_content">

            <span class="intro_badge">
                My Growth Archive
            </span>

            <h1>
                오늘의 작은 기록으로<br>
                나만의 성장을 만들어보세요.
            </h1>

            <p>
                일상과 목표를 기록하고 시간이 지나면서 변화한
                나의 모습을 확인할 수 있습니다.
            </p>

        </div>

        <img
                src="${pageContext.request.contextPath}/images/grobi.png"
                alt="GrowLog 캐릭터 그로비"
                class="growbi_image"
        >

    </section>


    <!-- 오른쪽 로그인 영역 -->
    <section class="login_card">

        <!-- 모바일 전용 로고 -->
        <a
                href="${pageContext.request.contextPath}/home"
                class="mobile_brand"
        >
            <img
                    src="${pageContext.request.contextPath}/images/full_logo.png"
                    alt="GrowLog"
            >
        </a>

        <div class="login_header">

            <p class="eyebrow">
                WELCOME BACK
            </p>

            <h2>로그인</h2>

            <p>
                GrowLog에 오늘의 성장을 기록해 보세요.
            </p>

        </div>

        <%--
            Spring Security 로그인에 실패하면 /login?error로 이동한다.

            param.error가 존재하면 기존 login.js가 표시할 수 있도록
            공통 오류 메시지를 hidden input에 저장한다.

            이메일이 틀렸는지 비밀번호가 틀렸는지를 구분해서 알려주면
            가입된 이메일을 추측하는 데 악용될 수 있으므로
            동일한 오류 메시지를 사용한다.
        --%>

        <input
                type="hidden"
                id="loginErrorMessage"
                value="${param.error != null
                ? '이메일 또는 비밀번호가 올바르지 않습니다.'
                : ''}"
        >

        <form
                action="${pageContext.request.contextPath}/login"
                method="post"
                class="login_form"
        >
            <%-- Spring Security CSRF 검증용 토큰 --%>
            <input type="hidden"
                   name="${_csrf.parameterName}"
                   value="${_csrf.token}">


            <div class="input_group">

                <label for="email">
                    이메일
                </label>

                <input
                        type="email"
                        name="email"
                        id="email"
                        placeholder="example@email.com"
                        autocomplete="email"
                        required
                >

                <span class="input_message"></span>

            </div>

            <div class="input_group">

                <label for="password">
                    비밀번호
                </label>

                <div class="password_input_box">

                    <input
                            type="password"
                            name="password"
                            id="password"
                            placeholder="비밀번호를 입력하세요."
                            autocomplete="current-password"
                            required
                    >

                    <button
                            type="button"
                            class="password_toggle"
                            id="passwordToggle"
                            aria-label="비밀번호 표시"
                    >
                        보기
                    </button>

                </div>

                <span class="input_message"></span>

            </div>

            <div class="login_options">

                <label class="remember_area">

                    <input
                            type="checkbox"
                            name="rememberEmail"
                            id="rememberEmail"
                    >

                    <span class="custom_checkbox"></span>

                    <span class="remember_text">
                        이메일 기억하기
                    </span>

                </label>

                <a
                        href="${pageContext.request.contextPath}/find-password"
                        class="password_find_link"
                >
                    비밀번호 찾기
                </a>

            </div>

            <button
                    type="submit"
                    class="primary_button"
            >
                로그인
            </button>

        </form>

        <div class="signup_area">

            <span>
                아직 회원이 아니신가요?
            </span>

            <a href="${pageContext.request.contextPath}/join">
                회원가입
            </a>

        </div>

    </section>

</main>

<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<script src="${pageContext.request.contextPath}/js/common.js"></script>
<script src="${pageContext.request.contextPath}/js/login.js"></script>

</body>
</html>
