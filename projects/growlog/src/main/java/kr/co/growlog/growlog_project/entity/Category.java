package kr.co.growlog.growlog_project.entity;


import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;


@Builder
@NoArgsConstructor
@AllArgsConstructor
@Setter
@Getter
@Entity
@Table(name = "CATEGORY")
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "CATEGORY_NUM")
    private Long categoryNum; // 카테고리 기본키

    @Column(name = "CATEGORY_NAME", length = 20)
    private String categoryName; // 카테고리명 (예: 프로젝트, 공부, 운동, 독서, 습관, 기타)

    @Column(name = "CATEGORY_COLOR", length = 20)
    private String categoryColor; // 카테고리 표시 색상

    @Column(name = "CATEGORY_ICON", length = 20, nullable = false)
    private String categoryIcon;

    @CreationTimestamp
    @Column(name = "CREATED_AT", nullable = false, updatable = false)
    private LocalDateTime createdAt; // 카테고리 생성일

    @UpdateTimestamp
    @Column(name = "UPDATED_AT", nullable = false)
    private LocalDateTime updatedAt; // 카테고리 수정일


}
