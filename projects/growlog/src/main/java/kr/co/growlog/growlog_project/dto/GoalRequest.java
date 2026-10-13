package kr.co.growlog.growlog_project.dto;


import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

@NoArgsConstructor
@Setter
@Getter
public class GoalRequest {

    private String goalTitle;
    private String goalContent;
    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private LocalDate startDate;
    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private LocalDate endDate;

    // 목표진행율과 목표상태 추가
    private Integer goalProgress;
    private String goalStatus;

    // 등록 또는 수정 화면에서 선택한 카테고리 번호
    private Long categoryNum;




}
