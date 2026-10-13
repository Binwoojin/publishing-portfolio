package kr.co.growlog.growlog_project.dto;

import java.util.List;
import lombok.Getter;

@Getter
public class BadgeCollection {
    private final List<BadgeView> coreBadges;
    private final List<BadgeView> attendanceBadges;
    private final List<BadgeView> goalBadges;
    private final List<BadgeView> recordBadges;
    private final List<BadgeView> allBadges;
    private final long earnedCount;
    private final int completionPercent;

    public BadgeCollection(List<BadgeView> coreBadges,
                           List<BadgeView> attendanceBadges,
                           List<BadgeView> goalBadges,
                           List<BadgeView> recordBadges) {
        this.coreBadges = List.copyOf(coreBadges);
        this.attendanceBadges = List.copyOf(attendanceBadges);
        this.goalBadges = List.copyOf(goalBadges);
        this.recordBadges = List.copyOf(recordBadges);
        this.allBadges = java.util.stream.Stream.of(
                        coreBadges, attendanceBadges, goalBadges, recordBadges)
                .flatMap(List::stream)
                .toList();
        this.earnedCount = allBadges.stream().filter(BadgeView::isEarned).count();
        this.completionPercent = allBadges.isEmpty()
                ? 0
                : (int) ((earnedCount * 100) / allBadges.size());
    }
}
