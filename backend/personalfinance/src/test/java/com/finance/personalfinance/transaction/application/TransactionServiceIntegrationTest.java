package com.finance.personalfinance.transaction.application;

import com.finance.personalfinance.category.domain.model.Category;
import com.finance.personalfinance.category.domain.model.CategoryType;
import com.finance.personalfinance.category.api.CategoryRequest;
import com.finance.personalfinance.category.application.CategoryService;
import com.finance.personalfinance.category.domain.repository.CategoryRepository;
import com.finance.personalfinance.common.exception.AppException;
import com.finance.personalfinance.transaction.api.TransactionRequest;
import com.finance.personalfinance.transaction.api.TransactionResponse;
import com.finance.personalfinance.user.domain.model.User;
import com.finance.personalfinance.user.domain.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@Transactional
class TransactionServiceIntegrationTest {

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private CategoryService categoryService;

    @Test
    void createsAndFiltersTransactionsWithTotalsScopedToOwner() {
        User user = createUser();
        Category expenseCategory = createCategory(user, "Ăn uống", CategoryType.EXPENSE);
        Category incomeCategory = createCategory(user, "Lương", CategoryType.INCOME);
        LocalDate transactionDate = LocalDate.of(2026, 9, 10);

        transactionService.create(user.getId(), request(
                CategoryType.EXPENSE, expenseCategory.getId(), "85000.00", transactionDate, "Ăn trưa", "Cơm văn phòng"
        ));
        transactionService.create(user.getId(), request(
                CategoryType.INCOME, incomeCategory.getId(), "500000.00", transactionDate, "Lương", null
        ));

        var result = transactionService.findAll(
                user.getId(), CategoryType.EXPENSE, expenseCategory.getId(), transactionDate, transactionDate,
                new BigDecimal("80000"), new BigDecimal("90000"), "văn phòng", 1, 20
        );

        assertEquals(1, result.getTotalItems());
        assertEquals("Ăn trưa", result.getItems().get(0).getTitle());
        assertEquals(0, result.getTotals().income().compareTo(BigDecimal.ZERO));
        assertEquals(0, result.getTotals().expense().compareTo(new BigDecimal("85000.00")));
        assertEquals(0, result.getTotals().balance().compareTo(new BigDecimal("-85000.00")));
        assertEquals(1, categoryService.findAll(user.getId()).stream()
                .filter(item -> item.getId().equals(expenseCategory.getId()))
                .findFirst().orElseThrow().getTransactionCount());
    }

    @Test
    void rejectsCategoryOwnedByAnotherUser() {
        User categoryOwner = createUser();
        User transactionOwner = createUser();
        Category category = createCategory(categoryOwner, "Ăn uống", CategoryType.EXPENSE);

        AppException error = assertThrows(AppException.class, () -> transactionService.create(
                transactionOwner.getId(), request(
                        CategoryType.EXPENSE, category.getId(), "1000", LocalDate.now(), "Ăn", null
                )
        ));

        assertEquals(HttpStatus.NOT_FOUND, error.getStatus());
        assertEquals("CATEGORY_NOT_FOUND", error.getErrorCode());
    }

    @Test
    void doesNotExposeTransactionOwnedByAnotherUser() {
        User owner = createUser();
        User otherUser = createUser();
        Category category = createCategory(owner, "Ăn uống", CategoryType.EXPENSE);
        TransactionResponse created = transactionService.create(owner.getId(), request(
                CategoryType.EXPENSE, category.getId(), "2500", LocalDate.now(), "Ăn nhẹ", null
        ));

        AppException error = assertThrows(AppException.class, () ->
                transactionService.findOne(otherUser.getId(), created.getId())
        );

        assertEquals(HttpStatus.NOT_FOUND, error.getStatus());
        assertEquals("TRANSACTION_NOT_FOUND", error.getErrorCode());
    }

    @Test
    void updatesAndDeletesOwnedTransaction() {
        User user = createUser();
        Category category = createCategory(user, "Ăn uống", CategoryType.EXPENSE);
        TransactionResponse created = transactionService.create(user.getId(), request(
                CategoryType.EXPENSE, category.getId(), "2500", LocalDate.now(), "Ăn nhẹ", null
        ));

        TransactionResponse updated = transactionService.update(user.getId(), created.getId(), request(
                CategoryType.EXPENSE, category.getId(), "3500", LocalDate.now(), "Ăn tối", "Đã sửa"
        ));
        assertEquals("Ăn tối", updated.getTitle());
        assertEquals(0, updated.getAmount().compareTo(new BigDecimal("3500")));

        transactionService.delete(user.getId(), created.getId());
        AppException error = assertThrows(AppException.class, () ->
                transactionService.findOne(user.getId(), created.getId())
        );
        assertEquals("TRANSACTION_NOT_FOUND", error.getErrorCode());
    }

    @Test
    void preventsChangingTypeOfCategoryWithTransactions() {
        User user = createUser();
        Category category = createCategory(user, "Ăn uống", CategoryType.EXPENSE);
        transactionService.create(user.getId(), request(
                CategoryType.EXPENSE, category.getId(), "2500", LocalDate.now(), "Ăn nhẹ", null
        ));
        CategoryRequest update = new CategoryRequest();
        update.setName("Ăn uống");
        update.setType(CategoryType.INCOME);
        update.setIconKey("more-horizontal");
        update.setColor("#64748B");
        update.setActive(true);

        AppException error = assertThrows(AppException.class, () ->
                categoryService.update(user.getId(), category.getId(), update)
        );

        assertEquals(HttpStatus.CONFLICT, error.getStatus());
        assertEquals("CATEGORY_IN_USE", error.getErrorCode());
    }

    private User createUser() {
        return userRepository.saveAndFlush(new User(
                "Transaction Test",
                "transaction-" + UUID.randomUUID() + "@example.test",
                "not-a-real-password-hash"
        ));
    }

    private Category createCategory(User user, String name, CategoryType type) {
        return categoryRepository.saveAndFlush(new Category(
                user.getId(), name, type, "more-horizontal", "#64748B", null, true
        ));
    }

    private TransactionRequest request(
            CategoryType type,
            Long categoryId,
            String amount,
            LocalDate date,
            String title,
            String note
    ) {
        TransactionRequest request = new TransactionRequest();
        request.setType(type);
        request.setCategoryId(categoryId);
        request.setAmount(new BigDecimal(amount));
        request.setTransactionDate(date);
        request.setTitle(title);
        request.setNote(note);
        return request;
    }
}
