"use strict";

document.addEventListener("DOMContentLoaded", () => {
    initProgressBars();
});

function initProgressBars() {

    const progressBars =
        document.querySelectorAll(".progress_bar span");

    progressBars.forEach((bar) => {

        const width = bar.style.width;

        bar.style.width = "0";

        requestAnimationFrame(() => {

            requestAnimationFrame(() => {

                bar.style.width = width;

            });

        });

    });


}

/*
 * 홈 대시보드의 연속 출석 카드를 클릭하면
 * 마이페이지의 출석 현황 화면으로 이동한다.
 */
const attendanceCard = document.querySelector(".attendance_card");

if (attendanceCard) {

    attendanceCard.addEventListener("click", function () {

        location.href = "/mypage/attendance";

    });

}


