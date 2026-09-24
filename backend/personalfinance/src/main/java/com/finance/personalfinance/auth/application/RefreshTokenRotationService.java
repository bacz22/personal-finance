package com.finance.personalfinance.auth.application;

import com.finance.personalfinance.auth.domain.model.AuthSession;
import com.finance.personalfinance.auth.domain.model.RefreshToken;
import com.finance.personalfinance.auth.domain.repository.AuthSessionRepository;
import com.finance.personalfinance.auth.domain.repository.RefreshTokenRepository;
import com.finance.personalfinance.user.domain.model.User;
import com.finance.personalfinance.user.domain.repository.UserRepository;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RefreshTokenRotationService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final AuthSessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final RefreshTokenGraceCache graceCache;

    public enum RotationStatus {
        SUCCESS,
        INVALID,
        REUSE_DETECTED,
        SESSION_REVOKED,
        TOKEN_EXPIRED,
        USER_INVALID
    }

    @Getter
    @Builder
    public static class RotationResult {
        private RotationStatus status;
        private Long sessionId;
        private User user;
        private AuthSession session;

        static RotationResult invalid() {
            return RotationResult.builder().status(RotationStatus.INVALID).build();
        }

        static RotationResult reuseDetected(Long sessionId) {
            return RotationResult.builder().status(RotationStatus.REUSE_DETECTED).sessionId(sessionId).build();
        }

        static RotationResult sessionRevoked() {
            return RotationResult.builder().status(RotationStatus.SESSION_REVOKED).build();
        }

        static RotationResult tokenExpired() {
            return RotationResult.builder().status(RotationStatus.TOKEN_EXPIRED).build();
        }

        static RotationResult userInvalid(User user) {
            return RotationResult.builder().status(RotationStatus.USER_INVALID).user(user).build();
        }

        static RotationResult success(User user, AuthSession session) {
            return RotationResult.builder()
                    .status(RotationStatus.SUCCESS)
                    .user(user)
                    .session(session)
                    .sessionId(session.getId())
                    .build();
        }
    }

    @Transactional
    public RotationResult rotate(String currentHash, String newRawToken, String newHash) {
        RefreshToken current = refreshTokenRepository.findByTokenHashForUpdate(currentHash).orElse(null);
        if (current == null) {
            return RotationResult.invalid();
        }
        if (current.isConsumed() || current.isRevoked()) {
            return RotationResult.reuseDetected(current.getSessionId());
        }

        AuthSession session = sessionRepository.findById(current.getSessionId()).orElse(null);
        if (session == null || !session.isActive()) {
            return RotationResult.sessionRevoked();
        }
        if (current.isExpired()) {
            return RotationResult.tokenExpired();
        }

        User user = userRepository.findById(session.getUserId()).orElse(null);
        if (user == null || !user.isEnabled()) {
            return RotationResult.userInvalid(user);
        }

        RefreshToken next = refreshTokenRepository.save(RefreshToken.builder()
                .sessionId(session.getId())
                .tokenHash(newHash)
                .expiresAt(session.getExpiresAt())
                .build());
        current.markAsConsumed(next.getId());
        refreshTokenRepository.save(current);
        session.touch();
        sessionRepository.save(session);
        graceCache.put(currentHash, newRawToken, session.getId());
        return RotationResult.success(user, session);
    }
}
