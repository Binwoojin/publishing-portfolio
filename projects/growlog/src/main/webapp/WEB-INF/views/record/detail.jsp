<%@ page contentType="text/html;charset=UTF-8" language="java" %>

<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fn" uri="jakarta.tags.functions" %>

<%-- 현재 애플리케이션의 Context Path 설정 --%>
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

    <title>
        <c:out value="${record.title}" /> | GrowLog
    </title>

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


<main class="record_detail_page">

    <%-- ========================================
         상세 페이지 상단 이동 영역
    ======================================== --%>
    <div class="record_detail_navigation">

        <%-- 성장 기록 목록으로 돌아가기 --%>
        <a
                href="${contextPath}/record/list"
                class="record_detail_back"
        >
            <span aria-hidden="true">←</span>
            성장 기록 목록
        </a>

    </div>


    <%-- ========================================
         성장 기록 상세 카드
    ======================================== --%>
    <article class="record_detail_card">

        <%-- 상세 카드 상단 정보 --%>
        <header class="record_detail_header">

            <div class="record_detail_meta">

                <%-- 목표 연결 여부에 따른 기록 유형 표시 --%>
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

                <%-- 성장 기록 작성일 --%>
                <time class="record_detail_date">
                    <c:out
                            value="${fn:replace(
                                fn:substring(record.createdAt, 0, 10),
                                '-',
                                '.'
                            )}"
                    />
                </time>

            </div>


            <%-- 성장 기록 제목 --%>
            <h1 class="record_detail_title">
                <c:out value="${record.title}" />
            </h1>


            <%-- 기분 또는 체감 난이도 표시 --%>
            <c:if test="${not empty record.difficulty}">

                <div class="record_detail_condition">

                    <span class="record_detail_condition_label">

                        <c:choose>
                            <c:when test="${record.goal != null}">
                                체감 난이도
                            </c:when>

                            <c:otherwise>
                                오늘의 기분
                            </c:otherwise>
                        </c:choose>

                    </span>


                    <strong class="record_detail_condition_value">

                            <%-- DB에 저장된 난이도 값을 화면용 한글로 변환 --%>
                        <c:choose>

                            <c:when test="${record.difficulty eq 'EASY'}">

                                <c:choose>
                                    <c:when test="${record.goal != null}">
                                        😊 쉬움
                                    </c:when>

                                    <c:otherwise>
                                        😊 좋은 하루
                                    </c:otherwise>
                                </c:choose>

                            </c:when>


                            <c:when test="${record.difficulty eq 'HARD'}">

                                <c:choose>
                                    <c:when test="${record.goal != null}">
                                        😥 어려움
                                    </c:when>

                                    <c:otherwise>
                                        😥 힘든 하루
                                    </c:otherwise>
                                </c:choose>

                            </c:when>


                            <c:otherwise>
                                🙂 보통
                            </c:otherwise>

                        </c:choose>

                    </strong>

                </div>

            </c:if>

        </header>


        <%-- ========================================
             성장 기록 본문
        ======================================== --%>
        <section class="record_detail_section">

            <span class="record_detail_section_label">
                RECORD
            </span>

            <h2 class="record_detail_section_title">
                성장 기록
            </h2>

            <div class="record_detail_text"><c:out value="${record.content}" /></div>

        </section>

        <c:if test="${not empty mediaList}">
            <section class="record_detail_section record_detail_media_section">
                <span class="record_detail_section_label">
                    MOMENTS
                </span>

                <div class="record_detail_media_heading">
                    <h2 class="record_detail_section_title">
                        함께 남긴 순간
                    </h2>
                    <span class="record_detail_media_count">
                        <c:out value="${fn:length(mediaList)}" />개
                    </span>
                </div>

                <div class="record_detail_media_grid">
                    <c:forEach var="media" items="${mediaList}" varStatus="status">
                        <c:choose>
                            <c:when test="${media.mediaType eq 'IMAGE'}">
                                <button
                                        type="button"
                                        class="record_detail_media_item record_detail_image_button"
                                        data-record-image="${media.mediaUrl}"
                                        data-record-image-alt="성장 기록 첨부 사진 ${status.count}"
                                        aria-label="첨부 사진 ${status.count} 크게 보기"
                                >
                                    <img
                                            src="${media.mediaUrl}"
                                            alt="성장 기록 첨부 사진 ${status.count}"
                                            loading="lazy"
                                    >
                                    <span class="record_detail_image_zoom" aria-hidden="true">
                                        <svg viewBox="0 0 24 24" fill="none">
                                            <circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="1.8"/>
                                            <path d="m16 16 4 4M11 8v6M8 11h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                                        </svg>
                                    </span>
                                </button>
                            </c:when>
                            <c:when test="${media.mediaType eq 'YOUTUBE'}">
                                <div class="record_detail_media_item record_detail_video">
                                    <iframe
                                            src="${media.mediaUrl}"
                                            title="성장 기록 YouTube 영상 ${status.count}"
                                            loading="lazy"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowfullscreen
                                    ></iframe>
                                </div>
                            </c:when>
                        </c:choose>
                    </c:forEach>
                </div>
            </section>
        </c:if>


        <%-- ========================================
             오늘 배운 내용
        ======================================== --%>
        <c:if test="${not empty record.todayLearning}">

            <section class="record_detail_section">

                <span class="record_detail_section_label">
                    LEARNING
                </span>

                <h2 class="record_detail_section_title">
                    오늘 배운 내용
                </h2>

                <div class="record_detail_text"><c:out value="${record.todayLearning}" /></div>

            </section>

        </c:if>


        <%-- ========================================
             문제 해결 과정
        ======================================== --%>
        <c:if test="${not empty record.solution}">

            <section class="record_detail_section">

                <span class="record_detail_section_label">
                    SOLUTION
                </span>

                <h2 class="record_detail_section_title">
                    문제 해결 과정
                </h2>

                <div class="record_detail_text"><c:out value="${record.solution}" /></div>

            </section>

        </c:if>


        <%-- ========================================
             최종 회고
        ======================================== --%>
        <c:if test="${not empty record.retrospective}">

            <section class="record_detail_section retrospective_section">

                <span class="record_detail_section_label">
                    RETROSPECTIVE
                </span>

                <h2 class="record_detail_section_title">
                    최종 회고
                </h2>

                <div class="record_detail_text"><c:out value="${record.retrospective}" /></div>

            </section>

        </c:if>


        <%-- ========================================
             상세 페이지 하단 버튼
        ======================================== --%>
        <footer class="record_detail_actions">

            <%-- 성장 기록 목록으로 이동 --%>
            <a
                    href="${contextPath}/record/list"
                    class="record_detail_button list"
            >
                목록으로
            </a>


                <%-- 수정 페이지 이동 --%>

                <a
                        href="${contextPath}/record/${record.recordNum}/edit"
                        class="record_detail_button edit"
                >
                    기록 수정
                </a>

                <%-- 성장 기록 삭제 Form --%>
                <form
                        action="${contextPath}/record/${record.recordNum}/delete"
                        method="post"
                        class="record_delete_form"
                >
                    <%-- Spring Security CSRF 검증용 토큰 --%>
                    <input type="hidden"
                           name="${_csrf.parameterName}"
                           value="${_csrf.token}">

                    <%--
                        삭제는 데이터가 변경되는 요청이므로
                        GET 링크가 아닌 POST Form으로 처리한다.
                    --%>
                    <button
                            type="submit"
                            class="record_detail_button delete"
                            data-record-delete
                    >
                        기록 삭제
                    </button>
                </form>

        </footer>

    </article>

</main>

<%-- 모든 서비스 페이지에서 동일한 공통 Footer를 사용합니다. --%>
<jsp:include page="/WEB-INF/views/common/footer.jsp" />

<dialog class="record_image_dialog" data-record-image-dialog aria-label="첨부 사진 크게 보기">
    <button type="button" class="record_image_dialog_close" data-record-image-close aria-label="사진 닫기">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
    </button>
    <img src="" alt="" data-record-image-preview>
</dialog>


<%-- ========================================
     JavaScript
======================================== --%>

<%-- 공통 헤더 및 메뉴 기능 --%>
<script src="${contextPath}/js/common.js"></script>

<%-- 성장 기록 페이지 기능 --%>
<script src="${contextPath}/js/record.js"></script>

</body>
</html>
