package com.finance.personalfinance.offline.application;

import com.finance.personalfinance.category.application.CategoryService;
import com.finance.personalfinance.category.domain.model.Category;
import com.finance.personalfinance.category.domain.repository.CategoryRepository;
import com.finance.personalfinance.budget.application.BudgetService;
import com.finance.personalfinance.budget.domain.repository.BudgetRepository;
import com.finance.personalfinance.offline.api.OfflineOperationRequest;
import com.finance.personalfinance.offline.api.OfflineOperationResponse;
import com.finance.personalfinance.offline.api.OfflineSnapshotResponse;
import com.finance.personalfinance.offline.domain.model.OfflineOperationReceipt;
import com.finance.personalfinance.offline.domain.repository.OfflineOperationReceiptRepository;
import com.finance.personalfinance.transaction.application.TransactionService;
import com.finance.personalfinance.transaction.domain.repository.TransactionRepository;
import jakarta.validation.Validator;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class OfflineSyncServiceTest {

    @Test
    void reportsConflictWithCurrentCopyAndScopesLookupToAuthenticatedUser() {
        OfflineOperationReceiptRepository receipts = mock(OfflineOperationReceiptRepository.class);
        OfflineSnapshotService snapshots = mock(OfflineSnapshotService.class);
        CategoryRepository categories = mock(CategoryRepository.class);
        CategoryService categoryService = mock(CategoryService.class);
        Category existing = mock(Category.class);
        var current = new OfflineSnapshotResponse.OfflineCategory(
                "31", "Updated on web", "EXPENSE", "food", "#008866", null, true, 2, 4
        );
        when(receipts.findByUserIdAndOperationId(7L, "op-123")).thenReturn(Optional.empty());
        when(categories.findByIdAndUserId(31L, 7L)).thenReturn(Optional.of(existing));
        when(existing.getVersion()).thenReturn(4L);
        when(snapshots.getCategory(7L, 31L)).thenReturn(current);

        OfflineSyncService service = service(receipts, snapshots, categories, categoryService);
        var operation = new OfflineOperationRequest(
                "op-123", OfflineOperationRequest.EntityType.CATEGORY, OfflineOperationRequest.Action.UPDATE,
                "local:category-1", "31", 3L, null
        );

        OfflineOperationResponse response = service.apply(7L, operation);

        assertEquals(OfflineOperationResponse.Status.CONFLICT, response.status());
        assertEquals(4L, response.version());
        assertSame(current, response.current());
        verify(categories).findByIdAndUserId(31L, 7L);
        verifyNoInteractions(categoryService);
    }

    @Test
    void returnsPriorReceiptWithoutRepeatingMutation() {
        OfflineOperationReceiptRepository receipts = mock(OfflineOperationReceiptRepository.class);
        CategoryService categoryService = mock(CategoryService.class);
        var receipt = new OfflineOperationReceipt(7L, "op-123", "CATEGORY", "local:category-1", 31L, 2L);
        when(receipts.findByUserIdAndOperationId(7L, "op-123")).thenReturn(Optional.of(receipt));

        OfflineSyncService service = service(receipts, mock(OfflineSnapshotService.class),
                mock(CategoryRepository.class), categoryService);
        var operation = new OfflineOperationRequest(
                "op-123", OfflineOperationRequest.EntityType.CATEGORY, OfflineOperationRequest.Action.CREATE,
                "local:category-1", null, null, null
        );

        OfflineOperationResponse response = service.apply(7L, operation);

        assertEquals(OfflineOperationResponse.Status.APPLIED, response.status());
        assertEquals("31", response.entityId());
        assertEquals(2L, response.version());
        verify(categoryService, never()).create(org.mockito.ArgumentMatchers.eq(7L),
                org.mockito.ArgumentMatchers.any());
    }

    private OfflineSyncService service(
            OfflineOperationReceiptRepository receipts,
            OfflineSnapshotService snapshots,
            CategoryRepository categories,
            CategoryService categoryService
    ) {
        return new OfflineSyncService(
                new ObjectMapper(), mock(Validator.class), receipts, snapshots, categories,
                mock(TransactionRepository.class), mock(BudgetRepository.class), categoryService,
                mock(TransactionService.class), mock(BudgetService.class)
        );
    }
}
