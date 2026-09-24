package com.finance.personalfinance.offline.application;

import tools.jackson.databind.ObjectMapper;
import com.finance.personalfinance.budget.api.BudgetRequest;
import com.finance.personalfinance.budget.application.BudgetService;
import com.finance.personalfinance.budget.domain.model.Budget;
import com.finance.personalfinance.budget.domain.repository.BudgetRepository;
import com.finance.personalfinance.category.api.CategoryRequest;
import com.finance.personalfinance.category.api.CategoryResponse;
import com.finance.personalfinance.category.application.CategoryService;
import com.finance.personalfinance.category.domain.model.Category;
import com.finance.personalfinance.category.domain.repository.CategoryRepository;
import com.finance.personalfinance.common.exception.AppException;
import com.finance.personalfinance.offline.api.OfflineOperationRequest;
import com.finance.personalfinance.offline.api.OfflineOperationResponse;
import com.finance.personalfinance.offline.api.OfflineSnapshotResponse;
import com.finance.personalfinance.offline.domain.model.OfflineOperationReceipt;
import com.finance.personalfinance.offline.domain.repository.OfflineOperationReceiptRepository;
import com.finance.personalfinance.transaction.api.TransactionRequest;
import com.finance.personalfinance.transaction.application.TransactionService;
import com.finance.personalfinance.transaction.domain.model.Transaction;
import com.finance.personalfinance.transaction.domain.repository.TransactionRepository;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class OfflineSyncService {

    private final ObjectMapper objectMapper;
    private final Validator validator;
    private final OfflineOperationReceiptRepository receiptRepository;
    private final OfflineSnapshotService snapshotService;
    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;
    private final CategoryService categoryService;
    private final TransactionService transactionService;
    private final BudgetService budgetService;

    @Transactional
    public OfflineOperationResponse apply(Long userId, OfflineOperationRequest operation) {
        var previousReceipt = receiptRepository.findByUserIdAndOperationId(userId, operation.operationId());
        if (previousReceipt.isPresent()) {
            return applied(previousReceipt.get());
        }

        if (operation.action() == OfflineOperationRequest.Action.CREATE) {
            requireCreateFields(operation);
            return create(userId, operation);
        }

        Long entityId = parseId(operation.entityId());
        if (operation.baseVersion() == null || operation.baseVersion() < 0) {
            throw invalidOperation("Thao tác sửa hoặc xóa cần version nền.");
        }

        return switch (operation.entityType()) {
            case CATEGORY -> updateCategory(userId, entityId, operation);
            case TRANSACTION -> updateTransaction(userId, entityId, operation);
            case BUDGET -> updateBudget(userId, entityId, operation);
        };
    }

    private OfflineOperationResponse create(Long userId, OfflineOperationRequest operation) {
        return switch (operation.entityType()) {
            case CATEGORY -> {
                CategoryResponse created = categoryService.create(userId, payload(operation, CategoryRequest.class));
                var current = snapshotService.getCategory(userId, created.getId());
                yield saveReceipt(userId, operation, created.getId(), current.version());
            }
            case TRANSACTION -> {
                var created = transactionService.create(userId, payload(operation, TransactionRequest.class));
                var current = snapshotService.getTransaction(userId, created.getId());
                yield saveReceipt(userId, operation, created.getId(), current.version());
            }
            case BUDGET -> {
                var created = budgetService.create(userId, payload(operation, BudgetRequest.class));
                var current = snapshotService.getBudget(userId, created.id());
                yield saveReceipt(userId, operation, created.id(), current.version());
            }
        };
    }

    private OfflineOperationResponse updateCategory(Long userId, Long id, OfflineOperationRequest operation) {
        Category category = categoryRepository.findByIdAndUserId(id, userId).orElse(null);
        if (category == null || category.getVersion() != operation.baseVersion()) {
            return conflict(operation, id, category == null ? null : snapshotService.getCategory(userId, id));
        }
        if (operation.action() == OfflineOperationRequest.Action.DELETE) {
            categoryService.deactivate(userId, id);
            categoryRepository.flush();
        } else {
            categoryService.update(userId, id, payload(operation, CategoryRequest.class));
        }
        return saveReceipt(userId, operation, id, snapshotService.getCategory(userId, id).version());
    }

    private OfflineOperationResponse updateTransaction(Long userId, Long id, OfflineOperationRequest operation) {
        Transaction transaction = transactionRepository.findByIdAndUserId(id, userId).orElse(null);
        if (transaction == null || transaction.getVersion() != operation.baseVersion()) {
            return conflict(operation, id, transaction == null ? null : snapshotService.getTransaction(userId, id));
        }
        if (operation.action() == OfflineOperationRequest.Action.DELETE) {
            transactionService.delete(userId, id);
            transactionRepository.flush();
            return saveReceipt(userId, operation, id, null);
        }
        transactionService.update(userId, id, payload(operation, TransactionRequest.class));
        return saveReceipt(userId, operation, id, snapshotService.getTransaction(userId, id).version());
    }

    private OfflineOperationResponse updateBudget(Long userId, Long id, OfflineOperationRequest operation) {
        Budget budget = budgetRepository.findByIdAndUserId(id, userId).orElse(null);
        if (budget == null || budget.getVersion() != operation.baseVersion()) {
            return conflict(operation, id, budget == null ? null : snapshotService.getBudget(userId, id));
        }
        if (operation.action() == OfflineOperationRequest.Action.DELETE) {
            budgetService.delete(userId, id);
            budgetRepository.flush();
            return saveReceipt(userId, operation, id, null);
        }
        budgetService.update(userId, id, payload(operation, BudgetRequest.class));
        return saveReceipt(userId, operation, id, snapshotService.getBudget(userId, id).version());
    }

    private <T> T payload(OfflineOperationRequest operation, Class<T> payloadType) {
        if (operation.payload() == null || operation.payload().isNull()) {
            throw invalidOperation("Thiếu dữ liệu cho thao tác.");
        }
        T value;
        try {
            value = objectMapper.treeToValue(operation.payload(), payloadType);
        } catch (Exception exception) {
            throw invalidOperation("Dữ liệu thao tác không đúng định dạng.");
        }
        Set<ConstraintViolation<T>> violations = validator.validate(value);
        if (!violations.isEmpty()) {
            String message = violations.stream().map(ConstraintViolation::getMessage).findFirst()
                    .orElse("Dữ liệu thao tác không hợp lệ.");
            throw invalidOperation(message);
        }
        return value;
    }

    private void requireCreateFields(OfflineOperationRequest operation) {
        if (operation.localId() == null || operation.localId().isBlank() || operation.entityId() != null) {
            throw invalidOperation("Thao tác tạo cần localId và không được có entityId.");
        }
    }

    private Long parseId(String value) {
        if (value == null || !value.matches("[1-9][0-9]{0,18}")) {
            throw invalidOperation("ID bản ghi không hợp lệ.");
        }
        try {
            return Long.valueOf(value);
        } catch (NumberFormatException exception) {
            throw invalidOperation("ID bản ghi không hợp lệ.");
        }
    }

    private OfflineOperationResponse saveReceipt(
            Long userId,
            OfflineOperationRequest operation,
            Long entityId,
            Long version
    ) {
        OfflineOperationReceipt receipt = new OfflineOperationReceipt(
                userId, operation.operationId(), operation.entityType().name(), operation.localId(), entityId, version
        );
        receiptRepository.saveAndFlush(receipt);
        return applied(receipt);
    }

    private OfflineOperationResponse applied(OfflineOperationReceipt receipt) {
        return new OfflineOperationResponse(
                receipt.getOperationId(),
                OfflineOperationRequest.EntityType.valueOf(receipt.getEntityType()),
                receipt.getLocalId(),
                receipt.getEntityId() == null ? null : receipt.getEntityId().toString(),
                receipt.getEntityVersion(),
                OfflineOperationResponse.Status.APPLIED,
                null
        );
    }

    private OfflineOperationResponse conflict(
            OfflineOperationRequest operation,
            Long id,
            Object current
    ) {
        Long version = current instanceof OfflineSnapshotResponse.OfflineCategory category ? category.version()
                : current instanceof OfflineSnapshotResponse.OfflineTransaction transaction ? transaction.version()
                : current instanceof OfflineSnapshotResponse.OfflineBudget budget ? budget.version()
                : null;
        return new OfflineOperationResponse(
                operation.operationId(), operation.entityType(), operation.localId(),
                id == null ? null : id.toString(), version,
                OfflineOperationResponse.Status.CONFLICT, current
        );
    }

    private AppException invalidOperation(String message) {
        return new AppException(HttpStatus.BAD_REQUEST, "INVALID_OFFLINE_OPERATION", message);
    }
}
