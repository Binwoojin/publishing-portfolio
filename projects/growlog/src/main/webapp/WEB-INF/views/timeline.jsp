<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fn" uri="jakarta.tags.functions" %>

<c:set var="contextPath" value="${pageContext.request.contextPath}" />

<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>성장 타임라인 | GrowLog</title>
    <link rel="stylesheet" href="${contextPath}/css/common.css?v=20260731-1">
    <link rel="stylesheet" href="${contextPath}/css/timeline.css">
    <jsp:include page="/WEB-INF/views/common/responsive-styles.jsp" />
</head>
<body class="timeline_page">

<jsp:include page="/WEB-INF/views/common/header.jsp" />

<%-- [React 전환 준비] TimelinePage 컴포넌트의 마운트 경계입니다. --%>
<main class="timeline_container" data-component="TimelinePage">
    <section class="timeline_hero" aria-labelledby="timelineTitle">
        <div class="timeline_hero_copy">
            <div class="timeline_eyebrow_row">
                <span class="timeline_eyebrow">
                    MY GROWTH JOURNEY
                </span>
            </div>

            <h1 id="timelineTitle">
                흩어진 오늘들이 모여<br>
                나만의 성장 이야기가 돼요.
            </h1>

            <p>
                목표를 세운 순간부터 작은 진전과 회고까지,<br>
                지나온 발자국을 한눈에 돌아보세요.
            </p>

            <div class="timeline_hero_actions">
                <a href="${contextPath}/record/write" class="timeline_button primary">
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                    오늘 기록 남기기
                </a>
                <a href="${contextPath}/goal/write" class="timeline_button secondary">
                    새 목표 만들기
                </a>
            </div>
        </div>

        <div class="timeline_hero_visual" aria-hidden="true">
            <div class="journey_path"></div>
            <span class="journey_dot dot_one"></span>
            <span class="journey_dot dot_two"></span>
            <span class="journey_dot dot_three"></span>
            <img src="${contextPath}/images/growing.png" alt="">
            <p><strong>꾸준함은</strong> 눈에 보이는 성장으로</p>
        </div>
    </section>

    <%-- [컴포넌트 경계] 추후 TimelineSummary 컴포넌트로 분리할 영역입니다. --%>
    <section class="timeline_summary" aria-label="이번 달 성장 요약" data-component="TimelineSummary">
        <article class="timeline_summary_card">
            <span class="summary_icon record" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M6 4h12v16H6zM9 9h6M9 13h6M9 17h4" /></svg>
            </span>
            <div>
                <span>이번 달 기록</span>
                <strong>
                    <c:out value="${monthlyRecordCount}"/>
                    <small>개</small>
                </strong>

                <p>선택한 달에 작성한 성장 기록이에요</p>
            </div>
        </article>

        <article class="timeline_summary_card">
            <span class="summary_icon goal" aria-hidden="true">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="m15 9 5-5" /></svg>
            </span>
            <div>
                <span>선택한 달의 목표</span>

                <strong>
                    <c:out value="${monthlyGoalCount}"/>
                    <small>개</small>
                </strong>

                <p>선택한 달에 새롭게 등록한 목표예요</p>
            </div>
        </article>

        <article class="timeline_summary_card accent">
            <span class="summary_icon streak" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M12 21c4 0 7-3 7-7 0-5-4-8-7-12-1 4-7 7-7 12 0 4 3 7 7 7Z"/><path d="M9 16c0 2 1 3 3 3s3-1 3-3-2-3-3-5c0 2-3 3-3 5Z"/></svg>
            </span>
            <div>
                <span>연속 기록</span>
                <strong>
                    <c:out value="${currentStreak}"/>
                    <small>일</small>
                </strong>
                <p>지금의 흐름을 오늘도 이어보세요</p>
            </div>
        </article>
    </section>

    <section class="timeline_content" aria-labelledby="journeyHeading">
        <div class="timeline_content_header">
            <div>
                <span class="timeline_section_label">
                    <c:out value="${selectedMonth.year}"/>년
                    <c:out value="${selectedMonth.monthValue}"/>월
                </span>
                <h2 id="journeyHeading">이번 달의 성장 여정</h2>
                <p>목표와 기록이 시간 순서대로 이어져요.</p>
            </div>

            <div class="timeline_month_control" aria-label="조회 월 이동">
                <a href="${contextPath}/timeline?year=${previousMonth.year}&amp;month=${previousMonth.monthValue}"
                   aria-label="이전 달"
                   class="timeline_month_button">
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                        <path d="m15 18-6-6 6-6"/>
                    </svg>
                </a>
                <strong data-current-month>
                    <c:out value="${selectedMonth.year}"/>년
                    <c:out value="${selectedMonth.monthValue}"/>월
                </strong>
                <c:choose>
                    <%-- 현재 달에서는 미래 달로 이동할 수 없다. --%>
                    <c:when test="${currentMonthSelected}">
        <span class="timeline_month_button disabled"
              aria-disabled="true">

            <svg aria-hidden="true"
                 viewBox="0 0 24 24">
                <path d="m9 18 6-6-6-6"/>
            </svg>
        </span>
                    </c:when>

                    <%-- 과거 달에서는 다음 달로 이동할 수 있다. --%>
                    <c:otherwise>
                        <a href="${contextPath}/timeline?year=${nextMonth.year}&amp;month=${nextMonth.monthValue}"
                           aria-label="다음 달"
                           class="timeline_month_button">

                            <svg aria-hidden="true"
                                 viewBox="0 0 24 24">
                                <path d="m9 18 6-6-6-6"/>
                            </svg>
                        </a>
                    </c:otherwise>
                </c:choose>
            </div>
        </div>

        <%--
    타임라인 유형 필터

    data-timeline-filter 값은 TimelineItem.type 값과 일치해야 한다.

    ALL    : 전체
    RECORD : 성장 기록
    GOAL   : 목표
--%>
        <div class="timeline_filter_bar">
            <div class="timeline_filters"
                 role="group"
                 aria-label="타임라인 유형 필터">

                <button type="button"
                        class="active"
                        data-timeline-filter="ALL"
                        aria-pressed="true">
                    전체
                </button>

                <button type="button"
                        data-timeline-filter="RECORD"
                        aria-pressed="false">
                    성장 기록
                </button>

                <button type="button"
                        data-timeline-filter="GOAL"
                        aria-pressed="false">
                    목표
                </button>
            </div>

            <%--
                처음 페이지가 표시될 때는 전체 DB 항목 수를 출력한다.

                필터 버튼을 선택한 이후에는 timeline.js가
                현재 화면에 보이는 항목 수로 변경한다.
            --%>
            <p aria-live="polite">
                <strong data-result-count>
                    <c:out value="${fn:length(timelineItems)}"/>
                </strong>개의 성장 활동
            </p>
        </div>

        <%--
     로그인 회원의 목표와 성장 기록을 출력하는 타임라인 영역

     timelineItems는 PageController에서 전달받는다.
     TimelineService에서 생성일 기준 최신순으로 정렬되어 있다.
 --%>
        <div class="journey_timeline"
             data-component="JourneyTimeline">

            <c:choose>
                <%-- 목표와 성장 기록이 하나도 없는 경우 --%>
                <c:when test="${empty timelineItems}">
                    <div class="timeline_filter_empty">
                        <svg aria-hidden="true"
                             viewBox="0 0 24 24">
                            <path d="M4 5h16M7 12h10m-7 7h4"/>
                        </svg>

                        <h3>아직 등록된 성장 활동이 없어요</h3>

                        <p>
                            새로운 목표를 만들거나 오늘의 성장 기록을 남겨보세요.
                        </p>

                        <div class="timeline_hero_actions">
                            <a href="${contextPath}/record/write"
                               class="timeline_button primary">
                                오늘 기록 남기기
                            </a>

                            <a href="${contextPath}/goal/write"
                               class="timeline_button secondary">
                                새 목표 만들기
                            </a>
                        </div>
                    </div>
                </c:when>

                <%-- 출력할 목표 또는 성장 기록이 존재하는 경우 --%>
                <c:otherwise>
                    <c:forEach var="item"
                               items="${timelineItems}">

                        <%--
                            timeline.js가 필터링할 수 있도록
                            GOAL 또는 RECORD 타입을 저장한다.
                        --%>
                        <section class="journey_day"
                                 data-timeline-type="${item.type}">

                            <header class="journey_date">
                                    <%--
                                        createdAt은 LocalDateTime이다.

                                        현재 단계에서는 문자열의 날짜 부분을 잘라 표시한다.
                                        날짜 표시 형식은 이후 DTO의 전용 포맷 필드로
                                        분리하면 더 깔끔하게 관리할 수 있다.
                                    --%>
                                <time datetime="${item.createdAt}">
                                    <strong>
                                        <c:out value="${fn:substring(item.createdAt, 8, 10)}"/>
                                    </strong>

                                    <span>
                                <c:out value="${fn:substring(item.createdAt, 0, 7)}"/>
                            </span>
                                </time>
                            </header>

                            <div class="journey_events">
                                    <%--
                                        type 값을 CSS 클래스로 사용한다.

                                        RECORD -> journey_event record
                                        GOAL   -> journey_event goal
                                    --%>
                                <article class="journey_event ${fn:toLowerCase(item.type)}">

                            <span class="event_marker"
                                  aria-hidden="true">

                                <%-- 성장 기록 아이콘 --%>
                                <c:if test="${item.type eq 'RECORD'}">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M6 4h12v16H6zM9 9h6M9 13h6M9 17h4"/>
                                    </svg>
                                </c:if>

                                <%-- 목표 아이콘 --%>
                                <c:if test="${item.type eq 'GOAL'}">
                                    <svg viewBox="0 0 24 24">
                                        <circle cx="12"
                                                cy="12"
                                                r="8"/>
                                        <circle cx="12"
                                                cy="12"
                                                r="3"/>
                                    </svg>
                                </c:if>
                            </span>

                                    <div class="event_card">
                                        <div class="event_meta">

                                                <%-- 항목 종류에 맞는 배지를 표시한다. --%>
                                            <c:choose>
                                                <c:when test="${item.type eq 'RECORD'}">
                                            <span class="event_badge record">
                                                성장 기록
                                            </span>
                                                </c:when>

                                                <c:otherwise>
                                            <span class="event_badge goal">
                                                새 목표
                                            </span>
                                                </c:otherwise>
                                            </c:choose>

                                                <%-- 등록 시간의 시·분 부분을 표시한다. --%>
                                            <time datetime="${item.createdAt}">
                                                <c:out value="${fn:substring(item.createdAt, 11, 16)}"/>
                                            </time>
                                        </div>

                                            <%-- 사용자 입력값은 c:out으로 안전하게 출력한다. --%>
                                        <h3>
                                            <c:out value="${item.title}"/>
                                        </h3>

                                            <%-- 내용이 존재할 때만 본문을 출력한다. --%>
                                        <c:if test="${not empty item.content}">
                                            <p>
                                                <c:out value="${item.content}"/>
                                            </p>
                                        </c:if>

                                        <div class="event_footer">
                                            <c:choose>
                                                <c:when test="${item.type eq 'RECORD'}">
                                                    <span>오늘의 성장 기록</span>
                                                </c:when>

                                                <c:otherwise>
                                                    <span>새로운 목표</span>
                                                </c:otherwise>
                                            </c:choose>

                                            <c:choose>
                                                <%-- 성장 기록은 상세 페이지로 이동한다. --%>
                                                <c:when test="${item.type eq 'RECORD'}">
                                                    <a href="${contextPath}${item.detailUrl}"
                                                       class="prototype_link">
                                                        기록 자세히 보기
                                                    </a>
                                                </c:when>

                                                <%--
                                                    목표 목록으로 이동한 후
                                                    해당 목표의 상세 모달을 자동으로 연다.
                                                --%>
                                                <c:otherwise>
                                                    <a href="${contextPath}${item.detailUrl}"
                                                       class="prototype_link">
                                                        목표 자세히 보기
                                                    </a>
                                                </c:otherwise>
                                            </c:choose>
                                        </div>
                                    </div>
                                </article>
                            </div>
                        </section>
                    </c:forEach>
                </c:otherwise>
            </c:choose>
        </div>

        <div class="timeline_filter_empty" data-filter-empty hidden>
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 5h16M7 12h10m-7 7h4"/></svg>
            <h3>선택한 유형의 활동이 없어요</h3>
            <p>다른 필터를 선택해 성장 여정을 둘러보세요.</p>
        </div>
    </section>
</main>

<%-- 모든 서비스 페이지에서 동일한 공통 Footer를 사용합니다. --%>
<jsp:include page="/WEB-INF/views/common/footer.jsp" />

<script src="${contextPath}/js/common.js"></script>
<script src="${contextPath}/js/timeline.js"></script>
</body>
</html>
