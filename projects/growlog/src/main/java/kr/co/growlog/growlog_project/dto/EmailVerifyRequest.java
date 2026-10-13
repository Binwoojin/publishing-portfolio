package kr.co.growlog.growlog_project.dto;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class EmailVerifyRequest {
    private String email;
    private String emailCode;
}
