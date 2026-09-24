package com.finance.personalfinance.reports.application;

import com.finance.personalfinance.category.domain.model.CategoryType;
import com.finance.personalfinance.common.exception.AppException;
import com.finance.personalfinance.reports.api.MonthlyComparisonCategoryResponse;
import com.finance.personalfinance.reports.api.MonthlyComparisonResponse;
import com.finance.personalfinance.reports.domain.repository.MonthlyComparisonCategoryProjection;
import com.finance.personalfinance.reports.domain.repository.MonthlyComparisonRepository;
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
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MonthlyComparisonService {

    private static final BigDecimal ZERO = BigDecimal.ZERO;
    private static final DateTimeFormatter MONTH_FORMAT = DateTimeFormatter.ofPattern("uuuu-MM");

    private final MonthlyComparisonRepository comparisonRepository;

    @Transactional(readOnly = true)
    public MonthlyComparisonResponse compare(Long userId, String monthAValue, String monthBValue) {
        YearMonth monthA = parseMonth(monthAValue);
        YearMonth monthB = parseMonth(monthBValue);
        LocalDate monthAStart = monthA.atDay(1);
        LocalDate monthBStart = monthB.atDay(1);

        List<MonthlyComparisonCategoryResponse> categories = comparisonRepository.summarizeExpensesByCategory(
                        userId,
                        CategoryType.EXPENSE,
                        monthAStart,
                        monthA.plusMonths(1).atDay(1),
                        monthBStart,
                        monthB.plusMonths(1).atDay(1)
                ).stream()
                .map(this::toResponse)
                .sorted(Comparator
                        .comparing((MonthlyComparisonCategoryResponse row) ->
                                row.monthAAmount().max(row.monthBAmount()))
                        .reversed()
                        .thenComparing(MonthlyComparisonCategoryResponse::categoryName,
                                String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(MonthlyComparisonCategoryResponse::categoryId))
                .toList();

        BigDecimal totalMonthA = categories.stream()
                .map(MonthlyComparisonCategoryResponse::monthAAmount)
                .reduce(ZERO, BigDecimal::add);
        BigDecimal totalMonthB = categories.stream()
                .map(MonthlyComparisonCategoryResponse::monthBAmount)
                .reduce(ZERO, BigDecimal::add);
        BigDecimal diffAmount = totalMonthB.subtract(totalMonthA);

        return new MonthlyComparisonResponse(
                monthA.format(MONTH_FORMAT),
                monthB.format(MONTH_FORMAT),
                totalMonthA,
                totalMonthB,
                diffAmount,
                calculatePercentChange(totalMonthA, totalMonthB),
                categories
        );
    }

    private MonthlyComparisonCategoryResponse toResponse(MonthlyComparisonCategoryProjection row) {
        BigDecimal monthAAmount = valueOrZero(row.getMonthAAmount());
        BigDecimal monthBAmount = valueOrZero(row.getMonthBAmount());
        return new MonthlyComparisonCategoryResponse(
                row.getCategoryId(),
                row.getCategoryName(),
                row.getCategoryIconKey(),
                row.getCategoryColor(),
                monthAAmount,
                monthBAmount,
                monthBAmount.subtract(monthAAmount),
                calculatePercentChange(monthAAmount, monthBAmount)
        );
    }

    private BigDecimal calculatePercentChange(BigDecimal baseline, BigDecimal comparison) {
        if (baseline.signum() == 0) return null;
        return comparison.subtract(baseline)
                .multiply(BigDecimal.valueOf(100))
                .divide(baseline, 1, RoundingMode.HALF_UP);
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
