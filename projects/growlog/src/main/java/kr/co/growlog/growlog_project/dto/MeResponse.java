package kr.co.growlog.growlog_project.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/*
 * Vue SPA가 GET /api/me로 현재 로그인 회원을 조회할 때 내려주는 응답
 */
@Getter
@AllArgsConstructor
public class MeResponse {
    private Long memberNo;
    private String email;
    private String nickname;
}
