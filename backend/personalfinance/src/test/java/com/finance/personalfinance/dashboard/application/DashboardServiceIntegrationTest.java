package com.finance.personalfinance.dashboard.application;

import com.finance.personalfinance.category.domain.model.Category;
import com.finance.personalfinance.category.domain.model.CategoryType;
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
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@Transactional
class DashboardServiceIntegrationTest {

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Test
    void aggregatesMonthlyTotalsCategoriesDailyTrendAndPreviousMonthForOwner() {
        User owner = createUser();
        User otherUser = createUser();
        Category food = createCategory(owner, "Ăn uống", CategoryType.EXPENSE);
        Category travel = createCategory(owner, "Đi lại", CategoryType.EXPENSE);
        Category salary = createCategory(owner, "Lương", CategoryType.INCOME);
        Category otherFood = createCategory(otherUser, "Ăn uống", CategoryType.EXPENSE);

        createTransaction(owner, salary, "1000", "2026-09-01", "Lương");
        createTransaction(owner, food, "200", "2026-09-05", "Ăn tối");
        createTransaction(owner, travel, "300", "2026-09-30", "Mua vé");
        createTransaction(owner, food, "150", "2026-08-31", "Tháng trước");
        createTransaction(owner, food, "900", "2026-10-01", "Tháng sau");
        createTransaction(otherUser, otherFood, "700", "2026-09-10", "User khác");

        var dashboard = dashboardService.getDashboard(owner.getId(), "2026-09");

        assertEquals("2026-09", dashboard.month());
        assertMoney("1000", dashboard.income());
        assertMoney("500", dashboard.expense());
        assertMoney("500", dashboard.balance());
        assertMoney("50.0", dashboard.savingsRate());
        assertEquals(3, dashboard.transactionCount());
        assertMoney("150", dashboard.previousMonthExpense());

        assertEquals(2, dashboard.categoryBreakdown().size());
        assertEquals("Đi lại", dashboard.categoryBreakdown().get(0).categoryName());
        assertMoney("300", dashboard.categoryBreakdown().get(0).amount());
        assertEquals("Ăn uống", dashboard.categoryBreakdown().get(1).categoryName());
        assertMoney("200", dashboard.categoryBreakdown().get(1).amount());
        assertMoney("500", dashboard.categoryBreakdown().stream()
                .map(row -> row.amount())
                .reduce(BigDecimal.ZERO, BigDecimal::add));

        assertEquals(30, dashboard.dailyExpenses().size());
        assertEquals(LocalDate.of(2026, 9, 1), dashboard.dailyExpenses().get(0).date());
        assertMoney("200", dashboard.dailyExpenses().get(4).amount());
        assertMoney("0", dashboard.dailyExpenses().get(9).amount());
        assertMoney("300", dashboard.dailyExpenses().get(29).amount());
        assertMoney("500", dashboard.dailyExpenses().stream()
                .map(row -> row.amount())
                .reduce(BigDecimal.ZERO, BigDecimal::add));

        assertEquals(3, dashboard.recentTransactions().size());
        assertEquals("Mua vé", dashboard.recentTransactions().get(0).getTitle());
        assertEquals("Ăn tối", dashboard.recentTransactions().get(1).getTitle());
        assertEquals("Lương", dashboard.recentTransactions().get(2).getTitle());
    }

    @Test
    void returnsEmptyCollectionsAndNullSavingsRateForMonthWithoutTransactions() {
        User user = createUser();

        var dashboard = dashboardService.getDashboard(user.getId(), "2026-02");

        assertMoney("0", dashboard.income());
        assertMoney("0", dashboard.expense());
        assertMoney("0", dashboard.balance());
        assertNull(dashboard.savingsRate());
        assertEquals(0, dashboard.transactionCount());
        assertEquals(0, dashboard.previousMonthExpense().compareTo(BigDecimal.ZERO));
        assertEquals(0, dashboard.categoryBreakdown().size());
        assertEquals(0, dashboard.dailyExpenses().size());
        assertEquals(0, dashboard.recentTransactions().size());
    }

    @Test
    void computesNegativeSavingsRateAndIncomeOnlyMonth() {
        User user = createUser();
        Category food = createCategory(user, "Ăn uống", CategoryType.EXPENSE);
        Category salary = createCategory(user, "Lương", CategoryType.INCOME);
        createTransaction(user, salary, "100", "2026-03-01", "Thu nhập");
        createTransaction(user, food, "150", "2026-03-02", "Chi tiêu");
        createTransaction(user, salary, "50", "2026-04-03", "Thu nhập tháng 4");

        var dashboard = dashboardService.getDashboard(user.getId(), "2026-03");

        assertMoney("-50", dashboard.balance());
        assertMoney("-50.0", dashboard.savingsRate());

        var incomeOnlyMonth = dashboardService.getDashboard(user.getId(), "2026-04");
        assertMoney("50", incomeOnlyMonth.income());
        assertMoney("0", incomeOnlyMonth.expense());
        assertMoney("100.0", incomeOnlyMonth.savingsRate());
        assertEquals(0, incomeOnlyMonth.categoryBreakdown().size());
        assertEquals(0, incomeOnlyMonth.dailyExpenses().size());
    }

    @Test
    void usesPreviousCalendarMonthAcrossYearBoundaryAndCapsRecentItemsAtEight() {
        User user = createUser();
        Category food = createCategory(user, "Ăn uống", CategoryType.EXPENSE);
        createTransaction(user, food, "80", "2025-12-31", "Tháng 12");
        for (int i = 1; i <= 10; i++) {
            createTransaction(user, food, "10", String.format("2026-01-%02d", i), "Chi " + i);
        }

        var dashboard = dashboardService.getDashboard(user.getId(), "2026-01");

        assertMoney("100", dashboard.expense());
        assertMoney("80", dashboard.previousMonthExpense());
        assertEquals(10, dashboard.transactionCount());
        assertEquals(8, dashboard.recentTransactions().size());
        assertEquals("Chi 10", dashboard.recentTransactions().get(0).getTitle());
        assertEquals("Chi 3", dashboard.recentTransactions().get(7).getTitle());
        assertEquals(31, dashboard.dailyExpenses().size());
    }

    @Test
    void rejectsInvalidMonthValue() {
        User user = createUser();

        AppException error = assertThrows(AppException.class, () ->
                dashboardService.getDashboard(user.getId(), "2026-13")
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatus());
        assertEquals("INVALID_MONTH", error.getErrorCode());
    }

    private User createUser() {
        return userRepository.saveAndFlush(new User(
                "Dashboard Test", "dashboard-" + UUID.randomUUID() + "@example.test", "not-a-real-password-hash"
        ));
    }

    private Category createCategory(User user, String name, CategoryType type) {
        return categoryRepository.saveAndFlush(new Category(
                user.getId(), name, type, "more-horizontal", "#64748B", null, true
        ));
    }

    private void createTransaction(User user, Category category, String amount, String date, String title) {
        TransactionRequest request = new TransactionRequest();
        request.setType(category.getType());
        request.setCategoryId(category.getId());
        request.setAmount(new BigDecimal(amount));
        request.setTransactionDate(LocalDate.parse(date));
        request.setTitle(title);
        transactionService.create(user.getId(), request);
    }

    private void assertMoney(String expected, BigDecimal actual) {
        assertEquals(0, new BigDecimal(expected).compareTo(actual));
    }
}
