"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const joinForm = document.querySelector(".join_form");

    if (!joinForm) {
        return;
    }

    /*
     * Spring Security가 발급한 CSRF 토큰을 JSP의 meta 태그에서 읽는다.
     * JSON POST 요청은 일반 form처럼 hidden input이 자동 전송되지 않으므로
     * 서버가 알려준 헤더 이름으로 토큰을 직접 전달해야 한다.
     */
    const csrfToken =
        document.querySelector('meta[name="_csrf"]')?.content;

    const csrfHeaderName =
        document.querySelector('meta[name="_csrf_header"]')?.content;

    /* ========================================
       입력 요소
    ======================================== */

    const passwordInput =
        document.querySelector("#password");

    const passwordCheckInput =
        document.querySelector("#passwordCheck");

    const usernameInput =
        document.querySelector("#username");

    const nicknameInput =
        document.querySelector("#nickname");

    const emailInput =
        document.querySelector("#email");

    const emailCodeInput =
        document.querySelector("#emailCode");

    const nicknameCheckButton =
        document.querySelector("#nicknameCheckBtn");

    const emailSendButton =
        document.querySelector("#emailSendBtn");

    const emailCodeCheckButton =
        document.querySelector("#emailCodeCheckBtn");


    /* ========================================
       검사 완료 상태
    ======================================== */

    const checkState = {
        nicknameChecked: false,
        emailCodeSent: false,
        emailVerified: false
    };


    /* ========================================
       정규식
    ======================================== */

    /*
     * 영문, 숫자, 특수문자를 각각 하나 이상 포함한 8~20자
     * 사용 가능한 특수문자: ! @ # $ % ^ & *
     */
    const passwordPattern =
        /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,20}$/;

    // 한글 또는 영문 2~20자
    const usernamePattern =
        /^[가-힣a-zA-Z]{2,20}$/;

    // 한글, 영문, 숫자 2~12자
    const nicknamePattern =
        /^[가-힣a-zA-Z0-9]{2,12}$/;

    // 일반적인 이메일 형식
    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    /* ========================================
       메시지 출력 함수
    ======================================== */

    function getFormGroup(input) {
        if (!input) {
            return null;
        }

        return input.closest(".form_group");
    }

    function getMessageElement(input) {
        const formGroup = getFormGroup(input);

        if (!formGroup) {
            return null;
        }

        return formGroup.querySelector(".form_message");
    }

    function showError(input, message) {
        const formGroup = getFormGroup(input);
        const messageElement = getMessageElement(input);

        if (!formGroup || !messageElement) {
            return;
        }

        formGroup.classList.remove("has_success");
        formGroup.classList.add("has_error");

        messageElement.textContent = message;
        messageElement.classList.remove("success");
        messageElement.classList.add("error");
    }

    function showSuccess(input, message) {
        const formGroup = getFormGroup(input);
        const messageElement = getMessageElement(input);

        if (!formGroup || !messageElement) {
            return;
        }

        formGroup.classList.remove("has_error");
        formGroup.classList.add("has_success");

        messageElement.textContent = message;
        messageElement.classList.remove("error");
        messageElement.classList.add("success");
    }

    function clearMessage(input) {
        const formGroup = getFormGroup(input);
        const messageElement = getMessageElement(input);

        if (!formGroup || !messageElement) {
            return;
        }

        formGroup.classList.remove(
            "has_error",
            "has_success"
        );

        messageElement.textContent = "";
        messageElement.classList.remove(
            "error",
            "success"
        );
    }


    /* ========================================
       개별 입력값 검사
    ======================================== */

    function validatePassword() {
        const password = passwordInput.value;

        if (password === "") {
            showError(
                passwordInput,
                "비밀번호를 입력해주세요."
            );

            return false;
        }

        if (!passwordPattern.test(password)) {
            showError(
                passwordInput,
                "비밀번호는 영문, 숫자, 특수문자를 포함하여 8~20자로 입력해주세요."
            );

            return false;
        }

        showSuccess(
            passwordInput,
            "사용 가능한 비밀번호입니다."
        );

        return true;
    }

    function validatePasswordCheck() {
        const password = passwordInput.value;
        const passwordCheck =
            passwordCheckInput.value;

        if (passwordCheck === "") {
            showError(
                passwordCheckInput,
                "비밀번호를 다시 입력해주세요."
            );

            return false;
        }

        if (password !== passwordCheck) {
            showError(
                passwordCheckInput,
                "비밀번호가 일치하지 않습니다."
            );

            return false;
        }

        showSuccess(
            passwordCheckInput,
            "비밀번호가 일치합니다."
        );

        return true;
    }

    function validateUsername() {
        const username =
            usernameInput.value.trim();

        if (username === "") {
            showError(
                usernameInput,
                "이름을 입력해주세요."
            );

            return false;
        }

        if (!usernamePattern.test(username)) {
            showError(
                usernameInput,
                "이름은 한글 또는 영문 2~20자로 입력해주세요."
            );

            return false;
        }

        showSuccess(
            usernameInput,
            "사용 가능한 이름입니다."
        );

        return true;
    }

    function validateNickname() {
        const nickname =
            nicknameInput.value.trim();

        if (nickname === "") {
            showError(
                nicknameInput,
                "닉네임을 입력해주세요."
            );

            return false;
        }

        if (!nicknamePattern.test(nickname)) {
            showError(
                nicknameInput,
                "닉네임은 한글, 영문, 숫자를 사용하여 2~12자로 입력해주세요."
            );

            return false;
        }

        showSuccess(
            nicknameInput,
            "사용 가능한 형식의 닉네임입니다."
        );

        return true;
    }

    function validateEmail() {
        const email =
            emailInput.value.trim();

        if (email === "") {
            showError(
                emailInput,
                "이메일을 입력해주세요."
            );

            return false;
        }

        if (!emailPattern.test(email)) {
            showError(
                emailInput,
                "올바른 이메일 형식으로 입력해주세요."
            );

            return false;
        }

        showSuccess(
            emailInput,
            "사용 가능한 이메일 형식입니다."
        );

        return true;
    }


    /* ========================================
       이메일 인증 상태 초기화
    ======================================== */

    function resetEmailVerification() {
        checkState.emailCodeSent = false;
        checkState.emailVerified = false;

        if (emailSendButton) {
            emailSendButton.disabled = false;
            emailSendButton.textContent = "인증번호";
        }

        if (emailCodeInput) {
            emailCodeInput.value = "";
            emailCodeInput.readOnly = false;

            clearMessage(emailCodeInput);
        }

        if (emailCodeCheckButton) {
            emailCodeCheckButton.disabled = false;
            emailCodeCheckButton.textContent = "확인";
        }
    }


    /* ========================================
       입력 이벤트
    ======================================== */

    if (passwordInput) {
        passwordInput.addEventListener(
            "input",
            () => {
                if (passwordInput.value === "") {
                    clearMessage(passwordInput);
                } else {
                    validatePassword();
                }

                if (
                    passwordCheckInput &&
                    passwordCheckInput.value !== ""
                ) {
                    validatePasswordCheck();
                }
            }
        );
    }

    if (passwordCheckInput) {
        passwordCheckInput.addEventListener(
            "input",
            () => {
                if (
                    passwordCheckInput.value === ""
                ) {
                    clearMessage(
                        passwordCheckInput
                    );

                    return;
                }

                validatePasswordCheck();
            }
        );
    }

    if (usernameInput) {
        usernameInput.addEventListener(
            "input",
            () => {
                if (
                    usernameInput.value.trim() === ""
                ) {
                    clearMessage(usernameInput);
                    return;
                }

                validateUsername();
            }
        );
    }

    if (nicknameInput) {
        nicknameInput.addEventListener(
            "input",
            () => {
                checkState.nicknameChecked = false;

                if (nicknameCheckButton) {
                    nicknameCheckButton.textContent =
                        "중복확인";
                }

                if (
                    nicknameInput.value.trim() === ""
                ) {
                    clearMessage(nicknameInput);
                    return;
                }

                validateNickname();
            }
        );
    }

    if (emailInput) {
        emailInput.addEventListener(
            "input",
            () => {
                resetEmailVerification();

                if (
                    emailInput.value.trim() === ""
                ) {
                    clearMessage(emailInput);
                    return;
                }

                validateEmail();
            }
        );
    }

    if (emailCodeInput) {
        emailCodeInput.addEventListener(
            "input",
            () => {
                emailCodeInput.value =
                    emailCodeInput.value
                        .replace(/[^0-9]/g, "")
                        .slice(0, 6);

                checkState.emailVerified = false;

                if (
                    emailCodeInput.value.trim() === ""
                ) {
                    clearMessage(emailCodeInput);
                }
            }
        );
    }


    /* ========================================
       닉네임 중복확인
    ======================================== */

    if (nicknameCheckButton) {
        nicknameCheckButton.addEventListener(
            "click",
            async () => {
                if (!validateNickname()) {
                    nicknameInput.focus();
                    return;
                }

                const nickname =
                    nicknameInput.value.trim();

                try {
                    nicknameCheckButton.disabled =
                        true;

                    nicknameCheckButton.textContent =
                        "확인 중";

                    /*
                     * 닉네임 중복확인 API 예시
                     *
                     * 서버 응답 형식:
                     * {
                     *     "duplicated": false,
                     *     "message": "사용 가능한 닉네임입니다."
                     * }
                     */

                    const response = await fetch(
                        `${contextPath}/api/members/check-nickname?nickname=${encodeURIComponent(nickname)}`
                    );

                    if (!response.ok) {
                        throw new Error(
                            "닉네임 중복확인 요청에 실패했습니다."
                        );
                    }

                    const data =
                        await response.json();

                    if (data.duplicated) {
                        checkState.nicknameChecked =
                            false;

                        showError(
                            nicknameInput,
                            data.message ||
                            "이미 사용 중인 닉네임입니다."
                        );

                        return;
                    }

                    checkState.nicknameChecked = true;

                    showSuccess(
                        nicknameInput,
                        data.message ||
                        `"${nickname}"은(는) 사용 가능한 닉네임입니다.`
                    );

                    nicknameCheckButton.textContent =
                        "확인완료";

                } catch (error) {
                    checkState.nicknameChecked = false;

                    showError(
                        nicknameInput,
                        error.message ||
                        "닉네임 중복확인 중 오류가 발생했습니다."
                    );

                } finally {
                    nicknameCheckButton.disabled =
                        false;

                    if (
                        !checkState.nicknameChecked
                    ) {
                        nicknameCheckButton.textContent =
                            "중복확인";
                    }
                }
            }
        );
    }


    /* ========================================
       이메일 인증번호 발송
    ======================================== */

    if (emailSendButton) {
        emailSendButton.addEventListener(
            "click",
            async () => {
                if (!validateEmail()) {
                    emailInput.focus();
                    return;
                }

                const email =
                    emailInput.value.trim();

                try {
                    emailSendButton.disabled = true;
                    emailSendButton.textContent =
                        "발송 중";

                    const response = await fetch(
                        `${contextPath}/api/email/send-code`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/json",
                                [csrfHeaderName]:
                                    csrfToken
                            },
                            body: JSON.stringify({
                                email: email
                            })
                        }
                    );

                    if (!response.ok) {
                        throw new Error(
                            "인증번호 발송 요청에 실패했습니다."
                        );
                    }

                    const data =
                        await response.json();

                    if (!data.success) {
                        checkState.emailCodeSent =
                            false;

                        checkState.emailVerified =
                            false;

                        showError(
                            emailInput,
                            data.message ||
                            "인증번호 발송에 실패했습니다."
                        );

                        return;
                    }

                    checkState.emailCodeSent = true;
                    checkState.emailVerified = false;

                    showSuccess(
                        emailInput,
                        data.message ||
                        `${email} 주소로 인증번호를 발송했습니다.`
                    );

                    emailSendButton.textContent =
                        "재발송";

                    if (emailCodeInput) {
                        emailCodeInput.value = "";
                        emailCodeInput.readOnly =
                            false;

                        clearMessage(
                            emailCodeInput
                        );

                        emailCodeInput.focus();
                    }

                    if (emailCodeCheckButton) {
                        emailCodeCheckButton.disabled =
                            false;

                        emailCodeCheckButton.textContent =
                            "확인";
                    }

                } catch (error) {
                    checkState.emailCodeSent = false;
                    checkState.emailVerified = false;

                    showError(
                        emailInput,
                        error.message ||
                        "인증번호 발송 중 오류가 발생했습니다."
                    );

                    emailSendButton.textContent =
                        "인증번호";

                } finally {
                    emailSendButton.disabled = false;
                }
            }
        );
    }


    /* ========================================
       이메일 인증번호 확인
    ======================================== */

    if (
        emailCodeCheckButton &&
        emailCodeInput
    ) {
        emailCodeCheckButton.addEventListener(
            "click",
            async () => {
                const email =
                    emailInput.value.trim();

                const inputCode =
                    emailCodeInput.value.trim();

                if (!validateEmail()) {
                    emailInput.focus();
                    return;
                }

                if (!checkState.emailCodeSent) {
                    showError(
                        emailCodeInput,
                        "먼저 이메일 인증번호를 발송해주세요."
                    );

                    emailInput.focus();
                    return;
                }

                if (inputCode === "") {
                    showError(
                        emailCodeInput,
                        "인증번호를 입력해주세요."
                    );

                    emailCodeInput.focus();
                    return;
                }

                if (!/^\d{6}$/.test(inputCode)) {
                    showError(
                        emailCodeInput,
                        "인증번호 6자리를 숫자로 입력해주세요."
                    );

                    emailCodeInput.focus();
                    return;
                }

                try {
                    emailCodeCheckButton.disabled =
                        true;

                    emailCodeCheckButton.textContent =
                        "확인 중";

                    const response = await fetch(
                        `${contextPath}/api/email/verify-code`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/json",
                                [csrfHeaderName]:
                                    csrfToken
                            },
                            body: JSON.stringify({
                                email: email,
                                emailCode: inputCode
                            })
                        }
                    );

                    if (!response.ok) {
                        throw new Error(
                            "인증번호 확인 요청에 실패했습니다."
                        );
                    }

                    const data =
                        await response.json();

                    if (!data.success) {
                        checkState.emailVerified =
                            false;

                        showError(
                            emailCodeInput,
                            data.message ||
                            "인증번호가 일치하지 않거나 만료되었습니다."
                        );

                        return;
                    }

                    checkState.emailVerified = true;

                    showSuccess(
                        emailCodeInput,
                        data.message ||
                        "이메일 인증이 완료되었습니다."
                    );

                    emailCodeInput.readOnly = true;
                    emailInput.readOnly = true;

                    emailCodeCheckButton.disabled =
                        true;

                    emailCodeCheckButton.textContent =
                        "인증완료";

                    if (emailSendButton) {
                        emailSendButton.disabled =
                            true;
                    }

                } catch (error) {
                    checkState.emailVerified = false;

                    showError(
                        emailCodeInput,
                        error.message ||
                        "인증번호 확인 중 오류가 발생했습니다."
                    );

                } finally {
                    if (
                        !checkState.emailVerified
                    ) {
                        emailCodeCheckButton.disabled =
                            false;

                        emailCodeCheckButton.textContent =
                            "확인";
                    }
                }
            }
        );
    }


    /* ========================================
       최종 회원가입 제출 검사
    ======================================== */

    joinForm.addEventListener(
        "submit",
        (event) => {
            event.preventDefault();

            const validationResults = [
                validatePassword(),
                validatePasswordCheck(),
                validateUsername(),
                validateNickname(),
                validateEmail()
            ];

            const allInputsValid =
                validationResults.every(
                    (result) => result === true
                );

            if (!allInputsValid) {
                const firstErrorInput =
                    joinForm.querySelector(
                        ".form_group.has_error input"
                    );

                if (firstErrorInput) {
                    firstErrorInput.focus();

                    firstErrorInput.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });
                }

                return;
            }

            if (!checkState.nicknameChecked) {
                showError(
                    nicknameInput,
                    "닉네임 중복확인을 진행해주세요."
                );

                nicknameInput.focus();
                return;
            }

            if (!checkState.emailVerified) {
                showError(
                    emailCodeInput,
                    "이메일 인증을 완료해주세요."
                );

                emailCodeInput.focus();
                return;
            }

            const isConfirmed = window.confirm(
                "입력한 정보로 회원가입을 진행하시겠습니까?"
            );

            if (!isConfirmed) {
                return;
            }

            joinForm.submit();
        }
    );
});
