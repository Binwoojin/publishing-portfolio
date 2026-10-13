<%@ tag body-content="empty" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ attribute name="category" required="true" type="java.lang.String" %>
<%@ attribute name="title" required="true" type="java.lang.String" %>
<%@ attribute name="badges" required="true" type="java.util.List" %>
<%@ attribute name="contextPath" required="true" type="java.lang.String" %>

<section class="badge_group" data-badge-group="${category}">
    <div class="badge_group_heading">
        <h3>${title}</h3>
        <span>${badges.size()}개의 배지</span>
    </div>
    <div class="badge_grid">
        <c:forEach var="badge" items="${badges}">
            <article class="badge_card ${badge.earned ? 'earned' : 'locked'}">
                <div class="badge_art">
                    <img src="${contextPath}${badge.imagePath}" alt="${badge.title} 배지">
                    <c:if test="${not badge.earned}">
                        <span class="badge_lock" aria-label="아직 획득하지 못한 배지">
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M7 10V8a5 5 0 0 1 10 0v2m-9 0h8a2 2 0 0 1 2 2v7H6v-7a2 2 0 0 1 2-2Z"
                                      fill="none" stroke="currentColor" stroke-width="2"
                                      stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </span>
                    </c:if>
                </div>
                <div class="badge_card_body">
                    <div class="badge_title_row">
                        <h4><c:out value="${badge.title}"/></h4>
                        <span class="badge_state">${badge.earned ? '획득' : '도전 중'}</span>
                    </div>
                    <p><c:out value="${badge.description}"/></p>
                    <c:if test="${not badge.earned}">
                        <div class="badge_progress_meta">
                            <span>현재 ${badge.currentValue}</span>
                            <strong>${badge.targetValue} 달성</strong>
                        </div>
                        <div class="badge_progress" role="progressbar"
                             aria-valuemin="0" aria-valuemax="100"
                             aria-valuenow="${badge.progressPercent}">
                            <span style="width: ${badge.progressPercent}%"></span>
                        </div>
                    </c:if>
                </div>
            </article>
        </c:forEach>
    </div>
</section>
