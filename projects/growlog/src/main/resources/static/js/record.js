"use strict";

/* ========================================
   Growth Record Page
======================================== */

/**
 * 문서가 모두 로드된 후
 * 성장 기록 목록 페이지와 작성 페이지 기능을 초기화한다.
 */
document.addEventListener("DOMContentLoaded", () => {
    initRecordListPage();
    initRecordWritePage();
    initRecordDelete();
    initRecordImageViewer();
});

function initRecordImageViewer() {
    const dialog = document.querySelector("[data-record-image-dialog]");
    const preview = dialog?.querySelector("[data-record-image-preview]");
    const closeButton = dialog?.querySelector("[data-record-image-close]");
    const imageButtons = document.querySelectorAll("[data-record-image]");

    if (!dialog || !preview || imageButtons.length === 0) {
        return;
    }

    imageButtons.forEach((button) => {
        button.addEventListener("click", () => {
            preview.src = button.dataset.recordImage;
            preview.alt = button.dataset.recordImageAlt || "성장 기록 첨부 사진";
            dialog.showModal();
        });
    });

    const closeDialog = () => {
        dialog.close();
        preview.src = "";
    };

    closeButton?.addEventListener("click", closeDialog);
    dialog.addEventListener("click", (event) => {
        if (event.target === dialog) {
            closeDialog();
        }
    });
}


/* ========================================
   Growth Record List Page
======================================== */

/**
 * 성장 기록 목록 페이지 기능을 초기화한다.
 *
 * 현재 기능
 * 1. 전체 / 목표 연동 / 자유 기록 필터링
 * 2. 선택한 필터의 기록 개수와 빈 상태 갱신
 * 3. JSP 컴포넌트 루트 내부로 DOM 접근 범위 제한
 */
function initRecordListPage() {
    /* [React 전환 준비] 페이지 전역 대신 컴포넌트 루트 안에서만 DOM을 조회한다. */
    const timelineRoot = document.querySelector(
        '[data-component="RecordTimeline"]'
    );

    if (!timelineRoot) {
        return;
    }

    const timelineItems = timelineRoot.querySelectorAll(
        '[data-component="TimelineItem"]'
    );
    const filterButtons = timelineRoot.querySelectorAll(
        "[data-record-filter]"
    );
    const filterEmpty = timelineRoot.querySelector("#recordFilterEmpty");
    const visibleCountElement = timelineRoot.querySelector(
        "[data-visible-count]"
    );
    const visibleLabelElement = timelineRoot.querySelector(
        "[data-visible-label]"
    );

    /**
     * [상태 분리] 선택 필터만 입력받고 표시 개수를 반환하므로
     * 향후 React의 filter state와 파생 값으로 옮기기 쉽다.
     *
     * @param {string} selectedFilter
     * @returns {number}
     */
    function filterRecordCards(selectedFilter) {
        let visibleCount = 0;

        timelineItems.forEach((item) => {
            const shouldShow =
                selectedFilter === "ALL"
                || item.dataset.recordType === selectedFilter;

            item.hidden = !shouldShow;
            if (shouldShow) {
                visibleCount += 1;
            }
        });

        /* 필터 결과가 없는 경우 안내 영역 표시 */
        if (filterEmpty) {
            filterEmpty.hidden = visibleCount > 0;
        }

        return visibleCount;
    }

    /**
     * 필터 버튼의 active 상태와 aria-pressed 값을 갱신한다.
     *
     * @param {HTMLButtonElement} selectedButton
     * 사용자가 선택한 필터 버튼
     */
    function updateFilterButtons(selectedButton) {
        filterButtons.forEach((button) => {
            const isSelected =
                button === selectedButton;

            button.classList.toggle(
                "active",
                isSelected
            );

            button.setAttribute(
                "aria-pressed",
                String(isSelected)
            );
        });
    }

    /* 필터 버튼 클릭 이벤트 */
    filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const selectedFilter =
                button.dataset.recordFilter;

            updateFilterButtons(button);

            const visibleCount =
                filterRecordCards(selectedFilter);

            if (visibleCountElement) {
                visibleCountElement.textContent =
                    String(visibleCount);
            }

            if (visibleLabelElement) {
                visibleLabelElement.textContent =
                    button.dataset.filterLabel || "전체";
            }
        });
    });

    /* 페이지 최초 진입 시 전체 기록 표시 */
    filterRecordCards("ALL");
}

/* ========================================
   Growth Record Write Page
======================================== */

/**
 * 성장 기록 작성 페이지 기능을 초기화한다.
 *
 * 현재 기능
 * 1. 자유 기록 / 목표 연결 기록 전환
 * 2. 목표 선택 영역 표시 및 숨김
 * 3. 오늘의 기분 / 체감 난이도 문구 변경
 * 4. 선택 카드 active 클래스 처리
 * 5. 입력값 검증
 * 6. 저장 버튼 중복 클릭 방지
 * 7. 작성 중 페이지 이탈 확인
 */
function initRecordWritePage() {
    const form = document.getElementById("recordWriteForm");

    /* 작성 페이지가 아니면 실행하지 않음 */
    if (!form) {
        return;
    }

    /* 기록 유형 라디오 버튼 */
    const recordTypeInputs = form.querySelectorAll(
        'input[name="recordType"]'
    );

    /* 목표 선택 영역 */
    const goalSelectGroup =
        document.getElementById("goalSelectGroup");

    /* 목표 선택 select */
    const goalSelect =
        document.getElementById("goalNum");

    /* 오늘의 기분 / 체감 난이도 제목 */
    const conditionLabel =
        document.getElementById("conditionLabel");

    /* 기분 또는 난이도 선택 항목의 표시 문구 */
    const conditionTexts =
        form.querySelectorAll(".record_condition_text");

    /* 제목 입력창 */
    const titleInput =
        document.getElementById("title");

    /* 본문 입력창 */
    const contentTextarea =
        document.getElementById("content");

    const imageInput =
        document.getElementById("imageFiles");

    const imagePreviewList =
        document.getElementById("imagePreviewList");

    const deleteMediaInputs =
        form.querySelectorAll("[data-delete-media]");

    const currentImageCount =
        form.querySelector("[data-current-image-count]");

    let previewUrls = [];

    /* 저장 버튼 */
    const submitButton =
        form.querySelector('button[type="submit"]');

    /* 취소 버튼 */
    const cancelLink =
        form.querySelector(".record_form_button.cancel");

    /* 저장 중복 실행 방지 여부 */
    let isSubmitting = false;

    /* 페이지 최초 진입 시 폼 상태 */
    const initialFormState = createFormState(form);

    function clearImagePreviews() {
        previewUrls.forEach((url) => URL.revokeObjectURL(url));
        previewUrls = [];

        if (imagePreviewList) {
            imagePreviewList.replaceChildren();
        }
    }

    function getDeletedImageCount() {
        return Array.from(deleteMediaInputs).filter((input) =>
            input.checked
            && input.closest("[data-existing-media-item]")?.dataset.mediaType === "IMAGE"
        ).length;
    }

    function getRetainedImageCount() {
        const existingCount = Number(imageInput?.dataset.existingImageCount || 0);
        return Math.max(0, existingCount - getDeletedImageCount());
    }

    function updateExistingMediaState(input) {
        const mediaItem = input.closest("[data-existing-media-item]");
        const deleteLabel = mediaItem?.querySelector("[data-delete-label]");

        mediaItem?.classList.toggle("is-pending-delete", input.checked);
        if (deleteLabel) {
            deleteLabel.textContent = input.checked ? "삭제 취소" : "삭제";
        }

        if (currentImageCount) {
            currentImageCount.textContent = String(getRetainedImageCount());
        }
    }

    deleteMediaInputs.forEach((input) => {
        input.addEventListener("change", () => {
            updateExistingMediaState(input);

            const selectedFileCount = imageInput?.files?.length || 0;
            const maxCount = Number(imageInput?.dataset.maxImageCount || 5);
            if (getRetainedImageCount() + selectedFileCount > maxCount) {
                alert(`유지할 기존 사진과 새 사진은 최대 ${maxCount}장까지 등록할 수 있습니다.`);
                imageInput.value = "";
                clearImagePreviews();
            }
        });
    });

    imageInput?.addEventListener("change", () => {
        clearImagePreviews();

        const files = Array.from(imageInput.files || []);
        const existingCount = getRetainedImageCount();
        const maxCount = Number(imageInput.dataset.maxImageCount || 5);

        if (existingCount + files.length > maxCount) {
            alert(`유지할 기존 사진과 새 사진은 최대 ${maxCount}장까지 등록할 수 있습니다.`);
            imageInput.value = "";
            return;
        }

        files.forEach((file, index) => {
            const previewUrl = URL.createObjectURL(file);
            const image = document.createElement("img");

            previewUrls.push(previewUrl);
            image.src = previewUrl;
            image.alt = `새로 추가할 사진 ${index + 1}`;
            image.loading = "lazy";
            imagePreviewList?.append(image);
        });
    });


    /* ========================================
       Record Type Change
    ======================================== */

    /**
     * 선택된 기록 유형에 맞게 화면을 갱신한다.
     *
     * 자유 기록
     * - 목표 선택 영역 숨김
     * - 오늘의 기분 표시
     *
     * 목표 기록
     * - 목표 선택 영역 표시
     * - 체감 난이도 표시
     */
    function updateRecordType() {
        const selectedInput = form.querySelector(
            'input[name="recordType"]:checked'
        );

        const selectedType = selectedInput?.value;
        const isGoalRecord = selectedType === "GOAL";

        /* 목표 기록일 때만 목표 선택 영역 표시 */
        if (goalSelectGroup) {
            goalSelectGroup.hidden = !isGoalRecord;
        }

        /**
         * 목표 기록일 때는 목표 선택을 필수값으로 지정하고,
         * 자유 기록으로 전환하면 기존 목표 선택값을 초기화한다.
         */
        if (goalSelect) {
            goalSelect.required = isGoalRecord;

            if (!isGoalRecord) {
                goalSelect.value = "";
            }
        }

        /* 기록 유형 선택 카드의 active 클래스 갱신 */
        recordTypeInputs.forEach((input) => {
            const option = input.closest(".record_type_option");

            if (!option) {
                return;
            }

            option.classList.toggle(
                "active",
                input.checked
            );
        });

        /* 선택한 기록 유형에 따라 제목 변경 */
        if (conditionLabel) {
            conditionLabel.textContent =
                isGoalRecord
                    ? "체감 난이도"
                    : "오늘의 기분";
        }

        /**
         * 각 항목의 data 속성을 사용해
         * 자유 기록과 목표 기록 문구를 다르게 표시한다.
         *
         * 예:
         * data-free-text="좋은 하루"
         * data-goal-text="쉬움"
         */
        conditionTexts.forEach((textElement) => {
            const freeText =
                textElement.dataset.freeText;

            const goalText =
                textElement.dataset.goalText;

            textElement.textContent =
                isGoalRecord
                    ? goalText
                    : freeText;
        });
    }

    /* 기록 유형이 변경될 때 화면 갱신 */
    recordTypeInputs.forEach((input) => {
        input.addEventListener(
            "change",
            updateRecordType
        );
    });

    /* 페이지 최초 진입 시 기본 상태 적용 */
    updateRecordType();

    /* ========================================
   Form Validation
======================================== */

    /**
     * 성장 기록 작성 폼의 필수 입력값을 검사한다.
     *
     * 검사 항목
     * 1. 목표 기록일 경우 목표 선택 여부
     * 2. 제목 입력 여부
     * 3. 본문 입력 여부
     *
     * @returns {boolean}
     * 입력값이 모두 유효하면 true
     */
    function validateRecordForm() {
        const selectedType = form.querySelector(
            'input[name="recordType"]:checked'
        )?.value;

        const title =
            titleInput?.value.trim() ?? "";

        const content =
            contentTextarea?.value.trim() ?? "";

        /* 목표 기록인데 목표를 선택하지 않은 경우 */
        if (
            selectedType === "GOAL"
            && !goalSelect?.value
        ) {
            alert("연결할 목표를 선택해 주세요.");

            goalSelect?.focus();

            return false;
        }

        /* 제목을 입력하지 않은 경우 */
        if (!title) {
            alert("성장 기록 제목을 입력해 주세요.");

            titleInput?.focus();

            return false;
        }

        /* 본문을 입력하지 않은 경우 */
        if (!content) {
            alert("성장 기록 내용을 입력해 주세요.");

            contentTextarea?.focus();

            return false;
        }

        return true;
    }


    /* ========================================
       Form Change Check
    ======================================== */

    /**
     * 최초 진입 상태와 현재 폼 상태를 비교한다.
     *
     * @returns {boolean}
     * 사용자가 폼을 변경했다면 true
     */
    function hasFormChanged() {
        const currentFormState =
            createFormState(form);

        return currentFormState
            !== initialFormState;
    }


    /* ========================================
       Form Submit
    ======================================== */

    /**
     * 폼 제출 전에 입력값을 검사하고,
     * 저장 버튼의 중복 클릭을 방지한다.
     */
    form.addEventListener("submit", (event) => {
        /* 이미 제출 중이면 중복 제출 차단 */
        if (isSubmitting) {
            event.preventDefault();
            return;
        }

        /* 입력값 검증 실패 시 제출 중단 */
        if (!validateRecordForm()) {
            event.preventDefault();
            return;
        }

        /* 정상 제출 상태로 변경 */
        isSubmitting = true;

        /* 저장 버튼 비활성화 및 문구 변경 */
        if (submitButton) {
            submitButton.disabled = true;
            // 페이지에 맞는 로딩 문구 사용
            const loadingText = submitButton.dataset.loadingText || "처리 중...";
            submitButton.textContent = loadingText;
            submitButton.classList.add("is_loading");
        }
    });


    /* ========================================
       Cancel Confirm
    ======================================== */

    /**
     * 작성 중 취소 버튼을 누르면
     * 목록으로 이동할지 확인한다.
     */
    cancelLink?.addEventListener(
        "click",
        (event) => {
            /**
             * 이미 저장 중이거나
             * 작성 내용이 변경되지 않았다면
             * 확인창 없이 이동한다.
             */
            if (
                isSubmitting
                || !hasFormChanged()
            ) {
                return;
            }

            const confirmed = window.confirm(
                "변경 중인 내용이 있습니다.\n"
                + "현재 페이지로 이동하시겠습니까?"
            );

            if (!confirmed) {
                event.preventDefault();
            }
        }
    );


    /* ========================================
       Page Leave Confirm
    ======================================== */

    /**
     * 작성 중 새로고침, 뒤로가기, 브라우저 닫기 등으로
     * 페이지를 벗어나려 할 때 브라우저 경고를 표시한다.
     */
    window.addEventListener(
        "beforeunload",
        (event) => {
            /**
             * 정상 저장 중이거나
             * 폼 내용이 변경되지 않았다면 경고하지 않는다.
             */
            if (
                isSubmitting
                || !hasFormChanged()
            ) {
                return;
            }

            event.preventDefault();

            /*
             * 일부 브라우저에서 이탈 경고를 표시하려면
             * returnValue 설정이 필요하다.
             */
            event.returnValue = "";
        }
    );
}

/* ========================================
   Growth Record Delete
======================================== */

/**
 * 성장 기록 삭제 버튼의 확인창과 중복 제출 방지를 처리한다.
 */
function initRecordDelete() {
    const deleteButtons = document.querySelectorAll(
        "[data-record-delete]"
    );

    /* 삭제 버튼이 없는 페이지에서는 실행하지 않음 */
    if (deleteButtons.length === 0) {
        return;
    }

    deleteButtons.forEach((deleteButton) => {
        const deleteForm =
            deleteButton.closest("form");

        /* 삭제 버튼을 감싸는 Form이 없으면 처리하지 않음 */
        if (!deleteForm) {
            return;
        }

        deleteForm.addEventListener("submit", (event) => {
            /*
             * 이미 삭제 요청이 제출된 경우
             * 중복 요청을 막는다.
             */
            if (deleteButton.disabled) {
                event.preventDefault();
                return;
            }

            /* 삭제 전 사용자 확인 */
            const confirmed = window.confirm(
                "이 성장 기록을 삭제하시겠습니까?\n"
                + "삭제한 기록은 복구할 수 없습니다."
            );

            /* 취소를 선택하면 삭제 요청 중단 */
            if (!confirmed) {
                event.preventDefault();
                return;
            }

            /* 중복 클릭 방지를 위해 버튼 비활성화 */
            deleteButton.disabled = true;
            deleteButton.textContent = "삭제 중...";
            deleteButton.classList.add("is_loading");
        });
    });
}

/* ========================================
   Form Utility
======================================== */

/**
 * 폼의 현재 입력 상태를 문자열로 변환한다.
 *
 * 최초 상태와 현재 상태를 비교해
 * 사용자가 내용을 변경했는지 확인할 때 사용한다.
 *
 * @param {HTMLFormElement} form
 * 상태를 확인할 폼 요소
 *
 * @returns {string}
 * 직렬화한 폼 상태
 */
function createFormState(form) {
    const formData = new FormData(form);

    return Array.from(formData.entries())
        .map(([name, value]) => {
            return `${name}:${String(value).trim()}`;
        })
        .join("|");
}
