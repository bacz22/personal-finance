package com.finance.personalfinance.auth.application;

import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class PasswordRecoveryRateLimiter {

    private static final Duration EMAIL_WINDOW = Duration.ofMinutes(10);
    private static final Duration IP_WINDOW = Duration.ofHours(1);
    private static final int MAX_EMAIL_REQUESTS = 1;
    private static final int MAX_IP_REQUESTS = 10;
    private static final int MAX_TRACKED_KEYS = 20_000;

    private final Map<String, Deque<Instant>> requests = new LinkedHashMap<>(256, 0.75f, true);

    public synchronized boolean allow(String normalizedEmail, String clientIp) {
        Instant now = Instant.now();
        String emailKey = "email:" + hashKey(normalizedEmail);
        String ipKey = "ip:" + hashKey(clientIp == null ? "unknown" : clientIp);

        if (isLimited(emailKey, EMAIL_WINDOW, MAX_EMAIL_REQUESTS, now)
                || isLimited(ipKey, IP_WINDOW, MAX_IP_REQUESTS, now)) {
            return false;
        }

        add(emailKey, now);
        add(ipKey, now);
        pruneOldestKeys();
        return true;
    }

    public synchronized void refund(String normalizedEmail, String clientIp) {
        String emailKey = "email:" + hashKey(normalizedEmail);
        Deque<Instant> emailRequests = requests.get(emailKey);
        if (emailRequests == null || emailRequests.isEmpty()) return;
        Instant failedRequestTime = emailRequests.removeLast();
        if (emailRequests.isEmpty()) requests.remove(emailKey);

        String ipKey = "ip:" + hashKey(clientIp == null ? "unknown" : clientIp);
        Deque<Instant> ipRequests = requests.get(ipKey);
        if (ipRequests == null) return;
        ipRequests.removeFirstOccurrence(failedRequestTime);
        if (ipRequests.isEmpty()) requests.remove(ipKey);
    }

    private boolean isLimited(String key, Duration window, int maximum, Instant now) {
        Deque<Instant> timestamps = requests.get(key);
        if (timestamps == null) {
            return false;
        }
        discardExpired(timestamps, window, now);
        return timestamps.size() >= maximum;
    }

    private void add(String key, Instant now) {
        requests.computeIfAbsent(key, ignored -> new ArrayDeque<>()).addLast(now);
    }

    private void discardExpired(Deque<Instant> timestamps, Duration window, Instant now) {
        Instant cutoff = now.minus(window);
        while (!timestamps.isEmpty() && !timestamps.peekFirst().isAfter(cutoff)) {
            timestamps.removeFirst();
        }
    }

    private void pruneOldestKeys() {
        if (requests.size() <= MAX_TRACKED_KEYS) {
            return;
        }
        Iterator<String> iterator = requests.keySet().iterator();
        while (requests.size() > MAX_TRACKED_KEYS && iterator.hasNext()) {
            iterator.next();
            iterator.remove();
        }
    }

    private String hashKey(String value) {
        try {
            return java.util.HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 không khả dụng.", exception);
        }
    }
}
