package kr.co.growlog.growlog_project.controller;

import kr.co.growlog.growlog_project.dto.GrowthRecordRequest;
import kr.co.growlog.growlog_project.dto.GrowthRecordResponse;
import kr.co.growlog.growlog_project.entity.GrowthRecord;
import kr.co.growlog.growlog_project.security.LoginMemberPrincipal;
import kr.co.growlog.growlog_project.service.GrowthRecordService;
import kr.co.growlog.growlog_project.service.MediaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/*
 * Vue Record 화면(Dashboard → Record Create → Timeline → Record Detail →
 * Edit/Delete)이 사용하는 API.
 *
 * 새 비즈니스 로직을 추가하지 않는다 — 기존 JSP용 GrowthRecordController와
 * 동일한 GrowthRecordService 메서드(saveRecord/updateRecord/deleteRecord/
 * findRecordById)를 그대로 재사용해서 JSON으로만 다시 노출한다. 이미지
 * 업로드/YouTube 파싱/미디어 삭제 검증도 saveRecord()/updateRecord() 안에서
 * 기존 MediaService 로직을 그대로 타므로 여기서 중복 구현하지 않는다.
 *
 * Create/Update는 이미지 파일(List<MultipartFile>)을 함께 받아야 해서
 * GoalApiController와 달리 JSON이 아니라 multipart/form-data로 받는다 —
 * 기존 JSP record/write, record/{id}/edit 폼이 이미 같은 방식으로
 * GrowthRecordRequest를 바인딩하고 있어서 그 스타일을 그대로 따랐다.
 */
@RequiredArgsConstructor
@RestController
@RequestMapping("/api")
public class GrowthRecordApiController {

    private final GrowthRecordService growthRecordService;
    private final MediaService mediaService;

    @GetMapping("/records/{recordNum}")
    public GrowthRecordResponse detail(
            @PathVariable Long recordNum,
            @AuthenticationPrincipal LoginMemberPrincipal principal) {
        GrowthRecord record = growthRecordService.findRecordById(recordNum, principal.getMemberNo());
        return toResponse(record);
    }

    @PostMapping("/records")
    public ResponseEntity<GrowthRecordResponse> create(
            @AuthenticationPrincipal LoginMemberPrincipal principal,
            @ModelAttribute GrowthRecordRequest request) {
        GrowthRecord saved = growthRecordService.saveRecord(principal.getMemberNo(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(saved));
    }

    @PutMapping("/records/{recordNum}")
    public GrowthRecordResponse update(
            @PathVariable Long recordNum,
            @AuthenticationPrincipal LoginMemberPrincipal principal,
            @ModelAttribute GrowthRecordRequest request) {
        GrowthRecord updated = growthRecordService.updateRecord(recordNum, principal.getMemberNo(), request);
        return toResponse(updated);
    }

    @DeleteMapping("/records/{recordNum}")
    public ResponseEntity<Void> delete(
            @PathVariable Long recordNum,
            @AuthenticationPrincipal LoginMemberPrincipal principal) {
        growthRecordService.deleteRecord(recordNum, principal.getMemberNo());
        return ResponseEntity.noContent().build();
    }

    private GrowthRecordResponse toResponse(GrowthRecord record) {
        return GrowthRecordResponse.from(record, mediaService.findMediaByGrowthRecord(record.getRecordNum()));
    }

    /*
     * findRecordById()/updateRecord()/deleteRecord()는 기록이 없거나 다른
     * 회원의 기록일 때, saveRecord()/updateRecord()는 필수값 누락·이미지
     * 개수 초과·잘못된 YouTube 주소일 때 전부 IllegalArgumentException을
     * 던진다. GoalApiController와 같은 패턴으로 400 + 메시지로 응답해서
     * 프론트가 그대로 화면에 표시할 수 있게 한다.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleInvalid(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }
}
