package kr.co.growlog.growlog_project.dto;


import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class AttendanceSummary {

    // 현재 연속 출석 일수
    private int currentStreak;

    // 오늘 출석 완료 여부
    private boolean attendedToday;

    // 전체 기간 중 가장 길었던 연속 출석일
    private int bestStreak;

    // 조회한 달에 출석한 날짜수
    private int monthlyAttendanceCount;

    // 달력에 표시할 출석 날짜 목록 (ex [1, 2, 5, 10, 11])
    private List<Integer> attendedDays;
}
