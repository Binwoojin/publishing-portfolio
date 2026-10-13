package kr.co.growlog.growlog_project.security;

import kr.co.growlog.growlog_project.entity.Member;
import kr.co.growlog.growlog_project.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/*
 * Spring Security가 로그인 인증을 진행할 때
 * DB에서 회원 정보를 죄하힉 위해 사용하는 서비스
 *
 * 로그인 폼에서 이메일과 비밀번호가 전달되면
 * Spring Security는 이 클래스의 loadUserByUsername()을 호출
 *
 * 이 클래스의 책임
 * 1. 로그인 식별자인 이메일로 회원 조회
 * 2. 조회한 Member를 LoginMemberPrincipal로 변환
 *
 * 비밀번호 비교는 이 클래스에서 직접 하지 않으며
 * 비밀번호 비교는 Spring Security의 인증 Provider가
 * 기존 PasswordEncoder를 이용하여 자동으로 수행한다.
 */
@RequiredArgsConstructor
@Service
@Transactional(readOnly = true)
public class CustomUserDetailsService implements UserDetailsService {

    /*
     * 이메일을 이용해 member 테이블에서 회원을 조회하기 위한 Repository
     * @RequiredArgsConstuctor가 final 필드를 매개변수로 받는 생성자를
     * 자동으로 생성하므로 생성자를 직접 작성하지 않아도 된다.
     */
    private final MemberRepository memberRepository;

    /*
     * 로그인 폼에서 전달된 사용자 식별자를 이용해 회원을 조회한다
     *
     * UserDetailService 인터페이스에서 정한 메서드 이름은
     * loadUserByUsername이지만 GrowLog에서는 일반 아이디 대신
     * 이메일을 로그인 식별자로 사용하므로 매개변수에 이메일이 전달된다.
     *
     * 처리과정
     * 1. 이메일로 Member 조회
     * 2. 회원이 없으면 UsernameNotFoundException 발생
     * 3. 회원이 있으면 LoginMemberPrincipal로 변환
     * 4. 변환한 인증 사용자 정보를 Spring Security에 반환
     *
     * @param email 로그인 폼에 입력된 이메일
     * @return Spring Security가 인증에 사용할 사용자 정보
     * @throw UsernameNotFoundException 이메일에 해당하는 회원이 없는 경우
     */
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {

        /*
         * MemberRepository에 이미 정의된 findByEmail()을 사용한다.
         *
         * 반환 타입이 Optional<Member>이므로 회원이 없을 경우
         * null을 반환하는 대신 orElseThrow()로 인증 예외를 발생시킨다.
         */

        Member member = memberRepository.findByEmail(email).orElseThrow(() -> new UsernameNotFoundException("회원 정보를 찾을 수 없습니다."));

        /*
         * JPA Entity인 Member를 그대로 인증 객체로 사용하지 않고
         * 인증에 필요한 정보만 포함한 LoginMemberPrincipal로 변환한다.
         *
         * 반환된 객체의 이메일과 암호화된 비밀번호를 이용해
         * Spring Security가 실제 인증을 계속 진행한다,
         */
        return new LoginMemberPrincipal(member);
    }
}
