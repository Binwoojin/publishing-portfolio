<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>

<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">

    <!-- 모바일 화면에서도 실제 기기 너비를 기준으로 표시한다. -->
    <meta name="viewport"
          content="width=device-width, initial-scale=1.0">

    <title>마이페이지 | GrowLog</title>

    <!-- GrowLog 공통 스타일 -->
    <link rel="stylesheet"
          href="${pageContext.request.contextPath}/css/common.css?v=20260731-1">

    <!-- 마이페이지 전용 스타일 -->
    <link rel="stylesheet"
          href="${pageContext.request.contextPath}/css/mypage.css">
    <jsp:include page="/WEB-INF/views/common/responsive-styles.jsp" />
</head>

<body>

<%--
    공통 헤더 경로는 현재 프로젝트의 실제 header.jsp 위치에 맞춰 사용한다.
    아래 경로가 기존 프로젝트 경로와 다르면 현재 사용 중인 include 코드를 유지하면 된다.
--%>
<jsp:include page="/WEB-INF/views/common/header.jsp"/>

<main class="mypage">

    <!-- ========================================
         마이페이지 상단 소개 영역
    ========================================= -->
    <section class="mypage_hero">

        <div class="mypage_hero_text">
            <span class="mypage_hero_label">MY GROWLOG</span>

            <h1>
                나의 성장 공간을<br>
                한눈에 확인해보세요
            </h1>

            <p>
                작성한 목표와 성장 기록을 확인하고,
                꾸준히 쌓아온 나만의 성장 과정을 관리할 수 있어요.
            </p>
        </div>

        <!--
            아직 전용 이미지가 준비되지 않았다면 이 영역을 그대로 두어도 된다.
            이후 그로비 캐릭터 이미지를 넣을 때 img 태그로 변경할 예정이다.
        -->
        <div class="mypage_hero_visual"
             aria-hidden="true">

            <div class="hero_leaf hero_leaf_left"></div>
            <div class="hero_leaf hero_leaf_right"></div>

            <div class="hero_character">
                🌱
            </div>
        </div>

    </section>


    <!-- ========================================
         마이페이지 본문 영역
    ========================================= -->
    <section class="mypage_content">

        <!-- 왼쪽 사이드 메뉴 -->
        <aside class="mypage_sidebar">

            <div class="sidebar_title">
                <span>마이페이지</span>
            </div>

            <nav class="sidebar_navigation"
                 aria-label="마이페이지 메뉴">

                <!-- 현재 접속 중인 메뉴 -->
                <a href="${pageContext.request.contextPath}/mypage"
                   class="sidebar_menu active">
                    <span class="sidebar_menu_icon">👤</span>
                    <span>내 정보</span>
                </a>

                <!-- 출석체크 페이지 이동 -->
                <a href="${pageContext.request.contextPath}/mypage/attendance"
                   class="sidebar_menu">
                    <span class="sidebar_menu_icon">📅</span>
                    <span>출석 기록</span>
                </a>

                <a href="${pageContext.request.contextPath}/mypage/settings"
                   class="sidebar_menu">
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


        <!-- 오른쪽 실제 콘텐츠 영역 -->
        <div class="mypage_main">

            <!-- ========================================
                 프로필 카드
            ========================================= -->
            <section class="profile_card">

                <div class="profile_card_header">
                    <div>
                        <span class="section_eyebrow">
                            PROFILE
                        </span>

                        <h2>내 프로필</h2>
                    </div>

                    <a href="${pageContext.request.contextPath}/mypage/settings"
                       class="profile_edit_button">
                        계정 설정
                    </a>
                </div>

                <div class="profile_card_body">

                    <!-- 기본 프로필 이미지 영역 -->
                    <div class="profile_avatar">
                        <span>🌿</span>
                    </div>

                    <!-- 로그인 회원 정보 -->
                    <div class="profile_information">

                        <div class="profile_name_row">
                            <h3>
                                <c:choose>
                                    <c:when test="${not empty member.nickname}">
                                        <c:out value="${member.nickname}"/>
                                    </c:when>

                                    <c:otherwise>
                                        GrowLog 회원
                                    </c:otherwise>
                                </c:choose>
                            </h3>

                            <span class="profile_status">
                                성장 기록 중
                            </span>
                        </div>

                        <p class="profile_message">
                            오늘의 작은 기록이 내일의 큰 성장이 됩니다.
                        </p>

                        <dl class="profile_detail_list">

                            <div class="profile_detail_item">
                                <dt>이메일</dt>

                                <dd>
                                    <c:choose>
                                        <c:when test="${not empty member.email}">
                                            <c:out value="${member.email}"/>
                                        </c:when>

                                        <c:otherwise>
                                            이메일 정보 없음
                                        </c:otherwise>
                                    </c:choose>
                                </dd>
                            </div>

                            <div class="profile_detail_item">
                                <dt>회원 상태</dt>
                                <dd>정상 이용 중</dd>
                            </div>

                        </dl>

                    </div>

                </div>

            </section>


            <!-- ========================================
                 활동 요약 카드
            ========================================= -->
            <section class="activity_section">

                <div class="section_heading">
                    <div>
                        <span class="section_eyebrow">
                            ACTIVITY
                        </span>

                        <h2>나의 활동 요약</h2>
                    </div>

                    <p>
                        GrowLog에서 기록한 활동을 확인할 수 있어요.
                    </p>
                </div>

                <div class="activity_card_list">

                    <!-- 등록한 목표 수 -->
                    <article class="activity_card">

                        <div class="activity_icon activity_icon_goal">
                            🎯
                        </div>

                        <div class="activity_card_content">
                            <span class="activity_label">
                                등록한 목표
                            </span>

                            <strong>
                                <c:out value="${goalCount}"/>
                                <small>개</small>
                            </strong>
                        </div>

                        <a href="${pageContext.request.contextPath}/goal"
                           class="activity_link"
                           aria-label="목표 목록으로 이동">
                            →
                        </a>

                    </article>

                    <!-- 작성한 성장 기록 수 -->
                    <article class="activity_card">

                        <div class="activity_icon activity_icon_record">
                            ✍️
                        </div>

                        <div class="activity_card_content">
                            <span class="activity_label">
                                작성한 성장 기록
                            </span>

                            <strong>
                                <c:out value="${recordCount}"/>
                                <small>개</small>
                            </strong>
                        </div>

                        <a href="${pageContext.request.contextPath}/record/list"
                           class="activity_link"
                           aria-label="성장 기록 목록으로 이동">
                            →
                        </a>

                    </article>

                    <!-- 현재 연속 출석일 -->
                    <article class="activity_card">

                        <div class="activity_icon activity_icon_attendance">
                            🔥
                        </div>

                        <div class="activity_card_content">
                            <span class="activity_label">
                                현재 연속 기록
                            </span>

                            <strong>
                                <c:out value="${currentStreak}"/>
                                <small>일</small>
                            </strong>
                        </div>

                        <a href="${pageContext.request.contextPath}/mypage/attendance"
                           class="activity_link"
                           aria-label="출석 기록으로 이동">
                            →
                        </a>

                    </article>

                </div>

            </section>


            <!-- ========================================
                 마이페이지 메뉴 바로가기
            ========================================= -->
            <section class="quick_menu_section">

                <div class="section_heading">
                    <div>
            <span class="section_eyebrow">
                QUICK MENU
            </span>

                        <h2>내 정보 관리</h2>
                    </div>
                </div>


                <!--
                    빠른 메뉴 카드 3개를 감싸는 부모 컨테이너다.
                    이동 가능한 카드는 a 태그,
                    아직 구현하지 않은 카드는 div 태그로 구성한다.
                -->
                <div class="quick_menu_list">

                    <!-- 출석 기록 페이지 이동 카드 -->
                    <a href="${pageContext.request.contextPath}/mypage/attendance"
                       class="quick_menu_card">

                        <div class="quick_menu_icon">
                            📆
                        </div>

                        <div class="quick_menu_content">
                            <h3>출석 기록</h3>

                            <p>
                                내가 꾸준히 기록한 날짜와
                                연속 출석 현황을 확인해보세요.
                            </p>
                        </div>

                        <span class="quick_menu_arrow">
                →
            </span>

                    </a>


                    <!-- 계정 설정 페이지 이동 카드 -->
                    <a href="${pageContext.request.contextPath}/mypage/settings"
                       class="quick_menu_card">

                        <div class="quick_menu_icon">
                            ⚙️
                        </div>

                        <div class="quick_menu_content">
                            <h3>계정 설정</h3>

                            <p>
                                닉네임과 비밀번호 등
                                계정 정보를 관리할 수 있어요.
                            </p>
                        </div>

                        <span class="quick_menu_arrow">
                →
            </span>

                    </a>


                    <a href="${pageContext.request.contextPath}/mypage/badges"
                       class="quick_menu_card">

                        <div class="quick_menu_icon">
                            🏆
                        </div>

                        <div class="quick_menu_content">

                            <div class="quick_menu_title_row">
                                <h3>배지 보관함</h3>
                            </div>

                            <p>
                                GrowLog 활동을 통해 획득한
                                나만의 성장 뱃지를 확인해보세요.
                            </p>

                        </div>

                        <span class="quick_menu_arrow">→</span>
                    </a>

                </div>

            </section>

        </div>

    </section>

</main>

<%-- 모든 서비스 페이지에서 동일한 공통 Footer를 사용합니다. --%>
<jsp:include page="/WEB-INF/views/common/footer.jsp" />

<script
        src="${pageContext.request.contextPath}/js/common.js">
</script>

</body>
</html>
