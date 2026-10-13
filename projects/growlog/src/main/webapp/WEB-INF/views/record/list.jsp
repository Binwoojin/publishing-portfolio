<%@ page contentType="text/html;charset=UTF-8" language="java" %>

<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fn" uri="jakarta.tags.functions" %>

<c:set var="contextPath" value="${pageContext.request.contextPath}" />

<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>성장 기록 | GrowLog</title>

    <link rel="stylesheet" href="${contextPath}/css/common.css?v=20260731-1">
    <link rel="stylesheet" href="${contextPath}/css/record.css">
    <jsp:include page="/WEB-INF/views/common/responsive-styles.jsp" />
</head>
<body>

<jsp:include page="/WEB-INF/views/common/header.jsp" />

<%-- [React 전환 준비] 이 루트의 data-component를 React 마운트 경계로 그대로 사용할 수 있습니다. --%>
<main class="record_list_page"
      data-component="RecordTimeline"
      data-record-count="${fn:length(records)}">

    <section class="record_list_hero">

        <div class="record_list_hero_text">

        <span class="record_list_hero_label">
            GROWTH RECORD
        </span>

            <h1 class="record_list_hero_title">
                매일의 경험이 모여<br>
                나만의 성장 과정이 됩니다.
            </h1>

            <p class="record_list_hero_description">
                지금까지 남긴 기록을 돌아보고<br>
                오늘의 새로운 이야기도 이어서 작성해보세요.
            </p>

        </div>


        <div class="record_list_hero_right">

            <img
                    src="${contextPath}/images/record_grobi.png"
                    alt="성장기록 그로비"
                    class="record_list_hero_image">

            <a href="${contextPath}/record/write"
               class="record_write_button">

                <span aria-hidden="true">＋</span>
                성장 기록 작성

            </a>

        </div>

    </section>

    <section class="record_list_content" aria-labelledby="recordTimelineTitle">

        <div class="record_list_heading">
            <div>
                <span class="record_list_label">MY RECORDS</span>
                <h2 id="recordTimelineTitle">나의 성장 타임라인</h2>
                <p class="record_list_subtitle">최근의 기록부터 차곡차곡 모아봤어요.</p>
            </div>

            <p class="record_count" aria-live="polite">
                <span data-visible-label>전체</span>
                <strong data-visible-count>${fn:length(records)}</strong>개의 기록
            </p>
        </div>

        <%-- ========================================
     성장 기록 필터
======================================== --%>

        <%-- [React 전환 준비] 필터 값은 UI 문구와 분리된 enum 형태로 유지합니다. --%>
        <div class="record_filter_toolbar">
            <div class="record_filter_group"
                 role="group"
                 aria-label="성장 기록 유형 필터">

            <%-- 전체 기록 보기 --%>
            <button
                    type="button"
                    class="record_filter_button active"
                    data-record-filter="ALL"
                    data-filter-label="전체"
                    aria-pressed="true"
            >
                전체 보기
            </button>

            <%-- 목표 연동 기록만 보기 --%>
            <button
                    type="button"
                    class="record_filter_button"
                    data-record-filter="GOAL"
                    data-filter-label="목표 연동"
                    aria-pressed="false"
            >
                목표 연동
            </button>

            <%-- 자유 기록만 보기 --%>
            <button
                    type="button"
                    class="record_filter_button"
                    data-record-filter="FREE"
                    data-filter-label="자유 기록"
                    aria-pressed="false"
            >
                자유 기록
            </button>

            </div>

            <a href="${contextPath}/record/write" class="record_toolbar_write">
                <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
                    <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2"/>
                </svg>
                새 기록
            </a>
        </div>

        <c:choose>
            <c:when test="${empty records}">
                <section class="record_empty">
                    <div class="record_empty_icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="38" height="38">
                            <path d="M12 21v-9m0 3c-4.5 0-7-2.5-7-7 4.5 0 7 2.5 7 7Zm0-3c0-4.5 2.5-7 7-7 0 4.5-2.5 7-7 7Z"
                                  fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7"/>
                        </svg>
                    </div>

                    <h2>아직 작성한 성장 기록이 없어요.</h2>

                    <p>
                        오늘의 경험이나 감정, 새롭게 배운 내용을<br>
                        첫 성장 기록으로 남겨보세요.
                    </p>

                    <a href="${contextPath}/record/write" class="record_empty_button">
                        첫 기록 작성하기
                    </a>
                </section>
            </c:when>

            <c:otherwise>
                <%-- [컴포넌트 경계] TimelineList > TimelineItem > RecordCard 구조로 React에 대응합니다. --%>
                <ol class="record_timeline" data-component="TimelineList">
                    <c:forEach var="record" items="${records}">

                        <%-- 기록 유형 구분 --%>
                        <c:choose>
                            <c:when test="${record.goal != null}">
                                <c:set var="recordTypeValue" value="GOAL" />
                            </c:when>

                            <c:otherwise>
                                <c:set var="recordTypeValue" value="FREE" />
                            </c:otherwise>
                        </c:choose>

                        <li class="record_timeline_item"
                            data-component="TimelineItem"
                            data-record-id="${record.recordNum}"
                            data-record-type="${recordTypeValue}">
                            <div class="record_timeline_marker" aria-hidden="true"></div>

                            <%-- [접근성 개선] article 안의 실제 링크가 탐색을 담당해 가짜 링크 역할을 피합니다. --%>
                            <article class="record_card" data-component="RecordCard">
                                <div class="record_card_top">
                                    <c:choose>
                                        <c:when test="${record.goal != null}">
                                            <span class="record_type_badge goal_record">
                                                목표 연동 기록
                                            </span>
                                        </c:when>

                                        <c:otherwise>
                                            <span class="record_type_badge free_record">
                                                자유 기록
                                            </span>
                                        </c:otherwise>
                                    </c:choose>

                                    <time class="record_date"
                                          datetime="${fn:substring(record.createdAt, 0, 10)}">
                                        <c:out value="${fn:replace(fn:substring(record.createdAt, 0, 10), '-', '.')}" />
                                    </time>
                                </div>

                                <div class="record_card_body">
                                    <h3 class="record_title">
                                        <a href="${contextPath}/record/${record.recordNum}">
                                            <c:out value="${record.title}" />
                                        </a>
                                    </h3>

                                    <p class="record_preview">
                                        <c:out value="${record.content}" />
                                    </p>
                                </div>

                                <div class="record_card_bottom">
                                    <c:if test="${not empty record.difficulty}">
                                        <span class="record_difficulty difficulty_${record.difficulty}">
                                            <c:choose>
                                                <c:when test="${record.goal != null}">
                                                    난이도 · <c:out value="${record.difficulty}" />
                                                </c:when>

                                                <c:otherwise>
                                                    오늘 기분 · <c:out value="${record.difficulty}" />
                                                </c:otherwise>
                                            </c:choose>
                                        </span>
                                    </c:if>

                                    <a href="${contextPath}/record/${record.recordNum}"
                                       class="record_detail_link">
                                        기록 펼쳐보기
                                        <svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17">
                                            <path d="m9 18 6-6-6-6" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
                                        </svg>
                                    </a>
                                </div>

                            </article>
                        </li>
                    </c:forEach>
                </ol>

                <%-- 필터 결과 없음 --%>
                <div
                        class="record_filter_empty"
                        id="recordFilterEmpty"
                        hidden
                >
                    <div class="record_filter_empty_icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="30" height="30">
                            <path d="M4 5h16M7 12h10m-7 7h4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.8"/>
                        </svg>
                    </div>

                    <p>
                        선택한 유형의 성장 기록이 없어요.
                    </p>
                </div>

            </c:otherwise>
        </c:choose>

    </section>

</main>

<%-- 모든 서비스 페이지에서 동일한 공통 Footer를 사용합니다. --%>
<jsp:include page="/WEB-INF/views/common/footer.jsp" />

<script src="${contextPath}/js/common.js"></script>
<script src="${contextPath}/js/record.js"></script>
</body>
</html>
