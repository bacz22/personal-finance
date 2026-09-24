package com.finance.personalfinance.offline.api;

public record OfflineOperationResponse(
        String operationId,
        OfflineOperationRequest.EntityType entityType,
        String localId,
        String entityId,
        Long version,
        Status status,
        Object current
) {
    public enum Status { APPLIED, CONFLICT }
}
