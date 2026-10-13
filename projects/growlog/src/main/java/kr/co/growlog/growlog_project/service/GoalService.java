package kr.co.growlog.growlog_project.service;

import jakarta.transaction.Transactional;
import kr.co.growlog.growlog_project.dto.GoalRequest;
import kr.co.growlog.growlog_project.entity.Category;
import kr.co.growlog.growlog_project.entity.Goal;
import kr.co.growlog.growlog_project.entity.Member;
import kr.co.growlog.growlog_project.repository.CategoryRepository;
import kr.co.growlog.growlog_project.repository.GoalRepository;
import kr.co.growlog.growlog_project.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.*;
import java.time.temporal.TemporalAdjuster;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

@RequiredArgsConstructor
@Service
@org.springframework.transaction.annotation.Transactional(readOnly = true)
public class GoalService {

    private final GoalRepository goalRepository;
    private final MemberRepository memberRepository;
    // 카테고리 조회 Repository 추가
    private final CategoryRepository categoryRepository;

    // 로그인한 회원의 목표를 새로 등록
    @Transactional
    public Goal saveGoal(Long memberNo, GoalRequest request) {
        // 목표를 동록할 회원 조회
        Member member = memberRepository.findById(memberNo).orElseThrow(() -> new IllegalArgumentException("회원 정보를 찾을 수 없습니다."));

        // 사용자가 선택한 카테고리 조회
        Category category = categoryRepository.findById(request.getCategoryNum()).orElseThrow(() -> new IllegalArgumentException("선택한 카테고리를 찾을 수 없습니다."));

        // 시작일과 종료일 검사
        validateDate(request.getStartDate(), request.getEndDate());

        // Goal Entity 생성
        Goal goal = Goal.builder().member(member).category(category).goalTitle(request.getGoalTitle()).goalContent(request.getGoalContent()).startDate(request.getStartDate()).endDate(request.getEndDate()).build();

        // 목표 저장
        return goalRepository.save(goal);
    }


    // 특정 회원이 등록한 목표를 최신순으로 조회
    public List<Goal> findGoalsByMember(Long memberNo) {
        return goalRepository.findByMemberMemberNoOrderByCreatedAtDesc(memberNo);
    }

    // 로그인한 회원이 이번 주에 등록한 진행 중 목표 개수를 조회

    // 이번 주의 기준 : 월요일 0시부터 현재 시점까지

    // @param memberNo 로그인한 회원 번호
    // @return 이번 주에 등록된 진행중 목표 개수
    public long countThisWeekInProgressGoals(Long memberNo) {

        // 오늘 날짜를 기준으로 이번 주 월요일을 구한다
        LocalDate thisMonday = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        // 월요일 날짜를 월요일 00시로 변환
        LocalDateTime startOfWeek = thisMonday.atStartOfDay();

        // 이번 주 월요일 이후에 생성된 진행중 목표 개수 조회
        return goalRepository.countByMemberMemberNoAndGoalStatusAndCreatedAtGreaterThanEqual(memberNo, "진행중", startOfWeek);
    }



    // 목표 개수 조회 추가
    public long countGoalsByMember(Long memberNo) {
        return goalRepository.countByMemberMemberNo(memberNo);
    }


    public List<Goal> findRecentGoalsByMember(Long memberNo) {
        return goalRepository.findTop3ByMemberMemberNoOrderByCreatedAtDesc(memberNo);
    }

    // 목표 시작일이 종료일보다 늦지 않은지 검사
    private void validateDate(java.time.LocalDate startDate,
                              java.time.LocalDate endDate) {
        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw new IllegalArgumentException("목표 종료일은 시작일보다 빠를 수 없습니다.");
        }
    }

    // 목표 단건 조회
    public Goal findGoalById(Long goalNum, Long memberNo) {
        return goalRepository.findByGoalNumAndMemberMemberNo(goalNum, memberNo).orElseThrow(() -> new IllegalArgumentException("목표를 착을 수 없거나 수정 권한이 없습니다."));
    }

    // 목표 수정
    @org.springframework.transaction.annotation.Transactional
    public void updateGoal(Long goalNum, Long memberNo, GoalRequest request) {

        // 현재 로그인한 회원이 등록한 목표인지 확인
        Goal goal = findGoalById(goalNum, memberNo);

        // 수정 화면에서 선택한 카테고리 조회
        Category category = categoryRepository.findById(request.getCategoryNum()).orElseThrow(() -> new IllegalArgumentException("선택한 카테고리를 찾을 수 없습니다."));
        
        // 종료일이 시작일보다 빠른지 검사
        validateDate(request.getStartDate(), request.getEndDate());
        
        // 진행률이 0~100 범위를 벗어나는지 검사
        validateProgress(request.getGoalProgress());
        validateStatus(request.getGoalStatus());
        
        // 제목이 비어있는지 검사
        if (request.getGoalTitle() == null || request.getGoalTitle().isBlank()) {
            throw new IllegalArgumentException("목표 제목을 입력해 주세요");                
        }
        
        // 수정 화면에서 전달받은 값으로 Entity 변경
        goal.setCategory(category);
        goal.setGoalTitle(request.getGoalTitle().trim());
        goal.setGoalContent(request.getGoalContent());
        goal.setStartDate(request.getStartDate());
        goal.setEndDate(request.getEndDate());
        goal.setGoalProgress(request.getGoalProgress());
        goal.setGoalStatus(request.getGoalStatus());

    }

    // 카테고리 목록 조회
    // 등록 및 수정 화면에서 사용할 카테고리 목록을 조회

    public List<Category> findAllCategories() {
        return categoryRepository.findAllByOrderByCategoryNameAsc();
    }



    /**
     * 목표 진행률이 0부터 100 사이인지 검사한다.
     *
     * @param goalProgress 수정할 목표 진행률
     */
    private void validateProgress(Integer goalProgress) {

        if (goalProgress == null) {
            throw new IllegalArgumentException(
                    "목표 진행률을 입력해 주세요."
            );
        }

        if (goalProgress < 0 || goalProgress > 100) {
            throw new IllegalArgumentException(
                    "목표 진행률은 0부터 100 사이여야 합니다."
            );
        }
    }

    /**
     * 목표 상태가 허용된 값인지 검사한다.
     *
     * 허용 상태
     * - 진행중
     * - 완료
     * - 중단
     */
    private void validateStatus(String goalStatus) {

        if (!"진행중".equals(goalStatus)
                && !"완료".equals(goalStatus)
                && !"중단".equals(goalStatus)) {

            throw new IllegalArgumentException(
                    "올바르지 않은 목표 상태입니다."
            );
        }
    }


    // 목표 삭제
    // 로그인한 회원이 작성한 목표를 삭제
    // 목표 번호와 회원 번호를 함께 조회해서 다은 회원의 목표가 삭제되지 않도록 확인
    @org.springframework.transaction.annotation.Transactional
    public void deleteGoal(Long goalNum,
                           Long memberNo) {
        // 로그인한 회원이 작성한 목표인지 확인
        Goal goal = findGoalById(goalNum, memberNo);

        // 조회된 목표 삭제
        goalRepository.delete(goal);
    }

    /**
     * 로그인 회원이 선택한 달에 등록한 목표를 조회
     *
     * @param memberNo 로그인 회원 번호
     * @param yearMonth 조회할 연, 월
     * @return 선택한 달에 등록한 목표 목록
     */
    public List<Goal> findGoalsByMemberAndMonth(Long memberNo, YearMonth yearMonth) {
        LocalDateTime startOfMonth = yearMonth.atDay(1).atStartOfDay();
        LocalDateTime startOfNextMonth = yearMonth.plusMonths(1).atDay(1).atStartOfDay();

        return goalRepository.findByMemberMemberNoAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(memberNo, startOfMonth,startOfNextMonth);
    }

    /**
     * 로그인 회원이 선택한 달에 등록한 목표 개수를 조회
     */
    public long countGoalsByMemberAndMonth(Long memberNo, YearMonth yearMonth) {
        LocalDateTime startOfMonth = yearMonth.atDay(1).atStartOfDay();
        LocalDateTime startOfNextMonth = yearMonth.plusMonths(1).atDay(1).atStartOfDay();

        return goalRepository.countByMemberMemberNoAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(memberNo, startOfMonth, startOfNextMonth);
    }

}
