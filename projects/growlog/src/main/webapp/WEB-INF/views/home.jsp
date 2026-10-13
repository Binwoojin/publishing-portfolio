<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, initial-scale=1.0">
    <title>GrowLog Home</title>
    <link rel="stylesheet"
          href="${pageContext.request.contextPath}/css/common.css?v=20260731-1">
    <link rel="stylesheet"
          href="${pageContext.request.contextPath}/css/home.css">
    <jsp:include page="/WEB-INF/views/common/responsive-styles.jsp" />
</head>
<body class="home_page">

<jsp:include page="/WEB-INF/views/common/header.jsp" />

<main class="home_container">

    <section class="welcome_section">
        <div>
            <span class="welcome_badge">TODAY'S GROWTH</span>

            <h1>
                안녕하세요, <c:out value="${member.nickname}"/>님!<br>
                오늘도 한 걸음 성장해 볼까요?
            </h1>

            <p>
                목표를 확인하고 오늘의 경험과 배운 점을 기록해 보세요.
            </p>

            <div class="welcome_buttons">
                <button
                        type="button"
                        class="primary_button record_write_button"
                        data-url="${pageContext.request.contextPath}/record/write"
                >
                    성장 기록 작성
                </button>

                <button
                        type="button"
                        class="secondary_button goal_write_button"
                        data-url="${pageContext.request.contextPath}/goal/write"
                >
                    새로운 목표 만들기
                </button>
            </div>
        </div>

        <img
                src="${pageContext.request.contextPath}/images/grobi.png"
                alt="응원하는 그로비"
                class="home_growbi"
        >
    </section>

    <section class="summary_grid">
        <article class="summary_card">
            <span>진행 중인 목표</span>
            <strong>${goalCount}</strong>
            <p>이번 주 목표를 이어가고 있어요.</p>
        </article>

        <article class="summary_card">
            <span>이번 달 기록</span>
            <strong>${thisMonthRecordCount}</strong>
            <p>꾸준히 기록하고 있어요.</p>
        </article>

        <article class="summary_card attendance_card">

            <span>연속 기록</span>

            <strong>
                ${attendanceSummary.currentStreak}일
            </strong>

            <c:choose>

                <%-- 오늘 출석 완료 --%>
                <c:when test="${attendanceSummary.attendedToday}">
                    <p>
                        오늘까지 ${attendanceSummary.currentStreak}일째
                        기록 달성 유지 중이에요!
                    </p>
                </c:when>

                <%-- 아직 오늘 출석하지 않은 경우 --%>
                <c:otherwise>
                    <p>
                        오늘도 기록하면
                            ${attendanceSummary.currentStreak + 1}일째예요.
                    </p>
                </c:otherwise>

            </c:choose>

        </article>
    </section>

    <section class="content_grid">

        <article class="content_panel">

            <div class="panel_header">
                <div>
                    <span class="panel_label">GOAL</span>
                    <h2>진행 중인 목표</h2>
                </div>

                <a href="${pageContext.request.contextPath}/goal/list">
                    전체 보기
                </a>
            </div>

            <c:choose>

                <c:when test="${empty recentGoals}">

                    <div class="goal_empty_message">
                        <p>아직 등록된 목표가 없습니다.</p>

                        <a href="${pageContext.request.contextPath}/goal/write">
                            목표 등록하기
                        </a>
                    </div>

                </c:when>

                <c:otherwise>

                    <c:forEach var="goalItem"
                               items="${recentGoals}">

                        <div class="goal_item">

                            <div class="goal_info">

                        <span class="goal_category">
                                ${goalItem.goalStatus}
                        </span>

                                <h3>
                                        ${goalItem.goalTitle}
                                </h3>

                                <c:if test="${not empty goalItem.goalContent}">
                                    <p>
                                            ${goalItem.goalContent}
                                    </p>
                                </c:if>

                            </div>

                            <strong>
                                    ${goalItem.goalProgress}%
                            </strong>

                            <div class="progress_bar">
                        <span
                                style="width: ${goalItem.goalProgress}%;"
                                aria-label="목표 진행률 ${goalItem.goalProgress}%"
                        ></span>
                            </div>

                        </div>

                    </c:forEach>

                </c:otherwise>

            </c:choose>

        </article>

        <article class="content_panel">

            <%-- 최근 성장기록 영역 제목 및 전체 목록 이동 링크 --%>
            <div class="panel_header">
                <div>
                    <span class="panel_label">RECORD</span>
                    <h2>최근 성장 기록</h2>
                </div>

                <a href="${pageContext.request.contextPath}/record/list">
                    전체 보기
                </a>
            </div>

            <%-- 최근 성장기록이 존재하는 경우 --%>
            <c:choose>

                <c:when test="${not empty recentRecords}">

                    <%-- 최신 성장기록을 최대 3개까지 반복 출력 --%>
                    <c:forEach items="${recentRecords}" var="recordItem">

                        <a href="${pageContext.request.contextPath}/record/${recordItem.recordNum}"
                           class="record_item">

                                <%-- 성장기록 작성일 --%>
                            <time datetime="${recordItem.createdAt}">
                                    ${recordItem.formattedCreatedDate}
                            </time>

                                <%-- 성장기록 제목 및 내용 --%>
                            <div>
                                <h3>
                                    <c:out value="${recordItem.title}" />
                                </h3>

                                <p>
                                    <c:out value="${recordItem.content}" />
                                </p>
                            </div>

                        </a>

                    </c:forEach>

                </c:when>

                <%-- 아직 작성한 성장기록이 없는 경우 --%>
                <c:otherwise>

                    <div class="record_empty">
                        <p>아직 작성한 성장기록이 없어요.</p>

                        <a href="${pageContext.request.contextPath}/record/write">
                            첫 성장기록 작성하기
                        </a>
                    </div>

                </c:otherwise>

            </c:choose>

        </article>
    </section>
</main>

<%-- 모든 서비스 페이지에서 동일한 공통 Footer를 사용합니다. --%>
<jsp:include page="/WEB-INF/views/common/footer.jsp" />

<script
        src="${pageContext.request.contextPath}/js/common.js">
</script>

<script
        src="${pageContext.request.contextPath}/js/home.js">
</script>


</body>
</html>
