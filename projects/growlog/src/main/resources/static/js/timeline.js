"use strict";

document.addEventListener("DOMContentLoaded", () => {
    initTimelinePage();
});

/**
 * [React 전환 준비] TimelinePage 루트 내부에서만 상태와 DOM을 관리한다.
 * 실제 데이터 연결 시 selectedFilter를 React state로 치환할 수 있다.
 */
function initTimelinePage() {
    const root = document.querySelector(
        '[data-component="TimelinePage"]'
    );

    if (!root) {
        return;
    }

    const filterButtons = root.querySelectorAll(
        "[data-timeline-filter]"
    );
    const dayGroups = root.querySelectorAll(
        "[data-timeline-type]"
    );
    const resultCount = root.querySelector(
        "[data-result-count]"
    );
    const emptyState = root.querySelector(
        "[data-filter-empty]"
    );

    let selectedFilter = "ALL";

    function applyFilter() {
        let visibleCount = 0;

        dayGroups.forEach((group) => {
            const isVisible =
                selectedFilter === "ALL"
                || group.dataset.timelineType === selectedFilter;


            group.hidden = !isVisible;

            if (isVisible) {
                visibleCount += 1;
            }
        });

        if (resultCount) {
            resultCount.textContent = String(visibleCount);
        }

        if (emptyState) {
            emptyState.hidden = visibleCount !== 0;
        }
    }

    filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            filterButtons.forEach((item) => {
                const isSelected = item === button;

                item.classList.toggle("active", isSelected);
                item.setAttribute(
                    "aria-pressed",
                    String(isSelected)
                );
            });

            selectedFilter =
                button.dataset.timelineFilter || "ALL";
            applyFilter();
        });
    });

    // 페이지가 처음 로딩될 때 전체 상태를 적용한다.
    applyFilter();
}
