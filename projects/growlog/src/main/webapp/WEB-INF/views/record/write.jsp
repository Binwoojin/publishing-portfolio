<%@ page contentType="text/html;charset=UTF-8" language="java" %>

<%@ taglib prefix="c"
           uri="jakarta.tags.core" %>

<c:set
        var="contextPath"
        value="${pageContext.request.contextPath}"
/>

<!DOCTYPE html>
<html lang="ko">

<head>

    <meta charset="UTF-8">

    <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
    >

    <title>성장 기록 작성 | GrowLog</title>

    <!-- 공통 CSS -->
    <link
            rel="stylesheet"
            href="${contextPath}/css/common.css?v=20260731-1"
    >

    <!-- 성장 기록 작성 CSS -->
    <link
            rel="stylesheet"
            href="${contextPath}/css/record.css?v=20260728-2"
    >

    <jsp:include page="/WEB-INF/views/common/responsive-styles.jsp" />
</head>

<body>

<!-- ========================================
     Header
======================================== -->

<jsp:include page="/WEB-INF/views/common/header.jsp" />


<!-- ========================================
     Main
======================================== -->

<main class="record_write_page">

    <!-- ========================================
         Record Write Hero
    ======================================== -->

    <section class="record_write_hero">

        <!-- Hero 텍스트 -->
        <div class="record_write_hero_text">

            <span class="record_write_hero_label">
                DAILY RECORD
            </span>

            <h1 class="record_write_hero_title">
                오늘의 경험을<br>
                성장의 기록으로 남겨볼까요?
            </h1>

            <p class="record_write_hero_description">
                작은 배움과 감정도 차곡차곡 기록하면<br>
                나만의 성장 과정이 됩니다.
            </p>

            <p class="record_write_hero_message">
                🌱 오늘의 한 줄도 충분한 시작이에요.
            </p>

        </div>

        <!-- Hero 이미지 -->
        <div class="record_write_hero_visual">

            <div class="record_write_hero_circle circle_one"></div>

            <div class="record_write_hero_circle circle_two"></div>

            <img
                    src="${contextPath}/images/goal_write_grobi.png"
                    alt="성장 기록을 작성하는 그로비"
                    class="record_write_grobi"
            >

        </div>

    </section>


    <!-- ========================================
         Record Write Content
    ======================================== -->

    <section class="record_write_content">

        <!-- ========================================
             Write Guide
        ======================================== -->

        <aside class="record_write_guide">

            <div class="record_write_guide_heading">

                <span class="record_write_guide_label">
                    RECORD GUIDE
                </span>

                <h2>
                    오늘의 기록을<br>
                    천천히 남겨보세요.
                </h2>

                <p>
                    모든 내용을 길게 작성하지 않아도 괜찮아요.<br>
                    기억하고 싶은 부분부터 적어보세요.
                </p>

            </div>


            <!-- 가이드 01 -->
            <article class="record_write_guide_item">

                <span class="record_write_guide_number">
                    01
                </span>

                <div>
                    <strong>
                        오늘의 이야기
                    </strong>

                    <p>
                        기억하고 싶은 경험이나<br>
                        하루의 생각을 적어보세요.
                    </p>
                </div>

            </article>


            <!-- 가이드 02 -->
            <article class="record_write_guide_item">

                <span class="record_write_guide_number">
                    02
                </span>

                <div>
                    <strong>
                        배움과 해결
                    </strong>

                    <p>
                        새롭게 배운 점과<br>
                        해결한 과정을 남겨보세요.
                    </p>
                </div>

            </article>


            <!-- 가이드 03 -->
            <article class="record_write_guide_item">

                <span class="record_write_guide_number">
                    03
                </span>

                <div>
                    <strong>
                        작은 회고
                    </strong>

                    <p>
                        오늘의 감정과 생각을<br>
                        짧게 돌아보세요.
                    </p>
                </div>

            </article>

        </aside>


        <!-- ========================================
             Write Form
        ======================================== -->

        <section class="record_write_form_panel">

            <!-- 폼 제목 -->
            <div class="record_write_form_heading">

                <span class="record_write_form_label">
                    RECORD WRITE
                </span>

                <h2>
                    오늘의 성장 기록 작성
                </h2>

                <p>
                    목표와 연결하거나 자유로운 일기 형태로 기록할 수 있어요.
                </p>

            </div>


            <!-- 성장 기록 등록 폼 -->
            <form
                    action="${contextPath}/record/write"
                    method="post"
                    enctype="multipart/form-data"
                    class="record_write_form"
                    id="recordWriteForm"
            >
                <%-- Spring Security CSRF 검증용 토큰 --%>
                <input type="hidden"
                       name="${_csrf.parameterName}"
                       value="${_csrf.token}">

                <!-- ========================================
                     기록 유형
                ======================================== -->

                <fieldset class="record_form_group record_type_group">

                    <legend class="record_form_label">
                        기록 유형
                    </legend>

                    <div class="record_type_options">

                        <!-- 자유 기록 -->
                        <label class="record_type_option active">

                            <input
                                    type="radio"
                                    name="recordType"
                                    value="FREE"
                                    checked
                            >

                            <span class="record_type_icon">
                                🌱
                            </span>

                            <span class="record_type_text">

                                <strong>
                                    자유 기록
                                </strong>

                                <small>
                                    오늘의 생각과 감정을 자유롭게 기록해요.
                                </small>

                            </span>

                        </label>


                        <!-- 목표 연결 기록 -->
                        <label class="record_type_option">

                            <input
                                    type="radio"
                                    name="recordType"
                                    value="GOAL"
                            >

                            <span class="record_type_icon">
                                🎯
                            </span>

                            <span class="record_type_text">

                                <strong>
                                    목표 연결 기록
                                </strong>

                                <small>
                                    진행 중인 목표의 성장 과정을 기록해요.
                                </small>

                            </span>

                        </label>

                    </div>

                </fieldset>


                <!-- ========================================
                     연결할 목표
                ======================================== -->

                <div
                        class="record_form_group goal_select_group"
                        id="goalSelectGroup"
                        hidden
                >

                    <label
                            for="goalNum"
                            class="record_form_label"
                    >
                        연결할 목표
                    </label>

                    <select
                            id="goalNum"
                            name="goalNum"
                            class="record_form_select"
                    >

                        <option value="">
                            목표를 선택해 주세요.
                        </option>

                        <c:forEach
                                var="goalItem"
                                items="${goals}"
                        >

                            <option value="${goalItem.goalNum}">
                                    ${goalItem.goalTitle}
                            </option>

                        </c:forEach>

                    </select>

                    <p class="record_form_help">
                        이 기록과 관련된 목표를 선택해 주세요.
                    </p>

                </div>


                <!-- ========================================
                     제목
                ======================================== -->

                <div class="record_form_group">

                    <label
                            for="title"
                            class="record_form_label"
                    >
                        기록 제목
                    </label>

                    <input
                            type="text"
                            id="title"
                            name="title"
                            class="record_form_input"
                            maxlength="200"
                            placeholder="오늘의 기록 제목을 입력해 주세요."
                            required
                    >

                </div>


                <!-- ========================================
                     오늘의 기록
                ======================================== -->

                <div class="record_form_group">

                    <label
                            for="content"
                            class="record_form_label"
                    >
                        오늘의 기록
                    </label>

                    <textarea
                            id="content"
                            name="content"
                            class="record_form_textarea record_content_textarea"
                            placeholder="오늘 있었던 일이나 기억하고 싶은 생각을 적어보세요."
                            required
                    ></textarea>

                </div>

                <!-- ========================================
     미디어 첨부
======================================== -->

                <section class="record_form_group record_media_group">

                    <!-- 미디어 영역 제목 -->
                    <div class="record_media_heading">

                        <div>
                            <h3 class="record_form_label">
                                사진 및 영상
                            </h3>

                            <p class="record_form_help">
                                오늘의 기록과 함께 남기고 싶은 사진이나 YouTube 영상을 추가해 보세요.
                            </p>
                        </div>

                        <span class="record_optional_badge">
            선택
        </span>

                    </div>


                    <!-- ========================================
                         이미지 첨부
                    ======================================== -->

                    <div class="record_media_item">

                        <label
                                for="imageFiles"
                                class="record_media_item_label"
                        >
                            <%-- 운영체제별 이모지 차이 없이 표시되는 사진 첨부 아이콘입니다. --%>
                            <span class="record_media_icon" aria-hidden="true">
                                <svg viewBox="0 0 24 24" fill="none">
                                    <path d="M4 7.5h3l1.4-2h7.2l1.4 2h3v11H4v-11Z"
                                          stroke="currentColor" stroke-width="1.8"
                                          stroke-linejoin="round"/>
                                    <circle cx="12" cy="13" r="3.5"
                                            stroke="currentColor" stroke-width="1.8"/>
                                </svg>
                            </span>

                            <span>
                <strong>
                    사진 추가
                </strong>

                <small>
                    성장 과정이나 기억하고 싶은 순간을 사진으로 남겨보세요.
                </small>
            </span>
                        </label>

                        <input
                                type="file"
                                id="imageFiles"
                                name="imageFiles"
                                class="record_media_file_input"
                                accept="image/jpeg, image/png, image/webp"
                                multiple
                        >

                        <p class="record_form_help">
                            JPG, PNG, WEBP 형식의 이미지를 여러 장 선택할 수 있어요.
                        </p>


                        <!--
                            JavaScript에서 선택한 이미지의 미리보기를 출력할 영역이다.
                            이미지가 선택되지 않은 상태에서는 비어 있게 된다.
                        -->
                        <div
                                class="record_image_preview_list"
                                id="imagePreviewList"
                        ></div>

                    </div>


                    <!-- ========================================
                         YouTube 영상 첨부
                    ======================================== -->

                    <div class="record_media_item">

                        <label
                                for="youtubeUrl"
                                class="record_media_item_label"
                        >
                            <%-- URL 입력 기능을 직관적으로 나타내는 영상 재생 아이콘입니다. --%>
                            <span class="record_media_icon" aria-hidden="true">
                                <svg viewBox="0 0 24 24" fill="none">
                                    <rect x="3.5" y="5" width="17" height="14" rx="3"
                                          stroke="currentColor" stroke-width="1.8"/>
                                    <path d="m10 9 5 3-5 3V9Z"
                                          fill="currentColor"/>
                                </svg>
                            </span>

                            <span>
                <strong>
                    YouTube 영상 추가
                </strong>

                <small>
                    기록과 관련된 강의, 음악, 참고 영상을 연결할 수 있어요.
                </small>
            </span>
                        </label>

                        <input
                                type="url"
                                id="youtubeUrl"
                                name="youtubeUrl"
                                class="record_form_input"
                                maxlength="500"
                                placeholder="https://www.youtube.com/watch?v=..."
                        >

                        <p class="record_form_help">
                            일반 영상, 단축 주소, Shorts 주소를 입력할 수 있어요.
                        </p>

                    </div>

                </section>



                <!-- ========================================
                     오늘 배운 점
                ======================================== -->

                <div class="record_form_group">

                    <label
                            for="todayLearning"
                            class="record_form_label"
                    >
                        오늘 배운 점
                    </label>

                    <textarea
                            id="todayLearning"
                            name="todayLearning"
                            class="record_form_textarea"
                            placeholder="새롭게 알게 된 점이나 배운 내용을 적어보세요."
                    ></textarea>

                </div>


                <!-- ========================================
                     난이도 / 오늘의 기분
                ======================================== -->

                <fieldset class="record_form_group">

                    <legend
                            class="record_form_label"
                            id="conditionLabel"
                    >
                        오늘의 기분
                    </legend>

                    <div class="record_condition_options">

                        <label class="record_condition_option">

                            <input
                                    type="radio"
                                    name="difficulty"
                                    value="EASY"
                            >

                            <span class="record_condition_emoji">
                                😊
                            </span>

                            <strong
                                    class="record_condition_text"
                                    data-free-text="좋은 하루"
                                    data-goal-text="쉬움"
                            >
                                좋은 하루
                            </strong>

                        </label>


                        <label class="record_condition_option">

                            <input
                                    type="radio"
                                    name="difficulty"
                                    value="NORMAL"
                                    checked
                            >

                            <span class="record_condition_emoji">
                                🙂
                            </span>

                            <strong
                                    class="record_condition_text"
                                    data-free-text="보통"
                                    data-goal-text="보통"
                            >
                                보통
                            </strong>

                        </label>


                        <label class="record_condition_option">

                            <input
                                    type="radio"
                                    name="difficulty"
                                    value="HARD"
                            >

                            <span class="record_condition_emoji">
                                😥
                            </span>

                            <strong
                                    class="record_condition_text"
                                    data-free-text="힘든 하루"
                                    data-goal-text="어려움"
                            >
                                힘든 하루
                            </strong>

                        </label>

                    </div>

                </fieldset>


                <!-- ========================================
                     문제 해결 과정
                ======================================== -->

                <div class="record_form_group">

                    <label
                            for="solution"
                            class="record_form_label"
                    >
                        문제 해결 과정
                    </label>

                    <textarea
                            id="solution"
                            name="solution"
                            class="record_form_textarea"
                            placeholder="문제가 있었다면 어떻게 해결했는지 적어보세요."
                    ></textarea>

                </div>


                <!-- ========================================
                     오늘의 회고
                ======================================== -->

                <div class="record_form_group">

                    <label
                            for="retrospective"
                            class="record_form_label"
                    >
                        오늘의 회고
                    </label>

                    <textarea
                            id="retrospective"
                            name="retrospective"
                            class="record_form_textarea"
                            placeholder="오늘을 돌아보며 남기고 싶은 생각을 적어보세요."
                    ></textarea>

                </div>


                <!-- ========================================
                     Form Actions
                ======================================== -->

                <div class="record_form_actions">

                    <a
                            href="${contextPath}/record/list"
                            class="record_form_button cancel"
                    >
                        취소
                    </a>

                    <button
                            type="submit"
                            class="record_form_button submit"
                    >
                        기록 저장
                    </button>

                </div>

            </form>

        </section>

    </section>

</main>

<%-- 모든 서비스 페이지에서 동일한 공통 Footer를 사용합니다. --%>
<jsp:include page="/WEB-INF/views/common/footer.jsp" />


<!-- ========================================
     JavaScript
======================================== -->

<script
        src="${contextPath}/js/common.js"
></script>

<script
        src="${contextPath}/js/record.js"
></script>

</body>

</html>
