package com.finance.personalfinance.auth.application;

import com.finance.personalfinance.auth.api.response.RefreshResponse;
import com.finance.personalfinance.auth.application.RefreshTokenGraceCache.GraceEntry;
import com.finance.personalfinance.auth.application.RefreshTokenRotationService.RotationResult;
import com.finance.personalfinance.auth.application.RefreshTokenRotationService.RotationStatus;
import com.finance.personalfinance.auth.domain.model.AuthSession;
import com.finance.personalfinance.auth.domain.repository.AuthSessionRepository;
import com.finance.personalfinance.auth.infrastructure.cookie.AuthCookieService;
import com.finance.personalfinance.auth.infrastructure.jwt.AccessTokenService;
import com.finance.personalfinance.auth.infrastructure.jwt.JwtProperties;
import com.finance.personalfinance.auth.infrastructure.token.SecureTokenGenerator;
import com.finance.personalfinance.common.exception.AppException;
import com.finance.personalfinance.user.domain.model.User;
import com.finance.personalfinance.user.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRotationService rotationService;
    private final AuthSessionRevocationService revocationService;
    private final RefreshTokenGraceCache graceCache;
    private final AuthSessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final SecureTokenGenerator tokenGenerator;
    private final AccessTokenService accessTokenService;
    private final AuthCookieService cookieService;
    private final JwtProperties jwtProperties;

    public RefreshResult refresh(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw error("REFRESH_TOKEN_MISSING", "Không tìm thấy refresh token.");
        }

        String currentHash = tokenGenerator.hashToken(rawRefreshToken);
        String newRawToken = tokenGenerator.generateRawToken();
        RotationResult result = rotationService.rotate(
                currentHash,
                newRawToken,
                tokenGenerator.hashToken(newRawToken)
        );

        if (result.getStatus() == RotationStatus.REUSE_DETECTED) {
            Optional<GraceEntry> grace = graceCache.getValid(currentHash, result.getSessionId());
            if (grace.isPresent()) {
                return issueFromSession(grace.get().sessionId(), grace.get().newRawToken());
            }
            revocationService.revoke(result.getSessionId(), "REFRESH_TOKEN_REUSE");
            throw error("REFRESH_TOKEN_REUSE_DETECTED", "Refresh token đã bị sử dụng lại.");
        }
        return switch (result.getStatus()) {
            case SUCCESS -> issue(result.getUser(), result.getSession(), newRawToken);
            case INVALID -> throw error("REFRESH_TOKEN_INVALID", "Refresh token không hợp lệ.");
            case SESSION_REVOKED -> throw error("SESSION_REVOKED", "Phiên đăng nhập đã bị thu hồi hoặc hết hạn.");
            case TOKEN_EXPIRED -> throw error("REFRESH_TOKEN_EXPIRED", "Refresh token đã hết hạn.");
            case USER_INVALID -> throw error("USER_DISABLED", "Tài khoản không còn hoạt động.");
            case REUSE_DETECTED -> throw error("REFRESH_TOKEN_REUSE_DETECTED", "Refresh token không hợp lệ.");
        };
    }

    private RefreshResult issueFromSession(Long sessionId, String rawRefreshToken) {
        AuthSession session = sessionRepository.findById(sessionId)
                .filter(AuthSession::isActive)
                .orElseThrow(() -> error("SESSION_REVOKED", "Phiên đăng nhập đã bị thu hồi hoặc hết hạn."));
        User user = userRepository.findById(session.getUserId())
                .filter(User::isEnabled)
                .orElseThrow(() -> error("USER_DISABLED", "Tài khoản không còn hoạt động."));
        return issue(user, session, rawRefreshToken);
    }

    private RefreshResult issue(User user, AuthSession session, String rawRefreshToken) {
        Duration remaining = Duration.between(Instant.now(), session.getExpiresAt());
        ResponseCookie cookie = cookieService.createRefreshCookie(
                rawRefreshToken,
                remaining.isNegative() ? Duration.ZERO : remaining
        );
        RefreshResponse response = RefreshResponse.builder()
                .accessToken(accessTokenService.issue(user, session.getId()))
                .expiresIn(jwtProperties.getAccessTokenTtl().toSeconds())
                .build();
        return new RefreshResult(response, cookie);
    }

    private static AppException error(String code, String message) {
        return new AppException(HttpStatus.UNAUTHORIZED, code, message);
    }
}
