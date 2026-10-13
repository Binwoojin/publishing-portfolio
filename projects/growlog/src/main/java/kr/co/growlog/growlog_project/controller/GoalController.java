package kr.co.growlog.growlog_project.controller;


import kr.co.growlog.growlog_project.dto.GoalRequest;
import kr.co.growlog.growlog_project.entity.Category;
import kr.co.growlog.growlog_project.entity.Goal;
import kr.co.growlog.growlog_project.security.LoginMemberPrincipal;
import kr.co.growlog.growlog_project.service.GoalService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;

@RequiredArgsConstructor
@Controller
@RequestMapping("/goal")
public class GoalController {

    private final GoalService goalService;

    // 목표 목록 페이지
    @GetMapping("/list")
    public String goalList(@AuthenticationPrincipal LoginMemberPrincipal principal,
                           Model model) {

        List<Goal> goal = goalService.findGoalsByMember(principal.getMemberNo());

        model.addAttribute("goal", goal);

        return "goal/list";

    }

    // 목표 등록 화면
    @GetMapping("/write")
    public String goalWriteForm(Model model) {

        List<Category> categories =
                goalService.findAllCategories();

        // 목표 등록 화면에서 사용할 카테고리 목록 전달
        model.addAttribute("categories", categories);

        return "goal/write";
    }

    // 목표 등록 처리
    @PostMapping("/write")
    public String saveGoal(@ModelAttribute GoalRequest request,
                           @AuthenticationPrincipal LoginMemberPrincipal principal) {


        Long memberNo = principal.getMemberNo();

        goalService.saveGoal(memberNo, request);

        return "redirect:/goal/list";
    }



    // 목표 수정 페이지

    @GetMapping("/edit/{goalNum}")
    public String goalEditPage(@PathVariable("goalNum") Long goalNum,
                               @AuthenticationPrincipal LoginMemberPrincipal principal,
                               Model model,
                               RedirectAttributes redirectAttributes) {


        try {
            // 수정할 목표 조회
            Goal goal = goalService.findGoalById(goalNum, principal.getMemberNo());

            // edit.jsp에서 기존 목표 데이터를 사용할 수 있도록 전달
            model.addAttribute("goal", goal);
            // 수정 화면에서 선택할 카테고리 목록 전달
            model.addAttribute("categories", goalService.findAllCategories());

            return "goal/edit";
        } catch (IllegalArgumentException e) {
            // 목표가 없거나 다른 회원의 목표인 경우
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());

            return "redirect:/goal/list";
        }

    }

    // 수정 처리

    @PostMapping("/edit/{goalNum}")
    public String updateGoal(@PathVariable("goalNum") Long goalNum,
                             @ModelAttribute GoalRequest request,
                             @AuthenticationPrincipal LoginMemberPrincipal principal,
                             RedirectAttributes redirectAttributes) {


        try {
            // 목표 수정 Service 호출
            goalService.updateGoal(goalNum, principal.getMemberNo(), request);

            // 목표 목록 페이지에서 출력할 성공 메시지
            redirectAttributes.addFlashAttribute("successMessage", "목표가 성공적으로 수정되었습니다.");

            return "redirect:/goal/list";
        } catch (IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());

            return "redirect:/goal/edit/" + goalNum;

        }
    }

    // 목표 삭제 처리
    // 목표 삭제 요청을 처리
    // POST /goal/delete/{goalNum}

    @PostMapping("/delete/{goalNum}")
    public String deleteGoal(@PathVariable("goalNum") Long goalNum,
                             @AuthenticationPrincipal LoginMemberPrincipal principal,
                             RedirectAttributes redirectAttributes) {


        try {
            // 현재 로그인한 회원의 목표 삭제
            goalService.deleteGoal(goalNum, principal.getMemberNo());

            // 삭제 성공 메시지 전달
            redirectAttributes.addFlashAttribute("successMessage", "목표가 삭제되었습니다.");
        } catch (IllegalArgumentException e) {
            // 목표가 없거나 삭제 권한이 없는 경우
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
        }
        return "redirect:/goal/list";
    }


}
