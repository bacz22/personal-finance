package com.finance.personalfinance.transaction.api;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class TransactionPageResponse {
    private List<TransactionResponse> items;
    private int page;
    private int size;
    private long totalItems;
    private int totalPages;
    private TransactionTotalsResponse totals;
}
