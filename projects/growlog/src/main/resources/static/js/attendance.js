document.addEventListener("DOMContentLoaded", () => {

    /* ========================================
       출석 달력에 필요한 HTML 요소
    ======================================== */

    const calendarElement =
        document.getElementById("attendanceCalendar");

    const currentMonthElement =
        document.getElementById("calendarCurrentMonth");

    const previousMonthButton =
        document.getElementById("previousMonthButton");

    const nextMonthButton =
        document.getElementById("nextMonthButton");

    /*
     * 페이지에 달력 요소가 존재하지 않으면
     * 이후 코드를 실행하지 않는다.
     */
    if (
        !calendarElement ||
        !currentMonthElement ||
        !previousMonthButton ||
        !nextMonthButton
    ) {
        return;
    }


    // JSP에서 window.attendanceData로 전달한 이번 달 춣석 날짜 배열을 가져온다.
    // 서버 데이터가 없거나 비어 있는 경우를 대비하여 기본값으로 빈 배열을 사용
    const attendedDays = window.attendanceData?.attendedDays || [];


    /* ========================================
       현재 날짜 및 달력에 표시할 연월
    ======================================== */

    // 오늘 날짜
    const today = new Date();

    // 달력을 처음 열었을 때 표시할 연도와 월
    let displayedYear = today.getFullYear();
    let displayedMonth = today.getMonth();



    /**
     * 전달받은 연월을 기준으로 달력을 생성한다.
     *
     * 현재 서버에서는 이번 달 출석 날짜만 전달하므로
     * 현재 달을 보고 있을 때만 출석 표시를 적용한다.
     *
     * @param {number} year 달력에 표시할 연도
     * @param {number} month 달력에 표시할 월
     *                       0은 1월, 11은 12월이다.
     */
    function renderCalendar(year, month) {

        // 기존에 만들어진 날짜 칸을 모두 비운다.
        calendarElement.innerHTML = "";

        // 상단에 표시할 연월을 설정한다.
        currentMonthElement.textContent =
            `${year}년 ${month + 1}월`;

        /*
         * 해당 월의 1일이 무슨 요일인지 확인한다.
         * 일요일은 0, 토요일은 6이다.
         */
        const firstDayOfWeek =
            new Date(year, month, 1).getDay();

        // 해당 월의 마지막 날짜를 구한다.
        const lastDate =
            new Date(year, month + 1, 0).getDate();


        /**
         * 현재 서버가 전달한 attendedDays는 이번 달 데이터다.
         *
         * 따라서 현재 달을 조회할 때만 출석 날짜를 사용하고,
         * 다른 월을 조회할 때는 빈배열을 사용한다.
         *
         */

        const isCurrentMonth =
            year === today.getFullYear() &&
            month === today.getMonth();

        const displayedAttendedDays = isCurrentMonth ? attendedDays : [];


        /* ========================================
           첫째 주 앞부분의 빈 날짜 생성
        ======================================== */

        for (let emptyIndex = 0;
             emptyIndex < firstDayOfWeek;
             emptyIndex++) {

            const emptyDay =
                document.createElement("div");

            emptyDay.classList.add(
                "calendar_day",
                "empty_day"
            );

            emptyDay.setAttribute(
                "aria-hidden",
                "true"
            );

            calendarElement.appendChild(emptyDay);
        }


        /* ========================================
           해당 월의 실제 날짜 생성
        ======================================== */

        for (let day = 1; day <= lastDate; day++) {

            const dayElement =
                document.createElement("div");

            const dayNumberElement =
                document.createElement("span");

            const currentDate =
                new Date(year, month, day);

            const dayOfWeek =
                currentDate.getDay();

            dayElement.classList.add("calendar_day");
            dayNumberElement.classList.add(
                "calendar_day_number"
            );

            dayNumberElement.textContent = day;

            // 일요일과 토요일에 별도 색상을 적용한다.
            if (dayOfWeek === 0) {
                dayElement.classList.add("sunday");
            }

            if (dayOfWeek === 6) {
                dayElement.classList.add("saturday");
            }


            /* 오늘 날짜인지 확인한다. */

            const isToday =
                year === today.getFullYear() &&
                month === today.getMonth() &&
                day === today.getDate();

            if (isToday) {
                dayElement.classList.add("today");
            }


            /* 임시 출석 기록에 포함된 날짜인지 확인한다. */

            const isAttended =
                displayedAttendedDays.includes(day);

            if (isAttended) {
                dayElement.classList.add("attended");
            }


            /* 오늘보다 미래인 날짜인지 확인한다. */

            const todayWithoutTime =
                new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    today.getDate()
                );

            if (currentDate > todayWithoutTime) {
                dayElement.classList.add("future_day");
            }


            /* 스크린리더에서 날짜 상태를 확인할 수 있도록 설정한다. */

            let attendanceDescription =
                `${year}년 ${month + 1}월 ${day}일`;

            if (isToday) {
                attendanceDescription += ", 오늘";
            }

            if (isAttended) {
                attendanceDescription += ", 출석 완료";
            }

            dayElement.setAttribute(
                "aria-label",
                attendanceDescription
            );

            dayElement.appendChild(dayNumberElement);
            calendarElement.appendChild(dayElement);
        }
    }


    /* ========================================
       이전 달 이동
    ======================================== */

    previousMonthButton.addEventListener("click", () => {

        displayedMonth--;

        /*
         * 1월에서 이전 달을 누르면
         * 이전 연도의 12월로 이동한다.
         */
        if (displayedMonth < 0) {
            displayedMonth = 11;
            displayedYear--;
        }

        renderCalendar(
            displayedYear,
            displayedMonth
        );
    });


    /* ========================================
       다음 달 이동
    ======================================== */

    nextMonthButton.addEventListener("click", () => {

        displayedMonth++;

        /*
         * 12월에서 다음 달을 누르면
         * 다음 연도의 1월로 이동한다.
         */
        if (displayedMonth > 11) {
            displayedMonth = 0;
            displayedYear++;
        }

        renderCalendar(
            displayedYear,
            displayedMonth
        );
    });


    /* 페이지가 처음 열릴 때 현재 월의 달력을 출력한다. */
    renderCalendar(
        displayedYear,
        displayedMonth
    );
});