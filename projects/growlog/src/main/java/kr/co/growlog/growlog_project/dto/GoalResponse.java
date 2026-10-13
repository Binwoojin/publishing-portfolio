package kr.co.growlog.growlog_project.dto;

import kr.co.growlog.growlog_project.entity.Goal;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/*
 * Vue Goal 화면이 사용하는 응답. JPA Entity(Goal)를 그대로
 * 직렬화하지 않고 필요한 필드만 골라 담는다 — Member/Category 지연 로딩
 * 필드를 실수로 직렬화하는 문제를 피하기 위함이다.
 */
@Getter
@AllArgsConstructor
public class GoalResponse {
    private Long goalNum;
    private String goalTitle;
    private String goalContent;
    private int goalProgress;
    private String goalStatus;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDateTime createdAt;
    private CategoryResponse category;

    public static GoalResponse from(Goal goal) {
        return new GoalResponse(
                goal.getGoalNum(),
                goal.getGoalTitle(),
                goal.getGoalContent(),
                goal.getGoalProgress(),
                goal.getGoalStatus(),
                goal.getStartDate(),
                goal.getEndDate(),
                goal.getCreatedAt(),
                CategoryResponse.from(goal.getCategory())
        );
    }
}
