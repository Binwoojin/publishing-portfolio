package kr.co.growlog.growlog_project.security;

import kr.co.growlog.growlog_project.entity.Member;
import lombok.Getter;
import org.jspecify.annotations.Nullable;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

 /*
  * Spring Security가 인증된 회원 정보를 보관할 때 사용하는 사용자 객체
  *
  * JPA Entity인 Member를 인증 객체로 직접 사용하지 않고,
  * 인증에 필요한 최소한의 정보만 별도 객체로 복사하여 사용
  */

@Getter
public class LoginMemberPrincipal implements UserDetails {

    private final Long memberNo; // 로그인한 회원을 DB에서 식별할 때 사용하는 기본 키
    private final String email; // GrowLog에서는 이메일을 로그인 아이디로 사용
    private final String password; // DB에 저장된 BCrypt 암호문이며 원본 비밀번호가 아님
    private final String nickname; // 회면의 헤더나 사용자 정보 영역에서 사용할 닉네임

    /*
     * DB에 조회한 Member Entity를
     * Spring Security가 사용할 인증 사용자 객체로 변환
     */

    public LoginMemberPrincipal(Member member) {
        this.memberNo = member.getMemberNo();
        this.email = member.getEmail();
        this.password = member.getPassword();
        this.nickname = member.getNickname();
    }

    /*
     * UserDetails에서 username은 사용자를 구분하는 로그인 식별자를 뜻하며,
     * GrowLog는 별도의 아이디가 아닌 이메일을 사용하므로 email를 반환
     */
    @Override
    public String getUsername() {
        return email;
    }

    /*
     * 현재는 모든 가입 회원에게 일반 사용자 권한을 부여한다.
     * 관리자 기능이 추가되면 Member의 권한 값을 이용하도록 변경할 수 있다.
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(
                new SimpleGrantedAuthority("ROLE_USER")
        );
    }

    // 현재 프로젝트에는 계정 만료 기능이 없으므로 항상 사용 가능
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    // 현재 프로젝트는 계정 잠금 기능이 없으므로 항상 잠기지 않은 상태
    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    // 현재 프로젝트에는 비밀번호 만료 기능이 없으므로 항상 유효
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    // 현재 프로젝트에는 휴면, 탈퇴 계정 구분이 없으므로 항상 활성 상태
    @Override
    public boolean isEnabled() {
        return true;
    }
}
