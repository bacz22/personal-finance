package com.finance.personalfinance.auth.application;

import com.finance.personalfinance.auth.api.request.LoginRequest;
import com.finance.personalfinance.auth.api.response.LoginResponse;
import com.finance.personalfinance.auth.api.response.UserSummaryResponse;
import com.finance.personalfinance.auth.domain.model.AuthSession;
import com.finance.personalfinance.auth.domain.model.PasswordRecoveryCredential;
import com.finance.personalfinance.auth.domain.model.RefreshToken;
import com.finance.personalfinance.auth.domain.repository.AuthSessionRepository;
import com.finance.personalfinance.auth.domain.repository.PasswordRecoveryCredentialRepository;
import com.finance.personalfinance.auth.domain.repository.RefreshTokenRepository;
import com.finance.personalfinance.auth.infrastructure.cookie.AuthCookieService;
import com.finance.personalfinance.auth.infrastructure.jwt.AccessTokenService;
import com.finance.personalfinance.auth.infrastructure.jwt.JwtProperties;
import com.finance.personalfinance.auth.infrastructure.token.SecureTokenGenerator;
import com.finance.personalfinance.common.exception.AppException;
import com.finance.personalfinance.user.domain.model.User;
import com.finance.personalfinance.user.domain.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String DUMMY_BCRYPT_HASH =
            "$2a$10$7EqJtq98hPqEX7fNZaFWoO9m51P4e488E8q3v50G5w47mYy4t5e8m";

    private final UserRepository userRepository;
    private final AuthSessionRepository sessionRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordRecoveryCredentialRepository recoveryCredentialRepository;
    private final AuthSessionRevocationService sessionRevocationService;
    private final PasswordEncoder passwordEncoder;
    private final JwtProperties jwtProperties;
    private final AccessTokenService accessTokenService;
    private final SecureTokenGenerator tokenGenerator;
    private final AuthCookieService cookieService;

    @Transactional
    public LoginResult login(LoginRequest request, HttpServletRequest httpRequest) {
        String email = normalizeEmail(request.getEmail());
        Optional<User> candidate = userRepository.findByEmailIgnoreCase(email);
        String storedHash = candidate.map(User::getPasswordHash).orElse(DUMMY_BCRYPT_HASH);
        boolean passwordMatches = passwordEncoder.matches(request.getPassword(), storedHash);

        if (candidate.isEmpty() || !candidate.get().isEnabled()) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS",
                    "Email hoặc mật khẩu không chính xác.");
        }

        User user = candidate.get();
        if (!passwordMatches) {
            Optional<PasswordRecoveryCredential> pendingCredential =
                    recoveryCredentialRepository.findByUserIdForUpdate(user.getId());
            if (pendingCredential.isPresent()
                    && pendingCredential.get().isUsable()
                    && passwordEncoder.matches(request.getPassword(), pendingCredential.get().getPasswordHash())) {
                PasswordRecoveryCredential credential = pendingCredential.get();
                user.updatePasswordHash(passwordEncoder.encode(tokenGenerator.generateRawToken()));
                user.requirePasswordChange();
                credential.consume();
                recoveryCredentialRepository.save(credential);
                sessionRevocationService.revokeAllForUser(user.getId(), "PASSWORD_RECOVERY");
                passwordMatches = true;
            }
        }
        if (!passwordMatches) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS",
                    "Email hoặc mật khẩu không chính xác.");
        }

        Duration refreshTtl = Boolean.TRUE.equals(request.getRememberMe())
                ? jwtProperties.getRememberMeRefreshTokenTtl()
                : jwtProperties.getRefreshTokenTtl();
        Instant expiresAt = Instant.now().plus(refreshTtl);

        String userAgent = httpRequest == null ? null : httpRequest.getHeader("User-Agent");
        AuthSession session = sessionRepository.save(AuthSession.builder()
                .userId(user.getId())
                .device(device(userAgent))
                .browser(browser(userAgent))
                .operatingSystem(operatingSystem(userAgent))
                .ipAddress(clientIp(httpRequest))
                .userAgent(truncate(userAgent, 500))
                .expiresAt(expiresAt)
                .build());

        String rawRefreshToken = tokenGenerator.generateRawToken();
        refreshTokenRepository.save(RefreshToken.builder()
                .sessionId(session.getId())
                .tokenHash(tokenGenerator.hashToken(rawRefreshToken))
                .expiresAt(expiresAt)
                .build());

        LoginResponse response = LoginResponse.builder()
                .accessToken(accessTokenService.issue(user, session.getId()))
                .expiresIn(jwtProperties.getAccessTokenTtl().toSeconds())
                .user(UserSummaryResponse.from(user))
                .build();
        ResponseCookie cookie = cookieService.createRefreshCookie(rawRefreshToken, refreshTtl);
        return new LoginResult(response, cookie);
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static String clientIp(HttpServletRequest request) {
        if (request == null) return null;
        String forwarded = request.getHeader("X-Forwarded-For");
        return forwarded == null || forwarded.isBlank()
                ? request.getRemoteAddr()
                : forwarded.split(",", 2)[0].trim();
    }

    private static String truncate(String value, int maxLength) {
        return value != null && value.length() > maxLength ? value.substring(0, maxLength) : value;
    }

    private static String device(String userAgent) {
        if (userAgent == null) return "Unknown";
        if (userAgent.contains("Mobile") || userAgent.contains("Android") || userAgent.contains("iPhone")) {
            return "Mobile Device";
        }
        if (userAgent.contains("iPad") || userAgent.contains("Tablet")) return "Tablet";
        return "Desktop";
    }

    private static String browser(String userAgent) {
        if (userAgent == null) return "Unknown";
        if (userAgent.contains("Edg/")) return "Microsoft Edge";
        if (userAgent.contains("Chrome/")) return "Google Chrome";
        if (userAgent.contains("Safari/") && !userAgent.contains("Chrome/")) return "Apple Safari";
        if (userAgent.contains("Firefox/")) return "Mozilla Firefox";
        return "Browser";
    }

    private static String operatingSystem(String userAgent) {
        if (userAgent == null) return "Unknown";
        if (userAgent.contains("Windows NT")) return "Windows";
        if (userAgent.contains("Macintosh") || userAgent.contains("Mac OS X")) return "macOS";
        if (userAgent.contains("Android")) return "Android";
        if (userAgent.contains("iPhone") || userAgent.contains("iPad")) return "iOS";
        if (userAgent.contains("Linux")) return "Linux";
        return "Unknown OS";
    }
}
