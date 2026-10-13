package kr.co.growlog.growlog_project.controller;

import jakarta.servlet.http.HttpSession;
import kr.co.growlog.growlog_project.dto.DuplicateCheckResponse;
import kr.co.growlog.growlog_project.dto.JoinRequest;
import kr.co.growlog.growlog_project.security.LoginMemberPrincipal;
import kr.co.growlog.growlog_project.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;


@RequiredArgsConstructor
@Controller
public class MemberController {

    private final MemberService memberService;


    // 회원가입 페이지 이동
    @GetMapping("/join")
    public String joinPage() {
        return "member/join";
    }

    // 회원가입 처리
    @PostMapping("/join")
    public String join(@ModelAttribute JoinRequest request,
                       HttpSession session,
                       RedirectAttributes redirectAttributes) {

        memberService.join(request, session);

        redirectAttributes.addFlashAttribute("joinSuccessMessage", "회원가입이 완료되었습니다.");

        return "redirect:/login";

    }


    // 닉네임 중복확인 API
    @ResponseBody
    @GetMapping("/api/members/check-nickname")
    public DuplicateCheckResponse checkNickname(@RequestParam("nickname") String nickname) {
        boolean duplicated = memberService.isNicknameDuplicated(nickname);

        if (duplicated) {
            return new DuplicateCheckResponse(true, "이미 사용 중인 닉네임입니다.");
        }

        return new DuplicateCheckResponse(false, "사용 가능한 닉네임입니다.");
    }

    /**
     * 계정 설정에서 사용하는 닉네임 중복 확인
     *
     * 현재 로그인한 회원은 중복 검사에서 제외한다.
     */
    @ResponseBody
    @GetMapping("/api/members/check-nickname-update")
    public DuplicateCheckResponse checkNicknameForUpdate(
            @RequestParam("nickname") String nickname,
            @AuthenticationPrincipal LoginMemberPrincipal principal) {

        /*
         * 로그인 회원 번호는 별도의 loginMember 세션이 아니라
         * Spring Security Principal에서 가져온다.
         */
        Long memberNo = principal.getMemberNo();

        /*
         * 현재 로그인 회원을 제외하고
         * 같은 닉네임을 사용하는 회원이 있는지 확인한다.
         */

        boolean duplicated =
                memberService.isNicknameDuplicatedExceptSelf(
                        nickname,
                        memberNo
                );

        if (duplicated) {
            return new DuplicateCheckResponse(
                    true,
                    "이미 사용 중인 닉네임입니다."
            );
        }

        return new DuplicateCheckResponse(
                false,
                "사용 가능한 닉네임입니다."
        );
    }
}
