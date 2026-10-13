<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>

<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">

    <!-- 모바일과 태블릿에서도 실제 화면 너비를 사용한다. -->
    <meta name="viewport"
          content="width=device-width, initial-scale=1.0">

    <title>계정 설정 | GrowLog</title>

    <!-- GrowLog 공통 스타일 -->
    <link rel="stylesheet"
          href="${pageContext.request.contextPath}/css/common.css?v=20260731-1">

    <!-- 마이페이지 공통 레이아웃 스타일 -->
    <link rel="stylesheet"
          href="${pageContext.request.contextPath}/css/mypage.css">

    <!-- 계정 설정 전용 스타일 -->
    <link rel="stylesheet"
          href="${pageContext.request.contextPath}/css/settings.css">
    <jsp:include page="/WEB-INF/views/common/responsive-styles.jsp" />
</head>

<body>

<%--
    현재 프로젝트에서 사용하는 공통 헤더 경로와
    profile.jsp의 include 경로를 동일하게 유지한다.
--%>
<jsp:include page="/WEB-INF/views/common/header.jsp"/>

<main class="settings_page">

    <!-- ========================================
         마이페이지 공통 상단 소개 영역
    ========================================= -->
    <section class="settings_hero">

        <div class="settings_hero_text">
            <span class="settings_hero_label">
                MY GROWLOG
            </span>

            <h1>
                나에게 맞는 GrowLog로<br>
                설정해보세요
            </h1>

            <p>
                프로필 정보와 계정 보안 설정을 관리하고,
                나의 GrowLog 이용 정보를 확인할 수 있어요.
            </p>
        </div>

        <!--
            추후 계정 설정 페이지에 어울리는 그로비 이미지가 준비되면
            아래 장식 영역을 img 태그로 변경할 수 있다.
        -->
        <div class="settings_hero_visual"
             aria-hidden="true">

            <div class="settings_visual_leaf leaf_left"></div>
            <div class="settings_visual_leaf leaf_right"></div>

            <div class="settings_visual_circle">
                ⚙️
            </div>
        </div>

    </section>


    <!-- ========================================
         마이페이지 본문
    ========================================= -->
    <section class="settings_content">

        <!-- ========================================
             왼쪽 마이페이지 사이드 메뉴
        ========================================= -->
        <aside class="settings_sidebar">

            <div class="sidebar_title">
                <span>마이페이지</span>
            </div>

            <nav class="sidebar_navigation"
                 aria-label="마이페이지 메뉴">

                <!-- 프로필 페이지 -->
                <a href="${pageContext.request.contextPath}/mypage/profile"
                   class="sidebar_menu">
                    <span class="sidebar_menu_icon">👤</span>
                    <span>내 정보</span>
                </a>

                <!-- 출석 페이지 -->
                <a href="${pageContext.request.contextPath}/mypage/attendance"
                   class="sidebar_menu">
                    <span class="sidebar_menu_icon">📅</span>
                    <span>출석 기록</span>
                </a>

                <!-- 현재 접속 중인 계정 설정 페이지 -->
                <a href="${pageContext.request.contextPath}/mypage/settings"
                   class="sidebar_menu active">
                    <span class="sidebar_menu_icon">⚙️</span>
                    <span>계정 설정</span>
                </a>

                <a href="${pageContext.request.contextPath}/mypage/badges"
                   class="sidebar_menu">
                    <span class="sidebar_menu_icon">🏅</span>
                    <span>배지 보관함</span>
                </a>

            </nav>

        </aside>


        <!-- ========================================
             오른쪽 계정 설정 콘텐츠
        ========================================= -->
        <div class="settings_main">

            <!-- 페이지 제목 카드 -->
            <section class="settings_title_card">

                <div>
                    <span class="section_eyebrow">
                        ACCOUNT SETTINGS
                    </span>

                    <h2>계정 설정</h2>

                    <p>
                        GrowLog에서 사용하는 프로필과 계정 정보를 관리할 수 있어요.
                    </p>
                </div>

                <a href="${pageContext.request.contextPath}/mypage/profile"
                   class="profile_back_link">
                    프로필로 돌아가기
                </a>

            </section>


            <!-- ========================================
                 프로필 정보 설정
            ========================================= -->
            <section class="settings_section">

                <div class="settings_section_header">

                    <div class="settings_section_icon profile_icon">
                        👤
                    </div>

                    <div>
                        <span class="section_eyebrow">
                            PROFILE
                        </span>

                        <h2>프로필 정보</h2>

                        <p>
                            다른 화면에 표시되는 닉네임을 관리할 수 있어요.
                        </p>
                    </div>

                </div>


                <!-- ========================================
     닉네임 변경 폼
======================================== -->
                <form action="${pageContext.request.contextPath}/mypage/settings/nickname"
                      method="post"
                      id="nicknameUpdateForm"
                      class="settings_form">
                    <%-- Spring Security CSRF 검증용 토큰 --%>
                    <input type="hidden"
                           name="${_csrf.parameterName}"
                           value="${_csrf.token}">


                    <!-- 닉네임 변경 실패 메시지 -->
                    <c:if test="${not empty nicknameError}">
                        <div class="settings_message error">
                            <c:out value="${nicknameError}"/>
                        </div>
                    </c:if>

                    <!-- 닉네임 입력 -->
                    <div class="settings_form_group">

                        <div class="settings_label_area">
                            <label for="nickname">
                                닉네임
                            </label>

                            <p>
                                GrowLog 화면과 기록에 표시되는 이름이에요.
                            </p>
                        </div>

                        <div class="settings_input_area">

                            <!--
                                닉네임 입력창과 중복 확인 버튼을
                                한 줄에 배치하기 위한 영역이다.
                            -->
                            <div class="nickname_input_row">

                                <input type="text"
                                       id="nickname"
                                       name="nickname"
                                       value="<c:out value='${member.nickname}'/>"
                                       minlength="2"
                                       maxlength="30"
                                       autocomplete="nickname"
                                       required>

                                <button type="button"
                                        id="nicknameCheckButton"
                                        class="nickname_check_button">
                                    중복 확인
                                </button>

                            </div>

                            <!-- 중복 확인 결과가 JavaScript로 표시되는 영역 -->
                            <span id="nicknameCheckMessage"
                                  class="nickname_check_message">
                닉네임을 변경하려면 중복 확인을 진행해주세요.
            </span>

                            <span class="input_limit">
                2자 이상 30자 이하
            </span>

                        </div>

                    </div>


                    <!-- 이메일 조회 -->
                    <div class="settings_form_group">

                        <div class="settings_label_area">
                            <label for="email">
                                이메일
                            </label>

                            <p>
                                로그인 아이디로 사용되는 이메일이에요.
                            </p>
                        </div>

                        <div class="settings_input_area">

                            <!-- 이메일은 수정 대상이 아니므로 disabled로 유지한다. -->
                            <input type="email"
                                   id="email"
                                   value="<c:out value='${member.email}'/>"
                                   disabled>

                            <span class="input_notice">
                이메일은 현재 변경할 수 없어요.
            </span>

                        </div>

                    </div>


                    <!-- 닉네임 저장 버튼 -->
                    <div class="settings_form_actions">

                        <button type="reset"
                                id="nicknameResetButton"
                                class="settings_cancel_button">
                            입력 초기화
                        </button>

                        <!--
                            닉네임 중복 확인을 통과하기 전에는 저장할 수 없다.
                            settings.js에서 중복 확인 성공 시 disabled를 해제한다.
                        -->
                        <button type="submit"
                                id="nicknameSaveButton"
                                class="settings_save_button"
                                disabled>
                            변경 내용 저장
                        </button>

                    </div>

                </form>

            </section>


            <!-- ========================================
                 보안 설정
            ========================================= -->
            <section class="settings_section">

                <div class="settings_section_header">

                    <div class="settings_section_icon security_icon">
                        🔒
                    </div>

                    <div>
                        <span class="section_eyebrow">
                            SECURITY
                        </span>

                        <h2>보안 설정</h2>

                        <p>
                            비밀번호를 변경하여 계정을 안전하게 관리할 수 있어요.
                        </p>
                    </div>

                </div>

                <!-- ========================================
         비밀번호 변경 폼
    ======================================== -->
                <form action="${pageContext.request.contextPath}/mypage/settings/password"
                      method="post"
                      id="passwordUpdateForm"
                      class="password_change_form">
                    <%-- Spring Security CSRF 검증용 토큰 --%>
                    <input type="hidden"
                           name="${_csrf.parameterName}"
                           value="${_csrf.token}">


                    <!-- 비밀번호 변경 실패 메시지 -->
                    <c:if test="${not empty passwordError}">
                        <div class="settings_message error">
                            <c:out value="${passwordError}"/>
                        </div>
                    </c:if>

                    <div class="password_form_grid">

                        <!-- 현재 비밀번호 -->
                        <div class="password_form_group">

                            <label for="currentPassword">
                                현재 비밀번호
                            </label>

                            <input type="password"
                                   id="currentPassword"
                                   name="currentPassword"
                                   autocomplete="current-password"
                                   required>

                            <span class="password_form_help">
                현재 로그인 계정의 비밀번호를 입력해주세요.
            </span>

                        </div>


                        <!-- 새로운 비밀번호 -->
                        <div class="password_form_group">

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

                            <span class="password_form_help">
                회원가입 시 사용한 비밀번호 규칙과 동일하게 입력해주세요.
            </span>

                        </div>


                        <!-- 새로운 비밀번호 확인 -->
                        <div class="password_form_group">

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

                            <!-- 두 비밀번호의 일치 여부가 표시되는 영역 -->
                            <span id="passwordMatchMessage"
                                  class="password_match_message">
            </span>

                        </div>

                    </div>


                    <!-- 비밀번호 변경 버튼 -->
                    <div class="settings_form_actions">

                        <button type="reset"
                                id="passwordResetButton"
                                class="settings_cancel_button">
                            입력 초기화
                        </button>

                        <button type="submit"
                                id="passwordSaveButton"
                                class="settings_save_button"
                                disabled>
                            비밀번호 변경
                        </button>

                    </div>

                </form>


            </section>


        </div>

    </section>

</main>

<%-- 모든 서비스 페이지에서 동일한 공통 Footer를 사용합니다. --%>
<jsp:include page="/WEB-INF/views/common/footer.jsp" />

<script>
    window.contextPath =
        "${pageContext.request.contextPath}";
</script>

<script
        src="${pageContext.request.contextPath}/js/common.js">
</script>



<script defer
        src="${pageContext.request.contextPath}/js/settings.js">
</script>



</body>
</html>
