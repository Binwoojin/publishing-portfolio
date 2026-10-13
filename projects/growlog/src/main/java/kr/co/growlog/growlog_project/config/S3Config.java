package kr.co.growlog.growlog_project.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

/**
 * AWS S3 연결 설정 클래스
 *
 * application.yaml에 작성한 AWS 액세스 키, 비밀 키, 리전 정보를 읽어
 * S3Client 객체를 Spring Bean으로 등록한다.
 */

@Configuration
public class S3Config {

    @Value("${cloud.aws.credentials.access-key:}")
    private String accessKey;

    @Value("${cloud.aws.credentials.secret-key:}")
    private String secretKey;

    /**
     * application.yaml의 액세스 키 값을 읽는다.
     */
    /**
     * application.yaml의 비밀 액세스 키 값을 읽는다.
     */
    /**
     * application.yaml의 AWS 리전 값을 읽는다.
     */
    @Value("${cloud.aws.region.static:ap-northeast-2}")
    private String region;


    // AWS 인증 정보를 찾는 Credentials Provider Bean
    @Bean
    public AwsCredentialsProvider awsCredentialsProvider() {
        boolean hasAccessKey = accessKey != null && !accessKey.isBlank();
        boolean hasSecretKey = secretKey != null && !secretKey.isBlank();

        if (hasAccessKey != hasSecretKey) {
            throw new IllegalStateException(
                    "AWS Access Key와 Secret Key는 반드시 함께 설정해야 합니다."
            );
        }

        if (hasAccessKey) {
            return StaticCredentialsProvider.create(
                    AwsBasicCredentials.create(
                            accessKey.trim(),
                            secretKey.trim()
                    )
            );
        }

        return DefaultCredentialsProvider.builder().build();
    }

    /**
     * AWS S3와 통신할 때 사용할 S3Client를 생성한다
     *
     * @return Spring에서 관리할 S3Client 객체
     */
    @Bean
    public S3Client s3Client(AwsCredentialsProvider credentialsProvider) {

        /**
         * AWS SDK 2.x의 S3Client를 생성한다.
         *
         * region:
         * S3 버킷이 생성된 AWS 리전
         *
         * credentialsProvider:
         * 요청을 보낼 때 사용할 AWS 인증 정보
         */

        return S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(credentialsProvider)
                .build();
    }


    // S3 업로드 및 삭제 Client
    @Bean
    public S3Presigner s3Presigner(AwsCredentialsProvider credentialsProvider) {
        return S3Presigner.builder()
                .region(Region.of(region))
                .credentialsProvider(credentialsProvider)
                .build();
    }

}
