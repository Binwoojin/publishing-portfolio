<%@ page contentType="text/html;charset=UTF-8" language="java" %>

<%-- ========================================
     Common Footer
     JSP include 단위로 분리해 추후 React Footer 컴포넌트로 옮기기 쉽게 구성합니다.
======================================== --%>
<footer class="main_footer">

    <div class="footer_inner">

        <%-- 서비스 브랜드와 핵심 메시지 --%>
        <div class="footer_brand">
            <a
                    href="${pageContext.request.contextPath}/home"
                    class="footer_logo"
                    aria-label="GrowLog 홈으로 이동"
            >
                <img
                        src="${pageContext.request.contextPath}/images/logo.png"
                        alt=""
                >
                <span>GrowLog</span>
            </a>

            <p>
                오늘의 작은 기록을 모아<br>
                나만의 성장 흐름을 만들어 보세요.
            </p>
        </div>

        <%-- 실제로 제공 중인 핵심 페이지 바로가기 --%>
        <nav class="footer_navigation" aria-label="하단 메뉴">
            <strong>바로가기</strong>

            <div class="footer_navigation_links">
                <a href="${pageContext.request.contextPath}/home">홈</a>
                <a href="${pageContext.request.contextPath}/record/list">성장 기록</a>
                <a href="${pageContext.request.contextPath}/goal/list">목표</a>
                <a href="${pageContext.request.contextPath}/timeline">타임라인</a>
            </div>
        </nav>

    </div>

    <div class="footer_bottom">
        <p>&copy; 2026 GrowLog. All rights reserved.</p>
        <p>하루의 기록이 내일의 성장이 됩니다.</p>
    </div>

</footer>
