package com.finance.personalfinance.dashboard.application;

import com.finance.personalfinance.category.domain.model.CategoryType;
import com.finance.personalfinance.common.exception.AppException;
import com.finance.personalfinance.dashboard.api.DashboardCategoryResponse;
import com.finance.personalfinance.dashboard.api.DashboardDailyExpenseResponse;
import com.finance.personalfinance.dashboard.api.DashboardResponse;
import com.finance.personalfinance.dashboard.domain.repository.DashboardRepository;
import com.finance.personalfinance.transaction.api.TransactionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private static final BigDecimal ZERO = BigDecimal.ZERO;
    private static final DateTimeFormatter MONTH_FORMAT = DateTimeFormatter.ofPattern("uuuu-MM");

    private final DashboardRepository dashboardRepository;

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(Long userId, String monthValue) {
        YearMonth month = parseMonth(monthValue);
        LocalDate startDate = month.atDay(1);
        LocalDate endDate = month.plusMonths(1).atDay(1);
        LocalDate previousStartDate = month.minusMonths(1).atDay(1);

        var totals = dashboardRepository.summarizeMonth(
                userId, startDate, endDate, CategoryType.INCOME, CategoryType.EXPENSE
        );
        BigDecimal income = valueOrZero(totals.getIncome());
        BigDecimal expense = valueOrZero(totals.getExpense());
        BigDecimal balance = income.subtract(expense);
        BigDecimal savingsRate = income.signum() == 0
                ? null
                : balance.multiply(BigDecimal.valueOf(100)).divide(income, 1, RoundingMode.HALF_UP);

        List<DashboardCategoryResponse> categoryBreakdown = dashboardRepository.summarizeExpensesByCategory(
                        userId, CategoryType.EXPENSE, startDate, endDate
                ).stream()
                .map(row -> new DashboardCategoryResponse(
                        row.getCategoryId(), row.getCategoryName(), row.getIconKey(), row.getColor(), row.getAmount()
                ))
                .toList();

        List<DashboardDailyExpenseResponse> dailyExpenses = createDailySeries(
                userId, month, startDate, endDate, expense
        );
        List<TransactionResponse> recentTransactions = dashboardRepository
                .findTop8ByUserIdAndTransactionDateGreaterThanEqualAndTransactionDateLessThanOrderByTransactionDateDescIdDesc(
                        userId, startDate, endDate
                ).stream()
                .map(TransactionResponse::from)
                .toList();
        BigDecimal previousMonthExpense = valueOrZero(dashboardRepository.sumByTypeAndDateRange(
                userId, CategoryType.EXPENSE, previousStartDate, startDate
        ));

        return new DashboardResponse(
                month.format(MONTH_FORMAT),
                income,
                expense,
                balance,
                savingsRate,
                totals.getTransactionCount() == null ? 0 : totals.getTransactionCount(),
                categoryBreakdown,
                dailyExpenses,
                recentTransactions,
                previousMonthExpense
        );
    }

    private List<DashboardDailyExpenseResponse> createDailySeries(
            Long userId,
            YearMonth month,
            LocalDate startDate,
            LocalDate endDate,
            BigDecimal monthlyExpense
    ) {
        if (monthlyExpense.signum() == 0) {
            return List.of();
        }

        Map<LocalDate, BigDecimal> amountByDate = new HashMap<>();
        dashboardRepository.summarizeExpensesByDay(userId, CategoryType.EXPENSE, startDate, endDate)
                .forEach(row -> amountByDate.put(row.getTransactionDate(), valueOrZero(row.getAmount())));

        List<DashboardDailyExpenseResponse> series = new ArrayList<>(month.lengthOfMonth());
        for (int day = 1; day <= month.lengthOfMonth(); day++) {
            LocalDate date = month.atDay(day);
            series.add(new DashboardDailyExpenseResponse(date, day, amountByDate.getOrDefault(date, ZERO)));
        }
        return List.copyOf(series);
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
