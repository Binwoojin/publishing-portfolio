package kr.co.growlog.growlog_project.controller;

import kr.co.growlog.growlog_project.entity.GrowthRecord;
import kr.co.growlog.growlog_project.entity.Member;
import kr.co.growlog.growlog_project.security.LoginMemberPrincipal;
import kr.co.growlog.growlog_project.service.GrowthRecordService;
import kr.co.growlog.growlog_project.service.MediaService;
import kr.co.growlog.growlog_project.service.MemberService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpMethod;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/*
 * Record Create/Update/Delete를 Vue로 옮기면서 새로 노출한 API가
 * 기존 GrowthRecordService를 그대로 재사용하는지, 검증 실패 시 400으로
 * 응답하는지 확인한다. GoalApiControllerTest와 같은 패턴을 따르되,
 * Create/Update는 이미지 파일을 함께 받아야 해서 JSON 대신
 * GrowthRecordControllerTest(JSP)와 동일한 multipart() 요청으로 검증한다.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class GrowthRecordApiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private MemberService memberService;

    @MockitoBean
    private GrowthRecordService growthRecordService;

    @MockitoBean
    private MediaService mediaService;

    private LoginMemberPrincipal principal;
    private Member loginMember;

    @BeforeEach
    void setUp() {
        loginMember = Member.builder()
                .memberNo(1L)
                .email("record-api-test@example.com")
                .password("encoded-password")
                .nickname("기록API테스트회원")
                .userName("테스트")
                .build();

        principal = new LoginMemberPrincipal(loginMember);
        when(memberService.findById(1L)).thenReturn(loginMember);
    }

    private GrowthRecord sampleRecord() {
        return GrowthRecord.builder()
                .recordNum(10L)
                .member(loginMember)
                .title("Vue Record 전환 기록")
                .content("Record Create를 Vue로 옮겼다.")
                .build();
    }

    @Test
    @DisplayName("비로그인 상태로 GET /api/records/{id}를 호출하면 401을 받는다.")
    void detailWithoutLoginReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/records/10"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("로그인 상태로 기록 상세를 조회하면 기존 Service 값을 JSON으로 받는다.")
    void detailReturnsRecordFromExistingService() throws Exception {
        when(growthRecordService.findRecordById(10L, 1L)).thenReturn(sampleRecord());
        when(mediaService.findMediaByGrowthRecord(10L)).thenReturn(List.of());

        mockMvc.perform(get("/api/records/10").with(user(principal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recordNum").value(10))
                .andExpect(jsonPath("$.title").value("Vue Record 전환 기록"));
    }

    @Test
    @DisplayName("CSRF 토큰 없이 기록을 생성하면 403으로 막힌다.")
    void createWithoutCsrfIsForbidden() throws Exception {
        mockMvc.perform(multipart("/api/records")
                        .with(user(principal))
                        .param("title", "t")
                        .param("content", "c"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("기록 생성에 성공하면 201과 생성된 기록을 받는다.")
    void createRecordSucceeds() throws Exception {
        when(growthRecordService.saveRecord(eq(1L), any())).thenReturn(sampleRecord());
        when(mediaService.findMediaByGrowthRecord(10L)).thenReturn(List.of());

        mockMvc.perform(multipart("/api/records")
                        .with(user(principal))
                        .with(csrf())
                        .param("title", "Vue Record 전환 기록")
                        .param("content", "Record Create를 Vue로 옮겼다.")
                        .param("difficulty", "NORMAL"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.recordNum").value(10))
                .andExpect(jsonPath("$.title").value("Vue Record 전환 기록"));
    }

    @Test
    @DisplayName("기록 생성 요청이 검증에 실패하면 400과 에러 메시지를 받는다.")
    void createRecordValidationFailureReturns400() throws Exception {
        when(growthRecordService.saveRecord(eq(1L), any()))
                .thenThrow(new IllegalArgumentException("성장 기록 제목을 입력해 주세요"));

        mockMvc.perform(multipart("/api/records")
                        .with(user(principal))
                        .with(csrf())
                        .param("content", "본문만 있고 제목이 없음"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("성장 기록 제목을 입력해 주세요"));
    }

    @Test
    @DisplayName("기록 수정에 성공하면 수정된 기록을 받는다.")
    void updateRecordSucceeds() throws Exception {
        GrowthRecord updated = GrowthRecord.builder()
                .recordNum(10L)
                .member(loginMember)
                .title("수정된 기록 제목")
                .content("수정된 기록 내용")
                .build();

        when(growthRecordService.updateRecord(eq(10L), eq(1L), any())).thenReturn(updated);
        when(mediaService.findMediaByGrowthRecord(10L)).thenReturn(List.of());

        mockMvc.perform(multipart(HttpMethod.PUT, "/api/records/10")
                        .with(user(principal))
                        .with(csrf())
                        .param("title", "수정된 기록 제목")
                        .param("content", "수정된 기록 내용")
                        .param("difficulty", "HARD"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("수정된 기록 제목"));
    }

    @Test
    @DisplayName("다른 회원의 기록을 수정하려 하면 400과 에러 메시지를 받는다.")
    void updateRecordWithoutPermissionReturns400() throws Exception {
        when(growthRecordService.updateRecord(eq(10L), eq(1L), any()))
                .thenThrow(new IllegalArgumentException("수정할 성장 기록을 찾을 수 없습니다."));

        mockMvc.perform(multipart(HttpMethod.PUT, "/api/records/10")
                        .with(user(principal))
                        .with(csrf())
                        .param("title", "t")
                        .param("content", "c"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("수정할 성장 기록을 찾을 수 없습니다."));
    }

    @Test
    @DisplayName("기록 삭제에 성공하면 204를 받는다.")
    void deleteRecordSucceeds() throws Exception {
        doNothing().when(growthRecordService).deleteRecord(10L, 1L);

        mockMvc.perform(delete("/api/records/10")
                        .with(user(principal))
                        .with(csrf()))
                .andExpect(status().isNoContent());

        verify(growthRecordService).deleteRecord(10L, 1L);
    }

    @Test
    @DisplayName("존재하지 않는 기록을 삭제하려 하면 400과 에러 메시지를 받는다.")
    void deleteRecordNotFoundReturns400() throws Exception {
        doThrow(new IllegalArgumentException("삭제할 성장 기록을 찾을 수 없습니다."))
                .when(growthRecordService).deleteRecord(anyLong(), eq(1L));

        mockMvc.perform(delete("/api/records/999")
                        .with(user(principal))
                        .with(csrf()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("삭제할 성장 기록을 찾을 수 없습니다."));
    }
}
