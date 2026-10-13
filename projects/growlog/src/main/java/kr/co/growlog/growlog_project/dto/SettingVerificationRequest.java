package kr.co.growlog.growlog_project.dto;

// 계정 설정 페이지에 들어가기 전에 현재 로그인 회원의 비밀번호를 다시 확인하기 위한 DTO

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SettingVerificationRequest {

    // 로그인 계정의 현재 비밀번호
    private String password;
}
