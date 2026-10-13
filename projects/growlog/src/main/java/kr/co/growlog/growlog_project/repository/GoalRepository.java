package kr.co.growlog.growlog_project.repository;

import kr.co.growlog.growlog_project.entity.Goal;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface GoalRepository extends JpaRepository<Goal, Long> {
    // 특정 회원이 등록한 모든 목표를 최신순으로 조회
    @EntityGraph(attributePaths = "category")
    List<Goal> findByMemberMemberNoOrderByCreatedAtDesc(Long memberNo);

    // 홈 화면에 표시할 최근 목표를 최대 3개까지 조회
    @EntityGraph(attributePaths = "category")
    List<Goal> findTop3ByMemberMemberNoOrderByCreatedAtDesc(Long memberNo);

    // 특정 회원이 등록한 목표 개수 조회
    long countByMemberMemberNo(Long memberNo);

    // 특정 날짜 이후에 등록된 진행중 목표 개수를 조회
    // 조건
    // 1. 로그인한 회원의 목표
    // 2. 목표 상태가 "진행중"
    // 3. 생성일시가 전달받은 날짜 이후
    long countByMemberMemberNoAndGoalStatusAndCreatedAtGreaterThanEqual(Long memberNo, String goalStatus, LocalDateTime startDateTime);


    // 목표 단건 조회
    @EntityGraph(attributePaths = "category")
    Optional<Goal> findByGoalNumAndMemberMemberNo(Long goalNum, Long memberNo);

    /**
     * 특정 회원이 지정된 기간에 등록한 목표를 최신순으로 조회
     *
     * 조최 기간은 시작 시각 이상, 종료 시각 미만으로 처리
     * ex) 7월 조회 시 7월 1일 00:00 이상,
     *     8월 1일 00:00 미만
     */

    List<Goal> findByMemberMemberNoAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(Long memberNo, LocalDateTime startDateTime, LocalDateTime endDateTime);

    /**
     * 특정 회원이 지정된 기간에 등록한 목표 개수 조회
     */
    long countByMemberMemberNoAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(Long memberNo, LocalDateTime startDateTime, LocalDateTime endDateTime);
}
