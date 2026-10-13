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

    <title>로그아웃 | GrowLog</title>

    <link
            rel="stylesheet"
            href="${pageContext.request.contextPath}/css/common.css?v=20260731-1"
    >

    <link
            rel="stylesheet"
            href="${pageContext.request.contextPath}/css/logout.css"
    >
    <jsp:include page="/WEB-INF/views/common/responsive-styles.jsp" />
</head>

<body class="logout_page">

<main class="logout_main">

    <section class="logout_card">

        <a
                href="${pageContext.request.contextPath}/home"
                class="logout_logo"
                aria-label="GrowLog 홈으로 이동"
        >
            <img
                    src="${pageContext.request.contextPath}/images/full_logo.png"
                    alt="GrowLog"
            >
        </a>

        <div class="character_area">

            <div class="character_background"></div>

            <img
                    src="${pageContext.request.contextPath}/images/grobi-bow.png"
                    alt="꾸벅 인사하는 GrowLog 캐릭터 그로비"
                    class="logout_character"
            >

        </div>

        <div class="logout_content">

            <span class="logout_badge">
                SEE YOU AGAIN
            </span>

            <h1>로그아웃되었습니다.</h1>

            <p>
                오늘의 성장 기록도 수고하셨어요.<br>
                다음에 다시 만나요!
            </p>

        </div>

        <div class="logout_button_area">

            <a
                    href="${pageContext.request.contextPath}/login"
                    class="login_move_button"
            >
                로그인 페이지로 이동
            </a>

        </div>

    </section>

</main>

</body>
</html>

