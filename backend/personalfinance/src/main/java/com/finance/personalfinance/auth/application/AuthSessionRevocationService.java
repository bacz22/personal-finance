package com.finance.personalfinance.auth.application;

import com.finance.personalfinance.auth.domain.model.AuthSession;
import com.finance.personalfinance.auth.domain.model.RefreshToken;
import com.finance.personalfinance.auth.domain.repository.AuthSessionRepository;
import com.finance.personalfinance.auth.domain.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthSessionRevocationService {

    private final AuthSessionRepository sessionRepository;
    private final RefreshTokenRepository refreshTokenRepository;

    @Transactional
    public void revoke(Long sessionId, String reason) {
        sessionRepository.findById(sessionId).ifPresent(session -> {
            session.revoke(reason);
            sessionRepository.save(session);
        });
        for (RefreshToken token : refreshTokenRepository.findAllBySessionId(sessionId)) {
            token.revoke(reason);
        }
    }

    @Transactional
    public void revokeAllForUser(Long userId, String reason) {
        for (AuthSession session : sessionRepository.findAllByUserId(userId)) {
            if (session.isActive()) {
                session.revoke(reason);
                sessionRepository.save(session);
            }
            for (RefreshToken token : refreshTokenRepository.findAllBySessionId(session.getId())) {
                if (!token.isRevoked()) {
                    token.revoke(reason);
                }
            }
        }
    }
}
