package com.finance.personalfinance.offline.domain.repository;

import com.finance.personalfinance.offline.domain.model.OfflineOperationReceipt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OfflineOperationReceiptRepository extends JpaRepository<OfflineOperationReceipt, Long> {

    Optional<OfflineOperationReceipt> findByUserIdAndOperationId(Long userId, String operationId);
}
