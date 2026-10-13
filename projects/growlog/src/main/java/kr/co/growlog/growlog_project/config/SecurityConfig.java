package kr.co.growlog.growlog_project.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfFilter;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.security.web.util.matcher.AnyRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;


@Configuration
public class SecurityConfig {

    /*
     * Vue SPA(Vite 개발 서버)가 떠 있는 Origin 목록
     * application.yaml의 app.cors.allowed-origins (콤마 구분)에서 주입받는다
     */
    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {


        /*
         * URL별 접근 권한을 설정
         *
         * 인증되지 않은 사용자가 접근하면 Controller를 실행하지 않고
         * Spring Security가 로그인 페이지로 이동시킨다
         *
         * 아직 전환하지 않은 Controller는 기존 세션 방식을
         * 사용하고 있으므로 나머지 요청은 임시로 모두 허용
         */

        http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(authorize -> authorize
                        /*
                         * 브라우저가 Vue SPA에서 CORS 요청(로그인, /api/me 등)을 보내기 전에
                         * 먼저 보내는 preflight(OPTIONS) 요청은 자격 증명(쿠키) 없이 오기 때문에
                         * 인증 규칙보다 먼저 무조건 허용해야 한다. 그렇지 않으면 모든 Cross-Origin
                         * 요청이 preflight 단계에서 401로 막혀버린다.
                         */
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/goal/**", "/record/**", "/home", "/timeline", "/mypage/**", "/api/members/check-nickname-update", "/api/me", "/api/dashboard", "/api/timeline", "/api/goals/**", "/api/categories", "/api/records/**").authenticated()
                        .anyRequest().permitAll())
                .formLogin(form -> form
                        /*
                         * 로그인 화면을 표시하는 주소
                         * GET /login은 기존 HomeController가 처리
                         */
                        .loginPage("/login")

                        /*
                         * 로그인 폼이 제출되는 주소
                         * POST /login 요청은 Controller가 아닌
                         * Spring Security의 로그인 필터가 처리
                         */
                        .loginProcessingUrl("/login")
                        /*
                         * Spring Security의 기본 사용자명 파라미터는 username이다
                         * 현재 login.jsp는 <input name="email">을 사용하므로
                         * 이메일 파라미터를 사용자 식별자로 사용하도록 변경한다
                         */
                        .usernameParameter("email")
                        /*
                         * 현재 login.jsp의 비밀번호 필드 이름
                         * 기본값도 password지만 코드의 이미를 명확히 하기 위해 작성
                         */
                        .passwordParameter("password")
                        /*
                         * 로그인 성공 시 임시 호환 Handler를 실행
                         */
                        .defaultSuccessUrl("/home", true)
                        /*
                         * 인증에 실패하면 쿼리 파라미터를 붙여 로그인 화면으로 다시 이동
                         */
                        .failureUrl("/login?error")
                        /*
                         * 비로그인 사용자도 로그인 화면과 로그인 처리 주소에
                         * 접근할 수 있어야 한다.
                         */
                        .permitAll()
                )
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessUrl("/logout-complete")
                        .invalidateHttpSession(true)
                        .clearAuthentication(true)
                        .permitAll())
                /*
                 * CSRF 토큰을 쿠키(XSRF-TOKEN)로도 내려준다.
                 *
                 * 기존 JSP는 세션에 저장된 CSRF 토큰을 뷰에서 직접 렌더링해서 썼지만,
                 * Vue SPA는 서버가 렌더링하는 화면이 없기 때문에 토큰을 읽을 방법이 없다.
                 * CookieCsrfTokenRepository로 바꾸면 매 요청마다 XSRF-TOKEN 쿠키가 내려가고,
                 * Axios는 기본적으로 이 쿠키를 읽어 X-XSRF-TOKEN 헤더에 그대로 실어 보낸다
                 * (Spring Security의 기본 쿠키/헤더 이름과 Axios의 기본값이 동일하다).
                 *
                 * withHttpOnlyFalse()가 필요한 이유: 브라우저 JS(Axios)가 쿠키 값을
                 * 읽어야 헤더에 넣어 보낼 수 있기 때문에 HttpOnly를 끈다.
                 *
                 * CsrfTokenRequestAttributeHandler(Xor가 아닌 기본 Attribute 핸들러)를
                 * 쓰는 이유: 기본 XorCsrfTokenRequestAttributeHandler는 BREACH 공격 방지를
                 * 위해 토큰 값을 매번 다르게 마스킹하는데, 이 과정에서 실제 토큰 조회가
                 * "지연(deferred)"된다. 두 핸들러 모두 지연 로딩 자체는 동일해서, 실제로
                 * 누군가 토큰 값을 "읽어야" 쿠키가 내려간다 — JSP는 ${_csrf.token}으로
                 * 읽지만 REST API만 쓰는 SPA 흐름에는 그렇게 읽는 코드가 없다.
                 * 그래서 아래 csrfCookieFilter()를 CsrfFilter 뒤에 추가해서
                 * 매 요청마다 토큰을 강제로 읽어(resolve) 쿠키가 항상 내려가도록 한다.
                 */
                .csrf(csrf -> csrf
                        .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                        .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler())
                )
                .addFilterAfter(csrfCookieFilter(), CsrfFilter.class)
                /*
                 * /api/** 는 인증되지 않은 요청이 와도 /login으로 리다이렉트하지 않고
                 * 401 Unauthorized를 그대로 응답한다.
                 *
                 * formLogin의 기본 AuthenticationEntryPoint는 미인증 요청을 로그인
                 * 페이지(HTML)로 리다이렉트하는데, Axios로 GET /api/me를 호출하는
                 * SPA 입장에서는 302 → HTML 응답이 되어버려 로그인 여부를 구분하기 어렵다.
                 *
                 * 주의: defaultAuthenticationEntryPointFor()로 등록한 매핑 중
                 * "가장 먼저 등록된 것"이 모든 매칭 실패 시의 fallback이 된다.
                 * formLogin()이 등록하는 로그인 리다이렉트 매핑은 build() 시점에
                 * 뒤늦게 추가되므로, 아래에서 /api/** 매핑과 나머지 전체를 위한
                 * 로그인 리다이렉트 매핑을 이 자리에서 직접, 이 순서로 등록해야
                 * "/home 같은 일반 페이지가 401을 받는" 문제를 피할 수 있다.
                 */
                .exceptionHandling(exceptions -> exceptions
                        .defaultAuthenticationEntryPointFor(
                                new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED),
                                PathPatternRequestMatcher.withDefaults().matcher("/api/**")
                        )
                        .defaultAuthenticationEntryPointFor(
                                new LoginUrlAuthenticationEntryPoint("/login"),
                                AnyRequestMatcher.INSTANCE
                        )
                );

        /*
         * authorizeHttpRequest : URL마다 접근 권한을 설정하는 영역
         * anyRequest().permitAll() : 모든 요청을 허용
         * Logout
         * - logoutUrl("/logout") : 헤더의 POST /logout 요청을 Spring Security가 처리
         * - logoutSuccessUrl("/logout-complete") : 로그아웃 처리가 끝나면 /logout-complete로 리다이렉트한다
         * - invalidateHttpSession(true) : 기존 세션을 무효화, 현재 세션에 들어있는 loginMember도 제거된다
         * - clearAuthentication(true) : Spring Security의 인증정보도 제거
         *
         * 아직 Spring Security 로그인 기능과 프로젝트 회원 정보를 연결하지 않았기 때문에
         * 기존 기능을 유지하면서 Security 설정이 정상 등록되었는지만 확인하기 위한 설정
         */
        return http.build();
    }

    /*
     * Vue 개발 서버(Origin이 다른 SPA)에서 오는 요청을 허용하기 위한 CORS 설정
     *
     * allowCredentials(true)를 쓰려면 allowedOrigins에 "*"를 쓸 수 없고
     * 구체적인 Origin 목록을 지정해야 한다 (세션 쿠키를 주고받아야 하므로 필수).
     */
    private CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(
                Arrays.stream(allowedOrigins.split(","))
                        .map(String::trim)
                        .filter(origin -> !origin.isBlank())
                        .toList()
        );
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    /*
     * CsrfFilter가 만든 CsrfToken은 기본적으로 "지연 로딩"된다.
     * 즉 누군가 실제로 csrfToken.getToken()을 호출해야
     * CookieCsrfTokenRepository가 그제서야 XSRF-TOKEN 쿠키를 응답에 실어 보낸다.
     *
     * JSP 화면은 ${_csrf.token}을 렌더링하면서 자연스럽게 이 호출이 일어나지만,
     * REST API만 호출하는 Vue SPA 요청에는 그런 렌더링 코드가 없다.
     * 그래서 CsrfFilter 바로 다음에 이 필터를 추가해 매 요청마다 토큰을
     * 강제로 한 번 읽어(resolve) 쿠키가 항상 내려가도록 한다.
     */
    private OncePerRequestFilter csrfCookieFilter() {
        return new OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
                    throws ServletException, IOException {
                CsrfToken csrfToken = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
                if (csrfToken != null) {
                    csrfToken.getToken();
                }
                filterChain.doFilter(request, response);
            }
        };
    }
}
