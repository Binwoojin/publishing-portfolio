package kr.co.growlog.growlog_project.entity;


import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// 성장 기록에 첨부된 이미지 또는 Youtube 영상 정보를 저장하는 Entity
// 하나의 GrowthRecord에는 여러 개의 Media가 연결될 수 있다


@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "media")
public class Media {

    // 미디어 식별 번호
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "media_num")
    private Long mediaNum;

    // 하나의 성장 기록에는 여러 개의 미디어가 연결될 수 있다
    // media 테이블의 record_num 외래 키를 통해 GrowthRecord와 연결

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "record_num", nullable = false)
    private GrowthRecord growthRecord;

    // 등록한 미디어의 유형
    // IMAGE 또는 YOUTUBE 값을 저장
    @Enumerated(EnumType.STRING)
    @Column(name = "media_type", nullable = false, length = 20)
    private MediaType mediaType;

    // 이미지 파일 경로나 유튜브 원본 URL을 저장
    @Column(name = "media_url", length = 1000)
    private String mediaUrl;

    // 유튜브 영상 식별 ID
    // media_type이 YOUTUBE일 때만 값이 저장
    // IMAGE 타입일 때는 NULL이어야 함

    // Youtube URL 전체를 저장하지 않고 영상 ID만 저장

    /**
     * ex)
     * URL: https://www.youtube.com/watch?v=dQw4w9WgXcQ
     * ID : dQw4w9WgXcQ
     */
    @Column(name = "youtube_video_id", length = 30)
    private String youtubeVideoId;

    // 미디어 썸네일 주소
    // Youtube 영상의 미리보기 이미지 주소를 저장
    // 이미지 미디어에서는 현재 사용하지 않으므로 NULL로 둘 수 있다
    @Column(name = "thumbnail_url", length = 1000)
    private String thumbnailUrl;

    // 미디어 출력 순서
    // 하나의 성장 기록에 이미지나 Youtube 영상이 여러 개 등록되었을 때
    // 화면에 표시할 순서를 결정

    // 기본값은 0이며 음수는 사용할 수 없다
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    // 미디어 등록 일시
    // 최초 등록 이후에는 수정되지 않도록 updatable을 false로 설정
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Media Entity를 생성하기 위한 Builder 생성자

    /**
     * media_num은 AUTO_INCREMENT로 생성되므로 생성자에서 받지 않으며
     * created_at도 등록 직전에 자동 설정되므로 생성자에서 받지 않는다.
     */
    @Builder
    private Media(GrowthRecord growthRecord, MediaType mediaType, String mediaUrl, String youtubeVideoId, String thumbnailUrl, Integer sortOrder) {
        this.growthRecord = growthRecord;
        this.mediaType = mediaType;
        this.mediaUrl = mediaUrl;
        this.youtubeVideoId = youtubeVideoId;
        this.thumbnailUrl = thumbnailUrl;

        // 출력 순서가 전달되지 않은 경우 DB 기본값과 동일하게 0으로 설정
        this.sortOrder = sortOrder == null ? 0 : sortOrder;
    }

    // Media가 처음 저장되기 전에 기본값을 설정
    // JPA가 INSERT 쿼리를 실행하기 직전에 자동으로 호출
    @PrePersist
    protected void prePersist() {
        if (this.sortOrder == null) {
            this.sortOrder = 0;
        }

        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    /**
     * 이미지 타입의 Media를 생성
     *
     * 이미지 타입에는 media_url만 사용하고
     * Youtube 관련 필드는 NULL로 설정
     *
     */
    public static Media createImage(GrowthRecord growthRecord, String mediaUrl, Integer sortOrder) {
        if (growthRecord == null) {
            throw new IllegalArgumentException("연결할 성장기록이 필요합니다.");
        }

        if (mediaUrl == null || mediaUrl.isBlank()) {
            throw new IllegalArgumentException("이미지 경로가 필요합니다.");
        }

        return Media.builder().growthRecord(growthRecord).mediaType(MediaType.IMAGE)
                .mediaUrl(mediaUrl.trim()).youtubeVideoId(null).thumbnailUrl(null)
                .sortOrder(sortOrder).build();
    }

    /**
     * Youtube 타입의 Media를 생성
     *
     * Youtube 타입에서는 영상 ID와 썸네일 주소를 사용하고
     * media_url은 NULL로 설정
     */
    public static Media createYoutube(GrowthRecord growthRecord, String youtubeVideoId, String thumbnailUrl, Integer sortOrder) {
        if (growthRecord == null) {
            throw new IllegalArgumentException("연결할 성장기록이 필요합니다.");
        }

        if (youtubeVideoId == null || youtubeVideoId.isBlank()) {
            throw new IllegalArgumentException("Youtube 영상 ID가 필요합니다.");
        }

        return Media.builder().growthRecord(growthRecord).mediaType(MediaType.YOUTUBE).mediaUrl(null)
                .youtubeVideoId(youtubeVideoId.trim()).thumbnailUrl(thumbnailUrl).sortOrder(sortOrder).build();
    }


}
