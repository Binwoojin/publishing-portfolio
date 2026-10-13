package kr.co.growlog.growlog_project.service;

import kr.co.growlog.growlog_project.dto.AttendanceSummary;
import kr.co.growlog.growlog_project.entity.Goal;
import kr.co.growlog.growlog_project.entity.GrowthRecord;
import kr.co.growlog.growlog_project.repository.GoalRepository;
import kr.co.growlog.growlog_project.repository.GrowthRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cglib.core.Local;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Year;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final GoalRepository goalRepository;
    private final GrowthRecordRepository growthRecordRepository;

    // 로그인한 회원의 현재 출석 상태를 계산

    // 출석 인정 조건
    // 1. 해당 날짜에 목표를 1개 이상 등록했거나
    // 2. 해당 날짜에 성장 기록을 1개 이상 등록한 경우
    public AttendanceSummary getAttendanceSummary(Long memberNo) {

        // 로그인한 회원이 등록한 목표 전체를 최신순으로 조회
        List<Goal> goals = goalRepository.findByMemberMemberNoOrderByCreatedAtDesc(memberNo);

        // 로그인한 회원이 등록한 성장 기록 전체를 최신순으로 조회
        List<GrowthRecord> records = growthRecordRepository.findByMemberMemberNoOrderByCreatedAtDesc(memberNo);

        // 목표 또는 성장 기록을 등록한 날짜를 출석일로 저장

        // Set은 중복 값을 허용하지 않기 때문에
        // 같은 날 목표와 기록을 모두 등록했더라도 하루 출석으로 계산
        Set<LocalDate> attendanceDates = new HashSet<>();

        // 목표 등록일을 출석 날짜에 추가
        for (Goal goal : goals) {
            LocalDate goalDate = goal.getCreatedAt().toLocalDate();
            attendanceDates.add(goalDate);
        }

        // 성장 기록 등록일을 출석 날짜에 추가
        for (GrowthRecord record : records) {
            LocalDate recordDate = record.getCreatedAt().toLocalDate();
            attendanceDates.add(recordDate);
        }

        LocalDate today = LocalDate.now();

        // 현재 조회 대상 월은 이번 달로 설정
        YearMonth currentMonth = YearMonth.from(today);

        // 오늘 목표 또는 성장 기록을 등록했는지 확인
        boolean attendedToday = attendanceDates.contains(today);

        // 현재 이어지고 있는 연속 출석일을 계산
        int currentStreak = calculateCurrentStreak(attendanceDates, today, attendedToday);

        // 전체 출석 기간 중 가장 길었던 연속 기록을 계산
        int bestStreak = calculateCurrentStreak(attendanceDates);

        // 이번 달 출석 날짜만 숫자 형태로 추출
        // ex) 2026-07-01 -> 1 | 2026-07-05 -> 5
        List<Integer> attendedDays = attendanceDates.stream().filter(date -> YearMonth.from(date).equals(currentMonth))
                .map(LocalDate::getDayOfMonth).sorted().toList();

        // 이번 달 출석 횟수는 출석 날짜 목록의 크기와 같다
        int monthlyAttendanceCount = attendedDays.size();

        return new AttendanceSummary(currentStreak, attendedToday, bestStreak, monthlyAttendanceCount, attendedDays);
    }

    // 현재 이어지고 있는 연속 출석일을 계산
    // 오늘 출석했다면 오늘부터 확인하고,
    // 오늘 아직 출석하지 않았다면 어제부터 확인
    private int calculateCurrentStreak(Set<LocalDate> attendanceDates,
                                       LocalDate today,
                                       boolean attendedToday) {
        // 오늘 축석을 완료한 경우 오늘부터 계산
        // 오늘 아직 출석하지 않은 경우에는 하루가 끝나지 않았으므로
        // 어제부터 연속 일수를 계산
        LocalDate checkDate = attendedToday
                ? today
                : today.minusDays(1);

        int currentStreak = 0;

        // 출석일이 끊기기 전까지 이전 날짜를 하루씩 확인
        while (attendanceDates.contains(checkDate)) {
            currentStreak++;
            checkDate = checkDate.minusDays(1);
        }

        return currentStreak;
    }

    // 전체 출석 날짜를 기준으로 가장 긴 연속 출석일을 계산
    private int calculateCurrentStreak(Set<LocalDate> attendanceDates) {
        // 출석 기록이 없으면 최고 연속 기록도 0일
        if (attendanceDates.isEmpty()) {
            return 0;
        }

        // 날짜 비교를 위해 출석일을 오름차순으로 정렬
        List<LocalDate> sortedDates = new ArrayList<>(attendanceDates);
        sortedDates.sort(LocalDate::compareTo);

        int bestStreak = 1;
        int streak = 1;

        // 두 번째 날짜부터 바로 이전 날짜와 비교
        // 이전 날짜의 다음 날과 현재 날짜가 같다면 연속 출석으로 판단
        for (int index = 1; index < sortedDates.size(); index++) {
            LocalDate previousDate = sortedDates.get(index - 1);
            LocalDate currentDate = sortedDates.get(index);

            if (currentDate.equals(previousDate.plusDays(1))) {
                streak++;
            } else {
                streak = 1;
            }

            // 지금까지 계산한 가장 큰 연속 기록을 저장
            bestStreak = Math.max(bestStreak, streak);
        }

        return bestStreak;

    }
}
