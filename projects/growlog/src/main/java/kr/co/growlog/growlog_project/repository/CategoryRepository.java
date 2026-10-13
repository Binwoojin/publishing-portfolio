package kr.co.growlog.growlog_project.repository;

import kr.co.growlog.growlog_project.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;


// 목표 카테고리 조회를 담당하는 Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    // 카테고리 이름을 기준으로 오름차순으로 조회
    // 등록 및 수정 화면의 select 목록에 사용
    List<Category> findAllByOrderByCategoryNameAsc();
}
