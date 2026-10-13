package kr.co.growlog.growlog_project.dto;

import kr.co.growlog.growlog_project.entity.MediaType;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 성장기록 상세 페이지에서 미디어를 출력하기 위한 DTO
 *
 * object Key는 서버 내부에서만 사용하고
 * detail.jsp에는 브라우저에서 접근할 수 있는 mediaUrl을 전달한다.
 */

@Getter
@AllArgsConstructor
public class MediaResponse {
    private Long mediaNum; // 미디어 PK
    private MediaType mediaType; // IMAGE, YOUTUBE 등의 미디어 유형
    private String mediaUrl; // 화면에서 실제로 사용할 접근 URL
    private Integer sortOrder; // 여러 이미지의 출력 순서
}
