"use strict";

document.addEventListener("DOMContentLoaded", () => {
    initGoalProgressBars();
    initGoalListFilters();
    initGoalFormValidation();
    initGoalTextCounters();
});

/**
 * [React 전환 준비] GoalPage 루트 안에서 목표 상태 필터와 파생 개수를 관리한다.
 */
function initGoalListFilters() {
    const root = document.querySelector(
        '[data-component="GoalPage"]'
    );

    if (!root) {
        return;
    }

    const filterButtons = root.querySelectorAll(
        "[data-goal-filter]"
    );
    const goalCards = root.querySelectorAll(
        "[data-goal-filter-status]"
    );
    const countElement = root.querySelector(
        "[data-visible-goal-count]"
    );
    const labelElement = root.querySelector(
        "[data-goal-filter-label]"
    );
    const emptyState = root.querySelector(
        "[data-goal-filter-empty]"
    );

    function applyFilter(selectedFilter) {
        let visibleCount = 0;

        goalCards.forEach((card) => {
            const isVisible =
                selectedFilter === "ALL"
                || card.dataset.goalFilterStatus === selectedFilter;

            card.hidden = !isVisible;

            if (isVisible) {
                visibleCount += 1;
            }
        });

        if (countElement) {
            countElement.textContent = String(visibleCount);
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
                item.setAttribute("aria-pressed", String(isSelected));
            });

            if (labelElement) {
                labelElement.textContent =
                    button.dataset.filterLabel || "전체";
            }

            applyFilter(button.dataset.goalFilter || "ALL");
        });
    });
}

/**
 * 목표 목록의 진행률 바를 0%부터 실제 진행률까지
 * 부드럽게 증가시키는 애니메이션을 적용한다.
 *
 * progress 값은 data-progress 속성에서 읽는다.
 */
function initGoalProgressBars() {
    const progressBars = document.querySelectorAll(
        ".goal_progress_bar span[data-progress]"
    );

    progressBars.forEach((bar) => {
        const progress = clampProgress(
            Number(bar.dataset.progress)
        );

        bar.style.width = "0%";

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                bar.style.width = `${progress}%`;
            });
        });
    });
}

/**
 * 진행률 값이 0~100 범위를 벗어나지 않도록 제한한다.
 */
function clampProgress(progress) {
    if (!Number.isFinite(progress)) {
        return 0;
    }

    return Math.min(100, Math.max(0, progress));
}

/**
 * 목표 등록 Form의 필수값과 날짜 범위를 검사한다.
 */
function initGoalFormValidation() {
    const form = document.querySelector("#goalForm");

    if (!form) {
        return;
    }

    const titleInput = form.querySelector("#goalTitle");
    const startDateInput = form.querySelector("#startDate");
    const endDateInput = form.querySelector("#endDate");
    const submitButton = form.querySelector(
        'button[type="submit"]'
    );

    form.addEventListener("submit", (event) => {
        clearValidationErrors(form);

        let isValid = true;

        if (
            !titleInput ||
            titleInput.value.trim().length === 0
        ) {
            showInputError(
                titleInput,
                "goalTitleError",
                "목표 제목을 입력해 주세요."
            );

            isValid = false;
        }

        if (
            titleInput &&
            titleInput.value.trim().length > 200
        ) {
            showInputError(
                titleInput,
                "goalTitleError",
                "목표 제목은 200자 이하로 입력해 주세요."
            );

            isValid = false;
        }

        if (
            startDateInput &&
            endDateInput &&
            startDateInput.value &&
            endDateInput.value &&
            startDateInput.value > endDateInput.value
        ) {
            showInputError(
                endDateInput,
                "goalDateError",
                "종료일은 시작일보다 빠를 수 없습니다."
            );

            isValid = false;
        }

        if (!isValid) {
            event.preventDefault();

            const firstInvalidInput =
                form.querySelector(".invalid");

            if (firstInvalidInput) {
                firstInvalidInput.focus();
            }

            return;
        }

        /*
         * 사용자가 등록 버튼을 여러 번 눌러
         * 같은 목표가 중복 저장되는 것을 방지한다.
         */
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "등록 중...";
        }
    });

    /*
     * 사용자가 입력을 다시 시작하면
     * 기존 오류 표시를 제거한다.
     */
    form.querySelectorAll("input, textarea").forEach((input) => {
        input.addEventListener("input", () => {
            input.classList.remove("invalid");

            const errorId = input.getAttribute(
                "aria-describedby"
            );

            if (!errorId) {
                return;
            }

            errorId.split(" ").forEach((id) => {
                const errorElement =
                    document.getElementById(id);

                if (
                    errorElement &&
                    errorElement.classList.contains(
                        "goal_error_text"
                    )
                ) {
                    errorElement.classList.remove("show");
                }
            });
        });
    });

    /*
     * 시작일이 변경되면 종료일의 최소 선택일도
     * 시작일과 동일하게 맞춘다.
     */
    if (startDateInput && endDateInput) {
        startDateInput.addEventListener("change", () => {
            endDateInput.min = startDateInput.value;

            if (
                endDateInput.value &&
                startDateInput.value &&
                endDateInput.value < startDateInput.value
            ) {
                endDateInput.value = "";
            }
        });
    }
}

/**
 * 제목과 내용 입력란의 현재 글자 수를 표시한다.
 */
function initGoalTextCounters() {
    const counterTargets = document.querySelectorAll(
        "[data-character-count]"
    );

    counterTargets.forEach((input) => {
        const counterId = input.dataset.characterCount;
        const counter = document.getElementById(counterId);

        if (!counter) {
            return;
        }

        const maxLength = input.maxLength;

        const updateCounter = () => {
            const currentLength = input.value.length;

            counter.textContent =
                maxLength > 0
                    ? `${currentLength} / ${maxLength}`
                    : `${currentLength}자`;
        };

        updateCounter();

        input.addEventListener("input", updateCounter);
    });
}

/**
 * 특정 입력창에 오류 스타일과 오류 메시지를 표시한다.
 */
function showInputError(input, errorId, message) {
    if (input) {
        input.classList.add("invalid");
    }

    const errorElement = document.getElementById(errorId);

    if (!errorElement) {
        return;
    }

    errorElement.textContent = message;
    errorElement.classList.add("show");
}

/**
 * Form 안에 표시된 모든 오류 상태를 초기화한다.
 */
function clearValidationErrors(form) {
    form.querySelectorAll(".invalid").forEach((input) => {
        input.classList.remove("invalid");
    });

    form.querySelectorAll(".goal_error_text").forEach(
        (errorElement) => {
            errorElement.classList.remove("show");
        }
    );
}

// ========================================
// Goal Detail Modal
// ========================================

document.addEventListener("DOMContentLoaded", () => {

    // 목표 카드 목록
    const goalCards =
        document.querySelectorAll("[data-goal-card]");

    // 목표 상세 모달
    const goalModal =
        document.getElementById("goalDetailModal");

    // JSP에서 전달한 contextPath 값
    const contextPath =
        goalModal?.dataset.contextPath || "";

    // 모달이 현재 페이지에 없으면 실행 종료
    if (!goalModal) {
        return;
    }

    // 모달 내부 출력 요소
    const modalTitle =
        document.getElementById("goalModalTitle");

    const modalContent =
        document.getElementById("goalModalContent");

    const modalCategory =
        document.getElementById("goalModalCategory");

    const modalCategoryName =
        document.getElementById("goalModalCategoryName");

    const modalProgressText =
        document.getElementById("goalModalProgressText");

    const modalProgressBar =
        document.getElementById("goalModalProgressBar");

    const modalStatus =
        document.getElementById("goalModalStatus");

    const modalStartDate =
        document.getElementById("goalModalStartDate");

    const modalEndDate =
        document.getElementById("goalModalEndDate");

    // 모달 수정 링크
    const modalEditLink =
        document.getElementById("goalModalEditLink");

// 모달 삭제 form
    const modalDeleteForm =
        document.getElementById("goalModalDeleteForm");

    /* [접근성 개선] 모달을 닫은 뒤 원래 선택한 목표 카드로 포커스를 돌려준다. */
    let lastFocusedCard = null;

    /**
     * 목표 상세 모달을 연다.
     *
     * @param {HTMLElement} card 선택한 목표 카드
     */
    const openGoalModal = (card) => {
        lastFocusedCard = card;

        const {
            goalNum,
            goalTitle,
            goalContent,
            goalProgress,
            goalStatus,
            goalCategoryName,
            goalCategoryColor,
            goalStartDate,
            goalEndDate
        } = card.dataset;

        // 제목 및 내용
        modalTitle.textContent =
            goalTitle || "제목 없음";

        modalContent.textContent =
            goalContent || "등록된 목표 내용이 없습니다.";

        // 카테고리
        /* [아이콘 통일] 모달의 SVG 아이콘은 유지하고 사용자 데이터로 교체하지 않는다. */

        modalCategoryName.textContent =
            goalCategoryName || "기타";

        modalCategory.style.color =
            goalCategoryColor || "#4e8458";

        modalCategory.style.backgroundColor =
            `${goalCategoryColor || "#4e8458"}18`;

        modalCategory.style.borderColor =
            `${goalCategoryColor || "#4e8458"}40`;

        // 진행률
        const progress =
            Math.max(
                0,
                Math.min(
                    100,
                    Number(goalProgress) || 0
                )
            );

        modalProgressText.textContent =
            `${progress}%`;

        modalProgressBar.style.width =
            `${progress}%`;

        modalProgressBar.style.backgroundColor =
            goalCategoryColor || "#6bb678";

        // 상태 및 날짜
        modalStatus.textContent =
            goalStatus || "-";

        modalStartDate.textContent =
            goalStartDate || "미설정";

        modalEndDate.textContent =
            goalEndDate || "미설정";

        // 수정 페이지 링크 설정
        if (modalEditLink) {
            modalEditLink.href =
                `${contextPath}/goal/edit/${goalNum}`;
        }

        // 삭제 요청 경로 설정
        if (modalDeleteForm) {
            modalDeleteForm.action =
                `${contextPath}/goal/delete/${goalNum}`;
        }

        // 모달 열기
        goalModal.classList.add("show");
        goalModal.removeAttribute("inert");

        goalModal.setAttribute(
            "aria-hidden",
            "false"
        );


        // 모달이 열린 동안 배경 스크롤 방지
        document.body.classList.add(
            "modal_open"
        );

        goalModal.querySelector(".goal_modal_close")?.focus();
    };

    /**
     * 목표 상세 모달을 닫는다.
     */
    const closeGoalModal = () => {

        goalModal.classList.remove("show");
        goalModal.setAttribute("inert", "");

        goalModal.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.classList.remove(
            "modal_open"
        );

        /*
    * 타임라인에서 전달받은 openGoal 파라미터를 제거한다.
    *
    * 페이지를 새로고침하지 않고 현재 주소만 정리한다.
    * 이후 새로고침해도 닫았던 모달이 다시 열리지 않는다.
    */
        const currentUrl =
            new URL(window.location.href);

        if (currentUrl.searchParams.has("openGoal")) {
            currentUrl.searchParams.delete("openGoal");

            window.history.replaceState(
                {},
                "",
                currentUrl.pathname
                + currentUrl.search
                + currentUrl.hash
            );
        }

        lastFocusedCard?.focus();
    };

    // 목표 카드 클릭 이벤트
    goalCards.forEach((card) => {

        card.addEventListener("click", (event) => {

            // 수정, 삭제 버튼을 눌렀을 때는 모달을 열지 않음
            if (
                event.target.closest(
                    ".goal_card_actions"
                )
            ) {
                return;
            }

            openGoalModal(card);
        });

        // 키보드 Enter, Space로도 열 수 있도록 처리
        card.addEventListener("keydown", (event) => {

            if (
                event.key !== "Enter"
                && event.key !== " "
            ) {
                return;
            }

            if (
                event.target.closest(
                    ".goal_card_actions"
                )
            ) {
                return;
            }

            event.preventDefault();

            openGoalModal(card);
        });

    });

    /**
     * 타임라인 등 다른 페이지에서 전달한 목표 번호를 확인하여
     * 목표 목록 페이지가 열린 직후 해당 목표의 상세 모달을 자동으로 연다.
     *
     * 주소 예시:
     * /goal/list?openGoal=15
     */
    const searchParams =
        new URLSearchParams(window.location.search);

    const openGoalNum =
        searchParams.get("openGoal");

    if (openGoalNum) {
        /*
         * 목표 목록 카드에는 data-goal-num 속성이 들어 있다.
         *
         * 전달받은 목표 번호와 동일한 카드를 찾아
         * 기존 openGoalModal() 함수에 전달한다.
         */
        const targetGoalCard =
            Array.from(goalCards).find(
                (card) =>
                    card.dataset.goalNum === openGoalNum
            );

        if (targetGoalCard) {
            openGoalModal(targetGoalCard);
        }
    }



    // 닫기 버튼과 배경 클릭
    goalModal
        .querySelectorAll("[data-modal-close]")
        .forEach((closeButton) => {

            closeButton.addEventListener(
                "click",
                closeGoalModal
            );

        });

    // ESC 키로 닫기
    document.addEventListener("keydown", (event) => {

        if (
            event.key === "Escape"
            && goalModal.classList.contains("show")
        ) {
            closeGoalModal();
        }

    });

});
