<%@ page contentType="text/html;charset=UTF-8" language="java" %>

<%@ taglib prefix="c" uri="jakarta.tags.core" %>

<%-- 애플리케이션 Context Path 설정 --%>
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

    <title>성장 기록 수정 | GrowLog</title>

    <%-- 공통 CSS --%>
    <link
            rel="stylesheet"
            href="${contextPath}/css/common.css?v=20260731-1"
    >

    <%-- 성장 기록 CSS --%>
    <link
            rel="stylesheet"
            href="${contextPath}/css/record.css"
    >
    <jsp:include page="/WEB-INF/views/common/responsive-styles.jsp" />
</head>

<body>

<%-- 공통 헤더 --%>
<jsp:include page="/WEB-INF/views/common/header.jsp" />


<main class="record_write_page">

    <%-- ========================================
         성장 기록 수정 Hero
    ======================================== --%>
    <section class="record_write_hero">

        <%-- Hero 왼쪽 문구 --%>
        <div class="record_write_hero_text">

            <span class="record_write_hero_label">
                EDIT RECORD
            </span>

            <h1 class="record_write_hero_title">
                지난 기록을 다시 살펴보고<br>
                더 선명하게 다듬어보세요.
            </h1>

            <p class="record_write_hero_description">
                경험과 생각이 달라졌다면 내용을 수정하고,<br>
                목표와의 연결도 다시 설정할 수 있어요.
            </p>

            <p class="record_write_hero_message">
                기록은 언제든 다시 정리할 수 있어요 🌱
            </p>

        </div>


        <%-- Hero 오른쪽 캐릭터 영역 --%>
        <div class="record_write_hero_visual">

            <%-- 배경 장식 원 --%>
            <span
                    class="record_write_hero_circle circle_one"
                    aria-hidden="true"
            ></span>

            <span
                    class="record_write_hero_circle circle_two"
                    aria-hidden="true"
            ></span>

            <%-- 성장 기록 수정 캐릭터 이미지 --%>
            <img
                    src="${contextPath}/images/record_grobi.png"
                    alt="성장 기록을 확인하는 그로비"
                    class="record_write_grobi"
            >

        </div>

    </section>


    <%-- ========================================
         성장 기록 수정 본문
    ======================================== --%>
    <section class="record_write_content">

        <%-- 왼쪽 작성 안내 영역 --%>
        <aside class="record_write_guide">

            <div class="record_write_guide_heading">

                <span class="record_write_guide_label">
                    EDIT GUIDE
                </span>

                <h2>
                    기록을 다시<br>
                    정리해보세요.
                </h2>

                <p>
                    달라진 생각이나 추가된 경험이 있다면<br>
                    자유롭게 수정해도 괜찮아요.
                </p>

            </div>


            <%-- 수정 안내 1 --%>
            <div class="record_write_guide_item">

                <span class="record_write_guide_number">
                    01
                </span>

                <div>
                    <strong>기록 유형 확인</strong>

                    <p>
                        자유 기록인지 목표 기록인지<br>
                        다시 확인해보세요.
                    </p>
                </div>

            </div>


            <%-- 수정 안내 2 --%>
            <div class="record_write_guide_item">

                <span class="record_write_guide_number">
                    02
                </span>

                <div>
                    <strong>내용 보완하기</strong>

                    <p>
                        빠진 내용이나 달라진 생각을<br>
                        자연스럽게 추가해보세요.
                    </p>
                </div>

            </div>


            <%-- 수정 안내 3 --%>
            <div class="record_write_guide_item">

                <span class="record_write_guide_number">
                    03
                </span>

                <div>
                    <strong>회고 다시 정리하기</strong>

                    <p>
                        지금의 시선으로 최종 회고를<br>
                        다시 작성해도 좋아요.
                    </p>
                </div>

            </div>

        </aside>


        <%-- ========================================
             수정 폼 패널
        ======================================== --%>
        <section class="record_write_form_panel">

            <%-- 수정 폼 제목 --%>
            <div class="record_write_form_heading">

                <span class="record_write_form_label">
                    EDIT FORM
                </span>

                <h2>성장 기록 수정</h2>

                <p>
                    기존 내용을 확인한 후 필요한 부분을 수정해 주세요.
                </p>

            </div>


            <%-- ========================================
                 성장 기록 수정 Form
            ======================================== --%>
            <form
                    id="recordWriteForm"
                    class="record_write_form"
                    action="${contextPath}/record/${record.recordNum}/edit"
                    method="post"
                    enctype="multipart/form-data"
            >
                <%-- Spring Security CSRF 검증용 토큰 --%>
                <input type="hidden"
                       name="${_csrf.parameterName}"
                       value="${_csrf.token}">

                <%-- ========================================
                     기록 유형 선택
                ======================================== --%>
                <fieldset class="record_form_group">

                    <legend class="record_form_label">
                        기록 유형
                    </legend>

                    <div class="record_type_options">

                        <%-- 자유 기록 선택 --%>
                        <label
                                class="record_type_option
                                ${record.goal == null ? 'active' : ''}"
                        >
                            <input
                                    type="radio"
                                    name="recordType"
                                    value="FREE"
                            <c:if test="${record.goal == null}">
                                    checked
                            </c:if>
                            >

                            <span
                                    class="record_type_icon"
                                    aria-hidden="true"
                            >
                                📝
                            </span>

                            <span class="record_type_text">
                                <strong>자유 기록</strong>

                                <small>
                                    오늘의 경험과 감정을 자유롭게 기록해요.
                                </small>
                            </span>
                        </label>


                        <%-- 목표 연동 기록 선택 --%>
                        <label
                                class="record_type_option
                                ${record.goal != null ? 'active' : ''}"
                        >
                            <input
                                    type="radio"
                                    name="recordType"
                                    value="GOAL"
                            <c:if test="${record.goal != null}">
                                    checked
                            </c:if>
                            >

                            <span
                                    class="record_type_icon"
                                    aria-hidden="true"
                            >
                                🎯
                            </span>

                            <span class="record_type_text">
                                <strong>목표 연동 기록</strong>

                                <small>
                                    진행 중인 목표와 연결해 기록해요.
                                </small>
                            </span>
                        </label>

                    </div>

                </fieldset>


                <%-- ========================================
                     연결할 목표 선택
                ======================================== --%>
                <div
                        id="goalSelectGroup"
                        class="record_form_group goal_select_group"
                        <c:if test="${record.goal == null}">
                            hidden
                        </c:if>
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

                        <%-- 로그인 회원의 목표 목록 출력 --%>
                        <c:forEach
                                var="goal"
                                items="${goals}"
                        >
                            <option
                                    value="${goal.goalNum}"
                                    <c:if test="${record.goal != null
                                        && record.goal.goalNum == goal.goalNum}">
                                        selected
                                    </c:if>
                            >
                                <c:out value="${goal.goalTitle}" />
                            </option>
                        </c:forEach>

                    </select>

                    <p class="record_form_help">
                        목표 연동 기록을 선택한 경우 목표를 선택해 주세요.
                    </p>

                </div>


                <%-- ========================================
                     성장 기록 제목
                ======================================== --%>
                <div class="record_form_group">

                    <label
                            for="title"
                            class="record_form_label"
                    >
                        제목
                    </label>

                    <input
                            type="text"
                            id="title"
                            name="title"
                            class="record_form_input"
                            value="<c:out value='${record.title}' />"
                            maxlength="200"
                            placeholder="성장 기록의 제목을 입력해 주세요."
                            required
                    >

                </div>


                <%-- ========================================
                     성장 기록 본문
                ======================================== --%>
                <div class="record_form_group">

                    <label
                            for="content"
                            class="record_form_label"
                    >
                        성장 기록
                    </label>

                    <textarea
                            id="content"
                            name="content"
                            class="record_form_textarea record_content_textarea"
                            placeholder="오늘 경험한 일과 생각을 기록해 주세요."
                            required
                    ><c:out value="${record.content}" /></textarea>

                </div>

                <section class="record_form_group record_media_group">
                    <div class="record_media_heading">
                        <div>
                            <h3 class="record_form_label">사진 및 영상</h3>
                            <p class="record_form_help">
                                삭제할 기존 첨부를 선택한 뒤 새 사진이나 YouTube 영상을 추가할 수 있습니다.
                            </p>
                        </div>
                        <span class="record_optional_badge">선택</span>
                    </div>

                    <c:if test="${not empty mediaList}">
                        <div class="record_existing_media">
                            <strong class="record_existing_media_title">현재 첨부</strong>
                            <div class="record_existing_media_grid">
                                <c:forEach var="media" items="${mediaList}" varStatus="status">
                                    <div class="record_existing_media_item"
                                         data-existing-media-item
                                         data-media-type="${media.mediaType}">
                                    <c:choose>
                                        <c:when test="${media.mediaType eq 'IMAGE'}">
                                            <img
                                                    src="${media.mediaUrl}"
                                                    alt="기존 첨부 사진 ${status.count}"
                                                    loading="lazy"
                                            >
                                        </c:when>
                                        <c:when test="${media.mediaType eq 'YOUTUBE'}">
                                            <iframe
                                                    src="${media.mediaUrl}"
                                                    title="기존 YouTube 영상 ${status.count}"
                                                    loading="lazy"
                                                    allowfullscreen
                                            ></iframe>
                                        </c:when>
                                    </c:choose>
                                        <label class="record_media_delete_toggle">
                                            <input
                                                    type="checkbox"
                                                    name="deleteMediaNums"
                                                    value="${media.mediaNum}"
                                                    data-delete-media
                                            >
                                            <span class="record_media_delete_icon" aria-hidden="true">
                                                <svg viewBox="0 0 24 24" fill="none">
                                                    <path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5m4-5v5"
                                                          stroke="currentColor" stroke-width="1.8"
                                                          stroke-linecap="round" stroke-linejoin="round"/>
                                                </svg>
                                            </span>
                                            <span data-delete-label>삭제</span>
                                        </label>
                                    </div>
                                </c:forEach>
                            </div>
                        </div>
                    </c:if>

                    <div class="record_media_item">
                        <label for="imageFiles" class="record_media_item_label">
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
                                <strong>사진 추가</strong>
                                <small>기존 사진을 포함해 최대 5장까지 등록할 수 있습니다.</small>
                            </span>
                        </label>

                        <input
                                type="file"
                                id="imageFiles"
                                name="imageFiles"
                                class="record_media_file_input"
                                accept="image/jpeg, image/png, image/webp"
                                data-existing-image-count="${existingImageCount}"
                                data-max-image-count="5"
                                multiple
                        >
                        <p class="record_form_help">
                            <span data-current-image-count>${existingImageCount}</span>장 유지 예정 · JPG, PNG, WEBP 지원
                        </p>
                        <div class="record_image_preview_list" id="imagePreviewList"></div>
                    </div>

                    <div class="record_media_item">
                        <label for="youtubeUrl" class="record_media_item_label">
                            <span class="record_media_icon" aria-hidden="true">
                                <svg viewBox="0 0 24 24" fill="none">
                                    <rect x="3.5" y="5" width="17" height="14" rx="3"
                                          stroke="currentColor" stroke-width="1.8"/>
                                    <path d="m10 9 5 3-5 3V9Z" fill="currentColor"/>
                                </svg>
                            </span>
                            <span>
                                <strong>YouTube 영상 추가</strong>
                                <small>일반 영상, 단축 주소, Shorts 주소를 입력할 수 있습니다.</small>
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
                    </div>
                </section>


                <%-- ========================================
                     오늘 배운 내용
                ======================================== --%>
                <div class="record_form_group">

                    <label
                            for="todayLearning"
                            class="record_form_label"
                    >
                        오늘 배운 내용
                    </label>

                    <textarea
                            id="todayLearning"
                            name="todayLearning"
                            class="record_form_textarea"
                            placeholder="오늘 새롭게 배운 내용을 작성해 주세요."
                    ><c:out value="${record.todayLearning}" /></textarea>

                </div>


                <%-- ========================================
                     오늘의 기분 / 체감 난이도
                ======================================== --%>
                <fieldset class="record_form_group">

                    <legend
                            id="conditionLabel"
                            class="record_form_label"
                    >
                        <c:choose>
                            <c:when test="${record.goal != null}">
                                체감 난이도
                            </c:when>

                            <c:otherwise>
                                오늘의 기분
                            </c:otherwise>
                        </c:choose>
                    </legend>


                    <div class="record_condition_options">

                        <%-- EASY 상태 --%>
                        <label class="record_condition_option">

                            <input
                                    type="radio"
                                    name="difficulty"
                                    value="EASY"
                            <c:if test="${record.difficulty eq 'EASY'}">
                                    checked
                            </c:if>
                            >

                            <span
                                    class="record_condition_emoji"
                                    aria-hidden="true"
                            >
                                😊
                            </span>

                            <span
                                    class="record_condition_text"
                                    data-free-text="좋은 하루"
                                    data-goal-text="쉬움"
                            >
                                <c:choose>
                                    <c:when test="${record.goal != null}">
                                        쉬움
                                    </c:when>

                                    <c:otherwise>
                                        좋은 하루
                                    </c:otherwise>
                                </c:choose>
                            </span>

                        </label>


                        <%-- NORMAL 상태 --%>
                        <label class="record_condition_option">

                            <input
                                    type="radio"
                                    name="difficulty"
                                    value="NORMAL"
                            <c:if test="${record.difficulty eq 'NORMAL'}">
                                    checked
                            </c:if>
                            >

                            <span
                                    class="record_condition_emoji"
                                    aria-hidden="true"
                            >
                                🙂
                            </span>

                            <span
                                    class="record_condition_text"
                                    data-free-text="보통"
                                    data-goal-text="보통"
                            >
                                보통
                            </span>

                        </label>


                        <%-- HARD 상태 --%>
                        <label class="record_condition_option">

                            <input
                                    type="radio"
                                    name="difficulty"
                                    value="HARD"
                            <c:if test="${record.difficulty eq 'HARD'}">
                                    checked
                            </c:if>
                            >

                            <span
                                    class="record_condition_emoji"
                                    aria-hidden="true"
                            >
                                😥
                            </span>

                            <span
                                    class="record_condition_text"
                                    data-free-text="힘든 하루"
                                    data-goal-text="어려움"
                            >
                                <c:choose>
                                    <c:when test="${record.goal != null}">
                                        어려움
                                    </c:when>

                                    <c:otherwise>
                                        힘든 하루
                                    </c:otherwise>
                                </c:choose>
                            </span>

                        </label>

                    </div>

                </fieldset>


                <%-- ========================================
                     문제 해결 과정
                ======================================== --%>
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
                            placeholder="문제를 어떻게 해결했는지 작성해 주세요."
                    ><c:out value="${record.solution}" /></textarea>

                </div>


                <%-- ========================================
                     최종 회고
                ======================================== --%>
                <div class="record_form_group">

                    <label
                            for="retrospective"
                            class="record_form_label"
                    >
                        최종 회고
                    </label>

                    <textarea
                            id="retrospective"
                            name="retrospective"
                            class="record_form_textarea"
                            placeholder="이번 경험을 통해 느낀 점을 작성해 주세요."
                    ><c:out value="${record.retrospective}" /></textarea>

                </div>


                <%-- ========================================
                     수정 폼 하단 버튼
                ======================================== --%>
                <div class="record_form_actions">

                    <%-- 상세 페이지로 돌아가기 --%>
                    <a
                            href="${contextPath}/record/${record.recordNum}"
                            class="record_form_button cancel"
                    >
                        취소
                    </a>

                    <%-- 성장 기록 수정 제출 --%>
                    <button
                            type="submit"
                            class="record_form_button submit"
                    >
                        수정 완료
                    </button>

                </div>

            </form>

        </section>

    </section>

</main>

<%-- 모든 서비스 페이지에서 동일한 공통 Footer를 사용합니다. --%>
<jsp:include page="/WEB-INF/views/common/footer.jsp" />


<%-- ========================================
     JavaScript
======================================== --%>

<%-- 공통 헤더 및 메뉴 기능 --%>
<script src="${contextPath}/js/common.js"></script>

<%-- 성장 기록 작성 및 수정 기능 --%>
<script src="${contextPath}/js/record.js"></script>

</body>
</html>
