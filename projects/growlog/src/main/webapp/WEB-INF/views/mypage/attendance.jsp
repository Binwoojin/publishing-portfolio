<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>

<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">

    <!-- 모바일 및 태블릿 반응형 화면을 위한 설정 -->
    <meta name="viewport"
          content="width=device-width, initial-scale=1.0">

    <title>출석 기록 | GrowLog</title>

    <!-- GrowLog 공통 스타일 -->
    <link rel="stylesheet"
          href="${pageContext.request.contextPath}/css/common.css?v=20260731-1">

    <!-- 출석체크 페이지 전용 스타일 -->
    <link rel="stylesheet"
          href="${pageContext.request.contextPath}/css/attendance.css">

    <!-- 출석 달력 생성 및 월 이동 기능 -->
    <script defer
            src="${pageContext.request.contextPath}/js/attendance.js">
    </script>
    <jsp:include page="/WEB-INF/views/common/responsive-styles.jsp" />
</head>

<body>

<%--
    현재 프로젝트에서 사용 중인 header.jsp 경로가 다르다면
    마이페이지에서 사용한 include 경로와 동일하게 변경한다.
--%>
<jsp:include page="/WEB-INF/views/common/header.jsp"/>

<main class="attendance_page">

    <!-- ========================================
         출석체크 페이지 상단 소개 영역
    ========================================= -->
    <section class="attendance_hero">

        <div class="attendance_hero_text">
            <span class="attendance_hero_label">
                ATTENDANCE
            </span>

            <h1>
                하루하루 쌓아온<br>
                나의 성장 발자국
            </h1>

            <p>
                성장 기록을 작성한 날짜를 확인하고,
                꾸준히 이어온 나만의 기록 습관을 살펴보세요.
            </p>

            <!-- 오늘 출석 여부 -->
            <c:choose>
                <c:when test="${todayAttendanceCompleted}">
                    <div class="today_attendance_status completed">
                        <span class="today_status_icon">✓</span>

                        <div>
                            <strong>오늘의 기록을 완료했어요!</strong>
                            <span>오늘도 성장 발자국을 남겼어요.</span>
                        </div>
                    </div>
                </c:when>

                <c:otherwise>
                    <div class="today_attendance_status waiting">
                        <span class="today_status_icon">!</span>

                        <div>
                            <strong>오늘은 아직 기록 전이에요</strong>
                            <span>성장 기록을 작성하면 오늘 출석이 인정돼요.</span>
                        </div>
                    </div>
                </c:otherwise>
            </c:choose>
        </div>

        <!--
            추후 출석 페이지 전용 그로비 이미지가 준비되면
            아래 이모지 영역을 img 태그로 변경할 수 있다.
        -->
        <div class="attendance_hero_visual"
             aria-hidden="true">

            <div class="hero_circle hero_circle_large"></div>
            <div class="hero_circle hero_circle_small"></div>

            <div class="attendance_character">
                <span class="character_calendar">📅</span>
                <span class="character_plant">🌱</span>
            </div>
        </div>

    </section>


    <!-- ========================================
         출석체크 페이지 본문
    ========================================= -->
    <section class="attendance_content">

        <!-- ========================================
             왼쪽 마이페이지 사이드 메뉴
        ========================================= -->
        <aside class="attendance_sidebar">

            <div class="sidebar_title">
                <span>마이페이지</span>
            </div>

            <nav class="sidebar_navigation"
                 aria-label="마이페이지 메뉴">

                <!-- 마이페이지 이동 -->
                <a href="${pageContext.request.contextPath}/mypage"
                   class="sidebar_menu">
                    <span class="sidebar_menu_icon">👤</span>
                    <span>내 정보</span>
                </a>

                <!-- 현재 접속 중인 출석 기록 메뉴 -->
                <a href="${pageContext.request.contextPath}/mypage/attendance"
                   class="sidebar_menu active">
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


        <!-- ========================================
             오른쪽 출석 콘텐츠
        ========================================= -->
        <div class="attendance_main">

            <!-- ========================================
                 출석 요약 카드
            ========================================= -->
            <section class="attendance_summary_section">

                <div class="section_heading">
                    <div>
                        <span class="section_eyebrow">
                            SUMMARY
                        </span>

                        <h2>나의 출석 현황</h2>
                    </div>

                    <p>
                        꾸준히 기록한 성장 일수를 확인해보세요.
                    </p>
                </div>

                <div class="attendance_summary_list">

                    <!-- 현재 연속 기록 -->
                    <article class="attendance_summary_card current_streak_card">

                        <div class="summary_card_icon">
                            🔥
                        </div>

                        <div class="summary_card_content">
                            <span class="summary_card_label">
                                현재 연속 기록
                            </span>

                            <strong>
                                <c:out value="${attendanceSummary.currentStreak}"/>
                                <small>일</small>
                            </strong>

                            <p>
                                지금도 꾸준히 성장 중이에요.
                            </p>
                        </div>

                    </article>

                    <!-- 최고 연속 기록 -->
                    <article class="attendance_summary_card best_streak_card">

                        <div class="summary_card_icon">
                            🏆
                        </div>

                        <div class="summary_card_content">
                            <span class="summary_card_label">
                                최고 연속 기록
                            </span>

                            <strong>
                                <c:out value="${attendanceSummary.bestStreak}"/>
                                <small>일</small>
                            </strong>

                            <p>
                                지금까지 달성한 최고 기록이에요.
                            </p>
                        </div>

                    </article>

                    <!-- 이번 달 출석일 -->
                    <article class="attendance_summary_card monthly_count_card">

                        <div class="summary_card_icon">
                            🌿
                        </div>

                        <div class="summary_card_content">
                            <span class="summary_card_label">
                                이번 달 출석
                            </span>

                            <strong>
                                <c:out value="${attendanceSummary.monthlyAttendanceCount}"/>
                                <small>일</small>
                            </strong>

                            <p>
                                이번 달에 남긴 성장 발자국이에요.
                            </p>
                        </div>

                    </article>

                </div>

            </section>


            <!-- ========================================
                 월간 출석 달력
            ========================================= -->
            <section class="attendance_calendar_section">

                <!-- 달력 상단 -->
                <div class="calendar_header">

                    <div>
                        <span class="section_eyebrow">
                            CALENDAR
                        </span>

                        <h2>월간 출석 기록</h2>
                    </div>

                    <div class="calendar_navigation">

                        <!-- 이전 달 이동 -->
                        <button type="button"
                                id="previousMonthButton"
                                class="calendar_navigation_button"
                                aria-label="이전 달 보기">
                            ‹
                        </button>

                        <!-- JavaScript에서 현재 연월이 표시된다. -->
                        <strong id="calendarCurrentMonth"
                                class="calendar_current_month">
                        </strong>

                        <!-- 다음 달 이동 -->
                        <button type="button"
                                id="nextMonthButton"
                                class="calendar_navigation_button"
                                aria-label="다음 달 보기">
                            ›
                        </button>

                    </div>

                </div>


                <!-- 달력 범례 -->
                <div class="calendar_legend">

                    <div class="calendar_legend_item">
                        <span class="legend_mark attendance_mark"></span>
                        <span>출석 완료</span>
                    </div>

                    <div class="calendar_legend_item">
                        <span class="legend_mark today_mark"></span>
                        <span>오늘</span>
                    </div>

                </div>


                <!-- 요일 표시 -->
                <div class="calendar_weekdays"
                     aria-hidden="true">

                    <span class="sunday">일</span>
                    <span>월</span>
                    <span>화</span>
                    <span>수</span>
                    <span>목</span>
                    <span>금</span>
                    <span class="saturday">토</span>

                </div>

                <!--
                    JavaScript에서 선택한 연월의 날짜를 생성한다.
                    임시 출석 날짜에는 출석 완료 스타일이 적용된다.
                -->
                <div id="attendanceCalendar"
                     class="attendance_calendar"
                     aria-label="월간 출석 달력">
                </div>

            </section>


            <!-- ========================================
                 출석 안내 영역
            ========================================= -->
            <section class="attendance_guide_section">

                <div class="guide_icon">
                    💡
                </div>

                <div class="guide_content">
                    <span class="section_eyebrow">
                        ATTENDANCE GUIDE
                    </span>

                    <h2>출석은 어떻게 기록되나요?</h2>

                    <p>
                        GrowLog에서는 하루에 한 번 이상 성장 기록을 작성하면
                        해당 날짜의 출석이 자동으로 인정돼요.
                    </p>

                    <ul class="guide_list">
                        <li>
                            목표와 연결된 성장 기록을 작성해도 출석으로 인정돼요.
                        </li>

                        <li>
                            자유롭게 작성한 일기 형태의 기록도 출석으로 인정돼요.
                        </li>

                        <li>
                            같은 날 여러 개의 기록을 작성해도 출석일은 하루로 계산돼요.
                        </li>
                    </ul>
                </div>

            </section>

        </div>

    </section>

</main>

<%-- 모든 서비스 페이지에서 동일한 공통 Footer를 사용합니다. --%>
<jsp:include page="/WEB-INF/views/common/footer.jsp" />

<%-- AttendanceService에서 계산한 이번 달 출석 날짜를 JavaScript 배열로 반환 --%>
<%-- ex) attendanceSummary.attendedDays = [1, 2, 5, 10]
        JavaScript에서는
        window.attendanceData.attendedDays = [1, 2, 5, 10]
        형태로 사용할 수 있다. --%>
<script>
    /*
     * Controller에서 전달한 AttendanceSummary의 출석 날짜 목록을
     * 외부 attendance.js가 사용할 수 있도록 전역 객체에 저장한다.
     */
    window.attendanceData = {
        attendedDays: [
            <c:forEach var="day"
                       items="${attendanceSummary.attendedDays}"
                       varStatus="status">
            ${day}<c:if test="${!status.last}">,</c:if>
            </c:forEach>
        ]
    };
</script>

<script
        src="${pageContext.request.contextPath}/js/common.js">
</script>

<script defer
        src="${pageContext.request.contextPath}/js/attendance.js">
</script>


</body>
</html>
