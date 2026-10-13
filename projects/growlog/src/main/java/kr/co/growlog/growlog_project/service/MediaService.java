package kr.co.growlog.growlog_project.service;

import kr.co.growlog.growlog_project.dto.MediaResponse;
import kr.co.growlog.growlog_project.entity.GrowthRecord;
import kr.co.growlog.growlog_project.entity.Media;
import kr.co.growlog.growlog_project.entity.MediaType;
import kr.co.growlog.growlog_project.repository.MediaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 성장기록에 첨부되는 이미지와 Youtube 미디어를 처리하는 Service
 * 
 * 담당 기능 : 
 * 1. 이미지 미디어 정보 저장
 * 2. Youtube 미디어 정보 저장
 * 3. Youtube URL에서 영상 ID 추출
 * 4. 성장기록 미디어 목록 조회
 * 5. 미디어 삭제
 */

@RequiredArgsConstructor
@Service
@Transactional(readOnly = true)
public class MediaService {

    private final MediaRepository mediaRepository;
    private final S3FileStorageService s3FileStorageService;

    /**
     * YouTube URL에서 11자리 영상 ID를 추출하기 위한 정규식
     * <p>
     * 지원 주소 :
     * - https://www.youtube.com/watch?v=영상ID
     * - https://youtu.be/영상ID
     * - https://www.youtube.com/embed/영상ID
     * - https://ww.youtube.com/shorts/영상ID
     * <p>
     * 영상 ID에 사용되는 영문, 숫자, 밑줄, 하이픈을 허용한다.
     */
    private static final Pattern YOUTUBE_URL_PATTERN = Pattern.compile("(?:youtube\\.com/(?:watch\\?(?:.*&)?v=|embed/|shorts/)|youtu\\.be/)"
            + "([a-zA-Z0-9_-]{11})");

    /**
     * 이미지 미디어 정보를 media 테이블에 저장한다
     * <p>
     * 이 메서드는 실제 이미지 파일을 서버에 저장하는 기능이 아니며,
     * 파일 업로드 처리가 완료된 후 생성된 이미지 접근 경로를 저장한다.
     * <p>
     * Ex) /uploads/media/550e8400-image.png
     *
     * @param growthRecord 미디어를 연결할 성장기록
     * @param mediaUrl     서버에 저장된 이미지 접근 경로
     * @param sortOrder    성장기록 안에서의 출력순서
     * @return 저장된 Media Entity
     */
    @Transactional
    public Media saveImageMedia(GrowthRecord growthRecord, String mediaUrl, Integer sortOrder) {
        validateGrowthRecord(growthRecord);

        if (mediaUrl == null || mediaUrl.isBlank()) {
            throw new IllegalArgumentException("저장할 이미지 경로가 필요합니다.");
        }

        Media imageMedia = Media.createImage(growthRecord, mediaUrl.trim(), normalizeSortOrder(sortOrder));

        return mediaRepository.save(imageMedia);
    }

    /**
     * YouTube 영상 정보를 media 테이블에 저장
     * <p>
     * 사용자에게 전달받은 YouTube URL에서 영상 ID를 추출하고,
     * 해당 ID를 이용해 썸네일 주소를 생성한 후 저장한다.
     * <p>
     * media_url에는 값을 저장하지 않고,
     * youtube_video_id와 thumbnail_url에 값을 저장한다.
     *
     * @param growthRecord 미디어를 연결할 성장기록
     * @param youtubeUrl   사용자가 입력한 YouTube 영상 주소
     * @param sortOrder    성장기록 안에서의 출력 순서
     * @return 저장된 Media Entity
     */
    @Transactional
    public Media saveYoutubeMedia(GrowthRecord growthRecord, String youtubeUrl, Integer sortOrder) {
        validateGrowthRecord(growthRecord);

        String youtubeVideoId = extractYoutubeVideoId(youtubeUrl);
        String thumbnailUrl = createYoutubeThumbnailUrl(youtubeVideoId);

        Media youtubeMedia = Media.createYoutube(growthRecord, youtubeVideoId, thumbnailUrl, normalizeSortOrder(sortOrder));

        return mediaRepository.save(youtubeMedia);
    }

    /**
     * 특정 성장기록에 연결된 미디어 목록을 조회한다
     * <p>
     * sort_order가 낮은 미디어부터 반환
     *
     * @param recordNum 성장기록 번호
     * @return 성장 기록에 연결된 미디어 목록
     */
    public List<Media> findMediaByRecord(Long recordNum) {
        validateRecordNum(recordNum);

        return mediaRepository.findByGrowthRecordRecordNumOrderBySortOrderAsc(recordNum);
    }

    /**
     * 미디어 번호를 기준으로 미디어 한 건을 조회한다.
     *
     * @param mediaNum 미디어 번호
     * @return 조회된 Media Entity
     */
    public Media findMediaById(Long mediaNum) {
        if (mediaNum == null) {
            throw new IllegalArgumentException("미디어 번호가 필요합니다.");
        }
        return mediaRepository.findById(mediaNum).orElseThrow(() -> new IllegalArgumentException("해당 미디어를 찾을 수 없습니다."));
    }

    /**
     * 특정 성장기록에 등록된 전체 미디어 개수를 조회한다.
     *
     * @param recordNum 성장기록 번호
     * @return 미디어 개수
     */
    public long countMediaByRecord(Long recordNum) {
        validateRecordNum(recordNum);

        return mediaRepository.countByGrowthRecordRecordNum(recordNum);
    }

    public long countImageMediaByRecord(Long recordNum) {
        return findMediaByRecord(recordNum).stream()
                .filter(media -> media.getMediaType() == MediaType.IMAGE)
                .count();
    }

    public int findNextSortOrder(Long recordNum) {
        return findMediaByRecord(recordNum).stream()
                .map(Media::getSortOrder)
                .filter(java.util.Objects::nonNull)
                .max(Integer::compareTo)
                .map(order -> order + 1)
                .orElse(0);
    }

    public List<Media> findMediaToDelete(Long recordNum, List<Long> mediaNums) {
        validateRecordNum(recordNum);

        if (mediaNums == null || mediaNums.isEmpty()) {
            return List.of();
        }

        Set<Long> requestedMediaNums = new HashSet<>(mediaNums);
        if (requestedMediaNums.contains(null)) {
            throw new IllegalArgumentException("삭제할 미디어 번호가 올바르지 않습니다.");
        }

        List<Media> mediaToDelete = mediaRepository.findAllById(requestedMediaNums);
        boolean containsOtherRecordMedia = mediaToDelete.size() != requestedMediaNums.size()
                || mediaToDelete.stream().anyMatch(media ->
                        !recordNum.equals(media.getGrowthRecord().getRecordNum()));

        if (containsOtherRecordMedia) {
            throw new IllegalArgumentException("삭제할 수 없는 미디어가 포함되어 있습니다.");
        }

        return mediaToDelete;
    }

    @Transactional
    public void deleteMediaList(List<Media> mediaList) {
        if (mediaList == null || mediaList.isEmpty()) {
            return;
        }

        for (Media media : mediaList) {
            if (media.getMediaType() == MediaType.IMAGE
                    && media.getMediaUrl() != null
                    && !media.getMediaUrl().isBlank()) {
                s3FileStorageService.deleteImage(media.getMediaUrl());
            }
        }

        mediaRepository.deleteAll(mediaList);
        mediaRepository.flush();
    }

    /**
     * 특정 성장기록에 첨부된 미디어를 조회
     *
     * CB에 저장된 S3 Object Key를 Presigned URL로 변환한 뒤
     * 상세 페이지에서 사용할 DTO 목록으로 반환한다.
     */
    public List<MediaResponse> findMediaByGrowthRecord(Long recordNum) {
        List<Media> mediaList = mediaRepository.findByGrowthRecordRecordNumOrderBySortOrderAsc(recordNum);

        return mediaList.stream().map(this::convertToMediaResponse).toList();
    }

    /**
     * Media Entity를 화면 출력용 DTO로 변환
     */
    private MediaResponse convertToMediaResponse(Media media) {
        String mediaUrl = null;

        /*
         * 이미지인 경우 DB에 저장된 Object Key를 사용하여 일정 시간 동안 접근 가능한
         * Presigned URL을 그대로 사용할 수 있다.
         */
        if (media.getMediaType() == MediaType.IMAGE) {
            mediaUrl = s3FileStorageService.createPresignedUrl(media.getMediaUrl());
        }

        if (media.getMediaType() == MediaType.YOUTUBE) {
            mediaUrl = "https://www.youtube.com/embed/" + media.getYoutubeVideoId();
        }

        return new MediaResponse(media.getMediaNum(), media.getMediaType(), mediaUrl, media.getSortOrder());
    }

    /**
     * 미디어 번호를 기준으로 미디어 한 건을 삭제
     * <p>
     * 실제 이미지 파일을 서버에서도 제거하려면
     * 이후 파일 저장 기능을 구현할 때 파일 삭제 로직을 추가해야 한다.
     * <p>
     * 현재 메서드는 media 테이블의 행만 삭제
     *
     * @param mediaNum 삭제할 미디어 번호
     */
    @Transactional
    public void deleteMedia(Long mediaNum) {
        Media media = findMediaById(mediaNum);

        /**
         * Youtube 미디어는 S3 파일이 없으므로
         * IMAGE 타입인 경우에만 S3 삭제를 실행한다
         */
        if (media.getMediaType() == MediaType.IMAGE) {
            String objectKey = media.getMediaUrl();

            if (objectKey != null && !objectKey.isBlank()) {
                s3FileStorageService.deleteImage(objectKey);
            }
        }

        mediaRepository.delete(media);
    }

    /**
     * 특정 성장기록에 연결된 모든 미디어를 삭제한다.
     * <p>
     * IMAGE 타입은 S3에 저장된 실제 파일을 먼저 삭제하고,
     * 이후 해당 성장기록에 연결된 MEDIA 행을 모두 삭제한다.
     * <p>
     * Youtube 미디어는 별도의 S3 파일이 없으므로
     * MEDIA 행만 삭제된다.
     *
     * @param recordNum 성장기록 번호
     */

    @Transactional
    public void deleteAllMediaByRecord(Long recordNum) {
        validateRecordNum(recordNum);

        List<Media> mediaList = mediaRepository.findByGrowthRecordRecordNumOrderBySortOrderAsc(recordNum);

        // 연결된 이미지 파일을 S3에서 먼저 삭제한다.
        for (Media media : mediaList) {
            if (media.getMediaType() == MediaType.IMAGE) {
                String objectKey = media.getMediaUrl();

                if (objectKey != null && !objectKey.isBlank()) {
                    s3FileStorageService.deleteImage(objectKey);
                }
            }
        }
        // S3 파일 정리가 끝나면 MEDIA 테이블의 행을 삭제한다.
        mediaRepository.deleteByGrowthRecordRecordNum(recordNum);
    }

    /**
     * YouTube URL에서 영상 ID를 추출한다.
     * <p>
     * Ex) https://www.youtube.com/watch?v=dQw4w9WgXcQ
     * -> dQw4w9WgXcQ
     * https://youtu.be/dQw4w9WgXcQ
     * -> dQw4w9WgXcQ
     *
     * @param youtubeUrl 사용자가 입력한 Youtube 영상 URL
     * @return 11자리 Youtube 영상 ID
     */
    public String extractYoutubeVideoId(String youtubeUrl) {
        if (youtubeUrl == null || youtubeUrl.isBlank()) {
            throw new IllegalArgumentException("YouTube 영상 주소를 입력해주세요.");
        }

        Matcher matcher = YOUTUBE_URL_PATTERN.matcher(youtubeUrl.trim());

        if (!matcher.find()) {
            throw new IllegalArgumentException("올바른 YouTube 영상 주소를 입력해주세요.");
        }

        return matcher.group(1);
    }

    /**
     * YouTube 영상 ID를 이용하여 썸네일 주소를 생성한다.
     *
     * @param youtubeVideoId YouTube 영상 ID
     * @return YouTube 기본 썸네일 주소
     */
    public String createYoutubeThumbnailUrl(String youtubeVideoId) {
        if (youtubeVideoId == null || youtubeVideoId.isBlank()) {
            throw new IllegalArgumentException("YouTube 영상 ID가 필요합니다.");
        }

        return "https://img.youtube.com/vi/" + youtubeVideoId + "/hqdefault.jpg";
    }

    /**
     * 미디어와 연결할 GrowthRecord가 정상적으로 전달되었는지 확인한다
     */
    private void validateGrowthRecord(GrowthRecord growthRecord) {
        if (growthRecord == null) {
            throw new IllegalArgumentException("미디어를 연결할 성장기록이 필요합니다.");
        }

        /**
         * 아직 DB에 저장되지 않은 GrowthRecord는 recordNum이 null이다.
         * media.record_num에는 저장된 성장기록 번호가 필요하므로 이를 차단한다.
         */
        if (growthRecord.getRecordNum() == null) {
            throw new IllegalArgumentException("성장기록을 먼저 저장한 후 미디어를 등록해주세요.");
        }
    }

    /**
     * 성장기록 번호가 정상적으로 전달되었는지 확인한다.
     */
    private void validateRecordNum(Long recordNum) {
        if (recordNum == null) {
            throw new IllegalArgumentException("성장기록 번호가 필요합니다.");
        }
    }

    /**
     * 출력 순서가 null이면 0으로 변환하고,
     * 음수 값이 전달되면 등록을 차단한다.
     */
    private int normalizeSortOrder(Integer sortOrder) {
        if (sortOrder == null) {
            return 0;
        }

        if (sortOrder < 0) {
            throw new IllegalArgumentException("미디어 출력 순서는 0 이상이어야 합니다.");
        }

        return sortOrder;
    }

    /**
     * 이미지 파일을 S3에 업로드하고,
     * 반환된 Object Key를 media 테이블에 저장한다.
     * <p>
     * 처리 순서:
     * 1. 성장기록 유효성 검사
     * 2. S3 이미지 업로드
     * 3. S3 Object Key 반환
     * 4. media 테이블 저장
     *
     * @param growthRecord 이미지를 연결할 성장기록
     * @param imageFile    사용자가 업로드한 이미지 파일
     * @param memberNo     이미지를 업로드한 회원 번호
     * @param sortOrder    성장기록 화면에서의 이미지 출력 순서
     * @return 저장된 Media Entity
     */
    @Transactional
    public Media uploadAndSaveImageMedia(GrowthRecord growthRecord, MultipartFile imageFile, Long memberNo, Integer sortOrder) {
        validateGrowthRecord(growthRecord);

        if (memberNo == null) {
            throw new IllegalArgumentException("이미지를 업로드할 회원 번호가 필요합니다.");
        }

        /*
         * S3FileStorageService가 이미 다음 검사를 수행하므로
         * 여기서는 동일한 이미지 검증을 중복해서 작성하지 않는다.
         *
         * - null 여부
         * - 빈 파일 여부
         * - 이미지 Content-Type 여부
         * - 최대 파일 크기 여부
         */
        String objectKey = s3FileStorageService.uploadImage(imageFile, "records", memberNo);

        try {
            /*
             * S3 업로드가 완료되면 반환된 Object Key를
             * media_url 컬럼에 저장
             *
             * 저장 예시 ) records/15/550e8400-e29b-41d4-a716-446655440000.png
             */
            return saveImageMedia(growthRecord, objectKey, sortOrder);
        } catch (RuntimeException e) {
            /*
             * S3 업로드는 성공했지만 media 테이블 저장이 실패하면
             * S3에 사용되지 않는 이미지가 남을 수 있다.
             *
             * 이를 방지하기 위해 방금 업로드한 이미지를 다시 삭제한다.
             */
            try {
                s3FileStorageService.deleteImage(objectKey);
            } catch (RuntimeException deleteException) {
                /*
                 * 원래 발생한 DB 저장 예외를 유지하면서
                 * S3 삭제 실패 정보도 함께 남긴다.
                 */
                e.addSuppressed(deleteException);
            }

            throw e;
        }
    }

    /**
     * 여러 장의 이미지를 순서대로 S3에 업로드하고
     * media 테이블에 저장한다.
     * <p>
     * 빈 파일은 건너뛰며,
     * 실제 저장되는 순서에 따라 sortOrder를 부여
     *
     * @param growthRecord 이미지를 연결할 성장기록
     * @param imageFiles   업로드할 이미지 목록
     * @param memberNo     이미지를 업로드한 회원 번호
     * @return 저장된 이미지 Media 목록
     */
    @Transactional
    public List<Media> uploadAndSaveImageMediaList(GrowthRecord growthRecord, List<MultipartFile> imageFiles, Long memberNo) {
        return uploadAndSaveImageMediaList(growthRecord, imageFiles, memberNo, 0);
    }

    @Transactional
    public List<Media> uploadAndSaveImageMediaList(
            GrowthRecord growthRecord,
            List<MultipartFile> imageFiles,
            Long memberNo,
            int startSortOrder
    ) {
        validateGrowthRecord(growthRecord);

        if (imageFiles == null || imageFiles.isEmpty()) {
            return List.of();
        }

        /*
         * 브라우저에서 파일을 선택하지 않은 input이
         * 빈 MultipartFile로 전달될 수 있으므로 먼저 제거한다.
         */
        List<MultipartFile> valiImageFiles = imageFiles.stream().filter(file -> file != null && !file.isEmpty()).toList();

        // 성장기록당 최대 이미지 개수를 5장으로 제한한다.
        if (valiImageFiles.size() > 5) {
            throw new IllegalArgumentException("성장기록에는 이미지를 최대 5장까지 등록할 수 있습니다.");
        }

        List<Media> saveMediaList = new java.util.ArrayList<>();
        List<String> uploadObjectKeys = new java.util.ArrayList<>();

        try {
            for (int index = 0; index < valiImageFiles.size(); index++) {
                MultipartFile imageFile = valiImageFiles.get(index);

                String objectKey = s3FileStorageService.uploadImage(imageFile, "records", memberNo);
                uploadObjectKeys.add(objectKey);

                Media saveMedia = saveImageMedia(
                        growthRecord,
                        objectKey,
                        startSortOrder + index
                );
                saveMediaList.add(saveMedia);
            }

            return saveMediaList;

        } catch (RuntimeException e) {
            /*
             * 여러 장을 처리하던 중 한 장이라도 실패하면
             * 이번 요청에서 이미 업로드된 S3 이미지들을 정리한다.
             */
            for (String objectKey : uploadObjectKeys) {
                try {
                    s3FileStorageService.deleteImage(objectKey);
                } catch (RuntimeException deleteException) {
                    e.addSuppressed(deleteException);
                }
            }
            throw e;
        }
    }

    /**
     * 이미지 미디어의 화면 출력용 URL을 생성한다.
     * <p>
     * IMAGE 타입인 경우에만 S3 Presigned URL을 생성하고,
     * YouTube 타입은 S3 이미지가 아니므로 null을 반환한다.
     *
     * @param media 화면에 출력할 Media Entity
     * @return 이미지용 Presigned URL
     */
    public String createImageUrl(Media media) {

        if (media == null) {
            return null;
        }

        /*
         * YouTube 미디어에는 S3 Object Key가 없으므로
         * IMAGE 타입인 경우에만 Presigned URL을 생성
         */

        if (media.getMediaType() != MediaType.IMAGE) {
            return null;
        }

        String objectKey = media.getMediaUrl();

        if (objectKey == null || objectKey.isBlank()) {
            return null;
        }

        return s3FileStorageService.createPresignedUrl(objectKey);

    }

    /**
     * 특정 성장기록에 연결된 이미지들의
     * Presigned URL 목록을 생성한다.
     *
     * Youtube 미디어는 제외하고 IMAGE 타입만 반환한다.
     *
     * @param recordNum
     * @return 화면 출력용 이미지 URL 목록
     */
    public List<String> createImageUrlList(Long recordNum) {
        List<Media> mediaList = findMediaByRecord(recordNum);

        return mediaList.stream().filter(media -> media.getMediaType() == MediaType.IMAGE)
                .map(Media::getMediaUrl)
                .filter(objectKey -> objectKey != null && !objectKey.isBlank())
                .map(s3FileStorageService::createPresignedUrl)
                .toList();
    }
}
