package kr.co.growlog.growlog_project.service;

/*
 * 로그인한 회원의 목표와 성장 기록을 조회한 뒤
 * 타임라인 화면에서 사용할 하나의 목록으로 변환하는 Service
 */

import kr.co.growlog.growlog_project.dto.TimelineItem;
import kr.co.growlog.growlog_project.entity.Goal;
import kr.co.growlog.growlog_project.entity.GrowthRecord;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TimelineService {
    // 로그인 회원의 목표를 조회하기 위해 사용
    private final GoalService goalService;

    // 로그인 회원의 성장 기록을 조회하기 위해 사용
    private final GrowthRecordService growthRecordService;

    /**
     * 로그인한 회원의 전체 타임라인을 조회
     *
     * 처리 순서
     * 1. 회원의 목표 목록 조회
     * 2. 목표 Entity를 TimelineItem DTO로 변환
     * 3. 회원의 성장 기록 목록 조회
     * 4. 성장 기록 Entity를 TimelineItem DTO로 변환
     * 5. 두 목록을 생성 시간 기준 최신순으로 정렬
     *
     * @param memberNo 로그인한 회원 번호
     * @return 최신순으로 정렬된 타임라인 목록
     */
    public List<TimelineItem> getTimeline(Long memberNo, YearMonth yearMonth) {

        // 목표와 성장 기록을 함께 담을 최종 목록
        List<TimelineItem> timelineItems = new ArrayList<>();

        /*
         * 로그인 회원이 등록한 목표를 조회한다.
         *
         * GoalService 내부에서 회원 번호를 기준으로 조회하므로
         * 다른 회원의 목표는 포함하지 않는다.
         */
        List<Goal> goals = goalService.findGoalsByMemberAndMonth(memberNo, yearMonth);

        /*
         * Goal Entity를 타임라인 화면용 DTO로 변환한다.
         *
         * 목표는 별도의 상세 페이지가 없으므로
         * 현재는 목표 수정 페이지를 이동 주소로 사용
         */
        for(Goal goal : goals) {
            TimelineItem goalItem =
                    new TimelineItem(
                            "GOAL",
                            goal.getGoalNum(),
                            goal.getGoalTitle(),
                            goal.getGoalContent(),
                            goal.getCreatedAt(),
                            "/goal/list?openGoal=" + goal.getGoalNum()
                            /*
                             * 목표는 별도의 상세 페이지가 없고
                             * 목표 목록 페이지의 모달로 상세 정보를 표시
                             *
                             * openGoal 파라미터에 목표 번호를 전달하면
                             * goal.js가 목록 페이지 로딩 후 해당 목표 모달을 자동으로 연다.
                             */
                            );
            timelineItems.add(goalItem);
        }

        /*
         * 로그인 회원이 작성한 성장 기록을 조회한다.
         *
         * 회원 번호 조건이 포함되어 있으므로
         * 다른 회원의 성장 기록은 포함되지 않는다.
         */
        List<GrowthRecord> records = growthRecordService.findRecordsByMemberAndMonth(memberNo, yearMonth);

        /*
         * GrowthRecord Entity를 타임라인 화면용 DTO로 변환한다
         *
         * 성장 기록은 상세 페이지가 있으므로
         * /record/{recordNum} 주소를 사용한다.
         */
        for (GrowthRecord record : records) {
            timelineItems.add(
                    new TimelineItem(
                            "RECORD",
                            record.getRecordNum(),
                            record.getTitle(),
                            record.getContent(),
                            record.getCreatedAt(),
                            "/record/" + record.getRecordNum()
                    )
            );
        }

        /*
         * 목표와 성장 기록이 섞여 있는 목록을
         * 생성 시간(createdAt) 기준 최신순으로 정렬한다.
         *
         * reversed()를 적용했기 때문에
         * 가장 최근에 등록된 항목이 목록의 앞에 위치한다.
         */
        timelineItems.sort(
                Comparator.comparing(
                        TimelineItem::getCreatedAt
                ).reversed()
        );

        return timelineItems;
    }


}
