package kr.co.growlog.growlog_project.controller;

import kr.co.growlog.growlog_project.entity.Member;
import kr.co.growlog.growlog_project.security.LoginMemberPrincipal;
import kr.co.growlog.growlog_project.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

/**
 * 여러 JSP에서 공통으로 사용하는 Model 속성을 설정
 *
 * 현재는 공통 헤더에서 사용할 로그인 회원 정보를
 * 모든 MVC 회면 요청에 전달
 */
@RequiredArgsConstructor
@ControllerAdvice
public class GlobalModelAttributeAdvice {
    private final MemberService memberService;

    /**
     * 인증된 회원의 최신 정보를 DB에서 조회하여
     * 공통 헤더에서 사용할 수 있도록 Model에 추가한다.
     *
     * 비로그인 요청에는 principal이 null이므로
     * 회원 정보를 조회하지 않는다.
     *
     * @param principal Spring Security에 저장된 로그인 회원
     * @param model JSP에 공통 정보를 전달하는 Model
     */
    @ModelAttribute
    public void addAuthenticatedMember(@AuthenticationPrincipal LoginMemberPrincipal principal,
                                       Model model) {
        if (principal == null) {
            return;
        }

        /*
         * Principal의 닉네임은 로그인 시점의 값일 수 있으므로
         * 회원 번호를 이용해 최신 회원 정보를 DB에서 조회한다.
         */
        Member headerMember = memberService.findById(principal.getMemberNo());
        model.addAttribute("headerMember", headerMember);
    }
}
