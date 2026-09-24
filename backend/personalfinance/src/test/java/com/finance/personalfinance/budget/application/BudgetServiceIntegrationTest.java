package com.finance.personalfinance.budget.application;

import com.finance.personalfinance.budget.api.BudgetRequest;
import com.finance.personalfinance.category.domain.model.Category;
import com.finance.personalfinance.category.domain.model.CategoryType;
import com.finance.personalfinance.category.api.CategoryRequest;
import com.finance.personalfinance.category.application.CategoryService;
import com.finance.personalfinance.category.domain.repository.CategoryRepository;
import com.finance.personalfinance.common.exception.AppException;
import com.finance.personalfinance.transaction.api.TransactionRequest;
import com.finance.personalfinance.transaction.application.TransactionService;
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
class BudgetServiceIntegrationTest {

    @Autowired
    private BudgetService budgetService;

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Test
    void summarizesOnlyOwnedExpensesWithinTheSelectedMonth() {
        User owner = createUser();
        User otherUser = createUser();
        Category food = createCategory(owner, "Ăn uống", CategoryType.EXPENSE, true);
        Category salary = createCategory(owner, "Lương", CategoryType.INCOME, true);
        Category otherFood = createCategory(otherUser, "Ăn uống", CategoryType.EXPENSE, true);

        createTransaction(owner, food, "120.50", "2025-12-01");
        createTransaction(owner, food, "79.50", "2025-12-31");
        createTransaction(owner, food, "500", "2025-11-30");
        createTransaction(owner, food, "500", "2026-01-01");
        createTransaction(owner, salary, "5000", "2025-12-15");
        createTransaction(otherUser, otherFood, "9000", "2025-12-15");

        var created = budgetService.create(owner.getId(), request("2025-12", food, "500"));
        var listed = budgetService.findAll(owner.getId(), "2025-12");

        assertEquals("2025-12", created.month());
        assertMoney("200", created.spent());
        assertEquals(1, listed.size());
        assertMoney("200", listed.get(0).spent());
        assertEquals(0, budgetService.findAll(owner.getId(), "2026-01").size());
    }

    @Test
    void supportsCreateUpdateAndDeleteAndRejectsDuplicateBudget() {
        User user = createUser();
        Category food = createCategory(user, "Ăn uống", CategoryType.EXPENSE, true);
        Category travel = createCategory(user, "Đi lại", CategoryType.EXPENSE, true);

        var created = budgetService.create(user.getId(), request("2026-09", food, "1000"));
        AppException duplicate = assertThrows(AppException.class, () ->
                budgetService.create(user.getId(), request("2026-09", food, "2000"))
        );
        assertEquals(HttpStatus.CONFLICT, duplicate.getStatus());
        assertEquals("BUDGET_ALREADY_EXISTS", duplicate.getErrorCode());

        var updated = budgetService.update(user.getId(), created.id(), request("2026-10", travel, "2500"));
        assertEquals("2026-10", updated.month());
        assertEquals(travel.getId(), updated.categoryId());
        assertMoney("2500", updated.limitAmount());

        budgetService.delete(user.getId(), created.id());
        assertEquals(0, budgetService.findAll(user.getId(), "2026-10").size());
    }

    @Test
    void rejectsForeignBudgetsIncomeCategoriesAndMalformedMonths() {
        User owner = createUser();
        User otherUser = createUser();
        Category expense = createCategory(owner, "Ăn uống", CategoryType.EXPENSE, true);
        Category income = createCategory(owner, "Lương", CategoryType.INCOME, true);
        Category foreignExpense = createCategory(otherUser, "Ăn uống", CategoryType.EXPENSE, true);
        var foreignBudget = budgetService.create(otherUser.getId(), request("2026-09", foreignExpense, "100"));

        AppException notFound = assertThrows(AppException.class, () ->
                budgetService.update(owner.getId(), foreignBudget.id(), request("2026-09", expense, "200"))
        );
        assertEquals(HttpStatus.NOT_FOUND, notFound.getStatus());

        AppException incomeError = assertThrows(AppException.class, () ->
                budgetService.create(owner.getId(), request("2026-09", income, "200"))
        );
        assertEquals(HttpStatus.BAD_REQUEST, incomeError.getStatus());

        for (String month : new String[]{"2026-00", "2026-13", "2026-9", "26-09"}) {
            AppException monthError = assertThrows(AppException.class, () ->
                    budgetService.findAll(owner.getId(), month)
            );
            assertEquals(HttpStatus.BAD_REQUEST, monthError.getStatus());
        }
    }

    @Test
    void permitsEditingAnExistingBudgetForAnInactiveCategoryButNotCreatingOne() {
        User user = createUser();
        Category food = createCategory(user, "Ăn uống", CategoryType.EXPENSE, true);
        var created = budgetService.create(user.getId(), request("2026-09", food, "1000"));
        food.deactivate();
        categoryRepository.saveAndFlush(food);

        var updated = budgetService.update(user.getId(), created.id(), request("2026-10", food, "1500"));
        assertEquals("2026-10", updated.month());
        assertMoney("1500", updated.limitAmount());

        AppException inactiveError = assertThrows(AppException.class, () ->
                budgetService.create(user.getId(), request("2026-10", food, "2000"))
        );
        assertEquals("CATEGORY_INACTIVE", inactiveError.getErrorCode());
    }

    @Test
    void preventsChangingBudgetCategoryTypeToIncome() {
        User user = createUser();
        Category food = createCategory(user, "Ăn uống", CategoryType.EXPENSE, true);
        budgetService.create(user.getId(), request("2026-09", food, "1000"));
        CategoryRequest update = new CategoryRequest();
        update.setName(food.getName());
        update.setType(CategoryType.INCOME);
        update.setIconKey(food.getIconKey());
        update.setColor(food.getColor());
        update.setActive(true);

        AppException error = assertThrows(AppException.class, () ->
                categoryService.update(user.getId(), food.getId(), update)
        );
        assertEquals(HttpStatus.CONFLICT, error.getStatus());
        assertEquals("CATEGORY_HAS_BUDGET", error.getErrorCode());
    }

    private User createUser() {
        return userRepository.saveAndFlush(new User(
                "Budget Test", "budget-" + UUID.randomUUID() + "@example.test", "not-a-real-password-hash"
        ));
    }

    private Category createCategory(User user, String name, CategoryType type, boolean active) {
        return categoryRepository.saveAndFlush(new Category(
                user.getId(), name, type, "more-horizontal", "#64748B", null, active
        ));
    }

    private BudgetRequest request(String month, Category category, String limitAmount) {
        BudgetRequest request = new BudgetRequest();
        request.setMonth(month);
        request.setCategoryId(category.getId());
        request.setLimitAmount(new BigDecimal(limitAmount));
        return request;
    }

    private void createTransaction(User user, Category category, String amount, String date) {
        TransactionRequest request = new TransactionRequest();
        request.setType(category.getType());
        request.setCategoryId(category.getId());
        request.setAmount(new BigDecimal(amount));
        request.setTransactionDate(LocalDate.parse(date));
        request.setTitle("Budget integration transaction");
        transactionService.create(user.getId(), request);
    }

    private void assertMoney(String expected, BigDecimal actual) {
        assertEquals(0, new BigDecimal(expected).compareTo(actual));
    }
}
