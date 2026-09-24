package com.finance.personalfinance.auth.application;

import com.finance.personalfinance.auth.infrastructure.jwt.JwtProperties;
import jakarta.annotation.PreDestroy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class InMemoryRefreshTokenGraceCache implements RefreshTokenGraceCache {

    private final JwtProperties properties;
    private final ConcurrentHashMap<String, Entry> entries = new ConcurrentHashMap<>();

    public InMemoryRefreshTokenGraceCache(JwtProperties properties) {
        this.properties = properties;
    }

    @Override
    public void put(String oldTokenHash, String newRawToken, Long sessionId) {
        entries.put(oldTokenHash, new Entry(
                newRawToken,
                sessionId,
                Instant.now().plus(properties.getRefreshGraceTtl())
        ));
    }

    @Override
    public Optional<GraceEntry> getValid(String oldTokenHash, Long sessionId) {
        Entry entry = entries.get(oldTokenHash);
        if (entry == null) return Optional.empty();
        if (!entry.sessionId().equals(sessionId) || !Instant.now().isBefore(entry.expiresAt())) {
            entries.remove(oldTokenHash, entry);
            return Optional.empty();
        }
        return Optional.of(new GraceEntry(entry.newRawToken(), entry.sessionId()));
    }

    @Scheduled(fixedDelayString = "${app.auth.refresh-grace-cleanup-ms:10000}")
    public void cleanupExpired() {
        Instant now = Instant.now();
        entries.entrySet().removeIf(entry -> !now.isBefore(entry.getValue().expiresAt()));
    }

    @PreDestroy
    public void clear() {
        entries.clear();
    }

    private record Entry(String newRawToken, Long sessionId, Instant expiresAt) {
    }
}
