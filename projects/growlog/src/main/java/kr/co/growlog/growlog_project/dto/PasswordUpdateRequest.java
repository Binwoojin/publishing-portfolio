package kr.co.growlog.growlog_project.dto;

// 계정 설정 화면에서 비밀번호 변경 요청을 전달받는 DTO

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PasswordUpdateRequest {

    // 현재 사용 중인 비밀번호
    private String currentPassword;

    // 새롭게 설정할 비밀번호
    private String newPassword;

    // 새 비밀번호 입력 실수를 방지하기 위한 확인 값
    private String newPasswordConfirm;
}
