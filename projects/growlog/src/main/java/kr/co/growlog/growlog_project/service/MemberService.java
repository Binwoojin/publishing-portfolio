package kr.co.growlog.growlog_project.service;

import jakarta.servlet.http.HttpSession;
import jakarta.transaction.Transactional;
import kr.co.growlog.growlog_project.dto.JoinRequest;
import kr.co.growlog.growlog_project.dto.LoginRequest;
import kr.co.growlog.growlog_project.dto.NicknameUpdateRequest;
import kr.co.growlog.growlog_project.dto.PasswordUpdateRequest;
import kr.co.growlog.growlog_project.entity.Member;
import kr.co.growlog.growlog_project.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service
@org.springframework.transaction.annotation.Transactional(readOnly = true)
public class MemberService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailVerificationService emailVerificationService;


    @Transactional
    public void join(JoinRequest request, HttpSession session) {



        // 비밀번호 확인
        if (!request.getPassword().equals(request.getPasswordCheck())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        // 이메일 인증 확인
        if (!emailVerificationService.isVerified(request.getEmail(), session)) {
            throw new IllegalArgumentException("이메일 인증을 완료해주세요.");
        }

        // 이메일 중복 확인
        if (memberRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("이미 가입된 이메일입니다.");
        }

        // 닉네임 중복 확인
        if (memberRepository.existsByNickname(request.getNickname())) {
            throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
        }

        Member member = Member.builder().email(request.getEmail()).password(passwordEncoder.encode(request.getPassword()))
                .userName(request.getUserName()).nickname(request.getNickname()).profileImage(null).build();

        memberRepository.save(member);

        // 회원가입 성공 후 인증 정보 삭제
        emailVerificationService.clearVerification(session);
    }

    public boolean isNicknameDuplicated(String nickname) {
        return memberRepository.existsByNickname(nickname);
    }

    public Member login(LoginRequest request) {
        Member member = memberRepository.findByEmail(request.getEmail()).orElseThrow( () -> new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다."));

        boolean passwordMatched = passwordEncoder.matches(request.getPassword(), member.getPassword());

        if (!passwordMatched) {
            throw new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        return member;
    }

    /**
     * 회원 번호를 이용해 회원 정보를 조회한다.
     */
    public Member findById(Long memberNo) {
        return memberRepository.findById(memberNo).orElseThrow(() -> new IllegalArgumentException("회원 정보를 찾을 수 없습니다."));
    }

    /**
     * 계정 설정 페이지에 들어가기 전에
     * 입력한 비밀번호가 현재 회원의 비밀번호와 일치하는지 확인
     *
     * DB에는 암호화된 비밀번호가 저장되어 있으므로
     * 문자열을 직접 비교하지 않고 PasswordEncoder.matches를 사용
     *
     * @param memberNo 로그인 회원 번호
     * @param rawPassword 사용자가 입력한 원본 비밀번호
     * @return 비밀번호 일치 여부
     */
    public boolean matchesPassword(Long memberNo, String rawPassword) {
        if (rawPassword == null || rawPassword.isBlank()) {
            return false;
        }

        Member member = findById(memberNo);

        return passwordEncoder.matches(rawPassword, member.getPassword());
    }

    // 회원 닉네임을 변경
    // 변경 전에 공백, 길이, 중복 여부를 검사
    @org.springframework.transaction.annotation.Transactional
    public Member updateNickname(Long memberNo, NicknameUpdateRequest request) {
        Member member = findById(memberNo);

        String nickname = request.getNickname() == null
                ? ""
                : request.getNickname().trim();

        // 닉네임 필수 입력 검사
        if (nickname.isBlank()) {
            throw new IllegalArgumentException("닉네임을 입력해주세요.");
        }

        // 프로젝트의 기존 닉네임 제한에 맞게 조정할 수 있다.
        if (nickname.length() < 2 || nickname.length() > 30) {
            throw new IllegalArgumentException("닉네임은 2자 이상 30자 이하로 입력해주세요.");
        }

        // 현재 회원을 제외한 다른 회원이 같은 닉네임을 사용하고 있는지 확인
        boolean duplicated = memberRepository.existsByNicknameAndMemberNoNot(nickname, memberNo);

        if (duplicated) {
            throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
        }

        member.updateNickname(nickname);

        // JPA 변경 감지로 UPDATE가 실행되므로 반드시 save를 다시 호출하지 않아도 된다.
        return member;
    }

    /**
     * 회원 비밀번호를 변경한다.
     *
     * 1. 현재 비밀번호 확인
     * 2. 새 비밀번호 형식 확인
     * 3. 새 비밀번호 확인값 일치 검사
     * 4. 기존 비밀번호와 동일한지 확인
     * 5. 암호화 후 저장
     */
    @org.springframework.transaction.annotation.Transactional
    public Member updatePassword(Long memberNo, PasswordUpdateRequest request) {
        Member member = findById(memberNo);

        String currentPassword = request.getCurrentPassword() == null
                ? ""
                : request.getCurrentPassword();

        String newPassword = request.getNewPassword() == null
                ? ""
                : request.getNewPassword();

        String newPasswordConfirm = request.getNewPasswordConfirm() == null
                ? ""
                : request.getNewPasswordConfirm();

        // 현재 비밀번호 입력 여부 검사
        if (currentPassword.isBlank()) {
            throw new IllegalArgumentException("현재 비밀번호를 입력해주세요.");
        }

        // 실제 현재 비밀번호가 맞는지 확인
        if (!passwordEncoder.matches(currentPassword, member.getPassword())) {
            throw new IllegalArgumentException("현재 비밀번호가 일치하지 않습니다.");
        }

        // 새 비밀번호 입력 여부 검사
        if (newPassword.isBlank()) {
            throw new IllegalArgumentException("새 비밀번호를 입력해주세요.");
        }

        // 회원가입에서 사용한 비밀번호 정책과 동일한 기준으로 맞추는 것이 가장 좋다.
        // 8자까지 검사
        if (newPassword.length() < 8 || newPassword.length() > 100) {
            throw new IllegalArgumentException("새 비밀번호는 8자 이상으로 입력해주세요.");
        }

        // 새 비밀번호와 확인 비밀번호가 같은지 검사
        if (!newPassword.equals(newPasswordConfirm)) {
            throw new IllegalArgumentException("새 비밀번호 확인이 일치하지 않습니다.");
        }

        // 현재 비밀번호와 동일한 새 비밀번호는 허용하지 않는다.
        if (passwordEncoder.matches(newPassword, member.getPassword())) {
            throw new IllegalArgumentException("현재 비밀번호와 다른 비밀번호를 입력해주세요.");
        }

        // 새 비밀번호를 암호화하여 엔티티에 저장한다.
        String encodedPassword = passwordEncoder.encode(newPassword);
        member.updatePassword(encodedPassword);

        return member;

    }

    // 현재 회원을 제외하고 동일한 닉네임을 사용하는 회원이 있는지 확인
    public boolean isNicknameDuplicatedExceptSelf(String nickname, Long memberNo) {

        String trimedNickname = nickname == null
                ? ""
                : nickname.trim();

        if (trimedNickname.isBlank()) {
            return false;
        }

        return memberRepository.existsByNicknameAndMemberNoNot(nickname, memberNo);
    }

    // 해당 이메일로 가입된 회원이 있는지 확인
    public boolean existsByEmail(String email) {
        return memberRepository.existsByEmail(email);
    }

    // 비밀번호 찾기 인증을 완료한 회원의 비밀번호를 재설정
    @org.springframework.transaction.annotation.Transactional
    public void resetPasswordByEmail(String email, String newPassword) {
        Member member = memberRepository.findByEmail(email).orElseThrow(() -> new IllegalArgumentException("회원 정보를 찾을 수 없습니다."));

        String encodedPassword = passwordEncoder.encode(newPassword);
        member.updatePassword(encodedPassword);
    }

}
