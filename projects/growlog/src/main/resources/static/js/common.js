"use strict";

document.addEventListener("DOMContentLoaded", () => {
    initPageMoveButtons();
    initDropdownMenus();
    initMobileNavigation();
    initAlertMessages();
    initConfirmActions();
    setActiveNavigation();
});

/**
 * data-url 속성이 있는 버튼을 해당 주소로 이동시킨다.
 *
 * 예:
 * <button type="button" data-url="/goal/write">목표 등록</button>
 */
function initPageMoveButtons() {
    const buttons = document.querySelectorAll("[data-url]");

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            const targetUrl = button.dataset.url;

            if (!targetUrl || targetUrl === "#") {
                alert("아직 연결되지 않은 기능입니다.");
                return;
            }

            window.location.href = targetUrl;
        });
    });
}

/**
 * 공통 드롭다운 메뉴 처리
 *
 * 버튼:
 * data-dropdown-button="profileMenu"
 *
 * 메뉴:
 * id="profileMenu"
 */
function initDropdownMenus() {
    const dropdownButtons = document.querySelectorAll(
        "[data-dropdown-button]"
    );

    dropdownButtons.forEach((button) => {
        const menuId = button.dataset.dropdownButton;
        const menu = document.getElementById(menuId);

        if (!menu) {
            return;
        }

        button.addEventListener("click", (event) => {
            event.stopPropagation();

            const isOpen = menu.classList.toggle("open");

            button.setAttribute(
                "aria-expanded",
                String(isOpen)
            );
        });

        menu.addEventListener("click", (event) => {
            event.stopPropagation();
        });
    });

    document.addEventListener("click", () => {
        closeAllDropdownMenus();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeAllDropdownMenus();
        }
    });
}

function closeAllDropdownMenus() {
    const openMenus = document.querySelectorAll(
        ".profile_menu.open, .dropdown_menu.open"
    );

    openMenus.forEach((menu) => {
        menu.classList.remove("open");
    });

    const expandedButtons = document.querySelectorAll(
        '[aria-expanded="true"]'
    );

    expandedButtons.forEach((button) => {
        button.setAttribute("aria-expanded", "false");
    });
}

/**
 * 모바일 메뉴 토글
 *
 * 버튼:
 * data-mobile-menu-button="mainNav"
 *
 * 메뉴:
 * id="mainNav"
 */
function initMobileNavigation() {
    const menuButtons = document.querySelectorAll(
        "[data-mobile-menu-button]"
    );

    menuButtons.forEach((button) => {
        const menuId = button.dataset.mobileMenuButton;
        const menu = document.getElementById(menuId);

        if (!menu) {
            return;
        }

        button.addEventListener("click", () => {
            const isOpen = menu.classList.toggle("open");

            button.setAttribute(
                "aria-expanded",
                String(isOpen)
            );
        });
    });
}

/**
 * 알림 메시지를 일정 시간 후 자동으로 숨긴다.
 *
 * 예:
 * <div class="alert_message" data-auto-close="3000">
 *     저장되었습니다.
 * </div>
 */
function initAlertMessages() {
    const alertMessages = document.querySelectorAll(
        ".alert_message[data-auto-close]"
    );

    alertMessages.forEach((message) => {
        const delay = Number(message.dataset.autoClose);

        if (!Number.isFinite(delay) || delay <= 0) {
            return;
        }

        window.setTimeout(() => {
            message.classList.add("hide");

            window.setTimeout(() => {
                message.remove();
            }, 300);
        }, delay);
    });
}

/**
 * 삭제나 로그아웃처럼 확인이 필요한 링크와 버튼 처리
 *
 * 예:
 * <a href="/logout"
 *    data-confirm="로그아웃하시겠습니까?">
 *    로그아웃
 * </a>
 */
function initConfirmActions() {
    const confirmTargets = document.querySelectorAll(
        "[data-confirm]"
    );

    confirmTargets.forEach((target) => {
        target.addEventListener("click", (event) => {
            const message =
                target.dataset.confirm || "계속 진행하시겠습니까?";

            const confirmed = window.confirm(message);

            if (!confirmed) {
                event.preventDefault();
            }
        });
    });
}

/**
 * 현재 URL에 해당하는 메뉴에 active 클래스를 적용한다.
 *
 * data-nav-prefix 값으로 목록, 작성, 수정 페이지를
 * 하나의 메뉴 그룹으로 처리한다.
 */
function setActiveNavigation() {

    const links =
        document.querySelectorAll("[data-nav-link]");

    const currentPath =
        normalizePath(window.location.pathname);

    links.forEach((link) => {

        const contextPath =
            new URL(
                link.href,
                window.location.origin
            ).pathname;

        const linkElementPath =
            normalizePath(contextPath);

        const navPrefix =
            link.dataset.navPrefix;

        const applicationContextPath =
            linkElementPath.substring(
                0,
                linkElementPath.indexOf(
                    navPrefix
                )
            );

        const fullPrefix =
            `${applicationContextPath}${navPrefix}`;

        const isActive =
            currentPath === linkElementPath
            || currentPath.startsWith(
                `${fullPrefix}/`
            )
            || currentPath === fullPrefix;

        link.classList.toggle(
            "active",
            isActive
        );

    });

}

function normalizePath(path) {
    if (!path || path === "/") {
        return "/";
    }

    return path.endsWith("/")
        ? path.slice(0, -1)
        : path;
}