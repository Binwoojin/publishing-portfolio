package kr.co.growlog.growlog_project.service;

import java.util.List;
import kr.co.growlog.growlog_project.dto.AttendanceSummary;
import kr.co.growlog.growlog_project.dto.BadgeCollection;
import kr.co.growlog.growlog_project.dto.BadgeView;
import kr.co.growlog.growlog_project.entity.Goal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BadgeService {
    private static final int[] COUNT_MILESTONES = {10, 20, 50, 100, 200};
    private static final int[] ATTENDANCE_MILESTONES = {1, 7, 30, 100, 200, 365};

    private final GoalService goalService;
    private final GrowthRecordService growthRecordService;
    private final AttendanceService attendanceService;

    public BadgeCollection getBadgeCollection(Long memberNo) {
        List<Goal> goals = goalService.findGoalsByMember(memberNo);
        long goalCount = goals.size();
        long recordCount = growthRecordService.countRecordByMember(memberNo);
        long completedGoalCount = goals.stream().filter(this::isCompleted).count();
        AttendanceSummary attendance = attendanceService.getAttendanceSummary(memberNo);

        List<BadgeView> coreBadges = List.of(
                badge("core", "첫 목표 등록", "첫 번째 목표를 등록했어요.", "core-01.png", goalCount, 1),
                badge("core", "첫 성장 기록", "첫 번째 성장 기록을 남겼어요.", "core-02.png", recordCount, 1),
                badge("core", "첫 목표 달성", "목표 하나를 끝까지 달성했어요.", "core-03.png", completedGoalCount, 1)
        );

        List<BadgeView> attendanceBadges = java.util.stream.IntStream
                .range(0, ATTENDANCE_MILESTONES.length)
                .mapToObj(index -> {
                    int milestone = ATTENDANCE_MILESTONES[index];
                    String title = milestone == 1 ? "첫 출석" : milestone + "일 연속 출석";
                    String description = milestone == 1
                            ? "GrowLog에 첫 성장 발자국을 남겼어요."
                            : milestone + "일 동안 성장 습관을 이어갔어요.";
                    return badge("attendance", title, description,
                            String.format("attendance-%02d.png", index + 1),
                            attendance.getBestStreak(), milestone);
                })
                .toList();

        return new BadgeCollection(
                coreBadges,
                attendanceBadges,
                countBadges("goals", "목표", goalCount),
                countBadges("records", "성장 기록", recordCount)
        );
    }

    private List<BadgeView> countBadges(String category, String label, long currentValue) {
        return java.util.stream.IntStream.range(0, COUNT_MILESTONES.length)
                .mapToObj(index -> {
                    int milestone = COUNT_MILESTONES[index];
                    return badge(category,
                            label + " " + milestone + "개",
                            label + "을 " + milestone + "개 등록했어요.",
                            String.format("%s-%02d.png", category, index + 1),
                            currentValue, milestone);
                })
                .toList();
    }

    private BadgeView badge(String category, String title, String description,
                            String fileName, long currentValue, long targetValue) {
        return new BadgeView(category, title, description,
                "/images/badges/" + fileName, currentValue, targetValue);
    }

    private boolean isCompleted(Goal goal) {
        return "완료".equals(goal.getGoalStatus())
                || (goal.getGoalProgress() != null && goal.getGoalProgress() >= 100);
    }
}
