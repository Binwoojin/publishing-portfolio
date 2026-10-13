package kr.co.growlog.growlog_project.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class DuplicateCheckResponse {
    private boolean duplicated;
    private String message;
}
