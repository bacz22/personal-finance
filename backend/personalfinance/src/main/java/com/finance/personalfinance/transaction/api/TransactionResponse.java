package com.finance.personalfinance.transaction.api;

import com.finance.personalfinance.category.domain.model.CategoryType;
import com.finance.personalfinance.transaction.domain.model.Transaction;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Getter
@Builder
public class TransactionResponse {

    private Long id;
    private CategoryType type;
    private BigDecimal amount;
    private Long categoryId;
    private String categoryName;
    private String categoryIconKey;
    private String categoryColor;
    private LocalDate transactionDate;
    private String title;
    private String note;
    private Instant createdAt;
    private Instant updatedAt;

    public static TransactionResponse from(Transaction transaction) {
        return TransactionResponse.builder()
                .id(transaction.getId())
                .type(transaction.getType())
                .amount(transaction.getAmount())
                .categoryId(transaction.getCategory().getId())
                .categoryName(transaction.getCategory().getName())
                .categoryIconKey(transaction.getCategory().getIconKey())
                .categoryColor(transaction.getCategory().getColor())
                .transactionDate(transaction.getTransactionDate())
                .title(transaction.getTitle())
                .note(transaction.getNote())
                .createdAt(transaction.getCreatedAt())
                .updatedAt(transaction.getUpdatedAt())
                .build();
    }
}
