package com.finance.personalfinance.budget.application;

import com.finance.personalfinance.budget.api.BudgetRequest;
import com.finance.personalfinance.budget.api.BudgetResponse;
import com.finance.personalfinance.budget.domain.model.Budget;
import com.finance.personalfinance.budget.domain.repository.BudgetRepository;
import com.finance.personalfinance.category.domain.model.Category;
import com.finance.personalfinance.category.domain.model.CategoryType;
import com.finance.personalfinance.category.domain.repository.CategoryRepository;
import com.finance.personalfinance.common.exception.AppException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private static final BigDecimal ZERO = BigDecimal.ZERO;
    private static final DateTimeFormatter MONTH_FORMAT = DateTimeFormatter.ofPattern("uuuu-MM");

    private final BudgetRepository budgetRepository;
    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<BudgetResponse> findAll(Long userId, String monthValue) {
        YearMonth month = parseMonth(monthValue);
        List<Budget> budgets = budgetRepository.findAllByUserIdAndMonthOrderByCategory_NameAsc(userId, month.atDay(1));
        Map<Long, BigDecimal> spentByCategory = spentByCategory(userId, month);
        return budgets.stream()
                .map(budget -> toResponse(budget, spentByCategory.getOrDefault(budget.getCategory().getId(), ZERO)))
                .toList();
    }

    @Transactional
    public BudgetResponse create(Long userId, BudgetRequest request) {
        YearMonth month = parseMonth(request.getMonth());
        Category category = findOwnedCategory(userId, request.getCategoryId());
        validateExpenseCategory(category, true);
        ensureUnique(userId, month, category.getId(), null);

        Budget budget = new Budget(userId, category, month.atDay(1), request.getLimitAmount());
        Budget saved = budgetRepository.saveAndFlush(budget);
        return toResponse(saved, spentForCategory(userId, category.getId(), month));
    }

    @Transactional
    public BudgetResponse update(Long userId, Long budgetId, BudgetRequest request) {
        Budget budget = findOwnedBudget(userId, budgetId);
        YearMonth month = parseMonth(request.getMonth());
        Category category = findOwnedCategory(userId, request.getCategoryId());
        boolean keepingExistingCategory = category.getId().equals(budget.getCategory().getId());
        validateExpenseCategory(category, !keepingExistingCategory);
        ensureUnique(userId, month, category.getId(), budgetId);

        budget.update(category, month.atDay(1), request.getLimitAmount());
        Budget saved = budgetRepository.saveAndFlush(budget);
        return toResponse(saved, spentForCategory(userId, category.getId(), month));
    }

    @Transactional
    public void delete(Long userId, Long budgetId) {
        budgetRepository.delete(findOwnedBudget(userId, budgetId));
    }

    private Map<Long, BigDecimal> spentByCategory(Long userId, YearMonth month) {
        Map<Long, BigDecimal> amounts = new HashMap<>();
        budgetRepository.summarizeSpentByCategory(
                        userId,
                        CategoryType.EXPENSE,
                        month.atDay(1),
                        month.plusMonths(1).atDay(1)
                ).forEach(row -> amounts.put(row.getCategoryId(), valueOrZero(row.getSpent())));
        return amounts;
    }

    private BigDecimal spentForCategory(Long userId, Long categoryId, YearMonth month) {
        return budgetRepository.summarizeSpentByCategory(
                        userId,
                        CategoryType.EXPENSE,
                        month.atDay(1),
                        month.plusMonths(1).atDay(1)
                ).stream()
                .filter(row -> row.getCategoryId().equals(categoryId))
                .map(row -> valueOrZero(row.getSpent()))
                .findFirst()
                .orElse(ZERO);
    }

    private BudgetResponse toResponse(Budget budget, BigDecimal spent) {
        Category category = budget.getCategory();
        return new BudgetResponse(
                budget.getId(),
                YearMonth.from(budget.getMonth()).format(MONTH_FORMAT),
                category.getId(),
                category.getName(),
                category.getIconKey(),
                category.getColor(),
                budget.getLimitAmount(),
                spent
        );
    }

    private void ensureUnique(Long userId, YearMonth month, Long categoryId, Long currentBudgetId) {
        boolean exists = currentBudgetId == null
                ? budgetRepository.existsByUserIdAndMonthAndCategory_Id(userId, month.atDay(1), categoryId)
                : budgetRepository.existsByUserIdAndMonthAndCategory_IdAndIdNot(
                        userId, month.atDay(1), categoryId, currentBudgetId
                );
        if (exists) {
            throw new AppException(
                    HttpStatus.CONFLICT,
                    "BUDGET_ALREADY_EXISTS",
                    "Danh mục này đã có ngân sách trong tháng được chọn. Hãy mở ngân sách hiện có để chỉnh sửa."
            );
        }
    }

    private void validateExpenseCategory(Category category, boolean requireActive) {
        if (requireActive && !category.isActive()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "CATEGORY_INACTIVE", "Danh mục đã bị vô hiệu hóa.");
        }
        if (category.getType() != CategoryType.EXPENSE) {
            throw new AppException(HttpStatus.BAD_REQUEST, "CATEGORY_TYPE_MISMATCH",
                    "Ngân sách chỉ áp dụng cho danh mục chi tiêu.");
        }
    }

    private Category findOwnedCategory(Long userId, Long categoryId) {
        return categoryRepository.findByIdAndUserId(categoryId, userId)
                .orElseThrow(() -> new AppException(
                        HttpStatus.NOT_FOUND, "CATEGORY_NOT_FOUND", "Không tìm thấy danh mục."
                ));
    }

    private Budget findOwnedBudget(Long userId, Long budgetId) {
        return budgetRepository.findByIdAndUserId(budgetId, userId)
                .orElseThrow(() -> new AppException(
                        HttpStatus.NOT_FOUND, "BUDGET_NOT_FOUND", "Không tìm thấy ngân sách."
                ));
    }

    private YearMonth parseMonth(String monthValue) {
        if (monthValue == null || !monthValue.matches("\\d{4}-(0[1-9]|1[0-2])")) {
            throw invalidMonth();
        }
        try {
            YearMonth month = YearMonth.parse(monthValue, MONTH_FORMAT);
            if (month.getYear() < 1) throw invalidMonth();
            return month;
        } catch (DateTimeParseException exception) {
            throw invalidMonth();
        }
    }

    private BigDecimal valueOrZero(BigDecimal value) {
        return value == null ? ZERO : value;
    }

    private AppException invalidMonth() {
        return new AppException(HttpStatus.BAD_REQUEST, "INVALID_MONTH", "Tháng phải có định dạng YYYY-MM hợp lệ.");
    }
}
