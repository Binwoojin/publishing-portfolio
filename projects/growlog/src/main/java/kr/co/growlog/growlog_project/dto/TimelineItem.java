package kr.co.growlog.growlog_project.dto;

/*
 * 타임라인 화면에 표시할 하나의 항목을 전달하는 DTO
 *
 * 목표와 성장 기록은 서로 다른 Entity이지만,
 * 타임라인에서는 동일한 카드 형태로 표시해야 한다.
 *
 * 따라서 화면에 필요한 공통 정보만 TimelineItem으로 변환하여 사용
 */

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class TimelineItem {
    /**
     * 타임라인 항목의 종류
     *
     * GOAL : 목표
     * RECORD : 성장 기록
     *
     * JSP와 JavaScript의 필터 기능에서도 이 값을 사용
     */
    private String type;

    /**
     * 원본 데이터의 식별 번호
     *
     * GOAL 항목이면 goalNum
     * RECORD 항목이면 recordNum이 저장된다.
     */
    private Long itemNum;

    // 타임라인 카드에 표시할 제목
    private String title;

    // 타임라인 카드에 표시할 내용
    private String content;

    /**
     * 원본 데이터가 생성된 시간
     *
     * 목표와 성장 기록을 하나로 합친 후
     * 최신순으로 정렬할 떄 사용
     */
    private LocalDateTime createdAt;

    /**
     * 사용자가 타임라인 카드를 클릭했을 때 이동할 주소
     *
     * 목표 : /goal/edit/{goalNum}
     * 기록 : /record/{recordNum}
     */
    private String detailUrl;
}


