"use strict";

document.addEventListener("DOMContentLoaded", () => {
    initLoginPage();
});

/**
 * 로그인 페이지 초기화
 */
function initLoginPage() {
    const loginForm = document.querySelector(".login_form");

    if (!loginForm) {
        return;
    }

    showJoinSuccessAlert();

    initPasswordToggle();
    initRememberEmail();
    initInputValidation(loginForm);
    initLoginSubmit(loginForm);
}

/**
 * 회원가입 성공 팝업
 */
function showJoinSuccessAlert() {
    const messageInput =
        document.querySelector("#joinSuccessMessage");

    if (!messageInput) {
        return;
    }

    const message = messageInput.value.trim();

    if (message === "") {
        return;
    }

    Swal.fire({
        icon: "success",
        title: "GrowLog 가입 완료!",
        html: `
            <p style="
                margin: 0;
                color: #667068;
                line-height: 1.7;
            ">
                ${message}<br>
                이제 오늘의 성장을 기록해보세요.
            </p>
        `,
        confirmButtonText: "로그인하기",
        confirmButtonColor: "#6BB678",
        background: "#FFFFFF",
        color: "#315538",
        width: 420,
        padding: "32px",
        allowOutsideClick: false,
        customClass: {
            popup: "growlog_alert",
            confirmButton: "growlog_alert_button"
        }
    });
}

/**
 * 비밀번호 보기/숨기기
 */
function initPasswordToggle() {
    const passwordInput = document.querySelector("#password");
    const passwordToggle = document.querySelector("#passwordToggle");

    if (!passwordInput || !passwordToggle) {
        return;
    }

    passwordToggle.addEventListener("click", () => {
        const isPasswordVisible = passwordInput.type === "text";

        if (isPasswordVisible) {
            passwordInput.type = "password";
            passwordToggle.textContent = "보기";
            passwordToggle.setAttribute("aria-label", "비밀번호 표시");
            passwordToggle.setAttribute("aria-pressed", "false");
        } else {
            passwordInput.type = "text";
            passwordToggle.textContent = "숨기기";
            passwordToggle.setAttribute("aria-label", "비밀번호 숨기기");
            passwordToggle.setAttribute("aria-pressed", "true");
        }

        passwordInput.focus();

        // 커서를 입력값 맨 뒤로 이동
        const passwordLength = passwordInput.value.length;
        passwordInput.setSelectionRange(passwordLength, passwordLength);
    });
}

/**
 * 이메일 기억하기
 *
 * localStorage에 이메일을 저장한다.
 * 비밀번호는 보안상 저장하지 않는다.
 */
function initRememberEmail() {
    const emailInput = document.querySelector("#email");
    const rememberEmailCheckbox = document.querySelector("#rememberEmail");

    if (!emailInput || !rememberEmailCheckbox) {
        return;
    }

    const savedEmail = localStorage.getItem("growlogSavedEmail");

    if (savedEmail) {
        emailInput.value = savedEmail;
        rememberEmailCheckbox.checked = true;
    }

    rememberEmailCheckbox.addEventListener("change", () => {
        /*
         * 체크를 해제하면 이전에 저장된 이메일을 즉시 삭제한다.
         */
        if (!rememberEmailCheckbox.checked) {
            localStorage.removeItem("growlogSavedEmail");
        }
    });
}

/**
 * 입력 중 오류 메시지 초기화 및 검사
 */
function initInputValidation(loginForm) {
    const emailInput = loginForm.querySelector("#email");
    const passwordInput = loginForm.querySelector("#password");

    if (emailInput) {
        emailInput.addEventListener("input", () => {
            clearInputError(emailInput);
        });

        emailInput.addEventListener("blur", () => {
            if (emailInput.value.trim() !== "") {
                validateEmail(emailInput);
            }
        });
    }

    if (passwordInput) {
        passwordInput.addEventListener("input", () => {
            clearInputError(passwordInput);
        });
    }
}

/**
 * 로그인 폼 제출 검사
 */
function initLoginSubmit(loginForm) {
    loginForm.addEventListener("submit", (event) => {
        const emailInput = loginForm.querySelector("#email");
        const passwordInput = loginForm.querySelector("#password");
        const rememberEmailCheckbox =
            loginForm.querySelector("#rememberEmail");

        const isEmailValid = validateEmail(emailInput);
        const isPasswordValid = validatePassword(passwordInput);

        if (!isEmailValid || !isPasswordValid) {
            event.preventDefault();

            const firstErrorInput = loginForm.querySelector(
                ".input_group.has_error input"
            );

            if (firstErrorInput) {
                firstErrorInput.focus();
            }

            return;
        }

        /*
         * 폼 제출 직전에 이메일 기억하기 상태를 저장한다.
         */
        if (rememberEmailCheckbox?.checked) {
            localStorage.setItem(
                "growlogSavedEmail",
                emailInput.value.trim()
            );
        } else {
            localStorage.removeItem("growlogSavedEmail");
        }

        /*
         * preventDefault()를 호출하지 않았으므로
         * JSP form의 action 주소로 정상 제출된다.
         */
    });
}

/**
 * 이메일 검사
 */
function validateEmail(emailInput) {
    if (!emailInput) {
        return false;
    }

    const email = emailInput.value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email === "") {
        showInputError(emailInput, "이메일을 입력해주세요.");
        return false;
    }

    if (!emailPattern.test(email)) {
        showInputError(
            emailInput,
            "올바른 이메일 형식으로 입력해주세요."
        );

        return false;
    }

    clearInputError(emailInput);
    return true;
}

/**
 * 비밀번호 검사
 *
 * 로그인 화면에서는 회원가입처럼 비밀번호 규칙을 다시 검사하지 않고,
 * 입력 여부만 확인한다.
 */
function validatePassword(passwordInput) {
    if (!passwordInput) {
        return false;
    }

    if (passwordInput.value.trim() === "") {
        showInputError(passwordInput, "비밀번호를 입력해주세요.");
        return false;
    }

    clearInputError(passwordInput);
    return true;
}

/**
 * 입력 오류 표시
 */
function showInputError(input, message) {
    const inputGroup = input.closest(".input_group");

    if (!inputGroup) {
        return;
    }

    const messageElement = inputGroup.querySelector(".input_message");

    inputGroup.classList.add("has_error");

    input.setAttribute("aria-invalid", "true");

    if (messageElement) {
        messageElement.textContent = message;
        messageElement.classList.add("error");
    }
}

/**
 * 입력 오류 제거
 */
function clearInputError(input) {
    const inputGroup = input.closest(".input_group");

    if (!inputGroup) {
        return;
    }

    const messageElement = inputGroup.querySelector(".input_message");

    inputGroup.classList.remove("has_error");

    input.removeAttribute("aria-invalid");

    if (messageElement) {
        messageElement.textContent = "";
        messageElement.classList.remove("error");
    }
}

