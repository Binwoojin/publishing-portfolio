package kr.co.growlog.growlog_project.controller;

// 성장 기록 화면과 요청을 처리하는 Controller

import kr.co.growlog.growlog_project.dto.GrowthRecordRequest;
import kr.co.growlog.growlog_project.entity.GrowthRecord;
import kr.co.growlog.growlog_project.security.LoginMemberPrincipal;
import kr.co.growlog.growlog_project.service.GoalService;
import kr.co.growlog.growlog_project.service.GrowthRecordService;
import kr.co.growlog.growlog_project.service.MediaService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@RequiredArgsConstructor
@RequestMapping("/record")
public class GrowthRecordController {

    private final GrowthRecordService growthRecordService;
    private final GoalService goalService;
    private final MediaService mediaService;

    // 성장 기록 목록

    // 로그인한 회원의 성장 기록 목록 페이지로 이동
    @GetMapping("/list")
    public String recordList(@AuthenticationPrincipal LoginMemberPrincipal principal,
                             Model model) {


        List<GrowthRecord> records = growthRecordService.findRecordsByMember(principal.getMemberNo());
        model.addAttribute("records", records);

        return "record/list";
    }

    // 성장 기록 등록 화면

    // 성장 기록 등록 페이지로 이동
    @GetMapping("/write")
    public String recordWriteForm(@AuthenticationPrincipal LoginMemberPrincipal principal,
                                  Model model) {


        // 연결 가능한 로그인 회원의 목표 목록 전달
        model.addAttribute("goals", goalService.findGoalsByMember(principal.getMemberNo()));

        return "record/write";
    }

    // 성장 기록 등록 처리

    // 성장 기록 등록 요청을 처리
    @PostMapping("/write")
    public String saveRecord(@ModelAttribute GrowthRecordRequest request,
                             @AuthenticationPrincipal LoginMemberPrincipal principal) {

        growthRecordService.saveRecord(principal.getMemberNo(), request);

        return "redirect:/record/list";
    }

    // 성장 기록 상세 조회

    // 성장 기록 상세 페이지로 이동
    // 기록 번호뿐만 아니라 로그인한 회원 번호를 함께 사용하여
    // 다른 회원의 성장 기록에는 접근하지 못하도록 한다.

    // @param recordNum 조회할 성장 기록 번호
    // @param session 로그인 세션
    // @param model 상세 페이지로 전달할 데이터
    // @return 성장 기록 상세 JSP 경로
    @GetMapping("/{recordNum}")
    public String recordDetail(@PathVariable("recordNum") Long recordNum,
                               @AuthenticationPrincipal LoginMemberPrincipal principal,
                               Model model) {


        GrowthRecord record = growthRecordService.findRecordById(recordNum, principal.getMemberNo());

        model.addAttribute("record", record);
        model.addAttribute("mediaList", mediaService.findMediaByGrowthRecord(recordNum));

        return "record/detail";
    }

    // 성장 기록 수정 화면

    // 성장 기록 수정 페이지로 이동
    // 로그인 회원이 작성한 기록인지 확인한 후,
    // 기존 성장 기록과 연결 가능한 목표 목록을 전달한다.

    // @param recordNum 수정할 성장 기록 번호
    // @param session 로그인 세션
    // @param model 수정 화면으로 전달할 데이터
    // @return 성장 기록 수정 JSP
    @GetMapping("/{recordNum}/edit")
    public String recordEditForm(@PathVariable("recordNum") Long recordNum,
                                 @AuthenticationPrincipal LoginMemberPrincipal principal,
                                 Model model) {

        Long memberNo = principal.getMemberNo();

        GrowthRecord record = growthRecordService.findRecordById(recordNum, memberNo);

        // 기존 성장 기록 전달
        model.addAttribute("record", record);
        model.addAttribute("mediaList", mediaService.findMediaByGrowthRecord(recordNum));
        model.addAttribute("existingImageCount", mediaService.countImageMediaByRecord(recordNum));

        // 수정 화면에서 선택할 수 있는 회원의 목표 목록 전달
        model.addAttribute("goals", goalService.findGoalsByMember(memberNo));

        return "record/edit";
    }

    // 성장 기록 수정 처리

    // 성장 기록 수정 요청을 처리

    // @param recordNum 수정할 성장 기록 번호
    // @param request 수정할 성장 기록 데이터
    // @param session 로그인 세션
    // @return 수정한 성장 기록 상세 페이지
    @PostMapping("/{recordNum}/edit")
    public String updateRecord(@PathVariable("recordNum") Long recordNum,
                               @ModelAttribute GrowthRecordRequest request,
                               @AuthenticationPrincipal LoginMemberPrincipal principal) {

        // 성장 기록 수정 처리
        growthRecordService.updateRecord(recordNum, principal.getMemberNo(), request);

        // 수정 완료 후 상세 페이지로 이동
        return "redirect:/record/" + recordNum;
    }

    // 성장 기록 삭제 처리

    // 성장 기록 삭제 요청을 처리함
    // GET 요청으로 삭제하지 않고 POST 요청만 허용

    // @param recordNum 삭제할 성장 기록 번호
    // @param session 로그인 세션
    // @return 삭제 완료 후 성장 기록 목록 페이지
    @PostMapping("/{recordNum}/delete")
    public String deleteRecord(@PathVariable("recordNum") Long recordNum,
                               @AuthenticationPrincipal LoginMemberPrincipal principal) {

        // 성장 기록 번호와 로그인 회원 번호를 함께 전달하여
        // 본인이 작성한 기록만 삭제할 수 있도록 한다.
        growthRecordService.deleteRecord(recordNum, principal.getMemberNo());

        // 삭제 완료 후 성장 기록 목록으로 이동
        return "redirect:/record/list";
    }


}
