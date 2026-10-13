<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="growlog" tagdir="/WEB-INF/tags" %>

<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>배지 보관함 | GrowLog</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/common.css?v=20260731-1">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/badges.css?v=20260804-1">
    <script defer src="${pageContext.request.contextPath}/js/badges.js?v=20260804-1"></script>
    <jsp:include page="/WEB-INF/views/common/responsive-styles.jsp"/>
</head>
<body>
<jsp:include page="/WEB-INF/views/common/header.jsp"/>

<main class="badge_page">
    <section class="badge_hero">
        <div class="badge_hero_copy">
            <span class="badge_eyebrow">MY BADGE GARDEN</span>
            <h1>차곡차곡 키워온<br>나의 성장 배지</h1>
            <p>목표와 기록, 꾸준한 출석으로 자라난 배지를 한곳에서 확인해보세요.</p>
        </div>
        <div class="badge_hero_summary" aria-label="배지 획득 현황">
            <div class="badge_summary_numbers">
                <span>COLLECTION</span>
                <strong>${badgeCollection.earnedCount}<small> / ${badgeCollection.allBadges.size()}</small></strong>
            </div>
            <div class="badge_total_progress" role="progressbar"
                 aria-valuemin="0" aria-valuemax="100"
                 aria-valuenow="${badgeCollection.completionPercent}">
                <span style="width: ${badgeCollection.completionPercent}%"></span>
            </div>
            <p>전체 배지의 <strong>${badgeCollection.completionPercent}%</strong>를 모았어요.</p>
        </div>
    </section>

    <section class="badge_layout">
        <aside class="badge_sidebar">
            <div class="sidebar_title"><span>마이페이지</span></div>
            <nav class="sidebar_navigation" aria-label="마이페이지 메뉴">
                <a href="${pageContext.request.contextPath}/mypage/profile" class="sidebar_menu">
                    <span class="sidebar_menu_icon" aria-hidden="true">●</span><span>내 정보</span>
                </a>
                <a href="${pageContext.request.contextPath}/mypage/attendance" class="sidebar_menu">
                    <span class="sidebar_menu_icon" aria-hidden="true">□</span><span>출석 기록</span>
                </a>
                <a href="${pageContext.request.contextPath}/mypage/settings" class="sidebar_menu">
                    <span class="sidebar_menu_icon" aria-hidden="true">◇</span><span>계정 설정</span>
                </a>
                <a href="${pageContext.request.contextPath}/mypage/badges"
                   class="sidebar_menu active" aria-current="page">
                    <span class="sidebar_menu_icon" aria-hidden="true">✦</span><span>배지 보관함</span>
                </a>
            </nav>
        </aside>

        <div class="badge_main">
            <div class="badge_toolbar">
                <div>
                    <span class="badge_eyebrow">COLLECTION</span>
                    <h2>나의 배지 도감</h2>
                </div>
                <div class="badge_filters" role="group" aria-label="배지 종류 필터">
                    <button type="button" class="active" data-badge-filter="all" aria-pressed="true">전체</button>
                    <button type="button" data-badge-filter="core" aria-pressed="false">기본</button>
                    <button type="button" data-badge-filter="attendance" aria-pressed="false">출석</button>
                    <button type="button" data-badge-filter="goals" aria-pressed="false">목표</button>
                    <button type="button" data-badge-filter="records" aria-pressed="false">성장 기록</button>
                </div>
            </div>

            <growlog:badgeGroup category="core" title="첫 성장의 순간"
                    badges="${badgeCollection.coreBadges}"
                    contextPath="${pageContext.request.contextPath}"/>
            <growlog:badgeGroup category="attendance" title="꾸준한 출석"
                    badges="${badgeCollection.attendanceBadges}"
                    contextPath="${pageContext.request.contextPath}"/>
            <growlog:badgeGroup category="goals" title="목표 수집가"
                    badges="${badgeCollection.goalBadges}"
                    contextPath="${pageContext.request.contextPath}"/>
            <growlog:badgeGroup category="records" title="성장 기록가"
                    badges="${badgeCollection.recordBadges}"
                    contextPath="${pageContext.request.contextPath}"/>
        </div>
    </section>
</main>

<jsp:include page="/WEB-INF/views/common/footer.jsp"/>
</body>
</html>
