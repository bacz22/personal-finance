package com.finance.personalfinance.reports.application;

import com.finance.personalfinance.category.domain.model.Category;
import com.finance.personalfinance.category.domain.model.CategoryType;
import com.finance.personalfinance.category.domain.repository.CategoryRepository;
import com.finance.personalfinance.common.exception.AppException;
import com.finance.personalfinance.reports.api.MonthlyComparisonCategoryResponse;
import com.finance.personalfinance.transaction.api.TransactionRequest;
import com.finance.personalfinance.transaction.api.TransactionResponse;
import com.finance.personalfinance.transaction.application.TransactionService;
import com.finance.personalfinance.transaction.domain.model.Transaction;
import com.finance.personalfinance.transaction.domain.repository.TransactionRepository;
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
class MonthlyComparisonServiceIntegrationTest {

    @Autowired
    private MonthlyComparisonService comparisonService;

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Test
    void comparesExpenseCategoriesAcrossYearBoundaryAndScopesRowsToOwner() {
        User owner = createUser();
        User otherUser = createUser();
        Category food = createCategory(owner, "Ăn uống", CategoryType.EXPENSE, true);
        Category travel = createCategory(owner, "Đi lại", CategoryType.EXPENSE, true);
        Category inactive = createCategory(owner, "Danh mục cũ", CategoryType.EXPENSE, false);
        Category salary = createCategory(owner, "Lương", CategoryType.INCOME, true);
        Category otherFood = createCategory(otherUser, "Ăn uống", CategoryType.EXPENSE, true);

        createTransaction(owner, food, "100", "2025-12-15", "Ăn uống kỳ A");
        createTransaction(owner, food, "50", "2025-12-31", "Ăn uống cuối kỳ A");
        createTransaction(owner, food, "170", "2026-01-01", "Ăn uống kỳ B");
        createTransaction(owner, travel, "40", "2026-01-31", "Đi lại kỳ B");
        createInactiveCategoryTransaction(owner, inactive, "15", "2026-01-20");
        createTransaction(owner, salary, "1200", "2026-01-31", "Thu nhập không tính");
        createTransaction(owner, food, "10000", "2025-11-30", "Ngoài kỳ trước");
        createTransaction(owner, food, "10000", "2026-02-01", "Ngoài kỳ sau");
        createTransaction(otherUser, otherFood, "9999", "2025-12-05", "Giao dịch user khác");

        var report = comparisonService.compare(owner.getId(), "2025-12", "2026-01");

        assertEquals("2025-12", report.monthA());
        assertEquals("2026-01", report.monthB());
        assertMoney("150", report.totalMonthA());
        assertMoney("225", report.totalMonthB());
        assertMoney("75", report.diffAmount());
        assertMoney("50.0", report.percentChange());
        assertEquals(3, report.categoryBreakdown().size());
        assertEquals("Ăn uống", report.categoryBreakdown().get(0).categoryName());
        assertMoney("150", report.categoryBreakdown().get(0).monthAAmount());
        assertMoney("170", report.categoryBreakdown().get(0).monthBAmount());
        assertEquals("Đi lại", report.categoryBreakdown().get(1).categoryName());
        assertMoney("0", report.categoryBreakdown().get(1).monthAAmount());
        assertMoney("40", report.categoryBreakdown().get(1).monthBAmount());
        assertNull(report.categoryBreakdown().get(1).percentChange());
        assertEquals("Danh mục cũ", report.categoryBreakdown().get(2).categoryName());
        assertMoney("15", report.categoryBreakdown().get(2).monthBAmount());
        assertMoney("150", sumMonthA(report.categoryBreakdown()));
        assertMoney("225", sumMonthB(report.categoryBreakdown()));
    }

    @Test
    void returnsZerosAndNullPercentWhenThereIsNoExpenseInEitherMonth() {
        User user = createUser();

        var report = comparisonService.compare(user.getId(), "2026-02", "2026-03");

        assertMoney("0", report.totalMonthA());
        assertMoney("0", report.totalMonthB());
        assertMoney("0", report.diffAmount());
        assertNull(report.percentChange());
        assertEquals(0, report.categoryBreakdown().size());
    }

    @Test
    void ignoresIncomeWhenComparingAMonthWithNoExpense() {
        User user = createUser();
        Category salary = createCategory(user, "Lương", CategoryType.INCOME, true);
        createTransaction(user, salary, "5000", "2026-06-15", "Lương tháng 6");

        var report = comparisonService.compare(user.getId(), "2026-06", "2026-05");

        assertMoney("0", report.totalMonthA());
        assertMoney("0", report.totalMonthB());
        assertNull(report.percentChange());
        assertEquals(0, report.categoryBreakdown().size());
    }

    @Test
    void includesCategoriesPresentInOnlyOneMonthAndSupportsComparingMonthToItself() {
        User user = createUser();
        Category food = createCategory(user, "Ăn uống", CategoryType.EXPENSE, true);
        Category travel = createCategory(user, "Đi lại", CategoryType.EXPENSE, true);
        Category rent = createCategory(user, "Tiền nhà", CategoryType.EXPENSE, true);
        createTransaction(user, food, "100", "2026-04-01", "Ăn uống");
        createTransaction(user, travel, "25", "2026-04-02", "Đi lại");
        createTransaction(user, rent, "30", "2026-03-31", "Tiền nhà");

        var oneSided = comparisonService.compare(user.getId(), "2026-03", "2026-04");
        assertMoney("30", oneSided.totalMonthA());
        assertMoney("125", oneSided.totalMonthB());
        assertMoney("316.7", oneSided.percentChange());
        assertEquals(3, oneSided.categoryBreakdown().size());
        assertEquals(2, oneSided.categoryBreakdown().stream()
                .filter(row -> row.monthAAmount().signum() == 0 && row.monthBAmount().signum() > 0)
                .count());
        var disappeared = oneSided.categoryBreakdown().stream()
                .filter(row -> row.categoryName().equals("Tiền nhà"))
                .findFirst()
                .orElseThrow();
        assertMoney("30", disappeared.monthAAmount());
        assertMoney("0", disappeared.monthBAmount());

        var sameMonth = comparisonService.compare(user.getId(), "2026-04", "2026-04");
        assertMoney("125", sameMonth.totalMonthA());
        assertMoney("125", sameMonth.totalMonthB());
        assertMoney("0", sameMonth.diffAmount());
        assertMoney("0.0", sameMonth.percentChange());
        sameMonth.categoryBreakdown().forEach(row -> {
            assertMoney(row.monthAAmount().toPlainString(), row.monthBAmount());
            assertMoney("0", row.diffAmount());
        });
    }

    @Test
    void reflectsTransactionEditsAndDeletesOnTheNextReportRead() {
        User user = createUser();
        Category food = createCategory(user, "Ăn uống", CategoryType.EXPENSE, true);
        var created = createTransaction(user, food, "70", "2026-05-02", "Chi tiêu");

        assertMoney("70", comparisonService.compare(user.getId(), "2026-05", "2026-04").totalMonthA());

        TransactionRequest update = request(food, "120", "2026-05-02", "Chi tiêu đã sửa");
        transactionService.update(user.getId(), created.getId(), update);
        assertMoney("120", comparisonService.compare(user.getId(), "2026-05", "2026-04").totalMonthA());

        transactionService.delete(user.getId(), created.getId());
        var afterDelete = comparisonService.compare(user.getId(), "2026-05", "2026-04");
        assertMoney("0", afterDelete.totalMonthA());
        assertEquals(0, afterDelete.categoryBreakdown().size());
    }

    @Test
    void rejectsMissingMalformedAndImpossibleMonthValues() {
        User user = createUser();

        for (String month : new String[]{null, "2026-00", "2026-13", "26-01", "2026-2"}) {
            AppException error = assertThrows(AppException.class, () ->
                    comparisonService.compare(user.getId(), month, "2026-01")
            );
            assertEquals(HttpStatus.BAD_REQUEST, error.getStatus());
            assertEquals("INVALID_MONTH", error.getErrorCode());
        }
    }

    private User createUser() {
        return userRepository.saveAndFlush(new User(
                "Comparison Test", "comparison-" + UUID.randomUUID() + "@example.test", "not-a-real-password-hash"
        ));
    }

    private Category createCategory(User user, String name, CategoryType type, boolean active) {
        return categoryRepository.saveAndFlush(new Category(
                user.getId(), name, type, "more-horizontal", "#64748B", null, active
        ));
    }

    private TransactionResponse createTransaction(User user, Category category, String amount, String date, String title) {
        TransactionRequest request = request(category, amount, date, title);
        return transactionService.create(user.getId(), request);
    }

    private void createInactiveCategoryTransaction(User user, Category category, String amount, String date) {
        transactionRepository.saveAndFlush(new Transaction(
                user.getId(),
                category,
                CategoryType.EXPENSE,
                new BigDecimal(amount),
                "Giao dịch danh mục đã lưu trữ",
                LocalDate.parse(date),
                null
        ));
    }

    private TransactionRequest request(Category category, String amount, String date, String title) {
        TransactionRequest request = new TransactionRequest();
        request.setType(category.getType());
        request.setCategoryId(category.getId());
        request.setAmount(new BigDecimal(amount));
        request.setTransactionDate(LocalDate.parse(date));
        request.setTitle(title);
        return request;
    }

    private BigDecimal sumMonthA(Iterable<MonthlyComparisonCategoryResponse> rows) {
        BigDecimal total = BigDecimal.ZERO;
        for (MonthlyComparisonCategoryResponse row : rows) total = total.add(row.monthAAmount());
        return total;
    }

    private BigDecimal sumMonthB(Iterable<MonthlyComparisonCategoryResponse> rows) {
        BigDecimal total = BigDecimal.ZERO;
        for (MonthlyComparisonCategoryResponse row : rows) total = total.add(row.monthBAmount());
        return total;
    }

    private void assertMoney(String expected, BigDecimal actual) {
        assertEquals(0, new BigDecimal(expected).compareTo(actual));
    }
}
