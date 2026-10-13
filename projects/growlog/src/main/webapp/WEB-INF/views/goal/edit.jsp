<%@ page language="java"
         contentType="text/html; charset=UTF-8"
         pageEncoding="UTF-8" %>

<%@ taglib prefix="c" uri="jakarta.tags.core" %>

<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">

    <meta name="viewport"
          content="width=device-width, initial-scale=1.0">

    <title>목표 수정 | GrowLog</title>

    <link rel="stylesheet"
          href="${pageContext.request.contextPath}/css/common.css?v=20260731-1">

    <link rel="stylesheet"
          href="${pageContext.request.contextPath}/css/goal.css">
    <jsp:include page="/WEB-INF/views/common/responsive-styles.jsp" />
</head>

<body class="goal_page goal_edit_page">

<!-- ========================================
     Header
======================================== -->

<jsp:include page="/WEB-INF/views/common/header.jsp" />

<!-- ========================================
     Goal Edit Page
======================================== -->

<main class="goal_container">

    <section class="goal_write_hero goal_edit_hero">

        <!-- 왼쪽 안내 콘텐츠 -->
        <div class="goal_write_hero_content">

        <span class="goal_page_label">
            UPDATE GOAL
        </span>

            <h1>
                목표를 돌아보고<br>
                진행 상황을 기록해 볼까요?
            </h1>

            <p class="goal_write_hero_description">
                목표의 내용과 기간을 다듬고,<br>
                지금까지의 진행률과 상태를 업데이트해 보세요.
            </p>

            <div class="goal_write_hero_message">

            <span class="goal_write_message_icon">
                🌱
            </span>

                <span>
                작은 변화도 성장의 기록이 됩니다.
            </span>

            </div>

        </div>


        <!-- 오른쪽 그로비 이미지 -->
        <div class="goal_write_hero_character">

            <!-- 배경 장식 -->
            <span class="goal_write_deco deco_one"></span>
            <span class="goal_write_deco deco_two"></span>

            <img
                    src="${pageContext.request.contextPath}/images/goal_update_grobi.png"
                    alt="목표와 진행 상황을 업데이트하는 그로비"
                    class="goal_write_grobi_image goal_edit_grobi_image"
            >

        </div>

    </section>

    <!-- 수정 실패 메시지 -->
    <c:if test="${not empty errorMessage}">
        <div class="alert_message error">
                ${errorMessage}
        </div>
    </c:if>

    <!-- ========================================
     Goal Edit Content
======================================== -->

    <section class="goal_edit_content">

        <!-- 왼쪽 안내 패널 -->
        <aside class="goal_edit_guide">

        <span class="goal_edit_guide_label">
            UPDATE GUIDE
        </span>

            <h2>
                목표를 점검하고<br>
                진행 상황을 기록해 보세요.
            </h2>

            <div class="goal_edit_guide_list">

                <div class="goal_edit_guide_item">
                    <span>01</span>

                    <div>
                        <strong>목표 내용 점검</strong>
                        <p>지금의 상황에 맞게<br>
                            제목과 내용을 다듬어보세요.</p>
                    </div>
                </div>

                <div class="goal_edit_guide_item">
                    <span>02</span>

                    <div>
                        <strong>진행률 갱신</strong>
                        <p>현재까지 달성한 정도를<br>
                            숫자로 기록해보세요.</p>
                    </div>
                </div>

                <div class="goal_edit_guide_item">
                    <span>03</span>

                    <div>
                        <strong>상태 업데이트</strong>
                        <p>진행중, 완료, 중단 중 <br>
                            현재 상태를 선택해보세요.</p>
                    </div>
                </div>

            </div>

        </aside>


        <!-- 목표 등록 폼 -->
        <form
                action="${pageContext.request.contextPath}/goal/edit/${goal.goalNum}"
                method="post"
                class="goal_form_panel goal_edit_form"
        >
            <%-- Spring Security CSRF 검증용 토큰 --%>
            <input type="hidden"
                   name="${_csrf.parameterName}"
                   value="${_csrf.token}">


            <div class="goal_form_heading">

                <div>
                    <span>GOAL UPDATE</span>

                    <h2>목표 및 진행 상황 업데이트</h2>
                </div>

                <p>
                    <span class="required_mark">*</span>
                    표시는 필수 입력 항목입니다.
                </p>

            </div>


            <!-- 목표 제목과 카테고리 -->
            <div class="goal_edit_top_grid">

                <!-- 목표 제목 -->
                <div class="goal_form_group">

                    <label for="goalTitle">
                        목표 제목
                        <span class="required_mark">*</span>
                    </label>

                    <input
                            type="text"
                            id="goalTitle"
                            name="goalTitle"
                            value="${goal.goalTitle}"
                            maxlength="200"
                            required
                    >

                    <div class="goal_field_bottom">

                        <p class="goal_help_text">
                            목표를 한눈에 이해할 수 있도록 작성해 주세요.
                        </p>

                        <span class="goal_text_count">
                        0 / 200
                    </span>

                    </div>

                </div>


                <!-- 목표 카테고리 -->
                <div class="goal_form_group">

                    <label for="categoryNum">
                        목표 카테고리
                        <span class="required_mark">*</span>
                    </label>

                    <select
                            id="categoryNum"
                            name="categoryNum"
                            required
                    >
                        <c:forEach var="category"
                                   items="${categories}">

                            <option
                                    value="${category.categoryNum}"
                                ${goal.category.categoryNum eq category.categoryNum
                                        ? 'selected' : ''}
                            >
                                    ${category.categoryIcon}
                                    ${category.categoryName}
                            </option>

                        </c:forEach>
                    </select>

                    <p class="goal_help_text">
                        목표와 가장 가까운 카테고리를 골라주세요.
                    </p>

                </div>

            </div>


            <!-- 목표 내용 -->
            <div class="goal_form_group">

                <label for="goalContent">
                    목표 내용
                </label>

                <textarea
                        id="goalContent"
                        name="goalContent"
                        maxlength="2000"
                >${goal.goalContent}</textarea>

                <div class="goal_field_bottom">

                    <p class="goal_help_text">
                        실천 방법이나 목표를 세운 이유를 함께 적어도 좋아요.
                    </p>

                    <span class="goal_text_count">
                    0 / 2000
                </span>

                </div>

            </div>


            <!-- 시작일과 종료일 -->
            <div class="goal_date_grid">

                <div class="goal_form_group">

                    <label for="startDate">
                        시작일
                    </label>

                    <input
                            type="date"
                            id="startDate"
                            name="startDate"
                            value="${goal.startDate}"
                    >

                </div>

                <div class="goal_form_group">

                    <label for="endDate">
                        종료일
                    </label>

                    <input
                            type="date"
                            id="endDate"
                            name="endDate"
                            value="${goal.endDate}"
                    >

                </div>

            </div>

            <!-- ========================================
                진행률과 목표 상태
            ======================================== -->

            <div class="goal_date_grid">

                <!-- 목표 진행률 -->
                <div class="goal_form_group">

                    <label for="goalProgress">
                        목표 진행률
                        <span class="required_mark">*</span>
                    </label>

                    <input
                            type="number"
                            id="goalProgress"
                            name="goalProgress"
                            value="${goal.goalProgress}"
                            min="0"
                            max="100"
                            required
                    >

                    <p class="goal_help_text">
                        현재까지 달성한 정도를 0부터 100 사이로 입력해 주세요.
                    </p>

                </div>


                <!-- 목표 상태 -->
                <div class="goal_form_group">

                    <label for="goalStatus">
                        목표 상태
                        <span class="required_mark">*</span>
                    </label>

                    <select
                            id="goalStatus"
                            name="goalStatus"
                            required
                    >
                        <option
                                value="진행중"
                        ${goal.goalStatus eq '진행중'
                                ? 'selected' : ''}
                        >
                            진행중
                        </option>

                        <option
                                value="완료"
                        ${goal.goalStatus eq '완료'
                                ? 'selected' : ''}
                        >
                            완료
                        </option>

                        <option
                                value="중단"
                        ${goal.goalStatus eq '중단'
                                ? 'selected' : ''}
                        >
                            중단
                        </option>
                    </select>

                    <p class="goal_help_text">
                        현재 목표의 진행 상태를 선택해 주세요.
                    </p>

                </div>

            </div>


            <!-- 수정 및 취소 -->
            <div class="goal_form_actions">

                <a
                        href="${pageContext.request.contextPath}/goal/list"
                        class="goal_secondary_button"
                >
                    취소
                </a>

                <button
                        type="submit"
                        class="goal_primary_button"
                >
                    변경사항 저장
                </button>

            </div>

        </form>

    </section>

</main>

<%-- 모든 서비스 페이지에서 동일한 공통 Footer를 사용합니다. --%>
<jsp:include page="/WEB-INF/views/common/footer.jsp" />

<script
        src="${pageContext.request.contextPath}/js/common.js">
</script>

<script
        src="${pageContext.request.contextPath}/js/goal.js">
</script>

</body>
</html>
