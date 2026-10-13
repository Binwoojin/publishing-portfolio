package kr.co.growlog.growlog_project.service;

// 성장 기록 비즈니스 로직을 담당하는 Service

import kr.co.growlog.growlog_project.dto.GrowthRecordRequest;
import kr.co.growlog.growlog_project.entity.Goal;
import kr.co.growlog.growlog_project.entity.GrowthRecord;
import kr.co.growlog.growlog_project.entity.Member;
import kr.co.growlog.growlog_project.entity.Media;
import kr.co.growlog.growlog_project.entity.MediaType;
import kr.co.growlog.growlog_project.repository.GoalRepository;
import kr.co.growlog.growlog_project.repository.GrowthRecordRepository;
import kr.co.growlog.growlog_project.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GrowthRecordService {

    private final GrowthRecordRepository growthRecordRepository;
    private final MemberRepository memberRepository;
    private final GoalRepository goalRepository;
    private final MediaService mediaService;

    private static final int MAX_IMAGE_COUNT = 5; // 성장기록 하나에 첨부할 수 있는 최대 이미지 개수

    // 성장 기록 등록

    // goalNum이 존재하면 해당 회원이 작성한 목표와 연결하고
    // goalNum이 없으면 자유 기록으로 저장

    // @param memberNo 로그인한 회원 번호
    // @param request 성장 기록 등록 요청
    // @return 저장한 성장 기록
    @Transactional
    public GrowthRecord saveRecord(Long memberNo,
                                   GrowthRecordRequest request) {
        // 작성 회원 조회
        Member member = memberRepository.findById(memberNo).orElseThrow(() -> new IllegalArgumentException("회원 정보를 찾을 수 없습니다."));

        // 기본값은 목표와 연결하지 않는 자유 기록
        Goal goal = null;

        // 목표 번호가 전달된 경우에만 목표 조회
        if (request.getGoalNum() != null) {
            goal = goalRepository.findByGoalNumAndMemberMemberNo(request.getGoalNum(), memberNo).orElseThrow(() -> new IllegalArgumentException("연결할 목표를 찾을 수 없습니다."));
        }

        // 입력값 검증 (하단에 추가)
        validateRequest(request);

        // 첨부 이미지가
        validateImageFiles(request.getImageFiles());

        // 성장 기록 Entity 생성
        GrowthRecord growthRecord = GrowthRecord.builder()
                .member(member).goal(goal).title(request.getTitle().trim())
                .content(request.getContent().trim())
                .todayLearning(normalizeText(request.getTodayLearning()))
                .difficulty(normalizeText(request.getDifficulty()))
                .solution(normalizeText(request.getSolution()))
                .retrospective(normalizeText(request.getRetrospective())).build();

        GrowthRecord savedRecord = growthRecordRepository.save(growthRecord);

        List<MultipartFile> imageFiles = request.getImageFiles();
        int imageCount = imageFiles == null
                ? 0
                : (int) imageFiles.stream()
                        .filter(file -> file != null && !file.isEmpty())
                        .count();

        if (request.getYoutubeUrl() != null && !request.getYoutubeUrl().isBlank()) {
            mediaService.extractYoutubeVideoId(request.getYoutubeUrl());
        }

        mediaService.uploadAndSaveImageMediaList(
                savedRecord,
                imageFiles,
                memberNo
        );

        if (request.getYoutubeUrl() != null && !request.getYoutubeUrl().isBlank()) {
            mediaService.saveYoutubeMedia(
                    savedRecord,
                    request.getYoutubeUrl(),
                    imageCount
            );
        }

        return savedRecord;
    }
    
    // 성장 기록 목록 조회
    
    // 로그인한 회원의 성장 기록 목록을 최신순으로 조회
    // @param memberNo 로그인한 회원 번호
    // @return 성장 기록 목록
    public List<GrowthRecord> findRecordsByMember(Long memberNo) {
        return growthRecordRepository.findByMemberMemberNoOrderByCreatedAtDesc(memberNo);
    }
    
    // 성장 기록 한 건 조회
    
    // 성장 기록 번호와 회원 번호로 기록 한 건을 조회
    // @param recordNum 성장 기록 번호
    // @param memberNo 로그인한 회원 번호
    // @return 조회한 성장 기록
    public GrowthRecord findRecordById(Long recordNum, Long memberNo) {
        return growthRecordRepository.findByRecordNumAndMemberMemberNo(recordNum, memberNo).orElseThrow(() -> new IllegalArgumentException("성장 기록을 찾을 수 없습니다."));
    }

    // 회원이 작성한 전체 성장 기록 개수를 조회

    // Repository의 countByMemberMemberNo()를 호출해서
    // 해당 회원 번호와 연결된 성장 기록 수를 반환

    // @param memberNo 조회할 회원 번호
    // @return 회원이 작성한 성자이 기록 개수
    public long countRecordByMember(Long memberNo) {
        return growthRecordRepository.countByMemberMemberNo(memberNo);
    }

    // 로그인한 회원이 이번 달에 작성한 성장 기록 개수를 조회
    public long countThisMonthRecords(Long memberNo) {

        // 이번 달 1일 00:00
        LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();

        // 다음 달 1일 00:00
        LocalDateTime startOfNextMonth = startOfMonth.plusMonths(1);

        return growthRecordRepository.countByMemberMemberNoAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(memberNo, startOfMonth, startOfNextMonth);
    }

    // 로그인한 회원이 최근에 작성한 성장기록 3개를 조회

    // @param memberNo 로그인한 회원 번호
    // @return 최근 성장기록 목록
    public List<GrowthRecord> findRecentRecordsByMember(Long memberNo) {
        return growthRecordRepository.findTop3ByMemberMemberNoOrderByCreatedAtDesc(memberNo);
    }


    // 성장 기록 수정

    // 성장 기록을 수정
    // 로그인 회원이 작성한 기록인지 먼저 확인하고,
    // 목표 번호가 전달된 경우 로그인 회원의 목표인지도 확인

    // @param recordNum 수정할 성장 기록 번호
    // @param memberNo 로그인 회원 번호
    // @param request 수정 요청 데이터
    // @return 수정된 성장 기록
    @Transactional
    public GrowthRecord updateRecord(Long recordNum, Long memberNo, GrowthRecordRequest request) {
        // 필수 입력값 검증
        validateRequest(request);
        validateImageFiles(request.getImageFiles());

        // 성장 기록 번호와 로그인 회원 번호를 함께 조회하여
        // 다른 회원의 기록을 수정하지 못하도록 한다.
        GrowthRecord growthRecord = growthRecordRepository.findByRecordNumAndMemberMemberNo(recordNum, memberNo)
                .orElseThrow(() -> new IllegalArgumentException("수정할 성장 기록을 찾을 수 없습니다."));

        // 기본값은 목표와 연결하지 않는 자유 기록
        Goal goal = null;

        // 목표 번호가 전달되었다면,
        // 로그인 회원이 소유한 목표인지 확인
        if (request.getGoalNum() != null) {
            goal = goalRepository.findByGoalNumAndMemberMemberNo(request.getGoalNum(), memberNo)
                    .orElseThrow(() -> new IllegalArgumentException("연결할 목표를 찾을 수 없습니다."));
        }

        List<MultipartFile> imageFiles = request.getImageFiles();
        int newImageCount = imageFiles == null
                ? 0
                : (int) imageFiles.stream()
                        .filter(file -> file != null && !file.isEmpty())
                        .count();
        long existingImageCount = mediaService.countImageMediaByRecord(recordNum);
        List<Media> mediaToDelete = mediaService.findMediaToDelete(
                recordNum,
                request.getDeleteMediaNums()
        );
        long deletedImageCount = mediaToDelete.stream()
                .filter(media -> media.getMediaType() == MediaType.IMAGE)
                .count();

        if (existingImageCount - deletedImageCount + newImageCount > MAX_IMAGE_COUNT) {
            throw new IllegalArgumentException(
                    "기존 사진을 포함해 최대 " + MAX_IMAGE_COUNT + "장까지 등록할 수 있습니다."
            );
        }

        String youtubeUrl = request.getYoutubeUrl();
        if (youtubeUrl != null && !youtubeUrl.isBlank()) {
            mediaService.extractYoutubeVideoId(youtubeUrl);
        }

        int nextSortOrder = mediaService.findNextSortOrder(recordNum);

        // 수정 요청값을 기존 Entity에 반영
        growthRecord.setGoal(goal);
        growthRecord.setTitle(request.getTitle().trim());
        growthRecord.setContent(request.getContent().trim());
        growthRecord.setTodayLearning(normalizeText(request.getTodayLearning()));
        growthRecord.setDifficulty(normalizeText(request.getDifficulty()));
        growthRecord.setSolution(normalizeText(request.getSolution()));
        growthRecord.setRetrospective(normalizeText(request.getRetrospective()));

        mediaService.deleteMediaList(mediaToDelete);

        mediaService.uploadAndSaveImageMediaList(
                growthRecord,
                imageFiles,
                memberNo,
                nextSortOrder
        );

        if (youtubeUrl != null && !youtubeUrl.isBlank()) {
            mediaService.saveYoutubeMedia(
                    growthRecord,
                    youtubeUrl,
                    nextSortOrder + newImageCount
            );
        }

        // 영속 상태의 Entity이므로 트랜젝션 종료 시,
        // JPA 변경 감지로 UPDATE 쿼리가 실행
        return growthRecord;
    }

    // 성장 기록 삭제

    // 성장 기록 번호와 고르인 회원 번호를 함께 조회하여
    // 다른 회원의 기록을 삭제하지 못하도록 한다.

    // @param recordNum 삭제할 성장 기록 번호
    // @param memberNo 로그인 회원 정보
    @Transactional
    public void deleteRecord(Long recordNum, Long memberNo) {
        // 로그인 회원이 작성한 성장 기록인지 확인
        // 조회되지 않으면 예외를 발생시켜 삭제를 중단
        GrowthRecord growthRecord = growthRecordRepository.findByRecordNumAndMemberMemberNo(recordNum, memberNo)
                .orElseThrow(() -> new IllegalArgumentException("삭제할 성장 기록을 찾을 수 없습니다."));

        mediaService.deleteAllMediaByRecord(recordNum);

        // 확인된 성장 기록 삭제
        growthRecordRepository.delete(growthRecord);
    }

    // 입력값 검증

    // 성장 기록 필수 입력값을 검증
    // @param request 성장 기록 요청 DTO
    private void validateRequest(GrowthRecordRequest request) {
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new IllegalArgumentException("성장 기록 제목을 입력해 주세요");
        }

        if (request.getContent() == null || request.getContent().isBlank()) {
            throw new IllegalArgumentException("성장 기록 내용을 입력해 주세요.");
        }
    }

    /**
     * 성장기록에 첨부된 이미지 개수를 검증한다
     *
     * 브라우저에서 파일 선택을 취소하거나 빈 파일 항목이 전달될 수 있으므로
     * null 또는 빈 파일은 제외하고 실제 파일만 계산한다.
     *
     * @param imageFiles 사용자가 선택한 이미지 파일 목록
     */
    private void validateImageFiles(List<MultipartFile> imageFiles) {

        // 이미지가 전달되지 않은 경우에는 검증할 필요가 없다.
        if (imageFiles == null || imageFiles.isEmpty()) {
            return;
        }

        /**
         * MultipartFile 목록에 포함된 값 중에서
         * null이 아니고 실제 파일 내용이 존재하는 항목만 계산한다.
         */
        long actualImageCount = imageFiles.stream().filter(imageFile -> imageFile != null && !imageFile.isEmpty()).count();

        // 실제 이미지가 최대 허용 개수를 초과하면 등록을 중단
        if (actualImageCount > MAX_IMAGE_COUNT) {
            throw new IllegalArgumentException("이미지는 최대" + MAX_IMAGE_COUNT + "장까지 등록할 수 있습니다.");
        }
    }

    // 선택 입력값 정리

    // 선택 입력값이 비어 있으면 NULL로 변환
    // @param value 입력값
    // @return 정리한 문자열 또는 NULL
    private String normalizeText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }

    /**
     * 로그인 회원이 선택한 달에 작성한 성장 기록을 조회한다.
     */
    public List<GrowthRecord> findRecordsByMemberAndMonth(Long memberNo, YearMonth yearMonth) {
        LocalDateTime startOfMonth = yearMonth.atDay(1).atStartOfDay();
        LocalDateTime startOfNextMonth = yearMonth.plusMonths(1).atDay(1).atStartOfDay();

        return growthRecordRepository.findByMemberMemberNoAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(memberNo, startOfMonth, startOfNextMonth);
    }

    /**
     * 로그인 회원이 선택한 달에 작성한 성장 기록 개수를 조회한다.
     */
    public long countRecordByMemberAndMonth(Long memberNo, YearMonth yearMonth) {
        LocalDateTime startOfMonth = yearMonth.atDay(1).atStartOfDay();
        LocalDateTime startOfNextMonth = yearMonth.plusMonths(1).atDay(1).atStartOfDay();

        return growthRecordRepository.countByMemberMemberNoAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(memberNo, startOfMonth, startOfNextMonth);
    }

}
