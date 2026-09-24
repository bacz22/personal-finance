package com.finance.personalfinance.offline.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "offline_operation_receipts", uniqueConstraints = @UniqueConstraint(
        name = "uq_offline_receipt_user_operation", columnNames = {"user_id", "operation_id"}
))
public class OfflineOperationReceipt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "operation_id", nullable = false, length = 36)
    private String operationId;

    @Column(name = "entity_type", nullable = false, length = 20)
    private String entityType;

    @Column(name = "local_id", length = 80)
    private String localId;

    @Column(name = "entity_id")
    private Long entityId;

    @Column(name = "entity_version")
    private Long entityVersion;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public OfflineOperationReceipt(
            Long userId,
            String operationId,
            String entityType,
            String localId,
            Long entityId,
            Long entityVersion
    ) {
        this.userId = userId;
        this.operationId = operationId;
        this.entityType = entityType;
        this.localId = localId;
        this.entityId = entityId;
        this.entityVersion = entityVersion;
        this.createdAt = Instant.now();
    }
}
