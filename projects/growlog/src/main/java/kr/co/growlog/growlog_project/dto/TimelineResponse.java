package kr.co.growlog.growlog_project.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

/*
 * Vue Timeline 화면(GET /api/timeline)이 사용하는 응답
 *
 * 기존 JSP PageController.timeline()과 동일한 월 선택 로직/Service 호출을
 * 그대로 재사용하고, Model 대신 JSON으로 내려준다는 점만 다르다.
 */
@Getter
@AllArgsConstructor
public class TimelineResponse {
    private List<TimelineItem> timelineItems;
    private long monthlyRecordCount;
    private long monthlyGoalCount;
    private int currentStreak;

    /* "YYYY-MM" 형식. 프론트에서 그대로 <input type="month">나 표시용으로 쓸 수 있다. */
    private String selectedMonth;
    private String previousMonth;
    private String nextMonth;
    private boolean currentMonthSelected;
}
