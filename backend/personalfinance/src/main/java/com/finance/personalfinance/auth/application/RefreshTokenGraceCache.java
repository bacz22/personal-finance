package com.finance.personalfinance.auth.application;

import java.util.Optional;

public interface RefreshTokenGraceCache {

    void put(String oldTokenHash, String newRawToken, Long sessionId);

    Optional<GraceEntry> getValid(String oldTokenHash, Long sessionId);

    record GraceEntry(String newRawToken, Long sessionId) {
    }
}
