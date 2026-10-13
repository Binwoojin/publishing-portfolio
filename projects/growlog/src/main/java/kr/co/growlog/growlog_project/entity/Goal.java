package kr.co.growlog.growlog_project.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;


@NoArgsConstructor
@AllArgsConstructor
@Setter
@Getter
@Entity
@Builder
@Table(name = "GOAL")
public class Goal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "GOAL_NUM")
    private Long goalNum;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MEMBER_NO", nullable = false)
    private  Member member;

    @Column(name = "GOAL_TITLE", length = 200)
    private String goalTitle;

    @Column(name = "GOAL_CONTENT", columnDefinition = "TEXT")
    private String goalContent;

    @Builder.Default
    @Column(name = "GOAL_PROGRESS")
    private Integer goalProgress = 0;
    // JPA에서 Goal의 객체를 만들 때 값이 null일 경우
    // Hibernate가 NULL을 직접 INSERT 할 수 있기 때문에
    // 초기값을 설정하는 것이 좋음


    @Column(name = "START_DATE")
    private LocalDate startDate;

    @Column(name = "END_DATE")
    private LocalDate endDate;

    @Builder.Default
    @Column(name = "GOAL_STATUS", length = 20)
    private String goalStatus = "진행중";

    @CreationTimestamp
    @Column(name = "CREATED_AT", nullable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "UPDATED_AT", nullable = false)
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CATEGORY_NUM", nullable = false)
    private Category category; // 목표가 속한 카테고리


    // Entity가 처음 DB에 저장되기 직전에 자동으로 실행되는 메서드
    // - 생성일(CREATED_AT)과 수정일(UPDATED_AT)을 현재 시간으로 저장
    // - 진행율(GOAL_PROGRESS)와 상태(GOAL_STATUS)가 입력되지 않은 경우,
    //   기본값(0, "진행중")을 자동으로 설정
    // DB의 DEFAULT 값을 믿기 보다는 Entity에서 기본값을 보장하기 위해 사용

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;

        if (goalProgress == null) {
            goalProgress = 0;
        }

        if (goalStatus == null) {
            goalStatus = "진행중";
        }
    }

    // Entity가 수정(Update)되기 직전에 자동으로 실행되는 메서드
    // 수정될 때마다 UPDATED_AT 컬럼을 현재 시간으로 갱신
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
