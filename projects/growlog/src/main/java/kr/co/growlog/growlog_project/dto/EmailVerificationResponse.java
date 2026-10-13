package kr.co.growlog.growlog_project.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class EmailVerificationResponse {

    private boolean success;
    private String message;
}
