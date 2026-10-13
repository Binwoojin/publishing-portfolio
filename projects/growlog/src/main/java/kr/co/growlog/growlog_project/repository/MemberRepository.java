package kr.co.growlog.growlog_project.repository;

import kr.co.growlog.growlog_project.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MemberRepository extends JpaRepository<Member, Long> {
    boolean existsByEmail(String email);
    boolean existsByNickname(String nickname);
    Optional<Member> findByEmail(String email);
    Optional<Member> findById(Long id);

    // 특정 회원을 제외하고 동일한 닉네임을 사용하는 회원이 있는지 확인
    // 닉네임을 변경하지 않고 그대로 저장하는 경우,
    // 자기 자신의 닉네임을 중복으로 판단하지 않도록 회원 번호를 제외
    boolean existsByNicknameAndMemberNoNot(String nickname, Long memberNo);

}
