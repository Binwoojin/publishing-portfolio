package kr.co.growlog.growlog_project.controller;

import kr.co.growlog.growlog_project.dto.CategoryResponse;
import kr.co.growlog.growlog_project.dto.GoalRequest;
import kr.co.growlog.growlog_project.dto.GoalResponse;
import kr.co.growlog.growlog_project.entity.Goal;
import kr.co.growlog.growlog_project.security.LoginMemberPrincipal;
import kr.co.growlog.growlog_project.service.GoalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/*
 * Vue SPA의 Goal 화면이 사용하는 API
 *
 * 새 비즈니스 로직을 추가하지 않는다 — 기존 JSP용 GoalController와 동일한
 * GoalService 메서드(saveGoal/updateGoal/deleteGoal/findGoalsByMember 등)를
 * 그대로 재사용해서 JSON으로만 다시 노출한다. 검증 로직(날짜/진행률/상태 등)도
 * GoalService에 이미 있는 것을 그대로 타므로 중복 구현하지 않는다.
 */
@RequiredArgsConstructor
@RestController
@RequestMapping("/api")
public class GoalApiController {

    private final GoalService goalService;

    @GetMapping("/goals")
    public List<GoalResponse> list(@AuthenticationPrincipal LoginMemberPrincipal principal) {
        return goalService.findGoalsByMember(principal.getMemberNo())
                .stream()
                .map(GoalResponse::from)
                .toList();
    }

    @GetMapping("/categories")
    public List<CategoryResponse> categories() {
        return goalService.findAllCategories()
                .stream()
                .map(CategoryResponse::from)
                .toList();
    }

    @PostMapping("/goals")
    public ResponseEntity<GoalResponse> create(
            @AuthenticationPrincipal LoginMemberPrincipal principal,
            @RequestBody GoalRequest request) {
        Goal goal = goalService.saveGoal(principal.getMemberNo(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(GoalResponse.from(goal));
    }

    @PutMapping("/goals/{goalNum}")
    public GoalResponse update(
            @PathVariable Long goalNum,
            @AuthenticationPrincipal LoginMemberPrincipal principal,
            @RequestBody GoalRequest request) {
        goalService.updateGoal(goalNum, principal.getMemberNo(), request);
        return GoalResponse.from(goalService.findGoalById(goalNum, principal.getMemberNo()));
    }

    @DeleteMapping("/goals/{goalNum}")
    public ResponseEntity<Void> delete(
            @PathVariable Long goalNum,
            @AuthenticationPrincipal LoginMemberPrincipal principal) {
        goalService.deleteGoal(goalNum, principal.getMemberNo());
        return ResponseEntity.noContent().build();
    }

    /*
     * GoalService의 검증 메서드(날짜/진행률/상태/카테고리/제목 등)는 전부
     * IllegalArgumentException을 던진다. JSP 화면에서는 이걸 잡아 flash
     * message로 보여줬는데, API에서는 400 + 에러 메시지로 응답해서
     * 프론트가 그대로 화면에 표시할 수 있게 한다.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleInvalid(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }
}
