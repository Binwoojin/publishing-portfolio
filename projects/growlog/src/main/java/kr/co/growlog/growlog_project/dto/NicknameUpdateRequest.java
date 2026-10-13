package kr.co.growlog.growlog_project.dto;

// 계정 설정 화면에서 닉네임 변경 요청을 전달받는 DTO

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class NicknameUpdateRequest {

    // 사용자가 새롭게 설정할 닉네임
    private String nickname;
}
