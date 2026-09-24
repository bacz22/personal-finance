package com.finance.personalfinance.offline.api;

import tools.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record OfflineOperationRequest(
        @NotBlank @Size(max = 36) String operationId,
        @NotNull EntityType entityType,
        @NotNull Action action,
        @Size(max = 80) String localId,
        @Size(max = 19) String entityId,
        Long baseVersion,
        JsonNode payload
) {
    public enum EntityType { CATEGORY, TRANSACTION, BUDGET }
    public enum Action { CREATE, UPDATE, DELETE }
}
