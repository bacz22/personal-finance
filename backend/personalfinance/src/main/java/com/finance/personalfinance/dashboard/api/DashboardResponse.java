package com.finance.personalfinance.dashboard.api;

import com.finance.personalfinance.transaction.api.TransactionResponse;

import java.math.BigDecimal;
import java.util.List;

public record DashboardResponse(
        String month,
        BigDecimal income,
        BigDecimal expense,
        BigDecimal balance,
        BigDecimal savingsRate,
        long transactionCount,
        List<DashboardCategoryResponse> categoryBreakdown,
        List<DashboardDailyExpenseResponse> dailyExpenses,
        List<TransactionResponse> recentTransactions,
        BigDecimal previousMonthExpense
) {
}
