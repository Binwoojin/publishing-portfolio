package kr.co.growlog.growlog_project.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

// 성장 기록 Entity

// 회원이 작성한 성장 기록을 관리
// 성장 기록은 특정 목표와 연결할 수도 있고,
// 목표 없이 자유로운 일기 형식으로 작성할 수 있다.

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "growth_record")
public class GrowthRecord {
    // 기본키, 성장 기록 번호
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "record_num")
    private Long recordNum;

    // 회원 연관 관계
    // 성장 기록을 작성한 회원, 모든 성장 기록은 반드시 한 명의 회원과 연결
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_no", nullable = false)
    private Member member;

    // 목표 연관 관계
    // 목표를 선택하지 않고 자유 기록으로 작성할 수 있으므로
    // NULL을 허용
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "goal_num")
    private Goal goal;

    // 성장 기록 제목
    @Column(name = "title", length = 200, nullable = false)
    private String title;

    // 성장 기록 본문
    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    // 성장 회고 정보
    // 오늘 배운 내용
    @Lob
    @Column(name = "today_learning", columnDefinition = "TEXT")
    private String todayLearning;

    // 체감 난이도
    // 목표 기록의 경우 EASY | NORMAL | HARD (쉬움, 보통, 어려움)
    // 자유 기록의 경우 EASY | NORMAL | HARD (좋은 하루, 보통, 힘든 하루)
    @Column(name = "difficulty", length = 20)
    private String difficulty;

    // 문제 해결 과정
    @Lob
    @Column(name = "solution", columnDefinition = "TEXT")
    private String solution;

    // 최종 회고
    @Lob
    @Column(name = "retrospective", columnDefinition = "TEXT")
    private String retrospective;

    // 생성일 및 수정일

    // 성장 기록 생성일
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // 성장 기록 수정일
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;


    // 홈과 목록 화면에 표시할 작성일 형식
    // DB 컬럼으로 저장하지 않고 화면 출력에만 사용
    @Transient
    public String getFormattedCreatedDate() {
        if (createdAt == null) {
            return "";
        }
        return createdAt.format(DateTimeFormatter.ofPattern("MM.dd"));
    }

    /**
     * 현재 성장기록에 첨부된 미디어 목록
     *
     * 한 개의 성장기록에는 여러 개의 이미지와
     * Youtube 영상이 등록될 수 있다.
     *
     * mappedBy의 growthRecord는 Media Entity에 선언된
     * 필드 이름과 정확하게 일치해야 한다.
     */
    @OneToMany(mappedBy = "growthRecord", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    @Builder.Default
    private List<Media> mediaList = new ArrayList<>();

}
