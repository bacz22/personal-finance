package com.finance.personalfinance.transaction.domain.repository;

import com.finance.personalfinance.transaction.domain.model.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface TransactionSearchRepository {

    Page<Transaction> findFiltered(TransactionFilter filter, Pageable pageable);

    TransactionTotalsProjection summarizeFiltered(TransactionFilter filter);
}
