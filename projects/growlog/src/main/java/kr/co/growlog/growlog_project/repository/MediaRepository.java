package kr.co.growlog.growlog_project.repository;

import kr.co.growlog.growlog_project.entity.Media;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Media 테이블에 접근하는 Repository
 *
 * Spring Data JPA의 메서드 이름 규칙을 사용하여
 * 별도의 @Query 없이 미디어 조회 및 삭제 기능을 구현
 */

public interface MediaRepository extends JpaRepository<Media, Long> {
    /**
     * 특정 성장기록에 연결된 미디어 목록을 출력 순서대로 조회
     *
     * Media Entity의 growthRecord 필드를 따라가서
     * GrowthRecord Entity의 recordNum을 기준으로 검색
     *
     * 생성되는 SQL의 개념
     *
     * SELECT *
     * FROM media
     * WHERE record_num = ?
     * ORDER BY sort_order ASC;
     *
     * @param recordNum 성장기록 번호
     * @return 성장기록에 연결된 미디어 목록
     */
    List<Media> findByGrowthRecordRecordNumOrderBySortOrderAsc(Long recordNum);

    /**
     * 특정 성장기록에 등록된 미디어 개수를 조회
     *
     * 이미지와 YouTube 영상을 모두 포함한 개수를 반환
     *
     * @param recordNum 성장기록 번호
     * @return 해당 성장기록에 연결된 전체 미디어 개수
     */
    long countByGrowthRecordRecordNum(Long recordNum);

    /**
     * 특정 성장기록에 연결된 모든 미디어를 삭제
     *
     * 성장기록 수정 과정에서 기존 미디어를 전체 교체하거나,
     * 성장기록 삭제 전에 연결된 미디어를 직접 정리할 때 사용할 수 있다.
     *
     * 현재 DB 외래키에 "ON DELETE CASCADE"가 설정되어 있을 경우,
     * 성장기록 삭제 시에는 자동 삭제되므로 필수 호출은 아님
     *
     * @ param recordNum 성장기록 번호
     */
    void deleteByGrowthRecordRecordNum(Long recordNum);
}
