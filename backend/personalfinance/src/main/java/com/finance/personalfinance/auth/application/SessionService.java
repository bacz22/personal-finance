package com.finance.personalfinance.auth.application;

import com.finance.personalfinance.auth.domain.model.RefreshToken;
import com.finance.personalfinance.auth.domain.repository.RefreshTokenRepository;
import com.finance.personalfinance.auth.infrastructure.cookie.AuthCookieService;
import com.finance.personalfinance.auth.infrastructure.token.SecureTokenGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SessionService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final SecureTokenGenerator tokenGenerator;
    private final AuthSessionRevocationService revocationService;
    private final AuthCookieService cookieService;

    public ResponseCookie logout(String rawRefreshToken, Long sessionIdFromAccessToken) {
        Long sessionId = resolveSessionId(rawRefreshToken, sessionIdFromAccessToken);
        if (sessionId != null) {
            revocationService.revoke(sessionId, "USER_LOGOUT");
        }
        return cookieService.createClearRefreshCookie();
    }

    private Long resolveSessionId(String rawRefreshToken, Long sessionIdFromAccessToken) {
        if (rawRefreshToken != null && !rawRefreshToken.isBlank()) {
            Optional<RefreshToken> token = refreshTokenRepository.findByTokenHash(
                    tokenGenerator.hashToken(rawRefreshToken));
            if (token.isPresent()) {
                return token.get().getSessionId();
            }
        }
        return sessionIdFromAccessToken;
    }
}
