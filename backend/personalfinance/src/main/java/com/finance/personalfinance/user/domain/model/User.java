package com.finance.personalfinance.user.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Locale;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false, length = 120)
    private String fullName;

    @Column(nullable = false, length = 320)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(nullable = false, length = 10)
    private String currency = "VND";

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public User(String fullName, String email, String passwordHash) {
        this.fullName = fullName.trim();
        this.email = normalizeEmail(email);
        this.passwordHash = passwordHash;
    }

    public void disable() {
        this.enabled = false;
    }

    public void updateFullName(String fullName) {
        this.fullName = fullName.trim();
    }

    public void updatePasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    @PrePersist
    void onCreate() {
        email = normalizeEmail(email);
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        email = normalizeEmail(email);
        updatedAt = Instant.now();
    }

    private static String normalizeEmail(String value) {
        return value == null ? null : value.trim().toLowerCase(Locale.ROOT);
    }
}
