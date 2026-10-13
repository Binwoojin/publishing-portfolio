package kr.co.growlog.growlog_project.entity;

import jakarta.persistence.*;
import lombok.*;


import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Data
@Entity
@Builder
@Table(name = "MEMBER")
public class Member {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // AUTO_INCREMENT를 사용하기 때문
    @Column(name = "MEMBER_NO")
    private Long memberNo;

    @Column(name = "EMAIL", nullable = false, unique = true, length = 100)
    private String email;

    @Column(name = "PASSWORD", nullable = false, length = 255)
    private String password;

    @Column(name = "NICKNAME", nullable = false, unique = true, length = 50)
    private String nickname;

    @Column(name = "USER_NAME", nullable = false, length = 50)
    private String userName;

    @Column(name = "PROFILE_IMAGE", length = 255)
    private String profileImage;

    @Column(name = "CREATED_AT", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "UPDATED_AT", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "member")
    private List<Goal> goals;

    // 회원 닉네임을 변경
    // @param nickname 새롭게 사용할 닉네임
    public void updateNickname(String nickname) {
        this.nickname = nickname;
    }

    // 암호화된 새로운 비밀번호로 회원 비밀번호를 변경
    // 서비스에서 PasswordEncoder를 이용해 암호화한 값을 전달받는다
    // @param encodedPassword 암호화가 완료된 비밀번호
    public void updatePassword(String encodedPassword) {
        this.password = encodedPassword;
    }

}
