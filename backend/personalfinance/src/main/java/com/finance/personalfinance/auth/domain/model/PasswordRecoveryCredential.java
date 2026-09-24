package com.finance.personalfinance.auth.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "password_recovery_credentials")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PasswordRecoveryCredential {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "consumed_at")
    private Instant consumedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public PasswordRecoveryCredential(Long userId, String passwordHash, Instant expiresAt) {
        this.userId = userId;
        this.passwordHash = passwordHash;
        this.expiresAt = expiresAt;
    }

    public boolean isUsable() {
        return consumedAt == null && expiresAt != null && Instant.now().isBefore(expiresAt);
    }

    public void consume() {
        this.consumedAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
