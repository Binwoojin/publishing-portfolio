document.addEventListener("DOMContentLoaded", () => {

    /* ========================================
       공통 context path
    ======================================== */

    /*
     * settings.jsp에서 전달한 context path를 가져온다.
     * 프로젝트가 루트 경로에서 실행되면 빈 문자열일 수도 있다.
     */
    const contextPath = window.contextPath || "";


    /* ========================================
       닉네임 중복 확인
    ======================================== */

    const nicknameInput =
        document.getElementById("nickname");

    const nicknameCheckButton =
        document.getElementById("nicknameCheckButton");

    const nicknameCheckMessage =
        document.getElementById("nicknameCheckMessage");

    const nicknameSaveButton =
        document.getElementById("nicknameSaveButton");

    const nicknameUpdateForm =
        document.getElementById("nicknameUpdateForm");

    /*
     * 닉네임 관련 요소가 모두 존재할 때만
     * 중복 확인 기능을 실행한다.
     */
    if (
        nicknameInput &&
        nicknameCheckButton &&
        nicknameCheckMessage &&
        nicknameSaveButton &&
        nicknameUpdateForm
    ) {

        // 중복 확인을 통과했는지 저장하는 상태값
        let nicknameChecked = false;


        /*
         * 사용자가 닉네임을 수정하면
         * 이전 중복 확인 결과는 더 이상 유효하지 않다.
         */
        nicknameInput.addEventListener("input", () => {

            nicknameChecked = false;

            nicknameSaveButton.disabled = true;

            nicknameCheckMessage.textContent =
                "닉네임 변경 후 중복 확인이 필요해요.";

            nicknameCheckMessage.className =
                "nickname_check_message";
        });


        /*
         * 닉네임 중복 확인 버튼 클릭
         */
        nicknameCheckButton.addEventListener(
            "click",
            async () => {

                const nickname =
                    nicknameInput.value.trim();

                /*
                 * 닉네임 기본 길이 검사
                 */
                if (nickname.length < 2) {
                    nicknameCheckMessage.textContent =
                        "닉네임은 2자 이상 입력해주세요.";

                    nicknameCheckMessage.className =
                        "nickname_check_message error";

                    nicknameSaveButton.disabled = true;

                    return;
                }

                if (nickname.length > 30) {
                    nicknameCheckMessage.textContent =
                        "닉네임은 30자 이하로 입력해주세요.";

                    nicknameCheckMessage.className =
                        "nickname_check_message error";

                    nicknameSaveButton.disabled = true;

                    return;
                }


                try {

                    /*
                     * 계정 설정용 닉네임 중복 확인 API를 호출한다.
                     *
                     * 현재 로그인 회원 본인은 검사 대상에서 제외된다.
                     */
                    const response = await fetch(
                        `${contextPath}/api/members/check-nickname-update` +
                        `?nickname=${encodeURIComponent(nickname)}`,
                        {
                            method: "GET",
                            headers: {
                                "Accept": "application/json"
                            }
                        }
                    );


                    if (!response.ok) {
                        throw new Error(
                            "닉네임 중복 확인 요청에 실패했습니다."
                        );
                    }


                    const data = await response.json();

                    /*
                     * DuplicateCheckResponse 구조가
                     * duplicated, message라고 가정한다.
                     */
                    if (data.duplicated) {

                        nicknameChecked = false;

                        nicknameCheckMessage.textContent =
                            data.message ||
                            "이미 사용 중인 닉네임입니다.";

                        nicknameCheckMessage.className =
                            "nickname_check_message error";

                        nicknameSaveButton.disabled = true;

                    } else {

                        nicknameChecked = true;

                        nicknameCheckMessage.textContent =
                            data.message ||
                            "사용 가능한 닉네임입니다.";

                        nicknameCheckMessage.className =
                            "nickname_check_message success";

                        nicknameSaveButton.disabled = false;
                    }

                } catch (error) {

                    console.error(error);

                    nicknameChecked = false;

                    nicknameCheckMessage.textContent =
                        "중복 확인 중 오류가 발생했습니다.";

                    nicknameCheckMessage.className =
                        "nickname_check_message error";

                    nicknameSaveButton.disabled = true;
                }
            }
        );


        /*
         * 중복 확인 없이 form을 제출하는 것을 한 번 더 방지한다.
         */
        nicknameUpdateForm.addEventListener(
            "submit",
            (event) => {

                if (!nicknameChecked) {

                    event.preventDefault();

                    nicknameCheckMessage.textContent =
                        "닉네임 중복 확인을 먼저 진행해주세요.";

                    nicknameCheckMessage.className =
                        "nickname_check_message error";
                }
            }
        );
    }


    /* ========================================
       비밀번호 일치 여부 확인
    ======================================== */

    const currentPasswordInput =
        document.getElementById("currentPassword");

    const newPasswordInput =
        document.getElementById("newPassword");

    const newPasswordConfirmInput =
        document.getElementById("newPasswordConfirm");

    const passwordMatchMessage =
        document.getElementById("passwordMatchMessage");

    const passwordSaveButton =
        document.getElementById("passwordSaveButton");

    const passwordUpdateForm =
        document.getElementById("passwordUpdateForm");


    if (
        currentPasswordInput &&
        newPasswordInput &&
        newPasswordConfirmInput &&
        passwordMatchMessage &&
        passwordSaveButton &&
        passwordUpdateForm
    ) {

        /*
         * 비밀번호 입력 상태에 따라
         * 변경 버튼 활성화 여부를 판단한다.
         */
        function validatePasswordForm() {

            const currentPassword =
                currentPasswordInput.value;

            const newPassword =
                newPasswordInput.value;

            const newPasswordConfirm =
                newPasswordConfirmInput.value;


            /*
             * 새 비밀번호 확인값이 아직 비어 있으면
             * 안내 문구를 출력하지 않는다.
             */
            if (!newPasswordConfirm) {

                passwordMatchMessage.textContent = "";

                passwordMatchMessage.className =
                    "password_match_message";

                passwordSaveButton.disabled = true;

                return;
            }


            /*
             * 새 비밀번호 길이 검사
             */
            if (newPassword.length < 8) {

                passwordMatchMessage.textContent =
                    "새 비밀번호는 8자 이상 입력해주세요.";

                passwordMatchMessage.className =
                    "password_match_message error";

                passwordSaveButton.disabled = true;

                return;
            }


            /*
             * 새 비밀번호와 확인값 비교
             */
            if (newPassword !== newPasswordConfirm) {

                passwordMatchMessage.textContent =
                    "새 비밀번호가 일치하지 않습니다.";

                passwordMatchMessage.className =
                    "password_match_message error";

                passwordSaveButton.disabled = true;

                return;
            }


            passwordMatchMessage.textContent =
                "새 비밀번호가 일치합니다.";

            passwordMatchMessage.className =
                "password_match_message success";


            /*
             * 현재 비밀번호, 새 비밀번호,
             * 새 비밀번호 확인값이 모두 입력되었을 때만
             * 비밀번호 변경 버튼을 활성화한다.
             */
            const allFilled =
                currentPassword.length > 0 &&
                newPassword.length >= 8 &&
                newPasswordConfirm.length >= 8;

            passwordSaveButton.disabled = !allFilled;
        }


        currentPasswordInput.addEventListener(
            "input",
            validatePasswordForm
        );

        newPasswordInput.addEventListener(
            "input",
            validatePasswordForm
        );

        newPasswordConfirmInput.addEventListener(
            "input",
            validatePasswordForm
        );


        /*
         * form 제출 직전에
         * 새 비밀번호가 일치하는지 한 번 더 검사한다.
         */
        passwordUpdateForm.addEventListener(
            "submit",
            (event) => {

                const newPassword =
                    newPasswordInput.value;

                const newPasswordConfirm =
                    newPasswordConfirmInput.value;


                if (newPassword !== newPasswordConfirm) {

                    event.preventDefault();

                    passwordMatchMessage.textContent =
                        "새 비밀번호가 일치하지 않습니다.";

                    passwordMatchMessage.className =
                        "password_match_message error";

                    passwordSaveButton.disabled = true;
                }
            }
        );
    }


    /* ========================================
       초기화 버튼 처리
    ======================================== */

    const nicknameResetButton =
        document.getElementById("nicknameResetButton");

    const passwordResetButton =
        document.getElementById("passwordResetButton");


    if (
        nicknameResetButton &&
        nicknameInput &&
        nicknameCheckMessage &&
        nicknameSaveButton
    ) {

        nicknameResetButton.addEventListener(
            "click",
            () => {

                /*
                 * reset은 즉시 처리되지 않을 수 있어서
                 * 다음 이벤트 루프에서 상태를 초기화한다.
                 */
                setTimeout(() => {

                    nicknameCheckMessage.textContent =
                        "닉네임 변경 후 중복 확인이 필요해요.";

                    nicknameCheckMessage.className =
                        "nickname_check_message";

                    nicknameSaveButton.disabled = true;

                }, 0);
            }
        );
    }


    if (
        passwordResetButton &&
        passwordMatchMessage &&
        passwordSaveButton
    ) {

        passwordResetButton.addEventListener(
            "click",
            () => {

                setTimeout(() => {

                    passwordMatchMessage.textContent = "";

                    passwordMatchMessage.className =
                        "password_match_message";

                    passwordSaveButton.disabled = true;

                }, 0);
            }
        );
    }

});