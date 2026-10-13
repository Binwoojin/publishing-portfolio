<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ page language="java"
         contentType="text/html; charset=UTF-8"
         pageEncoding="UTF-8" %>

<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">

    <meta name="viewport"
          content="width=device-width, initial-scale=1.0">

    <title>목표 등록 | GrowLog</title>

    <link rel="stylesheet"
          href="${pageContext.request.contextPath}/css/common.css?v=20260731-1">

    <link rel="stylesheet"
          href="${pageContext.request.contextPath}/css/goal.css">
    <jsp:include page="/WEB-INF/views/common/responsive-styles.jsp" />
</head>

<body class="goal_page goal_write_page">

<jsp:include page="/WEB-INF/views/common/header.jsp" />

<main class="goal_container">

    <!-- ========================================
     Goal Write Hero
======================================== -->

    <section class="goal_write_hero">

        <!-- 왼쪽 안내 콘텐츠 -->
        <div class="goal_write_hero_content">

        <span class="goal_page_label">
            NEW GOAL
        </span>

            <h1>
                새로운 목표를<br>
                심어볼까요?
            </h1>

            <p class="goal_write_hero_description">
                이루고 싶은 목표와 계획을 기록해 보세요.<br>
                오늘의 작은 시작이 내일의 성장으로 이어집니다.
            </p>

            <div class="goal_write_hero_message">
            <span class="goal_write_message_icon">
                🌱
            </span>

                <span>
                완벽하지 않아도 괜찮아요. 먼저 시작해 보세요!
            </span>
            </div>

        </div>


        <!-- 오른쪽 그로비 이미지 -->
        <div class="goal_write_hero_character">

            <span class="goal_write_deco deco_one"></span>
            <span class="goal_write_deco deco_two"></span>

            <img
                    src="${pageContext.request.contextPath}/images/goal_write_grobi.png"
                    alt="목표를 작성하는 그로비"
                    class="goal_write_grobi_image"
            >

        </div>

    </section>

    <c:if test="${not empty errorMessage}">
        <div
                class="alert_message error"
                data-auto-close="4000"
        >
                ${errorMessage}
        </div>
    </c:if>

    <!-- ========================================
     Goal Write Content
======================================== -->

    <section class="goal_write_content">

        <!-- 왼쪽 안내 패널 -->
        <aside class="goal_write_guide">

        <span class="goal_write_guide_label">
            GOAL GUIDE
        </span>

            <h2>
                목표를 조금 더<br>
                구체적으로 작성해 보세요.
            </h2>

            <div class="goal_write_guide_list">

                <div class="goal_write_guide_item">
                    <span>01</span>

                    <div>
                        <strong>분명한 제목</strong>
                        <p>짧고 이해하기 쉬운 <br>
                            목표 제목을 작성해보세요.</p>
                    </div>
                </div>

                <div class="goal_write_guide_item">
                    <span>02</span>

                    <div>
                        <strong>실행할 계획</strong>
                        <p>목표를 이루기 위해 <br>
                            무엇을 할지 적어보세요.</p>
                    </div>
                </div>

                <div class="goal_write_guide_item">
                    <span>03</span>

                    <div>
                        <strong>적당한 기간</strong>
                        <p>부담스럽지 않은 <br>
                            기간을 정해보세요.</p>
                    </div>
                </div>

            </div>

        </aside>


        <!-- 목표 등록 폼 -->
        <form
                action="${pageContext.request.contextPath}/goal/write"
                method="post"
                class="goal_form_panel goal_write_form"
        >
            <%-- Spring Security CSRF 검증용 토큰 --%>
            <input type="hidden"
                   name="${_csrf.parameterName}"
                   value="${_csrf.token}">


            <div class="goal_form_heading">

                <div>
                    <span>GOAL INFORMATION</span>

                    <h2>목표 정보 입력</h2>
                </div>

                <p>
                    <span class="required_mark">*</span>
                    표시는 필수 입력 항목입니다.
                </p>

            </div>


            <!-- 목표 제목과 카테고리 -->
            <div class="goal_write_top_grid">

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
                            maxlength="200"
                            placeholder="예: GrowLog 프로젝트 완성하기"
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
                        <option value="">
                            카테고리를 선택해 주세요.
                        </option>

                        <c:forEach var="category"
                                   items="${categories}">

                            <option value="${category.categoryNum}">
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
                        placeholder="목표를 이루기 위해 어떤 계획을 세웠는지 작성해 주세요."
                ></textarea>

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
                    >

                </div>

            </div>


            <!-- 등록 및 취소 -->
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
                    목표 등록
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
