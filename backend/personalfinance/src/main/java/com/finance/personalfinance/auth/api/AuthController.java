package com.finance.personalfinance.auth.api;

import com.finance.personalfinance.auth.api.request.LoginRequest;
import com.finance.personalfinance.auth.api.request.RegisterRequest;
import com.finance.personalfinance.auth.api.response.LoginResponse;
import com.finance.personalfinance.auth.api.response.RefreshResponse;
import com.finance.personalfinance.auth.api.response.RegisterResponse;
import com.finance.personalfinance.auth.application.AuthService;
import com.finance.personalfinance.auth.application.LoginResult;
import com.finance.personalfinance.auth.application.RefreshResult;
import com.finance.personalfinance.auth.application.RefreshTokenService;
import com.finance.personalfinance.auth.application.RegistrationService;
import com.finance.personalfinance.auth.application.SessionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final RegistrationService registrationService;
    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;
    private final SessionService sessionService;
    private final JwtDecoder jwtDecoder;

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(registrationService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest
    ) {
        LoginResult result = authService.login(request, httpRequest);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, result.cookie().toString())
                .body(result.response());
    }

    @PostMapping("/refresh")
    public ResponseEntity<RefreshResponse> refresh(
            @CookieValue(name = "${app.auth.refresh-cookie-name:pf_refresh}", required = false)
            String rawRefreshToken
    ) {
        RefreshResult result = refreshTokenService.refresh(rawRefreshToken);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, result.cookie().toString())
                .body(result.response());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(name = "${app.auth.refresh-cookie-name:pf_refresh}", required = false)
            String rawRefreshToken,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false)
            String authorization
    ) {
        ResponseCookie clearCookie = sessionService.logout(rawRefreshToken, sessionIdFromAuthorization(authorization));
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, clearCookie.toString())
                .build();
    }

    private Long sessionIdFromAuthorization(String authorization) {
        if (authorization == null || !authorization.regionMatches(true, 0, "Bearer ", 0, 7)) {
            return null;
        }
        try {
            Jwt jwt = jwtDecoder.decode(authorization.substring(7).trim());
            return Long.valueOf(jwt.getClaimAsString("sid"));
        } catch (JwtException | IllegalArgumentException exception) {
            return null;
        }
    }
}
