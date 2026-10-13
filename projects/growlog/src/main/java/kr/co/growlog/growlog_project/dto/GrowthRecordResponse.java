package kr.co.growlog.growlog_project.dto;

import kr.co.growlog.growlog_project.entity.GrowthRecord;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

/*
 * Vue Record Detail 화면이 사용하는 응답.
 * JPA Entity(GrowthRecord)를 그대로 직렬화하지 않고 필요한 필드만 담는다 —
 * Member 지연 로딩 필드를 실수로 직렬화하는 문제를 피하기 위함이다(GoalResponse와 동일한 이유).
 */
@Getter
@AllArgsConstructor
public class GrowthRecordResponse {
    private Long recordNum;
    private String title;
    private String content;
    private String todayLearning;
    private String difficulty;
    private String solution;
    private String retrospective;
    private LocalDateTime createdAt;
    private GoalSummary goal;
    private List<MediaResponse> mediaList;

    @Getter
    @AllArgsConstructor
    public static class GoalSummary {
        private Long goalNum;
        private String goalTitle;
    }

    public static GrowthRecordResponse from(GrowthRecord record, List<MediaResponse> mediaList) {
        GoalSummary goalSummary = record.getGoal() == null
                ? null
                : new GoalSummary(record.getGoal().getGoalNum(), record.getGoal().getGoalTitle());

        return new GrowthRecordResponse(
                record.getRecordNum(),
                record.getTitle(),
                record.getContent(),
                record.getTodayLearning(),
                record.getDifficulty(),
                record.getSolution(),
                record.getRetrospective(),
                record.getCreatedAt(),
                goalSummary,
                mediaList
        );
    }
}
