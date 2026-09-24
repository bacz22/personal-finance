package com.finance.personalfinance.offline.api;

import java.time.Instant;
import java.util.List;

public record OfflineSnapshotResponse(
        Instant generatedAt,
        OfflineUser user,
        List<OfflineCategory> categories,
        List<OfflineTransaction> transactions,
        List<OfflineBudget> budgets
) {
    public record OfflineUser(
            String id,
            String fullName,
            String email,
            String currency,
            boolean mustChangePassword
    ) { }

    public record OfflineCategory(
            String id,
            String name,
            String type,
            String iconKey,
            String color,
            String description,
            boolean active,
            long transactionCount,
            long version
    ) { }

    public record OfflineTransaction(
            String id,
            String type,
            String amount,
            String categoryId,
            String categoryName,
            String categoryIconKey,
            String categoryColor,
            String transactionDate,
            String title,
            String note,
            Instant createdAt,
            Instant updatedAt,
            long version
    ) { }

    public record OfflineBudget(
            String id,
            String month,
            String categoryId,
            String categoryName,
            String categoryIconKey,
            String categoryColor,
            String limitAmount,
            String spent,
            long version
    ) { }
}
