package com.finance.personalfinance.auth.application;

import com.finance.personalfinance.auth.infrastructure.jwt.JwtProperties;
import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class InMemoryRefreshTokenGraceCacheTest {

    @Test
    void cleanupRemovesExpiredRawTokens() {
        JwtProperties properties = new JwtProperties();
        properties.setRefreshGraceTtl(Duration.ZERO);
        InMemoryRefreshTokenGraceCache cache = new InMemoryRefreshTokenGraceCache(properties);

        cache.put("old-hash", "raw-next-token", 1L);
        cache.cleanupExpired();

        assertTrue(cache.getValid("old-hash", 1L).isEmpty());
    }

    @Test
    void cleanupKeepsTokensWithinGracePeriod() {
        JwtProperties properties = new JwtProperties();
        properties.setRefreshGraceTtl(Duration.ofMinutes(1));
        InMemoryRefreshTokenGraceCache cache = new InMemoryRefreshTokenGraceCache(properties);

        cache.put("old-hash", "raw-next-token", 1L);
        cache.cleanupExpired();

        assertEquals("raw-next-token", cache.getValid("old-hash", 1L).orElseThrow().newRawToken());
    }
}
