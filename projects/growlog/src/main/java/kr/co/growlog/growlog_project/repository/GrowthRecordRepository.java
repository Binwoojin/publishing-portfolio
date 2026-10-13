package kr.co.growlog.growlog_project.repository;

import kr.co.growlog.growlog_project.entity.Goal;
import kr.co.growlog.growlog_project.entity.GrowthRecord;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

// 성장 기록 데이터 접근을 담당하는 Repository

public interface GrowthRecordRepository extends JpaRepository<GrowthRecord, Long> {

    // 회원별 성장 기록 목록 조회

    // 로그인한 회원이 작성한 성장 기록을 최신순으로 조회한다.

    // 목록 화면에서 연결된 목표 정보를 사용할 수 있으므로
    // goal 연관 객체도 함께 조회

    // @param memberNo 회원 번호
    // @return 성장 기록 목록
    @EntityGraph(attributePaths = "goal")
    List<GrowthRecord> findByMemberMemberNoOrderByCreatedAtDesc(Long memberNo);

    // 로그인한 회원이 작성한 성장기록 중 가장 최근에 작성된 기록 3개를 조회
    List<GrowthRecord> findTop3ByMemberMemberNoOrderByCreatedAtDesc(Long memberNo);

    // 성장 기록 한 건 조회

    // 성장 기록 번호와 회원 번호를 함께 사용해 조회한다.

    // 다른 회원의 성장 기록에 접근하지 못하도록 하기 위해 사용

    // @param recordNum 성장 기록 번호
    // @param memberNo 회원 번호
    // @return 조회한 성장 기록
    @EntityGraph(attributePaths = "goal")
    Optional<GrowthRecord> findByRecordNumAndMemberMemberNo(Long recordNum, Long memberNo);

    // 회원이 작성한 성장 기록 개수 조회
    long countByMemberMemberNo(Long memberNo);

    // 특정 회원이 지정된 기간에 작성한 성장 기록 개수를 조회
    long countByMemberMemberNoAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(Long memberNo, LocalDateTime startDateTime, LocalDateTime endDateTime);

    // 특정 회원이 지정된 기간에 작성한 성장 기록을 조회
    // 출석은 성장 기록의 작성 날짜를 기준으로 계산하므로
    // 월간 달력이나 연속 출석 계산에 사용
    List<GrowthRecord> findByMemberMemberNoAndCreatedAtBetweenOrderByCreatedAtAsc(Long memberNo, LocalDateTime startDateTime, LocalDateTime endDateTime);


    // 특정 회원이 지정된 기간에 목표를 등록했는지 확인
    // 오늘 목표 등록 여부를 확인할 때 사용
//    boolean existsByMemberMemberNoAndCreatedAttGreaterThanEqualAndCreatedAtLessThan(Long memberNo, LocalDateTime startDateTime, LocalDateTime endDateTime);

    /**
     * 특정 회원이 지정된 기간에 작성한 성장 기록을 최신순으로 조회
     *
     * 타임라인에서 선택한 달의 성장 기록만 표시할 때 사용한다.
     */

    List<GrowthRecord> findByMemberMemberNoAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(Long memberNo, LocalDateTime startDateTime, LocalDateTime endDateTime);

}
