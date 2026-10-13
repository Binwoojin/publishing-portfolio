<%@ page language="java"
         contentType="text/html; charset=UTF-8"
         pageEncoding="UTF-8" %>

<%@ taglib prefix="c" uri="jakarta.tags.core" %>

<%-- [React 전환 준비] 서버 계산값은 추후 GoalSummary props로 그대로 옮길 수 있습니다. --%>
<c:set var="activeGoalCount" value="0" />
<c:set var="completedGoalCount" value="0" />
<c:forEach var="summaryGoal" items="${goal}">
    <c:choose>
        <c:when test="${summaryGoal.goalStatus eq '완료'}">
            <c:set var="completedGoalCount" value="${completedGoalCount + 1}" />
        </c:when>
        <c:when test="${summaryGoal.goalStatus eq '중단'}">
            <%-- 중단 목표는 진행 중 요약에서 제외하고 상태 필터에서만 제공합니다. --%>
        </c:when>
        <c:otherwise>
            <c:set var="activeGoalCount" value="${activeGoalCount + 1}" />
        </c:otherwise>
    </c:choose>
</c:forEach>

<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">

    <meta name="viewport"
          content="width=device-width, initial-scale=1.0">

    <title>나의 목표 | GrowLog</title>

    <link rel="stylesheet"
          href="${pageContext.request.contextPath}/css/common.css?v=20260731-1">

    <link rel="stylesheet"
          href="${pageContext.request.contextPath}/css/goal.css?v=20260728-2">
    <jsp:include page="/WEB-INF/views/common/responsive-styles.jsp" />
</head>

<body class="goal_page">

<jsp:include page="/WEB-INF/views/common/header.jsp" />

<%-- [컴포넌트 경계] GoalPage 전체를 향후 React 마운트 루트로 사용합니다. --%>
<main class="goal_container"
      data-component="GoalPage"
      data-goal-count="${goal.size()}">

    <!-- ========================================
     Goal Page Header
======================================== -->

    <section class="goal_page_header">

        <!-- 헤더 왼쪽 콘텐츠 -->
        <div class="goal_header_content">

        <span class="goal_page_label">
            MY GOAL
        </span>

            <h1>
                오늘의 작은 실천이<br>
                내일의 성장을 만들어요.
            </h1>

            <p class="goal_header_description">
                이루고 싶은 모습을 목표로 구체화하고<br>
                나만의 속도로 채워가는 과정을 확인해 보세요.
            </p>

            <div class="goal_header_actions">

                <a
                        href="${pageContext.request.contextPath}/goal/write"
                        class="goal_primary_button"
                >
                    <svg class="goal_button_icon" aria-hidden="true"
                         viewBox="0 0 24 24" width="20" height="20">
                        <path d="M12 5v14M5 12h14" />
                    </svg>

                    새로운 목표 만들기
                </a>

                <span class="goal_header_hint">
                    <svg aria-hidden="true" viewBox="0 0 24 24"
                         width="17" height="17">
                        <path d="M12 21v-9m0 3c-4.5 0-7-2.5-7-7 4.5 0 7 2.5 7 7Zm0-3c0-4.5 2.5-7 7-7 0 4.5-2.5 7-7 7Z" />
                    </svg>
                    작은 목표부터 천천히 시작해 보세요
                </span>

            </div>

        </div>


        <!-- 헤더 오른쪽 캐릭터 영역 -->
        <div class="goal_header_character">

            <!-- 배경 장식 -->
            <span class="goal_deco_circle circle_one"></span>
            <span class="goal_deco_circle circle_two"></span>

            <img
                    src="${pageContext.request.contextPath}/images/goal_grobi.png"
                    alt="목표를 계획하는 그로비"
                    class="goal_grobi_image"
            >

        </div>

    </section>

    <c:if test="${not empty successMessage}">
        <div
                class="alert_message success"
                data-auto-close="3000"
        >
                ${successMessage}
        </div>
    </c:if>

    <c:if test="${not empty errorMessage}">
        <div
                class="alert_message error"
                data-auto-close="4000"
        >
                ${errorMessage}
        </div>
    </c:if>

    <%-- [컴포넌트 경계] 성장기록·타임라인과 동일한 요약 카드 계층입니다. --%>
    <section class="goal_summary" aria-label="목표 현황 요약" data-component="GoalSummary">
        <article class="goal_summary_card total">
            <span class="goal_summary_icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="25" height="25"><path d="M6 4h12v16H6zM9 9h6M9 13h6M9 17h4" /></svg>
            </span>
            <div>
                <span>전체 목표</span>
                <strong>${goal.size()}<small>개</small></strong>
                <p>지금까지 만든 성장 약속이에요</p>
            </div>
        </article>

        <article class="goal_summary_card active">
            <span class="goal_summary_icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="25" height="25"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>
            </span>
            <div>
                <span>진행 중</span>
                <strong>${activeGoalCount}<small>개</small></strong>
                <p>오늘 이어갈 수 있는 목표예요</p>
            </div>
        </article>

        <article class="goal_summary_card completed">
            <span class="goal_summary_icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="25" height="25"><path d="m5 12 4 4L19 6"/></svg>
            </span>
            <div>
                <span>완료한 목표</span>
                <strong>${completedGoalCount}<small>개</small></strong>
                <p>스스로 만들어낸 성장 순간이에요</p>
            </div>
        </article>
    </section>

    <section class="goal_list_panel" aria-labelledby="goalListTitle">

        <div class="goal_list_header">
            <div>
                <span class="goal_list_label">MY GOALS</span>
                <h2 id="goalListTitle">나의 목표 보드</h2>
                <p>현재 집중하고 있는 목표부터 완료한 목표까지 모아봤어요.</p>
            </div>

            <span class="goal_list_count" aria-live="polite">
                <span data-goal-filter-label>전체</span>
                <strong data-visible-goal-count>${goal.size()}</strong>개의 목표
            </span>
        </div>

        <%-- [상태 분리] 영문 enum을 유지해 React filter state로 쉽게 전환합니다. --%>
        <div class="goal_filter_toolbar">
            <div class="goal_filter_group" role="group" aria-label="목표 상태 필터">
                <button type="button" class="active"
                        data-goal-filter="ALL" data-filter-label="전체"
                        aria-pressed="true">전체</button>
                <button type="button"
                        data-goal-filter="ACTIVE" data-filter-label="진행 중"
                        aria-pressed="false">진행 중</button>
                <button type="button"
                        data-goal-filter="COMPLETED" data-filter-label="완료"
                        aria-pressed="false">완료</button>
                <button type="button"
                        data-goal-filter="PAUSED" data-filter-label="중단"
                        aria-pressed="false">중단</button>
            </div>

            <a href="${pageContext.request.contextPath}/goal/write"
               class="goal_toolbar_write">
                <svg aria-hidden="true" viewBox="0 0 24 24"
                     width="18" height="18">
                    <path d="M12 5v14M5 12h14" />
                </svg>
                새 목표
            </a>
        </div>

        <c:choose>

            <c:when test="${empty goal}">

                <div class="goal_empty">

                    <div class="goal_empty_icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="34" height="34">
                            <path d="M12 21v-9m0 3c-4.5 0-7-2.5-7-7 4.5 0 7 2.5 7 7Zm0-3c0-4.5 2.5-7 7-7 0 4.5-2.5 7-7 7Z" />
                        </svg>
                    </div>

                    <h2>아직 등록한 목표가 없어요</h2>

                    <p>
                        작은 목표부터 하나씩 등록해 보세요.<br>
                        GrowLog가 성장 과정을 함께 기록해 드릴게요.
                    </p>

                    <a
                            href="${pageContext.request.contextPath}/goal/write"
                            class="goal_primary_button"
                    >
                        첫 목표 만들기
                    </a>

                </div>

            </c:when>

            <c:otherwise>

                <!-- ========================================
                Goal Card List
                ======================================== -->

                <div class="goal_card_list">

                    <c:forEach var="goalItem"
                               items="${goal}">

                        <!-- ========================================
                        Goal Card
                        ======================================== -->

                        <article
                                class="goal_card"
                                tabindex="0"
                                role="button"
                                data-goal-card

                                data-goal-num="${goalItem.goalNum}"
                                data-goal-title="${goalItem.goalTitle}"
                                data-goal-content="${goalItem.goalContent}"
                                data-goal-progress="${goalItem.goalProgress}"
                                data-goal-status="${goalItem.goalStatus}"
                                data-goal-filter-status="${goalItem.goalStatus eq '완료' ? 'COMPLETED' : (goalItem.goalStatus eq '중단' ? 'PAUSED' : 'ACTIVE')}"

                                data-goal-category-name="${goalItem.category.categoryName}"
                                data-goal-category-color="${goalItem.category.categoryColor}"

                                data-goal-start-date="${goalItem.startDate}"
                                data-goal-end-date="${goalItem.endDate}"
                        >

                            <!-- 카드 상단: 카테고리와 진행률 -->
                            <div class="goal_card_header">

                                <!-- 목표 카테고리 -->
                                <span
                                        class="goal_category_badge"
                                        style="
                                                color: ${goalItem.category.categoryColor};
                                                background-color: ${goalItem.category.categoryColor}18;
                                                border-color: ${goalItem.category.categoryColor}40;
                                                "
                                >
                                    <span class="goal_category_icon" aria-hidden="true">
                                        <svg viewBox="0 0 24 24" width="15" height="15">
                                            <path d="M12 21v-9m0 3c-4.5 0-7-2.5-7-7 4.5 0 7 2.5 7 7Zm0-3c0-4.5 2.5-7 7-7 0 4.5-2.5 7-7 7Z" />
                                        </svg>
                                    </span>

                        <span>
                                ${goalItem.category.categoryName}
                        </span>
                    </span>

                                <!-- 목표 진행률 -->
                                <strong class="goal_progress_value">
                                        ${goalItem.goalProgress}%
                                </strong>

                            </div>


                            <!-- 카드 본문 -->
                            <div class="goal_card_body">

                                <div class="goal_title_area">

                                    <h3 class="goal_card_title">
                                            ${goalItem.goalTitle}
                                    </h3>

                                    <c:if test="${not empty goalItem.goalContent}">
                                        <p class="goal_description">
                                                ${goalItem.goalContent}
                                        </p>
                                    </c:if>

                                </div>

                                <!-- 목표 상태 -->
                                <c:choose>

                                    <c:when test="${goalItem.goalStatus eq '완료'}">
                            <span class="goal_status completed">
                                    ${goalItem.goalStatus}
                            </span>
                                    </c:when>

                                    <c:when test="${goalItem.goalStatus eq '중단'}">
                            <span class="goal_status paused">
                                    ${goalItem.goalStatus}
                            </span>
                                    </c:when>

                                    <c:otherwise>
                            <span class="goal_status">
                                    ${goalItem.goalStatus}
                            </span>
                                    </c:otherwise>

                                </c:choose>

                            </div>


                            <!-- 목표 진행률 막대 -->
                            <div
                                    class="goal_progress_bar"
                                    role="progressbar"
                                    aria-valuemin="0"
                                    aria-valuemax="100"
                                    aria-valuenow="${goalItem.goalProgress}"
                                    aria-label="${goalItem.goalTitle} 진행률"
                            >
                    <span
                            data-progress="${goalItem.goalProgress}"
                            style="
                                    background-color: ${goalItem.category.categoryColor};
                                    "
                    ></span>
                            </div>


                            <!-- 카드 하단 -->
                            <div class="goal_card_footer">

                                <!-- 날짜 정보 -->
                                <div class="goal_meta">

                                    <c:if test="${not empty goalItem.startDate}">
                            <span>
                                시작일 ${goalItem.startDate}
                            </span>
                                    </c:if>

                                    <c:if test="${not empty goalItem.endDate}">
                            <span>
                                종료일 ${goalItem.endDate}
                            </span>
                                    </c:if>

                                </div>


                                <!-- 수정 및 삭제 버튼 -->
                                <div class="goal_card_actions">

                                    <a
                                            href="${pageContext.request.contextPath}/goal/edit/${goalItem.goalNum}"
                                            class="goal_action_button edit"
                                    >
                                        수정
                                    </a>

                                    <form
                                            action="${pageContext.request.contextPath}/goal/delete/${goalItem.goalNum}"
                                            method="post"
                                            class="goal_delete_form"
                                    >
                                        <%-- Spring Security CSRF 검증용 토큰 --%>
                                        <input type="hidden"
                                               name="${_csrf.parameterName}"
                                               value="${_csrf.token}">

                                        <button
                                                type="submit"
                                                class="goal_action_button delete"
                                                data-confirm="이 목표를 정말 삭제하시겠습니까?"
                                        >
                                            삭제
                                        </button>
                                    </form>

                                </div>

                            </div>

                        </article>

                    </c:forEach>

                </div>

                <div class="goal_filter_empty" data-goal-filter-empty hidden>
                    <svg aria-hidden="true" viewBox="0 0 24 24"
                         width="34" height="34">
                        <path d="M4 5h16M7 12h10m-7 7h4" />
                    </svg>
                    <h3>선택한 상태의 목표가 없어요</h3>
                    <p>다른 필터를 선택하거나 새로운 목표를 만들어 보세요.</p>
                </div>

            </c:otherwise>

        </c:choose>

    </section>

</main>

<%-- 모든 서비스 페이지에서 동일한 공통 Footer를 사용합니다. --%>
<jsp:include page="/WEB-INF/views/common/footer.jsp" />

<!-- ========================================
     Goal Detail Modal
======================================== -->

<div
        class="goal_modal"
        id="goalDetailModal"
        data-context-path="${pageContext.request.contextPath}"
        aria-hidden="true"
        inert
>
    <!-- 모달 바깥 배경 -->
    <div
            class="goal_modal_backdrop"
            data-modal-close
    ></div>

    <!-- 모달 내용 -->
    <section
            class="goal_modal_content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="goalModalTitle"
    >

        <!-- 모달 닫기 버튼 -->
        <button
                type="button"
                class="goal_modal_close"
                data-modal-close
                aria-label="목표 상세 팝업 닫기"
        >
            ×
        </button>

        <!-- 카테고리 -->
        <div
                class="goal_modal_category"
                id="goalModalCategory"
        >
            <span id="goalModalCategoryIcon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <path d="M12 21v-9m0 3c-4.5 0-7-2.5-7-7 4.5 0 7 2.5 7 7Zm0-3c0-4.5 2.5-7 7-7 0 4.5-2.5 7-7 7Z" />
                </svg>
            </span>

            <span id="goalModalCategoryName"></span>
        </div>

        <!-- 제목 -->
        <h2
                class="goal_modal_title"
                id="goalModalTitle"
        ></h2>

        <!-- 내용 -->
        <p
                class="goal_modal_description"
                id="goalModalContent"
        ></p>

        <!-- 진행률 -->
        <div class="goal_modal_progress_header">

            <span>목표 진행률</span>

            <strong id="goalModalProgressText">
                0%
            </strong>

        </div>

        <div class="goal_modal_progress_bar">
            <span id="goalModalProgressBar"></span>
        </div>

        <!-- 상세 정보 -->
        <div class="goal_modal_info_grid">

            <div class="goal_modal_info_item">
                <span class="goal_modal_info_label">
                    목표 상태
                </span>

                <strong id="goalModalStatus"></strong>
            </div>

            <div class="goal_modal_info_item">
                <span class="goal_modal_info_label">
                    시작일
                </span>

                <strong id="goalModalStartDate"></strong>
            </div>

            <div class="goal_modal_info_item">
                <span class="goal_modal_info_label">
                    종료일
                </span>

                <strong id="goalModalEndDate"></strong>
            </div>

        </div>

        <!-- ========================================
             Modal Actions
        ======================================== -->

        <div class="goal_modal_actions">

            <!-- 삭제 -->
            <form
                    id="goalModalDeleteForm"
                    method="post"
                    class="goal_modal_delete_form"
            >
                <%-- JavaScript가 action만 변경하며 CSRF 토큰은 그대로 전송한다. --%>
                <input type="hidden"
                       name="${_csrf.parameterName}"
                       value="${_csrf.token}">

                <button
                        type="submit"
                        class="goal_modal_button delete"
                        data-confirm="이 목표를 정말 삭제하시겠습니까?"
                >
                    삭제하기
                </button>
            </form>

            <!-- 수정 -->
            <a
                    id="goalModalEditLink"
                    href="#"
                    class="goal_modal_button edit"
            >
                수정하기
            </a>

        </div>

    </section>

</div>



<script
        src="${pageContext.request.contextPath}/js/common.js">
</script>

<script
        src="${pageContext.request.contextPath}/js/goal.js?v=20260728-2">
</script>

</body>
</html>
