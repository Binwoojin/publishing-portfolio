package kr.co.growlog.growlog_project.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.List;
import kr.co.growlog.growlog_project.dto.AttendanceSummary;
import kr.co.growlog.growlog_project.dto.BadgeCollection;
import kr.co.growlog.growlog_project.entity.Goal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BadgeServiceTest {

    @Mock
    private GoalService goalService;
    @Mock
    private GrowthRecordService growthRecordService;
    @Mock
    private AttendanceService attendanceService;

    private BadgeService badgeService;

    @BeforeEach
    void setUp() {
        badgeService = new BadgeService(
                goalService,
                growthRecordService,
                attendanceService
        );
    }

    @Test
    void calculatesAllNineteenBadgesFromMemberActivity() {
        Long memberNo = 1L;
        Goal completed = Goal.builder()
                .goalStatus("완료")
                .goalProgress(100)
                .build();

        when(goalService.findGoalsByMember(memberNo))
                .thenReturn(java.util.Collections.nCopies(20, completed));
        when(growthRecordService.countRecordByMember(memberNo)).thenReturn(50L);
        when(attendanceService.getAttendanceSummary(memberNo))
                .thenReturn(new AttendanceSummary(3, true, 30, 12, List.of()));

        BadgeCollection result = badgeService.getBadgeCollection(memberNo);

        assertThat(result.getAllBadges()).hasSize(19);
        assertThat(result.getCoreBadges()).allMatch(badge -> badge.isEarned());
        assertThat(result.getAttendanceBadges())
                .extracting("earned")
                .containsExactly(true, true, true, false, false, false);
        assertThat(result.getGoalBadges())
                .extracting("earned")
                .containsExactly(true, true, false, false, false);
        assertThat(result.getRecordBadges())
                .extracting("earned")
                .containsExactly(true, true, true, false, false);
        assertThat(result.getEarnedCount()).isEqualTo(11);
    }

    @Test
    void keepsUnreachedBadgeProgressBelowOneHundredPercent() {
        Long memberNo = 2L;
        when(goalService.findGoalsByMember(memberNo)).thenReturn(List.of());
        when(growthRecordService.countRecordByMember(memberNo)).thenReturn(9L);
        when(attendanceService.getAttendanceSummary(memberNo))
                .thenReturn(new AttendanceSummary(0, false, 0, 0, List.of()));

        BadgeCollection result = badgeService.getBadgeCollection(memberNo);

        assertThat(result.getRecordBadges().get(0).isEarned()).isFalse();
        assertThat(result.getRecordBadges().get(0).getProgressPercent()).isEqualTo(90);
        assertThat(result.getEarnedCount()).isEqualTo(1);
    }
}
