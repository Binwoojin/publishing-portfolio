package kr.co.growlog.growlog_project.dto;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class JoinRequest {

    private String email;
    private String password;
    private String passwordCheck;
    private String userName;
    private String nickname;
    private String emailCode;
}
