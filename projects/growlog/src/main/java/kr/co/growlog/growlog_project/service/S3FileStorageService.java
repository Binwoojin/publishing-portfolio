package kr.co.growlog.growlog_project.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.core.exception.SdkClientException;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.io.IOException;
import java.io.InputStream;
import java.time.Duration;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class S3FileStorageService {

    // 업로드할 수 있는 이미지의 최대 크기 : 5MB
    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024;
    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    // AWS S3와 통신하기 위한 객체
    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    /**
     * application.yaml의 버킷 이름을 주입받는다.
     *
     * application.yaml 예시)
     * app:
     *  s3:
     *      bucket: growlog-media-2026
     */
    @Value("${app.s3.bucket}")
    private String bucketName;

    /**
     * 이미지 업로드
     *
     * 전달받은 이미지를 S3에 업로드한다.
     *
     * 현재 단계에서는
     * 1. 이미지 파일 검증
     * 2. 원본 파일 확장자 추출
     * 3. UUID를 이용한 고유 파일명 생성
     * 4. S3 Object Key 생성
     * 5. PutObjectRequest 생성
     * 6. S3 업로드
     * 7. DB에 저장할 Object Key 반환
     *
     * @param file 사용자가 업로드한 이미지 파일
     * @param directory S3에서 사용할 최상위 경로 (records, profile)
     * @param memberNo 이미지를 업로드한 회원 번호
     * @return S3에 저장된 파일의 Object Key
     */
    public String uploadImage(MultipartFile file, String directory, Long memberNo) {
        // 1. 업로드 가능한 이미지인지 검사
        validateImage(file);

        // 2. 파일 확장자 추출
        String extension = extractExtension(file);

        // 3. UUID 파일명 생성 | ex) 9f3f9d62-6ec7-42cb-90c8-c43a5b81eafe.png
        String fileName = UUID.randomUUID() + "." + extension;

        // 4. S3 Object Key 생성 | ex) records/15/67f8be84-4bb8-4a51-9dc4-7e29103b1f24.png
        String objectKey = createObjectKey(directory, memberNo, fileName);

        // 5. S3 업로드 요청 정보 생성
        // bucket: 파일이 저장될 S3 버킷 이름
        // key : S3 안에서 파일을 구분하는 전체 경로
        // contentType : image/png, image/jpeg 등의 파일 형식
        // contentLength : 업로드할 파일의 크기
        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(objectKey)
                .contentType(file.getContentType())
                .contentLength(file.getSize())
                .build();

        // 6. 실제 S3 업로드
        try (InputStream inputStream = file.getInputStream()) {
            /**
             * RequestBody.fromInputStream()에
             * 파일 입력 스트림과 정확한 파일 크기를 전달한다.
             */
            RequestBody requestBody = RequestBody.fromInputStream(inputStream, file.getSize());

            /**
             * 생성한 업로드 요청과 파일 데이터를
             * AWS S3에 전달한다
             */
            s3Client.putObject(putObjectRequest, requestBody);
        } catch (S3Exception e) {
            /**
             * AWS 권한, 버킷 이름, 네트워크 문제 등으로
             * S3 업로드가 실패한 경우
             */
            throw new IllegalStateException(createS3ErrorMessage("업로드", e), e);
        } catch (SdkClientException e) {
            throw new IllegalStateException(
                    "AWS 자격 증명 또는 네트워크 문제로 S3 이미지 업로드에 실패했습니다. 원인: "
                            + e.getMessage(),
                    e
            );
        } catch (IOException e) {
            /**
             * MultipartFile에서 파일 데이터를 읽는 과정에서
             * 문제가 발생한 경우
             */
            throw new IllegalArgumentException("이미지 파일을 읽는 중 오류가 발생했습니다.", e);
        }

        // 7. DB에 저장할 Object Key 반환
        // 전체 URL이 아니라 아래와 같은 Key만 반환
        // records/15/uuid.png
        return objectKey;
    }

    /**
     * S3 Object Key 생성
     *
     * S3에 저장될 파일의 전체 Object Key를 생성
     *
     * S3에는 실제 폴더가 존재하는게 아니라,
     * "/"가 포함된 Object Key를 폴더처럼 표시한다
     *
     * ex) directory = records
     *     memberNo = 15
     *     fileName = uuid.png
     *
     * 결과 : records/15/uuid.png
     */
    private String createObjectKey(String directory, Long memberNo, String fileName) {
        // 저장 경로가 전달되지 않은 경우 업로드를 중단
        if (directory == null || directory.isBlank()) {
            throw new IllegalArgumentException("이미지 저장 경로가 필요합니다.");
        }

        // 회원별 폴더를 구분하기 위해 회원 번호를 확인
        if (memberNo == null) {
            throw new IllegalArgumentException("회원 번호가 필요합니다.");
        }

        // UUID 파일명이 정상적으로 생성되었는지 확인
        if (fileName == null || fileName.isBlank()) {
            throw new IllegalArgumentException("저장할 파일명이 필요합니다.");
        }

        /**
         * directory 끝에 "/"가 들어왔을 경우 제거한다.
         *
         * records/가 들어왔을 때
         * records//15/file.png 가 생성되는 것을 방지
         */
        String normalizedDirectory = directory;

        while(normalizedDirectory.endsWith("/")) {
            normalizedDirectory = normalizedDirectory.substring(0, normalizedDirectory.length() - 1);
        }

        return normalizedDirectory + "/" + memberNo + "/" + fileName;
    }

    /**
     * 이미지 검증
     *
     * 업로드 가능한 이미지인지 검사
     *
     * 검사 항목
     * 1. 파일 존재 여부
     * 2. 빈 파일 여부
     * 3. 이미지 파일인지 여부
     * 4. 최대 용량 초과 여부
     */
    private void validateImage(MultipartFile file) {
        // 1. 파일이 전달되지 않은 경우
        if (file == null) {
            throw new IllegalArgumentException("업로드할 이미지가 없습니다.");
        }

        // 2. 빈 파일인지 확인
        if (file.isEmpty()) {
            throw new IllegalArgumentException("빈 파일은 업로드할 수 없습니다.");
        }

        // 3. 이미지 파일인지 확인
        String contentType = file.getContentType();

        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("JPG, PNG, WEBP 이미지 파일만 업로드할 수 있습니다.");
        }

        // 4. 최대 업로드 용량 검사 [ 현재는 5MB 제한 ]
        if (file.getSize() > MAX_IMAGE_SIZE) {
            throw new IllegalArgumentException("이미지 크기는 5MB를 초과할 수 없습니다.");
        }
    }

    /**
     * 파일 확장자 추출
     *
     * 업로드한 파일의 확장자를 추출한다
     *
     * ex) profile.png -> png
     *     photo.jpg -> jpg
     *     image.jpeg -> jpeg
     */
    private String extractExtension(MultipartFile file) {
        // 원본 파일명 가져오기
        String originalFilename = file.getOriginalFilename();

        // 파일명이 없는 경우
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new IllegalArgumentException("파일명을 확인할 수 없습니다.");
        }

        // 마지막 "." 위치 찾기
        int extensionIndex = originalFilename.lastIndexOf(".");

        // "."이 없거나 파일명의 마지막 문자가 "."인 경우
        if (extensionIndex == -1 || extensionIndex == originalFilename.length() - 1) {
            throw new IllegalArgumentException("파일 확장자가 존재하지 않습니다.");
        }

        // "."이후 문자열 반환
        return originalFilename.substring(extensionIndex + 1).toLowerCase();
    }

    /**
     * 이미지 삭제
     *
     * 전달받은 Object Key에 해당하는 이미지를 AWS S3에서 삭제한다.
     *
     * ex) records/15/uuid.png
     */
    public void deleteImage(String objectKey) {

        // Object Key가 없는 경우
        if (objectKey == null || objectKey.isBlank()) {
            return;
        }

        try {
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(objectKey)
                    .build();
            s3Client.deleteObject(deleteObjectRequest);
        } catch (S3Exception e) {
            throw new IllegalStateException(createS3ErrorMessage("삭제", e), e);
        } catch (SdkClientException e) {
            throw new IllegalStateException(
                    "AWS 자격 증명 또는 네트워크 문제로 S3 이미지 삭제에 실패했습니다.",
                    e
            );
        }
    }

    /**
     * 비공개 S3 버킷에 저장된 이미지의 Presigned URL을 생성한다.
     *
     * DB에는 전체 URL이 아닌 Object Key만 저장되어 있으므로,
     * 화면에 이미지를 출력할 때 해당 Object Key를 이용해
     * 일정 시간 동안 접근 가능한 임시 URL을 생성한다.
     *
     * 예)
     * Object Key:
     * records/15/uuid.png
     *
     * 반환값:
     * https://버킷명.s3.ap-northeast-2.amazonaws.com/...?X-Amz-...
     *
     * @param objectKey DB에 저장된 S3 Object Key
     * @return 일정 시간 동안 사용할 수 있는 Presigned URL
     */
    public String createPresignedUrl(String objectKey) {
        // URL을 생성할 S3 Object Key가 없는 경우 요청을 중단한다
        if (objectKey == null || objectKey.isBlank()) {
            throw new IllegalArgumentException("Presigned URL을 생성할 Object Key가 필요합니다.");
        }

        /*
         * S3에서 조회할 객체 정보를 생성한다.
         *
         * bucket : 객체가 저장된 S3 버킷 이름
         * key : records/회원번호/uuid.png 형태의 Object Key
         */
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(objectKey.trim())
                .build();
         /*
          * Presigned URL의 유효시간과
          * 실제 S3 객체 조회 요청을 설정한다.
          *
          * 현재는 생성 시점부터 30분 동안 접근 가능하도록 설정
          */
        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(30))
                .getObjectRequest(getObjectRequest)
                .build();

        try {
            /*
             * S3Presigner를 이용하여
             * 인증 정보가 포함된 임시 GET URL을 생성
             */
            PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);

            /*
             * JSP의 <img src="">에서 사용할 수 있도록
             * URL을 문자열 형태로 반환한다.
             */

            return presignedRequest.url().toString();
        } catch (S3Exception e) {
            throw new IllegalStateException(createS3ErrorMessage("접근 URL 생성", e), e);
        } catch (SdkClientException e) {
            throw new IllegalStateException(
                    "AWS 자격 증명을 찾지 못해 S3 이미지 접근 URL을 생성하지 못했습니다.",
                    e
            );
        }
    }


    // Object Key가 있는지 검사
    private void validateObjectKey(String objectKey) {
        if (objectKey == null || objectKey.isBlank()) {
            throw new IllegalArgumentException("Object Key가 존재하지 않습니다.");
        }
    }

    private String createS3ErrorMessage(String operation, S3Exception exception) {
        String awsMessage = exception.awsErrorDetails() == null
                ? exception.getMessage()
                : exception.awsErrorDetails().errorMessage();

        return "S3 이미지 " + operation + "에 실패했습니다. AWS 응답: " + awsMessage;
    }
}
