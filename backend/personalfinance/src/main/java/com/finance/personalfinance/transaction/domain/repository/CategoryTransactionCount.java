package com.finance.personalfinance.transaction.domain.repository;

public interface CategoryTransactionCount {
    Long getCategoryId();

    long getTransactionCount();
}
